'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NUTRIENTS } from '@/lib/constants'
import type { FoodFilters } from '@/types/filters'
import { cn } from '@/lib/utils'

const DIETARY_LABELS: Record<string, string> = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  gluten_free: 'Gluten Free',
  dairy_free: 'Dairy Free',
  nut_free: 'Nut Free',
  low_sodium: 'Low Sodium',
  low_fat: 'Low Fat',
  high_protein: 'High Protein',
  keto: 'Keto',
  paleo: 'Paleo',
}

const ALLERGEN_LABELS: Record<string, string> = {
  milk: 'Milk',
  eggs: 'Eggs',
  fish: 'Fish',
  shellfish: 'Shellfish',
  tree_nuts: 'Tree Nuts',
  peanuts: 'Peanuts',
  wheat: 'Wheat',
  soybeans: 'Soy',
  sesame: 'Sesame',
}

const PROCESSING_LABELS: Record<string, string> = {
  unprocessed: 'Unprocessed',
  minimally_processed: 'Min. Processed',
  processed: 'Processed',
  ultra_processed: 'Ultra Processed',
}

interface FilterChipProps {
  label: string
  onRemove: () => void
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-border transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

export interface FilterBarProps {
  filters: FoodFilters
  onRemove: (type: string, value: string) => void
  onOpenPanel: () => void
  onClearAll?: () => void
}

export function FilterBar({ filters, onRemove, onOpenPanel, onClearAll }: FilterBarProps) {
  const chips: { label: string; type: string; value: string }[] = []

  for (const tag of filters.dietary ?? []) {
    chips.push({ label: DIETARY_LABELS[tag] ?? tag, type: 'dietary', value: tag })
  }
  for (const allergen of filters.excludeAllergens ?? []) {
    chips.push({
      label: `No ${ALLERGEN_LABELS[allergen] ?? allergen}`,
      type: 'allergen',
      value: allergen,
    })
  }
  for (const group of filters.foodGroups ?? []) {
    chips.push({ label: group, type: 'foodGroup', value: group })
  }
  for (const level of filters.processingLevels ?? []) {
    chips.push({
      label: PROCESSING_LABELS[level] ?? level,
      type: 'processingLevel',
      value: level,
    })
  }
  for (const range of filters.nutrientRanges ?? []) {
    const nutrientMeta = NUTRIENTS.find((n) => n.key === range.nutrient)
    const label = nutrientMeta?.displayName ?? range.nutrient
    const unit = nutrientMeta?.unit ?? ''
    let rangeLabel: string
    if (range.min !== undefined && range.max !== undefined) {
      rangeLabel = `${label}: ${range.min}–${range.max}${unit}`
    } else if (range.min !== undefined) {
      rangeLabel = `${label} ≥ ${range.min}${unit}`
    } else if (range.max !== undefined) {
      rangeLabel = `${label} ≤ ${range.max}${unit}`
    } else {
      rangeLabel = label
    }
    chips.push({ label: rangeLabel, type: 'nutrientRange', value: range.nutrient })
  }

  const hasFilters = chips.length > 0

  return (
    <div className={cn('flex flex-wrap items-center gap-2 px-1', hasFilters ? 'py-1.5' : 'py-0.5')}>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenPanel}
        className="h-7 gap-1.5 text-xs shrink-0"
      >
        <SlidersHorizontal className="size-3" />
        Filters
      </Button>

      {chips.map(({ label, type, value }) => (
        <FilterChip
          key={`${type}-${value}`}
          label={label}
          onRemove={() => onRemove(type, value)}
        />
      ))}

      {hasFilters && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
