'use client'

import * as React from 'react'
import { DIETARY_PRESETS, NUTRIENTS } from '@/lib/constants'
import type { DietaryTag, AllergenTag, ProcessingLevel, NutrientRangeFilter } from '@/types/filters'
import { cn } from '@/lib/utils'

interface DietaryFilterProps {
  dietary: DietaryTag[]
  nutrientRanges: NutrientRangeFilter[]
  excludeAllergens: AllergenTag[]
  processingLevels: ProcessingLevel[]
  onChange: (
    dietary: DietaryTag[],
    nutrientRanges: NutrientRangeFilter[],
    excludeAllergens: AllergenTag[],
    processingLevels: ProcessingLevel[]
  ) => void
}

/** Find which preset (if any) matches the current dietary/processing state */
function getActivePreset(dietary: DietaryTag[], processingLevels: ProcessingLevel[]): string | null {
  for (const [key, preset] of Object.entries(DIETARY_PRESETS)) {
    if (preset.dietary?.length) {
      if (preset.dietary.every((t) => dietary.includes(t as DietaryTag))) return key
    } else if (preset.processingLevels?.length) {
      if (preset.processingLevels.some((l) => processingLevels.includes(l as ProcessingLevel))) return key
    }
  }
  return null
}

/** Check if current nutrient ranges differ from preset defaults */
function isPresetModified(presetKey: string, nutrientRanges: NutrientRangeFilter[]): boolean {
  const preset = DIETARY_PRESETS[presetKey]
  if (!preset?.nutrientRanges?.length) return false
  return preset.nutrientRanges.some((pr) => {
    const current = nutrientRanges.find((r) => r.nutrient === pr.nutrient)
    return current?.min !== pr.min || current?.max !== pr.max
  })
}

export function DietaryFilter({
  dietary,
  nutrientRanges,
  excludeAllergens,
  processingLevels,
  onChange,
}: DietaryFilterProps) {
  const activePresetKey = getActivePreset(dietary, processingLevels)
  const modified = activePresetKey ? isPresetModified(activePresetKey, nutrientRanges) : false
  const presetNutrients = activePresetKey
    ? (DIETARY_PRESETS[activePresetKey]?.nutrientRanges ?? [])
    : []

  function handlePresetSelect(presetKey: string) {
    if (!presetKey) {
      // Clear all preset-owned tags
      const allPresetDietary = new Set(
        Object.values(DIETARY_PRESETS).flatMap((p) => p.dietary ?? [])
      )
      const allPresetProcessing = new Set(
        Object.values(DIETARY_PRESETS).flatMap((p) => p.processingLevels ?? [])
      )
      onChange(
        dietary.filter((t) => !allPresetDietary.has(t)),
        nutrientRanges,
        excludeAllergens,
        processingLevels.filter((l) => !allPresetProcessing.has(l as ProcessingLevel))
      )
      return
    }

    const preset = DIETARY_PRESETS[presetKey]
    if (!preset) return

    const prevPreset = activePresetKey ? DIETARY_PRESETS[activePresetKey] : null
    const prevDietary = new Set(prevPreset?.dietary ?? [])
    const prevProcessing = new Set(prevPreset?.processingLevels ?? [])
    const prevNutrientKeys = new Set((prevPreset?.nutrientRanges ?? []).map((r) => r.nutrient))
    const prevAllergenKeys = new Set(prevPreset?.excludeAllergens ?? [])

    // Build new dietary: remove prev preset tags, add new preset tags
    const newDietary = [
      ...dietary.filter((t) => !prevDietary.has(t)),
      ...(preset.dietary ?? []),
    ] as DietaryTag[]

    // Build new processingLevels: remove prev preset levels, add new preset levels
    const newProcessing = [
      ...processingLevels.filter((l) => !prevProcessing.has(l)),
      ...(preset.processingLevels ?? []),
    ] as ProcessingLevel[]

    // Build new nutrient ranges: remove prev preset ranges, add new preset ranges
    const newPresetNutrientKeys = new Set((preset.nutrientRanges ?? []).map((r) => r.nutrient))
    const keepRanges = nutrientRanges.filter(
      (r) => !prevNutrientKeys.has(r.nutrient) && !newPresetNutrientKeys.has(r.nutrient)
    )
    const newRanges: NutrientRangeFilter[] = [
      ...keepRanges,
      ...(preset.nutrientRanges ?? []).map((r) => ({ ...r })),
    ]

    // Build new allergens: remove prev preset allergens, add new preset allergens
    const newAllergens = [
      ...excludeAllergens.filter((a) => !prevAllergenKeys.has(a)),
      ...(preset.excludeAllergens ?? []),
    ] as AllergenTag[]

    onChange(
      Array.from(new Set(newDietary)),
      newRanges,
      Array.from(new Set(newAllergens)) as AllergenTag[],
      Array.from(new Set(newProcessing)) as ProcessingLevel[]
    )
  }

  function updateNutrientRange(nutrient: string, field: 'min' | 'max', value: string) {
    const num = value ? parseFloat(value) : undefined
    const newRanges = nutrientRanges.map((r) =>
      r.nutrient === nutrient ? { ...r, [field]: num } : r
    )
    onChange(dietary, newRanges, excludeAllergens, processingLevels)
  }

  return (
    <div className="space-y-3">
      {/* Preset dropdown */}
      <div className="flex items-center gap-2">
        <select
          value={activePresetKey ?? ''}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="">Select a preset…</option>
          {Object.entries(DIETARY_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.label}
            </option>
          ))}
        </select>
        {activePresetKey && (
          <span
            className={cn(
              'text-xs shrink-0',
              modified ? 'text-amber-500 font-medium' : 'text-muted-foreground'
            )}
          >
            {modified ? '(modified)' : DIETARY_PRESETS[activePresetKey]?.description}
          </span>
        )}
      </div>

      {/* Editable thresholds for presets with nutrient ranges */}
      {presetNutrients.length > 0 && (
        <div className="space-y-2 pl-3 border-l-2 border-border">
          {presetNutrients.map((presetRange) => {
            const current = nutrientRanges.find((r) => r.nutrient === presetRange.nutrient)
            const nutrientMeta = NUTRIENTS.find((n) => n.key === presetRange.nutrient)
            const label = nutrientMeta?.displayName ?? presetRange.nutrient
            const unit = nutrientMeta?.unit ?? ''
            return (
              <div key={presetRange.nutrient} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground text-xs w-20 shrink-0">{label}</span>
                {presetRange.min !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">≥</span>
                    <input
                      type="number"
                      value={current?.min ?? presetRange.min}
                      onChange={(e) =>
                        updateNutrientRange(presetRange.nutrient, 'min', e.target.value)
                      }
                      className="w-16 h-7 rounded border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">{unit}</span>
                  </div>
                )}
                {presetRange.max !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">≤</span>
                    <input
                      type="number"
                      value={current?.max ?? presetRange.max}
                      onChange={(e) =>
                        updateNutrientRange(presetRange.nutrient, 'max', e.target.value)
                      }
                      className="w-16 h-7 rounded border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">{unit}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
