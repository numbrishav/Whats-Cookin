import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, approveMeal, getRecentlyUsed, getWeeklyUsage, upsertMealPlan } from '@/db/schema'
import { generateMealSet, getSwapOptions } from '@/engine/recommendation'
import { MealCard } from './MealCard'
import { SwapSheet } from './SwapSheet'
import { LibraryPickSheet } from './LibraryPickSheet'
import { RecencyChip } from './RecencyChip'
import { PrepNudge, GroceryNudge } from './PrepNudge'
import { HouseholdEditSheet } from './HouseholdEditSheet'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { QuickAddSheet } from '@/components/shared/QuickAddSheet'
import { SavePromptSheet } from '@/components/auth/SavePromptSheet'
import { useAuth } from '@/components/auth/AuthContext'
import {
  formatDisplayDate,
  todayISO,
  todayDayOfWeek,
  offsetDate,
  dayOfWeekForDate,
  shortDayLabel,
  dayOfMonth,
} from '@/lib/dates'
import { MEAL_SLOTS, DEFAULT_HOUSEHOLD, DEFAULT_DIET_CHART } from '@/lib/seed'
import { PLANNED_MENU_SLOTS, ensureDietChartRulesAndPlans } from '@/lib/weekly-menu'
import type {
  MealCandidateSet,
  MealOutput,
  MealComponent,
  MealSlotId,
  RecommendationContext,
  Dish,
  Household,
  DietChartDayPlan,
  PersonScope,
} from '@/types'

function householdChipText(h: Household): string {
  const nv  = h.members.filter(m => m.diet_type === 'nonveg').length
  const egg = h.members.filter(m => m.diet_type === 'eggitarian').length
  const veg = h.members.filter(m => m.diet_type === 'veg').length
  const parts: string[] = []
  if (nv  > 0) parts.push(`${nv} NV`)
  if (egg > 0) parts.push(`${egg} Egg`)
  if (veg > 0) parts.push(`${veg} V`)
  const n = h.members.length
  return `${n} ${n === 1 ? 'person' : 'people'} · ${parts.join(' + ')}`
}

const ACTIVE_SLOTS = MEAL_SLOTS.filter(slot => slot.active)

function computeMealMacros(components: MealComponent[]): MealOutput['macros'] {
  let calories = 0
  let protein = 0
  let hasData = false

  for (const component of components) {
    if (component.dish.calories_per_serving != null) {
      calories += component.dish.calories_per_serving
      hasData = true
    }
    if (component.dish.protein_g != null) {
      protein += component.dish.protein_g
      hasData = true
    }
  }

  return hasData ? { calories, protein_g: protein } : { calories: null, protein_g: null }
}

// ─── Timeline navigator ───────────────────────────────────────────────────────

interface TimelineDay {
  iso: string
  isPast: boolean
  isFuture: boolean
  isToday: boolean
}

function buildTimeline(todayIso: string): TimelineDay[] {
  return [-3, -2, -1, 0, 1, 2, 3].map(delta => {
    const iso = offsetDate(todayIso, delta)
    return {
      iso,
      isPast: delta < 0,
      isFuture: delta > 0,
      isToday: delta === 0,
    }
  })
}

interface TimelineNavProps {
  todayIso: string
  selectedIso: string
  onSelect: (iso: string) => void
}

function TimelineNav({ todayIso, selectedIso, onSelect }: TimelineNavProps) {
  const days = buildTimeline(todayIso)

  return (
    <div
      className="flex items-center gap-1 px-5 py-3 overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
    >
      {days.map(day => {
        const isSelected = day.iso === selectedIso
        const label = shortDayLabel(day.iso, todayIso)
        const num = dayOfMonth(day.iso)

        return (
          <button
            key={day.iso}
            onClick={() => onSelect(day.iso)}
            className="flex flex-col items-center rounded-2xl px-3 py-2 flex-shrink-0 transition-all active:scale-95"
            style={{
              background: isSelected ? '#E8622A' : day.isToday ? 'var(--surface-muted)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              minWidth: '48px',
            }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--text-tertiary)' }}
            >
              {label}
            </span>
            <span
              className="text-[17px] font-semibold mt-0.5 leading-tight"
              style={{ color: isSelected ? '#FFFFFF' : day.isToday ? '#E8622A' : 'var(--text-primary)' }}
            >
              {num}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Past / future read-only view ─────────────────────────────────────────────

function HistoryDayView({
  selectedIso,
  todayIso,
  allDishes,
  household,
  dietChart,
}: {
  selectedIso: string
  todayIso: string
  allDishes: Dish[]
  household: Household
  dietChart: DietChartDayPlan[]
}) {
  const isPast = selectedIso < todayIso

  // Fetch approved meals for past dates
  const approvedMeals = useLiveQuery(
    () => db.meals.where('date').equals(selectedIso).toArray(),
    [selectedIso],
    [],
  ) ?? []

  const plannedMeals = useLiveQuery(
    () => db.meal_plans.where('date').equals(selectedIso).toArray(),
    [selectedIso],
    [],
  ) ?? []

  // For future dates: generate a suggestion
  const [futureMeals, setFutureMeals] = useState<Partial<Record<MealSlotId, MealOutput>>>({})

  useEffect(() => {
    if (isPast || allDishes.length === 0) return
    async function build() {
      const recentlyUsed = await getRecentlyUsed(7)
      const weeklyUsage  = await getWeeklyUsage()
      const ctx: RecommendationContext = {
        slot: 'dinner',
        date: selectedIso,
        day: dayOfWeekForDate(selectedIso),
        household,
        dietChart,
        recentlyUsed,
        weeklyUsage,
      }
      const result: Partial<Record<MealSlotId, MealOutput>> = {}
      for (const slot of ACTIVE_SLOTS) {
        const candidates = generateMealSet(allDishes, slot.id, { ...ctx, slot: slot.id })
        if (candidates.length > 0) result[slot.id] = candidates[0]
      }
      setFutureMeals(result)
    }
    build()
  }, [selectedIso, isPast, allDishes, household, dietChart])

  const slotLabel = (s: { label: string }) => (
    <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{s.label}</h2>
  )
  const emptySlot = (
    <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--surface-muted)' }}>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No meal recorded</p>
    </div>
  )

  if (isPast) {
    if (approvedMeals.length === 0) {
      return (
        <div className="px-5 space-y-4">
          {ACTIVE_SLOTS.map(slot => (
            <section key={slot.id}>
              <div className="mb-2">{slotLabel(slot)}</div>
              {emptySlot}
            </section>
          ))}
        </div>
      )
    }

    return (
      <div className="px-5 space-y-4">
        {ACTIVE_SLOTS.map(slot => {
          const meal = approvedMeals.find(m => m.slot === slot.id)
          return (
            <section key={slot.id}>
              <div className="flex items-center justify-between mb-2">
                {slotLabel(slot)}
                {meal && <span style={{ fontSize: 12, fontWeight: 600, color: '#1A7F37' }}>✓ Confirmed</span>}
              </div>
              {meal ? (
                <MealCard meal={meal} onSwap={() => {}} readOnly />
              ) : emptySlot}
            </section>
          )
        })}
      </div>
    )
  }

  // Future date
  if (plannedMeals.length > 0) {
    return (
      <div className="px-5 space-y-4">
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>
          Planned for this day.
        </p>
        {ACTIVE_SLOTS.map(slot => {
          const plan = plannedMeals.find(meal => meal.slot === slot.id)
          return (
            <section key={slot.id}>
              <div className="flex items-center justify-between mb-2">
                {slotLabel(slot)}
                {plan && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-muted)', borderRadius: 999, padding: '2px 8px' }}>
                    Planned
                  </span>
                )}
              </div>
              {plan ? (
                <MealCard meal={plan.meal} onSwap={() => {}} readOnly />
              ) : (
                <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--surface-muted)' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No meal planned</p>
                </div>
              )}
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className="px-5 space-y-4">
      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>
        Suggested — view only.
      </p>
      {ACTIVE_SLOTS.map(slot => {
        const meal = futureMeals[slot.id]
        return (
          <section key={slot.id}>
            <div className="flex items-center justify-between mb-2">
              {slotLabel(slot)}
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-muted)', borderRadius: 999, padding: '2px 8px' }}>
                Preview
              </span>
            </div>
            {meal ? (
              <MealCard meal={meal} onSwap={() => {}} readOnly />
            ) : (
              <div className="rounded-2xl h-24 animate-pulse" style={{ backgroundColor: 'var(--surface-muted)' }} />
            )}
          </section>
        )
      })}
    </div>
  )
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const today = todayISO()
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today
  const displayDate = formatDisplayDate(selectedDate)

  const { isAnonymous } = useAuth()
  const [savePromptOpen, setSavePromptOpen] = useState(false)

  // Has the save prompt already been shown/dismissed?
  const savePromptShown = useLiveQuery(
    () => db.settings.get('save_prompt_shown').then(s => !!s?.value),
    [],
    false,
  ) ?? false

  const allDishes = useLiveQuery(() => db.dishes.toArray(), []) ?? []

  const household = useLiveQuery(
    () => db.settings.get('household').then(s => (s?.value as Household) ?? DEFAULT_HOUSEHOLD),
    [],
    DEFAULT_HOUSEHOLD,
  ) ?? DEFAULT_HOUSEHOLD

  const dietChart = useLiveQuery(
    () => db.settings.get('diet_chart').then(s => (s?.value as DietChartDayPlan[]) ?? DEFAULT_DIET_CHART),
    [],
    DEFAULT_DIET_CHART,
  ) ?? DEFAULT_DIET_CHART

  const eatOutRecords = useLiveQuery(
    () => db.eat_out.where('date').equals(today).toArray(),
    [today],
  ) ?? []

  const todayPlannedMeals = useLiveQuery(
    () => db.meal_plans.where('date').equals(today).toArray(),
    [today],
    [],
  ) ?? []

  const [mealSets, setMealSets] = useState<Partial<Record<MealSlotId, MealCandidateSet>>>({})
  const [approvedSlots, setApprovedSlots] = useState<Set<MealSlotId>>(new Set())
  const [swapTarget, setSwapTarget] = useState<{ component: MealComponent; slot: MealSlotId } | null>(null)
  const [lastAutoSwap, setLastAutoSwap] = useState<{ component: MealComponent; slot: MealSlotId } | null>(null)
  const [ctx, setCtx] = useState<RecommendationContext | null>(null)
  const [householdSheetOpen, setHouseholdSheetOpen] = useState(false)
  const [quickAddSlot, setQuickAddSlot] = useState<MealSlotId | null>(null)
  const [libraryPickSlot, setLibraryPickSlot] = useState<MealSlotId | null>(null)

  useEffect(() => {
    ensureDietChartRulesAndPlans()
  }, [])

  // Build recommendation context once dishes load
  useEffect(() => {
    if (allDishes.length === 0) return
    async function buildCtx() {
      const recentlyUsed = await getRecentlyUsed(7)
      const weeklyUsage = await getWeeklyUsage()
      setCtx({
        slot: 'dinner',
        date: today,
        day: todayDayOfWeek(),
        household,
        dietChart,
        recentlyUsed,
        weeklyUsage,
      })
    }
    buildCtx()
  }, [allDishes.length, today, household, dietChart])

  // Generate initial meals when context is ready
  useEffect(() => {
    if (!ctx || allDishes.length === 0) return
    const initial: Partial<Record<MealSlotId, MealCandidateSet>> = {}
    for (const slot of ACTIVE_SLOTS) {
      const planned = todayPlannedMeals.find(meal => meal.slot === slot.id)
      initial[slot.id] = planned ? {
        slot: slot.id,
        date: today,
        candidates: [planned.meal],
        currentIndex: 0,
      } : {
        slot: slot.id,
        date: today,
        candidates: generateMealSet(allDishes, slot.id, { ...ctx, slot: slot.id }),
        currentIndex: 0,
      }
    }
    setMealSets(initial)
  }, [ctx, allDishes, today, todayPlannedMeals])

  const handleShuffle = useCallback((slot: MealSlotId) => {
    if (!ctx || allDishes.length === 0) return
    if (PLANNED_MENU_SLOTS.includes(slot as typeof PLANNED_MENU_SLOTS[number])) {
      const nextCandidates = generateMealSet(allDishes, slot, { ...ctx, slot })
      const nextMeal = nextCandidates[1] ?? nextCandidates[0]
      if (!nextMeal) return
      setMealSets(prev => ({
        ...prev,
        [slot]: { slot, date: today, candidates: [nextMeal], currentIndex: 0 },
      }))
      void upsertMealPlan(nextMeal)
      return
    }
    setLastAutoSwap(prev => prev?.slot === slot ? null : prev)
    setMealSets(prev => {
      const current = prev[slot]
      if (current && current.currentIndex < current.candidates.length - 1) {
        return { ...prev, [slot]: { ...current, currentIndex: current.currentIndex + 1 } }
      }
      const newCandidates = generateMealSet(allDishes, slot, { ...ctx, slot })
      return { ...prev, [slot]: { slot, date: today, candidates: newCandidates, currentIndex: 0 } }
    })
  }, [ctx, allDishes, today])

  const handleApprove = useCallback(async (slot: MealSlotId) => {
    const mealSet = mealSets[slot]
    const meal = mealSet ? mealSet.candidates[mealSet.currentIndex] : undefined
    if (!meal) return
    await approveMeal(meal)
    setApprovedSlots(prev => new Set(prev).add(slot))
    setLastAutoSwap(prev => prev?.slot === slot ? null : prev)
    if (isAnonymous && !savePromptShown) setSavePromptOpen(true)
  }, [mealSets, isAnonymous, savePromptShown])

  const applySwap = useCallback((slot: MealSlotId, targetDishId: string, replacement: Dish) => {
    let updatedMeal: MealOutput | null = null
    setMealSets(prev => {
      const mealSet = prev[slot]
      if (!mealSet) return prev
      const nextCandidates = mealSet.candidates.map((candidate, index) => {
        if (index !== mealSet.currentIndex) return candidate
        const nextComponents = candidate.components.map(c =>
          c.dish.id === targetDishId ? { ...c, dish: replacement } : c,
        )
        updatedMeal = { ...candidate, components: nextComponents, macros: computeMealMacros(nextComponents) }
        return updatedMeal
      })
      return { ...prev, [slot]: { ...mealSet, candidates: nextCandidates } }
    })
    if (updatedMeal && PLANNED_MENU_SLOTS.includes(slot as typeof PLANNED_MENU_SLOTS[number])) {
      void upsertMealPlan(updatedMeal)
    }
  }, [])

  const handleSwap = useCallback((component: MealComponent, slot: MealSlotId) => {
    if (!ctx) return
    const mealSet = mealSets[slot]
    const currentIds = mealSet?.candidates[mealSet.currentIndex]?.components.map(c => c.dish.id) ?? []
    const options = getSwapOptions(allDishes, component.dish, currentIds, { ...ctx, slot })
    if (options.length > 0) {
      applySwap(slot, component.dish.id, options[0])
      setLastAutoSwap({ component, slot })
    } else {
      setSwapTarget({ component, slot })
    }
  }, [ctx, allDishes, mealSets, applySwap])

  const handleHouseholdSave = useCallback(async (updated: Household) => {
    await db.settings.put({ key: 'household', value: updated })
  }, [])

  const handleSwapSelect = useCallback((replacement: Dish) => {
    if (!swapTarget) return
    applySwap(swapTarget.slot, swapTarget.component.dish.id, replacement)
    setSwapTarget(null)
    setLastAutoSwap(null)
  }, [swapTarget, applySwap])

  const handleEatOut = useCallback(async (slot: MealSlotId) => {
    await db.eat_out.add({ date: today, slot })
  }, [today])

  const handleCancelEatOut = useCallback(async (slot: MealSlotId) => {
    const record = await db.eat_out.where({ date: today, slot }).first()
    if (record?.id != null) {
      await db.eat_out.delete(record.id)
    }
  }, [today])

  const handleAddDish = useCallback((slot: MealSlotId, newDish: Dish) => {
    const personScope: PersonScope =
      newDish.type === 'nonveg' ? 'nonveg'
      : newDish.type === 'eggitarian' ? 'eggitarian'
      : 'shared'

    let updatedMeal: MealOutput | null = null
    setMealSets(prev => {
      const mealSet = prev[slot]
      if (!mealSet) return prev

      const idx = mealSet.currentIndex
      const candidate = mealSet.candidates[idx]
      if (!candidate) return prev

      const newComponent: MealComponent = {
        dish: newDish,
        swappable: true,
        quantity: undefined,
        person_scope: personScope,
      }

      const updatedComponents = [...candidate.components, newComponent]
      const updatedCandidate = {
        ...candidate,
        components: updatedComponents,
        macros: computeMealMacros(updatedComponents),
      }
      updatedMeal = updatedCandidate

      const updatedCandidates = mealSet.candidates.map((c, i) =>
        i === idx ? updatedCandidate : c,
      )

      return {
        ...prev,
        [slot]: { ...mealSet, candidates: updatedCandidates },
      }
    })
    if (updatedMeal && PLANNED_MENU_SLOTS.includes(slot as typeof PLANNED_MENU_SLOTS[number])) {
      void upsertMealPlan(updatedMeal)
    }
  }, [])

  const currentSwapMealSet = swapTarget ? mealSets[swapTarget.slot] : undefined
  const currentMealIds = currentSwapMealSet
    ? (currentSwapMealSet.candidates[currentSwapMealSet.currentIndex]?.components.map(c => c.dish.id) ?? [])
    : []

  // Split display date into day-name and date parts
  const [dayName, ...rest] = displayDate.split(', ')
  const datePart = rest.join(', ')

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        {/* Brand row */}
        <div className="flex items-center justify-between mb-5">
          <Logo size="md" />
          <button
            onClick={() => setHouseholdSheetOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 tap-highlight-none active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              {householdChipText(household)}
            </span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 10l6-6M8 4l-2-2 1-1 2 2-1 1ZM2 10l-1 1 1-1Z" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Date */}
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1, margin: 0 }}>
          {dayName}
        </h1>
        {datePart && (
          <p style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {datePart}
          </p>
        )}
      </div>

      {/* Timeline navigator */}
      <TimelineNav
        todayIso={today}
        selectedIso={selectedDate}
        onSelect={setSelectedDate}
      />

      {/* Content area */}
      {!isToday ? (
        /* Past / future read-only view */
        <HistoryDayView
          selectedIso={selectedDate}
          todayIso={today}
          allDishes={allDishes}
          household={household}
          dietChart={dietChart}
        />
      ) : (
        /* Today — full interactive view */
        <div className="px-5 space-y-6">
          {allDishes.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading your dish library…</div>
          ) : (
            ACTIVE_SLOTS.map(slot => {
              const mealSet = mealSets[slot.id]
              const meal = mealSet ? mealSet.candidates[mealSet.currentIndex] : undefined
              const approved = approvedSlots.has(slot.id)
              const isEatingOut = eatOutRecords.some(r => r.slot === slot.id)

              return (
                <div key={slot.id}>
                  <SlotSection
                    slotId={slot.id}
                    label={slot.label}
                    meal={meal}
                    approved={approved}
                    isEatingOut={isEatingOut}
                    onSwap={c => handleSwap(c, slot.id)}
                    onShuffle={() => handleShuffle(slot.id)}
                    onApprove={() => handleApprove(slot.id)}
                    onEatOut={() => handleEatOut(slot.id)}
                    onCancelEatOut={() => handleCancelEatOut(slot.id)}
                    onAddDish={() => setQuickAddSlot(slot.id)}
                    onPickFromLibrary={() => setLibraryPickSlot(slot.id)}
                    showPickDifferent={lastAutoSwap?.slot === slot.id}
                    onPickDifferent={() => {
                      if (lastAutoSwap?.slot === slot.id) setSwapTarget(lastAutoSwap)
                    }}
                  />
                  <PrepNudge
                    currentSlotId={slot.id}
                    todayIso={today}
                    allDishes={allDishes}
                    household={household}
                    dietChart={dietChart}
                  />
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Grocery nudge (only on today, shown on Sat/Sun/Wed) */}
      {isToday && allDishes.length > 0 && (
        <div className="px-5 mt-2">
          <GroceryNudge
            todayIso={today}
            allDishes={allDishes}
            household={household}
            dietChart={dietChart}
          />
        </div>
      )}

      {/* Recency chip (only on today) */}
      {isToday && (
        <div className="px-5 mt-6">
          <RecencyChip />
        </div>
      )}

      {/* Household edit sheet */}
      <HouseholdEditSheet
        open={householdSheetOpen}
        onClose={() => setHouseholdSheetOpen(false)}
        household={household}
        onSave={handleHouseholdSave}
      />

      {/* Swap sheet */}
      <SwapSheet
        open={!!swapTarget}
        onClose={() => setSwapTarget(null)}
        target={swapTarget?.component ?? null}
        allDishes={allDishes}
        currentMealIds={currentMealIds}
        ctx={ctx ?? {
          slot: 'dinner', date: today, day: todayDayOfWeek(),
          household: household ?? DEFAULT_HOUSEHOLD,
          dietChart: dietChart ?? DEFAULT_DIET_CHART,
          recentlyUsed: new Map(), weeklyUsage: new Map(),
        }}
        onSelect={handleSwapSelect}
      />

      {/* Quick add sheet */}
      <QuickAddSheet
        open={quickAddSlot !== null}
        onClose={() => setQuickAddSlot(null)}
        onSaved={dish => {
          if (quickAddSlot) handleAddDish(quickAddSlot, dish)
          setQuickAddSlot(null)
        }}
        title="Add dish for today"
      />

      {/* Library pick sheet */}
      <LibraryPickSheet
        open={libraryPickSlot !== null}
        onClose={() => setLibraryPickSlot(null)}
        allDishes={allDishes}
        onSelect={dish => {
          if (libraryPickSlot) handleAddDish(libraryPickSlot, dish)
          setLibraryPickSlot(null)
        }}
      />

      {/* Save prompt — shown once after first approval for anonymous users */}
      <SavePromptSheet
        open={savePromptOpen}
        onDismiss={() => setSavePromptOpen(false)}
      />
    </div>
  )
}

// ─── Slot dot indicator ───────────────────────────────────────────────────────

function SlotDot({ slotId, approved }: { slotId: string; approved: boolean }) {
  const colors: Record<string, string> = {
    breakfast:     '#FF9F0A',
    lunch:         '#E8622A',
    evening_snack: '#9A5700',
    dinner:        '#4A3728',
    dessert:       '#C44E1C',
  }
  const color = approved ? '#1A7F37' : (colors[slotId] ?? '#E8622A')
  return (
    <span
      style={{
        width: 8, height: 8, borderRadius: '50%',
        backgroundColor: color, display: 'inline-block', flexShrink: 0,
      }}
    />
  )
}

// ─── Slot section (today only) ────────────────────────────────────────────────

interface SlotProps {
  slotId: MealSlotId
  label: string
  meal: MealOutput | undefined
  approved: boolean
  isEatingOut: boolean
  onSwap: (c: MealComponent) => void
  onShuffle: () => void
  onApprove: () => void
  onEatOut: () => void
  onCancelEatOut: () => void
  onAddDish: () => void
  onPickFromLibrary: () => void
  showPickDifferent: boolean
  onPickDifferent: () => void
}

function SlotSection({
  slotId,
  label,
  meal,
  approved,
  isEatingOut,
  onSwap,
  onShuffle,
  onApprove,
  onEatOut,
  onCancelEatOut,
  onAddDish,
  onPickFromLibrary,
  showPickDifferent,
  onPickDifferent,
}: SlotProps) {
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')

  const macroLine = meal?.macros?.calories
    ? `~${meal.macros.calories} kcal · ~${meal.macros.protein_g}g protein`
    : null

  function buildShareText(): string {
    if (!meal) return ''
    const dateStr = new Date(meal.date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const slotLabel = label
    const lines: string[] = [`${slotLabel} — ${dateStr}`, '']

    const nonveg = meal.components.filter(c => c.person_scope === 'nonveg')
    const egg = meal.components.filter(c => c.person_scope === 'eggitarian')
    const veg = meal.components.filter(c => c.person_scope === 'veg')
    const shared = meal.components.filter(c => c.person_scope === 'shared')

    if (nonveg.length > 0) {
      lines.push(`Me (Non-veg): ${nonveg.map(c => c.quantity ? `${c.dish.name} · ${c.quantity}` : c.dish.name).join(' · ')}`)
    }
    if (egg.length > 0) {
      lines.push(`Wife (Egg): ${egg.map(c => c.quantity ? `${c.dish.name} · ${c.quantity}` : c.dish.name).join(' · ')}`)
    }
    if (veg.length > 0) {
      lines.push(`Wife (Veg): ${veg.map(c => c.quantity ? `${c.dish.name} · ${c.quantity}` : c.dish.name).join(' · ')}`)
    }
    if (shared.length > 0) {
      lines.push(`Shared: ${shared.map(c => c.quantity ? `${c.dish.name} · ${c.quantity}` : c.dish.name).join(' · ')}`)
    }

    return lines.join('\n')
  }

  async function handleShare() {
    const text = buildShareText()
    if ('share' in navigator) {
      try {
        await navigator.share({ title: "What's Cookin today", text })
      } catch {
        // user dismissed — no-op
      }
    } else {
      try {
        await (navigator as Navigator).clipboard.writeText(text)
        setShareState('copied')
        setTimeout(() => setShareState('idle'), 1500)
      } catch {
        // clipboard not available — no-op
      }
    }
  }

  return (
    <section>
      {/* Slot header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlotDot slotId={slotId} approved={approved} />
          <h2 style={{ fontSize: 15, fontWeight: 600, color: approved ? '#1A7F37' : 'var(--text-primary)', margin: 0 }}>
            {label}
          </h2>
          {approved && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1A7F37' }}>✓</span>
          )}
        </div>
        <Link
          to="/diet-chart"
          style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          Schedule →
        </Link>
      </div>

      {isEatingOut ? (
        <div
          className="rounded-2xl px-5 py-5"
          style={{ background: 'var(--surface-muted)' }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Eating out today</p>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 2 }}>No suggestion needed.</p>
          <button
            onClick={onCancelEatOut}
            className="mt-3 tap-highlight-none active:opacity-60"
            style={{ fontSize: 14, color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 500 }}
          >
            Back to suggestions
          </button>
        </div>
      ) : !meal ? (
        <div className="rounded-2xl h-28 animate-pulse" style={{ backgroundColor: 'var(--surface-muted)' }} />
      ) : (
        <>
          <MealCard
            meal={meal}
            onSwap={onSwap}
          />

          {macroLine && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6, paddingLeft: 2 }}>{macroLine}</p>
          )}

          {/* CTAs — only when not approved */}
          {!approved && (
            <div className="mt-3 space-y-2">
              {/* Hero CTA */}
              <Button variant="primary" size="lg" fullWidth onClick={onApprove}>
                Looks good ✓
              </Button>

              {/* Secondary row */}
              <div className="flex gap-2">
                <Button variant="secondary" size="md" onClick={onShuffle} className="flex-1">
                  ↺ Try another
                </Button>
                <button
                  onClick={handleShare}
                  className="tap-highlight-none active:opacity-70"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    backgroundColor: 'var(--surface-muted)', borderRadius: 16, border: 'none',
                    fontSize: 15, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer',
                    padding: '14px 0',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 1v9M5 4l3-3 3 3M3 8v5a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {shareState === 'copied' ? 'Copied!' : 'Share'}
                </button>
              </div>

              {/* Ghost actions row */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onAddDish}
                    className="tap-highlight-none active:opacity-60"
                    style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontWeight: 500 }}
                  >
                    + Add dish
                  </button>
                  <button
                    onClick={onPickFromLibrary}
                    className="tap-highlight-none active:opacity-60"
                    style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Browse library
                  </button>
                  {showPickDifferent && (
                    <button
                      onClick={onPickDifferent}
                      className="tap-highlight-none active:opacity-60"
                      style={{ fontSize: 13, color: 'var(--text-tertiary)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}
                    >
                      ↩ Pick different
                    </button>
                  )}
                </div>
                <button
                  onClick={onEatOut}
                  className="tap-highlight-none active:opacity-60"
                  style={{ fontSize: 13, color: 'var(--text-tertiary)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}
                >
                  Eating out instead?
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
