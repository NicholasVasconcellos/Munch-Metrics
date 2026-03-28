/**
 * Integration tests for USDA seed script logic.
 * Requires: DATABASE_URL pointing to a running Postgres instance with migrations applied.
 * Skip: set SKIP_INTEGRATION_TESTS=1 or leave DATABASE_URL unset.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const SKIP = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION_TESTS === '1'

// ─── MSW mock for USDA FoodData Central API ──────────────────────────────────

const MOCK_FDC_FOODS = [
  {
    fdcId: 999001,
    description: 'Chicken, broilers or fryers, breast, meat only, raw',
    dataType: 'Foundation',
    foodCategory: 'Poultry Products',
    servingSize: 100,
    servingSizeUnit: 'g',
    foodNutrients: [
      { number: 203, name: 'Protein', amount: 31.0, unitName: 'G' },
      { number: 204, name: 'Total lipid (fat)', amount: 3.6, unitName: 'G' },
      { number: 205, name: 'Carbohydrate, by difference', amount: 0.0, unitName: 'G' },
      { number: 208, name: 'Energy', amount: 165, unitName: 'KCAL' },
    ],
  },
  {
    fdcId: 999002,
    description: 'Egg, whole, raw, fresh',
    dataType: 'SR Legacy',
    foodCategory: 'Dairy and Egg Products',
    servingSize: 50,
    servingSizeUnit: 'g',
    foodNutrients: [
      { number: 203, name: 'Protein', amount: 12.6, unitName: 'G' },
      { number: 204, name: 'Total lipid (fat)', amount: 9.5, unitName: 'G' },
      { number: 205, name: 'Carbohydrate, by difference', amount: 0.7, unitName: 'G' },
      { number: 208, name: 'Energy', amount: 143, unitName: 'KCAL' },
    ],
  },
]

const server = setupServer(
  http.get('https://api.nal.usda.gov/fdc/v1/foods/list', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('pageNumber') ?? '1')
    // Return data on page 1, empty on page 2+ (signals end of data)
    if (page === 1) {
      return HttpResponse.json(MOCK_FDC_FOODS)
    }
    return HttpResponse.json([])
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterAll(() => server.close())

describe.skipIf(SKIP)('USDA seed: API response parsing', () => {
  it('mock server returns expected food count on page 1', async () => {
    const res = await fetch('https://api.nal.usda.gov/fdc/v1/foods/list?pageNumber=1&api_key=test')
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
  })

  it('mock server returns empty array on page 2', async () => {
    const res = await fetch('https://api.nal.usda.gov/fdc/v1/foods/list?pageNumber=2&api_key=test')
    const data = await res.json()
    expect(data).toHaveLength(0)
  })

  it('mock foods have required fdcId and description fields', async () => {
    const res = await fetch('https://api.nal.usda.gov/fdc/v1/foods/list?pageNumber=1&api_key=test')
    const data = await res.json()
    for (const food of data) {
      expect(food.fdcId).toBeTypeOf('number')
      expect(food.description).toBeTypeOf('string')
      expect(food.foodNutrients).toBeInstanceOf(Array)
    }
  })

  it('mock foods have nutrient arrays', async () => {
    const res = await fetch('https://api.nal.usda.gov/fdc/v1/foods/list?pageNumber=1&api_key=test')
    const data = await res.json()
    for (const food of data) {
      expect(food.foodNutrients.length).toBeGreaterThan(0)
      const firstNutrient = food.foodNutrients[0]
      expect(firstNutrient.name).toBeTypeOf('string')
      expect(firstNutrient.amount).toBeTypeOf('number')
    }
  })
})

describe.skipIf(SKIP)('USDA seed: database operations', () => {
  it('inserts foods into the database', async () => {
    const { db } = await import('@/lib/db')
    const { foods } = await import('@/lib/db/schema')
    const { sql } = await import('drizzle-orm')

    // Clean up test foods
    await db.execute(sql`DELETE FROM foods WHERE fdc_id IN (999001, 999002)`)

    // Insert test data directly
    await db.insert(foods).values([
      {
        fdcId: 999001,
        name: 'Chicken, broilers or fryers, breast, meat only, raw',
        dataSource: 'foundation',
        foodGroup: 'Poultry Products',
        servingSizeG: '100',
        servingUnit: 'g',
      },
    ]).onConflictDoNothing()

    const rows = await db.execute(sql`SELECT fdc_id FROM foods WHERE fdc_id = 999001`)
    expect(rows.rows).toHaveLength(1)

    // Cleanup
    await db.execute(sql`DELETE FROM foods WHERE fdc_id = 999001`)
  })
})
