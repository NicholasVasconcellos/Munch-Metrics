#!/bin/bash
# Run all test scripts in order. Stops on first failure.
set -e

TESTS_DIR="$(dirname "$0")"
PASS_COUNT=0
TOTAL_COUNT=0

echo ""
echo "========================================"
echo "  Running All Tests (Regression)"
echo "========================================"
echo ""

for test_file in "$TESTS_DIR"/[0-9]*.sh; do
  [ -e "$test_file" ] || continue
  [ "$(basename "$test_file")" = "run_all.sh" ] && continue

  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  TEST_NAME=$(basename "$test_file" .sh)

  echo "--- $TEST_NAME ---"
  if bash "$test_file"; then
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "  PASS"
  else
    echo ""
    echo "  FAIL: $test_file"
    echo ""
    echo "Regression stopped. $PASS_COUNT/$TOTAL_COUNT passed before failure."
    exit 1
  fi
  echo ""
done

echo "========================================"
echo "  All $TOTAL_COUNT tests passed."
echo "========================================"
