import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { initAuth, onAuthStateChange } from '@/lib/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthState {
  session: Session | null
  isAnonymous: boolean
  loading: boolean
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
  session: null,
  isAnonymous: true,
  loading: true,
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAnonymous: true,
    loading: true,
  })

  useEffect(() => {
    // Boot: get existing session or create anonymous one
    initAuth().then(session => {
      setState({
        session,
        isAnonymous: session?.user?.is_anonymous ?? true,
        loading: false,
      })
    })

    // Listen for all auth changes:
    // - SIGNED_IN fires after signInAnonymously
    // - USER_UPDATED fires after verifyOtp upgrades the anon session
    // - SIGNED_OUT fires after signOut
    const unsub = onAuthStateChange(session => {
      setState({
        session,
        isAnonymous: session?.user?.is_anonymous ?? true,
        loading: false,
      })
    })

    return unsub
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext)
}
