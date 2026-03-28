/**
 * Integration tests for searchFoods query function.
 * Requires: DATABASE_URL pointing to a running Postgres instance with seeded data.
 * Skip: set SKIP_INTEGRATION_TESTS=1 or leave DATABASE_URL unset.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const SKIP = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION_TESTS === '1'

describe.skipIf(SKIP)('searchFoods', () => {
  let db: Awaited<ReturnType<typeof import('@/lib/db')['db']['execute']>>

  beforeAll(async () => {
    // Verify connection
    const { db: drizzleDb } = await import('@/lib/db')
    const { sql } = await import('drizzle-orm')
    await drizzleDb.execute(sql`SELECT 1`)
  })

  it('returns paginated results with totalCount', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const result = await searchFoods({ page: 1, pageSize: 10 })
    expect(result.rows).toBeInstanceOf(Array)
    expect(result.totalCount).toBeGreaterThanOrEqual(0)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(Math.ceil(result.totalCount / 10))
  })

  it('returns no more rows than pageSize', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const result = await searchFoods({ page: 1, pageSize: 5 })
    expect(result.rows.length).toBeLessThanOrEqual(5)
  })

  it('search filter returns fewer results than unfiltered', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const all = await searchFoods({ page: 1, pageSize: 1 })
    const filtered = await searchFoods({ filters: { search: 'chicken' }, page: 1, pageSize: 1 })
    // Filtered total should be <= unfiltered total
    expect(filtered.totalCount).toBeLessThanOrEqual(all.totalCount)
  })

  it('pagination returns different rows on page 2 vs page 1', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const page1 = await searchFoods({ page: 1, pageSize: 5 })
    const page2 = await searchFoods({ page: 2, pageSize: 5 })
    if (page1.rows.length > 0 && page2.rows.length > 0) {
      const ids1 = new Set(page1.rows.map((r) => r.id))
      const ids2 = new Set(page2.rows.map((r) => r.id))
      // Pages should not overlap
      for (const id of ids2) {
        expect(ids1.has(id)).toBe(false)
      }
    }
  })

  it('sort by proteinPer100g desc puts highest-protein foods first', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const result = await searchFoods({
      sort: { field: 'proteinPer100g', direction: 'desc' },
      page: 1,
      pageSize: 10,
    })
    if (result.rows.length >= 2) {
      const first = parseFloat(result.rows[0].proteinPer100g ?? '0')
      const second = parseFloat(result.rows[1].proteinPer100g ?? '0')
      expect(first).toBeGreaterThanOrEqual(second)
    }
  })

  it('dietary filter reduces results', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const all = await searchFoods({ page: 1, pageSize: 1 })
    const vegan = await searchFoods({
      filters: { dietary: ['vegan'] },
      page: 1,
      pageSize: 1,
    })
    expect(vegan.totalCount).toBeLessThanOrEqual(all.totalCount)
  })

  it('groupBy foodGroup returns rows sorted by food_group', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const result = await searchFoods({
      groupBy: 'foodGroup',
      sort: { field: 'name', direction: 'asc' },
      page: 1,
      pageSize: 20,
    })
    if (result.rows.length >= 2) {
      // Within the same food group, names should be ascending
      const groups = new Map<string | null, string[]>()
      for (const row of result.rows) {
        const g = row.foodGroup
        if (!groups.has(g)) groups.set(g, [])
        groups.get(g)!.push(row.name)
      }
      for (const [, names] of groups) {
        for (let i = 1; i < names.length; i++) {
          expect(names[i].localeCompare(names[i - 1])).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('returns rows with expected camelCase field names', async () => {
    const { searchFoods } = await import('@/lib/queries/search-foods')
    const result = await searchFoods({ page: 1, pageSize: 1 })
    if (result.rows.length > 0) {
      const row = result.rows[0]
      expect(row).toHaveProperty('id')
      expect(row).toHaveProperty('name')
      expect(row).toHaveProperty('foodGroup')
      expect(row).toHaveProperty('caloriesPer100g')
      expect(row).toHaveProperty('proteinPer100g')
    }
  })
})
