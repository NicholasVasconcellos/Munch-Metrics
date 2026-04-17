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
echo "=== Test 013: Auth & Personalization ==="
echo ""

# --- File existence ---
echo "-- File existence --"
assert_file_exists "$ROOT/src/lib/auth/client.ts"
assert_file_exists "$ROOT/src/lib/auth/server.ts"
assert_file_exists "$ROOT/src/components/layout/header.tsx"

echo ""
echo "-- Auth client: Supabase browser client --"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "createClient"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "NEXT_PUBLIC_SUPABASE_URL"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "cookieStorage"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "export const supabase"

echo ""
echo "-- Auth client: helper functions --"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "export async function signIn"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "signInWithOtp"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "export async function signInWithGoogle"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "signInWithOAuth"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "export async function signOut"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "export async function getSession"
assert_file_contains "$ROOT/src/lib/auth/client.ts" "export function onAuthStateChange"

echo ""
echo "-- Auth server: 'use server' directive --"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "'use server'"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "cookies"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "next/headers"

echo ""
echo "-- Auth server: session verification middleware --"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "getServerUser"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "withAuth"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "serverUser.id !== claimedUserId"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "Not authenticated"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "client.auth.getUser"

echo ""
echo "-- Auth server: user preference server actions --"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "export async function getUserPreferences"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "export async function updateUserPreferences"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "export async function getSavedViews"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "export async function saveView"

echo ""
echo "-- Auth server: upsert logic --"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "onConflictDoUpdate"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "userPreferences.userId"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "accentColor"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "dietaryProfile"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "excludedFoods"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "defaultColumns"

echo ""
echo "-- Auth server: saved views with unique share_slug --"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "shareSlug"
assert_file_contains "$ROOT/src/lib/auth/server.ts" "crypto.randomUUID"

echo ""
echo "-- Header: client component with auth UI --"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "'use client'"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "useState"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "useEffect"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "SignInDialog"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "UserMenu"

echo ""
echo "-- Header: sign-in dialog --"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "sign-in-email"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "Sign in with Google"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "magic link"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "signIn("
assert_file_contains "$ROOT/src/components/layout/header.tsx" "signInWithGoogle"

echo ""
echo "-- Header: authenticated user dropdown --"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "DropdownMenu"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "Sign out"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "Preferences"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "handleSignOut"

echo ""
echo "-- Header: preference loading on login --"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "getUserPreferences"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "prefs.accentColor"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "data-accent"

echo ""
echo "-- Header: accent color persistence --"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "MutationObserver"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "updateUserPreferences"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "attributeFilter"

echo ""
echo "-- Header: hydration guard (no flash) --"
assert_file_contains "$ROOT/src/components/layout/header.tsx" "mounted"

echo ""
echo "-- TypeScript compilation --"
cd "$ROOT" && assert "TypeScript compiles with no errors" "pnpm exec tsc --noEmit 2>&1 | grep -v '^$' | grep -v 'error TS' | head -1 ; pnpm exec tsc --noEmit 2>&1 | grep -c 'error TS' | grep -q '^0$'"

echo ""
if [ $FAIL -gt 0 ]; then
  echo "FAILED: $PASS passed, $FAIL failed"
  echo -e "$ERRORS"
  exit 1
else
  echo "PASSED: $PASS passed"
  exit 0
fi
