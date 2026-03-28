/**
 * Integration tests for getFoodDetail query function.
 * Requires: DATABASE_URL pointing to a running Postgres instance with seeded data.
 * Skip: set SKIP_INTEGRATION_TESTS=1 or leave DATABASE_URL unset.
 */

import { describe, it, expect, beforeAll } from 'vitest'

const SKIP = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION_TESTS === '1'

describe.skipIf(SKIP)('getFoodDetail', () => {
  beforeAll(async () => {
    const { db } = await import('@/lib/db')
    const { sql } = await import('drizzle-orm')
    await db.execute(sql`SELECT 1`)
  })

  it('returns null for a non-existent food ID', async () => {
    const { getFoodDetail } = await import('@/lib/queries/get-food-detail')
    const result = await getFoodDetail('00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })

  it('returns full detail for an existing food', async () => {
    const { db } = await import('@/lib/db')
    const { foods, nutrients } = await import('@/lib/db/schema')
    const { sql } = await import('drizzle-orm')
    const { getFoodDetail } = await import('@/lib/queries/get-food-detail')

    // Insert test food
    await db.insert(foods).values({
      fdcId: 666001,
      name: 'Detail Test Food',
      dataSource: 'foundation',
      foodGroup: 'Test Group',
    }).onConflictDoNothing()

    const foodResult = await db.execute(sql`SELECT id FROM foods WHERE fdc_id = 666001`)
    const food = foodResult.rows[0]
    const foodId = (food as Record<string, string>)?.id
    if (!foodId) throw new Error('Test food not inserted')

    // Insert a nutrient
    await db.insert(nutrients).values({
      foodId,
      nutrientName: 'Protein',
      amount: '25.0',
      unit: 'G',
      nutrientCategory: 'macronutrient',
    }).onConflictDoNothing()

    const result = await getFoodDetail(foodId)

    expect(result).not.toBeNull()
    expect(result!.food.name).toBe('Detail Test Food')
    expect(result!.nutrients.macronutrients).toHaveLength(1)
    expect(result!.nutrients.macronutrients[0].nutrientName).toBe('Protein')
    expect(result!.price).toBeNull()
    expect(result!.image).toBeNull()
    expect(result!.tags).toHaveLength(0)

    // Cleanup
    await db.execute(sql`DELETE FROM nutrients WHERE food_id = ${foodId}`)
    await db.execute(sql`DELETE FROM foods WHERE fdc_id = 666001`)
  })

  it('nutrient categories are grouped correctly', async () => {
    const { db } = await import('@/lib/db')
    const { foods, nutrients } = await import('@/lib/db/schema')
    const { sql } = await import('drizzle-orm')
    const { getFoodDetail } = await import('@/lib/queries/get-food-detail')

    await db.insert(foods).values({
      fdcId: 666002,
      name: 'Multi-Nutrient Test Food',
      dataSource: 'foundation',
      foodGroup: 'Test Group',
    }).onConflictDoNothing()

    const foodResult2 = await db.execute(sql`SELECT id FROM foods WHERE fdc_id = 666002`)
    const food = foodResult2.rows[0]
    const foodId = (food as Record<string, string>)?.id
    if (!foodId) throw new Error('Test food not inserted')

    await db.insert(nutrients).values([
      { foodId, nutrientName: 'Protein',     amount: '25.0', unit: 'G',  nutrientCategory: 'macronutrient' },
      { foodId, nutrientName: 'Vitamin C',   amount: '10.0', unit: 'MG', nutrientCategory: 'vitamin' },
      { foodId, nutrientName: 'Calcium',     amount: '100',  unit: 'MG', nutrientCategory: 'mineral' },
    ])

    const result = await getFoodDetail(foodId)

    expect(result!.nutrients.macronutrients).toHaveLength(1)
    expect(result!.nutrients.vitamins).toHaveLength(1)
    expect(result!.nutrients.minerals).toHaveLength(1)
    expect(result!.nutrients.fattyAcids).toHaveLength(0)
    expect(result!.nutrients.aminoAcids).toHaveLength(0)

    // Cleanup
    await db.execute(sql`DELETE FROM nutrients WHERE food_id = ${foodId}`)
    await db.execute(sql`DELETE FROM foods WHERE fdc_id = 666002`)
  })
})
