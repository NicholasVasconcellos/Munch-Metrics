import type { ColumnDef } from '@tanstack/react-table'
import type { FoodComputed } from '@/types/food'

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

/** All sortable/toggleable column definitions (no image) */
export const tableColumns: ColumnDef<FoodComputed>[] = [
  {
    id: IMAGE_COLUMN_ID,
    header: '',
    cell: ({ row }) => {
      const url = row.original.thumbnailUrl ?? row.original.imageUrl
      const name = row.original.name
      if (!url) {
        return (
          <div className="size-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0">
            ?
          </div>
        )
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="size-10 rounded object-cover shrink-0"
          loading="lazy"
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
    cell: ({ getValue }) => (
      <span className="font-medium">{String(getValue())}</span>
    ),
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
