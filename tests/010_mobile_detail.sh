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
echo "=== Test 010: Mobile Layout & Food Detail Modal ==="
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "-- File existence --"
assert_file_exists "$ROOT/src/hooks/use-media-query.ts"
assert_file_exists "$ROOT/src/components/table/mobile-row.tsx"
assert_file_exists "$ROOT/src/components/food/food-detail-modal.tsx"
assert_file_exists "$ROOT/src/components/food/food-image.tsx"

echo ""
echo "-- use-media-query.ts --"
assert_file_contains "$ROOT/src/hooks/use-media-query.ts" "useMediaQuery"
assert_file_contains "$ROOT/src/hooks/use-media-query.ts" "window.matchMedia"
assert_file_contains "$ROOT/src/hooks/use-media-query.ts" "addEventListener"
assert_file_contains "$ROOT/src/hooks/use-media-query.ts" "removeEventListener"

echo ""
echo "-- mobile-row.tsx --"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "MobileRow"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "FoodComputed"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "onOpenDetail"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "expanded"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "visibleColumns"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "thumbnailUrl"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "caloriesPer100g"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "proteinPer100g"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "transition-all"
assert_file_contains "$ROOT/src/components/table/mobile-row.tsx" "max-h-0"

echo ""
echo "-- food-image.tsx --"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "FoodImage"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "next/image"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "blurDataURL"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "onError"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "photographerName"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "Unsplash"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "Utensils"
assert_file_contains "$ROOT/src/components/food/food-image.tsx" "showAttribution"

echo ""
echo "-- food-detail-modal.tsx --"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "FoodDetailModal"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "getFoodDetail"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "Dialog"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "macronutrients"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "vitamins"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "minerals"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "aminoAcids"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "fattyAcids"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "pricePer100g"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "BLS Actual"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "Category Estimate"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "caloriesPerDollar"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "proteinPerDollar"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "FoodImage"
assert_file_contains "$ROOT/src/components/food/food-detail-modal.tsx" "onClose"

echo ""
echo "-- columns.tsx updated --"
assert_file_contains "$ROOT/src/components/table/columns.tsx" "createTableColumns"
assert_file_contains "$ROOT/src/components/table/columns.tsx" "onNameClick"
assert_file_contains "$ROOT/src/components/table/columns.tsx" "tableColumns"

echo ""
echo "-- data-table.tsx updated --"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "useMediaQuery"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "isMobile"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "MobileRow"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "FoodDetailModal"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "selectedFoodId"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "createTableColumns"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "handleOpenDetail"
assert_file_contains "$ROOT/src/components/table/data-table.tsx" "767px"

echo ""
echo "-- TypeScript compilation --"
assert "TypeScript compiles with no errors" "cd '$ROOT' && pnpm exec tsc --noEmit"

echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  echo -e "$ERRORS"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
