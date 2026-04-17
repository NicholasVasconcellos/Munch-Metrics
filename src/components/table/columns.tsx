'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { FoodComputed } from '@/types/food'
import type { AvailableNutrient } from '@/lib/queries/get-available-nutrients'

function formatNum(value: string | null | undefined, decimals = 1): string {
  if (value == null) return '—'
  const n = parseFloat(value)
  if (isNaN(n)) return '—'
  return n.toFixed(decimals)
}

function NumericCell({ value, decimals = 1, suffix = '' }: {
  value: string | null | undefined
  decimals?: number
  suffix?: string
}) {
  const formatted = formatNum(value, decimals)
  if (formatted === '—') {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <span className="font-mono tabular-nums">
      {formatted}{suffix}
    </span>
  )
}

export const IMAGE_COLUMN_ID = 'image'

/**
 * Factory that creates column definitions with an optional name-click handler.
 * @param onNameClick Called with the food ID when the name cell is clicked.
 */
export function createTableColumns(
  onNameClick?: (foodId: string) => void
): ColumnDef<FoodComputed>[] {
  return [
    {
      id: IMAGE_COLUMN_ID,
      header: '',
      cell: ({ row }) => {
        const food = row.original
        return (
          <LazyFoodThumbnail
            foodId={food.id}
            existingUrl={food.thumbnailUrl ?? food.imageUrl}
            alt={food.name}
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 56,
      minSize: 56,
      maxSize: 56,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue, row }) => {
        const name = String(getValue())
        if (onNameClick) {
          return (
            <button
              type="button"
              className="font-medium text-left hover:underline focus-visible:underline outline-none cursor-pointer"
              onClick={() => onNameClick(row.original.id)}
            >
              {name}
            </button>
          )
        }
        return <span className="font-medium">{name}</span>
      },
      enableSorting: true,
      size: 280,
      minSize: 120,
    },
    {
      accessorKey: 'caloriesPer100g',
      header: 'Calories',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} decimals={0} suffix=" kcal" />
      ),
      enableSorting: true,
      size: 110,
      minSize: 80,
    },
    {
      accessorKey: 'proteinPer100g',
      header: 'Protein',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} suffix="g" />
      ),
      enableSorting: true,
      size: 90,
      minSize: 70,
    },
    {
      accessorKey: 'fatPer100g',
      header: 'Fat',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} suffix="g" />
      ),
      enableSorting: true,
      size: 80,
      minSize: 60,
    },
    {
      accessorKey: 'carbsPer100g',
      header: 'Carbs',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} suffix="g" />
      ),
      enableSorting: true,
      size: 90,
      minSize: 70,
    },
    {
      accessorKey: 'foodGroup',
      header: 'Food Group',
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        return val ? (
          <span className="text-sm text-muted-foreground">{val}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
      enableSorting: true,
      size: 160,
      minSize: 100,
    },
    {
      accessorKey: 'fiberPer100g',
      header: 'Fiber',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} suffix="g" />
      ),
      enableSorting: true,
      size: 80,
      minSize: 60,
    },
    {
      accessorKey: 'sugarPer100g',
      header: 'Sugars',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} suffix="g" />
      ),
      enableSorting: true,
      size: 85,
      minSize: 65,
    },
    {
      accessorKey: 'sodiumPer100g',
      header: 'Sodium',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} decimals={0} suffix=" mg" />
      ),
      enableSorting: true,
      size: 90,
      minSize: 70,
    },
    {
      accessorKey: 'calciumPer100g',
      header: 'Calcium',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} decimals={0} suffix=" mg" />
      ),
      enableSorting: true,
      size: 95,
      minSize: 70,
    },
    {
      accessorKey: 'ironPer100g',
      header: 'Iron',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} suffix=" mg" />
      ),
      enableSorting: true,
      size: 80,
      minSize: 60,
    },
    {
      accessorKey: 'pricePer100g',
      header: 'Price / 100g',
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        if (!val) return <span className="text-muted-foreground">—</span>
        const n = parseFloat(val)
        if (isNaN(n)) return <span className="text-muted-foreground">—</span>
        return <span className="font-mono tabular-nums">${n.toFixed(2)}</span>
      },
      enableSorting: true,
      size: 110,
      minSize: 80,
    },
    {
      accessorKey: 'proteinPerDollar',
      header: 'Protein / $',
      cell: ({ getValue }) => (
        <NumericCell value={getValue() as string | null} suffix="g" />
      ),
      enableSorting: true,
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: 'servingSizeG',
      header: 'Serving Size',
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        if (!val) return <span className="text-muted-foreground">—</span>
        const n = parseFloat(val)
        if (isNaN(n)) return <span className="font-mono tabular-nums">{val}</span>
        return <span className="font-mono tabular-nums">{n.toFixed(0)}g</span>
      },
      enableSorting: true,
      size: 110,
      minSize: 80,
    },
    {
      accessorKey: 'dataSource',
      header: 'Source',
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        return val ? (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{val}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
      enableSorting: true,
      size: 100,
      minSize: 70,
    },
  ]
}

/** Static column definitions (no click handler) — kept for backward compatibility. */
export const tableColumns = createTableColumns()

/**
 * Creates dynamic TanStack column definitions for extra nutrients fetched from the DB.
 * Sorting is disabled for dynamic columns (v1).
 */
export function createExtraNutrientColumns(
  nutrientNames: string[],
  unitMap: Record<string, string>
): ColumnDef<FoodComputed>[] {
  return nutrientNames.map((name) => {
    const unit = unitMap[name] ?? ''
    const suffix = unit ? ` ${unit}` : ''
    return {
      id: `en_${name}`,
      header: name,
      accessorFn: (row: FoodComputed) => row.extraNutrients?.[name] ?? null,
      cell: ({ getValue }: { getValue: () => unknown }) => (
        <NumericCell value={getValue() as string | null} suffix={suffix} />
      ),
      enableSorting: false,
      size: 100,
      minSize: 70,
    } satisfies ColumnDef<FoodComputed>
  })
}
