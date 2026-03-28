import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { foodImages, foods } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const UNSPLASH_API_BASE = 'https://api.unsplash.com'

interface UnsplashPhoto {
  urls: { regular: string; thumb: string }
  user: { name: string; links: { html: string } }
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[]
  total: number
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  const { foodId } = await params

  // Cache hit — return stored image data without calling Unsplash
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

  // Resolve food name for Unsplash search query
  const [food] = await db
    .select({ name: foods.name, foodGroup: foods.foodGroup })
    .from(foods)
    .where(eq(foods.id, foodId))
    .limit(1)

  if (!food) {
    return NextResponse.json({ error: 'Food not found' }, { status: 404 })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return NextResponse.json(
      { placeholder: true, food_group: food.foodGroup },
      { status: 200 }
    )
  }

  try {
    const query = encodeURIComponent(food.name)
    const response = await fetch(
      `${UNSPLASH_API_BASE}/search/photos?query=${query}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: AbortSignal.timeout(5000),
      }
    )

    // Rate limit or auth error — return placeholder without throwing
    if (response.status === 403 || response.status === 429) {
      return NextResponse.json(
        { placeholder: true, food_group: food.foodGroup },
        { status: 200 }
      )
    }

    if (!response.ok) {
      throw new Error(`Unsplash API responded with ${response.status}`)
    }

    const data: UnsplashSearchResponse = await response.json()
    const photo = data.results[0]

    if (!photo) {
      return NextResponse.json(
        { placeholder: true, food_group: food.foodGroup },
        { status: 200 }
      )
    }

    // Cache result in food_images table
    await db
      .insert(foodImages)
      .values({
        foodId,
        imageUrl: photo.urls.regular,
        thumbnailUrl: photo.urls.thumb,
        source: 'unsplash',
        photographerName: photo.user.name,
        photographerUrl: photo.user.links.html,
      })
      .onConflictDoUpdate({
        target: foodImages.foodId,
        set: {
          imageUrl: photo.urls.regular,
          thumbnailUrl: photo.urls.thumb,
          photographerName: photo.user.name,
          photographerUrl: photo.user.links.html,
          fetchedAt: new Date(),
        },
      })

    return NextResponse.json({
      image_url: photo.urls.regular,
      thumbnail_url: photo.urls.thumb,
      source: 'unsplash',
      photographer_name: photo.user.name,
      photographer_url: photo.user.links.html,
      cached: false,
    })
  } catch (err) {
    console.error('[image proxy] Unsplash fetch failed:', err)
    return NextResponse.json(
      { placeholder: true, food_group: food.foodGroup },
      { status: 200 }
    )
  }
}
