import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { foodImages, foods } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

const UNSPLASH_API_BASE = 'https://api.unsplash.com'
const PEXELS_API_BASE = 'https://api.pexels.com/v1'

interface UnsplashPhoto {
  urls: { small: string; thumb: string }
  user: { name: string; links: { html: string } }
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[]
  total: number
}

interface PexelsPhoto {
  src: { medium: string; small: string }
  photographer: string
  photographer_url: string
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[]
  total_results: number
}

/**
 * Simplify a verbose USDA food name to a short search term.
 * "Oranges, raw, navels" → "Oranges"
 * "Cheese, cheddar (aged)" → "Cheese"
 */
function simplifyFoodName(name: string): string {
  return name.split(',')[0].replace(/\s*\(.*?\)\s*/g, '').trim()
}

/** Upsert into food_images and return a JSON response. */
async function saveAndRespond(
  foodId: string,
  imageUrl: string,
  thumbnailUrl: string,
  source: 'unsplash' | 'google' | 'pexels' | 'manual',
  photographerName: string | null,
  photographerUrl: string | null,
  extra: Record<string, unknown> = {},
) {
  await db
    .insert(foodImages)
    .values({ foodId, imageUrl, thumbnailUrl, source, photographerName, photographerUrl })
    .onConflictDoUpdate({
      target: foodImages.foodId,
      set: { imageUrl, thumbnailUrl, photographerName, photographerUrl, fetchedAt: new Date() },
    })

  return NextResponse.json({
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
    source,
    photographer_name: photographerName,
    photographer_url: photographerUrl,
    ...extra,
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  const { foodId } = await params

  // Cache hit — return stored image without calling external APIs
  const cached = await db
    .select()
    .from(foodImages)
    .where(eq(foodImages.foodId, foodId))
    .limit(1)

  if (cached.length > 0) {
    const img = cached[0]
    return NextResponse.json({
      image_url: img.imageUrl,
      thumbnail_url: img.thumbnailUrl,
      source: img.source,
      photographer_name: img.photographerName,
      photographer_url: img.photographerUrl,
      cached: true,
    })
  }

  // Resolve food name for search query
  const [food] = await db
    .select({ name: foods.name, foodGroup: foods.foodGroup })
    .from(foods)
    .where(eq(foods.id, foodId))
    .limit(1)

  if (!food) {
    return NextResponse.json({ error: 'Food not found' }, { status: 404 })
  }

  const simplified = simplifyFoodName(food.name)

  // Check if a sibling food with the same simplified name already has an image.
  // Uses regexp_replace + split_part to mirror the JS simplifyFoodName logic,
  // so names like "Cheese (imported), aged" correctly simplify to "Cheese".
  const [sibling] = await db
    .select({
      imageUrl: foodImages.imageUrl,
      thumbnailUrl: foodImages.thumbnailUrl,
      source: foodImages.source,
      photographerName: foodImages.photographerName,
      photographerUrl: foodImages.photographerUrl,
    })
    .from(foodImages)
    .innerJoin(foods, eq(foods.id, foodImages.foodId))
    .where(
      sql`trim(regexp_replace(split_part(${foods.name}, ',', 1), '\\s*\\(.*?\\)\\s*', '', 'g')) = ${simplified}`
    )
    .limit(1)

  if (sibling) {
    return saveAndRespond(
      foodId,
      sibling.imageUrl,
      sibling.thumbnailUrl,
      sibling.source as 'unsplash' | 'google' | 'pexels' | 'manual',
      sibling.photographerName,
      sibling.photographerUrl,
      { cached: true },
    )
  }

  // --- Try Unsplash ---
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (unsplashKey) {
    try {
      const query = encodeURIComponent(`${simplified} food`)
      const response = await fetch(
        `${UNSPLASH_API_BASE}/search/photos?query=${query}&per_page=1&orientation=landscape`,
        {
          headers: { Authorization: `Client-ID ${unsplashKey}` },
          signal: AbortSignal.timeout(5000),
        }
      )

      if (response.ok) {
        const data: UnsplashSearchResponse = await response.json()
        const photo = data.results[0]
        if (photo) {
          // Use urls.small (400px) instead of urls.regular (1080px) for faster loading
          return saveAndRespond(
            foodId,
            photo.urls.small,
            photo.urls.thumb,
            'unsplash',
            photo.user.name,
            photo.user.links.html,
            { api_called: true },
          )
        }
      }
      // Rate-limited, auth error, or 0 results → fall through to Google
    } catch {
      // Unsplash failed → fall through to Google
    }
  }

  // --- Fallback: Pexels ---
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const query = encodeURIComponent(`${simplified} food`)
      const response = await fetch(
        `${PEXELS_API_BASE}/search?query=${query}&per_page=1&orientation=landscape`,
        {
          headers: { Authorization: pexelsKey },
          signal: AbortSignal.timeout(5000),
        }
      )

      if (response.ok) {
        const data: PexelsSearchResponse = await response.json()
        const photo = data.photos[0]
        if (photo) {
          return saveAndRespond(
            foodId,
            photo.src.medium,
            photo.src.small,
            'pexels',
            photo.photographer,
            photo.photographer_url,
            { api_called: true },
          )
        }
      }
    } catch {
      // Pexels search failed → return placeholder
    }
  }

  return NextResponse.json(
    { placeholder: true, food_group: food.foodGroup },
    { status: 200 }
  )
}
