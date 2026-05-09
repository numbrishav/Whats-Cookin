import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { offsetDate } from '@/lib/dates'
import { generateMealSet } from '@/engine/recommendation'
import type { MealSlotId, Dish, Household, DietChartDayPlan, RecommendationContext } from '@/types'
import { MEAL_SLOTS } from '@/lib/seed'
import { dayOfWeekForDate } from '@/lib/dates'

// ─── Perishables map — built-in, no user config ───────────────────────────────

const PERISHABLES_MAP: Record<string, string[]> = {
  // Chicken
  chicken_curry:        ['chicken'],
  butter_chicken:       ['chicken'],
  kadai_chicken:        ['chicken'],
  bihari_chicken_curry: ['chicken'],
  pan_fried_chicken:    ['chicken'],
  grilled_chicken:      ['chicken'],
  tandoori_chicken:     ['chicken'],
  dry_chicken:          ['chicken'],
  chicken_65:           ['chicken'],
  chinese_chicken:      ['chicken'],
  keema_matar:          ['minced meat'],
  keema:                ['minced meat'],
  chicken_chettinad:    ['chicken'],
  chicken_stew_kerala:  ['chicken'],
  chicken_kolhapuri:    ['chicken'],
  gongura_chicken:      ['chicken'],
  biryani:              ['chicken'],
  // Fish
  fish_curry:           ['fish'],
  fish_curry_coconut:   ['fish'],
  chettinad_fish_curry: ['fish'],
  fish_molee:           ['fish'],
  fish:                 ['fish'],
  fish_fry:             ['fish'],
  // Mutton
  mutton_curry:         ['mutton'],
  // Eggs
  egg_curry:            ['eggs'],
  egg_bhurji:           ['eggs'],
  masala_omelette:      ['eggs'],
  boiled_eggs:          ['eggs'],
  egg_fried_rice:       ['eggs'],
  egg_dosa:             ['eggs'],
  // Greens / leafy
  palak:                ['palak / spinach'],
  palak_paneer:         ['palak / spinach'],
  saag:                 ['mustard leaves', 'spinach'],
  methi_sabzi:          ['methi / fenugreek leaves'],
  sarson_ka_saag:       ['sarson / mustard leaves'],
  // Dairy
  paneer_butter_masala: ['paneer'],
  shahi_paneer:         ['paneer'],
  palak_paneer2:        ['paneer'],
  matar_paneer:         ['paneer', 'peas'],
  // Fresh produce
  raita:                ['curd'],
  curd_rice:            ['curd'],
  boondi_raita:         ['curd'],
}

// ─── PrepNudge — shown below a slot when next slot has prep-needed dishes ─────

interface PrepNudgeProps {
  currentSlotId: MealSlotId
  todayIso: string
  allDishes: Dish[]
  household: Household
  dietChart: DietChartDayPlan[]
}

export function PrepNudge({ currentSlotId, todayIso, allDishes, household, dietChart }: PrepNudgeProps) {
  const [nudgeText, setNudgeText] = useState<string | null>(null)
  const [nudgeKey, setNudgeKey] = useState<string | null>(null)

  // Compute which slot to look ahead at
  const activeSlots = MEAL_SLOTS.filter(s => s.active).sort((a, b) => a.order - b.order)
  const currentIdx = activeSlots.findIndex(s => s.id === currentSlotId)
  const nextSlotId: MealSlotId | null = currentIdx >= 0 && currentIdx < activeSlots.length - 1
    ? activeSlots[currentIdx + 1].id
    : null
  // For last slot of the day, look at tomorrow's first slot
  const lookaheadSlotId: MealSlotId = nextSlotId ?? activeSlots[0]?.id ?? 'dinner'
  const lookaheadDate = nextSlotId ? todayIso : offsetDate(todayIso, 1)

  const dismissed = useLiveQuery(
    () => nudgeKey ? db.dismissed_nudges.where('key').equals(nudgeKey).count().then(c => c > 0) : Promise.resolve(false),
    [nudgeKey],
    false,
  ) ?? false

  useEffect(() => {
    if (allDishes.length === 0) return

    async function compute() {
      const ctx: RecommendationContext = {
        slot: lookaheadSlotId,
        date: lookaheadDate,
        day: dayOfWeekForDate(lookaheadDate),
        household,
        dietChart,
        recentlyUsed: new Map(),
        weeklyUsage: new Map(),
      }
      const candidates = generateMealSet(allDishes, lookaheadSlotId, ctx)
      const meal = candidates[0]
      if (!meal) return

      // Find first dish with prep steps
      for (const component of meal.components) {
        const dish = component.dish
        if (dish.prep_steps && dish.prep_steps.length > 0) {
          const prep = dish.prep_steps[0]
          // Build human text
          const isTonight = lookaheadDate === todayIso
          const timeRef = isTonight
            ? (prep.trigger === 'night_before' ? 'soak/thaw tonight' : 'this morning')
            : (prep.trigger === 'night_before' ? 'soak/thaw tonight' : 'tomorrow morning')
          const text = `${dish.name} ${isTonight ? 'tonight' : 'tomorrow'} — ${timeRef}`
          const key = `prep:${dish.id}:${lookaheadDate}`
          setNudgeText(text)
          setNudgeKey(key)
          return
        }
      }
      // No prep needed
      setNudgeText(null)
      setNudgeKey(null)
    }

    compute()
  }, [allDishes, lookaheadSlotId, lookaheadDate, household, dietChart])

  if (!nudgeText || !nudgeKey || dismissed) return null

  async function handleDismiss() {
    if (!nudgeKey) return
    await db.dismissed_nudges.put({ key: nudgeKey })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--surface-muted)',
        borderRadius: 12,
        padding: '10px 14px',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⏰</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {nudgeText}
        </span>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          fontSize: 18,
          padding: '0 4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

// ─── GroceryNudge — shown on Sat/Sun/Wed listing perishables from next 2-3 days ─

interface GroceryNudgeProps {
  todayIso: string
  allDishes: Dish[]
  household: Household
  dietChart: DietChartDayPlan[]
}

export function GroceryNudge({ todayIso, allDishes, household, dietChart }: GroceryNudgeProps) {
  const [items, setItems] = useState<string[]>([])
  const nudgeKey = `grocery:${todayIso}`

  // Only show on Saturday (6), Sunday (0), Wednesday (3)
  const dayOfWeek = new Date(todayIso + 'T00:00:00').getDay() // 0=Sun,3=Wed,6=Sat
  const isNudgeDay = dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 6

  const dismissed = useLiveQuery(
    () => db.dismissed_nudges.where('key').equals(nudgeKey).count().then(c => c > 0),
    [nudgeKey],
    false,
  ) ?? false

  useEffect(() => {
    if (!isNudgeDay || allDishes.length === 0) return

    async function compute() {
      const perishableSet = new Set<string>()

      // Look at next 2-3 days
      for (let delta = 1; delta <= 3; delta++) {
        const date = offsetDate(todayIso, delta)
        const day = dayOfWeekForDate(date)
        const activeSlots = MEAL_SLOTS.filter(s => s.active)

        for (const slot of activeSlots) {
          const ctx: RecommendationContext = {
            slot: slot.id,
            date,
            day,
            household,
            dietChart,
            recentlyUsed: new Map(),
            weeklyUsage: new Map(),
          }
          const candidates = generateMealSet(allDishes, slot.id, ctx)
          const meal = candidates[0]
          if (!meal) continue

          for (const component of meal.components) {
            const perish = PERISHABLES_MAP[component.dish.id]
            if (perish) perish.forEach(p => perishableSet.add(p))
          }
        }
      }

      setItems([...perishableSet])
    }

    compute()
  }, [isNudgeDay, allDishes, todayIso, household, dietChart])

  if (!isNudgeDay || dismissed || items.length === 0) return null

  async function handleDismiss() {
    await db.dismissed_nudges.put({ key: nudgeKey })
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-muted)',
        borderRadius: 14,
        padding: '12px 14px',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>🛒</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Grab this week
          </span>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: 18,
            padding: '0 4px',
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        {items.join(' · ')}
      </p>
    </div>
  )
}
