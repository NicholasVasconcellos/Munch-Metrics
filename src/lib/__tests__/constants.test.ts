import { describe, it, expect } from 'vitest'
import {
  NUTRIENTS,
  DIETARY_PRESETS,
  SORT_COLUMN_MAP,
  NUTRIENT_COLUMN_MAP,
} from '../constants'
import type { DietaryTag, AllergenTag, ProcessingLevel } from '@/types/filters'
import type { ColumnKey } from '@/types/table'

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

const ALL_COLUMN_KEYS: ColumnKey[] = [
  'name', 'foodGroup', 'caloriesPer100g', 'proteinPer100g', 'fatPer100g',
  'carbsPer100g', 'fiberPer100g', 'sugarPer100g', 'sodiumPer100g',
  'pricePer100g', 'proteinPerDollar', 'servingSizeG', 'dataSource',
]

describe('NUTRIENTS array', () => {
  it('has at least one nutrient', () => {
    expect(NUTRIENTS.length).toBeGreaterThan(0)
  })

  it('every nutrient has required fields', () => {
    for (const n of NUTRIENTS) {
      expect(n.key, `${n.key} missing key`).toBeTruthy()
      expect(n.displayName, `${n.key} missing displayName`).toBeTruthy()
      expect(n.unit, `${n.key} missing unit`).toBeTruthy()
      expect(n.category, `${n.key} missing category`).toBeTruthy()
      expect(n.column, `${n.key} missing column`).toBeTruthy()
    }
  })

  it('every nutrient category is a valid value', () => {
    const validCategories = new Set(['macronutrient', 'vitamin', 'mineral', 'fatty_acid', 'amino_acid', 'other'])
    for (const n of NUTRIENTS) {
      expect(validCategories.has(n.category), `${n.key} has invalid category: ${n.category}`).toBe(true)
    }
  })

  it('nutrient keys are unique', () => {
    const keys = NUTRIENTS.map((n) => n.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  it('includes core macronutrients', () => {
    const keys = new Set(NUTRIENTS.map((n) => n.key))
    expect(keys.has('calories')).toBe(true)
    expect(keys.has('protein')).toBe(true)
    expect(keys.has('fat')).toBe(true)
    expect(keys.has('carbs')).toBe(true)
  })

  it('columns are snake_case ending in _per_100g', () => {
    for (const n of NUTRIENTS) {
      expect(n.column, `${n.key} column should end in _per_100g`).toMatch(/_per_100g$/)
    }
  })
})

describe('DIETARY_PRESETS', () => {
  it('has at least one preset', () => {
    expect(Object.keys(DIETARY_PRESETS).length).toBeGreaterThan(0)
  })

  it('every preset has label and description', () => {
    for (const [key, preset] of Object.entries(DIETARY_PRESETS)) {
      expect(preset.label, `${key} missing label`).toBeTruthy()
      expect(preset.description, `${key} missing description`).toBeTruthy()
    }
  })

  it('every preset has at least one filter criterion', () => {
    for (const [key, preset] of Object.entries(DIETARY_PRESETS)) {
      const hasCriteria =
        (preset.dietary?.length ?? 0) > 0 ||
        (preset.excludeAllergens?.length ?? 0) > 0 ||
        (preset.processingLevels?.length ?? 0) > 0 ||
        (preset.nutrientRanges?.length ?? 0) > 0
      expect(hasCriteria, `${key} has no filter criteria`).toBe(true)
    }
  })

  it('dietary tags in presets are valid DietaryTag values', () => {
    for (const [key, preset] of Object.entries(DIETARY_PRESETS)) {
      for (const tag of preset.dietary ?? []) {
        expect(VALID_DIETARY_TAGS.has(tag as DietaryTag), `${key} has invalid dietary tag: ${tag}`).toBe(true)
      }
    }
  })

  it('allergen tags in presets are valid AllergenTag values', () => {
    for (const [key, preset] of Object.entries(DIETARY_PRESETS)) {
      for (const tag of preset.excludeAllergens ?? []) {
        expect(VALID_ALLERGEN_TAGS.has(tag as AllergenTag), `${key} has invalid allergen tag: ${tag}`).toBe(true)
      }
    }
  })

  it('processing levels in presets are valid ProcessingLevel values', () => {
    for (const [key, preset] of Object.entries(DIETARY_PRESETS)) {
      for (const level of preset.processingLevels ?? []) {
        expect(VALID_PROCESSING_LEVELS.has(level as ProcessingLevel), `${key} has invalid processing level: ${level}`).toBe(true)
      }
    }
  })

  it('nutrient range filters reference keys present in NUTRIENT_COLUMN_MAP', () => {
    for (const [key, preset] of Object.entries(DIETARY_PRESETS)) {
      for (const range of preset.nutrientRanges ?? []) {
        expect(
          NUTRIENT_COLUMN_MAP[range.nutrient] !== undefined,
          `${key} nutrient range references unknown nutrient: ${range.nutrient}`
        ).toBe(true)
      }
    }
  })

  it('includes vegan preset with dietary tag', () => {
    expect(DIETARY_PRESETS.vegan).toBeDefined()
    expect(DIETARY_PRESETS.vegan.dietary).toContain('vegan')
  })

  it('includes keto preset with carb restriction', () => {
    expect(DIETARY_PRESETS.keto).toBeDefined()
    const carbRange = DIETARY_PRESETS.keto.nutrientRanges?.find((r) => r.nutrient === 'carbs')
    expect(carbRange).toBeDefined()
    expect(carbRange?.max).toBeDefined()
  })

  it('includes glutenFree preset with wheat allergen exclusion', () => {
    expect(DIETARY_PRESETS.glutenFree).toBeDefined()
    expect(DIETARY_PRESETS.glutenFree.excludeAllergens).toContain('wheat')
  })
})

describe('SORT_COLUMN_MAP', () => {
  it('covers all ColumnKey values', () => {
    for (const key of ALL_COLUMN_KEYS) {
      expect(SORT_COLUMN_MAP[key], `SORT_COLUMN_MAP missing key: ${key}`).toBeTruthy()
    }
  })

  it('values are snake_case SQL column names', () => {
    for (const [key, col] of Object.entries(SORT_COLUMN_MAP)) {
      expect(col, `SORT_COLUMN_MAP[${key}] should be snake_case`).toMatch(/^[a-z0-9_]+$/)
    }
  })

  it('maps name to name', () => {
    expect(SORT_COLUMN_MAP['name']).toBe('name')
  })

  it('maps camelCase to snake_case', () => {
    expect(SORT_COLUMN_MAP['caloriesPer100g']).toBe('calories_per_100g')
    expect(SORT_COLUMN_MAP['proteinPerDollar']).toBe('protein_per_dollar')
    expect(SORT_COLUMN_MAP['foodGroup']).toBe('food_group')
  })
})

describe('NUTRIENT_COLUMN_MAP', () => {
  it('has entries for core nutrients', () => {
    expect(NUTRIENT_COLUMN_MAP['calories']).toBeTruthy()
    expect(NUTRIENT_COLUMN_MAP['protein']).toBeTruthy()
    expect(NUTRIENT_COLUMN_MAP['fat']).toBeTruthy()
    expect(NUTRIENT_COLUMN_MAP['carbs']).toBeTruthy()
  })

  it('values are snake_case SQL column names', () => {
    for (const [key, col] of Object.entries(NUTRIENT_COLUMN_MAP)) {
      expect(col, `NUTRIENT_COLUMN_MAP[${key}] should be snake_case`).toMatch(/^[a-z0-9_]+$/)
    }
  })

  it('all NUTRIENTS array keys are present in NUTRIENT_COLUMN_MAP', () => {
    for (const nutrient of NUTRIENTS) {
      expect(
        NUTRIENT_COLUMN_MAP[nutrient.key] !== undefined,
        `NUTRIENT_COLUMN_MAP missing key: ${nutrient.key}`
      ).toBe(true)
    }
  })
})
