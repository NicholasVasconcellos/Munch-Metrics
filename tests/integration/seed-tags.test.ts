/**
 * Integration tests for tag seed script heuristics.
 * Requires: DATABASE_URL pointing to a running Postgres instance.
 * Skip: set SKIP_INTEGRATION_TESTS=1 or leave DATABASE_URL unset.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const SKIP = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION_TESTS === '1'

// ─── Tag derivation logic (mirrors seed-tags.ts heuristics) ──────────────────

type TagType = 'dietary' | 'allergen' | 'processing_level'

interface FoodForTag {
  name: string
  foodGroup: string | null
  description: string | null
}

interface NutrientProfile {
  protein: number
  carbs: number
  fat: number
  sodium: number
}

function deriveTagsForFood(
  food: FoodForTag,
  nutrients: NutrientProfile
): Array<{ tagType: TagType; tagValue: string }> {
  const tags: Array<{ tagType: TagType; tagValue: string }> = []
  const groupLower = (food.foodGroup ?? '').toLowerCase()
  const nameLower = food.name.toLowerCase()

  // Processing level
  const isAnimalProduct = /beef|pork|poultry|fish|shellfish|dairy|egg/i.test(groupLower)
  const isWholeGrain = /whole grain|whole wheat|oat/i.test(nameLower)
  if (!isAnimalProduct && !isWholeGrain && groupLower.includes('vegetable')) {
    tags.push({ tagType: 'processing_level', tagValue: 'unprocessed' })
  }

  // High protein
  if (nutrients.protein >= 20) {
    tags.push({ tagType: 'dietary', tagValue: 'high_protein' })
  }

  // Low sodium
  if (nutrients.sodium < 120) {
    tags.push({ tagType: 'dietary', tagValue: 'low_sodium' })
  }

  // Keto (low carb)
  if (nutrients.carbs <= 5) {
    tags.push({ tagType: 'dietary', tagValue: 'keto' })
  }

  // Allergens
  if (/dairy|milk|cheese|butter|cream|yogurt/i.test(groupLower) ||
      /dairy|milk|cheese|butter|cream|yogurt/i.test(nameLower)) {
    tags.push({ tagType: 'allergen', tagValue: 'milk' })
  }

  if (/wheat|flour|bread|pasta|cracker/i.test(nameLower) ||
      /cereal grain|baked product/i.test(groupLower)) {
    tags.push({ tagType: 'allergen', tagValue: 'wheat' })
  }

  return tags
}

describe('tag derivation heuristics', () => {
  it('marks high-protein foods (≥20g protein) correctly', () => {
    const food = { name: 'Chicken breast, raw', foodGroup: 'Poultry Products', description: null }
    const nutrients = { protein: 31.0, carbs: 0.0, fat: 3.6, sodium: 74 }
    const tags = deriveTagsForFood(food, nutrients)
    const tagValues = tags.map((t) => t.tagValue)
    expect(tagValues).toContain('high_protein')
  })

  it('does not mark low-protein foods as high_protein', () => {
    const food = { name: 'Apple, raw', foodGroup: 'Fruits and Fruit Juices', description: null }
    const nutrients = { protein: 0.3, carbs: 14.0, fat: 0.2, sodium: 1 }
    const tags = deriveTagsForFood(food, nutrients)
    const tagValues = tags.map((t) => t.tagValue)
    expect(tagValues).not.toContain('high_protein')
  })

  it('marks low-sodium foods (<120mg) correctly', () => {
    const food = { name: 'Broccoli, raw', foodGroup: 'Vegetables and Vegetable Products', description: null }
    const nutrients = { protein: 2.8, carbs: 6.6, fat: 0.4, sodium: 33 }
    const tags = deriveTagsForFood(food, nutrients)
    const tagValues = tags.map((t) => t.tagValue)
    expect(tagValues).toContain('low_sodium')
  })

  it('does not mark high-sodium foods as low_sodium', () => {
    const food = { name: 'Salt, table', foodGroup: 'Spices and Herbs', description: null }
    const nutrients = { protein: 0.0, carbs: 0.0, fat: 0.0, sodium: 38758 }
    const tags = deriveTagsForFood(food, nutrients)
    const tagValues = tags.map((t) => t.tagValue)
    expect(tagValues).not.toContain('low_sodium')
  })

  it('marks low-carb foods (≤5g) as keto', () => {
    const food = { name: 'Beef, ground, 80% lean', foodGroup: 'Beef Products', description: null }
    const nutrients = { protein: 17.2, carbs: 0.0, fat: 20.0, sodium: 72 }
    const tags = deriveTagsForFood(food, nutrients)
    const tagValues = tags.map((t) => t.tagValue)
    expect(tagValues).toContain('keto')
  })

  it('does not mark high-carb foods as keto', () => {
    const food = { name: 'White bread', foodGroup: 'Baked Products', description: null }
    const nutrients = { protein: 9.0, carbs: 49.0, fat: 3.2, sodium: 450 }
    const tags = deriveTagsForFood(food, nutrients)
    const tagValues = tags.map((t) => t.tagValue)
    expect(tagValues).not.toContain('keto')
  })

  it('marks dairy products with milk allergen tag', () => {
    const food = { name: 'Milk, whole', foodGroup: 'Dairy and Egg Products', description: null }
    const nutrients = { protein: 3.2, carbs: 4.8, fat: 3.3, sodium: 44 }
    const tags = deriveTagsForFood(food, nutrients)
    const allergenTags = tags.filter((t) => t.tagType === 'allergen').map((t) => t.tagValue)
    expect(allergenTags).toContain('milk')
  })

  it('marks wheat-based products with wheat allergen tag', () => {
    const food = { name: 'Whole wheat bread', foodGroup: 'Baked Products', description: null }
    const nutrients = { protein: 9.0, carbs: 49.0, fat: 3.2, sodium: 450 }
    const tags = deriveTagsForFood(food, nutrients)
    const allergenTags = tags.filter((t) => t.tagType === 'allergen').map((t) => t.tagValue)
    expect(allergenTags).toContain('wheat')
  })

  it('chicken breast gets high_protein and low_sodium and keto tags', () => {
    const food = { name: 'Chicken, breast, raw', foodGroup: 'Poultry Products', description: null }
    const nutrients = { protein: 31.0, carbs: 0.0, fat: 3.6, sodium: 74 }
    const tags = deriveTagsForFood(food, nutrients)
    const tagValues = tags.map((t) => t.tagValue)
    expect(tagValues).toContain('high_protein')
    expect(tagValues).toContain('low_sodium')
    expect(tagValues).toContain('keto')
  })
})

describe.skipIf(SKIP)('seed-tags: database operations', () => {
  it('food_tags table accepts dietary tag inserts', async () => {
    const { db } = await import('@/lib/db')
    const { foods, foodTags } = await import('@/lib/db/schema')
    const { sql } = await import('drizzle-orm')

    await db.insert(foods).values({
      fdcId: 777001,
      name: 'Tag Integration Test Food',
      dataSource: 'foundation',
      foodGroup: 'Test Group',
    }).onConflictDoNothing()

    const foodResult = await db.execute(sql`SELECT id FROM foods WHERE fdc_id = 777001`)
    const food = foodResult.rows[0]
    const foodId = (food as Record<string, string>)?.id
    if (!foodId) throw new Error('Test food not inserted')

    await db.insert(foodTags).values({
      foodId,
      tagType: 'dietary',
      tagValue: 'high_protein',
    }).onConflictDoNothing()

    const rows = await db.execute(
      sql`SELECT tag_value FROM food_tags WHERE food_id = ${foodId} AND tag_type = 'dietary'`
    )
    expect(rows.rows).toHaveLength(1)

    // Cleanup
    await db.execute(sql`DELETE FROM food_tags WHERE food_id = ${foodId}`)
    await db.execute(sql`DELETE FROM foods WHERE fdc_id = 777001`)
  })
})
