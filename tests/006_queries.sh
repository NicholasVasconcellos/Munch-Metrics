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

echo ""
echo "=== Test 006: Query Functions & Image Proxy ==="
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── File existence ──────────────────────────────────────────────────────────────
echo "--- File existence ---"
assert_file_exists "$ROOT/src/lib/constants.ts"
assert_file_exists "$ROOT/src/lib/queries/search-foods.ts"
assert_file_exists "$ROOT/src/lib/queries/get-food-detail.ts"
assert_file_exists "$ROOT/src/lib/queries/get-filter-options.ts"
assert_file_exists "$ROOT/src/app/api/images/[foodId]/route.ts"

# ── constants.ts ────────────────────────────────────────────────────────────────
echo ""
echo "--- constants.ts ---"
assert_file_contains "$ROOT/src/lib/constants.ts" "export const NUTRIENTS"
assert_file_contains "$ROOT/src/lib/constants.ts" "export const DIETARY_PRESETS"
assert_file_contains "$ROOT/src/lib/constants.ts" "export const SORT_COLUMN_MAP"
assert_file_contains "$ROOT/src/lib/constants.ts" "export const NUTRIENT_COLUMN_MAP"
assert_file_contains "$ROOT/src/lib/constants.ts" "calories_per_100g"
assert_file_contains "$ROOT/src/lib/constants.ts" "protein_per_100g"
assert_file_contains "$ROOT/src/lib/constants.ts" "'vegan'"
assert_file_contains "$ROOT/src/lib/constants.ts" "'keto'"
assert_file_contains "$ROOT/src/lib/constants.ts" "'high_protein'"
assert_file_contains "$ROOT/src/lib/constants.ts" "'low_sodium'"
assert_file_contains "$ROOT/src/lib/constants.ts" "'gluten_free'"
assert_file_contains "$ROOT/src/lib/constants.ts" "'dairy_free'"
assert_file_contains "$ROOT/src/lib/constants.ts" "proteinPerDollar"
assert_file_contains "$ROOT/src/lib/constants.ts" "NutrientMeta"
assert_file_contains "$ROOT/src/lib/constants.ts" "DietaryPreset"

# ── search-foods.ts ─────────────────────────────────────────────────────────────
echo ""
echo "--- search-foods.ts ---"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "'use server'"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "export async function searchFoods"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "TableQueryResult"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "pg_trgm"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "food_computed"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.search"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.foodGroups"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.dietary"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.excludeAllergens"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.processingLevels"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.nutrientRanges"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.priceRange"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "filters.excludedFoodIds"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "SORT_COLUMN_MAP"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "NUTRIENT_COLUMN_MAP"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "sql.raw"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "totalPages"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "LIMIT"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "OFFSET"
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" "groupBy.*foodGroup\|foodGroup.*groupBy"
# GROUP BY support
assert "search-foods.ts handles groupBy foodGroup" "grep -q \"groupBy === 'foodGroup'\" '$ROOT/src/lib/queries/search-foods.ts'"
assert "search-foods.ts handles groupBy dataSource" "grep -q \"groupBy === 'dataSource'\" '$ROOT/src/lib/queries/search-foods.ts'"
assert "search-foods.ts handles groupBy processingLevel" "grep -q \"groupBy === 'processingLevel'\" '$ROOT/src/lib/queries/search-foods.ts'"
# Camel-case column aliases
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" '"proteinPer100g"'
assert_file_contains "$ROOT/src/lib/queries/search-foods.ts" '"proteinPerDollar"'

# ── get-food-detail.ts ──────────────────────────────────────────────────────────
echo ""
echo "--- get-food-detail.ts ---"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "'use server'"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "export async function getFoodDetail"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "FoodDetailResult"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "macronutrients"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "vitamins"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "minerals"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "fattyAcids"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "aminoAcids"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "foodTags"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "foodImages"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "priceData"
assert_file_contains "$ROOT/src/lib/queries/get-food-detail.ts" "Promise.all"

# ── get-filter-options.ts ───────────────────────────────────────────────────────
echo ""
echo "--- get-filter-options.ts ---"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "'use server'"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "export async function getFilterOptions"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "FilterOptions"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "foodGroups"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "dietaryTags"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "allergenTags"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "processingLevels"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "nutrientRanges"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "MIN(calories_per_100g)"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "MAX(protein_per_100g)"
assert_file_contains "$ROOT/src/lib/queries/get-filter-options.ts" "Promise.all"

# ── image proxy route.ts ────────────────────────────────────────────────────────
echo ""
echo "--- image proxy route.ts ---"
ROUTE="$ROOT/src/app/api/images/[foodId]/route.ts"
assert_file_contains "$ROUTE" "export async function GET"
assert_file_contains "$ROUTE" "UNSPLASH_ACCESS_KEY"
assert_file_contains "$ROUTE" "foodImages"
assert_file_contains "$ROUTE" "onConflictDoUpdate"
assert_file_contains "$ROUTE" "cached: true"
assert_file_contains "$ROUTE" "placeholder: true"
assert_file_contains "$ROUTE" "photographer_name"
assert_file_contains "$ROUTE" "thumbnail_url"
assert_file_contains "$ROUTE" "AbortSignal.timeout"

# ── TypeScript compiles ─────────────────────────────────────────────────────────
echo ""
echo "--- TypeScript compilation ---"
assert "TypeScript compiles without errors" "cd '$ROOT' && npx tsc --noEmit"

# ── Summary ─────────────────────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  echo -e "$ERRORS"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
