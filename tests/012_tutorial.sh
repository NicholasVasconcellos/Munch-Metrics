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

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "=== Test 012: Interactive Tutorial ==="
echo ""

# --- File existence ---
echo "-- File existence --"
assert_file_exists "$ROOT/src/components/tutorial/tutorial-modal.tsx"
assert_file_exists "$ROOT/src/components/tutorial/tutorial-step.tsx"
assert_file_exists "$ROOT/src/components/tutorial/tutorial-trigger.tsx"
assert_file_exists "$ROOT/src/components/tutorial/animations/search-anim.tsx"
assert_file_exists "$ROOT/src/components/tutorial/animations/filter-anim.tsx"
assert_file_exists "$ROOT/src/components/tutorial/animations/sort-anim.tsx"
assert_file_exists "$ROOT/src/components/tutorial/animations/group-anim.tsx"
assert_file_exists "$ROOT/src/components/tutorial/animations/columns-anim.tsx"
assert_file_exists "$ROOT/src/components/tutorial/animations/export-anim.tsx"

echo ""
echo "-- Tutorial modal structure --"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "TutorialModal"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "Dialog"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "currentStep"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "handlePrev"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "handleNext"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "isLast"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "Got it"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "Skip"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "Previous"
# Step dots: loop over steps rendering dot buttons with aria-label
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "Go to step"
# 6 steps
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "SearchAnim"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "FilterAnim"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "SortAnim"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "GroupAnim"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "ColumnsAnim"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "ExportAnim"
# Code splitting via dynamic import
assert_file_contains "$ROOT/src/components/tutorial/tutorial-modal.tsx" "dynamic"

echo ""
echo "-- Tutorial step component --"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-step.tsx" "TutorialStep"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-step.tsx" "title"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-step.tsx" "description"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-step.tsx" "animation"

echo ""
echo "-- Tutorial trigger --"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "TutorialTrigger"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "fixed"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "localStorage"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "DISMISSED_KEY"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "PROMPT_DISMISSED_KEY"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "promptVisible"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "New here"
assert_file_contains "$ROOT/src/components/tutorial/tutorial-trigger.tsx" "HelpCircle"

echo ""
echo "-- Animation components --"
assert_file_contains "$ROOT/src/components/tutorial/animations/search-anim.tsx" "SearchAnim"
assert_file_contains "$ROOT/src/components/tutorial/animations/search-anim.tsx" "useEffect"
assert_file_contains "$ROOT/src/components/tutorial/animations/search-anim.tsx" "chicken"
assert_file_contains "$ROOT/src/components/tutorial/animations/search-anim.tsx" "showDropdown"

assert_file_contains "$ROOT/src/components/tutorial/animations/filter-anim.tsx" "FilterAnim"
assert_file_contains "$ROOT/src/components/tutorial/animations/filter-anim.tsx" "panelOpen"
assert_file_contains "$ROOT/src/components/tutorial/animations/filter-anim.tsx" "checked"
assert_file_contains "$ROOT/src/components/tutorial/animations/filter-anim.tsx" "chips"

assert_file_contains "$ROOT/src/components/tutorial/animations/sort-anim.tsx" "SortAnim"
assert_file_contains "$ROOT/src/components/tutorial/animations/sort-anim.tsx" "direction"
assert_file_contains "$ROOT/src/components/tutorial/animations/sort-anim.tsx" "ChevronUp"
assert_file_contains "$ROOT/src/components/tutorial/animations/sort-anim.tsx" "ChevronDown"

assert_file_contains "$ROOT/src/components/tutorial/animations/group-anim.tsx" "GroupAnim"
assert_file_contains "$ROOT/src/components/tutorial/animations/group-anim.tsx" "grouped"
assert_file_contains "$ROOT/src/components/tutorial/animations/group-anim.tsx" "collapsed"
assert_file_contains "$ROOT/src/components/tutorial/animations/group-anim.tsx" "Food Group"

assert_file_contains "$ROOT/src/components/tutorial/animations/columns-anim.tsx" "ColumnsAnim"
assert_file_contains "$ROOT/src/components/tutorial/animations/columns-anim.tsx" "visible"
assert_file_contains "$ROOT/src/components/tutorial/animations/columns-anim.tsx" "Columns3"

assert_file_contains "$ROOT/src/components/tutorial/animations/export-anim.tsx" "ExportAnim"
assert_file_contains "$ROOT/src/components/tutorial/animations/export-anim.tsx" "Export CSV"
assert_file_contains "$ROOT/src/components/tutorial/animations/export-anim.tsx" "Copy Link"
assert_file_contains "$ROOT/src/components/tutorial/animations/export-anim.tsx" "toast"

echo ""
echo "-- page.tsx wiring --"
assert_file_contains "$ROOT/src/app/page.tsx" "TutorialModal"
assert_file_contains "$ROOT/src/app/page.tsx" "TutorialTrigger"
assert_file_contains "$ROOT/src/app/page.tsx" "tutorialOpen"
assert_file_contains "$ROOT/src/app/page.tsx" "setTutorialOpen"
assert_file_contains "$ROOT/src/app/page.tsx" "onOpenTutorial"

echo ""
echo "-- TypeScript compilation --"
cd "$ROOT"
TSC_OUT=$(pnpm exec tsc --noEmit 2>&1 || true)
if echo "$TSC_OUT" | grep -q "error TS"; then
  FAIL=$((FAIL + 1))
  ERRORS="$ERRORS\n  ✗ TypeScript compiles without errors\n    tsc output:\n$TSC_OUT"
  echo "  ✗ TypeScript compiles without errors"
  echo "$TSC_OUT" | head -30
else
  PASS=$((PASS + 1))
  echo "  ✓ TypeScript compiles without errors"
fi

echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  printf "$ERRORS\n"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
