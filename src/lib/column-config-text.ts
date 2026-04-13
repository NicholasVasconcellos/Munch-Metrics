import type { ColumnKey } from '@/types/table'
import { MAX_EXTRA_NUTRIENTS } from '@/types/table'

const EXTRA_SEPARATOR = '---extra---'

// All valid static column keys
const VALID_STATIC_KEYS = new Set<string>([
  'name', 'foodGroup', 'caloriesPer100g', 'proteinPer100g', 'fatPer100g',
  'carbsPer100g', 'fiberPer100g', 'sugarPer100g', 'sodiumPer100g',
  'calciumPer100g', 'ironPer100g',
  'pricePer100g', 'proteinPerDollar', 'servingSizeG', 'dataSource',
])

/**
 * Exports the current column config to a shareable text format.
 *
 * Format:
 * ```
 * name
 * caloriesPer100g
 * proteinPer100g
 * ---extra---
 * Vitamin C, total ascorbic acid
 * Iron, Fe
 * ```
 */
export function exportColumnConfigToText(
  visibleColumns: ColumnKey[],
  extraNutrients: string[]
): string {
  const lines: string[] = [...visibleColumns]
  if (extraNutrients.length > 0) {
    lines.push(EXTRA_SEPARATOR)
    lines.push(...extraNutrients)
  }
  return lines.join('\n')
}

/**
 * Parses a text column config back into visibleColumns + extraNutrients.
 * Invalid static column keys are silently dropped.
 */
export function importColumnConfigFromText(
  text: string
): { visibleColumns: ColumnKey[]; extraNutrients: string[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const separatorIdx = lines.indexOf(EXTRA_SEPARATOR)

  const staticLines = separatorIdx >= 0 ? lines.slice(0, separatorIdx) : lines
  const extraLines = separatorIdx >= 0 ? lines.slice(separatorIdx + 1) : []

  const visibleColumns = staticLines.filter((l) =>
    VALID_STATIC_KEYS.has(l)
  ) as ColumnKey[]

  const extraNutrients = extraLines
    .filter(Boolean)
    .slice(0, MAX_EXTRA_NUTRIENTS)

  // Ensure at least 'name' is visible
  if (visibleColumns.length === 0) {
    visibleColumns.push('name')
  }

  return { visibleColumns, extraNutrients }
}
