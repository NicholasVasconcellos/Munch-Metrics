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
  assert "File '$1' contains '$2'" "grep -q '$2' '$1'"
}

cd "$(dirname "$0")/.."

echo ""
echo "=== Test 014: Testing & QA ==="
echo ""

# ── Vitest config files ──────────────────────────────────────────────────────
echo "--- Vitest configuration ---"
assert_file_exists "vitest.config.ts"
assert_file_exists "vitest.integration.config.ts"
assert_file_contains "vitest.config.ts" "vite-tsconfig-paths"
assert_file_contains "vitest.config.ts" "src/lib/__tests__"
assert_file_contains "vitest.integration.config.ts" "tests/integration"

# ── Unit test files ──────────────────────────────────────────────────────────
echo ""
echo "--- Unit test files ---"
assert_file_exists "src/lib/__tests__/url-state.test.ts"
assert_file_exists "src/lib/__tests__/csv-export.test.ts"
assert_file_exists "src/lib/__tests__/constants.test.ts"
assert_file_exists "src/lib/__tests__/price-conversion.test.ts"

assert_file_contains "src/lib/__tests__/url-state.test.ts" "serializeTableState"
assert_file_contains "src/lib/__tests__/url-state.test.ts" "deserializeTableState"
assert_file_contains "src/lib/__tests__/url-state.test.ts" "round-trip"

assert_file_contains "src/lib/__tests__/csv-export.test.ts" "exportToCSV"
assert_file_contains "src/lib/__tests__/csv-export.test.ts" "getCSVFilename"
assert_file_contains "src/lib/__tests__/csv-export.test.ts" "escapes double quotes"

assert_file_contains "src/lib/__tests__/constants.test.ts" "DIETARY_PRESETS"
assert_file_contains "src/lib/__tests__/constants.test.ts" "NUTRIENTS"
assert_file_contains "src/lib/__tests__/constants.test.ts" "SORT_COLUMN_MAP"

assert_file_contains "src/lib/__tests__/price-conversion.test.ts" "PER_LB"
assert_file_contains "src/lib/__tests__/price-conversion.test.ts" "PER_DOZEN"
assert_file_contains "src/lib/__tests__/price-conversion.test.ts" "price_per_100g"

# ── Integration test files ───────────────────────────────────────────────────
echo ""
echo "--- Integration test files ---"
assert_file_exists "tests/integration/seed-usda.test.ts"
assert_file_exists "tests/integration/seed-prices.test.ts"
assert_file_exists "tests/integration/seed-tags.test.ts"
assert_file_exists "tests/integration/query-search.test.ts"
assert_file_exists "tests/integration/query-detail.test.ts"
assert_file_exists "tests/integration/image-proxy.test.ts"

assert_file_contains "tests/integration/seed-usda.test.ts"   "msw"
assert_file_contains "tests/integration/seed-prices.test.ts" "unit conversion"
assert_file_contains "tests/integration/seed-tags.test.ts"   "high_protein"
assert_file_contains "tests/integration/query-search.test.ts" "searchFoods"
assert_file_contains "tests/integration/query-detail.test.ts" "getFoodDetail"
assert_file_contains "tests/integration/image-proxy.test.ts"  "cache"

# ── package.json test scripts ────────────────────────────────────────────────
echo ""
echo "--- package.json scripts ---"
assert_file_contains "package.json" '"test:unit"'
assert_file_contains "package.json" '"test:integration"'
assert_file_contains "package.json" '"test"'
assert_file_contains "package.json" "vitest run --config vitest.config.ts"
assert_file_contains "package.json" "vitest run --config vitest.integration.config.ts"

# ── Unit tests pass ──────────────────────────────────────────────────────────
echo ""
echo "--- Running unit tests (pnpm test:unit) ---"
if pnpm test:unit > /tmp/vitest_unit_output.txt 2>&1; then
  PASS=$((PASS + 1))
  echo "  ✓ Unit tests pass"
  # Extract test count from output
  TEST_COUNT=$(grep -o '[0-9]* passed' /tmp/vitest_unit_output.txt | head -1 | grep -o '[0-9]*' || echo "?")
  echo "    ($TEST_COUNT tests passed)"
else
  FAIL=$((FAIL + 1))
  ERRORS="$ERRORS\n  ✗ Unit tests pass\n    See output below:"
  echo "  ✗ Unit tests pass"
  cat /tmp/vitest_unit_output.txt
fi

# ── TypeScript compiles ──────────────────────────────────────────────────────
echo ""
echo "--- TypeScript compilation ---"
if pnpm tsc 2>&1 | grep -v '^$' | grep -v 'error TS' | head -5; then
  # tsc exits 0 = success
  if pnpm tsc > /dev/null 2>&1; then
    PASS=$((PASS + 1))
    echo "  ✓ TypeScript compiles without errors"
  else
    FAIL=$((FAIL + 1))
    ERRORS="$ERRORS\n  ✗ TypeScript compiles without errors"
    echo "  ✗ TypeScript has compilation errors"
    pnpm tsc 2>&1 | head -20
  fi
else
  PASS=$((PASS + 1))
  echo "  ✓ TypeScript compiles without errors"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  echo -e "$ERRORS"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
