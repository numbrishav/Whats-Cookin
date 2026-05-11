import { db, seedDishLibrary } from '@/db/schema'
import rotationBank from '../../data/rotation-bank.json'
import dietChartData from '../../data/diet-chart.json'
import type { Dish, MealSlotConfig, Household, Goals, DietChartDayPlan } from '@/types'

export const MEAL_SLOTS: MealSlotConfig[] = [
  { id: 'breakfast',     label: 'Breakfast',       active: true,  order: 0 },
  { id: 'lunch',         label: 'Lunch',           active: true,  order: 1 },
  { id: 'evening_snack', label: 'Evening Snack',   active: true,  order: 2 },
  { id: 'dinner',        label: 'Dinner',          active: true,  order: 3 },
  { id: 'dessert',       label: 'Dessert',         active: true,  order: 4 },
]

export const DEFAULT_HOUSEHOLD: Household = {
  people_count: 2,
  members: [
    { id: 'person_1', label: 'Me',   diet_type: 'nonveg',    is_primary: true,  tracks_nutrition: true  },
    { id: 'person_2', label: 'Wife', diet_type: 'eggitarian', is_primary: false, tracks_nutrition: false },
  ],
}

export const DEFAULT_GOALS: Goals = {
  daily_calories_min: 1800,
  daily_calories_max: 2100,
  protein_min_g: 80,
  goal_archetype: 'balanced',
}

export const DEFAULT_DIET_CHART: DietChartDayPlan[] =
  (dietChartData as { slots: DietChartDayPlan[] }).slots

export async function initDB() {
  // Only seed dishes from rotation-bank for existing users (onboarding already done).
  // New users get seeded from regional presets during the onboarding confirmation step.
  const onboardingDone = await db.settings.get('onboarding_complete')
  if (onboardingDone?.value) {
    await seedDishLibrary(rotationBank.items as unknown as Dish[])
  }

  if (!await db.settings.get('household')) {
    await db.settings.put({ key: 'household', value: DEFAULT_HOUSEHOLD })
  }
  if (!await db.settings.get('goals')) {
    await db.settings.put({ key: 'goals', value: DEFAULT_GOALS })
  }
  if (!await db.settings.get('diet_chart')) {
    await db.settings.put({ key: 'diet_chart', value: DEFAULT_DIET_CHART })
  }
}
