import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { DEFAULT_GOALS, DEFAULT_HOUSEHOLD } from '@/lib/seed'
import { supabase } from '@/lib/supabase'
import type { Household, HouseholdMember, DietType, Goals } from '@/types'
import rulesData from '../../data/rules.json'

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

interface FrequencyCapRule {
  id: string
  description: string
}

const FREQUENCY_CAPS: FrequencyCapRule[] = (rulesData.frequency_caps as Array<{ id: string; description: string }>).map(r => ({
  id: r.id,
  description: r.description,
}))

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

  const disabledRules = useLiveQuery(
    () => db.settings.get('disabled_rules').then(s => (s?.value as string[]) ?? []),
    [],
  ) ?? []

  const hasPrimaryNutrition = household.members.some(m => m.is_primary && m.tracks_nutrition)

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

  async function toggleRule(ruleId: string, enabled: boolean) {
    let next: string[]
    if (enabled) {
      next = disabledRules.filter(id => id !== ruleId)
    } else {
      next = [...disabledRules, ruleId]
    }
    await db.settings.put({ key: 'disabled_rules', value: next })
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

        {/* Section C — Rules */}
        <div className="mb-6">
          <SectionHeader title="Rules" />
          <Card>
            {FREQUENCY_CAPS.map((rule, i) => {
              const enabled = !disabledRules.includes(rule.id)
              return (
                <div key={rule.id}>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <p className="flex-1 pr-4 text-[15px]" style={{ color: '#1D1D1F', lineHeight: 1.4 }}>
                      {rule.description}
                    </p>
                    <IOSToggle value={enabled} onChange={on => toggleRule(rule.id, on)} />
                  </div>
                  {i < FREQUENCY_CAPS.length - 1 && <Divider />}
                </div>
              )
            })}
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
