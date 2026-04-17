'use client'

import { createClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'

// These are safe at module level: they evaluate to undefined when not set,
// and are only used inside getClient() which runs on the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

// Cookie storage adapter so the session is readable server-side in server actions
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + escaped + '=([^;]*)'))
    return match ? decodeURIComponent(match[2]) : null
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return
    const maxAge = 60 * 60 * 24 * 365 // 1 year
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return
    document.cookie = `${key}=; path=/; max-age=0`
  },
}

// Lazy initialization: createClient is deferred until first access so that
// importing this module during SSR doesn't fail on missing env vars.
let _client: ReturnType<typeof createClient> | undefined

function getClient() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: cookieStorage,
        persistSession: true,
      },
    })
  }
  return _client
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})

export type { User, Session }

export async function signIn(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : '/',
    },
  })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : '/',
    },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}
