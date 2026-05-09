import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { HomeScreen } from '@/components/home/HomeScreen'
import { DishLibraryPage } from '@/pages/DishLibraryPage'
import { DietChartPage } from '@/pages/DietChartPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { BottomNav } from '@/components/ui/BottomNav'
import { InstallPrompt } from '@/components/shared/InstallPrompt'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AuthProvider, useAuth } from '@/components/auth/AuthContext'
import { db } from '@/db/schema'
import { initDB } from '@/lib/seed'

const HIDE_NAV_ROUTES = ['/onboarding']

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
    <div
      className="w-8 h-8 rounded-full border-2 animate-spin"
      style={{ borderColor: 'var(--surface-muted)', borderTopColor: 'var(--accent)' }}
    />
  </div>
)

function AppRoutes() {
  const { loading: authLoading } = useAuth()
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const location = useLocation()

  // Reactive — re-routes automatically once onboarding writes the flag
  const onboardingDone = useLiveQuery(
    () => db.settings.get('onboarding_complete').then(s => !!s?.value),
    [],
    undefined,
  )

  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch(e => setDbError(String(e)))
  }, [])

  if (authLoading || !dbReady || onboardingDone === undefined) return <Spinner />

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-semibold mb-1" style={{ color: '#1D1D1F' }}>Something went wrong</p>
          <p className="text-sm" style={{ color: '#6B5E57' }}>{dbError}</p>
        </div>
      </div>
    )
  }

  // Anonymous users get the same full access — no login gate
  // First-time user — send to onboarding
  if (!onboardingDone) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  const showNav = !HIDE_NAV_ROUTES.includes(location.pathname)

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      <div className={showNav ? 'pb-[calc(49px+env(safe-area-inset-bottom))]' : ''}>
        <Routes>
          <Route path="/"           element={<HomeScreen />} />
          <Route path="/dishes"     element={<DishLibraryPage />} />
          <Route path="/diet-chart" element={<DietChartPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="/login"      element={<Navigate to="/" replace />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
      <InstallPrompt />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  )
}
