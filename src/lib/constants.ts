import type { DietaryTag, AllergenTag, ProcessingLevel } from '@/types/filters'
import type { ColumnKey } from '@/types/table'

// ─── Nutrient Metadata ────────────────────────────────────────────────────────

export type NutrientCategory =
  | 'macronutrient'
  | 'vitamin'
  | 'mineral'
  | 'fatty_acid'
  | 'amino_acid'
  | 'other'

export interface NutrientMeta {
  key: string
  displayName: string
  unit: string
  category: NutrientCategory
  /** Column name in the food_computed materialized view */
  column: string
}

export const NUTRIENTS: NutrientMeta[] = [
  {
    key: 'calories',
    displayName: 'Calories',
    unit: 'kcal',
    category: 'macronutrient',
    column: 'calories_per_100g',
  },
  {
    key: 'protein',
    displayName: 'Protein',
    unit: 'g',
    category: 'macronutrient',
    column: 'protein_per_100g',
  },
  {
    key: 'fat',
    displayName: 'Total Fat',
    unit: 'g',
    category: 'macronutrient',
    column: 'fat_per_100g',
  },
  {
    key: 'carbs',
    displayName: 'Carbohydrates',
    unit: 'g',
    category: 'macronutrient',
    column: 'carbs_per_100g',
  },
  {
    key: 'fiber',
    displayName: 'Dietary Fiber',
    unit: 'g',
    category: 'macronutrient',
    column: 'fiber_per_100g',
  },
  {
    key: 'sugar',
    displayName: 'Total Sugars',
    unit: 'g',
    category: 'macronutrient',
    column: 'sugar_per_100g',
  },
  {
    key: 'sodium',
    displayName: 'Sodium',
    unit: 'mg',
    category: 'mineral',
    column: 'sodium_per_100g',
  },
  {
    key: 'calcium',
    displayName: 'Calcium',
    unit: 'mg',
    category: 'mineral',
    column: 'calcium_per_100g',
  },
  {
    key: 'iron',
    displayName: 'Iron',
    unit: 'mg',
    category: 'mineral',
    column: 'iron_per_100g',
  },
]

// ─── Dietary Preset Definitions ───────────────────────────────────────────────

export interface DietaryPreset {
  label: string
  description: string
  dietary?: DietaryTag[]
  excludeAllergens?: AllergenTag[]
  processingLevels?: ProcessingLevel[]
  nutrientRanges?: { nutrient: string; min?: number; max?: number }[]
}

export const DIETARY_PRESETS: Record<string, DietaryPreset> = {
  vegan: {
    label: 'Vegan',
    description: 'No animal products',
    dietary: ['vegan'],
  },
  vegetarian: {
    label: 'Vegetarian',
    description: 'No meat or fish',
    dietary: ['vegetarian'],
  },
  keto: {
    label: 'Keto',
    description: 'Very low carb (≤5g/100g), high fat',
    dietary: ['keto'],
    nutrientRanges: [{ nutrient: 'carbs', max: 5 }],
  },
  highProtein: {
    label: 'High Protein',
    description: 'At least 20g protein per 100g',
    dietary: ['high_protein'],
    nutrientRanges: [{ nutrient: 'protein', min: 20 }],
  },
  lowSodium: {
    label: 'Low Sodium',
    description: 'Less than 120mg sodium per 100g',
    dietary: ['low_sodium'],
    nutrientRanges: [{ nutrient: 'sodium', max: 120 }],
  },
  glutenFree: {
    label: 'Gluten Free',
    description: 'No gluten-containing grains',
    dietary: ['gluten_free'],
    excludeAllergens: ['wheat'],
  },
  dairyFree: {
    label: 'Dairy Free',
    description: 'No dairy products',
    dietary: ['dairy_free'],
    excludeAllergens: ['milk'],
  },
  wholeFood: {
    label: 'Whole Foods',
    description: 'Unprocessed or minimally processed',
    processingLevels: ['unprocessed', 'minimally_processed'],
  },
}

// ─── Column → SQL Column Name Map ─────────────────────────────────────────────
// Maps TypeScript ColumnKey to the actual column name in food_computed.
// Used as a whitelist to prevent SQL injection in dynamic ORDER BY clauses.

export const SORT_COLUMN_MAP: Record<ColumnKey, string> = {
  name: 'name',
  foodGroup: 'food_group',
  caloriesPer100g: 'calories_per_100g',
  proteinPer100g: 'protein_per_100g',
  fatPer100g: 'fat_per_100g',
  carbsPer100g: 'carbs_per_100g',
  fiberPer100g: 'fiber_per_100g',
  sugarPer100g: 'sugar_per_100g',
  sodiumPer100g: 'sodium_per_100g',
  calciumPer100g: 'calcium_per_100g',
  ironPer100g: 'iron_per_100g',
  pricePer100g: 'price_per_100g',
  proteinPerDollar: 'protein_per_dollar',
  servingSizeG: 'serving_size_g',
  dataSource: 'data_source',
}

// ─── Nutrient Key → SQL Column Map ────────────────────────────────────────────
// Maps nutrient range filter keys to food_computed column names.
// Used as a whitelist to prevent SQL injection in dynamic WHERE clauses.

export const NUTRIENT_COLUMN_MAP: Record<string, string> = {
  calories: 'calories_per_100g',
  protein: 'protein_per_100g',
  fat: 'fat_per_100g',
  carbs: 'carbs_per_100g',
  fiber: 'fiber_per_100g',
  sugar: 'sugar_per_100g',
  sodium: 'sodium_per_100g',
  calcium: 'calcium_per_100g',
  iron: 'iron_per_100g',
  pricePer100g: 'price_per_100g',
  proteinPerDollar: 'protein_per_dollar',
}
