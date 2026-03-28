/**
 * USDA FoodData Central Seed Script
 *
 * Fetches Foundation and SR Legacy foods from the FDC API and populates the
 * `foods` and `nutrients` tables. Idempotent — safe to re-run.
 *
 * Required env vars:
 *   DATABASE_URL   - Postgres connection string
 *   FDC_API_KEY    - USDA FoodData Central API key (https://fdc.nal.usda.gov/api-key-signup)
 *
 * Run:
 *   pnpm tsx scripts/seed-usda.ts
 */

import { db } from '../src/lib/db/index'
import { foods, nutrients } from '../src/lib/db/schema'
import { sql, inArray } from 'drizzle-orm'

// ─── Configuration ────────────────────────────────────────────────────────────

const FDC_API_KEY = process.env.FDC_API_KEY ?? 'DEMO_KEY'
const FDC_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'
const PAGE_SIZE = 200
/** 4 s between pages ≈ 900 requests/hour, safely under the 1,000/hr limit */
const REQUEST_DELAY_MS = 4_000
const NUTRIENT_BATCH_SIZE = 150

const DATA_TYPES = ['Foundation', 'SR Legacy'] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface FdcNutrient {
  number: number
  name: string
  amount: number
  unitName: string
}

interface FdcFood {
  fdcId: number
  description: string
  dataType: string
  foodCategory?: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients: FdcNutrient[]
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mapDataType(fdcDataType: string): 'foundation' | 'survey' | 'branded' | 'sr_legacy' {
  switch (fdcDataType) {
    case 'Foundation': return 'foundation'
    case 'Survey (FNDDS)': return 'survey'
    case 'Branded': return 'branded'
    case 'SR Legacy':
    default: return 'sr_legacy'
  }
}

function classifyNutrient(
  name: string,
): 'macronutrient' | 'vitamin' | 'mineral' | 'fatty_acid' | 'amino_acid' | 'other' {
  const l = name.toLowerCase()

  // Fatty acids — check before macros to avoid "total fat" matching amino patterns
  if (
    l.includes('fatty acid') ||
    l.includes('saturated') ||
    l.includes('monounsaturated') ||
    l.includes('polyunsaturated') ||
    /\d+:\d+/.test(l) // e.g. "18:2" lipid notation
  ) {
    return 'fatty_acid'
  }

  // Amino acids
  const aminoAcids = [
    'tryptophan', 'threonine', 'isoleucine', 'leucine', 'lysine',
    'methionine', 'cystine', 'cysteine', 'phenylalanine', 'tyrosine',
    'valine', 'arginine', 'histidine', 'alanine', 'aspartic acid',
    'glutamic acid', 'glycine', 'proline', 'serine', 'hydroxyproline',
    'asparagine', 'glutamine',
  ]
  if (aminoAcids.some((aa) => l.includes(aa))) return 'amino_acid'

  // Vitamins
  const vitaminKeywords = [
    'vitamin', 'thiamin', 'riboflavin', 'niacin', 'pantothenic',
    'folate', 'folic', 'biotin', 'choline', 'carotene', 'retinol',
    'tocopherol', 'tocotrienol', 'phylloquinone', 'menaquinone',
    'ergocalciferol', 'cholecalciferol', 'betaine',
  ]
  if (vitaminKeywords.some((v) => l.includes(v))) return 'vitamin'

  // Minerals
  const mineralKeywords = [
    'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium',
    'sodium', 'zinc', 'copper', 'manganese', 'selenium', 'fluoride',
    'chromium', 'molybdenum', 'iodine', 'chlorine', 'sulfur',
    'boron', 'cobalt', 'nickel',
  ]
  if (mineralKeywords.some((m) => l.includes(m))) return 'mineral'

  // Macronutrients
  const macroKeywords = [
    'protein', 'carbohydrate', 'fiber', 'sugars', 'energy', 'water',
    'lipid', 'fat', 'ash', 'starch', 'alcohol', 'caffeine',
    'theobromine', 'cholesterol', 'lactose', 'fructose', 'glucose',
    'sucrose', 'maltose', 'galactose',
  ]
  if (macroKeywords.some((m) => l.includes(m))) return 'macronutrient'

  return 'other'
}

function getServingSizeG(food: FdcFood): string | null {
  if (
    food.servingSize != null &&
    food.servingSizeUnit?.toLowerCase() === 'g'
  ) {
    return food.servingSize.toString()
  }
  return null
}

// ─── API fetching ─────────────────────────────────────────────────────────────

async function fetchPage(dataType: string, pageNumber: number): Promise<FdcFood[]> {
  const url = new URL(`${FDC_BASE_URL}/foods/list`)
  url.searchParams.set('api_key', FDC_API_KEY)
  url.searchParams.set('dataType', dataType)
  url.searchParams.set('pageSize', PAGE_SIZE.toString())
  url.searchParams.set('pageNumber', pageNumber.toString())

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`FDC API error ${res.status}: ${res.statusText} (page ${pageNumber})`)
  }

  const data: unknown = await res.json()
  return Array.isArray(data) ? (data as FdcFood[]) : []
}

// ─── Database processing ──────────────────────────────────────────────────────

async function processPage(pageFoods: FdcFood[]): Promise<void> {
  if (pageFoods.length === 0) return

  // 1. Batch upsert all foods in the page
  const insertedFoods = await db
    .insert(foods)
    .values(
      pageFoods.map((f) => ({
        fdcId: f.fdcId,
        name: f.description,
        foodGroup: f.foodCategory ?? null,
        dataSource: mapDataType(f.dataType),
        servingSizeG: getServingSizeG(f),
        servingUnit: f.servingSizeUnit ?? null,
        description: null as string | null,
      })),
    )
    .onConflictDoUpdate({
      target: foods.fdcId,
      set: {
        name: sql`excluded.name`,
        foodGroup: sql`excluded.food_group`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: foods.id, fdcId: foods.fdcId })

  // 2. Build fdcId → uuid map
  const fdcToId = new Map(insertedFoods.map((f) => [f.fdcId, f.id]))
  const foodIds = insertedFoods.map((f) => f.id)

  // 3. Delete any existing nutrients for idempotency
  if (foodIds.length > 0) {
    await db.delete(nutrients).where(inArray(nutrients.foodId, foodIds))
  }

  // 4. Build all nutrient rows for this page
  const allNutrientRows: (typeof nutrients.$inferInsert)[] = []

  for (const food of pageFoods) {
    const foodId = fdcToId.get(food.fdcId)
    if (foodId == null) continue

    for (const n of food.foodNutrients) {
      if (n.amount == null || isNaN(n.amount)) continue
      allNutrientRows.push({
        foodId,
        nutrientName: n.name,
        nutrientCategory: classifyNutrient(n.name),
        amount: n.amount.toString(),
        unit: n.unitName,
        per100g: n.amount.toString(), // FDC values are already per 100 g
      })
    }
  }

  // 5. Batch insert nutrients
  for (let i = 0; i < allNutrientRows.length; i += NUTRIENT_BATCH_SIZE) {
    const batch = allNutrientRows.slice(i, i + NUTRIENT_BATCH_SIZE)
    if (batch.length > 0) {
      await db.insert(nutrients).values(batch)
    }
  }
}

// ─── Per-data-type seeding ────────────────────────────────────────────────────

async function seedDataType(dataType: string): Promise<number> {
  let page = 1
  let totalProcessed = 0
  let errorCount = 0

  console.log(`\n[${dataType}] Starting fetch...`)

  while (true) {
    process.stdout.write(`  Page ${page}... `)

    let pageFoods: FdcFood[]
    try {
      pageFoods = await fetchPage(dataType, page)
    } catch (err) {
      errorCount++
      console.error(`\n  ERROR on page ${page}:`, err)
      break
    }

    if (pageFoods.length === 0) {
      console.log('done (empty page)')
      break
    }

    try {
      await processPage(pageFoods)
      totalProcessed += pageFoods.length
      console.log(`${pageFoods.length} foods (${totalProcessed} total, ${errorCount} errors)`)
    } catch (err) {
      errorCount++
      console.error(`\n  ERROR processing page ${page}:`, err)
    }

    if (pageFoods.length < PAGE_SIZE) {
      console.log(`[${dataType}] Last page reached.`)
      break
    }

    page++
    await delay(REQUEST_DELAY_MS)
  }

  console.log(`[${dataType}] Done: ${totalProcessed} foods, ${errorCount} errors`)
  return totalProcessed
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set.')
    process.exit(1)
  }

  console.log('USDA FoodData Central Seed Script')
  console.log('==================================')
  console.log(`API Key : ${FDC_API_KEY === 'DEMO_KEY' ? 'DEMO_KEY (rate-limited to 30 req/hr)' : '[set]'}`)
  console.log(`Page size: ${PAGE_SIZE}`)
  console.log(`Request delay: ${REQUEST_DELAY_MS}ms`)

  let totalFoods = 0

  for (let i = 0; i < DATA_TYPES.length; i++) {
    if (i > 0) await delay(REQUEST_DELAY_MS)
    totalFoods += await seedDataType(DATA_TYPES[i])
  }

  console.log(`\nTotal foods processed: ${totalFoods}`)
  console.log('Refreshing food_computed materialized view...')

  await db.execute(sql`REFRESH MATERIALIZED VIEW food_computed`)

  console.log('Done!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
