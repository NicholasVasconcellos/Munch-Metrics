import { describe, it, expect } from 'vitest'
import {
  serializeTableState,
  deserializeTableState,
  DEFAULT_TABLE_CONFIG,
  DEFAULT_VISIBLE_COLUMNS,
  DEFAULT_PAGE_SIZE,
} from '../url-state'
import type { TableConfig } from '@/types/table'

describe('serializeTableState', () => {
  it('serializes default config to empty params', () => {
    const params = serializeTableState(DEFAULT_TABLE_CONFIG)
    expect(params.toString()).toBe('')
  })

  it('serializes search query', () => {
    const config: TableConfig = { ...DEFAULT_TABLE_CONFIG, filters: { search: 'chicken' } }
    const params = serializeTableState(config)
    expect(params.get('q')).toBe('chicken')
  })

  it('does not serialize empty/whitespace search', () => {
    const config: TableConfig = { ...DEFAULT_TABLE_CONFIG, filters: { search: '   ' } }
    const params = serializeTableState(config)
    expect(params.has('q')).toBe(false)
  })

  it('serializes dietary tags as comma-separated', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      filters: { dietary: ['vegan', 'gluten_free'] },
    }
    const params = serializeTableState(config)
    expect(params.get('diet')).toBe('vegan,gluten_free')
  })

  it('serializes allergen exclusions as comma-separated', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      filters: { excludeAllergens: ['milk', 'wheat'] },
    }
    const params = serializeTableState(config)
    expect(params.get('allerg')).toBe('milk,wheat')
  })

  it('serializes food groups with pipe separator', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      filters: { foodGroups: ['Beef Products', 'Poultry Products'] },
    }
    const params = serializeTableState(config)
    expect(params.get('fgrp')).toBe('Beef Products|Poultry Products')
  })

  it('serializes processing levels as comma-separated', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      filters: { processingLevels: ['unprocessed', 'minimally_processed'] },
    }
    const params = serializeTableState(config)
    expect(params.get('proc')).toBe('unprocessed,minimally_processed')
  })

  it('serializes nutrient ranges', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      filters: { nutrientRanges: [{ nutrient: 'protein', min: 20 }, { nutrient: 'carbs', max: 5 }] },
    }
    const params = serializeTableState(config)
    expect(params.get('nr')).toBe('protein:20:,carbs::5')
  })

  it('serializes sort config when non-default', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      sort: { field: 'proteinPer100g', direction: 'desc' },
    }
    const params = serializeTableState(config)
    expect(params.get('sort')).toBe('proteinPer100g')
    expect(params.get('dir')).toBe('desc')
  })

  it('does not serialize default sort', () => {
    const params = serializeTableState(DEFAULT_TABLE_CONFIG)
    expect(params.has('sort')).toBe(false)
    expect(params.has('dir')).toBe(false)
  })

  it('serializes non-default visible columns', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      visibleColumns: ['name', 'caloriesPer100g', 'proteinPer100g'],
    }
    const params = serializeTableState(config)
    expect(params.get('cols')).toBe('name,caloriesPer100g,proteinPer100g')
  })

  it('does not serialize default visible columns', () => {
    const params = serializeTableState(DEFAULT_TABLE_CONFIG)
    expect(params.has('cols')).toBe(false)
  })

  it('serializes pagination page > 1', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      pagination: { page: 3, pageSize: DEFAULT_PAGE_SIZE },
    }
    const params = serializeTableState(config)
    expect(params.get('page')).toBe('3')
  })

  it('does not serialize page 1', () => {
    const params = serializeTableState(DEFAULT_TABLE_CONFIG)
    expect(params.has('page')).toBe(false)
  })

  it('serializes non-default page size', () => {
    const config: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      pagination: { page: 1, pageSize: 25 },
    }
    const params = serializeTableState(config)
    expect(params.get('ps')).toBe('25')
  })

  it('serializes groupBy field', () => {
    const config: TableConfig = { ...DEFAULT_TABLE_CONFIG, groupBy: 'foodGroup' }
    const params = serializeTableState(config)
    expect(params.get('group')).toBe('foodGroup')
  })
})

describe('deserializeTableState', () => {
  it('deserializes empty params to default config', () => {
    const config = deserializeTableState(new URLSearchParams())
    expect(config.filters.search).toBeUndefined()
    expect(config.sort.field).toBe('name')
    expect(config.sort.direction).toBe('asc')
    expect(config.visibleColumns).toEqual(DEFAULT_VISIBLE_COLUMNS)
    expect(config.extraNutrients).toEqual([])
    expect(config.pagination.page).toBe(1)
    expect(config.pagination.pageSize).toBe(DEFAULT_PAGE_SIZE)
    expect(config.groupBy).toBeNull()
  })

  it('deserializes search query', () => {
    const config = deserializeTableState(new URLSearchParams('q=salmon'))
    expect(config.filters.search).toBe('salmon')
  })

  it('deserializes dietary tags', () => {
    const config = deserializeTableState(new URLSearchParams('diet=vegan,keto'))
    expect(config.filters.dietary).toEqual(['vegan', 'keto'])
  })

  it('strips invalid dietary tags', () => {
    const config = deserializeTableState(new URLSearchParams('diet=vegan,INVALID,keto'))
    expect(config.filters.dietary).toEqual(['vegan', 'keto'])
  })

  it('deserializes allergen exclusions', () => {
    const config = deserializeTableState(new URLSearchParams('allerg=milk,wheat'))
    expect(config.filters.excludeAllergens).toEqual(['milk', 'wheat'])
  })

  it('strips invalid allergen tags', () => {
    const config = deserializeTableState(new URLSearchParams('allerg=milk,FAKE,wheat'))
    expect(config.filters.excludeAllergens).toEqual(['milk', 'wheat'])
  })

  it('deserializes food groups with pipe separator', () => {
    const config = deserializeTableState(new URLSearchParams('fgrp=Beef+Products|Poultry+Products'))
    expect(config.filters.foodGroups).toEqual(['Beef Products', 'Poultry Products'])
  })

  it('deserializes processing levels', () => {
    const config = deserializeTableState(new URLSearchParams('proc=unprocessed,minimally_processed'))
    expect(config.filters.processingLevels).toEqual(['unprocessed', 'minimally_processed'])
  })

  it('strips invalid processing levels', () => {
    const config = deserializeTableState(new URLSearchParams('proc=unprocessed,JUNK'))
    expect(config.filters.processingLevels).toEqual(['unprocessed'])
  })

  it('deserializes nutrient ranges with min and max', () => {
    const config = deserializeTableState(new URLSearchParams('nr=protein:20:50'))
    expect(config.filters.nutrientRanges).toEqual([{ nutrient: 'protein', min: 20, max: 50 }])
  })

  it('deserializes nutrient range with min only', () => {
    const config = deserializeTableState(new URLSearchParams('nr=protein:20:'))
    expect(config.filters.nutrientRanges).toEqual([{ nutrient: 'protein', min: 20 }])
  })

  it('deserializes nutrient range with max only', () => {
    const config = deserializeTableState(new URLSearchParams('nr=carbs::5'))
    expect(config.filters.nutrientRanges).toEqual([{ nutrient: 'carbs', max: 5 }])
  })

  it('skips invalid nutrient keys', () => {
    const config = deserializeTableState(new URLSearchParams('nr=FAKE:10:20'))
    expect(config.filters.nutrientRanges).toBeUndefined()
  })

  it('skips nutrient ranges with no min or max', () => {
    const config = deserializeTableState(new URLSearchParams('nr=protein::'))
    expect(config.filters.nutrientRanges).toBeUndefined()
  })

  it('deserializes sort ascending', () => {
    const config = deserializeTableState(new URLSearchParams('sort=caloriesPer100g&dir=asc'))
    expect(config.sort.field).toBe('caloriesPer100g')
    expect(config.sort.direction).toBe('asc')
  })

  it('deserializes sort descending', () => {
    const config = deserializeTableState(new URLSearchParams('sort=proteinPer100g&dir=desc'))
    expect(config.sort.field).toBe('proteinPer100g')
    expect(config.sort.direction).toBe('desc')
  })

  it('falls back to default sort for invalid sort field', () => {
    const config = deserializeTableState(new URLSearchParams('sort=INVALID'))
    expect(config.sort.field).toBe('name')
  })

  it('defaults direction to asc for anything other than desc', () => {
    const config = deserializeTableState(new URLSearchParams('sort=name&dir=random'))
    expect(config.sort.direction).toBe('asc')
  })

  it('deserializes visible columns', () => {
    const config = deserializeTableState(new URLSearchParams('cols=name,caloriesPer100g'))
    expect(config.visibleColumns).toEqual(['name', 'caloriesPer100g'])
  })

  it('strips invalid column keys', () => {
    const config = deserializeTableState(new URLSearchParams('cols=name,FAKECOL,caloriesPer100g'))
    expect(config.visibleColumns).toEqual(['name', 'caloriesPer100g'])
  })

  it('deserializes page number', () => {
    const config = deserializeTableState(new URLSearchParams('page=5'))
    expect(config.pagination.page).toBe(5)
  })

  it('clamps page to minimum 1', () => {
    const config = deserializeTableState(new URLSearchParams('page=0'))
    expect(config.pagination.page).toBe(1)
  })

  it('deserializes valid page sizes', () => {
    for (const ps of [25, 50, 100]) {
      const config = deserializeTableState(new URLSearchParams(`ps=${ps}`))
      expect(config.pagination.pageSize).toBe(ps)
    }
  })

  it('falls back to default page size for invalid values', () => {
    const config = deserializeTableState(new URLSearchParams('ps=999'))
    expect(config.pagination.pageSize).toBe(DEFAULT_PAGE_SIZE)
  })

  it('deserializes groupBy', () => {
    const config = deserializeTableState(new URLSearchParams('group=foodGroup'))
    expect(config.groupBy).toBe('foodGroup')
  })

  it('rejects invalid groupBy values', () => {
    const config = deserializeTableState(new URLSearchParams('group=INVALID'))
    expect(config.groupBy).toBeNull()
  })

  it('returns undefined for empty filter arrays (dietary)', () => {
    const config = deserializeTableState(new URLSearchParams('diet=INVALID'))
    expect(config.filters.dietary).toBeUndefined()
  })
})

describe('round-trip serialize/deserialize', () => {
  it('preserves full config across round-trip', () => {
    const original: TableConfig = {
      filters: {
        search: 'chicken breast',
        dietary: ['high_protein'],
        excludeAllergens: ['milk'],
        foodGroups: ['Poultry Products'],
        processingLevels: ['minimally_processed'],
        nutrientRanges: [{ nutrient: 'protein', min: 20 }],
      },
      sort: { field: 'proteinPer100g', direction: 'desc' },
      groupBy: 'foodGroup',
      visibleColumns: ['name', 'proteinPer100g', 'caloriesPer100g'],
      extraNutrients: [],
      pagination: { page: 2, pageSize: 25 },
    }
    const params = serializeTableState(original)
    const restored = deserializeTableState(params)
    expect(restored).toEqual(original)
  })

  it('preserves extraNutrients across round-trip', () => {
    const original: TableConfig = {
      ...DEFAULT_TABLE_CONFIG,
      extraNutrients: ['Vitamin C, total ascorbic acid', 'Iron, Fe'],
    }
    const params = serializeTableState(original)
    expect(params.get('en')).toBe('Vitamin C, total ascorbic acid|Iron, Fe')
    const restored = deserializeTableState(params)
    expect(restored.extraNutrients).toEqual(original.extraNutrients)
  })

  it('preserves default config across round-trip', () => {
    const params = serializeTableState(DEFAULT_TABLE_CONFIG)
    const restored = deserializeTableState(params)
    expect(restored).toEqual(DEFAULT_TABLE_CONFIG)
  })
})
