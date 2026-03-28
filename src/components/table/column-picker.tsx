'use client'

import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ColumnKey } from '@/types/table'

interface ColumnMeta {
  key: ColumnKey
  label: string
}

const COLUMN_OPTIONS: ColumnMeta[] = [
  { key: 'name', label: 'Name' },
  { key: 'caloriesPer100g', label: 'Calories' },
  { key: 'proteinPer100g', label: 'Protein' },
  { key: 'fatPer100g', label: 'Fat' },
  { key: 'carbsPer100g', label: 'Carbs' },
  { key: 'foodGroup', label: 'Food Group' },
  { key: 'fiberPer100g', label: 'Fiber' },
  { key: 'sugarPer100g', label: 'Sugars' },
  { key: 'sodiumPer100g', label: 'Sodium' },
  { key: 'pricePer100g', label: 'Price / 100g' },
  { key: 'proteinPerDollar', label: 'Protein / $' },
  { key: 'servingSizeG', label: 'Serving Size' },
  { key: 'dataSource', label: 'Data Source' },
]

interface ColumnPickerProps {
  visibleColumns: ColumnKey[]
  onToggle: (key: ColumnKey) => void
}

export function ColumnPicker({ visibleColumns, onToggle }: ColumnPickerProps) {
  const visible = new Set(visibleColumns)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="size-4" />
          <span className="hidden sm:inline">Columns</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Columns
        </p>
        <div className="space-y-0.5">
          {COLUMN_OPTIONS.map(({ key, label }) => {
            const checked = visible.has(key)
            return (
              <label
                key={key}
                className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(key)}
                  className="size-3.5 accent-[hsl(var(--brand))] cursor-pointer"
                />
                {label}
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
