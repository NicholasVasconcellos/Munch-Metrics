'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getFilterOptions, type FilterOptions } from '@/lib/queries/get-filter-options'
import { DietaryFilter } from '@/components/filters/dietary-filter'
import { NutrientRange } from '@/components/filters/nutrient-range'
import { AdditiveFilter } from '@/components/filters/additive-filter'
import { TagFilter } from '@/components/filters/tag-filter'
import type { FoodFilters, AllergenTag, ProcessingLevel } from '@/types/filters'

interface FilterPanelProps {
  open: boolean
  onClose: () => void
  filters: FoodFilters
  onApply: (filters: FoodFilters) => void
  onClearAll: () => void
}

export function FilterPanel({ open, onClose, filters, onApply, onClearAll }: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions | null>(null)
  const [draft, setDraft] = React.useState<FoodFilters>(filters)

  // Sync draft when panel opens
  React.useEffect(() => {
    if (open) setDraft(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Fetch filter options once on first open
  React.useEffect(() => {
    if (open && !filterOptions) {
      getFilterOptions().then(setFilterOptions).catch(console.error)
    }
  }, [open, filterOptions])

  // Lock body scroll when panel is open
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function handleApply() {
    onApply(draft)
    onClose()
  }

  function handleClearAll() {
    const empty: FoodFilters = { search: filters.search }
    setDraft(empty)
    onClearAll()
    onClose()
  }

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
        aria-label="Filter panel"
        aria-modal="true"
        className={cn(
          'fixed z-50 bg-background shadow-xl transition-transform duration-300 flex flex-col',
          // Desktop: right sidebar
          'md:inset-y-0 md:right-0 md:w-96 md:border-l',
          open ? 'md:translate-x-0' : 'md:translate-x-full',
          // Mobile: bottom sheet
          'max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-t-2xl max-md:border-t',
          open ? 'max-md:translate-y-0' : 'max-md:translate-y-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="text-sm font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Close filter panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Dietary Preferences */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Dietary Preferences
            </h3>
            <DietaryFilter
              dietary={draft.dietary ?? []}
              nutrientRanges={draft.nutrientRanges ?? []}
              excludeAllergens={draft.excludeAllergens ?? []}
              processingLevels={draft.processingLevels ?? []}
              onChange={(dietary, nutrientRanges, excludeAllergens, processingLevels) =>
                setDraft((prev) => ({
                  ...prev,
                  dietary: dietary.length ? dietary : undefined,
                  nutrientRanges: nutrientRanges.length ? nutrientRanges : undefined,
                  excludeAllergens: excludeAllergens.length ? excludeAllergens : undefined,
                  processingLevels: processingLevels.length ? processingLevels : undefined,
                }))
              }
            />
          </section>

          <Separator />

          {/* Nutrient Ranges */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Nutrient Ranges
            </h3>
            <NutrientRange
              ranges={draft.nutrientRanges ?? []}
              bounds={filterOptions?.nutrientRanges ?? null}
              onChange={(nutrientRanges) =>
                setDraft((prev) => ({
                  ...prev,
                  nutrientRanges: nutrientRanges.length ? nutrientRanges : undefined,
                }))
              }
            />
          </section>

          <Separator />

          {/* Food Groups */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Food Groups
            </h3>
            <TagFilter
              selected={draft.foodGroups ?? []}
              availableGroups={filterOptions?.foodGroups ?? []}
              onChange={(foodGroups) =>
                setDraft((prev) => ({
                  ...prev,
                  foodGroups: foodGroups.length ? foodGroups : undefined,
                }))
              }
            />
          </section>

          <Separator />

          {/* Allergen Exclusions */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Exclude Allergens
            </h3>
            <AdditiveFilter
              selected={draft.excludeAllergens ?? []}
              availableAllergens={filterOptions?.allergenTags ?? []}
              onChange={(excludeAllergens) =>
                setDraft((prev) => ({
                  ...prev,
                  excludeAllergens: excludeAllergens.length
                    ? (excludeAllergens as AllergenTag[])
                    : undefined,
                }))
              }
            />
          </section>

          {/* Processing Levels */}
          {(filterOptions?.processingLevels.length ?? 0) > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Processing Level
                </h3>
                <div className="space-y-0.5">
                  {(filterOptions?.processingLevels ?? []).map((level) => {
                    const checked = (draft.processingLevels ?? []).includes(
                      level as ProcessingLevel
                    )
                    const labels: Record<string, string> = {
                      unprocessed: 'Unprocessed',
                      minimally_processed: 'Minimally Processed',
                      processed: 'Processed',
                      ultra_processed: 'Ultra Processed',
                    }
                    return (
                      <label
                        key={level}
                        className="flex items-center gap-2.5 text-sm cursor-pointer rounded px-1.5 py-1 hover:bg-muted transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const current = draft.processingLevels ?? []
                            const next = checked
                              ? current.filter((l) => l !== level)
                              : [...current, level as ProcessingLevel]
                            setDraft((prev) => ({
                              ...prev,
                              processingLevels: next.length ? next : undefined,
                            }))
                          }}
                          className="rounded border-input accent-primary"
                        />
                        {labels[level] ?? level}
                      </label>
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t shrink-0">
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs">
            Clear All
          </Button>
          <Button size="sm" onClick={handleApply} className="ml-auto text-xs">
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  )
}
