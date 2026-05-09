import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { Dish } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (dish: Dish) => void
  allDishes: Dish[]
}

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

export function LibraryPickSheet({ open, onClose, onSelect, allDishes }: Props) {
  const [search, setSearch] = useState('')

  const filtered = allDishes
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  function handleSelect(dish: Dish) {
    onSelect(dish)
    onClose()
    setSearch('')
  }

  return (
    <BottomSheet open={open} onClose={() => { onClose(); setSearch('') }} title="Pick from library">
      <div className="flex flex-col" style={{ minHeight: 0 }}>
        {/* Search */}
        <div className="mb-3 -mt-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes…"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(28,20,16,0.12)',
              background: '#F5EEE6',
              fontSize: '15px',
              color: '#1D1D1F',
              fontFamily: font,
              outline: 'none',
              boxSizing: 'border-box' as const,
            }}
            onFocus={e => (e.target.style.border = '1px solid #E8622A')}
            onBlur={e => (e.target.style.border = '1px solid rgba(28,20,16,0.12)')}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
              No dishes found.
            </p>
          )}
          {filtered.map(dish => (
            <button
              key={dish.id}
              onClick={() => handleSelect(dish)}
              className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left active:opacity-80 transition-opacity tap-highlight-none"
              style={{ backgroundColor: 'var(--surface-muted)', fontFamily: font }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {dish.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {dish.category.replace(/_/g, ' ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}
