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
echo "=== Test 004: BLS Price Seed & Crosswalk ==="
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CROSSWALK="$ROOT/scripts/bls-crosswalk.ts"
SEED="$ROOT/scripts/seed-prices.ts"

# ── File existence ──────────────────────────────────────────────────────────
echo "-- File existence"
assert_file_exists "$CROSSWALK"
assert_file_exists "$SEED"

# ── Crosswalk structure ─────────────────────────────────────────────────────
echo ""
echo "-- Crosswalk structure"
assert_file_contains "$CROSSWALK" "CrosswalkEntry"
assert_file_contains "$CROSSWALK" "blsSeriesId"
assert_file_contains "$CROSSWALK" "blsItemName"
assert_file_contains "$CROSSWALK" "usdaSearchTerm"
assert_file_contains "$CROSSWALK" "unitConversionFactor"
assert_file_contains "$CROSSWALK" "blsUnit"
assert_file_contains "$CROSSWALK" "export const CROSSWALK"

# ── Crosswalk has ≥50 entries (count 'APU' occurrences as series IDs) ───────
echo ""
echo "-- Crosswalk has at least 50 BLS series entries"
SERIES_COUNT=$(grep -c "APU" "$CROSSWALK" || true)
assert "Crosswalk contains ≥50 series (found $SERIES_COUNT)" "[ '$SERIES_COUNT' -ge 50 ]"

# ── Unit conversion factors are numeric and plausible ───────────────────────
echo ""
echo "-- Unit conversion factors"
assert_file_contains "$CROSSWALK" "PER_LB"
assert_file_contains "$CROSSWALK" "PER_DOZEN"
assert_file_contains "$CROSSWALK" "PER_HALF_GAL"
assert_file_contains "$CROSSWALK" "PER_5_LB"
assert_file_contains "$CROSSWALK" "0.22046"
assert_file_contains "$CROSSWALK" "0.16667"
assert_file_contains "$CROSSWALK" "0.05285"

# ── BLS API integration ─────────────────────────────────────────────────────
echo ""
echo "-- BLS API integration"
assert_file_contains "$SEED" "api.bls.gov/publicAPI/v2/timeseries/data"
assert_file_contains "$SEED" "BLS_API_KEY"
assert_file_contains "$SEED" "seriesid"
assert_file_contains "$SEED" "startyear"
assert_file_contains "$SEED" "endyear"
assert_file_contains "$SEED" "registrationkey"

# ── BLS response parsing ────────────────────────────────────────────────────
echo ""
echo "-- BLS response parsing"
assert_file_contains "$SEED" "REQUEST_SUCCEEDED"
assert_file_contains "$SEED" "Results"
assert_file_contains "$SEED" "series"
assert_file_contains "$SEED" "M13"
assert_file_contains "$SEED" "latest"

# ── Batch handling ──────────────────────────────────────────────────────────
echo ""
echo "-- Batch handling (≤50 series per request)"
assert_file_contains "$SEED" "BLS_BATCH_SIZE"
assert_file_contains "$SEED" "50"
assert_file_contains "$SEED" "slice"

# ── USDA food lookup ────────────────────────────────────────────────────────
echo ""
echo "-- USDA food lookup"
assert_file_contains "$SEED" "ilike"
assert_file_contains "$SEED" "usdaSearchTerm"
assert_file_contains "$SEED" "resolveCrosswalk"
assert_file_contains "$SEED" "foods"
assert_file_contains "$SEED" "lib/db"

# ── price_per_100g calculation ──────────────────────────────────────────────
echo ""
echo "-- price_per_100g calculation"
assert_file_contains "$SEED" "unitConversionFactor"
assert_file_contains "$SEED" "pricePer100g"
assert_file_contains "$SEED" "pricePerUnit"

# ── bls_food_crosswalk upsert ───────────────────────────────────────────────
echo ""
echo "-- bls_food_crosswalk upsert"
assert_file_contains "$SEED" "blsFoodCrosswalk"
assert_file_contains "$SEED" "onConflictDoUpdate"
assert_file_contains "$SEED" "blsSeriesId"

# ── price_data insert (BLS rows linked to food_id) ──────────────────────────
echo ""
echo "-- price_data insert with food_id link"
assert_file_contains "$SEED" "priceData"
assert "File '$SEED' contains source bls enum" "grep -q \"source: 'bls'\" '$SEED'"
assert_file_contains "$SEED" "foodId"
assert_file_contains "$SEED" "period"

# ── Category fallback prices (no food_id, food_group only) ──────────────────
echo ""
echo "-- USDA category fallback prices"
assert_file_contains "$SEED" "usda_estimate"
assert_file_contains "$SEED" "CATEGORY_FALLBACKS"
assert_file_contains "$SEED" "foodGroup"
assert_file_contains "$SEED" "Beef Products"
assert_file_contains "$SEED" "Poultry Products"
assert_file_contains "$SEED" "Dairy and Egg Products"
assert_file_contains "$SEED" "Vegetables and Vegetable Products"

# ── Idempotency (delete before insert) ─────────────────────────────────────
echo ""
echo "-- Idempotency"
assert_file_contains "$SEED" "delete"
assert_file_contains "$SEED" "onConflictDoUpdate"

# ── Materialized view refresh ────────────────────────────────────────────────
echo ""
echo "-- Materialized view refresh"
assert_file_contains "$SEED" "REFRESH MATERIALIZED VIEW"
assert_file_contains "$SEED" "food_computed"

# ── DATABASE_URL guard ───────────────────────────────────────────────────────
echo ""
echo "-- DATABASE_URL guard"
assert_file_contains "$SEED" "DATABASE_URL"
assert_file_contains "$SEED" "process.exit(1)"

# ── TypeScript compilation ───────────────────────────────────────────────────
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
