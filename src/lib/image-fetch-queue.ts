/**
 * Rate-limited queue for fetching food images from /api/images/[foodId].
 * Prevents overwhelming the Unsplash free-tier limit (50 req/hour)
 * by processing at most one request every 3 seconds and deduplicating.
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
const listeners = new Map<string, Set<Listener>>()
let processing = false

const INTERVAL_MS = 3000

function notifyListeners(foodId: string, data: ImageData) {
  listeners.get(foodId)?.forEach((fn) => fn(data))
}

async function processQueue() {
  if (processing) return
  processing = true

  while (queue.length > 0) {
    const foodId = queue.shift()!

    // May have been resolved while waiting in the queue
    if (cache.has(foodId)) {
      notifyListeners(foodId, cache.get(foodId)!)
      continue
    }

    const promise = fetch(`/api/images/${foodId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const data: ImageData = {
          imageUrl: json.image_url ?? null,
          thumbnailUrl: json.thumbnail_url ?? null,
          photographerName: json.photographer_name ?? null,
          photographerUrl: json.photographer_url ?? null,
          isPlaceholder: json.placeholder === true,
        }
        cache.set(foodId, data)
        inflight.delete(foodId)
        notifyListeners(foodId, data)
        return data
      })
      .catch(() => {
        const data: ImageData = {
          imageUrl: null,
          thumbnailUrl: null,
          photographerName: null,
          photographerUrl: null,
          isPlaceholder: true,
        }
        cache.set(foodId, data)
        inflight.delete(foodId)
        notifyListeners(foodId, data)
        return data
      })

    inflight.set(foodId, promise)
    await promise

    // Rate-limit: wait before processing next item
    if (queue.length > 0) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS))
    }
  }

  processing = false
}

export function enqueueImageFetch(foodId: string, listener: Listener): () => void {
  // Already cached — notify immediately
  const cached = cache.get(foodId)
  if (cached) {
    listener(cached)
    return () => {}
  }

  // Register listener
  if (!listeners.has(foodId)) listeners.set(foodId, new Set())
  listeners.get(foodId)!.add(listener)

  // Add to queue if not already queued or in-flight
  if (!inflight.has(foodId) && !queue.includes(foodId)) {
    queue.push(foodId)
    processQueue()
  }

  // Cleanup: remove listener and dequeue if possible
  return () => {
    listeners.get(foodId)?.delete(listener)
    if (listeners.get(foodId)?.size === 0) listeners.delete(foodId)
    const idx = queue.indexOf(foodId)
    if (idx !== -1 && !inflight.has(foodId)) queue.splice(idx, 1)
  }
}

export function getCachedImage(foodId: string): ImageData | undefined {
  return cache.get(foodId)
}
