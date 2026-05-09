import { useState } from 'react'
import type { MealComponent, MealOutput } from '@/types'

interface Props {
  meal: MealOutput
  onSwap: (component: MealComponent) => void
  readOnly?: boolean
}

// ─── Role label ───────────────────────────────────────────────────────────────

function roleLabel(c: MealComponent): string {
  if (c.dish.component_role) {
    const map: Record<string, string> = {
      staple: 'Grain',
      liquid: 'Curry',
      dry:    'Sabzi',
      side:   '',
    }
    return map[c.dish.component_role] ?? ''
  }
  const cat = c.dish.category
  if (cat === 'grain')                            return 'Grain'
  if (cat.startsWith('curry_'))                   return 'Curry'
  if (cat.startsWith('sukhi_sabzi_'))             return 'Sabzi'
  if (cat.startsWith('protein_'))                 return 'Protein'
  return ''
}

// ─── Diet badge ───────────────────────────────────────────────────────────────

function DietBadge({ scope }: { scope: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    nonveg:      { label: 'NV',  color: '#C0392B', bg: '#FFF0EE' },
    eggitarian:  { label: 'Egg', color: '#9A5700', bg: '#FFF3E0' },
    veg:         { label: 'Veg', color: '#1A7F37', bg: '#E6F9ED' },
  }
  const c = cfg[scope]
  if (!c) return null
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        padding: '2px 7px', borderRadius: 999,
        color: c.color, backgroundColor: c.bg,
        display: 'inline-block',
      }}
    >
      {c.label}
    </span>
  )
}

// ─── Swap icon button ─────────────────────────────────────────────────────────

function SwapBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap-highlight-none active:scale-90 transition-transform"
      style={{
        border: 'none', background: 'none', cursor: 'pointer',
        padding: '4px 8px', borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', gap: 3,
        color: '#E8622A', fontSize: 12, fontWeight: 600,
      }}
      aria-label="Swap dish"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 6h9M2 6l3-3M2 6l3 3M14 10H5M14 10l-3-3M14 10l-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      swap
    </button>
  )
}

// ─── Single dish row ──────────────────────────────────────────────────────────

function DishRow({
  component, readOnly, showScope, onSwap,
}: {
  component: MealComponent
  readOnly:  boolean
  showScope: boolean
  onSwap:    () => void
}) {
  const name  = component.quantity
    ? `${component.dish.name}  ·  ${component.quantity}`
    : component.dish.name
  const role  = roleLabel(component)
  const scope = component.person_scope

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span style={{ fontSize: 15, fontWeight: 500, color: '#1C1410', lineHeight: 1.3 }}>{name}</span>
        {showScope && scope !== 'shared' && (
          <DietBadge scope={scope} />
        )}
        {role && (
          <span style={{ fontSize: 10, fontWeight: 500, color: '#AFA49E', letterSpacing: '0.02em' }}>
            {role}
          </span>
        )}
      </div>
      {!readOnly && component.swappable && (
        <div className="flex-shrink-0 ml-2">
          <SwapBtn onClick={onSwap} />
        </div>
      )}
    </div>
  )
}

// ─── Section (per-person expanded view) ──────────────────────────────────────

function PersonSection({
  scope, label, components, readOnly, onSwap,
}: {
  scope:      string
  label:      string
  components: MealComponent[]
  readOnly:   boolean
  onSwap:     (c: MealComponent) => void
}) {
  const colors: Record<string, { color: string; bg: string }> = {
    nonveg:     { color: '#C0392B', bg: '#FFF0EE' },
    eggitarian: { color: '#9A5700', bg: '#FFF3E0' },
    veg:        { color: '#1A7F37', bg: '#E6F9ED' },
    shared:     { color: '#6B5E57', bg: '#F5EEE6' },
  }
  const c = colors[scope] ?? colors.shared

  return (
    <div style={{ padding: '10px 20px 4px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: c.color, backgroundColor: c.bg, borderRadius: 999, padding: '2px 9px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ marginTop: 4 }}>
        {components.map((comp, i) => (
          <DishRow
            key={i}
            component={comp}
            readOnly={readOnly}
            showScope={false}
            onSwap={() => onSwap(comp)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

export function MealCard({ meal, onSwap, readOnly = false }: Props) {
  const [expanded, setExpanded] = useState(false)

  const nonveg  = meal.components.filter(c => c.person_scope === 'nonveg')
  const egg     = meal.components.filter(c => c.person_scope === 'eggitarian')
  const veg     = meal.components.filter(c => c.person_scope === 'veg')
  const shared  = meal.components.filter(c => c.person_scope === 'shared')

  const hasSplit = nonveg.length > 0 || egg.length > 0 || veg.length > 0

  // ─── Collective (collapsed) view ────────────────────────────────────────────

  const collectiveView = (
    <div style={{ padding: '4px 20px 8px' }}>
      {shared.map((c, i) => (
        <DishRow key={i} component={c} readOnly={readOnly} showScope={false} onSwap={() => onSwap(c)} />
      ))}
      {hasSplit && (
        <div style={{ marginTop: shared.length > 0 ? 4 : 0 }}>
          {[...nonveg, ...egg, ...veg].map((c, i) => (
            <DishRow key={i} component={c} readOnly={readOnly} showScope={true} onSwap={() => onSwap(c)} />
          ))}
        </div>
      )}
    </div>
  )

  // ─── Expanded (per-person) view ──────────────────────────────────────────────

  const expandedView = (
    <>
      {nonveg.length > 0 && (
        <PersonSection scope="nonveg" label="Me — Non-veg" components={nonveg} readOnly={readOnly} onSwap={onSwap} />
      )}
      {egg.length > 0 && (
        <PersonSection scope="eggitarian" label="Wife — Egg" components={egg} readOnly={readOnly} onSwap={onSwap} />
      )}
      {veg.length > 0 && (
        <PersonSection scope="veg" label="Wife — Veg" components={veg} readOnly={readOnly} onSwap={onSwap} />
      )}
      {shared.length > 0 && (
        <PersonSection scope="shared" label="Shared" components={shared} readOnly={readOnly} onSwap={onSwap} />
      )}
    </>
  )

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 1px 4px rgba(28,20,16,0.07), 0 1px 2px rgba(28,20,16,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Diet type badges row */}
      <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {nonveg.length > 0  && <DietBadge scope="nonveg"    />}
        {egg.length > 0     && <DietBadge scope="eggitarian"/>}
        {veg.length > 0     && <DietBadge scope="veg"       />}
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', backgroundColor: 'rgba(28,20,16,0.07)', margin: '0 20px' }} />

      {/* Meal body */}
      {expanded ? expandedView : collectiveView}

      {/* Footer: expand toggle */}
      {hasSplit && !readOnly && (
        <>
          <div style={{ height: '0.5px', backgroundColor: 'rgba(28,20,16,0.07)', margin: '4px 20px 0' }} />
          <div style={{ padding: '6px 20px 12px' }}>
            <button
              onClick={() => setExpanded(v => !v)}
              className="tap-highlight-none active:opacity-60"
              style={{ fontSize: 12, color: '#AFA49E', background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer' }}
            >
              {expanded ? 'Collapse ▴' : 'Show per person ▾'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
