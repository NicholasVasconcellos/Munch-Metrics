'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FoodImage } from './food-image'
import { getFoodDetail, type FoodDetailResult } from '@/lib/queries/get-food-detail'
import { setCachedImage } from '@/lib/image-fetch-queue'
import type { Nutrient } from '@/types/food'

interface FoodDetailModalProps {
  foodId: string | null
  onClose: () => void
}

function formatAmount(amount: string | null | undefined, unit: string | null | undefined): string {
  if (amount == null) return '—'
  const n = parseFloat(amount)
  if (isNaN(n)) return '—'
  const formatted = n < 0.01 ? n.toFixed(4) : n < 1 ? n.toFixed(3) : n.toFixed(1)
  return unit ? `${formatted} ${unit}` : formatted
}

function NutrientRow({ nutrient }: { nutrient: Nutrient }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
      <span className="text-sm text-foreground">{nutrient.nutrientName}</span>
      <span className="text-sm font-mono tabular-nums text-muted-foreground">
        {formatAmount(nutrient.per100g, nutrient.unit)}
      </span>
    </div>
  )
}

function NutrientSection({ title, nutrients }: { title: string; nutrients: Nutrient[] }) {
  if (nutrients.length === 0) return null
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-3 first:mt-0">
        {title}
      </h4>
      {nutrients.map((n) => (
        <NutrientRow key={n.id} nutrient={n} />
      ))}
    </div>
  )
}

function priceSourceLabel(source: string | null | undefined): string {
  if (source === 'bls') return 'BLS Actual'
  if (source === 'usda_estimate') return 'Category Estimate'
  if (source === 'manual') return 'Manual Entry'
  return 'Unknown'
}

function ModalContent({ detail }: { detail: FoodDetailResult }) {
  const { food, nutrients, price, image, tags } = detail

  // Find calorie/protein per100g from macronutrients for computed metrics
  const calNutrient = nutrients.macronutrients.find((n) =>
    /energy|calori/i.test(n.nutrientName)
  )
  const proNutrient = nutrients.macronutrients.find((n) =>
    /^protein$/i.test(n.nutrientName)
  )

  const pricePer100g = price?.pricePer100g ? parseFloat(price.pricePer100g) : null
  const caloriesPerDollar =
    calNutrient?.per100g && pricePer100g
      ? (parseFloat(calNutrient.per100g) / pricePer100g).toFixed(0)
      : null
  const proteinPerDollar =
    proNutrient?.per100g && pricePer100g
      ? (parseFloat(proNutrient.per100g) / pricePer100g).toFixed(1)
      : null

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl leading-tight pr-8">{food.name}</DialogTitle>
        {food.description && (
          <p className="text-sm text-muted-foreground mt-1">{food.description}</p>
        )}
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Left: image + basics */}
        <div className="flex flex-col gap-4">
          <FoodImage
            src={image?.imageUrl}
            alt={food.name}
            photographerName={image?.photographerName}
            photographerUrl={image?.photographerUrl}
            source={image?.source}
            showAttribution
          />

          {/* Basic info */}
          <div className="space-y-1.5 text-sm">
            {food.foodGroup && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Food Group</span>
                <span className="text-right">{food.foodGroup}</span>
              </div>
            )}
            {food.foodSubgroup && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Subgroup</span>
                <span className="text-right">{food.foodSubgroup}</span>
              </div>
            )}
            {food.dataSource && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Data Source</span>
                <span className="uppercase text-xs tracking-wide">{food.dataSource}</span>
              </div>
            )}
            {food.servingSizeG && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Serving Size</span>
                <span className="font-mono">
                  {parseFloat(food.servingSizeG).toFixed(0)}
                  {food.servingUnit ? ` ${food.servingUnit}` : 'g'}
                </span>
              </div>
            )}
          </div>

          {/* Price + computed metrics */}
          {price && price.pricePer100g && (
            <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
              <div className="flex justify-between items-start gap-2">
                <span className="text-muted-foreground shrink-0">Price / 100g</span>
                <div className="text-right">
                  <span className="font-mono">
                    ${parseFloat(price.pricePer100g).toFixed(2)}
                  </span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({priceSourceLabel(price.source)})
                  </span>
                </div>
              </div>
              {caloriesPerDollar && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Calories / $</span>
                  <span className="font-mono">{caloriesPerDollar} kcal</span>
                </div>
              )}
              {proteinPerDollar && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Protein / $</span>
                  <span className="font-mono">{proteinPerDollar}g</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag.tagValue.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: nutrients by category */}
        <div className="overflow-y-auto max-h-[500px] pr-1">
          <NutrientSection title="Macronutrients" nutrients={nutrients.macronutrients} />
          <NutrientSection title="Vitamins" nutrients={nutrients.vitamins} />
          <NutrientSection title="Minerals" nutrients={nutrients.minerals} />
          <NutrientSection title="Amino Acids" nutrients={nutrients.aminoAcids} />
          <NutrientSection title="Fatty Acids" nutrients={nutrients.fattyAcids} />
          {nutrients.other.length > 0 && (
            <NutrientSection title="Other" nutrients={nutrients.other} />
          )}
        </div>
      </div>
    </>
  )
}

export function FoodDetailModal({ foodId, onClose }: FoodDetailModalProps) {
  const [detail, setDetail] = React.useState<FoodDetailResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [notFound, setNotFound] = React.useState(false)

  React.useEffect(() => {
    if (!foodId) {
      setDetail(null)
      setNotFound(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setDetail(null)
    setNotFound(false)
    getFoodDetail(foodId).then(async (result) => {
      if (cancelled) return
      if (!result) {
        setIsLoading(false)
        setNotFound(true)
        return
      }

      // If no cached image, fetch one from the image API
      if (!result.image) {
        try {
          const res = await fetch(`/api/images/${foodId}`)
          if (!cancelled && res.ok) {
            const json = await res.json()
            if (json.image_url) {
              result = {
                ...result,
                image: {
                  id: '',
                  foodId,
                  imageUrl: json.image_url,
                  thumbnailUrl: json.thumbnail_url ?? null,
                  source: json.source ?? 'unsplash',
                  photographerName: json.photographer_name ?? null,
                  photographerUrl: json.photographer_url ?? null,
                  fetchedAt: new Date(),
                },
              }
              // Share with the thumbnail queue cache so the table row
              // doesn't re-fetch the same image
              setCachedImage(foodId, {
                imageUrl: json.image_url,
                thumbnailUrl: json.thumbnail_url ?? null,
                photographerName: json.photographer_name ?? null,
                photographerUrl: json.photographer_url ?? null,
                isPlaceholder: false,
              })
            }
          }
        } catch {
          // Image fetch failed — continue without image
        }
      }

      if (cancelled) return
      setIsLoading(false)
      setDetail(result)
    })
    return () => {
      cancelled = true
    }
  }, [foodId])

  return (
    <Dialog open={foodId !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <DialogTitle className="sr-only">Loading food details</DialogTitle>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : notFound ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <DialogTitle className="sr-only">Food not found</DialogTitle>
            Food not found.
          </div>
        ) : detail ? (
          <ModalContent detail={detail} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
