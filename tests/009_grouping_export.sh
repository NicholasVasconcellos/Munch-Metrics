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
echo "=== Test 009: Grouping, CSV Export & URL Sharing ==="
echo ""

# ── New files exist ─────────────────────────────────────────────────
echo "-- File existence --"
assert_file_exists "src/lib/csv-export.ts"
assert_file_exists "src/components/table/group-selector.tsx"
assert_file_exists "src/components/table/export-csv.tsx"

# ── csv-export.ts content ────────────────────────────────────────────
echo ""
echo "-- csv-export.ts --"
assert_file_contains "src/lib/csv-export.ts" "exportToCSV"
assert_file_contains "src/lib/csv-export.ts" "getCSVFilename"
assert_file_contains "src/lib/csv-export.ts" "munch-metrics-export-"
assert_file_contains "src/lib/csv-export.ts" "text/csv"
assert_file_contains "src/lib/csv-export.ts" "escapeCSV"
assert_file_contains "src/lib/csv-export.ts" "visibleColumns"
# Escape logic: quotes wrapped in double-quotes
assert_file_contains "src/lib/csv-export.ts" 'str.replace(/"/g'
# Handles commas
assert "File src/lib/csv-export.ts checks for commas" "grep -q \"includes(',')\" 'src/lib/csv-export.ts'"
# Returns a Blob
assert_file_contains "src/lib/csv-export.ts" "new Blob"
# Uses COLUMN_HEADERS mapping
assert_file_contains "src/lib/csv-export.ts" "COLUMN_HEADERS"
assert_file_contains "src/lib/csv-export.ts" "Food Group"
assert_file_contains "src/lib/csv-export.ts" "Protein (g/100g)"

# ── group-selector.tsx content ───────────────────────────────────────
echo ""
echo "-- group-selector.tsx --"
assert_file_contains "src/components/table/group-selector.tsx" "GroupSelector"
assert_file_contains "src/components/table/group-selector.tsx" "GroupByField"
assert_file_contains "src/components/table/group-selector.tsx" "No Grouping"
assert_file_contains "src/components/table/group-selector.tsx" "Food Group"
assert_file_contains "src/components/table/group-selector.tsx" "Data Source"
assert_file_contains "src/components/table/group-selector.tsx" "Processing Level"
assert_file_contains "src/components/table/group-selector.tsx" "onChange"
assert_file_contains "src/components/table/group-selector.tsx" "aria-label"

# ── export-csv.tsx content ───────────────────────────────────────────
echo ""
echo "-- export-csv.tsx --"
assert_file_contains "src/components/table/export-csv.tsx" "ExportCSV"
assert_file_contains "src/components/table/export-csv.tsx" "exportToCSV"
assert_file_contains "src/components/table/export-csv.tsx" "getCSVFilename"
assert_file_contains "src/components/table/export-csv.tsx" "URL.createObjectURL"
assert_file_contains "src/components/table/export-csv.tsx" "a.download"
assert_file_contains "src/components/table/export-csv.tsx" "URL.revokeObjectURL"
assert_file_contains "src/components/table/export-csv.tsx" "visibleColumns"
assert_file_contains "src/components/table/export-csv.tsx" "rows.length === 0"

# ── data-table.tsx wiring ────────────────────────────────────────────
echo ""
echo "-- data-table.tsx wiring --"
assert_file_contains "src/components/table/data-table.tsx" "GroupSelector"
assert_file_contains "src/components/table/data-table.tsx" "ExportCSV"
assert_file_contains "src/components/table/data-table.tsx" "Copy Link"
assert_file_contains "src/components/table/data-table.tsx" "navigator.clipboard"
assert_file_contains "src/components/table/data-table.tsx" "copySuccess"
assert_file_contains "src/components/table/data-table.tsx" "handleGroupChange"
assert_file_contains "src/components/table/data-table.tsx" "groupedSections"
assert_file_contains "src/components/table/data-table.tsx" "collapsedGroups"
assert_file_contains "src/components/table/data-table.tsx" "toggleGroup"
assert_file_contains "src/components/table/data-table.tsx" "isCollapsed"
# Group header row shows count
assert_file_contains "src/components/table/data-table.tsx" "section.rows.length"
# Group key rendered
assert_file_contains "src/components/table/data-table.tsx" "section.key"
# Reset collapsed groups when groupBy changes
assert_file_contains "src/components/table/data-table.tsx" "setCollapsedGroups"

# ── url-state.ts already has group serialization ─────────────────────
echo ""
echo "-- url-state.ts group param --"
assert "File src/lib/url-state.ts sets group param" "grep -q \"set.*group\" 'src/lib/url-state.ts'"
assert "File src/lib/url-state.ts reads group param" "grep -q \"get.*group\" 'src/lib/url-state.ts'"
assert_file_contains "src/lib/url-state.ts" "VALID_GROUP_BY"
assert_file_contains "src/lib/url-state.ts" "foodGroup"
assert_file_contains "src/lib/url-state.ts" "dataSource"
assert_file_contains "src/lib/url-state.ts" "processingLevel"

# ── TypeScript compilation ────────────────────────────────────────────
echo ""
echo "-- TypeScript --"
TSC_OUTPUT=$(cd "$(dirname "$0")/.." && pnpm exec tsc --noEmit 2>&1 || true)
if echo "$TSC_OUTPUT" | grep -q "error TS"; then
  FAIL=$((FAIL + 1))
  echo "  ✗ TypeScript compiles without errors"
  echo "    tsc output:"
  echo "$TSC_OUTPUT" | grep "error TS" | head -20 | sed 's/^/    /'
  ERRORS="$ERRORS\n  ✗ TypeScript compiles without errors"
else
  PASS=$((PASS + 1))
  echo "  ✓ TypeScript compiles without errors"
fi

# ── Summary ─────────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  echo -e "$ERRORS"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
