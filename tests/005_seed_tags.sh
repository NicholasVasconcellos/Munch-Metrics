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
echo "=== Test 005: Tag Derivation Seed Script ==="
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEED="$ROOT/scripts/seed-tags.ts"

# ── File existence ──────────────────────────────────────────────────────────
echo "-- File existence"
assert_file_exists "$SEED"

# ── Imports ─────────────────────────────────────────────────────────────────
echo ""
echo "-- Imports"
assert_file_contains "$SEED" "lib/db/index"
assert_file_contains "$SEED" "lib/db/schema"
assert_file_contains "$SEED" "foodTags"
assert_file_contains "$SEED" "foods"
assert_file_contains "$SEED" "nutrients"

# ── Dietary tag values ───────────────────────────────────────────────────────
echo ""
echo "-- Dietary tag values"
assert_file_contains "$SEED" "'vegan'"
assert_file_contains "$SEED" "'vegetarian'"
assert_file_contains "$SEED" "'pescatarian'"
assert_file_contains "$SEED" "'keto'"
assert_file_contains "$SEED" "'high_protein'"
assert_file_contains "$SEED" "'low_sodium'"
assert_file_contains "$SEED" "'gluten_free'"
assert_file_contains "$SEED" "'dairy_free'"

# ── Allergen tag values ──────────────────────────────────────────────────────
echo ""
echo "-- Allergen tag values"
assert_file_contains "$SEED" "'contains_dairy'"
assert_file_contains "$SEED" "'contains_gluten'"
assert_file_contains "$SEED" "'contains_nuts'"
assert_file_contains "$SEED" "'contains_soy'"
assert_file_contains "$SEED" "'contains_eggs'"
assert_file_contains "$SEED" "'contains_fish'"
assert_file_contains "$SEED" "'contains_shellfish'"

# ── Processing level tag values ──────────────────────────────────────────────
echo ""
echo "-- Processing level tag values"
assert_file_contains "$SEED" "'whole_food'"
assert_file_contains "$SEED" "'minimally_processed'"
assert_file_contains "$SEED" "'processed'"

# ── Tag type enum values ─────────────────────────────────────────────────────
echo ""
echo "-- Tag type enum values"
assert_file_contains "$SEED" "'dietary'"
assert_file_contains "$SEED" "'allergen'"
assert_file_contains "$SEED" "'processing_level'"

# ── Food group heuristics for chicken/meat (high-protein, dairy-free) ────────
echo ""
echo "-- Meat/poultry group heuristics"
assert_file_contains "$SEED" "poultry"
assert_file_contains "$SEED" "beef"
assert_file_contains "$SEED" "pork"
assert_file_contains "$SEED" "lamb"
assert_file_contains "$SEED" "protein > 20"

# ── Soy/tofu heuristics (vegan, contains_soy) ────────────────────────────────
echo ""
echo "-- Soy/tofu heuristics"
assert_file_contains "$SEED" "tofu"
assert_file_contains "$SEED" "tempeh"
assert_file_contains "$SEED" "edamame"
assert_file_contains "$SEED" "legumes"

# ── Fish/shellfish heuristics (pescatarian, contains_fish, contains_shellfish)─
echo ""
echo "-- Fish/shellfish heuristics"
assert_file_contains "$SEED" "finfish"
assert_file_contains "$SEED" "shellfish"
assert_file_contains "$SEED" "shrimp"

# ── Nutrient-based threshold values ─────────────────────────────────────────
echo ""
echo "-- Nutrient thresholds"
assert_file_contains "$SEED" "carbs < 10"
assert_file_contains "$SEED" "fat > 10"
assert_file_contains "$SEED" "sodium < 140"
assert_file_contains "$SEED" "carbohydrate"
assert_file_contains "$SEED" "sodium"

# ── Idempotency (delete before reinsert) ────────────────────────────────────
echo ""
echo "-- Idempotency"
assert_file_contains "$SEED" "delete"
assert_file_contains "$SEED" "dietary.*allergen.*processing_level"

# ── Bulk insert in batches ───────────────────────────────────────────────────
echo ""
echo "-- Bulk insert in batches"
assert_file_contains "$SEED" "BATCH_SIZE"
assert_file_contains "$SEED" "slice"
assert_file_contains "$SEED" "insert"

# ── Summary statistics ───────────────────────────────────────────────────────
echo ""
echo "-- Summary statistics"
assert_file_contains "$SEED" "count"
assert_file_contains "$SEED" "groupBy"
assert_file_contains "$SEED" "Tag distribution"

# ── Runnable via tsx ──────────────────────────────────────────────────────────
echo ""
echo "-- Runnable via tsx"
assert_file_contains "$SEED" "main()"
assert_file_contains "$SEED" "process.exit"
assert_file_contains "$SEED" "DATABASE_URL"

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
