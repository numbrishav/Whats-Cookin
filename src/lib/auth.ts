import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Call on app start. Returns the existing session or creates an anonymous one.
 */
export async function initAuth(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('[auth] signInAnonymously failed:', error.message)
    return null
  }
  return data.session
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

/**
 * Send a 6-digit email OTP.
 * No emailRedirectTo — suppresses magic link, sends code only.
 */
export async function sendEmailOTP(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  })
  return { error: error?.message ?? null }
}

/**
 * Verify the 6-digit OTP. Upgrades the anonymous session in place.
 * user.id is preserved; user.is_anonymous becomes false.
 */
export async function verifyEmailOTP(
  email: string,
  token: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  })
  return { error: error?.message ?? null }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => subscription.unsubscribe()
}
