/**
 * BLS Price Seed Script
 *
 * Fetches average retail food prices from the BLS API v2 and inserts them
 * into the `price_data` and `bls_food_crosswalk` tables.  Also inserts
 * USDA-category-level fallback estimates for food groups not covered by
 * item-level BLS data.  Idempotent — safe to re-run.
 *
 * Steps:
 *   1. Read bls-crosswalk.ts, look up each food by search term in `foods`.
 *   2. Batch fetch latest prices from BLS API v2 (≤50 series/request).
 *   3. Convert BLS price to price_per_100g via unitConversionFactor.
 *   4. Upsert into `bls_food_crosswalk`; delete-then-insert into `price_data`.
 *   5. Insert USDA category-level fallback prices (source = 'usda_estimate').
 *   6. Refresh the `food_computed` materialized view.
 *
 * Required env var:
 *   DATABASE_URL  — Postgres connection string
 *
 * Optional env var:
 *   BLS_API_KEY   — BLS registration key (increases quota from 25 to 500 req/day)
 *
 * Run:
 *   pnpm tsx scripts/seed-prices.ts
 */

import { db } from '../src/lib/db/index'
import { foods, priceData, blsFoodCrosswalk } from '../src/lib/db/schema'
import { sql, eq, ilike, inArray } from 'drizzle-orm'
import { CROSSWALK, type CrosswalkEntry } from './bls-crosswalk'

// ─── Configuration ────────────────────────────────────────────────────────────

const BLS_API_KEY = process.env.BLS_API_KEY ?? ''
const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'
/** BLS allows up to 50 series IDs per POST request */
const BLS_BATCH_SIZE = 50
/** How many years back to request (we only use the latest period) */
const BLS_YEARS_BACK = 2

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlsDataPoint {
  year: string
  period: string
  periodName: string
  value: string
}

interface BlsSeries {
  seriesID: string
  data: BlsDataPoint[]
}

interface BlsResponse {
  status: string
  message: string[]
  Results?: {
    series: BlsSeries[]
  }
}

interface ResolvedEntry {
  crosswalk: CrosswalkEntry
  foodId: string
}

// ─── BLS API ──────────────────────────────────────────────────────────────────

async function fetchBlsPrices(
  seriesIds: string[],
  startYear: string,
  endYear: string,
): Promise<Map<string, BlsDataPoint>> {
  const body: Record<string, unknown> = {
    seriesid: seriesIds,
    startyear: startYear,
    endyear: endYear,
  }
  if (BLS_API_KEY) body.registrationkey = BLS_API_KEY

  const res = await fetch(BLS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`BLS API HTTP error ${res.status}: ${res.statusText}`)
  }

  const json = (await res.json()) as BlsResponse

  if (json.status !== 'REQUEST_SUCCEEDED') {
    const messages = json.message?.join('; ') ?? '(no message)'
    throw new Error(`BLS API returned status "${json.status}": ${messages}`)
  }

  // For each series, pick the most recent non-annual data point
  const latest = new Map<string, BlsDataPoint>()

  for (const series of json.Results?.series ?? []) {
    // Filter out M13 (annual average) and sort descending by year then period
    const points = (series.data ?? [])
      .filter((d) => d.period !== 'M13' && d.value !== '-')
      .sort((a, b) => {
        const yearDiff = parseInt(b.year, 10) - parseInt(a.year, 10)
        if (yearDiff !== 0) return yearDiff
        return parseInt(b.period.slice(1), 10) - parseInt(a.period.slice(1), 10)
      })

    if (points.length > 0) {
      latest.set(series.seriesID, points[0])
    }
  }

  return latest
}

// ─── Food lookup ──────────────────────────────────────────────────────────────

async function resolveCrosswalk(): Promise<ResolvedEntry[]> {
  const resolved: ResolvedEntry[] = []
  let skipped = 0

  for (const entry of CROSSWALK) {
    const rows = await db
      .select({ id: foods.id, name: foods.name })
      .from(foods)
      .where(ilike(foods.name, `%${entry.usdaSearchTerm}%`))
      .limit(1)

    if (rows.length === 0) {
      console.log(`  SKIP (no match): "${entry.usdaSearchTerm}"`)
      skipped++
      continue
    }

    resolved.push({ crosswalk: entry, foodId: rows[0].id })
  }

  console.log(`  Resolved ${resolved.length} / ${CROSSWALK.length} entries (${skipped} skipped — food not in DB)`)
  return resolved
}

// ─── Step 1: BLS item-level prices ───────────────────────────────────────────

async function seedBlsPrices(resolved: ResolvedEntry[]): Promise<void> {
  if (resolved.length === 0) {
    console.log('  No resolved entries; skipping BLS fetch.')
    return
  }

  const endYear = new Date().getFullYear().toString()
  const startYear = (parseInt(endYear, 10) - BLS_YEARS_BACK).toString()

  const seriesIds = resolved.map((r) => r.crosswalk.blsSeriesId)

  console.log(`  Fetching prices for ${seriesIds.length} series (${startYear}–${endYear})...`)

  // Map seriesId → resolved entry for quick lookup
  const entryBySeries = new Map<string, ResolvedEntry>(
    resolved.map((r) => [r.crosswalk.blsSeriesId, r]),
  )

  let inserted = 0
  let noData = 0

  // Batch into chunks of BLS_BATCH_SIZE
  for (let i = 0; i < seriesIds.length; i += BLS_BATCH_SIZE) {
    const batch = seriesIds.slice(i, i + BLS_BATCH_SIZE)

    let latestBySeriesId: Map<string, BlsDataPoint>
    try {
      latestBySeriesId = await fetchBlsPrices(batch, startYear, endYear)
    } catch (err) {
      console.error(`  ERROR fetching BLS batch [${i}–${i + batch.length}]:`, err)
      continue
    }

    for (const seriesId of batch) {
      const dataPoint = latestBySeriesId.get(seriesId)
      const entry = entryBySeries.get(seriesId)!

      if (dataPoint == null) {
        noData++
        console.log(`  NO DATA: ${seriesId} (${entry.crosswalk.blsItemName})`)
        continue
      }

      const pricePerUnit = parseFloat(dataPoint.value)
      if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
        noData++
        continue
      }

      const pricePer100g = pricePerUnit * entry.crosswalk.unitConversionFactor
      const period = `${dataPoint.year}-${dataPoint.period}` // e.g. "2025-M02"

      // Upsert bls_food_crosswalk (unique on bls_series_id)
      await db
        .insert(blsFoodCrosswalk)
        .values({
          blsSeriesId: seriesId,
          blsItemName: entry.crosswalk.blsItemName,
          foodId: entry.foodId,
          unitConversionFactor: entry.crosswalk.unitConversionFactor.toString(),
          notes: entry.crosswalk.notes ?? null,
        })
        .onConflictDoUpdate({
          target: blsFoodCrosswalk.blsSeriesId,
          set: {
            blsItemName: sql`excluded.bls_item_name`,
            foodId: sql`excluded.food_id`,
            unitConversionFactor: sql`excluded.unit_conversion_factor`,
            notes: sql`excluded.notes`,
          },
        })

      // Delete existing BLS price row for this series, then insert fresh
      await db
        .delete(priceData)
        .where(eq(priceData.blsSeriesId, seriesId))

      await db.insert(priceData).values({
        foodId: entry.foodId,
        blsSeriesId: seriesId,
        pricePerUnit: pricePerUnit.toString(),
        unit: entry.crosswalk.blsUnit,
        pricePer100g: pricePer100g.toFixed(6),
        source: 'bls',
        period,
        region: 'U.S. city average',
      })

      inserted++
    }

    // Brief pause between batches to be polite to the BLS API
    if (i + BLS_BATCH_SIZE < seriesIds.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(`  Inserted ${inserted} BLS price rows (${noData} had no data)`)
}

// ─── Step 2: USDA category fallback prices ───────────────────────────────────

/**
 * Rough price_per_100g estimates by USDA food group.
 * Used as fallback for foods without an item-level BLS price.
 * Values are USD per 100 g, based on typical US retail prices.
 */
const CATEGORY_FALLBACKS: Array<{ foodGroup: string; pricePer100g: number }> = [
  { foodGroup: 'Beef Products',                     pricePer100g: 0.88 },
  { foodGroup: 'Pork Products',                     pricePer100g: 0.66 },
  { foodGroup: 'Poultry Products',                  pricePer100g: 0.44 },
  { foodGroup: 'Lamb, Veal, and Game Products',     pricePer100g: 1.10 },
  { foodGroup: 'Finfish and Shellfish Products',    pricePer100g: 1.10 },
  { foodGroup: 'Sausages and Luncheon Meats',       pricePer100g: 0.55 },
  { foodGroup: 'Dairy and Egg Products',            pricePer100g: 0.28 },
  { foodGroup: 'Cereal Grains and Pasta',           pricePer100g: 0.11 },
  { foodGroup: 'Baked Products',                    pricePer100g: 0.33 },
  { foodGroup: 'Vegetables and Vegetable Products', pricePer100g: 0.15 },
  { foodGroup: 'Fruits and Fruit Juices',           pricePer100g: 0.22 },
  { foodGroup: 'Legumes and Legume Products',       pricePer100g: 0.18 },
  { foodGroup: 'Nut and Seed Products',             pricePer100g: 0.66 },
  { foodGroup: 'Fats and Oils',                     pricePer100g: 0.77 },
  { foodGroup: 'Sweets',                            pricePer100g: 0.55 },
  { foodGroup: 'Beverages',                         pricePer100g: 0.06 },
  { foodGroup: 'Spices and Herbs',                  pricePer100g: 1.65 },
  { foodGroup: 'Soups, Sauces, and Gravies',        pricePer100g: 0.22 },
  { foodGroup: 'Snacks',                            pricePer100g: 0.55 },
  { foodGroup: 'Baby Foods',                        pricePer100g: 0.33 },
  { foodGroup: 'Fast Foods',                        pricePer100g: 0.44 },
  { foodGroup: 'Meals, Entrees, and Side Dishes',   pricePer100g: 0.44 },
  { foodGroup: 'Restaurant Foods',                  pricePer100g: 0.55 },
  { foodGroup: 'American Indian/Alaska Native Foods', pricePer100g: 0.33 },
  { foodGroup: 'Ethnic Foods',                      pricePer100g: 0.33 },
]

async function seedCategoryFallbacks(): Promise<void> {
  let inserted = 0

  for (const cat of CATEGORY_FALLBACKS) {
    // Delete existing estimate for this food group, then insert fresh
    await db
      .delete(priceData)
      .where(
        sql`${priceData.source} = 'usda_estimate' AND ${priceData.foodGroup} = ${cat.foodGroup}`,
      )

    await db.insert(priceData).values({
      foodId: null,
      foodGroup: cat.foodGroup,
      blsSeriesId: null,
      pricePerUnit: cat.pricePer100g.toString(),
      unit: 'per 100g',
      pricePer100g: cat.pricePer100g.toString(),
      source: 'usda_estimate',
      period: null,
      region: 'U.S. national estimate',
    })

    inserted++
  }

  console.log(`  Inserted ${inserted} USDA category fallback rows`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set.')
    process.exit(1)
  }

  console.log('BLS Price Seed Script')
  console.log('=====================')
  console.log(`BLS API key: ${BLS_API_KEY ? '[set]' : '(not set — limited to 25 requests/day)'}`)
  console.log(`Crosswalk entries: ${CROSSWALK.length}`)
  console.log(`Category fallbacks: ${CATEGORY_FALLBACKS.length}`)

  // ── Step 1: Resolve crosswalk → food UUIDs ──────────────────────────────
  console.log('\n[Step 1] Resolving crosswalk entries against foods table...')
  const resolved = await resolveCrosswalk()

  // ── Step 2: Fetch and insert BLS item-level prices ──────────────────────
  console.log('\n[Step 2] Fetching BLS average retail prices...')
  await seedBlsPrices(resolved)

  // ── Step 3: Insert USDA category fallbacks ──────────────────────────────
  console.log('\n[Step 3] Inserting USDA category fallback prices...')
  await seedCategoryFallbacks()

  // ── Step 4: Refresh materialized view ───────────────────────────────────
  console.log('\n[Step 4] Refreshing food_computed materialized view...')
  await db.execute(sql`REFRESH MATERIALIZED VIEW food_computed`)

  console.log('\nDone!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
