'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { userPreferences, savedViews } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// ─── Internal: Server-side session verification ───────────────────────────────

async function getServerUser() {
  const cookieStore = await cookies()

  // Build a server-side Supabase client that reads the auth cookie written
  // by the browser client's cookie storage adapter.
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => cookieStore.get(key)?.value ?? null,
          setItem: () => {},
          removeItem: () => {},
        },
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )

  // getUser() validates the access token against Supabase — more secure than getSession()
  const { data: { user } } = await client.auth.getUser()
  return user
}

// ─── Internal: Protected action middleware ────────────────────────────────────

async function withAuth<T>(
  claimedUserId: string,
  fn: (verifiedUserId: string) => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const serverUser = await getServerUser()
  if (!serverUser || serverUser.id !== claimedUserId) {
    return { success: false, error: 'Not authenticated' }
  }
  try {
    return { success: true, data: await fn(serverUser.id) }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export async function getUserPreferences(userId: string) {
  try {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))

    return { success: true as const, data: prefs ?? null }
  } catch (err) {
    return { success: false as const, error: String(err) }
  }
}

export async function updateUserPreferences(
  userId: string,
  prefs: {
    dietaryProfile?: Record<string, unknown>
    excludedFoods?: string[]
    defaultColumns?: string[]
    accentColor?: string
  }
) {
  return withAuth(userId, async (uid) => {
    const [updated] = await db
      .insert(userPreferences)
      .values({
        userId: uid,
        updatedAt: new Date(),
        ...(prefs.dietaryProfile !== undefined ? { dietaryProfile: prefs.dietaryProfile } : {}),
        ...(prefs.excludedFoods !== undefined ? { excludedFoods: prefs.excludedFoods } : {}),
        ...(prefs.defaultColumns !== undefined ? { defaultColumns: prefs.defaultColumns } : {}),
        ...(prefs.accentColor !== undefined ? { accentColor: prefs.accentColor } : {}),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          updatedAt: new Date(),
          ...(prefs.dietaryProfile !== undefined ? { dietaryProfile: prefs.dietaryProfile } : {}),
          ...(prefs.excludedFoods !== undefined ? { excludedFoods: prefs.excludedFoods } : {}),
          ...(prefs.defaultColumns !== undefined ? { defaultColumns: prefs.defaultColumns } : {}),
          ...(prefs.accentColor !== undefined ? { accentColor: prefs.accentColor } : {}),
        },
      })
      .returning()

    return updated!
  })
}

// ─── Saved Views ──────────────────────────────────────────────────────────────

export async function getSavedViews(userId: string) {
  try {
    const views = await db
      .select()
      .from(savedViews)
      .where(eq(savedViews.userId, userId))

    return { success: true as const, data: views }
  } catch (err) {
    return { success: false as const, error: String(err) }
  }
}

export async function saveView(
  userId: string,
  name: string,
  configJson: Record<string, unknown>
) {
  return withAuth(userId, async (uid) => {
    const shareSlug = crypto.randomUUID().replace(/-/g, '').slice(0, 12)

    const [view] = await db
      .insert(savedViews)
      .values({ userId: uid, name, configJson, shareSlug })
      .returning()

    return view!
  })
}
