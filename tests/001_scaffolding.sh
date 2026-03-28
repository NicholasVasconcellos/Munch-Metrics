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

# Change to project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "=== Test 001: Project Scaffolding & Theme System ==="
echo ""

# ── Core config files ──────────────────────────────────────────────
echo "-- Core config files --"
assert_file_exists "package.json"
assert_file_exists "tsconfig.json"
assert_file_exists "next.config.ts"
assert_file_exists "postcss.config.mjs"
assert_file_exists "drizzle.config.ts"
assert_file_exists ".env.local.example"
assert_file_exists "components.json"

# ── App files ──────────────────────────────────────────────────────
echo ""
echo "-- App files --"
assert_file_exists "src/app/layout.tsx"
assert_file_exists "src/app/page.tsx"
assert_file_exists "src/app/globals.css"

# ── Theme components ───────────────────────────────────────────────
echo ""
echo "-- Theme components --"
assert_file_exists "src/components/theme/theme-provider.tsx"
assert_file_exists "src/components/theme/theme-toggle.tsx"
assert_file_exists "src/components/theme/accent-picker.tsx"

# ── Layout components ──────────────────────────────────────────────
echo ""
echo "-- Layout components --"
assert_file_exists "src/components/layout/header.tsx"
assert_file_exists "src/components/layout/footer.tsx"
assert_file_exists "src/components/layout/mobile-nav.tsx"

# ── shadcn/ui components ───────────────────────────────────────────
echo ""
echo "-- shadcn/ui components --"
assert_file_exists "src/components/ui/button.tsx"
assert_file_exists "src/components/ui/dialog.tsx"
assert_file_exists "src/components/ui/popover.tsx"
assert_file_exists "src/components/ui/dropdown-menu.tsx"
assert_file_exists "src/components/ui/toggle.tsx"
assert_file_exists "src/components/ui/separator.tsx"

# ── Lib utils ─────────────────────────────────────────────────────
echo ""
echo "-- Lib --"
assert_file_exists "src/lib/utils.ts"

# ── CSS: Tailwind v4 + custom properties ──────────────────────────
echo ""
echo "-- CSS configuration --"
assert_file_contains "src/app/globals.css" '@import "tailwindcss"'
assert_file_contains "src/app/globals.css" 'color-brand'
assert_file_contains "src/app/globals.css" 'data-accent'
assert_file_contains "src/app/globals.css" 'oklch'

# ── Accent presets ────────────────────────────────────────────────
echo ""
echo "-- Accent color presets --"
for accent in blue green teal orange purple rose yellow indigo pink; do
  assert "Accent preset: $accent" "grep -q 'data-accent=\"$accent\"' src/app/globals.css"
done

# ── TypeScript compiles cleanly ───────────────────────────────────
echo ""
echo "-- TypeScript --"
assert "TypeScript compiles (tsc --noEmit)" "pnpm tsc --silent 2>/dev/null || pnpm run tsc"

# ── Production build ──────────────────────────────────────────────
echo ""
echo "-- Production build --"
assert "pnpm build succeeds" "pnpm build"

# ── Summary ───────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  printf "$ERRORS\n"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
