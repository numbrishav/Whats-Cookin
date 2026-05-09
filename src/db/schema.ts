import Dexie, { type Table } from 'dexie'
import type { Dish, MealOutput, MealPlan } from '@/types'

export interface Setting {
  key: string
  value: unknown
}

export interface ApprovalRecord {
  id?: number
  date: string           // YYYY-MM-DD
  slot: string
  dish_ids: string[]     // IDs of all dishes in the approved meal
  approved_at: string    // ISO timestamp
}

export interface EatOutRecord {
  id?: number
  date: string
  slot: string
}

export interface DismissedNudge {
  id?: number
  key: string    // e.g. "prep:rajma:2026-05-09" or "grocery:2026-05-09"
}

class WhatsCookinDB extends Dexie {
  dishes!: Table<Dish>
  meals!: Table<MealOutput>
  approvals!: Table<ApprovalRecord>
  eat_out!: Table<EatOutRecord>
  settings!: Table<Setting>
  meal_plans!: Table<MealPlan>
  dismissed_nudges!: Table<DismissedNudge>

  constructor() {
    super('WhatsCookinDB')
    this.version(3).stores({
      dishes: 'id, category, type, status, last_used',
      meals: '[date+slot], date, slot, approved',
      approvals: '++id, date, slot, approved_at',
      eat_out: '++id, date, slot',
      settings: '&key',
    })
    this.version(4).stores({
      dishes: 'id, category, type, status, last_used',
      meals: '[date+slot], date, slot, approved',
      approvals: '++id, date, slot, approved_at',
      eat_out: '++id, date, slot',
      settings: '&key',
      meal_plans: '++id, [date+slot], date',
    })
    this.version(5).stores({
      dishes: 'id, category, type, status, last_used',
      meals: '[date+slot], date, slot, approved',
      approvals: '++id, date, slot, approved_at',
      eat_out: '++id, date, slot',
      settings: '&key',
      meal_plans: '++id, [date+slot], date',
      dismissed_nudges: '++id, &key',
    })
  }
}

export const db = new WhatsCookinDB()

// ─── Seed helpers ─────────────────────────────────────────────────────────────

export async function seedDishLibrary(dishes: Dish[]) {
  const count = await db.dishes.count()
  if (count === 0) {
    await db.dishes.bulkPut(dishes)
  }
}

export async function getRecentlyUsed(days = 7): Promise<Map<string, string>> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffISO = cutoff.toISOString().split('T')[0]

  const dishes = await db.dishes
    .filter(d => !!d.last_used && d.last_used >= cutoffISO)
    .toArray()

  return new Map(dishes.map(d => [d.id, d.last_used!]))
}

export async function getWeeklyUsage(): Promise<Map<string, number>> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffISO = cutoff.toISOString().split('T')[0]

  const approvals = await db.approvals
    .filter(a => a.date >= cutoffISO)
    .toArray()

  const usage = new Map<string, number>()
  for (const approval of approvals) {
    for (const id of approval.dish_ids) {
      usage.set(id, (usage.get(id) ?? 0) + 1)
    }
  }
  return usage
}

export async function approveMeal(meal: MealOutput) {
  const dishIds = meal.components.map(c => c.dish.id)
  const now = new Date().toISOString()

  await db.transaction('rw', db.approvals, db.dishes, db.meals, async () => {
    await db.approvals.add({
      date: meal.date,
      slot: meal.slot,
      dish_ids: dishIds,
      approved_at: now,
    })

    for (const id of dishIds) {
      await db.dishes.update(id, { last_used: meal.date })
    }

    await db.meals.put({ ...meal, approved: true })
  })
}
