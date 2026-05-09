import { useState, useRef } from 'react'
import { sendEmailOTP, verifyEmailOTP } from '@/lib/auth'
import { db } from '@/db/schema'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'email' | 'otp' | 'success'

interface Props {
  open: boolean
  onDismiss: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

// ─── SavePromptSheet ──────────────────────────────────────────────────────────

export function SavePromptSheet({ open, onDismiss }: Props) {
  const [step, setStep]           = useState<Step>('email')
  const [email, setEmail]         = useState('')
  const [otp, setOtp]             = useState('')
  const [loading, setLoading]     = useState(false)
  const [emailError, setEmailError] = useState('')
  const [otpError, setOtpError]   = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  if (!open) return null

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleNotNow() {
    await db.settings.put({ key: 'save_prompt_shown', value: true })
    onDismiss()
  }

  async function handleSendCode() {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address')
      return
    }
    setEmailError('')
    setLoading(true)
    const { error } = await sendEmailOTP(email)
    setLoading(false)
    if (error) {
      setEmailError('Could not send code — check your connection')
      return
    }
    setStep('otp')
    startResendTimer()
  }

  async function handleVerify() {
    if (otp.trim().length !== 6) {
      setOtpError('Enter the 6-digit code')
      return
    }
    setOtpError('')
    setLoading(true)
    const { error } = await verifyEmailOTP(email, otp)
    setLoading(false)
    if (error) {
      setOtpError('Invalid or expired code. Try again.')
      return
    }
    // Mark as shown so sheet never reappears
    await db.settings.put({ key: 'save_prompt_shown', value: true })
    setStep('success')
    // Auto-close after brief success display
    setTimeout(() => {
      onDismiss()
      resetSheet()
    }, 1800)
  }

  async function handleResend() {
    if (resendTimer > 0 || loading) return
    setLoading(true)
    const { error } = await sendEmailOTP(email)
    setLoading(false)
    if (!error) startResendTimer()
  }

  function startResendTimer() {
    setResendTimer(30)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function resetSheet() {
    setStep('email')
    setEmail('')
    setOtp('')
    setEmailError('')
    setOtpError('')
    setResendTimer(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ fontFamily: font }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        style={{ animation: 'savePromptFadeIn 220ms ease' }}
        onClick={handleNotNow}
      />

      {/* Sheet */}
      <div
        className="relative w-full"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px 28px 0 0',
          padding: '0 0 calc(env(safe-area-inset-bottom) + 28px)',
          animation: 'savePromptSlideUp 320ms cubic-bezier(0.32,0.72,0,1)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div style={{ width: 36, height: 5, borderRadius: 999, backgroundColor: 'rgba(28,20,16,0.12)' }} />
        </div>

        <div className="px-6 pb-2">
          {step === 'email' && (
            <EmailStep
              email={email}
              onEmailChange={v => { setEmail(v); setEmailError('') }}
              error={emailError}
              loading={loading}
              onSend={handleSendCode}
              onNotNow={handleNotNow}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              email={email}
              otp={otp}
              onOtpChange={v => { setOtp(v); setOtpError('') }}
              error={otpError}
              loading={loading}
              resendTimer={resendTimer}
              onVerify={handleVerify}
              onResend={handleResend}
              onBack={() => { setStep('email'); setOtp(''); setOtpError('') }}
            />
          )}
          {step === 'success' && (
            <SuccessStep />
          )}
        </div>
      </div>

      <style>{`
        @keyframes savePromptFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes savePromptSlideUp {
          from { transform: translateY(100%) }
          to   { transform: translateY(0) }
        }
      `}</style>
    </div>
  )
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

interface EmailStepProps {
  email: string
  onEmailChange: (v: string) => void
  error: string
  loading: boolean
  onSend: () => void
  onNotNow: () => void
}

function EmailStep({ email, onEmailChange, error, loading, onSend, onNotNow }: EmailStepProps) {
  return (
    <>
      <div className="mb-6 mt-2">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.3px', marginBottom: 6 }}>
          Save your setup
        </h2>
        <p style={{ fontSize: 15, color: '#6B5E57', lineHeight: 1.5 }}>
          Your setup is only saved on this device.
          Sign in to back it up and access it anywhere.
        </p>
      </div>

      {/* Email input */}
      <input
        type="email"
        value={email}
        onChange={e => onEmailChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSend()}
        placeholder="your@email.com"
        autoComplete="email"
        autoCapitalize="none"
        style={{
          display: 'block',
          width: '100%',
          fontSize: 17,
          color: '#1D1D1F',
          backgroundColor: '#F5EEE6',
          borderRadius: 12,
          border: error ? '1.5px solid #FF3B30' : '1.5px solid transparent',
          padding: '13px 14px',
          outline: 'none',
          marginBottom: 4,
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          transition: 'border-color 150ms ease',
        }}
      />
      {error && (
        <p style={{ fontSize: 13, color: '#FF3B30', marginBottom: 8, paddingLeft: 2 }}>{error}</p>
      )}

      <div style={{ height: error ? 8 : 16 }} />

      {/* Send code button */}
      <button
        onClick={onSend}
        disabled={loading}
        style={{
          display: 'block',
          width: '100%',
          padding: '15px 0',
          borderRadius: 14,
          fontSize: 17,
          fontWeight: 600,
          color: '#FFFFFF',
          backgroundColor: loading ? '#AEAEB2' : '#E8622A',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 150ms ease, transform 100ms ease',
          marginBottom: 12,
        }}
        onPointerDown={e => { if (!loading) (e.currentTarget.style.transform = 'scale(0.97)') }}
        onPointerUp={e => { (e.currentTarget.style.transform = 'scale(1)') }}
        onPointerLeave={e => { (e.currentTarget.style.transform = 'scale(1)') }}
      >
        {loading ? 'Sending…' : 'Send code'}
      </button>

      {/* Not now */}
      <button
        onClick={onNotNow}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 0',
          fontSize: 15,
          fontWeight: 500,
          color: '#AFA49E',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        Not now
      </button>
    </>
  )
}

interface OtpStepProps {
  email: string
  otp: string
  onOtpChange: (v: string) => void
  error: string
  loading: boolean
  resendTimer: number
  onVerify: () => void
  onResend: () => void
  onBack: () => void
}

function OtpStep({ email, otp, onOtpChange, error, loading, resendTimer, onVerify, onResend, onBack }: OtpStepProps) {
  return (
    <>
      <div className="mb-6 mt-2">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.3px', marginBottom: 6 }}>
          Enter your code
        </h2>
        <p style={{ fontSize: 15, color: '#6B5E57', lineHeight: 1.5 }}>
          We sent a 6-digit code to{' '}
          <span style={{ color: '#1D1D1F', fontWeight: 500 }}>{email}</span>
        </p>
      </div>

      {/* OTP input */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={6}
        value={otp}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 6)
          onOtpChange(val)
        }}
        onKeyDown={e => e.key === 'Enter' && onVerify()}
        placeholder="000000"
        style={{
          display: 'block',
          width: '100%',
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '0.25em',
          textAlign: 'center',
          color: '#1D1D1F',
          backgroundColor: '#F5EEE6',
          borderRadius: 12,
          border: error ? '1.5px solid #FF3B30' : '1.5px solid transparent',
          padding: '14px',
          outline: 'none',
          marginBottom: 4,
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          transition: 'border-color 150ms ease',
        }}
      />
      {error && (
        <p style={{ fontSize: 13, color: '#FF3B30', marginBottom: 8, paddingLeft: 2 }}>{error}</p>
      )}

      <div style={{ height: error ? 8 : 16 }} />

      {/* Verify button */}
      <button
        onClick={onVerify}
        disabled={loading || otp.length !== 6}
        style={{
          display: 'block',
          width: '100%',
          padding: '15px 0',
          borderRadius: 14,
          fontSize: 17,
          fontWeight: 600,
          color: '#FFFFFF',
          backgroundColor: loading || otp.length !== 6 ? '#AEAEB2' : '#E8622A',
          border: 'none',
          cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
          transition: 'background-color 150ms ease, transform 100ms ease',
          marginBottom: 12,
        }}
        onPointerDown={e => { if (!loading && otp.length === 6) (e.currentTarget.style.transform = 'scale(0.97)') }}
        onPointerUp={e => { (e.currentTarget.style.transform = 'scale(1)') }}
        onPointerLeave={e => { (e.currentTarget.style.transform = 'scale(1)') }}
      >
        {loading ? 'Verifying…' : 'Verify'}
      </button>

      {/* Resend + back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <button
          onClick={onBack}
          style={{ fontSize: 14, color: '#AFA49E', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}
        >
          ← Wrong email
        </button>
        <button
          onClick={onResend}
          disabled={resendTimer > 0 || loading}
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: resendTimer > 0 ? '#AEAEB2' : '#E8622A',
            background: 'none',
            border: 'none',
            cursor: resendTimer > 0 || loading ? 'not-allowed' : 'pointer',
            padding: '8px 0',
          }}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
        </button>
      </div>
    </>
  )
}

function SuccessStep() {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#E8F5E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 26,
        }}
      >
        ✓
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', marginBottom: 6 }}>
        All backed up
      </h2>
      <p style={{ fontSize: 15, color: '#6B5E57' }}>
        Your setup is saved and accessible anywhere.
      </p>
    </div>
  )
}
