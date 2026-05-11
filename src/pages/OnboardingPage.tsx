import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/schema'
import { DEFAULT_GOALS } from '@/lib/seed'
import { ensureDietChartRulesAndPlans } from '@/lib/weekly-menu'
import type { DietType, RegionId, HouseholdMember, Goals, Dish, GoalArchetype } from '@/types'
import { resolveFoodClass } from '@/lib/food-classes'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | { kind: 'count' }
  | { kind: 'person'; index: number; total: number }
  | { kind: 'goals' }
  | { kind: 'diet_chart' }
  | { kind: 'library_confirm' }
  | { kind: 'done' }

interface Draft {
  members: HouseholdMember[]
  goals: Goals
}

// ─── Constants ────────────────────────────────────────────────────────────────

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

const DIET_OPTIONS: { value: DietType; label: string; emoji: string; color: string; bg: string }[] = [
  { value: 'veg',        label: 'Veg',        emoji: '🌿', color: '#1A7F37', bg: '#E6F9ED' },
  { value: 'eggitarian', label: 'Eggitarian', emoji: '🥚', color: '#9A5700', bg: '#FFF3E0' },
  { value: 'nonveg',     label: 'Non-veg',    emoji: '🍗', color: '#C0392B', bg: '#FFF0EE' },
]

const REGION_OPTIONS: { value: RegionId; label: string; hint: string; color: string; bg: string }[] = [
  { value: 'north_india',     label: 'North India',     hint: 'Roti · Dal · Sabzi · Chicken curry',        color: '#1D4ED8', bg: '#EFF6FF' },
  { value: 'east_india',      label: 'East India',      hint: 'Rice · Machher jhol · Lal saag',            color: '#0F766E', bg: '#F0FDFA' },
  { value: 'south_india',     label: 'South India',     hint: 'Rice · Sambhar · Kootu · Rasam',            color: '#B45309', bg: '#FFFBEB' },
  { value: 'west_india',      label: 'West India',      hint: 'Thepla · Toor dal · Kolhapuri · Bhakri',   color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'northeast_india', label: 'Northeast India', hint: 'Rice · Masor tenga · Bamboo shoot · Pitha', color: '#047857', bg: '#ECFDF5' },
  { value: 'pan_indian',      label: 'Pan-Indian',      hint: 'Works everywhere — mixed background',       color: '#6B7280', bg: '#F9FAFB' },
]

// ─── Library meal tabs and display groups ────────────────────────────────────

type LibraryMeal = 'breakfast' | 'lunch' | 'evening_snacks' | 'dinner' | 'desserts'
type DisplayGroup = 'one_pot' | 'staples' | 'mains' | 'veggies_sides'

interface LibraryMealTab {
  id: LibraryMeal
  label: string
  question: string
  canSkip: boolean
  hasGroups: boolean
}

const LIBRARY_MEAL_TABS: LibraryMealTab[] = [
  { id: 'breakfast',      label: 'Breakfast',     question: 'What do you cook for breakfast?',      canSkip: true,  hasGroups: false },
  { id: 'lunch',          label: 'Lunch',          question: 'What do you cook for lunch?',          canSkip: false, hasGroups: true  },
  { id: 'evening_snacks', label: 'Evening Snacks', question: 'What do you have for evening snacks?', canSkip: true,  hasGroups: false },
  { id: 'dinner',         label: 'Dinner',         question: 'What do you cook for dinner?',         canSkip: false, hasGroups: true  },
  { id: 'desserts',       label: 'Desserts',       question: 'Any sweet endings to add?',            canSkip: true,  hasGroups: false },
]

const DISPLAY_GROUP_LABELS: Record<DisplayGroup, string> = {
  one_pot:       'One-Pot Meals',
  staples:       'Staples',
  mains:         'Mains',
  veggies_sides: 'Veggies & Sides',
}

const DISPLAY_GROUP_SUBTITLES: Partial<Record<DisplayGroup, string>> = {
  one_pot: 'A complete meal — replaces your roti + dal',
}

const DISPLAY_GROUP_ORDER: DisplayGroup[] = [
  'one_pot', 'staples', 'mains', 'veggies_sides',
]

// A dish can appear on every onboarding tab where it is genuinely relevant.
// This avoids starving lunch when many staples and mains are valid for both lunch and dinner.
function isDishShownInLibraryMeal(dish: Dish, meal: LibraryMeal): boolean {
  const occ = (dish.occasion ?? []) as string[]
  if (meal === 'breakfast') return occ.includes('breakfast')
  if (meal === 'lunch') return occ.includes('lunch')
  if (meal === 'dinner') return occ.includes('dinner')
  if (meal === 'evening_snacks') return occ.includes('evening_snack')
  if (meal === 'desserts') return occ.includes('dessert')
  return false
}

// Maps a dish's food_class to the onboarding display group.
// Uses resolveFoodClass() from src/lib/food-classes.ts — the canonical source.
const FOOD_CLASS_TO_GROUP: Partial<Record<string, DisplayGroup>> = {
  one_pot:           'one_pot',
  grain_staple:      'staples',
  liquid:            'mains',
  curry:             'mains',
  dry_semi_dry:      'veggies_sides',
  greens:            'veggies_sides',
  side_condiment:    'veggies_sides',
  snack_finger_food: 'veggies_sides',
  dessert:           'veggies_sides',
}

function getDisplayGroup(dish: Dish): DisplayGroup {
  const fc = resolveFoodClass(dish)
  return FOOD_CLASS_TO_GROUP[fc] ?? 'veggies_sides'
}

// Vite needs explicit import paths for bundling — cast because JSON category fields are `string`, not `DishCategory`
type SeedModule = { default: { items: Dish[] } }
const SEED_LOADERS: Record<RegionId, () => Promise<SeedModule>> = {
  north_india:     () => import('../../data/regional-seeds/north_india.json')     as unknown as Promise<SeedModule>,
  east_india:      () => import('../../data/regional-seeds/east_india.json')      as unknown as Promise<SeedModule>,
  south_india:     () => import('../../data/regional-seeds/south_india.json')     as unknown as Promise<SeedModule>,
  west_india:      () => import('../../data/regional-seeds/west_india.json')      as unknown as Promise<SeedModule>,
  northeast_india: () => import('../../data/regional-seeds/northeast_india.json') as unknown as Promise<SeedModule>,
  pan_indian:      () => import('../../data/regional-seeds/pan_indian.json')      as unknown as Promise<SeedModule>,
}

const NAME_PRESETS = ['Me', 'Partner', 'Flatmate', 'Guest']

function makeMember(index: number): HouseholdMember {
  return {
    id: crypto.randomUUID(),
    label: index === 0 ? 'Me' : 'Partner',
    diet_type: 'nonveg',
    is_primary: index === 0,
    tracks_nutrition: index === 0,
    home_region: 'pan_indian',
  }
}

function totalSteps(draft: Draft): number {
  return 1 + draft.members.length + 1 + 1 + 1 // count + persons + goals + diet_chart + library_confirm
}

function stepNumber(step: Step, draft: Draft): number {
  if (step.kind === 'count')           return 1
  if (step.kind === 'person')          return 2 + step.index
  if (step.kind === 'goals')           return 2 + draft.members.length
  if (step.kind === 'diet_chart')      return 3 + draft.members.length
  if (step.kind === 'library_confirm') return 4 + draft.members.length
  return totalSteps(draft)
}

// ─── Load and merge regional seeds ───────────────────────────────────────────

async function loadMergedSeeds(members: HouseholdMember[]): Promise<Dish[]> {
  const regions = [...new Set(members.map(m => m.home_region ?? 'pan_indian'))]
  const allSets = await Promise.all(regions.map(r => SEED_LOADERS[r]().then(m => m.default.items)))

  // Build overlap map for boost tracking
  const idCounts = new Map<string, number>()
  for (const items of allSets) {
    for (const dish of items) {
      idCounts.set(dish.id, (idCounts.get(dish.id) ?? 0) + 1)
    }
  }

  // Deduplicate — first occurrence wins, mark overlaps
  const seen = new Set<string>()
  const merged: Dish[] = []
  for (const items of allSets) {
    for (const dish of items) {
      if (seen.has(dish.id)) continue
      seen.add(dish.id)
      merged.push(dish)
    }
  }

  return merged
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width:  i + 1 === current ? 20 : 6,
            height: 6,
            backgroundColor: i + 1 <= current ? '#E8622A' : 'rgba(28,20,16,0.12)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({
  step, draft, onBack, children,
}: {
  step: Step
  draft: Draft
  onBack?: () => void
  children: React.ReactNode
}) {
  const current = stepNumber(step, draft)
  const total   = totalSteps(draft)

  return (
    <div
      className="min-h-screen flex flex-col px-5 pt-14 pb-10"
      style={{ backgroundColor: '#FFFCF8', fontFamily: font }}
    >
      <div className="flex items-center justify-between mb-10">
        {onBack ? (
          <button onClick={onBack} className="text-sm font-medium" style={{ color: '#6B5E57' }}>
            ← Back
          </button>
        ) : (
          <div />
        )}
        <ProgressDots current={current} total={total} />
        <div style={{ width: 48 }} />
      </div>

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  )
}

// ─── Screen A — People count ──────────────────────────────────────────────────

function ScreenCount({ onNext }: { onNext: (n: number) => void }) {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1C1410' }}>
        How many people are we cooking for?
      </h1>
      <p className="text-base mb-10" style={{ color: '#6B5E57' }}>
        You can always change this later.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            onClick={() => onNext(n)}
            className="flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              minHeight: 100,
            }}
          >
            <span className="text-4xl font-bold" style={{ color: '#1C1410' }}>
              {n === 4 ? '4+' : n}
            </span>
            <span className="text-xs mt-1" style={{ color: '#AFA49E' }}>
              {n === 1 ? 'person' : 'people'}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Screen B — Per person (name + diet + region) ─────────────────────────────

function ScreenPerson({
  index,
  member,
  onChange,
  onNext,
}: {
  index: number
  member: HouseholdMember
  onChange: (m: HouseholdMember) => void
  onNext: () => void
}) {
  const isPrimary = index === 0
  const [customName, setCustomName] = useState('')
  const isCustom = !NAME_PRESETS.includes(member.label)

  function setLabel(label: string) {
    setCustomName('')
    onChange({ ...member, label })
  }

  return (
    <div className="overflow-y-auto flex-1 flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1C1410' }}>
        Tell us about{' '}
        <span style={{ color: '#FF6B00' }}>
          {index === 0 ? 'you' : `person ${index + 1}`}
        </span>
      </h1>
      <p className="text-base mb-8" style={{ color: '#6B5E57' }}>
        {isPrimary ? 'This is your profile.' : 'Who else are we cooking for?'}
      </p>

      {/* Name */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B5E57' }}>
          Name or label
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {NAME_PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => setLabel(preset)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: member.label === preset ? '#1C1410' : '#FFFFFF',
                color: member.label === preset ? '#FFFFFF' : '#3C3C43',
                boxShadow: member.label === preset ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          value={isCustom ? member.label : customName}
          onChange={e => {
            const v = e.target.value
            setCustomName(v)
            if (v) onChange({ ...member, label: v })
          }}
          placeholder="Or type a name…"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ backgroundColor: '#FFFFFF', color: '#1C1410', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        />
      </div>

      {/* Diet */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B5E57' }}>
          Diet
        </p>
        <div className="flex flex-col gap-2">
          {DIET_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...member, diet_type: opt.value })}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[0.98] text-left"
              style={{
                backgroundColor: member.diet_type === opt.value ? opt.bg : '#FFFFFF',
                border: member.diet_type === opt.value ? `1.5px solid ${opt.color}30` : '1.5px solid transparent',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              }}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-base font-semibold" style={{ color: member.diet_type === opt.value ? opt.color : '#1C1410' }}>
                {opt.label}
              </span>
              {member.diet_type === opt.value && (
                <span className="ml-auto text-sm" style={{ color: opt.color }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Region */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#6B5E57' }}>
          Home region
        </p>
        <p className="text-xs mb-3" style={{ color: '#AFA49E' }}>
          We'll pre-load dishes from your regional cuisine.
        </p>
        <div className="flex flex-col gap-2">
          {REGION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...member, home_region: opt.value })}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] text-left"
              style={{
                backgroundColor: member.home_region === opt.value ? opt.bg : '#FFFFFF',
                border: member.home_region === opt.value ? `1.5px solid ${opt.color}40` : '1.5px solid transparent',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: member.home_region === opt.value ? opt.color : '#1C1410' }}>
                  {opt.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>{opt.hint}</p>
              </div>
              {member.home_region === opt.value && (
                <span className="text-sm flex-shrink-0 ml-3" style={{ color: opt.color }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Nutrition toggle — primary only */}
      {isPrimary && (
        <div className="mb-8">
          <button
            onClick={() => onChange({ ...member, tracks_nutrition: !member.tracks_nutrition })}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
          >
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: '#1C1410' }}>Track my calories & protein</p>
              <p className="text-xs mt-0.5" style={{ color: '#AFA49E' }}>See macro estimates on your daily suggestions</p>
            </div>
            <div
              className="w-12 h-7 rounded-full transition-colors duration-200 relative flex-shrink-0 ml-4"
              style={{ backgroundColor: member.tracks_nutrition ? '#34C759' : '#E5E5EA' }}
            >
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-200"
                style={{ left: member.tracks_nutrition ? '1.25rem' : '0.125rem' }}
              />
            </div>
          </button>
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#1C1410', color: '#FFFFFF' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Screen C — Goal archetypes ───────────────────────────────────────────────

interface ArchetypeOption {
  id: GoalArchetype
  title: string
  description: string
  emoji: string
  goals: Goals
}

const ARCHETYPE_OPTIONS: ArchetypeOption[] = [
  {
    id: 'balanced',
    title: 'Balanced Eating',
    description: 'A good mix of everything — proteins, vegetables, grains. No extremes.',
    emoji: '⚖️',
    goals: { daily_calories_min: 1800, daily_calories_max: 2100, protein_min_g: 80, goal_archetype: 'balanced' },
  },
  {
    id: 'high_protein',
    title: 'High Protein',
    description: 'More dal, eggs, and lean proteins at every meal.',
    emoji: '💪',
    goals: { daily_calories_min: 1900, daily_calories_max: 2300, protein_min_g: 120, goal_archetype: 'high_protein' },
  },
  {
    id: 'fat_loss',
    title: 'Fat Loss',
    description: 'Lighter dishes and less heavy carbs. Still satisfying.',
    emoji: '🔥',
    goals: { daily_calories_min: 1500, daily_calories_max: 1800, protein_min_g: 100, goal_archetype: 'fat_loss' },
  },
  {
    id: 'muscle_gain',
    title: 'Muscle Gain',
    description: 'Protein-heavy with room for complex carbs to fuel recovery.',
    emoji: '🏋️',
    goals: { daily_calories_min: 2200, daily_calories_max: 2600, protein_min_g: 150, goal_archetype: 'muscle_gain' },
  },
  {
    id: 'no_rules',
    title: 'No Rules',
    description: 'Just enjoy food. No targets, no restrictions.',
    emoji: '🎉',
    goals: { daily_calories_min: 1500, daily_calories_max: 3000, protein_min_g: 40, goal_archetype: 'no_rules' },
  },
]

function ScreenGoals({ goals, onChange, onNext }: {
  goals: Goals
  onChange: (g: Goals) => void
  onNext: () => void
}) {
  const selected = goals.goal_archetype ?? 'balanced'

  function selectArchetype(option: ArchetypeOption) {
    onChange({ ...option.goals })
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1C1410' }}>
        What's your food vibe?
      </h1>
      <p className="text-base mb-8" style={{ color: '#6B5E57' }}>
        We'll tune suggestions to match. Change anytime.
      </p>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-4">
        {ARCHETYPE_OPTIONS.map(option => {
          const isSelected = selected === option.id
          return (
            <button
              key={option.id}
              onClick={() => selectArchetype(option)}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                backgroundColor: isSelected ? '#FFF3E0' : '#FFFFFF',
                border: isSelected ? '1.5px solid #E8622A40' : '1.5px solid transparent',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              }}
            >
              <span className="text-2xl flex-shrink-0">{option.emoji}</span>
              <div className="min-w-0">
                <p className="text-base font-semibold" style={{ color: isSelected ? '#E8622A' : '#1C1410' }}>
                  {option.title}
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#AFA49E' }}>
                  {option.description}
                </p>
              </div>
              {isSelected && (
                <span className="ml-auto flex-shrink-0 text-sm" style={{ color: '#E8622A' }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-4">
        <button onClick={onNext} className="w-full py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#1C1410', color: '#FFFFFF' }}>
          Continue
        </button>
      </div>
    </>
  )
}

// ─── Screen D — Diet chart ────────────────────────────────────────────────────

function ScreenDietChart({ onSkip, onSetup }: { onSkip: () => void; onSetup: () => void }) {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#1C1410' }}>
        Diet chart
      </h1>
      <p className="text-base mb-8" style={{ color: '#6B5E57' }}>
        A weekly template that guides what gets suggested each day.
      </p>

      <div className="flex flex-col gap-3">
        <button onClick={onSkip} className="w-full text-left px-5 py-5 rounded-2xl transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <p className="text-base font-semibold mb-1" style={{ color: '#1C1410' }}>Skip for now</p>
          <p className="text-sm" style={{ color: '#AFA49E' }}>We'll use a balanced default. Set it up later from Diet Chart.</p>
        </button>
        <button onClick={onSetup} className="w-full text-left px-5 py-5 rounded-2xl transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#FFF3E0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <p className="text-base font-semibold mb-1" style={{ color: '#9A5700' }}>Set it up now →</p>
          <p className="text-sm" style={{ color: '#9A5700', opacity: 0.8 }}>Takes 2 minutes. Much better suggestions from day one.</p>
        </button>
      </div>
    </>
  )
}

// ─── Screen E — Library confirmation (5-screen step-through) ─────────────────

function DietDot({ type }: { type?: string }) {
  if (type === 'nonveg')     return <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: '#C0392B' }} />
  if (type === 'eggitarian') return <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: '#9A5700' }} />
  return null
}

function DishRow({
  dish,
  isExcluded,
  onToggle,
  borderBottom,
}: {
  dish: Dish
  isExcluded: boolean
  onToggle: () => void
  borderBottom: boolean
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-opacity active:opacity-70"
      style={{
        borderBottom: borderBottom ? '1px solid #F5EEE6' : 'none',
        opacity: isExcluded ? 0.35 : 1,
      }}
    >
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          backgroundColor: isExcluded ? '#F5EEE6' : '#1C1410',
          border: isExcluded ? '1.5px solid #D1D1D6' : 'none',
        }}
      >
        {!isExcluded && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="flex-1 text-sm" style={{ color: '#1C1410' }}>{dish.name}</span>
      <DietDot type={dish.type} />
    </button>
  )
}

function ScreenLibraryConfirm({
  members,
  mealIndex,
  onNextMeal,
  onConfirm,
}: {
  members: HouseholdMember[]
  mealIndex: number
  onNextMeal: () => void
  onConfirm: (dishes: Dish[]) => void
}) {
  const [dishes, setDishes]   = useState<Dish[]>([])
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMergedSeeds(members).then(loaded => {
      setDishes(loaded)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tab    = LIBRARY_MEAL_TABS[mealIndex]
  const isLast = mealIndex === LIBRARY_MEAL_TABS.length - 1

  const mealDishes = dishes.filter(d => isDishShownInLibraryMeal(d, tab.id))

  function toggle(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handlePrimary() {
    if (isLast) {
      onConfirm(dishes.map(d => excluded.has(d.id) ? { ...d, status: 'reserve' as const } : d))
    } else {
      onNextMeal()
    }
  }

  const selectedCount = dishes.length - excluded.size

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Meal progress dots */}
      <div className="flex items-center gap-1.5 mb-5">
        {LIBRARY_MEAL_TABS.map((t, i) => (
          <div
            key={t.id}
            className="rounded-full transition-all duration-300"
            style={{
              width:  i === mealIndex ? 18 : 5,
              height: 5,
              backgroundColor: i <= mealIndex ? '#E8622A' : 'rgba(28,20,16,0.12)',
            }}
          />
        ))}
        <span className="text-xs ml-1" style={{ color: '#AFA49E' }}>
          {tab.label}
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#1C1410' }}>
        {tab.question}
      </h1>
      {!loading && (
        <>
          <p className="text-sm mb-1" style={{ color: '#6B5E57' }}>
            We’re going meal by meal. Keep what you actually cook for {tab.label.toLowerCase()}.
          </p>
          <p className="text-xs mb-5" style={{ color: '#AFA49E' }}>
            {selectedCount} dishes selected overall · Uncheck what you never cook
          </p>
        </>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(28,20,16,0.12)', borderTopColor: '#1C1410' }} />
        </div>
      ) : mealDishes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm mb-1" style={{ color: '#6B5E57' }}>
            No {tab.label.toLowerCase()} dishes in your regional seed.
          </p>
          <p className="text-xs" style={{ color: '#AFA49E' }}>
            You can add them later from the Dish Library.
          </p>
        </div>
      ) : tab.hasGroups ? (
        /* Lunch / Dinner — grouped view */
        <div className="flex-1 overflow-y-auto space-y-5 pb-4">
          {DISPLAY_GROUP_ORDER.map(group => {
            const groupDishes = mealDishes.filter(d => getDisplayGroup(d) === group)
            if (groupDishes.length === 0) return null
            const subtitle = DISPLAY_GROUP_SUBTITLES[group]
            return (
              <div key={group}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#6B5E57' }}>
                  {DISPLAY_GROUP_LABELS[group]}
                </p>
                {subtitle && (
                  <p className="text-xs mb-2" style={{ color: '#AFA49E' }}>{subtitle}</p>
                )}
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  {groupDishes.map((dish, i) => (
                    <DishRow
                      key={dish.id}
                      dish={dish}
                      isExcluded={excluded.has(dish.id)}
                      onToggle={() => toggle(dish.id)}
                      borderBottom={i < groupDishes.length - 1}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Breakfast / Snacks / Desserts — flat list */
        <div className="flex-1 overflow-y-auto pb-4">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            {mealDishes.map((dish, i) => (
              <DishRow
                key={dish.id}
                dish={dish}
                isExcluded={excluded.has(dish.id)}
                onToggle={() => toggle(dish.id)}
                borderBottom={i < mealDishes.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      {!loading && (
        <div className="mt-4 space-y-2">
          <button
            onClick={handlePrimary}
            className="w-full py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#1C1410', color: '#FFFFFF' }}
          >
            {isLast ? 'Looks good, take me in →' : `Next: ${LIBRARY_MEAL_TABS[mealIndex + 1].label} →`}
          </button>
          {tab.canSkip && !isLast && (
            <button
              onClick={onNextMeal}
              className="w-full py-2 text-sm transition-all active:opacity-70"
              style={{ color: '#AFA49E' }}
            >
              Skip {tab.label}
            </button>
          )}
          {isLast && (
            <p className="text-xs text-center" style={{ color: '#AFA49E' }}>
              Unchecked dishes go to reserve — still available when swapping.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Done screen ──────────────────────────────────────────────────────────────

function ScreenDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
        style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        🍽️
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ color: '#1C1410' }}>All set!</h1>
      <p className="text-base mb-10 max-w-xs" style={{ color: '#6B5E57' }}>
        Here's what's cooking tonight.
      </p>
      <button
        onClick={onFinish}
        className="w-full max-w-xs py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98]"
        style={{ backgroundColor: '#1C1410', color: '#FFFFFF' }}
      >
        Let's go →
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OnboardingPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>({ kind: 'count' })
  const [draft, setDraft] = useState<Draft>({
    members: [makeMember(0)],
    goals: { ...DEFAULT_GOALS },
  })
  const [goToDietChart, setGoToDietChart] = useState(false)
  const [libraryMealIndex, setLibraryMealIndex] = useState(0)

  // ── Navigation ─────────────────────────────────────────────────────────────

  function handleCount(n: number) {
    const members = Array.from({ length: n }, (_, i) => makeMember(i))
    setDraft(prev => ({ ...prev, members }))
    setStep({ kind: 'person', index: 0, total: n })
  }

  function handlePersonNext(index: number) {
    const next = index + 1
    if (next < draft.members.length) {
      setStep({ kind: 'person', index: next, total: draft.members.length })
    } else {
      setStep({ kind: 'goals' })
    }
  }

  function handleGoalsNext() {
    setStep({ kind: 'diet_chart' })
  }

  function handleDietChart(setup: boolean) {
    setGoToDietChart(setup)
    setLibraryMealIndex(0)
    setStep({ kind: 'library_confirm' })
  }

  function handleBack() {
    if (step.kind === 'library_confirm' && libraryMealIndex > 0) {
      setLibraryMealIndex(prev => prev - 1)
      return
    }
    if (step.kind === 'person' && step.index === 0) {
      setStep({ kind: 'count' })
    } else if (step.kind === 'person') {
      setStep({ kind: 'person', index: step.index - 1, total: step.total })
    } else if (step.kind === 'goals') {
      setStep({ kind: 'person', index: draft.members.length - 1, total: draft.members.length })
    } else if (step.kind === 'diet_chart') {
      setStep({ kind: 'goals' })
    } else if (step.kind === 'library_confirm') {
      setLibraryMealIndex(0)
      setStep({ kind: 'diet_chart' })
    }
  }

  function updateMember(index: number, member: HouseholdMember) {
    setDraft(prev => {
      const members = [...prev.members]
      members[index] = member
      return { ...prev, members }
    })
  }

  // ── Library confirm → seeds DB, then done ──────────────────────────────────

  async function handleLibraryConfirm(dishes: Dish[]) {
    await db.dishes.bulkPut(dishes)
    setStep({ kind: 'done' })
  }

  // ── Finish — saves settings and navigates ──────────────────────────────────

  async function handleFinish() {
    const household = { people_count: draft.members.length, members: draft.members }
    await Promise.all([
      db.settings.put({ key: 'household', value: household }),
      db.settings.put({ key: 'goals', value: draft.goals }),
      db.settings.put({ key: 'onboarding_complete', value: true }),
    ])
    await ensureDietChartRulesAndPlans()
    navigate(goToDietChart ? '/diet-chart' : '/', { replace: true })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step.kind === 'done') {
    return (
      <div className="min-h-screen flex flex-col px-5 pt-14 pb-10" style={{ backgroundColor: '#FFFCF8', fontFamily: font }}>
        <ScreenDone onFinish={handleFinish} />
      </div>
    )
  }

  const showBack = step.kind !== 'count'

  return (
    <Shell step={step} draft={draft} onBack={showBack ? handleBack : undefined}>
      {step.kind === 'count' && (
        <ScreenCount onNext={handleCount} />
      )}

      {step.kind === 'person' && (
        <ScreenPerson
          key={step.index}
          index={step.index}
          member={draft.members[step.index]}
          onChange={m => updateMember(step.index, m)}
          onNext={() => handlePersonNext(step.index)}
        />
      )}

      {step.kind === 'goals' && (
        <ScreenGoals
          goals={draft.goals}
          onChange={g => setDraft(prev => ({ ...prev, goals: g }))}
          onNext={handleGoalsNext}
        />
      )}

      {step.kind === 'diet_chart' && (
        <ScreenDietChart
          onSkip={() => handleDietChart(false)}
          onSetup={() => handleDietChart(true)}
        />
      )}

      {step.kind === 'library_confirm' && (
        <ScreenLibraryConfirm
          members={draft.members}
          mealIndex={libraryMealIndex}
          onNextMeal={() => setLibraryMealIndex(prev => prev + 1)}
          onConfirm={handleLibraryConfirm}
        />
      )}
    </Shell>
  )
}
