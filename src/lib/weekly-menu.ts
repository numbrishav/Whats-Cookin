import { db, upsertMealPlan } from '@/db/schema'
import { currentWeekDates, dayOfWeekForDate, todayISO } from '@/lib/dates'
import { resolveFoodClass } from '@/lib/food-classes'
import type {
  AvoidCombinationKey,
  BreakfastShape,
  DayOfWeek,
  DietChartRuleDefaultsMeta,
  DietChartRulePrefs,
  DietType,
  DinnerShape,
  Dish,
  Goals,
  Household,
  LunchShape,
  MealComponent,
  MealOutput,
  MealPlan,
  MealSlotId,
  PersonScope,
  RegionId,
} from '@/types'

type PlannedSlotId = 'breakfast' | 'lunch' | 'dinner'
type ProteinFamily = 'chicken' | 'fish' | 'egg' | 'paneer' | 'one_pot'
type SlotSpecial = ProteinFamily | null

type AnyDish = Dish & {
  diet_type?: DietType
  meal_preference?: MealSlotId[]
  person_scope?: PersonScope
  cuisine?: string[]
  weight?: string
  protein_primary?: boolean
}

type DayPlan = { date: string; day: DayOfWeek }

interface GeneratorContext {
  household: Household
  goals: Goals
  primaryRegion: RegionId
  prefs: DietChartRulePrefs
  dishes: Dish[]
  usage: Map<string, number>
}

export const PLANNED_MENU_SLOTS: PlannedSlotId[] = ['breakfast', 'lunch', 'dinner']

export const BREAKFAST_SHAPE_OPTIONS: { value: BreakfastShape; label: string; hint: string }[] = [
  { value: 'quick', label: 'Quick', hint: 'Fast and low-effort weekday breakfasts.' },
  { value: 'protein_breakfast', label: 'Protein-first', hint: 'More eggs, paneer, and filling starts.' },
  { value: 'traditional_breakfast', label: 'Traditional', hint: 'Regional breakfast dishes more often.' },
  { value: 'light_breakfast', label: 'Light', hint: 'Lighter breakfasts that are easy on the stomach.' },
]

export const LUNCH_SHAPE_OPTIONS: { value: LunchShape; label: string; hint: string }[] = [
  { value: 'staple_main_veg', label: 'Staple + main + veg', hint: 'Balanced everyday lunch.' },
  { value: 'rice_liquid_veg', label: 'Rice + liquid + veg', hint: 'Lunch leans rice and dal/curry.' },
  { value: 'staple_protein_veg', label: 'Staple + protein + veg', hint: 'A more protein-led lunch.' },
]

export const DINNER_SHAPE_OPTIONS: { value: DinnerShape; label: string; hint: string }[] = [
  { value: 'staple_protein_light_veg', label: 'Protein + light veg', hint: 'Protein-focused dinner with a lighter veg.' },
  { value: 'staple_main_veg', label: 'Staple + main + veg', hint: 'Same structure as lunch.' },
  { value: 'light_one_pot', label: 'Light / one-pot', hint: 'Simpler dinners and occasional one-pot meals.' },
]

export const AVOID_COMBINATION_OPTIONS: { key: AvoidCombinationKey; label: string; hint: string }[] = [
  { key: 'one_carb_only', label: 'One carb only', hint: 'Avoid roti and rice together in one meal.' },
  { key: 'no_dal_with_chole_rajma', label: 'No dal with chole/rajma', hint: 'Avoid double-legume lunches and dinners.' },
  { key: 'no_dal_with_fish', label: 'No dal with fish', hint: 'Prefer fish with a veg side instead of dal.' },
  { key: 'avoid_repeat_main_close', label: 'Avoid repeat mains close together', hint: 'Reduce repeating the same mains on adjacent days.' },
]

const GOAL_BY_REGION_BREAKFAST: Partial<Record<RegionId, BreakfastShape>> = {
  north_india: 'traditional_breakfast',
  south_india: 'traditional_breakfast',
  east_india: 'light_breakfast',
  west_india: 'traditional_breakfast',
}

function deepClonePrefs(prefs: DietChartRulePrefs): DietChartRulePrefs {
  return JSON.parse(JSON.stringify(prefs)) as DietChartRulePrefs
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function householdDietSet(household: Household): DietType[] {
  return [...new Set(household.members.map(member => member.diet_type))]
}

function derivePrimaryRegion(household: Household): RegionId {
  const counts = new Map<RegionId, number>()
  for (const member of household.members) {
    const region = member.home_region ?? 'pan_indian'
    counts.set(region, (counts.get(region) ?? 0) + 1)
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? 'pan_indian'
}

function baseRulePrefs(): DietChartRulePrefs {
  return {
    how_often: {
      chicken_per_week: 2,
      fish_per_week: 1,
      eggs_per_week: 2,
      paneer_per_week: 2,
      one_pot_per_week: 1,
    },
    meal_shape: {
      breakfast_shape: 'quick',
      lunch_shape: 'staple_main_veg',
      dinner_shape: 'staple_protein_light_veg',
      split_protein_strategy: 'only_if_needed',
    },
    avoid_combinations: {
      one_carb_only: true,
      no_dal_with_chole_rajma: true,
      no_dal_with_fish: true,
      avoid_repeat_main_close: true,
    },
  }
}

export function deriveDietChartRuleDefaults(
  household: Household,
  goals: Goals,
): { prefs: DietChartRulePrefs; meta: DietChartRuleDefaultsMeta } {
  const prefs = baseRulePrefs()
  const primaryRegion = derivePrimaryRegion(household)
  const diets = householdDietSet(household)
  const goal = goals.goal_archetype ?? 'balanced'

  if (diets.length === 1 && diets[0] === 'veg') {
    prefs.how_often.chicken_per_week = 0
    prefs.how_often.fish_per_week = 0
    prefs.how_often.eggs_per_week = 0
    prefs.how_often.paneer_per_week += 1
    prefs.how_often.one_pot_per_week += 1
  } else if (!diets.includes('nonveg') && diets.includes('eggitarian')) {
    prefs.how_often.chicken_per_week = 0
    prefs.how_often.fish_per_week = 0
    prefs.how_often.eggs_per_week = Math.max(prefs.how_often.eggs_per_week, 3)
    prefs.how_often.paneer_per_week = Math.max(prefs.how_often.paneer_per_week, 2)
  } else if (diets.includes('nonveg') && diets.includes('eggitarian')) {
    prefs.meal_shape.split_protein_strategy = 'only_if_needed'
  }

  prefs.meal_shape.breakfast_shape = GOAL_BY_REGION_BREAKFAST[primaryRegion] ?? prefs.meal_shape.breakfast_shape

  if (primaryRegion === 'south_india') {
    prefs.meal_shape.breakfast_shape = 'traditional_breakfast'
    prefs.meal_shape.lunch_shape = 'rice_liquid_veg'
    prefs.meal_shape.dinner_shape = 'light_one_pot'
    prefs.how_often.one_pot_per_week += 1
    prefs.how_often.paneer_per_week = Math.max(1, prefs.how_often.paneer_per_week - 1)
  } else if (primaryRegion === 'east_india') {
    prefs.meal_shape.breakfast_shape = 'light_breakfast'
    prefs.meal_shape.lunch_shape = 'rice_liquid_veg'
    if (diets.includes('nonveg')) prefs.how_often.fish_per_week += 1
  } else if (primaryRegion === 'west_india') {
    prefs.meal_shape.breakfast_shape = 'traditional_breakfast'
    prefs.how_often.one_pot_per_week += 1
  } else if (primaryRegion === 'north_india') {
    prefs.meal_shape.breakfast_shape = 'traditional_breakfast'
    prefs.meal_shape.dinner_shape = 'staple_protein_light_veg'
  }

  if (goal === 'high_protein') {
    if (prefs.how_often.chicken_per_week > 0) prefs.how_often.chicken_per_week += 1
    if (prefs.how_often.fish_per_week > 0) prefs.how_often.fish_per_week += 0
    if (prefs.how_often.eggs_per_week > 0) prefs.how_often.eggs_per_week += 1
    prefs.how_often.paneer_per_week += 1
    prefs.meal_shape.breakfast_shape = 'protein_breakfast'
    prefs.meal_shape.dinner_shape = 'staple_protein_light_veg'
    prefs.meal_shape.lunch_shape = 'staple_protein_veg'
  } else if (goal === 'fat_loss') {
    prefs.meal_shape.breakfast_shape = 'light_breakfast'
    prefs.meal_shape.dinner_shape = 'light_one_pot'
  } else if (goal === 'muscle_gain') {
    if (prefs.how_often.chicken_per_week > 0) prefs.how_often.chicken_per_week += 1
    if (prefs.how_often.eggs_per_week > 0) prefs.how_often.eggs_per_week += 1
    prefs.how_often.paneer_per_week += 1
    prefs.meal_shape.breakfast_shape = 'protein_breakfast'
    prefs.meal_shape.lunch_shape = 'staple_protein_veg'
    prefs.meal_shape.dinner_shape = 'staple_protein_light_veg'
  } else if (goal === 'no_rules') {
    prefs.avoid_combinations.no_dal_with_fish = false
    prefs.avoid_combinations.avoid_repeat_main_close = false
  }

  const normalized = normalizeDietChartRulePrefs(prefs, household)
  return {
    prefs: normalized,
    meta: {
      base_default: 'indian_default',
      primary_region: primaryRegion,
      goal_archetype: goal,
      derived_for_diets: diets,
      derived_at: new Date().toISOString(),
    },
  }
}

export function normalizeDietChartRulePrefs(
  prefs: DietChartRulePrefs,
  household: Household,
): DietChartRulePrefs {
  const next = deepClonePrefs(prefs)
  const diets = householdDietSet(household)

  if (!diets.includes('nonveg')) {
    next.how_often.chicken_per_week = 0
    next.how_often.fish_per_week = 0
  }
  if (!diets.includes('eggitarian') && !diets.includes('nonveg')) {
    next.how_often.eggs_per_week = 0
  }

  next.how_often.chicken_per_week = clamp(next.how_often.chicken_per_week, 0, 7)
  next.how_often.fish_per_week = clamp(next.how_often.fish_per_week, 0, 7)
  next.how_often.eggs_per_week = clamp(next.how_often.eggs_per_week, 0, 7)
  next.how_often.paneer_per_week = clamp(next.how_often.paneer_per_week, 0, 7)
  next.how_often.one_pot_per_week = clamp(next.how_often.one_pot_per_week, 0, 7)

  return next
}

function componentRole(dish: Dish) {
  return (dish as AnyDish).component_role
}

function dishType(dish: Dish): DietType {
  return (dish as AnyDish).type ?? (dish as AnyDish).diet_type ?? 'veg'
}

function dishOccasions(dish: Dish): MealSlotId[] {
  const anyDish = dish as AnyDish
  return (anyDish.occasion as MealSlotId[] | undefined)
    ?? (anyDish.meal_preference as MealSlotId[] | undefined)
    ?? []
}

function dishEligibleFor(dish: Dish): DietType[] {
  if (Array.isArray(dish.eligible_for) && dish.eligible_for.length > 0) return dish.eligible_for
  if (Array.isArray(dish.available_to) && dish.available_to.length > 0) return dish.available_to
  const diet = dishType(dish)
  if (diet === 'nonveg') return ['nonveg']
  if (diet === 'eggitarian') return ['eggitarian', 'nonveg']
  return ['veg', 'eggitarian', 'nonveg']
}

function matchesOccasion(dish: Dish, slot: MealSlotId) {
  const occasions = dishOccasions(dish)
  if (occasions.length === 0) return slot !== 'dessert'
  return occasions.includes(slot)
}

function lowerText(dish: Dish) {
  return `${dish.name} ${dish.tags.join(' ')}`.toLowerCase()
}

function proteinFamily(dish: Dish): Exclude<ProteinFamily, 'one_pot'> | null {
  const text = lowerText(dish)
  if (text.includes('chicken')) return 'chicken'
  if (text.includes('fish') || text.includes('macher') || text.includes('meen') || text.includes('pomfret')) return 'fish'
  if (text.includes('egg')) return 'egg'
  if (text.includes('paneer')) return 'paneer'
  return null
}

function isWholeDish(dish: Dish) {
  return dish.meal_form === 'whole' || (componentRole(dish) == null && dishOccasions(dish).includes('breakfast'))
}

function isOnePot(dish: Dish) {
  return resolveFoodClass(dish) === 'one_pot'
}

function isStaple(dish: Dish) {
  return componentRole(dish) === 'staple' || resolveFoodClass(dish) === 'grain_staple'
}

function isLiquidMain(dish: Dish) {
  const foodClass = resolveFoodClass(dish)
  return componentRole(dish) === 'liquid' || foodClass === 'liquid' || foodClass === 'curry'
}

function isDryVegLike(dish: Dish) {
  const role = componentRole(dish)
  const foodClass = resolveFoodClass(dish)
  return role === 'dry' || foodClass === 'dry_semi_dry' || foodClass === 'greens'
}

function isLight(dish: Dish) {
  const text = lowerText(dish)
  const weight = ((dish as AnyDish).weight ?? '').toLowerCase()
  return weight === 'light' || text.includes('light') || text.includes('healthy') || text.includes('green')
}

function isHeavy(dish: Dish) {
  const text = lowerText(dish)
  const weight = ((dish as AnyDish).weight ?? '').toLowerCase()
  return weight === 'heavy' || text.includes('fried') || text.includes('rich') || text.includes('heavy')
}

function isRegionMatch(dish: Dish, region: RegionId) {
  const anyDish = dish as AnyDish
  return anyDish.seeded_from === region || anyDish.cuisine?.some(value => value.includes(region.replace('_india', '').replace('_', '')))
}

function isSharedAcrossHousehold(dish: Dish, household: Household) {
  const eligible = dishEligibleFor(dish)
  return household.members.every(member => eligible.includes(member.diet_type))
}

function scopeForDish(dish: Dish, household: Household): PersonScope {
  if (isSharedAcrossHousehold(dish, household)) return 'shared'
  const eligible = dishEligibleFor(dish)
  if (eligible.includes('nonveg') && !eligible.includes('veg') && !eligible.includes('eggitarian')) return 'nonveg'
  if (eligible.includes('eggitarian') && !eligible.includes('veg')) return 'eggitarian'
  if (eligible.includes('veg') && !eligible.includes('nonveg') && !eligible.includes('eggitarian')) return 'veg'
  return 'shared'
}

function toComponent(dish: Dish, household: Household, personScope?: PersonScope): MealComponent {
  return {
    dish,
    swappable: true,
    person_scope: personScope ?? scopeForDish(dish, household),
  }
}

function mealMacros(components: MealComponent[]): MealOutput['macros'] {
  let calories = 0
  let protein = 0
  let hasData = false
  for (const component of components) {
    if (component.dish.calories_per_serving != null) {
      calories += component.dish.calories_per_serving
      hasData = true
    }
    if (component.dish.protein_g != null) {
      protein += component.dish.protein_g
      hasData = true
    }
  }
  return hasData ? { calories, protein_g: protein } : { calories: null, protein_g: null }
}

function spreadPick<T>(pool: T[], count: number): T[] {
  if (count <= 0 || pool.length === 0) return []
  const picks: T[] = []
  const used = new Set<number>()
  const targetCount = Math.min(count, pool.length)
  for (let i = 0; i < targetCount; i += 1) {
    const target = Math.round(((i + 0.5) * pool.length) / targetCount - 0.5)
    let candidateIndex = clamp(target, 0, pool.length - 1)
    let radius = 0
    while (used.has(candidateIndex) && radius < pool.length) {
      radius += 1
      const left = target - radius
      const right = target + radius
      if (left >= 0 && !used.has(left)) candidateIndex = left
      else if (right < pool.length && !used.has(right)) candidateIndex = right
    }
    used.add(candidateIndex)
    picks.push(pool[candidateIndex])
  }
  return picks
}

function candidateScore(
  dish: Dish,
  ctx: GeneratorContext,
  slot: PlannedSlotId,
  used: Map<string, number>,
  special: SlotSpecial,
): number {
  const count = used.get(dish.id) ?? 0
  const text = lowerText(dish)
  let score = 0

  score += isRegionMatch(dish, ctx.primaryRegion) ? 6 : 0
  score += dish.status === 'active' ? 4 : 0
  score -= dish.status === 'reserve' ? 1 : 0
  score -= count * 5

  if (slot === 'breakfast') {
    if (ctx.prefs.meal_shape.breakfast_shape === 'quick') score += text.includes('quick') || !isHeavy(dish) ? 3 : -2
    if (ctx.prefs.meal_shape.breakfast_shape === 'protein_breakfast') score += dish.protein_g != null && dish.protein_g >= 8 ? 4 : 0
    if (ctx.prefs.meal_shape.breakfast_shape === 'traditional_breakfast') score += isRegionMatch(dish, ctx.primaryRegion) ? 3 : 0
    if (ctx.prefs.meal_shape.breakfast_shape === 'light_breakfast') score += isLight(dish) ? 4 : -2
  }

  if (slot === 'dinner') {
    score += isLight(dish) ? 2 : 0
    score -= isHeavy(dish) ? 3 : 0
  }

  if (special && special !== 'one_pot') {
    score += proteinFamily(dish) === special ? 8 : 0
  }

  if (ctx.goals.goal_archetype === 'high_protein' || ctx.goals.goal_archetype === 'muscle_gain') {
    score += dish.protein_g != null ? dish.protein_g / 8 : 0
    score += text.includes('protein') ? 2 : 0
  }

  if (ctx.goals.goal_archetype === 'fat_loss') {
    score += isLight(dish) ? 2 : 0
    score -= isHeavy(dish) ? 3 : 0
  }

  return score
}

function sortCandidates(
  dishes: Dish[],
  ctx: GeneratorContext,
  slot: PlannedSlotId,
  used: Map<string, number>,
  special: SlotSpecial,
) {
  return [...dishes].sort((a, b) => candidateScore(b, ctx, slot, used, special) - candidateScore(a, ctx, slot, used, special))
}

function chooseBest(
  dishes: Dish[],
  ctx: GeneratorContext,
  slot: PlannedSlotId,
  used: Map<string, number>,
  special: SlotSpecial,
): Dish | undefined {
  return sortCandidates(dishes, ctx, slot, used, special)[0]
}

function breakfastCandidates(ctx: GeneratorContext, special: SlotSpecial) {
  return ctx.dishes.filter(dish => {
    if (!matchesOccasion(dish, 'breakfast')) return false
    if (!isWholeDish(dish) && !special) return false
    if (!isSharedAcrossHousehold(dish, ctx.household)) return false
    if (special && special !== 'one_pot') {
      return proteinFamily(dish) === special
    }
    return true
  })
}

function chooseBreakfastMeal(
  plan: DayPlan,
  ctx: GeneratorContext,
  used: Map<string, number>,
  special: SlotSpecial,
): MealOutput {
  const pool = breakfastCandidates(ctx, special)
  const chosen = chooseBest(pool, ctx, 'breakfast', used, special)
    ?? chooseBest(ctx.dishes.filter(dish => matchesOccasion(dish, 'breakfast') && isSharedAcrossHousehold(dish, ctx.household)), ctx, 'breakfast', used, special)
    ?? chooseBest(ctx.dishes.filter(dish => matchesOccasion(dish, 'breakfast')), ctx, 'breakfast', used, special)

  const components = chosen ? [toComponent(chosen, ctx.household, 'shared')] : []
  if (chosen) used.set(chosen.id, (used.get(chosen.id) ?? 0) + 1)

  return {
    slot: 'breakfast',
    date: plan.date,
    approved: false,
    components,
    macros: mealMacros(components),
  }
}

function sharedMainCandidates(ctx: GeneratorContext, slot: PlannedSlotId, special: SlotSpecial) {
  return ctx.dishes.filter(dish => {
    if (!matchesOccasion(dish, slot)) return false
    if (!isSharedAcrossHousehold(dish, ctx.household)) return false
    if (!isLiquidMain(dish) && !isDryVegLike(dish)) return false
    if (special === 'paneer' && proteinFamily(dish) === 'paneer') return true
    if (special === 'egg' && proteinFamily(dish) === 'egg') return true
    if (special === 'fish' && ctx.prefs.avoid_combinations.no_dal_with_fish && lowerText(dish).includes('dal')) return false
    return true
  })
}

function dryVegCandidates(ctx: GeneratorContext, slot: PlannedSlotId) {
  return ctx.dishes.filter(dish =>
    matchesOccasion(dish, slot)
    && isSharedAcrossHousehold(dish, ctx.household)
    && isDryVegLike(dish),
  )
}

function stapleCandidates(ctx: GeneratorContext, slot: PlannedSlotId) {
  return ctx.dishes.filter(dish =>
    matchesOccasion(dish, slot)
    && isSharedAcrossHousehold(dish, ctx.household)
    && isStaple(dish),
  )
}

function onePotCandidates(ctx: GeneratorContext, slot: PlannedSlotId) {
  return ctx.dishes.filter(dish =>
    matchesOccasion(dish, slot)
    && isOnePot(dish)
    && isSharedAcrossHousehold(dish, ctx.household),
  )
}

function splitProteinCandidates(ctx: GeneratorContext, slot: PlannedSlotId, family: Exclude<ProteinFamily, 'one_pot'>) {
  return ctx.dishes.filter(dish =>
    matchesOccasion(dish, slot)
    && proteinFamily(dish) === family
    && !isSharedAcrossHousehold(dish, ctx.household),
  )
}

function buildMainMeal(
  plan: DayPlan,
  slot: Exclude<PlannedSlotId, 'breakfast'>,
  ctx: GeneratorContext,
  used: Map<string, number>,
  special: SlotSpecial,
): MealOutput {
  const components: MealComponent[] = []

  if (special === 'one_pot') {
    const onePot = chooseBest(onePotCandidates(ctx, slot), ctx, slot, used, special)
    if (onePot) {
      used.set(onePot.id, (used.get(onePot.id) ?? 0) + 1)
      components.push(toComponent(onePot, ctx.household, 'shared'))
      return {
        slot,
        date: plan.date,
        approved: false,
        components,
        macros: mealMacros(components),
      }
    }
  }

  const staple = chooseBest(stapleCandidates(ctx, slot), ctx, slot, used, special)
  if (staple) {
    used.set(staple.id, (used.get(staple.id) ?? 0) + 1)
    components.push(toComponent(staple, ctx.household, 'shared'))
  }

  const sharedMainPool = sharedMainCandidates(ctx, slot, special)
  const sharedMain = chooseBest(sharedMainPool, ctx, slot, used, special)
  if (sharedMain) {
    used.set(sharedMain.id, (used.get(sharedMain.id) ?? 0) + 1)
    components.push(toComponent(sharedMain, ctx.household, 'shared'))
  }

  const addVegByDefault = slot === 'lunch'
    || ctx.prefs.meal_shape.dinner_shape !== 'light_one_pot'
    || components.length < 2

  if (addVegByDefault) {
    const veg = chooseBest(dryVegCandidates(ctx, slot), ctx, slot, used, special)
    if (veg && !components.some(component => component.dish.id === veg.id)) {
      used.set(veg.id, (used.get(veg.id) ?? 0) + 1)
      components.push(toComponent(veg, ctx.household, 'shared'))
    }
  }

  if (special && special !== 'one_pot' && !components.some(component => proteinFamily(component.dish) === special)) {
    const split = chooseBest(splitProteinCandidates(ctx, slot, special), ctx, slot, used, special)
    if (split) {
      used.set(split.id, (used.get(split.id) ?? 0) + 1)
      const scope: PersonScope = special === 'chicken' || special === 'fish' ? 'nonveg' : 'eggitarian'
      components.push(toComponent(split, ctx.household, scope))
    }
  }

  return {
    slot,
    date: plan.date,
    approved: false,
    components,
    macros: mealMacros(components),
  }
}

function preferredKeysForFamily(week: DayPlan[], family: ProteinFamily, region: RegionId): string[] {
  if (family === 'chicken') {
    return [
      ...week.map(day => `${day.date}:dinner`),
      ...week.map(day => `${day.date}:lunch`),
    ]
  }
  if (family === 'fish') {
    return region === 'north_india'
      ? [...week.map(day => `${day.date}:dinner`), ...week.map(day => `${day.date}:lunch`)]
      : [...week.map(day => `${day.date}:lunch`), ...week.map(day => `${day.date}:dinner`)]
  }
  if (family === 'egg') {
    return [
      ...week.map(day => `${day.date}:breakfast`),
      ...week.map(day => `${day.date}:lunch`),
      ...week.map(day => `${day.date}:dinner`),
    ]
  }
  if (family === 'paneer') {
    return [
      ...week.map(day => `${day.date}:lunch`),
      ...week.map(day => `${day.date}:dinner`),
      ...week.map(day => `${day.date}:breakfast`),
    ]
  }
  return [
    ...week.map(day => `${day.date}:lunch`),
    ...week.map(day => `${day.date}:dinner`),
  ]
}

function assignWeeklySpecials(week: DayPlan[], ctx: GeneratorContext): Map<string, SlotSpecial> {
  const assignments = new Map<string, SlotSpecial>()

  const order: Array<{ family: ProteinFamily; count: number }> = [
    { family: 'chicken', count: ctx.prefs.how_often.chicken_per_week },
    { family: 'fish', count: ctx.prefs.how_often.fish_per_week },
    { family: 'egg', count: ctx.prefs.how_often.eggs_per_week },
    { family: 'paneer', count: ctx.prefs.how_often.paneer_per_week },
    { family: 'one_pot', count: ctx.prefs.how_often.one_pot_per_week },
  ]

  for (const item of order) {
    const pool = preferredKeysForFamily(week, item.family, ctx.primaryRegion)
      .filter(key => !assignments.has(key))
    for (const key of spreadPick(pool, item.count)) {
      assignments.set(key, item.family)
    }
  }

  return assignments
}

export function generatePlannedSlotMeal(
  slot: PlannedSlotId,
  date: string,
  ctx: GeneratorContext,
  used = new Map<string, number>(),
  special: SlotSpecial = null,
): MealOutput {
  const day: DayPlan = { date, day: dayOfWeekForDate(date) }
  if (slot === 'breakfast') {
    return chooseBreakfastMeal(day, ctx, used, special)
  }
  return buildMainMeal(day, slot, ctx, used, special)
}

export function generateWeeklyMealPlans(
  referenceIso: string,
  household: Household,
  goals: Goals,
  prefs: DietChartRulePrefs,
  dishes: Dish[],
): MealPlan[] {
  const week = currentWeekDates(referenceIso)
  const primaryRegion = derivePrimaryRegion(household)
  const used = new Map<string, number>()
  const normalizedPrefs = normalizeDietChartRulePrefs(prefs, household)
  const ctx: GeneratorContext = {
    household,
    goals,
    prefs: normalizedPrefs,
    dishes: dishes.filter(dish => dish.status !== 'fixed'),
    primaryRegion,
    usage: used,
  }
  const specials = assignWeeklySpecials(week, ctx)
  const createdAt = new Date().toISOString()
  const plans: MealPlan[] = []

  for (const day of week) {
    for (const slot of PLANNED_MENU_SLOTS) {
      const key = `${day.date}:${slot}`
      const meal = generatePlannedSlotMeal(slot, day.date, ctx, used, specials.get(key) ?? null)
      plans.push({
        date: day.date,
        slot,
        meal,
        created_at: createdAt,
      })
    }
  }

  return plans
}

async function replaceWeekPlans(referenceIso: string, plans: MealPlan[]) {
  const week = currentWeekDates(referenceIso)
  const dates = new Set(week.map(day => day.date))
  const existing = await db.meal_plans.where('date').anyOf([...dates]).toArray()
  const toDelete = existing
    .filter(plan => PLANNED_MENU_SLOTS.includes(plan.slot as PlannedSlotId))
    .map(plan => plan.id)
    .filter((id): id is number => id != null)

  await db.transaction('rw', db.meal_plans, async () => {
    if (toDelete.length > 0) {
      await db.meal_plans.bulkDelete(toDelete)
    }
    await db.meal_plans.bulkAdd(plans)
  })
}

export async function ensureDietChartRulesAndPlans(options?: {
  referenceIso?: string
  forceRegenerate?: boolean
}) {
  const referenceIso = options?.referenceIso ?? todayISO()
  const [householdSetting, goalsSetting, prefsSetting, dishes] = await Promise.all([
    db.settings.get('household'),
    db.settings.get('goals'),
    db.settings.get('diet_chart_rule_prefs'),
    db.dishes.toArray(),
  ])

  const household = householdSetting?.value as Household | undefined
  const goals = goalsSetting?.value as Goals | undefined
  if (!household || !goals || dishes.length === 0) return

  const derived = deriveDietChartRuleDefaults(household, goals)
  const prefs = prefsSetting?.value
    ? normalizeDietChartRulePrefs(prefsSetting.value as DietChartRulePrefs, household)
    : derived.prefs

  if (!prefsSetting?.value) {
    await db.settings.put({ key: 'diet_chart_rule_prefs', value: prefs })
    await db.settings.put({ key: 'diet_chart_rule_defaults_meta', value: derived.meta })
  }

  const week = currentWeekDates(referenceIso)
  const dates = week.map(day => day.date)
  const existingPlans = await db.meal_plans.where('date').anyOf(dates).toArray()
  const plannedCount = existingPlans.filter(plan => PLANNED_MENU_SLOTS.includes(plan.slot as PlannedSlotId)).length
  const expectedCount = week.length * PLANNED_MENU_SLOTS.length

  if (options?.forceRegenerate || plannedCount < expectedCount) {
    const plans = generateWeeklyMealPlans(referenceIso, household, goals, prefs, dishes)
    await replaceWeekPlans(referenceIso, plans)
  }
}

export async function regenerateDietChartMenu(referenceIso = todayISO()) {
  await ensureDietChartRulesAndPlans({ referenceIso, forceRegenerate: true })
}

export async function saveDietChartRulePrefs(prefs: DietChartRulePrefs) {
  const householdSetting = await db.settings.get('household')
  const household = householdSetting?.value as Household | undefined
  if (!household) return
  const normalized = normalizeDietChartRulePrefs(prefs, household)
  await db.settings.put({ key: 'diet_chart_rule_prefs', value: normalized })
}

export async function regenerateSinglePlannedSlot(date: string, slot: PlannedSlotId) {
  const [householdSetting, goalsSetting, prefsSetting, dishes] = await Promise.all([
    db.settings.get('household'),
    db.settings.get('goals'),
    db.settings.get('diet_chart_rule_prefs'),
    db.dishes.toArray(),
  ])
  const household = householdSetting?.value as Household | undefined
  const goals = goalsSetting?.value as Goals | undefined
  const prefs = prefsSetting?.value as DietChartRulePrefs | undefined
  if (!household || !goals || !prefs || dishes.length === 0) return

  const ctx: GeneratorContext = {
    household,
    goals,
    prefs: normalizeDietChartRulePrefs(prefs, household),
    dishes,
    primaryRegion: derivePrimaryRegion(household),
    usage: new Map<string, number>(),
  }
  const meal = generatePlannedSlotMeal(slot, date, ctx)
  await upsertMealPlan(meal)
}
