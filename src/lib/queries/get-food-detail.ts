'use server'

import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { foods, nutrients, priceData, foodImages, foodTags } from '@/lib/db/schema'
import type { Food, Nutrient, PriceData, FoodImage, FoodTag } from '@/types/food'

export interface FoodDetailResult {
  food: Food
  nutrients: {
    macronutrients: Nutrient[]
    vitamins: Nutrient[]
    minerals: Nutrient[]
    fattyAcids: Nutrient[]
    aminoAcids: Nutrient[]
    other: Nutrient[]
  }
  price: PriceData | null
  image: FoodImage | null
  tags: FoodTag[]
}

export async function getFoodDetail(
  foodId: string
): Promise<FoodDetailResult | null> {
  const [food] = await db
    .select()
    .from(foods)
    .where(eq(foods.id, foodId))
    .limit(1)

  if (!food) return null

  const [allNutrients, prices, imageRows, tags] = await Promise.all([
    db
      .select()
      .from(nutrients)
      .where(eq(nutrients.foodId, foodId)),
    db
      .select()
      .from(priceData)
      .where(eq(priceData.foodId, foodId)),
    db
      .select()
      .from(foodImages)
      .where(eq(foodImages.foodId, foodId))
      .limit(1),
    db
      .select()
      .from(foodTags)
      .where(eq(foodTags.foodId, foodId)),
  ])

  return {
    food,
    nutrients: {
      macronutrients: allNutrients.filter(
        (n) => n.nutrientCategory === 'macronutrient'
      ),
      vitamins: allNutrients.filter((n) => n.nutrientCategory === 'vitamin'),
      minerals: allNutrients.filter((n) => n.nutrientCategory === 'mineral'),
      fattyAcids: allNutrients.filter(
        (n) => n.nutrientCategory === 'fatty_acid'
      ),
      aminoAcids: allNutrients.filter(
        (n) => n.nutrientCategory === 'amino_acid'
      ),
      other: allNutrients.filter((n) => n.nutrientCategory === 'other'),
    },
    price: prices[0] ?? null,
    image: imageRows[0] ?? null,
    tags,
  }
}
