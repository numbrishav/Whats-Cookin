import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { useAuth } from '@/components/auth/AuthContext'
import { SavePromptSheet } from '@/components/auth/SavePromptSheet'
import type { Dish, DishCategory, DietType, DishStatus, PrepStep } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: DishCategory[] = [
  'grain',
  'protein_nonveg',
  'protein_veg',
  'protein_eggitarian',
  'curry_nonveg',
  'curry_veg',
  'curry_eggitarian',
  'sukhi_sabzi_leafy',
  'sukhi_sabzi_light',
  'sukhi_sabzi_cruciferous',
  'sukhi_sabzi_dry',
  'sukhi_sabzi_mixed',
  'snack_nonveg',
  'snack_eggitarian',
  'snack_veg',
  'dessert',
  'side',
  'salad',
]

function categoryLabel(cat: DishCategory): string {
  return cat
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Form state ───────────────────────────────────────────────────────────────

type PrepPreset = 'soak_overnight' | 'thaw_freezer' | 'marinate' | 'custom'

const PREP_PRESETS: { id: PrepPreset; label: string; step: PrepStep }[] = [
  { id: 'soak_overnight', label: 'Soak overnight', step: { action: 'Soak overnight (8h)', lead_time_hours: 8, trigger: 'night_before' } },
  { id: 'thaw_freezer',   label: 'Thaw from freezer', step: { action: 'Thaw from freezer', lead_time_hours: 8, trigger: 'night_before' } },
  { id: 'marinate',       label: 'Marinate (2h)', step: { action: 'Marinate (2h)', lead_time_hours: 2, trigger: 'morning_of' } },
  { id: 'custom',         label: 'Custom note', step: { action: '', lead_time_hours: 1, trigger: 'morning_of' } },
]

interface FormState {
  name: string
  category: DishCategory | ''
  dietType: DietType | ''
  status: DishStatus
  calories: string
  protein: string
  carbs: string
  fat: string
  prepSteps: PrepStep[]
}

function dishToForm(dish: Dish): FormState {
  return {
    name: dish.name,
    category: dish.category,
    dietType: dish.type,
    status: dish.status,
    calories: dish.calories_per_serving != null ? String(dish.calories_per_serving) : '',
    protein: dish.protein_g != null ? String(dish.protein_g) : '',
    carbs: dish.carbs_g != null ? String(dish.carbs_g) : '',
    fat: dish.fat_g != null ? String(dish.fat_g) : '',
    prepSteps: dish.prep_steps ? [...dish.prep_steps] : [],
  }
}

function isDirty(form: FormState, dish: Dish): boolean {
  const origPrep = JSON.stringify(dish.prep_steps ?? [])
  const formPrep = JSON.stringify(form.prepSteps)
  return (
    form.name !== dish.name ||
    form.category !== dish.category ||
    form.dietType !== dish.type ||
    form.status !== dish.status ||
    (form.calories || '') !== (dish.calories_per_serving != null ? String(dish.calories_per_serving) : '') ||
    (form.protein || '') !== (dish.protein_g != null ? String(dish.protein_g) : '') ||
    (form.carbs || '') !== (dish.carbs_g != null ? String(dish.carbs_g) : '') ||
    (form.fat || '') !== (dish.fat_g != null ? String(dish.fat_g) : '') ||
    origPrep !== formPrep
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  dish: Dish | null
  onClose: () => void
}

export function DishEditSheet({ dish, onClose }: Props) {
  const nameRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>({
    name: '',
    category: '',
    dietType: '',
    status: 'active',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    prepSteps: [],
  })
  const [nutritionOpen, setNutritionOpen] = useState(false)
  const [prepOpen, setPrepOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savePromptOpen, setSavePromptOpen] = useState(false)

  const { isAnonymous } = useAuth()
  const savePromptShown = useLiveQuery(
    () => db.settings.get('save_prompt_shown').then(s => !!s?.value),
    [],
    false,
  ) ?? false

  // Reset form when dish changes
  useEffect(() => {
    if (dish) {
      const f = dishToForm(dish)
      setForm(f)
      // Auto-open nutrition panel if values exist
      setNutritionOpen(
        dish.calories_per_serving != null ||
        dish.protein_g != null ||
        dish.carbs_g != null ||
        dish.fat_g != null
      )
      // Auto-open prep panel if steps exist
      setPrepOpen(!!(dish.prep_steps && dish.prep_steps.length > 0))
      setTimeout(() => nameRef.current?.focus(), 80)
    }
  }, [dish])

  // Lock body scroll when open
  useEffect(() => {
    if (dish) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [dish])

  if (!dish) return null

  const canSave = form.name.trim() !== '' && form.category !== '' && form.dietType !== ''

  function handleOverlayClick() {
    if (isDirty(form, dish!)) {
      if (!window.confirm('Discard changes?')) return
    }
    onClose()
  }

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    try {
      await db.dishes.update(dish!.id, {
        name: form.name.trim(),
        category: form.category as DishCategory,
        type: form.dietType as DietType,
        status: form.status,
        calories_per_serving: form.calories ? Number(form.calories) : null,
        protein_g: form.protein ? Number(form.protein) : null,
        carbs_g: form.carbs ? Number(form.carbs) : null,
        fat_g: form.fat ? Number(form.fat) : null,
        prep_steps: form.prepSteps.length > 0 ? form.prepSteps : undefined,
      })
      // Show save prompt once after first edit for anonymous users
      if (isAnonymous && !savePromptShown) {
        setSavePromptOpen(true)
      } else {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${dish!.name}? This cannot be undone.`)) return
    await db.dishes.delete(dish!.id)
    onClose()
  }

  const set = (key: keyof FormState) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        style={{ animation: 'fadeIn 200ms ease' }}
        onClick={handleOverlayClick}
      />

      {/* Sheet */}
      <div
        className="relative w-full flex flex-col"
        style={{
          backgroundColor: '#FFFCF8',
          borderRadius: '28px 28px 0 0',
          maxHeight: '85vh',
          animation: 'slideUp 300ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div
            style={{
              width: 36,
              height: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(28,20,16,0.12)',
            }}
          />
        </div>

        {/* Title row */}
        <div className="flex-shrink-0 px-5 pt-2 pb-4">
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1D1D1F',
              letterSpacing: '-0.3px',
            }}
          >
            Edit Dish
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* ── Name ── */}
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#6B5E57' }}>
            Name
          </label>
          <input
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={e => set('name')(e.target.value)}
            placeholder="Dish name"
            style={{
              display: 'block',
              width: '100%',
              fontSize: 17,
              color: '#1D1D1F',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid rgba(28,20,16,0.12)',
              padding: '12px 14px',
              outline: 'none',
              marginBottom: 20,
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = '#E8622A')}
            onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
          />

          {/* ── Category ── */}
          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#6B5E57' }}>
            Category
          </label>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <select
              value={form.category}
              onChange={e => set('category')(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                fontSize: 15,
                color: form.category ? '#1D1D1F' : '#AEAEB2',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid rgba(28,20,16,0.12)',
                padding: '12px 36px 12px 14px',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>Select category</option>
              {ALL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{categoryLabel(cat)}</option>
              ))}
            </select>
            {/* Chevron */}
            <svg
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="12" height="7" viewBox="0 0 12 7" fill="none"
            >
              <path d="M1 1l5 5 5-5" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* ── Diet Type ── */}
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#6B5E57' }}>
            Diet type
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {([ ['veg', 'Veg 🌿'], ['eggitarian', 'Egg 🥚'], ['nonveg', 'Non-veg 🍗'] ] as [DietType, string][]).map(([val, label]) => {
              const active = form.dietType === val
              return (
                <button
                  key={val}
                  onClick={() => set('dietType')(val)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    border: active ? '2px solid #E8622A' : '1.5px solid rgba(28,20,16,0.12)',
                    backgroundColor: active ? '#EBF4FF' : '#FFFFFF',
                    color: active ? '#E8622A' : '#1D1D1F',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                    minHeight: 44,
                    textAlign: 'center',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* ── Status ── */}
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#6B5E57' }}>
            Status
          </label>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#E5E5EA',
              borderRadius: 10,
              padding: 2,
              marginBottom: 24,
            }}
          >
            {([ ['active', 'Active'], ['reserve', 'Reserve'] ] as [DishStatus, string][]).map(([val, label]) => {
              const active = form.status === val
              return (
                <button
                  key={val}
                  onClick={() => set('status')(val)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? '#FFFFFF' : 'transparent',
                    color: active ? '#1D1D1F' : '#6B5E57',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    transition: 'all 120ms ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* ── Nutrition (collapsible) ── */}
          <button
            onClick={() => setNutritionOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 15,
              fontWeight: 600,
              color: '#E8622A',
              background: 'none',
              border: 'none',
              padding: '4px 0',
              cursor: 'pointer',
              marginBottom: nutritionOpen ? 12 : 0,
            }}
          >
            {nutritionOpen ? 'Nutrition info ▴' : 'Add nutrition info ▾'}
            <span style={{ fontSize: 12, fontWeight: 400, color: '#AEAEB2', marginLeft: 2 }}>optional</span>
          </button>

          {nutritionOpen && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 8,
              }}
            >
              {([
                ['calories', 'Calories', 'kcal'],
                ['protein', 'Protein', 'g'],
                ['carbs', 'Carbs', 'g'],
                ['fat', 'Fat', 'g'],
              ] as [keyof FormState, string, string][]).map(([key, label, unit]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B5E57', marginBottom: 4 }}>
                    {label} ({unit})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form[key] as string}
                    onChange={e => set(key)(e.target.value)}
                    placeholder="—"
                    min={0}
                    style={{
                      display: 'block',
                      width: '100%',
                      fontSize: 15,
                      color: '#1D1D1F',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 10,
                      border: '1px solid rgba(28,20,16,0.12)',
                      padding: '10px 12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#E8622A')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(28,20,16,0.12)')}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Prep steps (collapsible) ── */}
          <button
            onClick={() => setPrepOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 15,
              fontWeight: 600,
              color: '#E8622A',
              background: 'none',
              border: 'none',
              padding: '4px 0',
              cursor: 'pointer',
              marginTop: nutritionOpen ? 16 : 8,
              marginBottom: prepOpen ? 12 : 0,
            }}
          >
            {prepOpen ? 'Prep needed ▴' : 'Prep needed? ▾'}
            <span style={{ fontSize: 12, fontWeight: 400, color: '#AEAEB2', marginLeft: 2 }}>optional</span>
          </button>

          {prepOpen && (
            <div style={{ marginBottom: 8 }}>
              {/* Preset chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {PREP_PRESETS.map(preset => {
                  const isActive = form.prepSteps.some(s => s.action === preset.step.action)
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        if (preset.id === 'custom') {
                          // Always add a new blank custom step
                          setForm(f => ({
                            ...f,
                            prepSteps: [...f.prepSteps, { action: '', lead_time_hours: 1, trigger: 'morning_of' }],
                          }))
                        } else if (isActive) {
                          setForm(f => ({ ...f, prepSteps: f.prepSteps.filter(s => s.action !== preset.step.action) }))
                        } else {
                          setForm(f => ({ ...f, prepSteps: [...f.prepSteps, preset.step] }))
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500,
                        border: isActive ? '2px solid #E8622A' : '1.5px solid rgba(28,20,16,0.12)',
                        backgroundColor: isActive ? '#FFF0EA' : '#FFFFFF',
                        color: isActive ? '#E8622A' : '#1D1D1F',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>

              {/* Custom step inputs */}
              {form.prepSteps
                .filter(s => !PREP_PRESETS.some(p => p.step.action === s.action && p.id !== 'custom'))
                .map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={step.action}
                      placeholder="e.g. Marinate with yogurt"
                      onChange={e => {
                        const val = e.target.value
                        setForm(f => {
                          const steps = [...f.prepSteps]
                          const globalIdx = f.prepSteps.findIndex((s, i) =>
                            !PREP_PRESETS.some(p => p.step.action === s.action && p.id !== 'custom') &&
                            f.prepSteps.filter((_, j) => j <= i && !PREP_PRESETS.some(p => p.step.action === f.prepSteps[j].action && p.id !== 'custom')).length - 1 === idx
                          )
                          if (globalIdx >= 0) steps[globalIdx] = { ...steps[globalIdx], action: val }
                          return { ...f, prepSteps: steps }
                        })
                      }}
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#1D1D1F',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 10,
                        border: '1px solid rgba(28,20,16,0.12)',
                        padding: '10px 12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => {
                        setForm(f => {
                          const customSteps = f.prepSteps.filter(s => !PREP_PRESETS.some(p => p.step.action === s.action && p.id !== 'custom'))
                          const toRemove = customSteps[idx]
                          return { ...f, prepSteps: f.prepSteps.filter(s => s !== toRemove) }
                        })
                      }}
                      style={{ background: 'none', border: 'none', color: '#AEAEB2', cursor: 'pointer', fontSize: 18, padding: '4px 2px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Spacer so content clears the sticky footer */}
          <div style={{ height: 24 }} />
        </div>

        {/* ── Sticky footer ── */}
        <div
          className="flex-shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            backgroundColor: '#FFFCF8',
          }}
        >
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 0',
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: canSave && !saving ? '#E8622A' : '#AEAEB2',
              border: 'none',
              cursor: canSave && !saving ? 'pointer' : 'not-allowed',
              transition: 'background-color 150ms ease, transform 100ms ease, opacity 100ms ease',
              minHeight: 52,
              marginBottom: 8,
            }}
            onPointerDown={e => { if (canSave && !saving) (e.currentTarget.style.transform = 'scale(0.97)') }}
            onPointerUp={e => { (e.currentTarget.style.transform = 'scale(1)') }}
            onPointerLeave={e => { (e.currentTarget.style.transform = 'scale(1)') }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {/* Delete link */}
          <button
            onClick={handleDelete}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 0',
              fontSize: 15,
              fontWeight: 500,
              color: '#FF3B30',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Delete dish
          </button>
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>

      {/* Save prompt — shown once after first dish edit for anonymous users */}
      <SavePromptSheet
        open={savePromptOpen}
        onDismiss={() => { setSavePromptOpen(false); onClose() }}
      />
    </div>
  )
}
