import { useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Badge } from '@/components/ui/Badge'
import { daysAgo } from '@/lib/dates'
import type { Dish, MealComponent, RecommendationContext } from '@/types'
import { getSwapOptions } from '@/engine/recommendation'
import { QuickAddSheet } from '@/components/shared/QuickAddSheet'
import { FOOD_CLASS_DISPLAY, resolveFoodClass } from '@/lib/food-classes'

interface Props {
  open: boolean
  onClose: () => void
  target: MealComponent | null
  allDishes: Dish[]
  currentMealIds: string[]
  ctx: RecommendationContext
  onSelect: (replacement: Dish) => void
}

export function SwapSheet({ open, onClose, target, allDishes, currentMealIds, ctx, onSelect }: Props) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  if (!target) return null

  const options = getSwapOptions(allDishes, target.dish, currentMealIds, ctx)
  const active = options.filter(d => d.status === 'active')
  const reserve = options.filter(d => d.status === 'reserve')

  const categoryLabel = FOOD_CLASS_DISPLAY[resolveFoodClass(target.dish)]

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={`Replace: ${target.dish.name}`}
      >
        <div className="flex flex-col" style={{ minHeight: 0 }}>
          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs text-zinc-400 mb-4 -mt-1">From: {categoryLabel}</p>

            {options.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-6">
                No other options in this category.
              </p>
            )}

            {active.length > 0 && (
              <div className="space-y-2 mb-4">
                {active.map(dish => (
                  <DishRow key={dish.id} dish={dish} onSelect={() => { onSelect(dish); onClose() }} />
                ))}
              </div>
            )}

            {reserve.length > 0 && (
              <>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-2">Reserve</p>
                <div className="space-y-2">
                  {reserve.map(dish => (
                    <DishRow key={dish.id} dish={dish} reserve onSelect={() => { onSelect(dish); onClose() }} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Fixed footer — Add something else */}
          <div className="flex-shrink-0 border-t border-[#FFFCF8] pt-3 pb-2 px-5">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 min-h-[44px] active:opacity-70 transition-opacity duration-[120ms]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui' }}
            >
              <span style={{ color: 'var(--accent)', fontSize: '15px', fontWeight: 500 }}>+ Add something else</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSaved={(newDish) => {
          setShowQuickAdd(false)
          onSelect(newDish)
          onClose()
        }}
        initialCategory={target?.dish.category}
        initialDietType={target?.dish.type}
      />
    </>
  )
}

function DishRow({ dish, reserve, onSelect }: { dish: Dish; reserve?: boolean; onSelect: () => void }) {
  const recencyNote = dish.last_used ? `had this ${daysAgo(dish.last_used)} days ago` : null

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 text-left active:opacity-80 transition-opacity tap-highlight-none" style={{ backgroundColor: 'var(--surface-muted)' }}
    >
      <div>
        <p className={`text-sm font-medium ${reserve ? 'text-zinc-500' : 'text-zinc-900'}`}>
          {dish.name}
        </p>
        {recencyNote && (
          <p className="text-xs text-zinc-400 mt-0.5">{recencyNote}</p>
        )}
      </div>
      {reserve && <Badge variant="reserve">Reserve</Badge>}
    </button>
  )
}
