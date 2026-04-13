'use client'

import * as React from 'react'
import { X, Search, ChevronDown, ChevronRight, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAvailableNutrients, type AvailableNutrient } from '@/lib/queries/get-available-nutrients'
import type { ColumnKey } from '@/types/table'
import { MAX_EXTRA_NUTRIENTS } from '@/types/table'

// ─── Static column options ───────────────────────────────────────────────────

interface ColumnMeta {
  key: ColumnKey
  label: string
}

const STATIC_COLUMN_OPTIONS: ColumnMeta[] = [
  { key: 'name', label: 'Name' },
  { key: 'caloriesPer100g', label: 'Calories' },
  { key: 'proteinPer100g', label: 'Protein' },
  { key: 'fatPer100g', label: 'Fat' },
  { key: 'carbsPer100g', label: 'Carbs' },
  { key: 'foodGroup', label: 'Food Group' },
  { key: 'fiberPer100g', label: 'Fiber' },
  { key: 'sugarPer100g', label: 'Sugars' },
  { key: 'sodiumPer100g', label: 'Sodium' },
  { key: 'calciumPer100g', label: 'Calcium' },
  { key: 'ironPer100g', label: 'Iron' },
  { key: 'pricePer100g', label: 'Price / 100g' },
  { key: 'proteinPerDollar', label: 'Protein / $' },
  { key: 'servingSizeG', label: 'Serving Size' },
  { key: 'dataSource', label: 'Data Source' },
]

// Nutrients already represented in food_computed — exclude from dynamic sections
const STATIC_NUTRIENT_NAMES = new Set([
  'Energy',
  'Protein',
  'Total lipid (fat)',
  'Carbohydrate, by difference',
  'Fiber, total dietary',
  'Sugars, total including NLEA',
  'Sugars, Total',
  'Sodium, Na',
  'Calcium, Ca',
  'Iron, Fe',
])

// Category display labels and order
const CATEGORY_ORDER = ['vitamin', 'mineral', 'fatty_acid', 'amino_acid', 'macronutrient', 'other'] as const
const CATEGORY_LABELS: Record<string, string> = {
  vitamin: 'Vitamins',
  mineral: 'Minerals',
  fatty_acid: 'Fatty Acids',
  amino_acid: 'Amino Acids',
  macronutrient: 'Macronutrients',
  other: 'Other',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ColumnPanelProps {
  open: boolean
  onClose: () => void
  visibleColumns: ColumnKey[]
  extraNutrients: string[]
  onToggleColumn: (key: ColumnKey) => void
  onToggleNutrient: (nutrientName: string) => void
  onResetToDefault: () => void
}

export function ColumnPanel({
  open,
  onClose,
  visibleColumns,
  extraNutrients,
  onToggleColumn,
  onToggleNutrient,
  onResetToDefault,
}: ColumnPanelProps) {
  const [search, setSearch] = React.useState('')
  const [nutrients, setNutrients] = React.useState<AvailableNutrient[] | null>(null)
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(
    () => new Set(CATEGORY_ORDER)
  )

  // Fetch available nutrients on first open
  React.useEffect(() => {
    if (open && !nutrients) {
      getAvailableNutrients().then(setNutrients).catch(console.error)
    }
  }, [open, nutrients])

  // Lock body scroll when panel is open
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Reset search when panel closes
  React.useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const visibleSet = new Set(visibleColumns)
  const extraSet = new Set(extraNutrients)
  const searchLower = search.toLowerCase()
  const isSearching = searchLower.length > 0

  // Filter static columns by search
  const filteredStatic = isSearching
    ? STATIC_COLUMN_OPTIONS.filter((c) => c.label.toLowerCase().includes(searchLower))
    : STATIC_COLUMN_OPTIONS

  // Group dynamic nutrients by category, excluding static ones
  const dynamicNutrients = React.useMemo(() => {
    if (!nutrients) return null
    const filtered = nutrients.filter((n) => !STATIC_NUTRIENT_NAMES.has(n.nutrientName))
    const grouped: Record<string, AvailableNutrient[]> = {}
    for (const n of filtered) {
      const cat = n.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(n)
    }
    return grouped
  }, [nutrients])

  // Filter nutrients by search
  const filteredDynamic = React.useMemo(() => {
    if (!dynamicNutrients) return null
    if (!isSearching) return dynamicNutrients
    const result: Record<string, AvailableNutrient[]> = {}
    for (const [cat, items] of Object.entries(dynamicNutrients)) {
      const filtered = items.filter((n) =>
        n.nutrientName.toLowerCase().includes(searchLower)
      )
      if (filtered.length > 0) result[cat] = filtered
    }
    return result
  }, [dynamicNutrients, isSearching, searchLower])

  function toggleSection(cat: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const totalSelected = visibleColumns.length + extraNutrients.length
  const atNutrientLimit = extraNutrients.length >= MAX_EXTRA_NUTRIENTS

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — right sidebar on md+, bottom sheet on mobile */}
      <div
        role="dialog"
        aria-label="Column panel"
        aria-modal="true"
        className={cn(
          'fixed z-50 bg-background shadow-xl transition-transform duration-300 flex flex-col',
          'md:inset-y-0 md:right-0 md:w-96 md:border-l',
          open ? 'md:translate-x-0' : 'md:translate-x-full',
          'max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-t-2xl max-md:border-t',
          open ? 'max-md:translate-y-0' : 'max-md:translate-y-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Columns</h2>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {totalSelected}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Close column panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search columns…"
              className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Common (static) columns — always expanded */}
          {filteredStatic.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Common
                <span className="ml-1 font-normal">
                  ({visibleColumns.length}/{STATIC_COLUMN_OPTIONS.length})
                </span>
              </h3>
              <div className="space-y-0.5">
                {filteredStatic.map(({ key, label }) => {
                  const checked = visibleSet.has(key)
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleColumn(key)}
                        className="size-3.5 accent-[hsl(var(--brand))] cursor-pointer"
                      />
                      {label}
                    </label>
                  )
                })}
              </div>
            </section>
          )}

          {/* Dynamic nutrient sections */}
          {filteredDynamic && CATEGORY_ORDER.map((cat) => {
            const items = filteredDynamic[cat]
            if (!items?.length) return null

            const selectedCount = items.filter((n) => extraSet.has(n.nutrientName)).length
            const isCollapsed = !isSearching && collapsedSections.has(cat)

            return (
              <section key={cat}>
                <button
                  type="button"
                  className="flex items-center gap-1.5 w-full text-left mb-2 group"
                  onClick={() => toggleSection(cat)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  )}
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
                    {CATEGORY_LABELS[cat] ?? cat}
                    <span className="ml-1 font-normal">
                      ({selectedCount}/{items.length})
                    </span>
                  </h3>
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {items.map((n) => {
                      const checked = extraSet.has(n.nutrientName)
                      const disabled = !checked && atNutrientLimit
                      return (
                        <label
                          key={n.nutrientName}
                          className={cn(
                            'flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors',
                            disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-accent'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (!disabled) onToggleNutrient(n.nutrientName)
                            }}
                            disabled={disabled}
                            className="size-3.5 accent-[hsl(var(--brand))] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="flex-1 truncate">{n.nutrientName}</span>
                          {n.unit && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                              {n.unit}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}

          {/* Loading state for nutrients */}
          {!nutrients && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading nutrients…
            </div>
          )}

          {/* No results */}
          {isSearching && filteredStatic.length === 0 && (!filteredDynamic || Object.keys(filteredDynamic).length === 0) && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No columns match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t shrink-0">
          <Button variant="ghost" size="sm" onClick={onResetToDefault} className="text-xs">
            Reset to Default
          </Button>
          {atNutrientLimit && (
            <span className="text-xs text-muted-foreground ml-auto">
              {MAX_EXTRA_NUTRIENTS} nutrient limit reached
            </span>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Trigger Button ──────────────────────────────────────────────────────────

interface ColumnPanelTriggerProps {
  onClick: () => void
}

export function ColumnPanelTrigger({ onClick }: ColumnPanelTriggerProps) {
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={onClick}>
      <Columns3 className="size-4" />
      <span className="hidden sm:inline">Columns</span>
    </Button>
  )
}
