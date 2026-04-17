/**
 * Rate-limited queue for fetching food images from /api/images/[foodId].
 * Only rate-limits after actual external API calls (Unsplash/Google),
 * letting cached and sibling responses flow through immediately.
 */

export interface ImageData {
  imageUrl: string | null
  thumbnailUrl: string | null
  photographerName: string | null
  photographerUrl: string | null
  isPlaceholder: boolean
}

type Listener = (data: ImageData) => void

const cache = new Map<string, ImageData>()
const inflight = new Map<string, Promise<ImageData>>()
const queue: string[] = []
const queued = new Set<string>()
const listeners = new Map<string, Set<Listener>>()
let processing = false

const RATE_LIMIT_MS = 3_000

function notifyListeners(foodId: string, data: ImageData) {
  listeners.get(foodId)?.forEach((fn) => fn(data))
}

function toImageData(json: Record<string, unknown>): ImageData {
  return {
    imageUrl: (json.image_url as string) ?? null,
    thumbnailUrl: (json.thumbnail_url as string) ?? null,
    photographerName: (json.photographer_name as string) ?? null,
    photographerUrl: (json.photographer_url as string) ?? null,
    isPlaceholder: json.placeholder === true,
  }
}

const PLACEHOLDER: ImageData = {
  imageUrl: null,
  thumbnailUrl: null,
  photographerName: null,
  photographerUrl: null,
  isPlaceholder: true,
}

async function processQueue() {
  if (processing) return
  processing = true

  while (queue.length > 0) {
    const foodId = queue.shift()!
    queued.delete(foodId)

    if (cache.has(foodId)) {
      notifyListeners(foodId, cache.get(foodId)!)
      continue
    }

    let needsDelay = false

    const promise = fetch(`/api/images/${foodId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        needsDelay = json.api_called === true
        const data = toImageData(json)
        cache.set(foodId, data)
        inflight.delete(foodId)
        notifyListeners(foodId, data)
        return data
      })
      .catch(() => {
        cache.set(foodId, PLACEHOLDER)
        inflight.delete(foodId)
        notifyListeners(foodId, PLACEHOLDER)
        return PLACEHOLDER
      })

    inflight.set(foodId, promise)
    await promise

    // Only rate-limit after responses that actually hit an external API
    if (needsDelay && queue.length > 0) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
    }
  }

  processing = false
}

export function enqueueImageFetch(foodId: string, listener: Listener): () => void {
  const cached = cache.get(foodId)
  if (cached) {
    listener(cached)
    return () => {}
  }

  if (!listeners.has(foodId)) listeners.set(foodId, new Set())
  listeners.get(foodId)!.add(listener)

  if (!inflight.has(foodId) && !queued.has(foodId)) {
    queue.push(foodId)
    queued.add(foodId)
    processQueue()
  }

  return () => {
    listeners.get(foodId)?.delete(listener)
    if (listeners.get(foodId)?.size === 0) listeners.delete(foodId)
    if (queued.has(foodId) && !inflight.has(foodId)) {
      const idx = queue.indexOf(foodId)
      if (idx !== -1) queue.splice(idx, 1)
      queued.delete(foodId)
    }
  }
}

export function getCachedImage(foodId: string): ImageData | undefined {
  return cache.get(foodId)
}

/** Populate the cache from an external fetch (e.g. the detail modal). */
export function setCachedImage(foodId: string, data: ImageData): void {
  cache.set(foodId, data)
}
