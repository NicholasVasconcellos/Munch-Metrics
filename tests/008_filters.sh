#!/bin/bash
set -e
PASS=0; FAIL=0; ERRORS=""

assert() {
  local description="$1"
  shift
  if eval "$@" >/dev/null 2>&1; then
    PASS=$((PASS + 1))
    echo "  ✓ $description"
  else
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ✗ $description\n    command: $*"
    echo "  ✗ $description"
    echo "    command: $*"
  fi
}

assert_file_exists() {
  assert "File exists: $1" "[ -f '$1' ]"
}

assert_file_contains() {
  assert "File $1 contains '$2'" "grep -q '$2' '$1'"
}

assert_file_not_contains() {
  assert "File $1 does not contain '$2'" "! grep -q '$2' '$1'"
}

cd "$(dirname "$0")/.."

echo ""
echo "=== Test 008: Filter System ==="
echo ""

# ── File existence ────────────────────────────────────────────────────────────
echo "--- File existence ---"
assert_file_exists "src/components/table/filter-bar.tsx"
assert_file_exists "src/components/table/filter-panel.tsx"
assert_file_exists "src/components/filters/dietary-filter.tsx"
assert_file_exists "src/components/filters/nutrient-range.tsx"
assert_file_exists "src/components/filters/additive-filter.tsx"
assert_file_exists "src/components/filters/tag-filter.tsx"

# ── URL state: serialize filter types ─────────────────────────────────────────
echo ""
echo "--- URL state serialization ---"
assert_file_contains "src/lib/url-state.ts" "'diet'"
assert_file_contains "src/lib/url-state.ts" "'allerg'"
assert_file_contains "src/lib/url-state.ts" "'fgrp'"
assert_file_contains "src/lib/url-state.ts" "'proc'"
assert_file_contains "src/lib/url-state.ts" "'nr'"
assert_file_contains "src/lib/url-state.ts" "VALID_DIETARY_TAGS"
assert_file_contains "src/lib/url-state.ts" "VALID_ALLERGEN_TAGS"
assert_file_contains "src/lib/url-state.ts" "VALID_PROCESSING_LEVELS"
assert_file_contains "src/lib/url-state.ts" "VALID_NUTRIENTS"
assert_file_contains "src/lib/url-state.ts" "dietary.length ? dietary : undefined"
assert_file_contains "src/lib/url-state.ts" "excludeAllergens.length ? excludeAllergens : undefined"
assert_file_contains "src/lib/url-state.ts" "foodGroups.length ? foodGroups : undefined"
assert_file_contains "src/lib/url-state.ts" "processingLevels.length ? processingLevels : undefined"
assert_file_contains "src/lib/url-state.ts" "nutrientRanges.length ? nutrientRanges : undefined"

# ── FilterBar: chips ───────────────────────────────────────────────────────────
echo ""
echo "--- FilterBar ---"
assert_file_contains "src/components/table/filter-bar.tsx" "FilterChip"
assert_file_contains "src/components/table/filter-bar.tsx" "onRemove"
assert_file_contains "src/components/table/filter-bar.tsx" "onOpenPanel"
assert_file_contains "src/components/table/filter-bar.tsx" "onClearAll"
assert_file_contains "src/components/table/filter-bar.tsx" "filters.dietary"
assert_file_contains "src/components/table/filter-bar.tsx" "filters.excludeAllergens"
assert_file_contains "src/components/table/filter-bar.tsx" "filters.foodGroups"
assert_file_contains "src/components/table/filter-bar.tsx" "filters.processingLevels"
assert_file_contains "src/components/table/filter-bar.tsx" "filters.nutrientRanges"
assert_file_contains "src/components/table/filter-bar.tsx" "SlidersHorizontal"
assert_file_contains "src/components/table/filter-bar.tsx" "Clear all"
# No longer a placeholder
assert_file_not_contains "src/components/table/filter-bar.tsx" "Task 008 will populate"

# ── FilterPanel: drawer structure ─────────────────────────────────────────────
echo ""
echo "--- FilterPanel ---"
assert_file_contains "src/components/table/filter-panel.tsx" "md:translate-x-0"
assert_file_contains "src/components/table/filter-panel.tsx" "md:translate-x-full"
assert_file_contains "src/components/table/filter-panel.tsx" "max-md:translate-y-0"
assert_file_contains "src/components/table/filter-panel.tsx" "max-md:translate-y-full"
assert_file_contains "src/components/table/filter-panel.tsx" "DietaryFilter"
assert_file_contains "src/components/table/filter-panel.tsx" "NutrientRange"
assert_file_contains "src/components/table/filter-panel.tsx" "TagFilter"
assert_file_contains "src/components/table/filter-panel.tsx" "AdditiveFilter"
assert_file_contains "src/components/table/filter-panel.tsx" "Apply Filters"
assert_file_contains "src/components/table/filter-panel.tsx" "Clear All"
assert_file_contains "src/components/table/filter-panel.tsx" "getFilterOptions"
assert_file_contains "src/components/table/filter-panel.tsx" "onApply"
assert_file_contains "src/components/table/filter-panel.tsx" "draft"

# ── DietaryFilter: preset dropdown + editable thresholds ─────────────────────
echo ""
echo "--- DietaryFilter ---"
assert_file_contains "src/components/filters/dietary-filter.tsx" "DIETARY_PRESETS"
assert_file_contains "src/components/filters/dietary-filter.tsx" "getActivePreset"
assert_file_contains "src/components/filters/dietary-filter.tsx" "isPresetModified"
assert_file_contains "src/components/filters/dietary-filter.tsx" "(modified)"
assert_file_contains "src/components/filters/dietary-filter.tsx" "handlePresetSelect"
assert_file_contains "src/components/filters/dietary-filter.tsx" "updateNutrientRange"
assert_file_contains "src/components/filters/dietary-filter.tsx" "presetNutrients"
assert_file_contains "src/components/filters/dietary-filter.tsx" "Select a preset"
assert_file_contains "src/components/filters/dietary-filter.tsx" "processingLevels"

# ── NutrientRange: min/max inputs ─────────────────────────────────────────────
echo ""
echo "--- NutrientRange ---"
assert_file_contains "src/components/filters/nutrient-range.tsx" "NUTRIENTS"
assert_file_contains "src/components/filters/nutrient-range.tsx" "availableNutrients"
assert_file_contains "src/components/filters/nutrient-range.tsx" "addNutrient"
assert_file_contains "src/components/filters/nutrient-range.tsx" "removeRange"
assert_file_contains "src/components/filters/nutrient-range.tsx" "updateRange"
assert_file_contains "src/components/filters/nutrient-range.tsx" "Add nutrient filter"
assert_file_contains "src/components/filters/nutrient-range.tsx" "type=\"number\""

# ── AdditiveFilter: allergen checkboxes ───────────────────────────────────────
echo ""
echo "--- AdditiveFilter ---"
assert_file_contains "src/components/filters/additive-filter.tsx" "AllergenTag"
assert_file_contains "src/components/filters/additive-filter.tsx" "toggle"
assert_file_contains "src/components/filters/additive-filter.tsx" "availableAllergens"
assert_file_contains "src/components/filters/additive-filter.tsx" "type=\"checkbox\""
assert_file_contains "src/components/filters/additive-filter.tsx" "milk"
assert_file_contains "src/components/filters/additive-filter.tsx" "wheat"

# ── TagFilter: food group multi-select ────────────────────────────────────────
echo ""
echo "--- TagFilter ---"
assert_file_contains "src/components/filters/tag-filter.tsx" "availableGroups"
assert_file_contains "src/components/filters/tag-filter.tsx" "toggle"
assert_file_contains "src/components/filters/tag-filter.tsx" "type=\"checkbox\""
assert_file_contains "src/components/filters/tag-filter.tsx" "selected.includes"

# ── DataTable: wired up ───────────────────────────────────────────────────────
echo ""
echo "--- DataTable integration ---"
assert_file_contains "src/components/table/data-table.tsx" "FilterPanel"
assert_file_contains "src/components/table/data-table.tsx" "filterPanelOpen"
assert_file_contains "src/components/table/data-table.tsx" "handleRemoveFilter"
assert_file_contains "src/components/table/data-table.tsx" "handleClearAllFilters"
assert_file_contains "src/components/table/data-table.tsx" "handleApplyFilters"
assert_file_contains "src/components/table/data-table.tsx" "onRemove={handleRemoveFilter}"
assert_file_contains "src/components/table/data-table.tsx" "onOpenPanel"
assert_file_contains "src/components/table/data-table.tsx" "onApply={handleApplyFilters}"
# Placeholder comment should be gone
assert_file_not_contains "src/components/table/data-table.tsx" "Filter bar placeholder"

# ── TypeScript compilation ────────────────────────────────────────────────────
echo ""
echo "--- TypeScript ---"
assert "TypeScript compiles with no errors" \
  "pnpm exec tsc --noEmit --project tsconfig.json"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  printf "$ERRORS\n"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
