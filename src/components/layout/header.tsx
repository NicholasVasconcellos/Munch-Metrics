'use client'

import * as React from 'react'
import Link from 'next/link'
import { SaladIcon, LogOutIcon, UserIcon, ChevronDownIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { AccentPicker } from '@/components/theme/accent-picker'
import { Button } from '@/components/ui/button'
import { MobileNav } from './mobile-nav'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  supabase,
  signIn,
  signInWithGoogle,
  signOut,
  onAuthStateChange,
  type User,
} from '@/lib/auth/client'
import { getUserPreferences, updateUserPreferences } from '@/lib/auth/server'

// ─── Sign-In Dialog ───────────────────────────────────────────────────────────

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  function handleClose(value: boolean) {
    if (!value) {
      setEmail('')
      setSent(false)
      setLoading(false)
    }
    onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await signIn(email)
    setLoading(false)
    setSent(true)
  }

  async function handleGoogle() {
    await signInWithGoogle()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to Munch Metrics</DialogTitle>
          <DialogDescription>
            Save preferences, dietary profiles, and custom table views.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-4 text-center space-y-2">
            <p className="font-medium">Check your email!</p>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              type="button"
            >
              <svg className="size-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="sign-in-email" className="text-sm font-medium">
                  Email address
                </label>
                <input
                  id="sign-in-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── User Menu ────────────────────────────────────────────────────────────────

interface UserMenuProps {
  user: User
  onSignOut: () => void
}

function UserMenu({ user, onSignOut }: UserMenuProps) {
  const displayName = user.user_metadata?.full_name as string | undefined
  const initial = (displayName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
          <span
            className="flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground text-xs font-semibold"
            aria-hidden="true"
          >
            {initial}
          </span>
          <span className="hidden md:inline max-w-32 truncate text-sm">
            {displayName ?? user.email}
          </span>
          <ChevronDownIcon className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <UserIcon className="size-4" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={onSignOut}
        >
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const [user, setUser] = React.useState<User | null>(null)
  const [signInOpen, setSignInOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Hydration guard: only show auth UI after client mount to avoid mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Subscribe to auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChange(async (u) => {
      setUser(u)

      if (u) {
        // On login: fetch saved preferences and apply them
        const result = await getUserPreferences(u.id)
        if (result.success && result.data) {
          const prefs = result.data

          // Apply saved accent color (overrides localStorage default)
          if (prefs.accentColor) {
            document.documentElement.dataset.accent = prefs.accentColor
            localStorage.setItem('munch-metrics-accent', prefs.accentColor)
          }

          // Dietary profile: stored as { dietary: string[], processingLevels: string[] }
          // Applied via URL state — future wiring point via setTableConfig callback
        }
      }
    })
    return unsubscribe
  }, [])

  // Watch for accent color changes and persist to DB when authenticated
  React.useEffect(() => {
    if (!user) return

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-accent') {
          const accent = document.documentElement.dataset.accent
          if (accent) {
            // Fire-and-forget; errors are non-critical
            updateUserPreferences(user.id, { accentColor: accent }).catch(() => {})
          }
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-accent'],
    })

    return () => observer.disconnect()
  }, [user])

  async function handleSignOut() {
    await signOut()
    setUser(null)
  }

  // Initialize supabase on mount (reads existing session from cookie)
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-7xl items-center px-4">
        {/* Logo */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
        >
          <SaladIcon className="size-5 text-brand" />
          <span className="hidden sm:inline">Munch Metrics</span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Explore</Link>
          </Button>
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1">
          <AccentPicker />
          <ThemeToggle />

          {/* Auth UI – desktop, rendered after hydration to avoid mismatch */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {mounted && user ? (
              <UserMenu user={user} onSignOut={handleSignOut} />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSignInOpen(true)}
                >
                  Sign in
                </Button>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => setSignInOpen(true)}
                >
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile nav trigger */}
          <MobileNav />
        </div>
      </div>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </header>
  )
}
