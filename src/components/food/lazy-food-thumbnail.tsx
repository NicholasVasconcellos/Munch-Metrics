'use client'

import * as React from 'react'
import { enqueueImageFetch, getCachedImage, type ImageData } from '@/lib/image-fetch-queue'

interface LazyFoodThumbnailProps {
  foodId: string
  existingUrl: string | null | undefined
  alt: string
  size?: number
  className?: string
}

/**
 * Displays a food thumbnail image. If no image URL is available from the
 * server, lazily fetches one via the image API when the element becomes visible.
 */
export function LazyFoodThumbnail({
  foodId,
  existingUrl,
  alt,
  size = 40,
  className,
}: LazyFoodThumbnailProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [imageData, setImageData] = React.useState<ImageData | null>(() =>
    getCachedImage(foodId) ?? null
  )

  const needsFetch = !existingUrl && !imageData

  React.useEffect(() => {
    if (!needsFetch) return
    const el = ref.current
    if (!el) return

    let cleanup: (() => void) | undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          cleanup = enqueueImageFetch(foodId, setImageData)
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      cleanup?.()
    }
  }, [foodId, needsFetch])

  const url = existingUrl ?? imageData?.thumbnailUrl ?? imageData?.imageUrl

  const sizeClass = size === 48 ? 'size-12' : 'size-10'
  const baseClass = `${sizeClass} rounded object-cover shrink-0`

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={className ?? baseClass}
        loading="lazy"
      />
    )
  }

  return (
    <div
      ref={ref}
      className={className ?? `${sizeClass} rounded bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0`}
    >
      {imageData ? '?' : ''}
    </div>
  )
}
