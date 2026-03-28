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

echo ""
echo "=== Test 003: USDA Data Seed Script ==="
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/scripts/seed-usda.ts"

# ── File existence ──────────────────────────────────────────────────────────
echo "-- File existence"
assert_file_exists "$SCRIPT"

# ── Database connection ─────────────────────────────────────────────────────
echo ""
echo "-- Database connection"
assert_file_contains "$SCRIPT" "DATABASE_URL"
assert_file_contains "$SCRIPT" "lib/db/index"
assert_file_contains "$SCRIPT" "drizzle"

# ── API pagination ──────────────────────────────────────────────────────────
echo ""
echo "-- API pagination"
assert_file_contains "$SCRIPT" "pageNumber"
assert_file_contains "$SCRIPT" "PAGE_SIZE"
assert_file_contains "$SCRIPT" "pageSize"
assert_file_contains "$SCRIPT" "FDC_BASE_URL"
assert_file_contains "$SCRIPT" "REQUEST_DELAY_MS"

# ── Rate limiting ───────────────────────────────────────────────────────────
echo ""
echo "-- Rate limiting"
assert_file_contains "$SCRIPT" "delay"
assert_file_contains "$SCRIPT" "setTimeout"

# ── Food group mapping ──────────────────────────────────────────────────────
echo ""
echo "-- Food group mapping"
assert_file_contains "$SCRIPT" "mapDataType"
assert_file_contains "$SCRIPT" "Foundation"
assert_file_contains "$SCRIPT" "SR Legacy"
assert_file_contains "$SCRIPT" "sr_legacy"
assert_file_contains "$SCRIPT" "foodGroup"
assert_file_contains "$SCRIPT" "foodCategory"

# ── Nutrient → food_id linking ──────────────────────────────────────────────
echo ""
echo "-- Nutrient-to-food linking"
assert_file_contains "$SCRIPT" "foodId"
assert_file_contains "$SCRIPT" "lib/db/schema"
assert_file_contains "$SCRIPT" "nutrients"

# ── Nutrient category classification ────────────────────────────────────────
echo ""
echo "-- Nutrient category classification"
assert_file_contains "$SCRIPT" "classifyNutrient"
assert_file_contains "$SCRIPT" "macronutrient"
assert_file_contains "$SCRIPT" "vitamin"
assert_file_contains "$SCRIPT" "mineral"
assert_file_contains "$SCRIPT" "fatty_acid"
assert_file_contains "$SCRIPT" "amino_acid"

# ── Upsert / idempotency ─────────────────────────────────────────────────────
echo ""
echo "-- Idempotency (upsert)"
assert_file_contains "$SCRIPT" "onConflictDoUpdate"
assert_file_contains "$SCRIPT" "fdc_id\|fdcId"

# ── Materialized view refresh ────────────────────────────────────────────────
echo ""
echo "-- Materialized view refresh"
assert_file_contains "$SCRIPT" "REFRESH MATERIALIZED VIEW"
assert_file_contains "$SCRIPT" "food_computed"

# ── Progress logging ─────────────────────────────────────────────────────────
echo ""
echo "-- Progress logging"
assert_file_contains "$SCRIPT" "totalProcessed\|total foods"
assert_file_contains "$SCRIPT" "console.log"

# ── TypeScript compiles ──────────────────────────────────────────────────────
echo ""
echo "-- TypeScript compilation"
assert "TypeScript compiles (pnpm tsc --noEmit)" "cd '$ROOT' && pnpm tsc --noEmit 2>&1"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  printf "$ERRORS\n"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
