'use client'

import * as React from 'react'
import {
  supabase,
  onAuthStateChange,
  type User,
} from '@/lib/auth/client'

interface AuthContextValue {
  user: User | null
  requestSignIn: () => void
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  requestSignIn: () => {},
})

export function useAuth() {
  return React.useContext(AuthContext)
}

interface AuthProviderProps {
  children: React.ReactNode
  onRequestSignIn: () => void
}

export function AuthProvider({ children, onRequestSignIn }: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    // Read existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((u) => {
      setUser(u)
    })
    return unsubscribe
  }, [])

  const value = React.useMemo(
    () => ({ user, requestSignIn: onRequestSignIn }),
    [user, onRequestSignIn]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
