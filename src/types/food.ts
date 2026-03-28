import type {
  foods,
  nutrients,
  priceData,
  blsFoodCrosswalk,
  foodImages,
  foodTags,
  userPreferences,
  savedViews,
} from '@/lib/db/schema'

// ─── Inferred schema types ─────────────────────────────────────────────────────

export type Food = typeof foods.$inferSelect
export type NewFood = typeof foods.$inferInsert

export type Nutrient = typeof nutrients.$inferSelect
export type NewNutrient = typeof nutrients.$inferInsert

export type PriceData = typeof priceData.$inferSelect
export type NewPriceData = typeof priceData.$inferInsert

export type BlsFoodCrosswalk = typeof blsFoodCrosswalk.$inferSelect
export type NewBlsFoodCrosswalk = typeof blsFoodCrosswalk.$inferInsert

export type FoodImage = typeof foodImages.$inferSelect
export type NewFoodImage = typeof foodImages.$inferInsert

export type FoodTag = typeof foodTags.$inferSelect
export type NewFoodTag = typeof foodTags.$inferInsert

export type UserPreferences = typeof userPreferences.$inferSelect
export type NewUserPreferences = typeof userPreferences.$inferInsert

export type SavedView = typeof savedViews.$inferSelect
export type NewSavedView = typeof savedViews.$inferInsert

// ─── food_computed materialized view ─────────────────────────────────────────

export interface FoodComputed {
  id: string
  fdcId: number | null
  name: string
  foodGroup: string | null
  foodSubgroup: string | null
  dataSource: 'foundation' | 'survey' | 'branded' | 'sr_legacy' | null
  servingSizeG: string | null
  servingUnit: string | null
  description: string | null

  // Key nutrients per 100g
  caloriesPer100g: string | null
  proteinPer100g: string | null
  fatPer100g: string | null
  carbsPer100g: string | null
  fiberPer100g: string | null
  sugarPer100g: string | null
  sodiumPer100g: string | null
  calciumPer100g: string | null
  ironPer100g: string | null

  // Price
  pricePer100g: string | null
  priceSource: 'bls' | 'usda_estimate' | 'manual' | null

  // Computed metrics
  proteinPerDollar: string | null

  // Image
  imageUrl: string | null
  thumbnailUrl: string | null
}
