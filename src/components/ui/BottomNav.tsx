import { useLocation, useNavigate } from 'react-router-dom'

interface Tab {
  path:  string
  label: string
  icon:  (active: boolean) => React.ReactNode
}

const ACCENT  = '#E8622A'
const MUTED   = '#AFA49E'

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : MUTED
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H15v-6H9v6H4a1 1 0 0 1-1-1V10.5z"
        stroke={c} strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"
        fill={active ? c : 'none'} fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  )
}

function GridIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : MUTED
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3"  y="3"  width="7" height="7" rx="2" stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? c : 'none'} fillOpacity={active ? 0.12 : 0} />
      <rect x="14" y="3"  width="7" height="7" rx="2" stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? c : 'none'} fillOpacity={active ? 0.12 : 0} />
      <rect x="3"  y="14" width="7" height="7" rx="2" stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? c : 'none'} fillOpacity={active ? 0.12 : 0} />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? c : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : MUTED
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="17" rx="3" stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? c : 'none'} fillOpacity={active ? 0.10 : 0} />
      <path d="M3 10h18" stroke={c} strokeWidth={active ? 2 : 1.5} />
      <path d="M8 3v4M16 3v4" stroke={c} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  )
}

function GearIcon({ active }: { active: boolean }) {
  const c = active ? ACCENT : MUTED
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? c : 'none'} fillOpacity={active ? 0.18 : 0} />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={c} strokeWidth={active ? 2 : 1.5} strokeLinecap="round"
      />
    </svg>
  )
}

const TABS: Tab[] = [
  { path: '/',          label: 'Today',    icon: a => <HomeIcon     active={a} /> },
  { path: '/dishes',    label: 'Dishes',   icon: a => <GridIcon     active={a} /> },
  { path: '/diet-chart',label: 'Schedule', icon: a => <CalendarIcon active={a} /> },
  { path: '/settings',  label: 'Settings', icon: a => <GearIcon     active={a} /> },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        backgroundColor: 'rgba(255,252,248,0.94)',
        backdropFilter:         'blur(24px)',
        WebkitBackdropFilter:   'blur(24px)',
        borderTop:    '0.5px solid rgba(28,20,16,0.10)',
        height:       'calc(49px + env(safe-area-inset-bottom))',
        paddingBottom:'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] min-h-[44px] tap-highlight-none"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transform: 'scale(1)',
              transition: 'transform 120ms cubic-bezier(0.25,0.1,0.25,1)',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.94)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.94)')}
            onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            {tab.icon(active)}
            <span
              style={{
                fontSize:   '10px',
                fontWeight: active ? 600 : 400,
                color:      active ? ACCENT : MUTED,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
