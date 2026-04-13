'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FoodComputed } from '@/types/food'
import type { ColumnKey } from '@/types/table'

const COLUMN_LABELS: Record<ColumnKey, string> = {
  name: 'Name',
  foodGroup: 'Food Group',
  caloriesPer100g: 'Calories',
  proteinPer100g: 'Protein',
  fatPer100g: 'Fat',
  carbsPer100g: 'Carbs',
  fiberPer100g: 'Fiber',
  sugarPer100g: 'Sugars',
  sodiumPer100g: 'Sodium',
  calciumPer100g: 'Calcium',
  ironPer100g: 'Iron',
  pricePer100g: 'Price',
  proteinPerDollar: 'Protein / $',
  servingSizeG: 'Serving Size',
  dataSource: 'Data Source',
}

function formatValue(food: FoodComputed, key: ColumnKey): string {
  const value = food[key as keyof FoodComputed]
  if (value == null) return '—'
  switch (key) {
    case 'caloriesPer100g': {
      const n = parseFloat(value as string)
      return isNaN(n) ? '—' : `${n.toFixed(0)} kcal`
    }
    case 'sodiumPer100g':
    case 'calciumPer100g': {
      const n = parseFloat(value as string)
      return isNaN(n) ? '—' : `${n.toFixed(0)} mg`
    }
    case 'ironPer100g': {
      const n = parseFloat(value as string)
      return isNaN(n) ? '—' : `${n.toFixed(1)} mg`
    }
    case 'proteinPer100g':
    case 'fatPer100g':
    case 'carbsPer100g':
    case 'fiberPer100g':
    case 'sugarPer100g':
    case 'proteinPerDollar': {
      const n = parseFloat(value as string)
      return isNaN(n) ? '—' : `${n.toFixed(1)}g`
    }
    case 'pricePer100g': {
      const n = parseFloat(value as string)
      return isNaN(n) ? '—' : `$${n.toFixed(2)}`
    }
    case 'servingSizeG': {
      const n = parseFloat(value as string)
      return isNaN(n) ? '—' : `${n.toFixed(0)}g`
    }
    case 'dataSource':
      return String(value).toUpperCase()
    default:
      return String(value)
  }
}

interface MobileRowProps {
  food: FoodComputed
  visibleColumns: ColumnKey[]
  extraNutrients?: string[]
  onOpenDetail: (id: string) => void
}

export function MobileRow({ food, visibleColumns, extraNutrients = [], onOpenDetail }: MobileRowProps) {
  const [expanded, setExpanded] = React.useState(false)

  // Columns to show in the expanded section (exclude summary fields)
  const summaryKeys: ColumnKey[] = ['name', 'foodGroup', 'caloriesPer100g', 'proteinPer100g']
  const expandedColumns = visibleColumns.filter((k) => !summaryKeys.includes(k))

  const thumbnailSrc = food.thumbnailUrl ?? food.imageUrl

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        {/* Thumbnail */}
        {thumbnailSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailSrc}
            alt={food.name}
            className="size-12 rounded object-cover shrink-0"
          />
        ) : (
          <div className="size-12 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0">
            ?
          </div>
        )}

        {/* Name + food group + quick stats */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="font-medium text-sm text-foreground hover:underline text-left truncate block max-w-full"
            onClick={(e) => {
              e.stopPropagation()
              onOpenDetail(food.id)
            }}
          >
            {food.name}
          </button>
          {food.foodGroup && (
            <p className="text-xs text-muted-foreground truncate">{food.foodGroup}</p>
          )}
          <div className="flex items-center gap-3 mt-0.5">
            {food.caloriesPer100g && (
              <span className="text-xs">
                <span className="text-muted-foreground">Cal: </span>
                <span className="font-mono tabular-nums">
                  {parseFloat(food.caloriesPer100g).toFixed(0)}
                </span>
              </span>
            )}
            {food.proteinPer100g && (
              <span className="text-xs">
                <span className="text-muted-foreground">Pro: </span>
                <span className="font-mono tabular-nums">
                  {parseFloat(food.proteinPer100g).toFixed(1)}g
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Expand/collapse icon */}
        <div className="shrink-0">
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded key-value list */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          expanded ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="px-3 pb-3 pt-2 border-t border-border/50 space-y-1.5">
          {expandedColumns.length > 0 ? (
            expandedColumns.map((key) => (
              <div key={key} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{COLUMN_LABELS[key]}</span>
                <span className="font-mono tabular-nums">{formatValue(food, key)}</span>
              </div>
            ))
          ) : extraNutrients.length === 0 ? (
            <p className="text-xs text-muted-foreground">No additional columns visible.</p>
          ) : null}
          {extraNutrients.map((name) => {
            const val = food.extraNutrients?.[name]
            return (
              <div key={name} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground truncate mr-2">{name}</span>
                <span className="font-mono tabular-nums shrink-0">
                  {val != null ? parseFloat(val).toFixed(1) : '—'}
                </span>
              </div>
            )
          })}
          <button
            type="button"
            className="w-full mt-2 text-xs text-left underline text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onOpenDetail(food.id)}
          >
            View full nutrition breakdown →
          </button>
        </div>
      </div>
    </div>
  )
}
