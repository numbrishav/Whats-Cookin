import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { DEFAULT_GOALS, DEFAULT_HOUSEHOLD } from '@/lib/seed'
import { supabase } from '@/lib/supabase'
import {
  AVOID_COMBINATION_OPTIONS,
  BREAKFAST_SHAPE_OPTIONS,
  DINNER_SHAPE_OPTIONS,
  LUNCH_SHAPE_OPTIONS,
  deriveDietChartRuleDefaults,
  ensureDietChartRulesAndPlans,
  regenerateDietChartMenu,
  saveDietChartRulePrefs,
} from '@/lib/weekly-menu'
import type {
  AvoidCombinationKey,
  BreakfastShape,
  DietChartRulePrefs,
  DietType,
  DinnerShape,
  Goals,
  Household,
  HouseholdMember,
  LunchShape,
} from '@/types'

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

const DIET_OPTIONS: { value: DietType; label: string; color: string }[] = [
  { value: 'veg',        label: 'Veg', color: '#34C759' },
  { value: 'eggitarian', label: 'Egg', color: '#FF9F0A' },
  { value: 'nonveg',     label: 'NV',  color: '#FF6B00' },
]

const DIET_DOT_COLOR: Record<DietType, string> = {
  veg:        '#34C759',
  eggitarian: '#FF9F0A',
  nonveg:     '#FF6B00',
}

const NAME_PRESETS = ['Me', 'Partner', 'Flatmate', 'Guest']

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ value, step, min, max, onChange }: {
  value: number
  step: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium transition-all active:scale-[0.92]"
        style={{
          backgroundColor: value <= min ? '#F5EEE6' : '#E5E5EA',
          color: value <= min ? '#C7C7CC' : '#1D1D1F',
        }}
      >
        −
      </button>
      <span className="w-12 text-center text-[15px] font-semibold tabular-nums" style={{ color: '#1D1D1F' }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium transition-all active:scale-[0.92]"
        style={{
          backgroundColor: value >= max ? '#F5EEE6' : '#E5E5EA',
          color: value >= max ? '#C7C7CC' : '#1D1D1F',
        }}
      >
        +
      </button>
    </div>
  )
}

// ─── iOS Toggle ───────────────────────────────────────────────────────────────

function IOSToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-12 h-7 rounded-full relative flex-shrink-0 transition-colors duration-200"
      style={{ backgroundColor: value ? '#34C759' : '#E5E5EA' }}
    >
      <div
        className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all duration-200"
        style={{
          left: value ? '1.25rem' : '0.125rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest px-1 mb-2"
      style={{ color: '#6B5E57', letterSpacing: '0.06em' }}
    >
      {title}
    </p>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {children}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px mx-4" style={{ backgroundColor: '#E5E5EA' }} />
}

function ChoicePills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95"
          style={{
            backgroundColor: value === option.value ? '#1D1D1F' : '#F5EEE6',
            color: value === option.value ? '#FFFFFF' : '#3C3C43',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ member, isOnly, onUpdate, onRemove }: {
  member: HouseholdMember
  isOnly: boolean
  onUpdate: (m: HouseholdMember) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [customInput, setCustomInput] = useState('')

  function setLabel(label: string) {
    onUpdate({ ...member, label })
  }

  function setDiet(diet_type: DietType) {
    onUpdate({ ...member, diet_type })
  }

  const isCustom = !NAME_PRESETS.includes(member.label)

  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center px-4 py-3.5 transition-all active:scale-[0.98] text-left"
        style={{ background: 'none', border: 'none' }}
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 mr-3"
          style={{ backgroundColor: DIET_DOT_COLOR[member.diet_type] }}
        />
        <span className="flex-1 text-[15px] font-medium" style={{ color: '#1D1D1F' }}>
          {member.label}
        </span>
        <span className="text-xs mr-2" style={{ color: '#AFA49E' }}>
          {DIET_OPTIONS.find(d => d.value === member.diet_type)?.label}
        </span>
        {!isOnly && (
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="w-6 h-6 rounded-full flex items-center justify-center mr-1 flex-shrink-0 transition-all active:scale-90"
            style={{ backgroundColor: '#F5EEE6', color: '#AFA49E', fontSize: '16px', lineHeight: 1 }}
          >
            ×
          </button>
        )}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms',
            flexShrink: 0,
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: '0.5px solid #F5EEE6' }}>
          <div className="pt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {NAME_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    setCustomInput('')
                    setLabel(preset)
                  }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: member.label === preset ? '#1D1D1F' : '#F5EEE6',
                    color: member.label === preset ? '#FFFFFF' : '#3C3C43',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              value={isCustom ? member.label : customInput}
              onChange={e => {
                const val = e.target.value
                setCustomInput(val)
                if (val) setLabel(val)
              }}
              placeholder="Or type a name…"
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: '#F5EEE6', color: '#1D1D1F', fontFamily: font }}
            />

            <div className="flex gap-2">
              {DIET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDiet(opt.value)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: member.diet_type === opt.value ? opt.color : '#F5EEE6',
                    color: member.diet_type === opt.value ? '#FFFFFF' : '#6B5E57',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const household = useLiveQuery(
    () => db.settings.get('household').then(s => (s?.value as Household) ?? DEFAULT_HOUSEHOLD),
    [],
  ) ?? DEFAULT_HOUSEHOLD

  const goals = useLiveQuery(
    () => db.settings.get('goals').then(s => (s?.value as Goals) ?? DEFAULT_GOALS),
    [],
  ) ?? DEFAULT_GOALS

  const derivedDefaults = deriveDietChartRuleDefaults(household, goals)

  const rulePrefs = useLiveQuery(
    () => db.settings.get('diet_chart_rule_prefs').then(s => (s?.value as DietChartRulePrefs | undefined) ?? derivedDefaults.prefs),
    [household, goals],
    derivedDefaults.prefs,
  ) ?? derivedDefaults.prefs

  const [isRegenerating, setIsRegenerating] = useState(false)
  const [saveNote, setSaveNote] = useState<string | null>(null)

  const hasPrimaryNutrition = household.members.some(m => m.is_primary && m.tracks_nutrition)

  useEffect(() => {
    ensureDietChartRulesAndPlans()
  }, [])

  async function saveHousehold(members: HouseholdMember[]) {
    const next: Household = { people_count: members.length, members }
    await db.settings.put({ key: 'household', value: next })
  }

  async function updateMember(updated: HouseholdMember) {
    const members = household.members.map(m => m.id === updated.id ? updated : m)
    await saveHousehold(members)
  }

  async function removeMember(id: string) {
    const members = household.members.filter(m => m.id !== id)
    await saveHousehold(members)
  }

  async function addMember() {
    const members = [...household.members, {
      id: crypto.randomUUID(),
      label: 'Guest',
      diet_type: 'nonveg' as DietType,
      is_primary: false,
      tracks_nutrition: false,
    }]
    await saveHousehold(members)
  }

  async function updateGoal<K extends keyof Goals>(key: K, value: Goals[K]) {
    const next: Goals = { ...goals, [key]: value }
    await db.settings.put({ key: 'goals', value: next })
  }

  function allowedNonVeg() {
    return household.members.some(member => member.diet_type === 'nonveg')
  }

  function allowedEggs() {
    return household.members.some(member => member.diet_type === 'eggitarian' || member.diet_type === 'nonveg')
  }

  async function updateRulePrefs(next: DietChartRulePrefs) {
    await saveDietChartRulePrefs(next)
    setSaveNote('Saved. Regenerate weekly menu to apply.')
  }

  async function updateHowOften<K extends keyof DietChartRulePrefs['how_often']>(key: K, value: number) {
    await updateRulePrefs({
      ...rulePrefs,
      how_often: { ...rulePrefs.how_often, [key]: value },
    })
  }

  async function updateBreakfastShape(value: BreakfastShape) {
    await updateRulePrefs({
      ...rulePrefs,
      meal_shape: { ...rulePrefs.meal_shape, breakfast_shape: value },
    })
  }

  async function updateLunchShape(value: LunchShape) {
    await updateRulePrefs({
      ...rulePrefs,
      meal_shape: { ...rulePrefs.meal_shape, lunch_shape: value },
    })
  }

  async function updateDinnerShape(value: DinnerShape) {
    await updateRulePrefs({
      ...rulePrefs,
      meal_shape: { ...rulePrefs.meal_shape, dinner_shape: value },
    })
  }

  async function toggleAvoidCombination(key: AvoidCombinationKey, enabled: boolean) {
    await updateRulePrefs({
      ...rulePrefs,
      avoid_combinations: {
        ...rulePrefs.avoid_combinations,
        [key]: enabled,
      },
    })
  }

  async function regenerateWeeklyMenu() {
    setIsRegenerating(true)
    try {
      await regenerateDietChartMenu()
      setSaveNote('Weekly menu regenerated from your current food habits.')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFCF8', fontFamily: font }}>
      <div
        className="px-5 pb-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}
      >
        <h1 className="text-[28px] font-bold tracking-tight mb-6" style={{ color: '#1D1D1F' }}>
          Settings
        </h1>

        {/* Section A — Household */}
        <div className="mb-6">
          <SectionHeader title="Household" />
          <Card>
            {household.members.map((member, i) => (
              <div key={member.id}>
                <MemberRow
                  member={member}
                  isOnly={household.members.length === 1}
                  onUpdate={updateMember}
                  onRemove={() => removeMember(member.id)}
                />
                {i < household.members.length - 1 && <Divider />}
              </div>
            ))}
            <Divider />
            <button
              onClick={addMember}
              className="w-full text-left px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.98]"
              style={{
                color: '#E8622A',
                background: 'none',
                border: 'none',
              }}
            >
              + Add person
            </button>
          </Card>
        </div>

        {/* Section B — Goals */}
        {hasPrimaryNutrition && (
          <div className="mb-6">
            <SectionHeader title="Goals" />
            <Card>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Min calories</p>
                  <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>1200 – 3000 kcal</p>
                </div>
                <Stepper
                  value={goals.daily_calories_min}
                  step={50}
                  min={1200}
                  max={3000}
                  onChange={v => updateGoal('daily_calories_min', v)}
                />
              </div>
              <Divider />
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Max calories</p>
                  <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>1400 – 3500 kcal</p>
                </div>
                <Stepper
                  value={goals.daily_calories_max}
                  step={50}
                  min={1400}
                  max={3500}
                  onChange={v => updateGoal('daily_calories_max', v)}
                />
              </div>
              <Divider />
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Min protein</p>
                  <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>40 – 250 g</p>
                </div>
                <Stepper
                  value={goals.protein_min_g}
                  step={5}
                  min={40}
                  max={250}
                  onChange={v => updateGoal('protein_min_g', v)}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Section C — Food habits */}
        <div className="mb-6">
          <SectionHeader title="Food Habits" />
          <Card>
            <div className="px-4 py-3.5">
              <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>How often</p>
              <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>These defaults shape first-time weekly menu generation and regenerate.</p>
            </div>
            <Divider />

            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Chicken</p>
                <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>Times per week</p>
              </div>
              <Stepper
                value={rulePrefs.how_often.chicken_per_week}
                step={1}
                min={0}
                max={7}
                onChange={v => { if (allowedNonVeg()) void updateHowOften('chicken_per_week', v) }}
              />
            </div>
            <Divider />

            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Fish</p>
                <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>Times per week</p>
              </div>
              <Stepper
                value={rulePrefs.how_often.fish_per_week}
                step={1}
                min={0}
                max={7}
                onChange={v => { if (allowedNonVeg()) void updateHowOften('fish_per_week', v) }}
              />
            </div>
            <Divider />

            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Eggs</p>
                <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>Times per week</p>
              </div>
              <Stepper
                value={rulePrefs.how_often.eggs_per_week}
                step={1}
                min={0}
                max={7}
                onChange={v => { if (allowedEggs()) void updateHowOften('eggs_per_week', v) }}
              />
            </div>
            <Divider />

            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Paneer</p>
                <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>Times per week</p>
              </div>
              <Stepper
                value={rulePrefs.how_often.paneer_per_week}
                step={1}
                min={0}
                max={7}
                onChange={v => void updateHowOften('paneer_per_week', v)}
              />
            </div>
            <Divider />

            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>One-pot meals</p>
                <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>Times per week</p>
              </div>
              <Stepper
                value={rulePrefs.how_often.one_pot_per_week}
                step={1}
                min={0}
                max={7}
                onChange={v => void updateHowOften('one_pot_per_week', v)}
              />
            </div>

            <Divider />
            <div className="px-4 py-3.5">
              <p className="text-[15px] font-medium" style={{ color: '#1D1D1F' }}>Meal shape</p>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B5E57' }}>Breakfast</p>
                <ChoicePills
                  value={rulePrefs.meal_shape.breakfast_shape}
                  onChange={value => void updateBreakfastShape(value)}
                  options={BREAKFAST_SHAPE_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
                />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B5E57' }}>Lunch</p>
                <ChoicePills
                  value={rulePrefs.meal_shape.lunch_shape}
                  onChange={value => void updateLunchShape(value)}
                  options={LUNCH_SHAPE_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
                />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B5E57' }}>Dinner</p>
                <ChoicePills
                  value={rulePrefs.meal_shape.dinner_shape}
                  onChange={value => void updateDinnerShape(value)}
                  options={DINNER_SHAPE_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
                />
              </div>
            </div>

            <Divider />
            <div className="px-4 py-3.5">
              <p className="text-[15px] font-medium mb-3" style={{ color: '#1D1D1F' }}>Avoid these combinations</p>
              <div className="space-y-3">
                {AVOID_COMBINATION_OPTIONS.map(option => (
                  <div key={option.key} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px]" style={{ color: '#1D1D1F' }}>{option.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>{option.hint}</p>
                    </div>
                    <IOSToggle
                      value={rulePrefs.avoid_combinations[option.key]}
                      onChange={value => void toggleAvoidCombination(option.key, value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Divider />
            <div className="px-4 py-4">
              <button
                onClick={() => void regenerateWeeklyMenu()}
                disabled={isRegenerating}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: isRegenerating ? '#E5E5EA' : '#1D1D1F',
                  color: '#FFFFFF',
                }}
              >
                {isRegenerating ? 'Regenerating…' : 'Regenerate Weekly Menu'}
              </button>
              <p className="text-xs mt-2" style={{ color: '#AFA49E' }}>
                Manual edits stay on the schedule page. Regenerate only when you want a fresh week.
              </p>
              {saveNote && (
                <p className="text-xs mt-2" style={{ color: '#6B5E57' }}>
                  {saveNote}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Section D — Account */}
        <div className="mb-6">
          <SectionHeader title="Account" />
          <Card>
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full text-left px-4 py-3.5 text-[15px] font-medium transition-all active:scale-[0.98]"
              style={{ color: '#FF3B30', background: 'none', border: 'none' }}
            >
              Sign out
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
