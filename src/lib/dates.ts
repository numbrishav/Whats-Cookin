import type { DayOfWeek } from '@/types'

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function todayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

export function formatDisplayDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function daysAgo(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + 'T00:00:00')
  return Math.floor((today.getTime() - target.getTime()) / 86400000)
}

/** Add `delta` days to an ISO date string, returns ISO date string. */
export function offsetDate(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

/** Returns `DayOfWeek` for any ISO date string. */
export function dayOfWeekForDate(iso: string): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date(iso + 'T00:00:00').getDay()]
}

/** Short label for timeline: "Mon", "Tue", … or "Today" */
export function shortDayLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) return 'Today'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })
}

/** Day-of-month number: "3", "14", … */
export function dayOfMonth(iso: string): string {
  return String(new Date(iso + 'T00:00:00').getDate())
}
