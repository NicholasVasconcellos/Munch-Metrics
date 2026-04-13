import type { FoodFilters } from './filters'

// ─── Column Keys ──────────────────────────────────────────────────────────────

export type ColumnKey =
  | 'name'
  | 'foodGroup'
  | 'caloriesPer100g'
  | 'proteinPer100g'
  | 'fatPer100g'
  | 'carbsPer100g'
  | 'fiberPer100g'
  | 'sugarPer100g'
  | 'sodiumPer100g'
  | 'calciumPer100g'
  | 'ironPer100g'
  | 'pricePer100g'
  | 'proteinPerDollar'
  | 'servingSizeG'
  | 'dataSource'

// ─── Sort Config ─────────────────────────────────────────────────────────────

export interface SortConfig {
  field: ColumnKey
  direction: 'asc' | 'desc'
}

// ─── Group Config ─────────────────────────────────────────────────────────────

export type GroupByField = 'foodGroup' | 'dataSource' | 'processingLevel' | null

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationConfig {
  page: number
  pageSize: number
}

// ─── Full Table Config ────────────────────────────────────────────────────────

/** Maximum number of dynamic nutrient columns that can be selected */
export const MAX_EXTRA_NUTRIENTS = 20

export interface TableConfig {
  filters: FoodFilters
  sort: SortConfig
  groupBy: GroupByField
  visibleColumns: ColumnKey[]
  extraNutrients: string[]
  pagination: PaginationConfig
}

// ─── Query Result ─────────────────────────────────────────────────────────────

export interface TableQueryResult<T> {
  rows: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}
