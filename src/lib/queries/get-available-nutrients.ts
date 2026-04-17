'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export interface AvailableNutrient {
  nutrientName: string
  category: string
  unit: string
}

/**
 * Returns all distinct nutrients in the database, grouped by category.
 * Used by the Column Panel to populate dynamic nutrient column options.
 */
export async function getAvailableNutrients(): Promise<AvailableNutrient[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT
      n.nutrient_name  AS "nutrientName",
      COALESCE(n.nutrient_category, 'other') AS "category",
      COALESCE(n.unit, '') AS "unit"
    FROM nutrients n
    WHERE n.nutrient_name IS NOT NULL
    ORDER BY "category", "nutrientName"
  `)

  return result.rows as unknown as AvailableNutrient[]
}
