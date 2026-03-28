import type { FoodComputed } from '@/types/food'
import type { ColumnKey } from '@/types/table'

const COLUMN_HEADERS: Record<ColumnKey, string> = {
  name: 'Name',
  foodGroup: 'Food Group',
  caloriesPer100g: 'Calories (kcal/100g)',
  proteinPer100g: 'Protein (g/100g)',
  fatPer100g: 'Fat (g/100g)',
  carbsPer100g: 'Carbs (g/100g)',
  fiberPer100g: 'Fiber (g/100g)',
  sugarPer100g: 'Sugars (g/100g)',
  sodiumPer100g: 'Sodium (mg/100g)',
  pricePer100g: 'Price ($/100g)',
  proteinPerDollar: 'Protein (g/$)',
  servingSizeG: 'Serving Size (g)',
  dataSource: 'Data Source',
}

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function exportToCSV(rows: FoodComputed[], visibleColumns: ColumnKey[]): Blob {
  const headers = visibleColumns.map((col) => COLUMN_HEADERS[col] ?? col)
  const lines: string[] = [headers.map(escapeCSV).join(',')]

  for (const row of rows) {
    const cells = visibleColumns.map((col) => {
      const value = row[col as keyof FoodComputed]
      return escapeCSV(value as string | null | undefined)
    })
    lines.push(cells.join(','))
  }

  return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
}

export function getCSVFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `munch-metrics-export-${date}.csv`
}
