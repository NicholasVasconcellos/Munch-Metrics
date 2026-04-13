'use client'

import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
  type VisibilityState,
  type ColumnSizingState,
  type PaginationState,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight, Loader2, Link, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { useUrlState } from '@/hooks/use-url-state'
import { useFoodQuery } from '@/hooks/use-food-query'
import { useDebounce } from '@/hooks/use-debounce'
import { searchFoods } from '@/lib/queries/search-foods'
import { createTableColumns, IMAGE_COLUMN_ID } from './columns'
import { MobileRow } from './mobile-row'
import { FoodDetailModal } from '@/components/food/food-detail-modal'
import { useMediaQuery } from '@/hooks/use-media-query'
import { SortIndicator } from './sort-indicator'
import { ColumnPicker } from './column-picker'
import { FilterBar } from './filter-bar'
import { FilterPanel } from './filter-panel'
import { GroupSelector } from './group-selector'
import { ExportCSV } from './export-csv'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ColumnKey, GroupByField } from '@/types/table'
import type { FoodFilters } from '@/types/filters'
import type { FoodComputed } from '@/types/food'
import { DEFAULT_VISIBLE_COLUMNS } from '@/lib/url-state'

const ALL_SORTABLE_COLUMN_KEYS: ColumnKey[] = [
  'name', 'foodGroup', 'caloriesPer100g', 'proteinPer100g', 'fatPer100g',
  'carbsPer100g', 'fiberPer100g', 'sugarPer100g', 'sodiumPer100g',
  'pricePer100g', 'proteinPerDollar', 'servingSizeG', 'dataSource',
]

// Skeleton row for initial load
function SkeletonRow({ columnCount }: { columnCount: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: columnCount }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className="h-4 rounded bg-muted animate-pulse" style={{ width: i === 0 ? 40 : i === 1 ? '70%' : '60%' }} />
        </td>
      ))}
    </tr>
  )
}

/** Derive the group key for a row given the active groupBy field */
function getGroupKey(row: FoodComputed, groupBy: GroupByField): string {
  if (groupBy === 'foodGroup') return row.foodGroup ?? '(No Group)'
  if (groupBy === 'dataSource') return row.dataSource ?? '(Unknown)'
  if (groupBy === 'processingLevel') return '(Processing Level)'
  return ''
}

/** Group consecutive rows by their group key */
interface GroupedSection {
  key: string
  rows: FoodComputed[]
}

function groupRows(rows: FoodComputed[], groupBy: GroupByField): GroupedSection[] {
  if (!groupBy) return []
  const map = new Map<string, FoodComputed[]>()
  for (const row of rows) {
    const key = getGroupKey(row, groupBy)
    const existing = map.get(key)
    if (existing) {
      existing.push(row)
    } else {
      map.set(key, [row])
    }
  }
  return Array.from(map, ([key, rows]) => ({ key, rows }))
}

export function DataTable() {
  const { tableConfig, setTableConfig } = useUrlState()
  const { data, isLoading, error } = useFoodQuery(tableConfig)

  // Local search input — debounced before updating URL
  const [searchInput, setSearchInput] = React.useState(tableConfig.filters.search ?? '')
  const [suggestions, setSuggestions] = React.useState<FoodComputed[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())
  const [copySuccess, setCopySuccess] = React.useState(false)
  const [selectedFoodId, setSelectedFoodId] = React.useState<string | null>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const searchRef = React.useRef<HTMLInputElement>(null)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchInput, 300)
  const debouncedSuggestSearch = useDebounce(searchInput, 150)

  // Sync search input from URL (e.g., on back navigation)
  React.useEffect(() => {
    setSearchInput(tableConfig.filters.search ?? '')
  }, [tableConfig.filters.search])

  // Update URL when debounced search changes
  React.useEffect(() => {
    const current = tableConfig.filters.search ?? ''
    if (debouncedSearch === current) return
    setTableConfig((prev) => ({
      ...prev,
      filters: { ...prev.filters, search: debouncedSearch || undefined },
      pagination: { ...prev.pagination, page: 1 },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Fetch autocomplete suggestions
  React.useEffect(() => {
    if (!debouncedSuggestSearch.trim() || !showSuggestions) {
      setSuggestions([])
      return
    }
    let cancelled = false
    searchFoods({ filters: { search: debouncedSuggestSearch }, pageSize: 6 })
      .then((result) => {
        if (!cancelled) setSuggestions(result.rows)
      })
      .catch(() => {
        if (!cancelled) setSuggestions([])
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSuggestSearch, showSuggestions])

  // Close suggestions on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchRef.current?.contains(e.target as Node) ||
        suggestionsRef.current?.contains(e.target as Node)
      ) return
      setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Reset collapsed groups when groupBy changes
  React.useEffect(() => {
    setCollapsedGroups(new Set())
  }, [tableConfig.groupBy])

  // Convert our state to TanStack formats
  const sortingState: SortingState = [
    { id: tableConfig.sort.field, desc: tableConfig.sort.direction === 'desc' },
  ]

  const columnVisibility: VisibilityState = Object.fromEntries(
    ALL_SORTABLE_COLUMN_KEYS.map((key) => [key, tableConfig.visibleColumns.includes(key)])
  )

  const paginationState: PaginationState = {
    pageIndex: tableConfig.pagination.page - 1,
    pageSize: tableConfig.pagination.pageSize,
  }

  const handleOpenDetail = React.useCallback(
    (id: string) => setSelectedFoodId(id),
    []
  )
  const columns = React.useMemo(
    () => createTableColumns(handleOpenDetail),
    [handleOpenDetail]
  )

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    state: {
      sorting: sortingState,
      columnVisibility,
      pagination: paginationState,
      columnSizing,
    },
    manualSorting: true,
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    columnResizeMode: 'onChange',
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sortingState) : updater
      if (newSorting.length === 0) {
        setTableConfig((prev) => ({
          ...prev,
          sort: { field: 'name', direction: 'asc' },
          pagination: { ...prev.pagination, page: 1 },
        }))
      } else {
        const [{ id, desc }] = newSorting
        setTableConfig((prev) => ({
          ...prev,
          sort: { field: id as ColumnKey, direction: desc ? 'desc' : 'asc' },
          pagination: { ...prev.pagination, page: 1 },
        }))
      }
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === 'function' ? updater(columnVisibility) : updater
      const cols = ALL_SORTABLE_COLUMN_KEYS.filter((key) => newVisibility[key] !== false)
      setTableConfig((prev) => ({ ...prev, visibleColumns: cols }))
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(paginationState) : updater
      setTableConfig((prev) => ({
        ...prev,
        pagination: {
          page: newPagination.pageIndex + 1,
          pageSize: newPagination.pageSize,
        },
      }))
    },
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
  })

  const visibleLeafColumns = table.getVisibleLeafColumns()
  const rows = table.getRowModel().rows
  const currentPage = tableConfig.pagination.page
  const pageSize = tableConfig.pagination.pageSize
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 0
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, totalCount)

  // Grouped sections for group-by rendering
  const groupedSections = React.useMemo(
    () => groupRows(data?.rows ?? [], tableConfig.groupBy),
    [data?.rows, tableConfig.groupBy]
  )

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function handleRemoveFilter(type: string, value: string) {
    setTableConfig((prev) => {
      const filters = { ...prev.filters }
      if (type === 'dietary') {
        filters.dietary = filters.dietary?.filter((t) => t !== value)
        if (!filters.dietary?.length) delete filters.dietary
      } else if (type === 'allergen') {
        filters.excludeAllergens = filters.excludeAllergens?.filter((t) => t !== value)
        if (!filters.excludeAllergens?.length) delete filters.excludeAllergens
      } else if (type === 'foodGroup') {
        filters.foodGroups = filters.foodGroups?.filter((g) => g !== value)
        if (!filters.foodGroups?.length) delete filters.foodGroups
      } else if (type === 'processingLevel') {
        filters.processingLevels = filters.processingLevels?.filter((l) => l !== value)
        if (!filters.processingLevels?.length) delete filters.processingLevels
      } else if (type === 'nutrientRange') {
        filters.nutrientRanges = filters.nutrientRanges?.filter((r) => r.nutrient !== value)
        if (!filters.nutrientRanges?.length) delete filters.nutrientRanges
      }
      return { ...prev, filters, pagination: { ...prev.pagination, page: 1 } }
    })
  }

  function handleClearAllFilters() {
    setTableConfig((prev) => ({
      ...prev,
      filters: { search: prev.filters.search },
      pagination: { ...prev.pagination, page: 1 },
    }))
  }

  function handleApplyFilters(filters: FoodFilters) {
    setTableConfig((prev) => ({
      ...prev,
      filters: { ...filters, search: prev.filters.search },
      pagination: { ...prev.pagination, page: 1 },
    }))
  }

  function handleColumnToggle(key: ColumnKey) {
    const current = tableConfig.visibleColumns
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key]
    if (next.length === 0) return
    setTableConfig((prev) => ({ ...prev, visibleColumns: next }))
  }

  function handleGroupChange(groupBy: GroupByField) {
    setTableConfig((prev) => ({
      ...prev,
      groupBy,
      pagination: { ...prev.pagination, page: 1 },
    }))
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search foods…"
            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full mt-1 w-full z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-md overflow-hidden"
            >
              {suggestions.map((food) => (
                <button
                  key={food.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSearchInput(food.name)
                    setShowSuggestions(false)
                    setTableConfig((prev) => ({
                      ...prev,
                      filters: { ...prev.filters, search: food.name },
                      pagination: { ...prev.pagination, page: 1 },
                    }))
                  }}
                >
                  {food.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={food.thumbnailUrl}
                      alt=""
                      className="size-6 rounded object-cover shrink-0"
                    />
                  )}
                  <span className="truncate">{food.name}</span>
                  {food.foodGroup && (
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {food.foodGroup}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <GroupSelector groupBy={tableConfig.groupBy} onChange={handleGroupChange} />
          <ExportCSV rows={data?.rows ?? []} visibleColumns={tableConfig.visibleColumns} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 gap-1.5"
            title="Copy link to current view"
          >
            <Link className="size-3.5" />
            <span className="hidden sm:inline">{copySuccess ? 'Copied!' : 'Copy Link'}</span>
          </Button>
          <ColumnPicker
            visibleColumns={tableConfig.visibleColumns}
            onToggle={handleColumnToggle}
          />
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={tableConfig.filters}
        onRemove={handleRemoveFilter}
        onOpenPanel={() => setFilterPanelOpen(true)}
        onClearAll={handleClearAllFilters}
      />

      {/* Filter panel */}
      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={tableConfig.filters}
        onApply={handleApplyFilters}
        onClearAll={handleClearAllFilters}
      />

      {/* Mobile card layout */}
      {isMobile && (
        <div className="flex flex-col gap-2">
          {isLoading && data === null ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 animate-pulse">
                <div className="size-12 rounded bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">
              Failed to load data: {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No foods found</div>
          ) : (
            rows.map((row) => (
              <MobileRow
                key={row.id}
                food={row.original}
                visibleColumns={tableConfig.visibleColumns}
                onOpenDetail={handleOpenDetail}
              />
            ))
          )}
        </div>
      )}

      {/* Desktop table container */}
      {!isMobile && <div className="relative rounded-lg border border-border overflow-hidden">
        {/* Loading overlay */}
        {isLoading && data !== null && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load data: {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ tableLayout: 'fixed', width: table.getTotalSize() }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/40">
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted()
                    const canSort = header.column.getCanSort()
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide select-none whitespace-nowrap relative',
                          canSort && 'cursor-pointer hover:text-foreground transition-colors'
                        )}
                        style={{ width: header.getSize() }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : (
                          <span className="inline-flex items-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && <SortIndicator direction={isSorted} />}
                          </span>
                        )}
                        {/* Column resize handle */}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none opacity-0 hover:opacity-100 bg-border',
                              header.column.getIsResizing() && 'opacity-100 bg-brand'
                            )}
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {/* Skeleton on initial load */}
              {isLoading && data === null ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonRow key={i} columnCount={visibleLeafColumns.length} />
                ))
              ) : tableConfig.groupBy && groupedSections.length > 0 ? (
                /* Grouped rendering */
                groupedSections.map((section) => {
                  const isCollapsed = collapsedGroups.has(section.key)
                  return (
                    <React.Fragment key={section.key}>
                      {/* Group header row */}
                      <tr
                        className="border-b border-border bg-muted/60 cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => toggleGroup(section.key)}
                      >
                        <td
                          colSpan={visibleLeafColumns.length}
                          className="px-3 py-2"
                        >
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            {isCollapsed ? (
                              <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="size-3.5 text-muted-foreground" />
                            )}
                            {section.key}
                            <span className="ml-1 font-normal text-muted-foreground">
                              ({section.rows.length})
                            </span>
                          </span>
                        </td>
                      </tr>
                      {/* Group data rows */}
                      {!isCollapsed &&
                        rows
                          .filter((r) => section.rows.some((sr) => sr.id === r.original.id))
                          .map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className={cn(
                                    'px-3 py-2',
                                    cell.column.id === IMAGE_COLUMN_ID && 'py-1.5'
                                  )}
                                  style={{ width: cell.column.getSize() }}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          ))}
                    </React.Fragment>
                  )
                })
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleLeafColumns.length}
                    className="px-3 py-12 text-center text-sm text-muted-foreground"
                  >
                    No foods found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-3 py-2',
                          cell.column.id === IMAGE_COLUMN_ID && 'py-1.5'
                        )}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Food detail modal */}
      <FoodDetailModal
        foodId={selectedFoodId}
        onClose={() => setSelectedFoodId(null)}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 text-sm flex-wrap">
        {/* Showing X-Y of Z */}
        <p className="text-muted-foreground shrink-0">
          {totalCount === 0
            ? 'No results'
            : `Showing ${showingFrom}–${showingTo} of ${totalCount.toLocaleString()} foods`}
        </p>

        <div className="flex items-center gap-3 ml-auto">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="hidden sm:inline text-xs">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) =>
                setTableConfig((prev) => ({
                  ...prev,
                  pagination: { page: 1, pageSize: Number(e.target.value) },
                }))
              }
              className="h-8 rounded border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Prev/Next */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTableConfig((prev) => ({
                  ...prev,
                  pagination: { ...prev.pagination, page: prev.pagination.page - 1 },
                }))
              }
              disabled={currentPage <= 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground text-xs px-1 tabular-nums">
              {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTableConfig((prev) => ({
                  ...prev,
                  pagination: { ...prev.pagination, page: prev.pagination.page + 1 },
                }))
              }
              disabled={currentPage >= totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Re-export for convenience
export { DEFAULT_VISIBLE_COLUMNS }
