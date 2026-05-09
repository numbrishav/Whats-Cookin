import { useEffect, useRef, useState } from 'react'
import { db } from '@/db/schema'
import type { Dish, DishCategory, DishStatus, DietType } from '@/types'

// ─── Category label map ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<DishCategory, string> = {
  grain: 'Grain',
  protein_nonveg: 'Protein Non-veg',
  protein_veg: 'Protein Veg',
  protein_eggitarian: 'Protein Eggitarian',
  curry_nonveg: 'Curry Non-veg',
  curry_veg: 'Curry Veg',
  curry_eggitarian: 'Curry Eggitarian',
  sukhi_sabzi_leafy: 'Sukhi Sabzi Leafy',
  sukhi_sabzi_light: 'Sukhi Sabzi Light',
  sukhi_sabzi_cruciferous: 'Sukhi Sabzi Cruciferous',
  sukhi_sabzi_dry: 'Sukhi Sabzi Dry',
  sukhi_sabzi_mixed: 'Sukhi Sabzi Mixed',
  snack_nonveg: 'Snack Non-veg',
  snack_eggitarian: 'Snack Eggitarian',
  snack_veg: 'Snack Veg',
  dessert: 'Dessert',
  side: 'Side',
  salad: 'Salad',
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as DishCategory[]

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (dish: Dish) => void
  initialCategory?: DishCategory
  initialDietType?: DietType
  title?: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function QuickAddSheet({
  open,
  onClose,
  onSaved,
  initialCategory,
  initialDietType,
  title = 'Add dish',
}: Props) {
  const nameRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<DishCategory | ''>(initialCategory ?? '')
  const [dietType, setDietType] = useState<DietType>(initialDietType ?? 'veg')
  const [status, setStatus] = useState<DishStatus>('active')
  const [showNutrition, setShowNutrition] = useState(false)
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset form on open
  useEffect(() => {
    if (open) {
      setName('')
      setCategory(initialCategory ?? '')
      setDietType(initialDietType ?? 'veg')
      setStatus('active')
      setShowNutrition(false)
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
      setSaving(false)
      // Auto-focus after animation
      const t = setTimeout(() => nameRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [open, initialCategory, initialDietType])

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const isLocked = !!initialCategory
  const canSave = name.trim().length > 0 && category !== ''

  function handleClose() {
    if (name.trim().length > 0) {
      if (!window.confirm('Discard this dish?')) return
    }
    onClose()
  }

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const newDish: Dish = {
        id: crypto.randomUUID(),
        name: name.trim(),
        category: category as DishCategory,
        type: dietType,
        status,
        tags: [],
        calories_per_serving: calories !== '' ? parseFloat(calories) : null,
        protein_g: protein !== '' ? parseFloat(protein) : null,
        carbs_g: carbs !== '' ? parseFloat(carbs) : null,
        fat_g: fat !== '' ? parseFloat(fat) : null,
        last_used: null,
      }
      await db.dishes.add(newDish)
      onSaved(newDish)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        style={{ animation: 'fadeIn 200ms ease forwards' }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full flex flex-col"
        style={{
          background: '#FFFCF8',
          borderRadius: '28px 28px 0 0',
          maxHeight: '70vh',
          animation: 'slideUp 300ms cubic-bezier(0.0,0.0,0.2,1.0) forwards',
          fontFamily,
        }}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 pt-3 pb-1 flex flex-col items-center">
          <div
            style={{
              width: '36px',
              height: '5px',
              borderRadius: '9999px',
              background: 'rgba(28,20,16,0.12)',
            }}
          />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-2 pb-3">
          <h2
            style={{
              fontSize: '17px',
              fontWeight: 600,
              color: '#1D1D1F',
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="flex items-center justify-center active:opacity-60 transition-opacity duration-[120ms]"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#E5E5EA',
              border: 'none',
              cursor: 'pointer',
              color: '#6B5E57',
            }}
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">

          {/* Dish name */}
          <div>
            <label
              style={{ fontSize: '13px', fontWeight: 500, color: '#6B5E57', display: 'block', marginBottom: '6px' }}
            >
              Dish name
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Methi Aloo"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(28,20,16,0.12)',
                background: '#FFFFFF',
                fontSize: '17px',
                color: '#1D1D1F',
                fontFamily,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.border = '1px solid #E8622A')}
              onBlur={e => (e.target.style.border = '1px solid rgba(28,20,16,0.12)')}
            />
          </div>

          {/* Category */}
          <div>
            <label
              style={{ fontSize: '13px', fontWeight: 500, color: '#6B5E57', display: 'block', marginBottom: '6px' }}
            >
              Category
            </label>
            {isLocked ? (
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#E5E5EA',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1D1D1F',
                  }}
                >
                  {CATEGORY_LABELS[initialCategory!]}
                </div>
                <p style={{ fontSize: '12px', color: '#6B5E57', marginTop: '4px' }}>
                  Adding to {CATEGORY_LABELS[initialCategory!]}
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as DishCategory)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    paddingRight: '36px',
                    borderRadius: '12px',
                    border: '1px solid rgba(28,20,16,0.12)',
                    background: '#FFFFFF',
                    fontSize: '15px',
                    color: category === '' ? '#6B5E57' : '#1D1D1F',
                    fontFamily,
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="" disabled>Select a category</option>
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
                {/* Chevron icon */}
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#6B5E57',
                  }}
                >
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Diet type */}
          <div>
            <label
              style={{ fontSize: '13px', fontWeight: 500, color: '#6B5E57', display: 'block', marginBottom: '6px' }}
            >
              Diet type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {([
                { value: 'veg' as DietType, label: 'Veg', emoji: '🌿' },
                { value: 'eggitarian' as DietType, label: 'Egg', emoji: '🥚' },
                { value: 'nonveg' as DietType, label: 'Non-veg', emoji: '🍗' },
              ] as const).map(option => {
                const selected = dietType === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setDietType(option.value)}
                    style={{
                      minHeight: '52px',
                      borderRadius: '14px',
                      border: selected ? '1px solid #E8622A' : '1px solid rgba(28,20,16,0.12)',
                      background: selected ? 'rgba(0, 122, 255, 0.10)' : '#FFFFFF',
                      color: selected ? '#E8622A' : '#1D1D1F',
                      fontSize: '13px',
                      fontWeight: selected ? 600 : 400,
                      fontFamily,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'all 120ms ease',
                    }}
                    className="active:scale-[0.97]"
                  >
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status segmented control */}
          <div>
            <label
              style={{ fontSize: '13px', fontWeight: 500, color: '#6B5E57', display: 'block', marginBottom: '6px' }}
            >
              Status
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: '#E5E5EA',
                borderRadius: '10px',
                padding: '2px',
                gap: '2px',
              }}
            >
              {(['active', 'reserve'] as DishStatus[]).map(s => {
                const selected = status === s
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      padding: '7px 0',
                      borderRadius: '8px',
                      border: 'none',
                      background: selected ? '#FFFFFF' : 'transparent',
                      boxShadow: selected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                      color: '#1D1D1F',
                      fontSize: '15px',
                      fontWeight: 600,
                      fontFamily,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nutrition (collapsible) */}
          <div>
            <button
              onClick={() => setShowNutrition(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#E8622A',
                fontFamily,
                padding: '0',
              }}
              className="active:opacity-70 transition-opacity duration-[120ms]"
            >
              Add nutrition info
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                style={{
                  transform: showNutrition ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                }}
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showNutrition && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                {([
                  { label: 'Calories', unit: 'kcal', value: calories, setter: setCalories },
                  { label: 'Protein', unit: 'g', value: protein, setter: setProtein },
                  { label: 'Carbs', unit: 'g', value: carbs, setter: setCarbs },
                  { label: 'Fat', unit: 'g', value: fat, setter: setFat },
                ] as const).map(field => (
                  <div key={field.label}>
                    <label
                      style={{ fontSize: '12px', fontWeight: 500, color: '#6B5E57', display: 'block', marginBottom: '4px' }}
                    >
                      {field.label} ({field.unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={field.value}
                      onChange={e => field.setter(e.target.value)}
                      placeholder="—"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(28,20,16,0.12)',
                        background: '#FFFFFF',
                        fontSize: '15px',
                        color: '#1D1D1F',
                        fontFamily,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => (e.target.style.border = '1px solid #E8622A')}
                      onBlur={e => (e.target.style.border = '1px solid rgba(28,20,16,0.12)')}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0 px-5 pb-8 pt-3" style={{ background: '#FFFCF8' }}>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              width: '100%',
              minHeight: '50px',
              borderRadius: '14px',
              border: 'none',
              background: '#E8622A',
              color: '#FFFFFF',
              fontSize: '17px',
              fontWeight: 600,
              fontFamily,
              cursor: canSave && !saving ? 'pointer' : 'default',
              opacity: canSave && !saving ? 1 : 0.4,
              transition: 'opacity 150ms ease',
            }}
            className={canSave && !saving ? 'active:scale-[0.97] active:opacity-90' : ''}
          >
            {saving ? 'Saving…' : 'Save to library'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { transform: translateY(100%) }
          to { transform: translateY(0) }
        }
      `}</style>
    </div>
  )
}
