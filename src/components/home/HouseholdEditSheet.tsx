import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { Household, HouseholdMember, DietType } from '@/types'

const DIET_OPTIONS: { value: DietType; label: string; emoji: string; color: string }[] = [
  { value: 'veg',        label: 'Veg', emoji: '🌿', color: '#34C759' },
  { value: 'eggitarian', label: 'Egg', emoji: '🥚', color: '#FF9F0A' },
  { value: 'nonveg',     label: 'NV',  emoji: '🍗', color: '#FF6B00' },
]

const NAME_PRESETS = ['Me', 'Partner', 'Flatmate', 'Guest']

interface Props {
  open: boolean
  onClose: () => void
  household: Household
  onSave: (h: Household) => void
}

export function HouseholdEditSheet({ open, onClose, household, onSave }: Props) {
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setMembers(household.members.map(m => ({ ...m })))
      setCustomInputs({})
    }
  }, [open, household])

  function handleClose() {
    onSave({ people_count: members.length, members })
    onClose()
  }

  function setLabel(id: string, label: string) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, label } : m))
  }

  function setDiet(id: string, diet_type: DietType) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, diet_type } : m))
  }

  function removeMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  function addMember() {
    setMembers(prev => [...prev, {
      id: crypto.randomUUID(),
      label: 'Guest',
      diet_type: 'nonveg',
      is_primary: false,
      tracks_nutrition: false,
    }])
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Your household">
      <div className="space-y-6 pb-4">
        {members.map((member, i) => {
          const isCustom = !NAME_PRESETS.includes(member.label)
          return (
            <div key={member.id}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B5E57' }}>
                  Person {i + 1}
                </span>
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors"
                    style={{ backgroundColor: '#F5EEE6', color: '#6B5E57' }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Name presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                {NAME_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setLabel(member.id, preset)
                      setCustomInputs(prev => ({ ...prev, [member.id]: '' }))
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

              {/* Custom name input */}
              <input
                value={isCustom ? member.label : (customInputs[member.id] ?? '')}
                onChange={e => {
                  const val = e.target.value
                  setCustomInputs(prev => ({ ...prev, [member.id]: val }))
                  if (val) setLabel(member.id, val)
                }}
                placeholder="Or type a name…"
                className="w-full text-sm px-3 py-2 rounded-xl mb-3 outline-none"
                style={{
                  backgroundColor: '#F5EEE6',
                  color: '#1D1D1F',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                }}
              />

              {/* Diet type */}
              <div className="flex gap-2">
                {DIET_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDiet(member.id, opt.value)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: member.diet_type === opt.value ? opt.color : '#F5EEE6',
                      color: member.diet_type === opt.value ? '#FFFFFF' : '#6B5E57',
                    }}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>

              {i < members.length - 1 && (
                <div className="mt-6 h-px" style={{ backgroundColor: '#E5E5EA' }} />
              )}
            </div>
          )
        })}

        <button
          onClick={addMember}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{
            border: '1.5px dashed #C7C7CC',
            color: '#6B5E57',
            backgroundColor: 'transparent',
          }}
        >
          + Add person
        </button>
      </div>
    </BottomSheet>
  )
}
