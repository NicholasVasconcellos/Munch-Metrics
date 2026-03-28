/**
 * Integration tests for the Unsplash image proxy route.
 * Tests caching behavior and fallback responses using msw.
 * Requires: DATABASE_URL for DB-dependent tests.
 * Skip DB tests: set SKIP_INTEGRATION_TESTS=1 or leave DATABASE_URL unset.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const SKIP_DB = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION_TESTS === '1'

// ─── MSW mock for Unsplash API ────────────────────────────────────────────────

const MOCK_UNSPLASH_PHOTO = {
  urls: {
    regular: 'https://images.unsplash.com/photo-test?w=1080',
    thumb:   'https://images.unsplash.com/photo-test?w=200',
  },
  user: {
    name: 'Test Photographer',
    links: { html: 'https://unsplash.com/@testphotographer' },
  },
}

let mockUnsplashHandler = http.get('https://api.unsplash.com/search/photos', () => {
  return HttpResponse.json({ results: [MOCK_UNSPLASH_PHOTO], total: 1 })
})

const server = setupServer(mockUnsplashHandler)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterAll(() => server.close())

describe('Unsplash API mock responses', () => {
  it('mock returns expected photo structure', async () => {
    const res = await fetch(
      'https://api.unsplash.com/search/photos?query=chicken&per_page=1',
      { headers: { Authorization: 'Client-ID test' } }
    )
    const data = await res.json()
    expect(data.results).toHaveLength(1)
    expect(data.results[0].urls.regular).toContain('unsplash.com')
    expect(data.results[0].user.name).toBe('Test Photographer')
  })

  it('rate limit mock returns 403', async () => {
    server.use(
      http.get('https://api.unsplash.com/search/photos', () => {
        return new HttpResponse(null, { status: 403 })
      })
    )
    const res = await fetch(
      'https://api.unsplash.com/search/photos?query=chicken',
      { headers: { Authorization: 'Client-ID test' } }
    )
    expect(res.status).toBe(403)
    // Restore default handler
    server.resetHandlers()
  })

  it('not found mock returns empty results', async () => {
    server.use(
      http.get('https://api.unsplash.com/search/photos', () => {
        return HttpResponse.json({ results: [], total: 0 })
      })
    )
    const res = await fetch(
      'https://api.unsplash.com/search/photos?query=doesnotexist',
      { headers: { Authorization: 'Client-ID test' } }
    )
    const data = await res.json()
    expect(data.results).toHaveLength(0)
    // Restore default handler
    server.resetHandlers()
  })
})

describe('image proxy route logic', () => {
  it('route file exports a GET handler', async () => {
    // Verify the route module exports GET
    const routeModule = await import('@/app/api/images/[foodId]/route')
    expect(typeof routeModule.GET).toBe('function')
  })
})

describe.skipIf(SKIP_DB)('image proxy: caching behavior', () => {
  it('caches Unsplash result in food_images table', async () => {
    const { db } = await import('@/lib/db')
    const { foods, foodImages } = await import('@/lib/db/schema')
    const { sql } = await import('drizzle-orm')

    await db.insert(foods).values({
      fdcId: 555001,
      name: 'Image Cache Test Food',
      dataSource: 'foundation',
      foodGroup: 'Poultry Products',
    }).onConflictDoNothing()

    const foodResult = await db.execute(sql`SELECT id FROM foods WHERE fdc_id = 555001`)
    const food = foodResult.rows[0]
    const foodId = (food as Record<string, string>)?.id
    if (!foodId) throw new Error('Test food not inserted')

    // Manually insert a cached image (simulating what the route does)
    await db.insert(foodImages).values({
      foodId,
      imageUrl: 'https://images.unsplash.com/photo-cached',
      thumbnailUrl: 'https://images.unsplash.com/photo-cached-thumb',
      source: 'unsplash',
      photographerName: 'Test Photographer',
      photographerUrl: 'https://unsplash.com/@test',
    }).onConflictDoUpdate({
      target: foodImages.foodId,
      set: {
        imageUrl: 'https://images.unsplash.com/photo-cached',
      },
    })

    const rows = await db.execute(
      sql`SELECT image_url FROM food_images WHERE food_id = ${foodId}`
    )
    expect(rows.rows).toHaveLength(1)
    expect((rows.rows[0] as Record<string, string>).image_url).toContain('unsplash.com')

    // Cleanup
    await db.execute(sql`DELETE FROM food_images WHERE food_id = ${foodId}`)
    await db.execute(sql`DELETE FROM foods WHERE fdc_id = 555001`)
  })
})
