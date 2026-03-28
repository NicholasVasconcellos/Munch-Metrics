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
echo "=== Test 002: Database Schema & Migrations ==="
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Source files exist ──────────────────────────────────────────────────────
echo "-- Source files"
assert_file_exists "$ROOT/src/lib/db/index.ts"
assert_file_exists "$ROOT/src/lib/db/schema.ts"
assert_file_exists "$ROOT/src/lib/db/migrate.ts"
assert_file_exists "$ROOT/src/types/food.ts"
assert_file_exists "$ROOT/src/types/filters.ts"
assert_file_exists "$ROOT/src/types/table.ts"

# ── drizzle-kit generate produced migration files ───────────────────────────
echo ""
echo "-- Migration files"
assert_file_exists "$ROOT/drizzle/migrations/0000_lonely_namora.sql"
assert_file_exists "$ROOT/drizzle/migrations/0001_food_computed_view.sql"

MIGRATION="$ROOT/drizzle/migrations/0000_lonely_namora.sql"

# ── Migration SQL contains all 8 CREATE TABLE statements ───────────────────
echo ""
echo "-- CREATE TABLE coverage"
assert_file_contains "$MIGRATION" "CREATE TABLE \"foods\""
assert_file_contains "$MIGRATION" "CREATE TABLE \"nutrients\""
assert_file_contains "$MIGRATION" "CREATE TABLE \"price_data\""
assert_file_contains "$MIGRATION" "CREATE TABLE \"bls_food_crosswalk\""
assert_file_contains "$MIGRATION" "CREATE TABLE \"food_images\""
assert_file_contains "$MIGRATION" "CREATE TABLE \"food_tags\""
assert_file_contains "$MIGRATION" "CREATE TABLE \"user_preferences\""
assert_file_contains "$MIGRATION" "CREATE TABLE \"saved_views\""

# ── Migration SQL contains enum definitions ─────────────────────────────────
echo ""
echo "-- Enum definitions"
assert_file_contains "$MIGRATION" "CREATE TYPE \"public\".\"data_source\""
assert_file_contains "$MIGRATION" "CREATE TYPE \"public\".\"nutrient_category\""
assert_file_contains "$MIGRATION" "CREATE TYPE \"public\".\"price_source\""
assert_file_contains "$MIGRATION" "CREATE TYPE \"public\".\"tag_type\""
assert_file_contains "$MIGRATION" "CREATE TYPE \"public\".\"image_source\""

# ── Migration SQL contains CREATE INDEX statements ──────────────────────────
echo ""
echo "-- Index definitions"
assert_file_contains "$MIGRATION" "CREATE INDEX"
assert_file_contains "$MIGRATION" "idx_foods_name"
assert_file_contains "$MIGRATION" "idx_nutrients_food_nutrient"
assert_file_contains "$MIGRATION" "idx_food_tags_value"

# ── Custom migration contains food_computed view ────────────────────────────
CUSTOM="$ROOT/drizzle/migrations/0001_food_computed_view.sql"
echo ""
echo "-- food_computed materialized view"
assert_file_contains "$CUSTOM" "CREATE MATERIALIZED VIEW food_computed"
assert_file_contains "$CUSTOM" "protein_per_dollar"
assert_file_contains "$CUSTOM" "COALESCE"
assert_file_contains "$CUSTOM" "gin_trgm_ops"
assert_file_contains "$CUSTOM" "CREATE UNIQUE INDEX idx_food_computed_id"

# ── Schema defines all expected tables ─────────────────────────────────────
SCHEMA="$ROOT/src/lib/db/schema.ts"
echo ""
echo "-- Schema content"
assert_file_contains "$SCHEMA" "pgTable"
assert_file_contains "$SCHEMA" "pgEnum"
assert_file_contains "$SCHEMA" "export const foods"
assert_file_contains "$SCHEMA" "export const nutrients"
assert_file_contains "$SCHEMA" "export const priceData"
assert_file_contains "$SCHEMA" "export const blsFoodCrosswalk"
assert_file_contains "$SCHEMA" "export const foodImages"
assert_file_contains "$SCHEMA" "export const foodTags"
assert_file_contains "$SCHEMA" "export const userPreferences"
assert_file_contains "$SCHEMA" "export const savedViews"

# ── Types files export expected types ───────────────────────────────────────
echo ""
echo "-- Type exports"
assert_file_contains "$ROOT/src/types/food.ts" "export type Food"
assert_file_contains "$ROOT/src/types/food.ts" "export interface FoodComputed"
assert_file_contains "$ROOT/src/types/food.ts" "proteinPerDollar"
assert_file_contains "$ROOT/src/types/filters.ts" "export interface FoodFilters"
assert_file_contains "$ROOT/src/types/filters.ts" "NutrientRangeFilter"
assert_file_contains "$ROOT/src/types/table.ts" "export interface TableConfig"
assert_file_contains "$ROOT/src/types/table.ts" "export type ColumnKey"
assert_file_contains "$ROOT/src/types/table.ts" "export interface SortConfig"

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
