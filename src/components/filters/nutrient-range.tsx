'use client'

import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { NUTRIENTS } from '@/lib/constants'
import type { NutrientRangeFilter } from '@/types/filters'
import type { FilterOptions } from '@/lib/queries/get-filter-options'
import { Button } from '@/components/ui/button'

interface NutrientRangeProps {
  ranges: NutrientRangeFilter[]
  bounds: FilterOptions['nutrientRanges'] | null
  onChange: (ranges: NutrientRangeFilter[]) => void
}

export function NutrientRange({ ranges, bounds, onChange }: NutrientRangeProps) {
  const [selectedNutrient, setSelectedNutrient] = React.useState('')

  const availableNutrients = NUTRIENTS.filter((n) => !ranges.some((r) => r.nutrient === n.key))

  function addNutrient() {
    if (!selectedNutrient) return
    onChange([...ranges, { nutrient: selectedNutrient }])
    setSelectedNutrient('')
  }

  function removeRange(nutrient: string) {
    onChange(ranges.filter((r) => r.nutrient !== nutrient))
  }

  function updateRange(nutrient: string, field: 'min' | 'max', value: string) {
    const num = value ? parseFloat(value) : undefined
    onChange(ranges.map((r) => (r.nutrient === nutrient ? { ...r, [field]: num } : r)))
  }

  return (
    <div className="space-y-4">
      {ranges.map((range) => {
        const nutrientMeta = NUTRIENTS.find((n) => n.key === range.nutrient)
        const label = nutrientMeta?.displayName ?? range.nutrient
        const unit = nutrientMeta?.unit ?? ''
        const b = bounds?.[range.nutrient as keyof typeof bounds] as
          | { min: number; max: number }
          | undefined

        return (
          <div key={range.nutrient} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {label}{' '}
                <span className="text-xs font-normal text-muted-foreground">({unit})</span>
              </span>
              <button
                onClick={() => removeRange(range.nutrient)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                aria-label={`Remove ${label} filter`}
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Min</label>
                <input
                  type="number"
                  value={range.min ?? ''}
                  placeholder={b ? String(Math.floor(b.min)) : '0'}
                  onChange={(e) => updateRange(range.nutrient, 'min', e.target.value)}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
              <span className="text-muted-foreground mb-1.5">–</span>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Max</label>
                <input
                  type="number"
                  value={range.max ?? ''}
                  placeholder={b ? String(Math.ceil(b.max)) : ''}
                  onChange={(e) => updateRange(range.nutrient, 'max', e.target.value)}
                  className="w-full h-8 rounded border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            </div>
          </div>
        )
      })}

      {availableNutrients.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedNutrient}
            onChange={(e) => setSelectedNutrient(e.target.value)}
            className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
          >
            <option value="">Add nutrient filter…</option>
            {availableNutrients.map((n) => (
              <option key={n.key} value={n.key}>
                {n.displayName} ({n.unit})
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={addNutrient}
            disabled={!selectedNutrient}
            className="h-8 px-2 shrink-0"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      )}

      {ranges.length === 0 && availableNutrients.length === 0 && (
        <p className="text-sm text-muted-foreground">All nutrients have filters applied.</p>
      )}
    </div>
  )
}
