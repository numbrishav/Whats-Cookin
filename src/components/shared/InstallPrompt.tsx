import { useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('install_dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible) return null

  const handleAdd = async () => {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      localStorage.setItem('install_dismissed', '1')
      setVisible(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('install_dismissed', '1')
    setVisible(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(49px + env(safe-area-inset-bottom) + 8px)',
        left: '1rem',
        right: '1rem',
        zIndex: 50,
        background: '#ffffff',
        borderRadius: '1rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      <span style={{ fontSize: '24px', flexShrink: 0 }}>🏠</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#1D1D1F', lineHeight: 1.3 }}>
          Add to Home Screen
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#6B5E57', lineHeight: 1.3, marginTop: '1px' }}>
          Works offline, instant access
        </p>
      </div>
      <button
        onClick={handleAdd}
        style={{
          flexShrink: 0,
          background: '#E8622A',
          color: '#ffffff',
          border: 'none',
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Add
      </button>
      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: '#AFA49E',
          fontSize: '18px',
          lineHeight: 1,
          cursor: 'pointer',
          padding: '2px 4px',
          fontFamily: 'inherit',
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
