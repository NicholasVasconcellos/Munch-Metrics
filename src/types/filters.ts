// ─── Dietary Filters ──────────────────────────────────────────────────────────

export type DietaryTag =
  | 'vegan'
  | 'vegetarian'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'low_sodium'
  | 'low_fat'
  | 'high_protein'
  | 'keto'
  | 'paleo'

export type AllergenTag =
  | 'milk'
  | 'eggs'
  | 'fish'
  | 'shellfish'
  | 'tree_nuts'
  | 'peanuts'
  | 'wheat'
  | 'soybeans'
  | 'sesame'

export type ProcessingLevel =
  | 'unprocessed'
  | 'minimally_processed'
  | 'processed'
  | 'ultra_processed'

// ─── Nutrient Range Filter ────────────────────────────────────────────────────

export interface NutrientRangeFilter {
  nutrient: string
  min?: number
  max?: number
}

// ─── Combined Food Filters ────────────────────────────────────────────────────

export interface FoodFilters {
  search?: string
  foodGroups?: string[]
  dietary?: DietaryTag[]
  excludeAllergens?: AllergenTag[]
  processingLevels?: ProcessingLevel[]
  nutrientRanges?: NutrientRangeFilter[]
  priceRange?: { min?: number; max?: number }
  excludedFoodIds?: string[]
}
