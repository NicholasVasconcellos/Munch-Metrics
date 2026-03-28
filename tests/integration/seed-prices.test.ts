/**
 * Integration tests for BLS price seed script logic.
 * Requires: DATABASE_URL pointing to a running Postgres instance.
 * Skip: set SKIP_INTEGRATION_TESTS=1 or leave DATABASE_URL unset.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const SKIP = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION_TESTS === '1'

// ─── MSW mock for BLS API ─────────────────────────────────────────────────────

const MOCK_BLS_RESPONSE = {
  status: 'REQUEST_SUCCEEDED',
  message: [],
  Results: {
    series: [
      {
        seriesID: 'APU0000703112',
        data: [
          { year: '2025', period: 'M02', periodName: 'February', value: '5.20' },
          { year: '2025', period: 'M01', periodName: 'January',  value: '5.10' },
          { year: '2024', period: 'M13', periodName: 'Annual',   value: '5.00' },
        ],
      },
      {
        seriesID: 'APU0000708111',
        data: [
          { year: '2025', period: 'M02', periodName: 'February', value: '2.80' },
        ],
      },
    ],
  },
}

const server = setupServer(
  http.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', () => {
    return HttpResponse.json(MOCK_BLS_RESPONSE)
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterAll(() => server.close())

describe.skipIf(SKIP)('BLS API response parsing', () => {
  it('mock server returns REQUEST_SUCCEEDED status', async () => {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: ['APU0000703112'], startyear: '2024', endyear: '2025' }),
    })
    const data = await res.json()
    expect(data.status).toBe('REQUEST_SUCCEEDED')
    expect(data.Results.series).toHaveLength(2)
  })

  it('selects the most recent non-M13 data point', async () => {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: ['APU0000703112'], startyear: '2024', endyear: '2025' }),
    })
    const data = await res.json()
    const series = data.Results.series[0]

    // Simulate the seed script logic: filter out M13, pick most recent
    const points = series.data
      .filter((d: { period: string; value: string }) => d.period !== 'M13' && d.value !== '-')
      .sort((a: { year: string; period: string }, b: { year: string; period: string }) => {
        const yearDiff = parseInt(b.year) - parseInt(a.year)
        if (yearDiff !== 0) return yearDiff
        return parseInt(b.period.slice(1)) - parseInt(a.period.slice(1))
      })

    expect(points[0].value).toBe('5.20')
    expect(points[0].period).toBe('M02')
  })
})

describe('unit conversion factor math', () => {
  // These mirror the constants from bls-crosswalk.ts
  const PER_LB     = 100 / 453.592
  const PER_DOZEN  = 100 / 600
  const PER_HALF_GAL = 100 / 1892

  it('converts chicken price per lb to price_per_100g', () => {
    const blsPrice = 5.20  // $/lb
    const pricePer100g = parseFloat((blsPrice * PER_LB).toFixed(6))
    expect(pricePer100g).toBeGreaterThan(1.14)
    expect(pricePer100g).toBeLessThan(1.15)
  })

  it('converts egg price per dozen to price_per_100g', () => {
    const blsPrice = 2.80  // $/dozen
    const pricePer100g = parseFloat((blsPrice * PER_DOZEN).toFixed(6))
    expect(pricePer100g).toBeGreaterThan(0.46)
    expect(pricePer100g).toBeLessThan(0.47)
  })

  it('converts milk price per half-gallon to price_per_100g', () => {
    const blsPrice = 4.50  // $/half-gallon
    const pricePer100g = parseFloat((blsPrice * PER_HALF_GAL).toFixed(6))
    expect(pricePer100g).toBeGreaterThan(0.23)
    expect(pricePer100g).toBeLessThan(0.24)
  })

  it('toFixed(6) preserves enough precision for price_per_100g', () => {
    const pricePer100g = (3.99 * PER_LB).toFixed(6)
    // Should not be 0 or overflow
    expect(parseFloat(pricePer100g)).toBeGreaterThan(0)
    expect(pricePer100g.split('.')[1]).toHaveLength(6)
  })
})

describe.skipIf(SKIP)('BLS seed: database operations', () => {
  it('inserts price data for a test food', async () => {
    const { db } = await import('@/lib/db')
    const { foods, priceData } = await import('@/lib/db/schema')
    const { sql } = await import('drizzle-orm')

    // Insert a test food
    await db.insert(foods).values({
      fdcId: 888001,
      name: 'Test Beef Integration',
      dataSource: 'foundation',
      foodGroup: 'Beef Products',
    }).onConflictDoNothing()

    const foodResult = await db.execute(sql`SELECT id FROM foods WHERE fdc_id = 888001`)
    const food = foodResult.rows[0]
    const foodId = (food as Record<string, string>)?.id

    if (!foodId) {
      throw new Error('Test food not found after insert')
    }

    // Insert price
    await db.insert(priceData).values({
      foodId,
      blsSeriesId: 'TEST_SERIES_001',
      pricePerUnit: '5.99',
      unit: 'per lb',
      pricePer100g: (5.99 * (100 / 453.592)).toFixed(6),
      source: 'bls',
      period: '2025-M02',
      region: 'U.S. city average',
    }).onConflictDoNothing()

    const rows = await db.execute(
      sql`SELECT price_per_100g FROM price_data WHERE bls_series_id = 'TEST_SERIES_001'`
    )
    expect(rows.rows).toHaveLength(1)

    // Cleanup
    await db.execute(sql`DELETE FROM price_data WHERE bls_series_id = 'TEST_SERIES_001'`)
    await db.execute(sql`DELETE FROM foods WHERE fdc_id = 888001`)
  })
})
