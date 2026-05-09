import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { todayDayOfWeek } from '@/lib/dates'
import type { DayOfWeek } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProteinPref = 'veg' | 'nonveg' | 'either' | 'none'
type CarbPref    = 'roti' | 'rice' | 'either' | 'none'
type SabziPref   = 'green' | 'any' | 'none'
type SlotId      = 'lunch' | 'dinner'

interface SlotConstraint {
  protein:     ProteinPref
  carb:        CarbPref
  carb_qty:    number
  sabzi:       SabziPref
  notes:       string
  is_flexible: boolean
}

type DietConstraints = Partial<Record<DayOfWeek, Partial<Record<SlotId, SlotConstraint>>>>

const DEFAULT_CONSTRAINT: SlotConstraint = {
  protein:     'either',
  carb:        'either',
  carb_qty:    2,
  sabzi:       'any',
  notes:       '',
  is_flexible: true,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABEL: Record<DayOfWeek, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
const SLOTS: SlotId[] = ['lunch', 'dinner']
const SLOT_LABEL: Record<SlotId, string> = { lunch: 'Lunch', dinner: 'Dinner' }

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function constraintSummary(c: SlotConstraint): string {
  if (c.is_flexible) return 'Flexible — engine picks freely'
  const parts: string[] = []
  if (c.protein === 'veg') parts.push('Veg protein')
  else if (c.protein === 'nonveg') parts.push('NV protein')
  else if (c.protein === 'either') parts.push('Any protein')

  if (c.carb === 'roti') parts.push(`Roti ×${c.carb_qty}`)
  else if (c.carb === 'rice') parts.push(`Rice ×${c.carb_qty}`)
  else if (c.carb === 'either') parts.push('Roti or Rice')

  if (c.sabzi === 'green') parts.push('Green sabzi')
  else if (c.sabzi === 'any') parts.push('Any sabzi')

  return parts.length > 0 ? parts.join(' · ') : 'No constraints set'
}

// ─── Toggle Chips ─────────────────────────────────────────────────────────────

function ToggleChips<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#6B5E57' }}>
        {label}
      </p>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
            style={{
              backgroundColor: value === opt.value ? '#1D1D1F' : '#F5EEE6',
              color: value === opt.value ? '#FFFFFF' : '#3C3C43',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

function SlotEditSheet({ open, onClose, slotId, constraint, onSave }: {
  open: boolean
  onClose: () => void
  slotId: SlotId
  constraint: SlotConstraint
  onSave: (c: SlotConstraint) => void
}) {
  const [local, setLocal] = useState<SlotConstraint>(constraint)

  useEffect(() => {
    if (open) setLocal({ ...constraint })
  }, [open, constraint])

  function set<K extends keyof SlotConstraint>(key: K, value: SlotConstraint[K]) {
    setLocal(prev => ({ ...prev, [key]: value }))
  }

  function handleClose() {
    onSave(local)
    onClose()
  }

  const rotiOptions  = [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }]
  const riceOptions  = [{ value: 0.5, label: '½' }, { value: 1, label: '1' }, { value: 1.5, label: '1½' }]
  const qtyOptions   = local.carb === 'roti' ? rotiOptions : riceOptions

  return (
    <BottomSheet open={open} onClose={handleClose} title={SLOT_LABEL[slotId]}>
      <div className="space-y-6 pb-4">
        {/* Flexible toggle */}
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
          style={{ backgroundColor: '#F5EEE6' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>Flexible</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B5E57' }}>Engine picks freely from your library</p>
          </div>
          <button
            onClick={() => set('is_flexible', !local.is_flexible)}
            className="w-12 h-7 rounded-full transition-colors duration-200 relative flex-shrink-0"
            style={{ backgroundColor: local.is_flexible ? '#34C759' : '#E5E5EA' }}
          >
            <div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-200"
              style={{ left: local.is_flexible ? '1.25rem' : '0.125rem' }}
            />
          </button>
        </div>

        {!local.is_flexible && (
          <>
            <ToggleChips
              label="Protein"
              value={local.protein}
              options={[
                { value: 'veg',    label: '🌿 Veg' },
                { value: 'nonveg', label: '🍗 NV' },
                { value: 'either', label: 'Either' },
                { value: 'none',   label: 'None' },
              ]}
              onChange={v => set('protein', v)}
            />

            <ToggleChips
              label="Carb"
              value={local.carb}
              options={[
                { value: 'roti',   label: 'Roti' },
                { value: 'rice',   label: 'Rice' },
                { value: 'either', label: 'Either' },
                { value: 'none',   label: 'None' },
              ]}
              onChange={v => set('carb', v)}
            />

            {(local.carb === 'roti' || local.carb === 'rice') && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#6B5E57' }}>
                  {local.carb === 'roti' ? 'How many rotis?' : 'How much rice?'}
                </p>
                <div className="flex gap-2">
                  {qtyOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => set('carb_qty', opt.value)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
                      style={{
                        backgroundColor: local.carb_qty === opt.value ? '#1D1D1F' : '#F5EEE6',
                        color: local.carb_qty === opt.value ? '#FFFFFF' : '#3C3C43',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ToggleChips
              label="Sabzi"
              value={local.sabzi}
              options={[
                { value: 'green', label: 'Green preferred' },
                { value: 'any',   label: 'Any' },
                { value: 'none',  label: 'None' },
              ]}
              onChange={v => set('sabzi', v)}
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#6B5E57' }}>Notes</p>
              <input
                value={local.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="e.g. Protein-first, light dinner"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: '#F5EEE6', color: '#1D1D1F', fontFamily: font }}
              />
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}

// ─── Slot Card ────────────────────────────────────────────────────────────────

function SlotCard({ slotId, constraint, onTap }: {
  slotId: SlotId
  constraint: SlotConstraint
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      className="w-full text-left rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
      style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B5E57' }}>
          {SLOT_LABEL[slotId]}
        </span>
        <span className="text-xs" style={{ color: '#C7C7CC' }}>Edit →</span>
      </div>
      <p
        className="text-sm font-medium"
        style={{ color: constraint.is_flexible ? '#AFA49E' : '#1D1D1F' }}
      >
        {constraintSummary(constraint)}
      </p>
      {!constraint.is_flexible && constraint.notes && (
        <p className="text-xs mt-1" style={{ color: '#AFA49E' }}>{constraint.notes}</p>
      )}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DietChartPage() {
  const today = todayDayOfWeek()
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today)
  const [editTarget, setEditTarget] = useState<{ day: DayOfWeek; slot: SlotId } | null>(null)

  const constraints = useLiveQuery(
    () => db.settings.get('diet_chart_constraints').then(s => (s?.value as DietConstraints) ?? {}),
    [],
    {} as DietConstraints,
  ) ?? {}

  function getConstraint(day: DayOfWeek, slot: SlotId): SlotConstraint {
    return constraints[day]?.[slot] ?? { ...DEFAULT_CONSTRAINT }
  }

  async function saveConstraint(day: DayOfWeek, slot: SlotId, c: SlotConstraint) {
    const next: DietConstraints = {
      ...constraints,
      [day]: { ...constraints[day], [slot]: c },
    }
    await db.settings.put({ key: 'diet_chart_constraints', value: next })
  }

  const editConstraint = editTarget ? getConstraint(editTarget.day, editTarget.slot) : { ...DEFAULT_CONSTRAINT }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#FFFCF8', fontFamily: font }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#6B5E57', letterSpacing: '0.08em' }}>
          What's Cookin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1D1D1F' }}>Diet Chart</h1>
        <p className="text-sm mt-1" style={{ color: '#6B5E57' }}>Tap any slot to set constraints.</p>
      </div>

      {/* Day strip */}
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-2 px-5 pb-4" style={{ width: 'max-content' }}>
          {DAYS.map(day => {
            const isSelected = day === selectedDay
            const isToday    = day === today
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all active:scale-95"
                style={{
                  backgroundColor: isSelected ? '#1D1D1F' : '#FFFFFF',
                  boxShadow: isSelected ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                  minWidth: 56,
                }}
              >
                <span className="text-xs font-semibold" style={{ color: isSelected ? '#FFFFFF' : '#3C3C43' }}>
                  {DAY_LABEL[day]}
                </span>
                {isToday && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#FFFFFF' : '#FF6B00' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot cards */}
      <div className="px-5 space-y-3">
        {SLOTS.map(slot => (
          <SlotCard
            key={slot}
            slotId={slot}
            constraint={getConstraint(selectedDay, slot)}
            onTap={() => setEditTarget({ day: selectedDay, slot })}
          />
        ))}
      </div>

      {/* Edit sheet */}
      {editTarget && (
        <SlotEditSheet
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          slotId={editTarget.slot}
          constraint={editConstraint}
          onSave={c => {
            saveConstraint(editTarget.day, editTarget.slot, c)
            setEditTarget(null)
          }}
        />
      )}
    </div>
  )
}
