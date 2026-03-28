'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export interface NutrientRange {
  min: number
  max: number
}

export interface FilterOptions {
  foodGroups: string[]
  dietaryTags: string[]
  allergenTags: string[]
  processingLevels: string[]
  nutrientRanges: {
    calories: NutrientRange
    protein: NutrientRange
    fat: NutrientRange
    carbs: NutrientRange
    sodium: NutrientRange
    price: NutrientRange
  } | null
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [foodGroupRows, dietaryRows, allergenRows, processingRows, rangeRows] =
    await Promise.all([
      db.execute(
        sql`SELECT DISTINCT food_group
            FROM food_computed
            WHERE food_group IS NOT NULL
            ORDER BY food_group`
      ),
      db.execute(
        sql`SELECT DISTINCT tag_value
            FROM food_tags
            WHERE tag_type = 'dietary'
            ORDER BY tag_value`
      ),
      db.execute(
        sql`SELECT DISTINCT tag_value
            FROM food_tags
            WHERE tag_type = 'allergen'
            ORDER BY tag_value`
      ),
      db.execute(
        sql`SELECT DISTINCT tag_value
            FROM food_tags
            WHERE tag_type = 'processing_level'
            ORDER BY tag_value`
      ),
      db.execute(sql`
        SELECT
          MIN(calories_per_100g)::text  AS min_calories,
          MAX(calories_per_100g)::text  AS max_calories,
          MIN(protein_per_100g)::text   AS min_protein,
          MAX(protein_per_100g)::text   AS max_protein,
          MIN(fat_per_100g)::text       AS min_fat,
          MAX(fat_per_100g)::text       AS max_fat,
          MIN(carbs_per_100g)::text     AS min_carbs,
          MAX(carbs_per_100g)::text     AS max_carbs,
          MIN(sodium_per_100g)::text    AS min_sodium,
          MAX(sodium_per_100g)::text    AS max_sodium,
          MIN(price_per_100g)::text     AS min_price,
          MAX(price_per_100g)::text     AS max_price
        FROM food_computed
      `),
    ])

  type RangeRow = Record<string, string | null>
  const r = rangeRows.rows[0] as RangeRow | undefined

  const toRange = (min: string | null | undefined, max: string | null | undefined): NutrientRange => ({
    min: parseFloat(min ?? '0'),
    max: parseFloat(max ?? '0'),
  })

  return {
    foodGroups: (foodGroupRows.rows as Record<string, string>[]).map((row) => row.food_group),
    dietaryTags: (dietaryRows.rows as Record<string, string>[]).map((row) => row.tag_value),
    allergenTags: (allergenRows.rows as Record<string, string>[]).map((row) => row.tag_value),
    processingLevels: (processingRows.rows as Record<string, string>[]).map((row) => row.tag_value),
    nutrientRanges: r
      ? {
          calories: toRange(r.min_calories, r.max_calories),
          protein: toRange(r.min_protein, r.max_protein),
          fat: toRange(r.min_fat, r.max_fat),
          carbs: toRange(r.min_carbs, r.max_carbs),
          sodium: toRange(r.min_sodium, r.max_sodium),
          price: toRange(r.min_price, r.max_price),
        }
      : null,
  }
}
