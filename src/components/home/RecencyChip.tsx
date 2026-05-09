import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { todayISO } from '@/lib/dates'

export function RecencyChip() {
  const recentApprovals = useLiveQuery(async () => {
    const today = todayISO()

    // Get last 3 approval records before today, ordered by date descending
    const all = await db.approvals
      .orderBy('approved_at')
      .reverse()
      .filter(a => a.date < today)
      .limit(3)
      .toArray()

    if (all.length === 0) return []

    // For each approval, grab the first dish id and resolve its name
    const names: string[] = []
    for (const approval of all) {
      const firstId = approval.dish_ids[0]
      if (!firstId) continue
      const dish = await db.dishes.get(firstId)
      if (dish) names.push(dish.name)
    }

    return names
  }, [])

  if (!recentApprovals || recentApprovals.length === 0) return null

  return (
    <div
      className="inline-flex items-center rounded-full px-3 py-1.5 self-start"
      style={{
        backgroundColor: '#FFFCF8',
        border: '1px solid rgba(28,20,16,0.12)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          color: '#6B5E57',
          lineHeight: 1.4,
        }}
      >
        <span style={{ fontWeight: 500, color: '#1D1D1F' }}>Last {recentApprovals.length === 1 ? 'day' : `${recentApprovals.length} days`}:</span>
        {' '}
        {recentApprovals.join(' · ')}
      </span>
    </div>
  )
}
