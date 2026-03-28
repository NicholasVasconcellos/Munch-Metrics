/**
 * Tag Derivation Seed Script
 *
 * Derives dietary, allergen, and processing-level tags from food_group and
 * nutrient data and populates the `food_tags` table. Idempotent — clears all
 * derived tags and reinserts on every run.
 *
 * Tag types produced:
 *   dietary        — vegan, vegetarian, pescatarian, keto, high_protein,
 *                    low_sodium, gluten_free, dairy_free
 *   allergen       — contains_dairy, contains_gluten, contains_nuts,
 *                    contains_soy, contains_eggs, contains_fish,
 *                    contains_shellfish
 *   processing_level — whole_food, minimally_processed, processed
 *
 * Required env var:
 *   DATABASE_URL — Postgres connection string
 *
 * Run:
 *   pnpm tsx scripts/seed-tags.ts
 */

import { db } from '../src/lib/db/index'
import { foods, nutrients, foodTags } from '../src/lib/db/schema'
import { sql, inArray } from 'drizzle-orm'

// ─── Food group keyword sets ──────────────────────────────────────────────────

/** Groups that contain meat (beef, pork, poultry, lamb, game …) */
const MEAT_GROUP_KEYWORDS = [
  'beef', 'pork', 'poultry', 'lamb', 'veal', 'game', 'mutton',
  'sausages and luncheon',
]

/** Groups that contain fish or shellfish */
const FISH_GROUP_KEYWORDS = ['finfish', 'shellfish', 'seafood', 'crustacean']

/** Sub-keywords to distinguish shellfish vs finfish within a combined group */
const SHELLFISH_KEYWORDS_IN_NAME = [
  'shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop', 'mussel',
  'squid', 'octopus', 'crayfish', 'prawn',
]

/** Groups that contain dairy */
const DAIRY_GROUP_KEYWORDS = ['dairy']

/** Groups that contain eggs (note "Dairy and Egg Products" also matches dairy) */
const EGG_GROUP_KEYWORDS = ['egg']

/** Groups associated with gluten-containing grains */
const GLUTEN_GROUP_KEYWORDS = [
  'cereal grains', 'baked products', 'breakfast cereals', 'grain products',
  'pasta',
]

/** Groups associated with nuts or seeds */
const NUT_GROUP_KEYWORDS = ['nut and seed']

/** Groups associated with soy / legumes */
const LEGUME_GROUP_KEYWORDS = ['legumes and legume']

// ─── Description keyword sets ─────────────────────────────────────────────────

const SOY_DESCRIPTION_KEYWORDS = [
  'soy', 'tofu', 'tempeh', 'miso', 'edamame', 'natto',
]

const NUT_DESCRIPTION_KEYWORDS = [
  'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut',
  'macadamia', 'brazil nut', 'pine nut', 'chestnut',
]

// ─── Processing-level keyword sets ───────────────────────────────────────────

const WHOLE_FOOD_GROUPS = [
  'fruits and fruit juices',
  'vegetables and vegetable products',
  'legumes and legume products',
  'nut and seed products',
  'finfish and shellfish products',
  'beef products',
  'pork products',
  'poultry products',
  'lamb, veal, and game products',
  'dairy and egg products',
  'egg products',
  'spices and herbs',
]

const PROCESSED_GROUPS = [
  'baked products',
  'breakfast cereals',
  'snacks',
  'fast foods',
  'sweets',
  'soups, sauces, and gravies',
]

const PROCESSED_DESCRIPTION_KEYWORDS = [
  'canned', 'frozen dinner', 'instant', 'processed', 'imitation',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface FoodRow {
  id: string
  name: string
  foodGroup: string | null
  foodSubgroup: string | null
  description: string | null
}

interface NutrientProfile {
  protein: number    // g per 100g
  carbs: number      // g per 100g
  fat: number        // g per 100g
  sodium: number     // mg per 100g
}

type TagEntry = {
  foodId: string
  tagType: 'dietary' | 'allergen' | 'processing_level'
  tagValue: string
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function groupContains(foodGroup: string | null, keywords: string[]): boolean {
  if (!foodGroup) return false
  const lower = foodGroup.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

function textContains(text: string | null, keywords: string[]): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

// ─── Tag derivation ───────────────────────────────────────────────────────────

function deriveTags(food: FoodRow, nutrient: NutrientProfile): TagEntry[] {
  const tags: TagEntry[] = []
  const { id: foodId, foodGroup, foodSubgroup, name, description } = food
  const { protein, carbs, fat, sodium } = nutrient

  const combinedText = [name, description, foodSubgroup].join(' ')

  const isMeat = groupContains(foodGroup, MEAT_GROUP_KEYWORDS)
  const isFish = groupContains(foodGroup, FISH_GROUP_KEYWORDS)
  const isShellfish =
    groupContains(foodGroup, ['shellfish']) ||
    (isFish && textContains(combinedText, SHELLFISH_KEYWORDS_IN_NAME))
  const isDairy = groupContains(foodGroup, DAIRY_GROUP_KEYWORDS)
  const isEgg =
    groupContains(foodGroup, EGG_GROUP_KEYWORDS) &&
    !groupContains(foodGroup, DAIRY_GROUP_KEYWORDS) // avoid double-flagging "Dairy and Egg"
  const isEggOrDairy = groupContains(foodGroup, EGG_GROUP_KEYWORDS) // covers combined group

  // ── Dietary ────────────────────────────────────────────────────────────────

  const isVegan = !isMeat && !isFish && !isDairy && !isEggOrDairy
  if (isVegan) tags.push({ foodId, tagType: 'dietary', tagValue: 'vegan' })

  const isVegetarian = !isMeat && !isFish
  if (isVegetarian)
    tags.push({ foodId, tagType: 'dietary', tagValue: 'vegetarian' })

  const isPescatarian = !isMeat
  if (isPescatarian)
    tags.push({ foodId, tagType: 'dietary', tagValue: 'pescatarian' })

  if (carbs < 10 && fat > 10)
    tags.push({ foodId, tagType: 'dietary', tagValue: 'keto' })

  if (protein > 20)
    tags.push({ foodId, tagType: 'dietary', tagValue: 'high_protein' })

  if (sodium < 140)
    tags.push({ foodId, tagType: 'dietary', tagValue: 'low_sodium' })

  const isGlutenGroup = groupContains(foodGroup, GLUTEN_GROUP_KEYWORDS)
  if (!isGlutenGroup)
    tags.push({ foodId, tagType: 'dietary', tagValue: 'gluten_free' })

  if (!isDairy)
    tags.push({ foodId, tagType: 'dietary', tagValue: 'dairy_free' })

  // ── Allergens ─────────────────────────────────────────────────────────────

  if (isDairy || isEggOrDairy)
    tags.push({ foodId, tagType: 'allergen', tagValue: 'contains_dairy' })

  if (isGlutenGroup)
    tags.push({ foodId, tagType: 'allergen', tagValue: 'contains_gluten' })

  const isNut =
    groupContains(foodGroup, NUT_GROUP_KEYWORDS) ||
    textContains(combinedText, NUT_DESCRIPTION_KEYWORDS)
  if (isNut)
    tags.push({ foodId, tagType: 'allergen', tagValue: 'contains_nuts' })

  const isSoy =
    groupContains(foodGroup, LEGUME_GROUP_KEYWORDS) &&
    textContains(combinedText, SOY_DESCRIPTION_KEYWORDS)
  if (isSoy)
    tags.push({ foodId, tagType: 'allergen', tagValue: 'contains_soy' })

  const isEggAllergen = isEggOrDairy && textContains(combinedText, ['egg'])
  if (isEggAllergen)
    tags.push({ foodId, tagType: 'allergen', tagValue: 'contains_eggs' })

  if (isFish && !isShellfish)
    tags.push({ foodId, tagType: 'allergen', tagValue: 'contains_fish' })

  if (isShellfish)
    tags.push({ foodId, tagType: 'allergen', tagValue: 'contains_shellfish' })

  // ── Processing level ──────────────────────────────────────────────────────

  const lowerGroup = (foodGroup ?? '').toLowerCase()

  const isWholeFood = WHOLE_FOOD_GROUPS.some((g) => lowerGroup.includes(g.toLowerCase()))
  const isProcessed =
    PROCESSED_GROUPS.some((g) => lowerGroup.includes(g.toLowerCase())) ||
    textContains(combinedText, PROCESSED_DESCRIPTION_KEYWORDS)

  if (isProcessed) {
    tags.push({ foodId, tagType: 'processing_level', tagValue: 'processed' })
  } else if (isWholeFood) {
    tags.push({ foodId, tagType: 'processing_level', tagValue: 'whole_food' })
  } else {
    tags.push({ foodId, tagType: 'processing_level', tagValue: 'minimally_processed' })
  }

  return tags
}

// ─── Nutrient aggregation ─────────────────────────────────────────────────────

/**
 * Returns the numeric per_100g value for the first nutrient whose name
 * contains any of the provided keywords (case-insensitive).
 */
function pickNutrient(
  rows: { nutrientName: string; per100g: string | null }[],
  keywords: string[],
): number {
  const match = rows.find((r) => {
    const lower = r.nutrientName.toLowerCase()
    return keywords.some((k) => lower.includes(k))
  })
  return match?.per100g != null ? parseFloat(match.per100g) : 0
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== seed-tags: starting ===\n')

  // 1. Load all foods
  console.log('Loading foods …')
  const allFoods = await db
    .select({
      id: foods.id,
      name: foods.name,
      foodGroup: foods.foodGroup,
      foodSubgroup: foods.foodSubgroup,
      description: foods.description,
    })
    .from(foods)

  console.log(`  ${allFoods.length} foods loaded`)

  if (allFoods.length === 0) {
    console.log('No foods found — run seed-usda.ts first.')
    process.exit(0)
  }

  // 2. Load all nutrients needed for heuristics
  console.log('Loading nutrients …')
  const allNutrients = await db
    .select({
      foodId: nutrients.foodId,
      nutrientName: nutrients.nutrientName,
      per100g: nutrients.per100g,
    })
    .from(nutrients)

  console.log(`  ${allNutrients.length} nutrient rows loaded`)

  // 3. Group nutrient rows by foodId
  const nutrientsByFood = new Map<string, typeof allNutrients>()
  for (const row of allNutrients) {
    const existing = nutrientsByFood.get(row.foodId) ?? []
    existing.push(row)
    nutrientsByFood.set(row.foodId, existing)
  }

  // 4. Derive tags for every food
  console.log('Deriving tags …')
  const allTags: TagEntry[] = []

  for (const food of allFoods) {
    const rows = nutrientsByFood.get(food.id) ?? []
    const profile: NutrientProfile = {
      protein: pickNutrient(rows, ['protein']),
      carbs: pickNutrient(rows, ['carbohydrate']),
      fat: pickNutrient(rows, ['total lipid', 'total fat']),
      sodium: pickNutrient(rows, ['sodium']),
    }
    const tags = deriveTags(food, profile)
    allTags.push(...tags)
  }

  console.log(`  ${allTags.length} tags derived`)

  // 5. Clear existing derived tags (dietary, allergen, processing_level)
  console.log('Clearing existing tags …')
  await db
    .delete(foodTags)
    .where(
      sql`${foodTags.tagType} IN ('dietary', 'allergen', 'processing_level')`,
    )

  // 6. Bulk insert in batches of 500
  const BATCH_SIZE = 500
  let inserted = 0
  console.log('Inserting tags …')

  for (let i = 0; i < allTags.length; i += BATCH_SIZE) {
    const batch = allTags.slice(i, i + BATCH_SIZE)
    await db.insert(foodTags).values(
      batch.map((t) => ({
        foodId: t.foodId,
        tagType: t.tagType,
        tagValue: t.tagValue,
      })),
    )
    inserted += batch.length
  }

  console.log(`  ${inserted} tags inserted`)

  // 7. Summary statistics
  console.log('\n=== Tag distribution ===\n')

  const summary = await db
    .select({
      tagType: foodTags.tagType,
      tagValue: foodTags.tagValue,
      count: sql<number>`count(*)::int`,
    })
    .from(foodTags)
    .groupBy(foodTags.tagType, foodTags.tagValue)
    .orderBy(foodTags.tagType, foodTags.tagValue)

  let currentType = ''
  for (const row of summary) {
    if (row.tagType !== currentType) {
      console.log(`\n[${row.tagType}]`)
      currentType = row.tagType
    }
    console.log(`  ${row.tagValue}: ${row.count}`)
  }

  console.log('\n=== seed-tags: done ===\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('seed-tags failed:', err)
  process.exit(1)
})
