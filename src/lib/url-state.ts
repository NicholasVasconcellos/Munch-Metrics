import type { TableConfig, ColumnKey, GroupByField } from '@/types/table'
import type { DietaryTag, AllergenTag, ProcessingLevel, NutrientRangeFilter } from '@/types/filters'
import { NUTRIENT_COLUMN_MAP } from '@/lib/constants'

const VALID_DIETARY_TAGS = new Set<DietaryTag>([
  'vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'nut_free',
  'low_sodium', 'low_fat', 'high_protein', 'keto', 'paleo',
])

const VALID_ALLERGEN_TAGS = new Set<AllergenTag>([
  'milk', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'wheat', 'soybeans', 'sesame',
])

const VALID_PROCESSING_LEVELS = new Set<ProcessingLevel>([
  'unprocessed', 'minimally_processed', 'processed', 'ultra_processed',
])

const VALID_NUTRIENTS = new Set(Object.keys(NUTRIENT_COLUMN_MAP))

export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  'name',
  'caloriesPer100g',
  'proteinPer100g',
  'fatPer100g',
  'carbsPer100g',
  'foodGroup',
]

export const DEFAULT_PAGE_SIZE = 50

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  filters: {},
  sort: { field: 'name', direction: 'asc' },
  groupBy: null,
  visibleColumns: DEFAULT_VISIBLE_COLUMNS,
  pagination: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
}

const VALID_COLUMN_KEYS = new Set<ColumnKey>([
  'name',
  'foodGroup',
  'caloriesPer100g',
  'proteinPer100g',
  'fatPer100g',
  'carbsPer100g',
  'fiberPer100g',
  'sugarPer100g',
  'sodiumPer100g',
  'pricePer100g',
  'proteinPerDollar',
  'servingSizeG',
  'dataSource',
])

const VALID_GROUP_BY = new Set<string>(['foodGroup', 'dataSource', 'processingLevel'])

export function serializeTableState(config: TableConfig): URLSearchParams {
  const params = new URLSearchParams()

  if (config.filters.search?.trim()) {
    params.set('q', config.filters.search.trim())
  }

  if (config.filters.dietary?.length) {
    params.set('diet', config.filters.dietary.join(','))
  }

  if (config.filters.excludeAllergens?.length) {
    params.set('allerg', config.filters.excludeAllergens.join(','))
  }

  if (config.filters.foodGroups?.length) {
    params.set('fgrp', config.filters.foodGroups.join('|'))
  }

  if (config.filters.processingLevels?.length) {
    params.set('proc', config.filters.processingLevels.join(','))
  }

  if (config.filters.nutrientRanges?.length) {
    params.set(
      'nr',
      config.filters.nutrientRanges
        .map((r) => `${r.nutrient}:${r.min ?? ''}:${r.max ?? ''}`)
        .join(',')
    )
  }

  if (config.sort.field !== 'name' || config.sort.direction !== 'asc') {
    params.set('sort', config.sort.field)
    params.set('dir', config.sort.direction)
  }

  const defaultCols = DEFAULT_VISIBLE_COLUMNS.join(',')
  const currentCols = config.visibleColumns.join(',')
  if (currentCols !== defaultCols) {
    params.set('cols', currentCols)
  }

  if (config.pagination.page > 1) {
    params.set('page', String(config.pagination.page))
  }

  if (config.pagination.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set('ps', String(config.pagination.pageSize))
  }

  if (config.groupBy) {
    params.set('group', config.groupBy)
  }

  return params
}

export function deserializeTableState(params: URLSearchParams): TableConfig {
  const search = params.get('q') ?? undefined

  const dietStr = params.get('diet')
  const dietary: DietaryTag[] = dietStr
    ? (dietStr.split(',').filter((t) => VALID_DIETARY_TAGS.has(t as DietaryTag)) as DietaryTag[])
    : []

  const allergStr = params.get('allerg')
  const excludeAllergens: AllergenTag[] = allergStr
    ? (allergStr.split(',').filter((t) => VALID_ALLERGEN_TAGS.has(t as AllergenTag)) as AllergenTag[])
    : []

  const fgrpStr = params.get('fgrp')
  const foodGroups: string[] = fgrpStr ? fgrpStr.split('|').filter(Boolean) : []

  const procStr = params.get('proc')
  const processingLevels: ProcessingLevel[] = procStr
    ? (procStr.split(',').filter((l) => VALID_PROCESSING_LEVELS.has(l as ProcessingLevel)) as ProcessingLevel[])
    : []

  const nrStr = params.get('nr')
  const nutrientRanges: NutrientRangeFilter[] = nrStr
    ? nrStr
        .split(',')
        .reduce<NutrientRangeFilter[]>((acc, segment) => {
          const [nutrient, minStr, maxStr] = segment.split(':')
          if (!nutrient || !VALID_NUTRIENTS.has(nutrient)) return acc
          const min = minStr ? parseFloat(minStr) : undefined
          const max = maxStr ? parseFloat(maxStr) : undefined
          if (min === undefined && max === undefined) return acc
          const entry: NutrientRangeFilter = { nutrient }
          if (min !== undefined) entry.min = min
          if (max !== undefined) entry.max = max
          acc.push(entry)
          return acc
        }, [])
    : []

  const rawSort = params.get('sort') ?? 'name'
  const sortField = VALID_COLUMN_KEYS.has(rawSort as ColumnKey)
    ? (rawSort as ColumnKey)
    : 'name'

  const rawDir = params.get('dir') ?? 'asc'
  const sortDir: 'asc' | 'desc' = rawDir === 'desc' ? 'desc' : 'asc'

  const colsStr = params.get('cols')
  const visibleColumns: ColumnKey[] = colsStr
    ? (colsStr.split(',').filter((c) => VALID_COLUMN_KEYS.has(c as ColumnKey)) as ColumnKey[])
    : DEFAULT_VISIBLE_COLUMNS

  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1)
  const rawPs = parseInt(params.get('ps') ?? String(DEFAULT_PAGE_SIZE), 10)
  const pageSize = [25, 50, 100].includes(rawPs) ? rawPs : DEFAULT_PAGE_SIZE

  const rawGroup = params.get('group')
  const groupBy: GroupByField =
    rawGroup && VALID_GROUP_BY.has(rawGroup) ? (rawGroup as GroupByField) : null

  return {
    filters: {
      search,
      dietary: dietary.length ? dietary : undefined,
      excludeAllergens: excludeAllergens.length ? excludeAllergens : undefined,
      foodGroups: foodGroups.length ? foodGroups : undefined,
      processingLevels: processingLevels.length ? processingLevels : undefined,
      nutrientRanges: nutrientRanges.length ? nutrientRanges : undefined,
    },
    sort: { field: sortField, direction: sortDir },
    groupBy,
    visibleColumns,
    pagination: { page, pageSize },
  }
}
