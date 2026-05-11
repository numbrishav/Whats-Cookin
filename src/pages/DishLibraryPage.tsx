import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { daysAgo } from '@/lib/dates'
import { DishEditSheet } from '@/components/dishes/DishEditSheet'
import { QuickAddSheet } from '@/components/shared/QuickAddSheet'
import type { Dish, DietType } from '@/types'
import { FOOD_CLASS_DISPLAY, resolveFoodClass } from '@/lib/food-classes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryLabel(dish: Dish): string {
  return FOOD_CLASS_DISPLAY[resolveFoodClass(dish)]
}

const DIET_DOT: Record<DietType, string> = {
  veg: '#34C759',
  eggitarian: '#FF9F0A',
  nonveg: '#FF6B00',
}

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'

// ─── Swipeable row ────────────────────────────────────────────────────────────

function DishRow({ dish, onTap, onArchive, onDelete }: {
  dish: Dish
  onTap: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const touchStartX = useRef<number>(0)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const ACTION_WIDTH = 140 // width of revealed actions

  const lastUsedNote = dish.last_used && daysAgo(dish.last_used) <= 7
    ? `Used ${daysAgo(dish.last_used) === 0 ? 'today' : `${daysAgo(dish.last_used)} day${daysAgo(dish.last_used) === 1 ? '' : 's'} ago`}`
    : null

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current
    if (dx < 0) setSwipeOffset(Math.max(dx, -ACTION_WIDTH))
    else if (revealed) setSwipeOffset(Math.min(0, dx - ACTION_WIDTH))
  }

  function handleTouchEnd() {
    if (swipeOffset < -ACTION_WIDTH / 2) {
      setSwipeOffset(-ACTION_WIDTH)
      setRevealed(true)
    } else {
      setSwipeOffset(0)
      setRevealed(false)
    }
  }

  function handleTap() {
    if (revealed) { setSwipeOffset(0); setRevealed(false); return }
    onTap()
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Action buttons behind the row */}
      <div
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          display: 'flex', width: ACTION_WIDTH,
        }}
      >
        <button
          onClick={() => { setSwipeOffset(0); setRevealed(false); onArchive() }}
          style={{
            flex: 1, border: 'none', cursor: 'pointer', fontFamily: font,
            backgroundColor: '#6B5E57', color: '#FFFFFF',
            fontSize: 13, fontWeight: 600,
          }}
        >
          {dish.status === 'active' ? 'Archive' : 'Unarchive'}
        </button>
        <button
          onClick={() => { setSwipeOffset(0); setRevealed(false); onDelete() }}
          style={{
            flex: 1, border: 'none', cursor: 'pointer', fontFamily: font,
            backgroundColor: '#FF3B30', color: '#FFFFFF',
            fontSize: 13, fontWeight: 600,
          }}
        >
          Delete
        </button>
      </div>

      {/* Dish row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: Math.abs(swipeOffset) === ACTION_WIDTH || swipeOffset === 0 ? 'transform 200ms ease' : 'none',
          backgroundColor: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', minHeight: 60,
          cursor: 'pointer', fontFamily: font,
        }}
      >
        {/* Diet dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          backgroundColor: DIET_DOT[dish.type],
        }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', margin: 0, letterSpacing: '-0.2px' }}>
            {dish.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{
              fontSize: 12, color: '#6B5E57',
              backgroundColor: 'var(--surface)', borderRadius: 6,
              padding: '1px 6px', display: 'inline-block',
            }}>
              {categoryLabel(dish)}
            </span>
            {lastUsedNote && (
              <span style={{ fontSize: 12, color: '#AEAEB2' }}>{lastUsedNote}</span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1 1l5 5-5 5" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DishLibraryPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dietFilter, setDietFilter] = useState<DietType | 'all'>('all')
  const [editDish, setEditDish] = useState<Dish | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const allDishes = useLiveQuery(() => db.dishes.toArray(), []) ?? []

  // Derive unique food_classes present in library (display-friendly, deduplicated)
  const presentClasses = [...new Set(allDishes.map(d => resolveFoodClass(d)))].sort()

  const filtered = allDishes
    .filter(d => categoryFilter === 'all' || resolveFoodClass(d) === categoryFilter)
    .filter(d => dietFilter === 'all' || d.type === dietFilter)
    .sort((a, b) => a.name.localeCompare(b.name))

  const active = filtered.filter(d => d.status === 'active')
  const reserve = filtered.filter(d => d.status === 'reserve')
  const noResults = filtered.length === 0 && allDishes.length > 0

  async function handleArchive(dish: Dish) {
    const next = dish.status === 'active' ? 'reserve' : 'active'
    await db.dishes.update(dish.id, { status: next })
  }

  async function handleDelete(dish: Dish) {
    if (!window.confirm(`Delete ${dish.name}? This cannot be undone.`)) return
    await db.dishes.delete(dish.id)
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
    padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: active ? 600 : 400,
    backgroundColor: active ? '#E8622A' : 'var(--surface-muted)',
    color: active ? '#FFFFFF' : 'var(--text-primary)',
    border: 'none',
    cursor: 'pointer', fontFamily: font,
    transition: 'all 120ms ease',
  })

  const sectionHeader = (label: string, count: number) => (
    <div style={{
      padding: '20px 20px 8px',
      fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: '#6B5E57', fontFamily: font,
    }}>
      {label} <span style={{ fontWeight: 400 }}>({count})</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFCF8', fontFamily: font,
      paddingBottom: 'calc(49px + env(safe-area-inset-bottom) + 16px)' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'rgba(255,252,248,0.94)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        paddingTop: 'env(safe-area-inset-top)',
        borderBottom: '0.5px solid rgba(28,20,16,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.5px', margin: 0 }}>
            Dish Library
          </h1>
          <button
            onClick={() => setQuickAddOpen(true)}
            style={{
              fontSize: 17, fontWeight: 600, color: '#E8622A', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 0',
              fontFamily: font,
            }}
          >
            + Add
          </button>
        </div>

        {/* Category chips */}
        <div style={{ overflowX: 'auto', paddingLeft: 20, paddingBottom: 10, display: 'flex', gap: 8 }}>
          <button style={chipStyle(categoryFilter === 'all')} onClick={() => setCategoryFilter('all')}>All</button>
          {presentClasses.map(fc => (
            <button key={fc} style={chipStyle(categoryFilter === fc)} onClick={() => setCategoryFilter(fc)}>
              {FOOD_CLASS_DISPLAY[fc]}
            </button>
          ))}
        </div>

        {/* Diet type chips */}
        <div style={{ display: 'flex', gap: 8, paddingLeft: 20, paddingBottom: 10 }}>
          {(['all', 'veg', 'eggitarian', 'nonveg'] as const).map(d => (
            <button key={d} style={chipStyle(dietFilter === d)} onClick={() => setDietFilter(d)}>
              {d === 'all' ? 'All' : d === 'veg' ? 'Veg' : d === 'eggitarian' ? 'Egg' : 'Non-veg'}
            </button>
          ))}
        </div>
      </div>

      {/* ── No results ────────────────────────────────────────────────────── */}
      {noResults && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 17, color: '#6B5E57', marginBottom: 12 }}>No dishes match this filter</p>
          <button
            onClick={() => { setCategoryFilter('all'); setDietFilter('all') }}
            style={{ fontSize: 15, color: '#E8622A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Active section ────────────────────────────────────────────────── */}
      {active.length > 0 && (
        <div>
          {sectionHeader('Active', active.length)}
          <div style={{ backgroundColor: '#FFFFFF' }}>
            {active.map((dish, i) => (
              <div key={dish.id}>
                <DishRow
                  dish={dish}
                  onTap={() => setEditDish(dish)}
                  onArchive={() => handleArchive(dish)}
                  onDelete={() => handleDelete(dish)}
                />
                {i < active.length - 1 && (
                  <div style={{ height: '0.5px', backgroundColor: '#F5EEE6', marginLeft: 40 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reserve section ───────────────────────────────────────────────── */}
      {reserve.length > 0 && (
        <div style={{ marginTop: active.length > 0 ? 0 : 0 }}>
          {sectionHeader('Reserve — swap only', reserve.length)}
          <div style={{ backgroundColor: '#FFFFFF' }}>
            {reserve.map((dish, i) => (
              <div key={dish.id}>
                <DishRow
                  dish={dish}
                  onTap={() => setEditDish(dish)}
                  onArchive={() => handleArchive(dish)}
                  onDelete={() => handleDelete(dish)}
                />
                {i < reserve.length - 1 && (
                  <div style={{ height: '0.5px', backgroundColor: '#F5EEE6', marginLeft: 40 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sheets ────────────────────────────────────────────────────────── */}
      <DishEditSheet dish={editDish} onClose={() => setEditDish(null)} />

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSaved={() => setQuickAddOpen(false)}
      />
    </div>
  )
}
