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

REPO="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "=== Test 011: Landing Page ==="
echo ""

# --- File existence ---
echo "-- File existence --"
assert_file_exists "$REPO/src/components/landing/hero.tsx"
assert_file_exists "$REPO/src/components/landing/how-it-works.tsx"
assert_file_exists "$REPO/src/components/landing/stats-bar.tsx"
assert_file_exists "$REPO/src/components/landing/scroll-transition.tsx"

# --- Hero section ---
echo ""
echo "-- Hero section --"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "Every nutrient"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "Every food"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "One table"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "Explore Foods"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "See How It Works"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "onOpenTutorial"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "table-section"
assert_file_contains "$REPO/src/components/landing/hero.tsx" "scrollIntoView"

# --- How It Works section ---
echo ""
echo "-- How It Works section --"
assert_file_contains "$REPO/src/components/landing/how-it-works.tsx" "Search"
assert_file_contains "$REPO/src/components/landing/how-it-works.tsx" "Filter"
assert_file_contains "$REPO/src/components/landing/how-it-works.tsx" "Discover"
assert_file_contains "$REPO/src/components/landing/how-it-works.tsx" "8,000+"
assert_file_contains "$REPO/src/components/landing/how-it-works.tsx" "how-it-works-cards"
assert_file_contains "$REPO/src/components/landing/how-it-works.tsx" "protein-per-dollar"

# --- Stats bar ---
echo ""
echo "-- Stats bar --"
assert_file_contains "$REPO/src/components/landing/stats-bar.tsx" "8000"
assert_file_contains "$REPO/src/components/landing/stats-bar.tsx" "40"
assert_file_contains "$REPO/src/components/landing/stats-bar.tsx" "Monthly"
assert_file_contains "$REPO/src/components/landing/stats-bar.tsx" "Free"
assert_file_contains "$REPO/src/components/landing/stats-bar.tsx" "IntersectionObserver"
assert_file_contains "$REPO/src/components/landing/stats-bar.tsx" "stats-bar"

# --- Scroll transition ---
echo ""
echo "-- Scroll transition --"
assert_file_contains "$REPO/src/components/landing/scroll-transition.tsx" "scroll-transition"
assert_file_contains "$REPO/src/components/landing/scroll-transition.tsx" "IntersectionObserver"
assert_file_contains "$REPO/src/components/landing/scroll-transition.tsx" "Dive into the data"

# --- page.tsx composition ---
echo ""
echo "-- page.tsx composition --"
assert_file_contains "$REPO/src/app/page.tsx" "Hero"
assert_file_contains "$REPO/src/app/page.tsx" "HowItWorks"
assert_file_contains "$REPO/src/app/page.tsx" "StatsBar"
assert_file_contains "$REPO/src/app/page.tsx" "ScrollTransition"
assert_file_contains "$REPO/src/app/page.tsx" "table-section"
assert_file_contains "$REPO/src/app/page.tsx" "dynamic"

# --- TypeScript compilation ---
echo ""
echo "-- TypeScript compilation --"
assert "TypeScript compiles" "cd '$REPO' && pnpm exec tsc --noEmit 2>&1"

# --- Build ---
echo ""
echo "-- Production build --"
assert "pnpm build succeeds" "cd '$REPO' && pnpm build 2>&1"

echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  printf "%b\n" "$ERRORS"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
