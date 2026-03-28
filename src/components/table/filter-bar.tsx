'use client'

import type { FoodFilters } from '@/types/filters'

interface FilterBarProps {
  filters: FoodFilters
  onClearFilter?: (key: keyof FoodFilters) => void
}

/** Placeholder — active filter chips will be added in Task 008 */
export function FilterBar({ filters, onClearFilter: _onClearFilter }: FilterBarProps) {
  const hasFilters =
    (filters.dietary?.length ?? 0) > 0 ||
    (filters.excludeAllergens?.length ?? 0) > 0 ||
    (filters.processingLevels?.length ?? 0) > 0 ||
    (filters.foodGroups?.length ?? 0) > 0 ||
    (filters.nutrientRanges?.length ?? 0) > 0

  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap gap-2 px-1 py-2">
      {/* Task 008 will populate active filter chips here */}
    </div>
  )
}
