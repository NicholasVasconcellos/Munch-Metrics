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
echo "=== Test 007: Core Data Table ==="
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── File existence ────────────────────────────────────────────────────────────
echo "--- File existence ---"
assert_file_exists "$ROOT/src/lib/url-state.ts"
assert_file_exists "$ROOT/src/hooks/use-debounce.ts"
assert_file_exists "$ROOT/src/hooks/use-url-state.ts"
assert_file_exists "$ROOT/src/hooks/use-food-query.ts"
assert_file_exists "$ROOT/src/components/table/columns.tsx"
assert_file_exists "$ROOT/src/components/table/sort-indicator.tsx"
assert_file_exists "$ROOT/src/components/table/column-picker.tsx"
assert_file_exists "$ROOT/src/components/table/filter-bar.tsx"
assert_file_exists "$ROOT/src/components/table/data-table.tsx"

# ── url-state.ts ──────────────────────────────────────────────────────────────
echo ""
echo "--- url-state.ts ---"
URL_STATE="$ROOT/src/lib/url-state.ts"
assert_file_contains "$URL_STATE" "serializeTableState"
assert_file_contains "$URL_STATE" "deserializeTableState"
assert_file_contains "$URL_STATE" "DEFAULT_TABLE_CONFIG"
assert_file_contains "$URL_STATE" "DEFAULT_VISIBLE_COLUMNS"
assert_file_contains "$URL_STATE" "params.set"
assert_file_contains "$URL_STATE" "sort"
assert_file_contains "$URL_STATE" "dir"
assert_file_contains "$URL_STATE" "cols"
assert_file_contains "$URL_STATE" "group"

# ── use-debounce.ts ───────────────────────────────────────────────────────────
echo ""
echo "--- use-debounce.ts ---"
assert_file_contains "$ROOT/src/hooks/use-debounce.ts" "useDebounce"
assert_file_contains "$ROOT/src/hooks/use-debounce.ts" "setTimeout"
assert_file_contains "$ROOT/src/hooks/use-debounce.ts" "clearTimeout"

# ── use-url-state.ts ─────────────────────────────────────────────────────────
echo ""
echo "--- use-url-state.ts ---"
URL_STATE_HOOK="$ROOT/src/hooks/use-url-state.ts"
assert_file_contains "$URL_STATE_HOOK" "useUrlState"
assert_file_contains "$URL_STATE_HOOK" "useRouter"
assert_file_contains "$URL_STATE_HOOK" "useSearchParams"
assert_file_contains "$URL_STATE_HOOK" "usePathname"
assert_file_contains "$URL_STATE_HOOK" "tableConfig"
assert_file_contains "$URL_STATE_HOOK" "setTableConfig"
assert_file_contains "$URL_STATE_HOOK" "router.replace"

# ── use-food-query.ts ─────────────────────────────────────────────────────────
echo ""
echo "--- use-food-query.ts ---"
FOOD_QUERY="$ROOT/src/hooks/use-food-query.ts"
assert_file_contains "$FOOD_QUERY" "useFoodQuery"
assert_file_contains "$FOOD_QUERY" "searchFoods"
assert_file_contains "$FOOD_QUERY" "isLoading"
assert_file_contains "$FOOD_QUERY" "cancelled"
assert_file_contains "$FOOD_QUERY" "configKey"

# ── columns.tsx ───────────────────────────────────────────────────────────────
echo ""
echo "--- columns.tsx ---"
COLUMNS="$ROOT/src/components/table/columns.tsx"
assert_file_contains "$COLUMNS" "tableColumns"
assert_file_contains "$COLUMNS" "IMAGE_COLUMN_ID"
assert_file_contains "$COLUMNS" "name"
assert_file_contains "$COLUMNS" "caloriesPer100g"
assert_file_contains "$COLUMNS" "proteinPer100g"
assert_file_contains "$COLUMNS" "fatPer100g"
assert_file_contains "$COLUMNS" "carbsPer100g"
assert_file_contains "$COLUMNS" "foodGroup"
assert_file_contains "$COLUMNS" "fiberPer100g"
assert_file_contains "$COLUMNS" "pricePer100g"
assert_file_contains "$COLUMNS" "proteinPerDollar"
assert_file_contains "$COLUMNS" "enableSorting: true"
assert_file_contains "$COLUMNS" "tabular-nums"

# ── sort-indicator.tsx ────────────────────────────────────────────────────────
echo ""
echo "--- sort-indicator.tsx ---"
SORT_IND="$ROOT/src/components/table/sort-indicator.tsx"
assert_file_contains "$SORT_IND" "SortIndicator"
assert_file_contains "$SORT_IND" "ChevronUp"
assert_file_contains "$SORT_IND" "ChevronDown"
assert_file_contains "$SORT_IND" "ChevronsUpDown"
assert_file_contains "$SORT_IND" "'asc'"
assert_file_contains "$SORT_IND" "'desc'"

# ── column-picker.tsx ─────────────────────────────────────────────────────────
echo ""
echo "--- column-picker.tsx ---"
COL_PICKER="$ROOT/src/components/table/column-picker.tsx"
assert_file_contains "$COL_PICKER" "ColumnPicker"
assert_file_contains "$COL_PICKER" "Popover"
assert_file_contains "$COL_PICKER" "visibleColumns"
assert_file_contains "$COL_PICKER" "onToggle"
assert_file_contains "$COL_PICKER" "checkbox"

# ── filter-bar.tsx ────────────────────────────────────────────────────────────
echo ""
echo "--- filter-bar.tsx ---"
assert_file_contains "$ROOT/src/components/table/filter-bar.tsx" "FilterBar"

# ── data-table.tsx ────────────────────────────────────────────────────────────
echo ""
echo "--- data-table.tsx ---"
DT="$ROOT/src/components/table/data-table.tsx"
assert_file_contains "$DT" "DataTable"
assert_file_contains "$DT" "useReactTable"
assert_file_contains "$DT" "getCoreRowModel"
assert_file_contains "$DT" "manualSorting"
assert_file_contains "$DT" "manualPagination"
assert_file_contains "$DT" "columnResizeMode"
assert_file_contains "$DT" "useUrlState"
assert_file_contains "$DT" "useFoodQuery"
assert_file_contains "$DT" "useDebounce"
assert_file_contains "$DT" "ColumnPicker"
assert_file_contains "$DT" "SortIndicator"
assert_file_contains "$DT" "FilterBar"
assert_file_contains "$DT" "Loader2"
assert_file_contains "$DT" "animate-spin"
assert_file_contains "$DT" "animate-pulse"
assert_file_contains "$DT" "onSortingChange"
assert_file_contains "$DT" "onColumnVisibilityChange"
assert_file_contains "$DT" "onPaginationChange"
assert_file_contains "$DT" "Search"
assert_file_contains "$DT" "debounce"
assert_file_contains "$DT" "suggestions"
assert_file_contains "$DT" "ChevronLeft"
assert_file_contains "$DT" "ChevronRight"

# ── page.tsx ──────────────────────────────────────────────────────────────────
echo ""
echo "--- page.tsx ---"
PAGE="$ROOT/src/app/page.tsx"
assert_file_contains "$PAGE" "DataTable"
assert_file_contains "$PAGE" "Suspense"
assert_file_contains "$PAGE" "Header"
assert_file_contains "$PAGE" "Footer"

# ── TypeScript compiles ───────────────────────────────────────────────────────
echo ""
echo "--- TypeScript ---"
assert "TypeScript compiles with no errors" "cd '$ROOT' && pnpm tsc --noEmit"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  echo -e "$ERRORS"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
