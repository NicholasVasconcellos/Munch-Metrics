'use server'

import { db } from '@/lib/db'
import { sql, type SQL } from 'drizzle-orm'
import type { FoodComputed } from '@/types/food'
import type { FoodFilters } from '@/types/filters'
import type { SortConfig, GroupByField, TableQueryResult } from '@/types/table'
import { SORT_COLUMN_MAP, NUTRIENT_COLUMN_MAP } from '@/lib/constants'

interface SearchFoodsParams {
  filters?: FoodFilters
  sort?: SortConfig
  groupBy?: GroupByField
  page?: number
  pageSize?: number
}


export async function searchFoods({
  filters = {},
  sort = { field: 'name', direction: 'asc' },
  groupBy = null,
  page = 1,
  pageSize = 50,
}: SearchFoodsParams): Promise<TableQueryResult<FoodComputed>> {
  const conditions: SQL[] = []

  // Text search using pg_trgm similarity
  if (filters.search?.trim()) {
    conditions.push(sql`fc.name % ${filters.search.trim()}`)
  }

  // Food group filter
  if (filters.foodGroups?.length) {
    conditions.push(sql`fc.food_group = ANY(${filters.foodGroups})`)
  }

  // Dietary tag filter (include foods matching ALL requested tags)
  if (filters.dietary?.length) {
    for (const tag of filters.dietary) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM food_tags ft
        WHERE ft.food_id = fc.id
          AND ft.tag_type = 'dietary'
          AND ft.tag_value = ${tag}
      )`)
    }
  }

  // Allergen exclusion filter (exclude foods with any of the listed allergens)
  if (filters.excludeAllergens?.length) {
    conditions.push(sql`NOT EXISTS (
      SELECT 1 FROM food_tags ft
      WHERE ft.food_id = fc.id
        AND ft.tag_type = 'allergen'
        AND ft.tag_value = ANY(${filters.excludeAllergens})
    )`)
  }

  // Processing level filter
  if (filters.processingLevels?.length) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM food_tags ft
      WHERE ft.food_id = fc.id
        AND ft.tag_type = 'processing_level'
        AND ft.tag_value = ANY(${filters.processingLevels})
    )`)
  }

  // Nutrient range filters (column names validated via NUTRIENT_COLUMN_MAP whitelist)
  if (filters.nutrientRanges?.length) {
    for (const range of filters.nutrientRanges) {
      const col = NUTRIENT_COLUMN_MAP[range.nutrient]
      if (!col) continue
      if (range.min !== undefined) {
        conditions.push(sql`fc.${sql.raw(col)} >= ${range.min}`)
      }
      if (range.max !== undefined) {
        conditions.push(sql`fc.${sql.raw(col)} <= ${range.max}`)
      }
    }
  }

  // Price range filter
  if (filters.priceRange?.min !== undefined) {
    conditions.push(sql`fc.price_per_100g >= ${filters.priceRange.min}`)
  }
  if (filters.priceRange?.max !== undefined) {
    conditions.push(sql`fc.price_per_100g <= ${filters.priceRange.max}`)
  }

  // Excluded food IDs
  if (filters.excludedFoodIds?.length) {
    conditions.push(sql`fc.id != ALL(${filters.excludedFoodIds})`)
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``

  // Build ORDER BY (sort column validated via SORT_COLUMN_MAP whitelist)
  const sortCol = SORT_COLUMN_MAP[sort.field] ?? 'name'
  const sortDir = sort.direction === 'desc' ? sql`DESC NULLS LAST` : sql`ASC NULLS LAST`

  let orderByClause: SQL
  if (groupBy === 'foodGroup') {
    orderByClause = sql`ORDER BY fc.food_group ASC NULLS LAST, fc.${sql.raw(sortCol)} ${sortDir}`
  } else if (groupBy === 'dataSource') {
    orderByClause = sql`ORDER BY fc.data_source ASC NULLS LAST, fc.${sql.raw(sortCol)} ${sortDir}`
  } else if (groupBy === 'processingLevel') {
    orderByClause = sql`ORDER BY (
      SELECT ft2.tag_value FROM food_tags ft2
      WHERE ft2.food_id = fc.id AND ft2.tag_type = 'processing_level'
      LIMIT 1
    ) ASC NULLS LAST, fc.${sql.raw(sortCol)} ${sortDir}`
  } else {
    orderByClause = sql`ORDER BY fc.${sql.raw(sortCol)} ${sortDir}`
  }

  const offset = (page - 1) * pageSize

  // Count query
  const countResult = await db.execute(
    sql`SELECT COUNT(*) AS count FROM food_computed fc ${whereClause}`
  )
  const countRow = countResult.rows[0] as Record<string, string> | undefined
  const totalCount = parseInt(countRow?.count ?? '0', 10)

  // Data query — alias columns to camelCase for TypeScript mapping
  const dataResult = await db.execute(sql`
    SELECT
      fc.id,
      fc.fdc_id              AS "fdcId",
      fc.name,
      fc.food_group          AS "foodGroup",
      fc.food_subgroup       AS "foodSubgroup",
      fc.data_source         AS "dataSource",
      fc.serving_size_g      AS "servingSizeG",
      fc.serving_unit        AS "servingUnit",
      fc.description,
      fc.calories_per_100g   AS "caloriesPer100g",
      fc.protein_per_100g    AS "proteinPer100g",
      fc.fat_per_100g        AS "fatPer100g",
      fc.carbs_per_100g      AS "carbsPer100g",
      fc.fiber_per_100g      AS "fiberPer100g",
      fc.sugar_per_100g      AS "sugarPer100g",
      fc.sodium_per_100g     AS "sodiumPer100g",
      fc.calcium_per_100g    AS "calciumPer100g",
      fc.iron_per_100g       AS "ironPer100g",
      fc.price_per_100g      AS "pricePer100g",
      fc.price_source        AS "priceSource",
      fc.protein_per_dollar  AS "proteinPerDollar",
      fc.image_url           AS "imageUrl",
      fc.thumbnail_url       AS "thumbnailUrl"
    FROM food_computed fc
    ${whereClause}
    ${orderByClause}
    LIMIT ${pageSize}
    OFFSET ${offset}
  `)

  return {
    rows: dataResult.rows as unknown as FoodComputed[],
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  }
}
