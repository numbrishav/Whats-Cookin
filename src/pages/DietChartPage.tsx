import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, upsertMealPlan } from '@/db/schema'
import { MealCard } from '@/components/home/MealCard'
import { LibraryPickSheet } from '@/components/home/LibraryPickSheet'
import { QuickAddSheet } from '@/components/shared/QuickAddSheet'
import { currentWeekDates, todayISO } from '@/lib/dates'
import { DEFAULT_HOUSEHOLD } from '@/lib/seed'
import {
  PLANNED_MENU_SLOTS,
  ensureDietChartRulesAndPlans,
  regenerateSinglePlannedSlot,
} from '@/lib/weekly-menu'
import type { Dish, Household, MealOutput, PersonScope } from '@/types'

const SLOT_LABEL: Record<'breakfast' | 'lunch' | 'dinner', string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

function dishScopeForHousehold(dish: Dish, household: Household): PersonScope {
  const eligible = dish.eligible_for && dish.eligible_for.length > 0
    ? dish.eligible_for
    : dish.available_to && dish.available_to.length > 0
      ? dish.available_to
      : dish.type === 'nonveg'
        ? ['nonveg']
        : dish.type === 'eggitarian'
          ? ['eggitarian', 'nonveg']
          : ['veg', 'eggitarian', 'nonveg']

  if (household.members.every(member => eligible.includes(member.diet_type))) return 'shared'
  if (eligible.includes('nonveg') && !eligible.includes('veg') && !eligible.includes('eggitarian')) return 'nonveg'
  if (eligible.includes('eggitarian') && !eligible.includes('veg')) return 'eggitarian'
  if (eligible.includes('veg') && !eligible.includes('nonveg') && !eligible.includes('eggitarian')) return 'veg'
  return 'shared'
}

function EmptyState({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <div className="rounded-2xl px-4 py-5" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <p className="text-sm font-medium" style={{ color: '#6B5E57' }}>No meal planned yet.</p>
      <button
        onClick={onRegenerate}
        className="mt-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#F5EEE6', color: '#1D1D1F' }}
      >
        Regenerate this slot
      </button>
    </div>
  )
}

export function DietChartPage() {
  const today = todayISO()
  const week = useMemo(() => currentWeekDates(today), [today])
  const [selectedDate, setSelectedDate] = useState(week[0]?.date ?? today)
  const [isRegeneratingKey, setIsRegeneratingKey] = useState<string | null>(null)
  const [replaceTarget, setReplaceTarget] = useState<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner'; dishId: string } | null>(null)
  const [addTarget, setAddTarget] = useState<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner' } | null>(null)
  const [quickAddTarget, setQuickAddTarget] = useState<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner' } | null>(null)

  const household = useLiveQuery(
    () => db.settings.get('household').then(setting => (setting?.value as Household) ?? DEFAULT_HOUSEHOLD),
    [],
    DEFAULT_HOUSEHOLD,
  ) ?? DEFAULT_HOUSEHOLD

  const allDishes = useLiveQuery(() => db.dishes.toArray(), [], []) ?? []

  const weekDates = week.map(day => day.date)
  const plans = useLiveQuery(
    () => db.meal_plans.where('date').anyOf(weekDates).toArray(),
    [weekDates.join('|')],
    [],
  ) ?? []

  useEffect(() => {
    ensureDietChartRulesAndPlans()
  }, [])

  function plannedMealFor(date: string, slot: 'breakfast' | 'lunch' | 'dinner') {
    return plans.find(plan => plan.date === date && plan.slot === slot)
  }

  async function replaceDish(replacement: Dish) {
    if (!replaceTarget) return
    const existing = plannedMealFor(replaceTarget.date, replaceTarget.slot)
    if (!existing) return
    const components = existing.meal.components.map(component =>
      component.dish.id === replaceTarget.dishId ? { ...component, dish: replacement } : component,
    )
    await upsertMealPlan({
      ...existing.meal,
      components,
    })
    setReplaceTarget(null)
  }

  async function addDish(dish: Dish) {
    const target = addTarget ?? quickAddTarget
    if (!target) return
    const existing = plannedMealFor(target.date, target.slot)
    const nextComponents = [
      ...(existing?.meal.components ?? []),
      {
        dish,
        swappable: true,
        person_scope: dishScopeForHousehold(dish, household),
      },
    ]
    const meal: MealOutput = {
      slot: target.slot,
      date: target.date,
      approved: existing?.meal.approved ?? false,
      components: nextComponents,
      macros: existing?.meal.macros ?? { calories: null, protein_g: null },
    }
    await upsertMealPlan(meal)
    setAddTarget(null)
    setQuickAddTarget(null)
  }

  async function regenerateSlot(date: string, slot: 'breakfast' | 'lunch' | 'dinner') {
    const key = `${date}:${slot}`
    setIsRegeneratingKey(key)
    try {
      await regenerateSinglePlannedSlot(date, slot)
    } finally {
      setIsRegeneratingKey(null)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#FFFCF8', fontFamily: font }}>
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#6B5E57', letterSpacing: '0.08em' }}>
          What's Cookin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1D1D1F' }}>Weekly Menu</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5E57' }}>
          Generated from your food habits. Tweak dishes here, then regenerate only when you want a fresh week.
        </p>
      </div>

      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-2 px-5 pb-4" style={{ width: 'max-content' }}>
          {week.map(day => {
            const isSelected = day.date === selectedDate
            const label = new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })
            const dateNum = new Date(day.date + 'T00:00:00').getDate()
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all active:scale-95"
                style={{
                  backgroundColor: isSelected ? '#1D1D1F' : '#FFFFFF',
                  boxShadow: isSelected ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                  minWidth: 58,
                }}
              >
                <span className="text-xs font-semibold" style={{ color: isSelected ? '#FFFFFF' : '#3C3C43' }}>
                  {label}
                </span>
                <span className="text-sm" style={{ color: isSelected ? '#FFFFFF' : '#AFA49E' }}>
                  {dateNum}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {PLANNED_MENU_SLOTS.map(slot => {
          const plan = plannedMealFor(selectedDate, slot)
          const key = `${selectedDate}:${slot}`
          const isRegenerating = isRegeneratingKey === key
          return (
            <section key={slot}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[15px] font-semibold" style={{ color: '#1D1D1F' }}>{SLOT_LABEL[slot]}</h2>
                <button
                  onClick={() => void regenerateSlot(selectedDate, slot)}
                  className="text-xs font-semibold transition-opacity active:opacity-70"
                  style={{ color: '#E8622A' }}
                >
                  {isRegenerating ? 'Regenerating…' : 'Regenerate slot'}
                </button>
              </div>

              {plan ? (
                <>
                  <MealCard
                    meal={plan.meal}
                    onSwap={component => setReplaceTarget({ date: selectedDate, slot, dishId: component.dish.id })}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setAddTarget({ date: selectedDate, slot })}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
                      style={{ backgroundColor: '#F5EEE6', color: '#1D1D1F' }}
                    >
                      Add from library
                    </button>
                    <button
                      onClick={() => setQuickAddTarget({ date: selectedDate, slot })}
                      className="px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
                      style={{ backgroundColor: '#F5EEE6', color: '#1D1D1F' }}
                    >
                      Quick add new dish
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState onRegenerate={() => void regenerateSlot(selectedDate, slot)} />
              )}
            </section>
          )
        })}
      </div>

      <LibraryPickSheet
        open={replaceTarget !== null || addTarget !== null}
        onClose={() => {
          setReplaceTarget(null)
          setAddTarget(null)
        }}
        allDishes={allDishes}
        onSelect={dish => {
          if (replaceTarget) {
            void replaceDish(dish)
            return
          }
          void addDish(dish)
        }}
      />

      <QuickAddSheet
        open={quickAddTarget !== null}
        onClose={() => setQuickAddTarget(null)}
        onSaved={dish => {
          void addDish(dish)
        }}
        title="Add dish to weekly menu"
      />
    </div>
  )
}
