'use client'

import * as React from 'react'
import Image from 'next/image'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

// Tiny gray SVG as blur placeholder for remote images
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+'

interface FoodImageProps {
  src: string | null | undefined
  alt: string
  photographerName?: string | null
  photographerUrl?: string | null
  showAttribution?: boolean
  className?: string
}

export function FoodImage({
  src,
  alt,
  photographerName,
  photographerUrl,
  showAttribution = false,
  className,
}: FoodImageProps) {
  const [error, setError] = React.useState(false)

  if (!src || error) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="relative w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
          <Utensils className="size-12 text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          onError={() => setError(true)}
          sizes="(max-width: 640px) 100vw, 400px"
        />
      </div>
      {showAttribution && photographerName && (
        <p className="text-xs text-muted-foreground text-center">
          Photo by{' '}
          {photographerUrl ? (
            <a
              href={photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              {photographerName}
            </a>
          ) : (
            photographerName
          )}{' '}
          on{' '}
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Unsplash
          </a>
        </p>
      )}
    </div>
  )
}
