import type {
  DietChartMealParty,
  DietChartMealTemplate,
  DietType,
  Dish,
  DishCategory,
  HouseholdMember,
  MealComponent,
  MealOutput,
  MealSlotId,
  PersonScope,
  RecommendationContext,
  ScoredDish,
} from '@/types'
import rulesData from '../../data/rules.json'

const SABZI_CATEGORIES: DishCategory[] = [
  'sukhi_sabzi_leafy',
  'sukhi_sabzi_light',
  'sukhi_sabzi_cruciferous',
  'sukhi_sabzi_dry',
  'sukhi_sabzi_mixed',
]

const MAIN_PROTEIN_CATEGORIES: DishCategory[] = [
  'protein_nonveg',
  'protein_eggitarian',
  'protein_veg',
  'curry_nonveg',
  'curry_eggitarian',
  'curry_veg',
]

const PROTEIN_CATEGORIES: Record<DietType, DishCategory[]> = {
  nonveg: ['curry_nonveg', 'protein_nonveg'],
  eggitarian: ['curry_eggitarian', 'protein_eggitarian', 'curry_veg', 'protein_veg'],
  veg: ['curry_veg', 'protein_veg'],
}

const SNACK_CATEGORIES: Record<DietType, DishCategory[]> = {
  nonveg: ['snack_nonveg'],
  eggitarian: ['snack_eggitarian', 'snack_veg'],
  veg: ['snack_veg'],
}

const DISH_REF_ALIASES: Record<string, string> = {
  '1_scoop_ice_cream': 'ice_cream',
  chawal: 'rice',
  sweet_curd: 'curd',
}

function normalizeDishRef(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function labelFromRef(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function isVirtualDish(dish: Dish): boolean {
  return dish.id.startsWith('virtual_')
}

function scopeForMember(member: HouseholdMember): PersonScope {
  if (member.diet_type === 'nonveg') return 'nonveg'
  if (member.diet_type === 'eggitarian') return 'eggitarian'
  return 'veg'
}

function createVirtualDish(reference: string, category: DishCategory): Dish {
  return {
    id: `virtual_${normalizeDishRef(reference)}`,
    name: labelFromRef(reference),
    category,
    type: 'veg',
    status: 'active',
    tags: ['fixed-template'],
  }
}

function resolveDishReference(all: Dish[], reference: string, fallbackCategory: DishCategory): Dish | null {
  const normalized = normalizeDishRef(reference)
  if (!normalized || normalized === 'flexible_from_bank') return null

  const aliased = DISH_REF_ALIASES[normalized] ?? normalized
  const resolved = all.find(dish =>
    dish.id === aliased ||
    normalizeDishRef(dish.id) === aliased ||
    normalizeDishRef(dish.name) === aliased,
  )

  return resolved ?? createVirtualDish(reference, fallbackCategory)
}

function daysBetweenISO(currentISO: string, previousISO: string): number {
  const current = new Date(`${currentISO}T00:00:00`)
  const previous = new Date(`${previousISO}T00:00:00`)
  return Math.floor((current.getTime() - previous.getTime()) / 86400000)
}

function isAllowedForPerson(dish: Dish, personDiet: DietType): boolean {
  if (dish.available_to) return dish.available_to.includes(personDiet)
  if (dish.type === 'veg') return true
  if (dish.type === 'eggitarian') return personDiet === 'eggitarian' || personDiet === 'nonveg'
  if (dish.type === 'nonveg') return personDiet === 'nonveg'
  return false
}

function getCurrentMealCategories(all: Dish[], currentMealIds: string[]): Set<DishCategory> {
  return new Set(
    all
      .filter(dish => currentMealIds.includes(dish.id))
      .map(dish => dish.category),
  )
}

function hasCombinationBlock(
  candidate: Dish,
  currentMealIds: string[],
  all: Dish[],
  slot: MealSlotId,
): boolean {
  const currentCategories = getCurrentMealCategories(all, currentMealIds)
  const blocks = rulesData.combination_blocks as Array<{
    trigger_items?: string[]
    trigger_categories?: DishCategory[]
    blocked_items?: string[]
    meal_slot?: MealSlotId | 'any'
  }>

  for (const block of blocks) {
    if (block.meal_slot && block.meal_slot !== 'any' && block.meal_slot !== slot) continue

    const triggeredByCurrent =
      (block.trigger_items?.some(id => currentMealIds.includes(id)) ?? false) ||
      (block.trigger_categories?.some(category => currentCategories.has(category)) ?? false)

    if (triggeredByCurrent && (block.blocked_items?.includes(candidate.id) ?? false)) {
      return true
    }

    const candidateTriggersBlock =
      (block.trigger_items?.includes(candidate.id) ?? false) ||
      (block.trigger_categories?.includes(candidate.category) ?? false)

    const blockedAlreadyPresent = block.blocked_items?.some(id => currentMealIds.includes(id)) ?? false
    if (candidateTriggersBlock && blockedAlreadyPresent) {
      return true
    }
  }

  return false
}

function recencyPenalty(dish: Dish, ctx: RecommendationContext): number {
  const lastUsed = ctx.recentlyUsed.get(dish.id)
  if (!lastUsed) return 1.0

  const daysAgo = daysBetweenISO(ctx.date, lastUsed)

  if (daysAgo <= 0) return 0.05
  if (daysAgo === 1) return 0.2
  if (daysAgo === 2) return 0.4
  if (daysAgo === 3) return 0.6
  if (daysAgo <= 5) return 0.8
  return 1.0
}

function getUsageForFrequencyCap(
  all: Dish[],
  ctx: RecommendationContext,
  cap: {
    item_id?: string
    item_categories?: DishCategory[]
    item_tags?: string[]
  },
): number {
  if (cap.item_id) return ctx.weeklyUsage.get(cap.item_id) ?? 0

  return all.reduce((total, dish) => {
    const matchesCategory = cap.item_categories?.includes(dish.category) ?? false
    const matchesTag = cap.item_tags?.some(tag => dish.tags.includes(tag)) ?? false
    if (!matchesCategory && !matchesTag) return total
    return total + (ctx.weeklyUsage.get(dish.id) ?? 0)
  }, 0)
}

function frequencyPenalty(dish: Dish, ctx: RecommendationContext, all: Dish[]): number {
  const caps = rulesData.frequency_caps as Array<{
    item_id?: string
    item_categories?: DishCategory[]
    item_tags?: string[]
    soft_max_days_per_week?: number
    soft_target_days_per_week?: number
    penalty_weight: number
  }>

  for (const cap of caps) {
    const matchesId = cap.item_id === dish.id
    const matchesCategory = cap.item_categories?.includes(dish.category) ?? false
    const matchesTag = cap.item_tags?.some(tag => dish.tags.includes(tag)) ?? false
    if (!matchesId && !matchesCategory && !matchesTag) continue

    const usage = getUsageForFrequencyCap(all, ctx, cap)
    if (cap.soft_max_days_per_week && usage >= cap.soft_max_days_per_week) {
      return cap.penalty_weight
    }
    if (cap.soft_target_days_per_week && usage >= cap.soft_target_days_per_week) {
      return cap.penalty_weight
    }
  }

  return 1.0
}

function preferenceBoost(dish: Dish, ctx: RecommendationContext): number {
  if (ctx.slot !== 'dinner') return 1.0
  if (dish.category === 'sukhi_sabzi_leafy' || dish.category === 'sukhi_sabzi_light') return 1.12
  return 1.0
}

function scoreDish(dish: Dish, ctx: RecommendationContext, all: Dish[]): number {
  const recency = recencyPenalty(dish, ctx)
  const frequency = frequencyPenalty(dish, ctx, all)
  const reservePenalty = dish.status === 'reserve' ? 0.3 : 1.0
  const randomness = Math.random() * 0.3 + 0.7
  return randomness * recency * frequency * reservePenalty * preferenceBoost(dish, ctx)
}

function weightedPick<T extends { score: number }>(items: T[]): T | null {
  if (items.length === 0) return null

  const total = items.reduce((sum, item) => sum + item.score, 0)
  let remaining = Math.random() * total

  for (const item of items) {
    remaining -= item.score
    if (remaining <= 0) return item
  }

  return items[items.length - 1]
}

function pickFromCategories(
  all: Dish[],
  categories: DishCategory[],
  personDiet: DietType,
  ctx: RecommendationContext,
  exclude: string[] = [],
  options: { allowReserve?: boolean } = {},
): Dish | null {
  const scoredPool: ScoredDish[] = all
    .filter(dish =>
      categories.includes(dish.category) &&
      isAllowedForPerson(dish, personDiet) &&
      (options.allowReserve || dish.status === 'active') &&
      !exclude.includes(dish.id) &&
      !hasCombinationBlock(dish, exclude, all, ctx.slot),
    )
    .map(dish => ({ dish, score: scoreDish(dish, ctx, all) }))
    .sort((left, right) => right.score - left.score)

  return weightedPick(scoredPool)?.dish ?? null
}

function defaultSwappable(dish: Dish): boolean {
  return dish.category !== 'salad' && !isVirtualDish(dish)
}

function pushComponent(
  components: MealComponent[],
  dish: Dish,
  personScope: PersonScope,
  options: { quantity?: string; swappable?: boolean; note?: string } = {},
): void {
  const duplicate = components.some(component =>
    component.dish.id === dish.id &&
    component.person_scope === personScope &&
    component.quantity === options.quantity,
  )

  if (duplicate) return

  components.push({
    dish,
    person_scope: personScope,
    quantity: options.quantity,
    swappable: options.swappable ?? defaultSwappable(dish),
    note: options.note,
  })
}

function trackRealDishId(usedIds: string[], dish: Dish | null): void {
  if (!dish || isVirtualDish(dish) || usedIds.includes(dish.id)) return
  usedIds.push(dish.id)
}

function getMealTemplate(ctx: RecommendationContext, slot: MealSlotId): DietChartMealTemplate | null {
  const dayPlan = ctx.dietChart.find(plan => plan.day === ctx.day)
  return dayPlan?.meals[slot] ?? null
}

function addGrainComponent(
  components: MealComponent[],
  usedIds: string[],
  all: Dish[],
  reference: string | undefined,
  scope: PersonScope,
  quantity: string | undefined,
): void {
  if (!reference) return
  const grain = resolveDishReference(all, reference, 'grain')
  if (!grain) return
  pushComponent(components, grain, scope, { quantity })
  trackRealDishId(usedIds, grain)
}

function addSabziComponent(
  components: MealComponent[],
  usedIds: string[],
  all: Dish[],
  ctx: RecommendationContext,
  reference: string | undefined,
  scope: PersonScope,
): void {
  if (!reference) return

  const sabzi = reference === 'flexible_from_bank'
    ? pickFromCategories(all, SABZI_CATEGORIES, 'veg', ctx, usedIds)
    : resolveDishReference(all, reference, 'sukhi_sabzi_dry')

  if (!sabzi) return

  pushComponent(components, sabzi, scope)
  trackRealDishId(usedIds, sabzi)
}

function addMainComponent(
  components: MealComponent[],
  usedIds: string[],
  all: Dish[],
  reference: string | undefined,
  scope: PersonScope,
  quantity: string | undefined,
): void {
  if (!reference) return
  const dish = resolveDishReference(all, reference, 'curry_veg')
  if (!dish) return
  pushComponent(components, dish, scope, { quantity })
  trackRealDishId(usedIds, dish)
}

function collectSharedReference(target: Set<string>, reference: string | undefined): void {
  if (!reference) return
  target.add(reference)
}

function hasProteinComponent(components: MealComponent[]): boolean {
  return components.some(component => MAIN_PROTEIN_CATEGORIES.includes(component.dish.category))
}

function hasSabziComponent(components: MealComponent[]): boolean {
  return components.some(component => SABZI_CATEGORIES.includes(component.dish.category))
}

function hasGrainComponent(components: MealComponent[]): boolean {
  return components.some(component => component.dish.category === 'grain')
}

function hasSideComponent(components: MealComponent[]): boolean {
  return components.some(component =>
    component.dish.category === 'side' || component.dish.id === 'dal',
  )
}

function hasSaladComponent(components: MealComponent[]): boolean {
  return components.some(component => component.dish.category === 'salad')
}

function ensureMainMealRequirements(
  components: MealComponent[],
  usedIds: string[],
  all: Dish[],
  ctx: RecommendationContext,
): MealComponent[] {
  if (!hasGrainComponent(components)) {
    const grain = pickFromCategories(all, ['grain'], 'veg', ctx, usedIds)
    if (grain) {
      pushComponent(components, grain, 'shared')
      trackRealDishId(usedIds, grain)
    }
  }

  if (!hasProteinComponent(components)) {
    for (const member of ctx.household.members) {
      const protein = pickFromCategories(all, PROTEIN_CATEGORIES[member.diet_type], member.diet_type, ctx, usedIds)
      if (!protein) continue
      pushComponent(components, protein, scopeForMember(member))
      trackRealDishId(usedIds, protein)
    }
  }

  if (!hasSabziComponent(components)) {
    const sabzi = pickFromCategories(all, SABZI_CATEGORIES, 'veg', ctx, usedIds)
    if (sabzi) {
      pushComponent(components, sabzi, 'shared')
      trackRealDishId(usedIds, sabzi)
    }
  }

  if (!hasSideComponent(components)) {
    const side = pickFromCategories(all, ['side'], 'veg', ctx, usedIds)
    if (side) {
      pushComponent(components, side, 'shared')
      trackRealDishId(usedIds, side)
    }
  }

  if (!hasSaladComponent(components)) {
    const salad = resolveDishReference(all, 'kheera_pyaaz_salad', 'salad')
    if (salad) pushComponent(components, salad, 'shared', { swappable: false })
  }

  return components
}

function buildFallbackMainMeal(all: Dish[], ctx: RecommendationContext): MealComponent[] {
  const components: MealComponent[] = []
  const usedIds: string[] = []

  const grain = pickFromCategories(all, ['grain'], 'veg', ctx, usedIds)
  if (grain) {
    pushComponent(components, grain, 'shared')
    trackRealDishId(usedIds, grain)
  }

  for (const member of ctx.household.members) {
    const protein = pickFromCategories(all, PROTEIN_CATEGORIES[member.diet_type], member.diet_type, ctx, usedIds)
    if (!protein) continue
    pushComponent(components, protein, scopeForMember(member))
    trackRealDishId(usedIds, protein)
  }

  const sabzi = pickFromCategories(all, SABZI_CATEGORIES, 'veg', ctx, usedIds)
  if (sabzi) {
    pushComponent(components, sabzi, 'shared')
    trackRealDishId(usedIds, sabzi)
  }

  const side = pickFromCategories(all, ['side'], 'veg', ctx, usedIds)
  if (side) {
    pushComponent(components, side, 'shared')
    trackRealDishId(usedIds, side)
  }

  const salad = resolveDishReference(all, 'kheera_pyaaz_salad', 'salad')
  if (salad) pushComponent(components, salad, 'shared', { swappable: false })

  return components
}

function quantityLabel(value: number | undefined): string | undefined {
  if (value == null) return undefined
  return `${value}`
}

function buildTemplateMainMeal(
  all: Dish[],
  ctx: RecommendationContext,
  template: DietChartMealTemplate,
): MealComponent[] {
  const components: MealComponent[] = []
  const usedIds: string[] = []
  const sharedSides = new Set<string>()
  const sharedSalads = new Set<string>()

  const shared = template.shared
  if (shared?.flexible) return buildFallbackMainMeal(all, ctx)

  if (shared) {
    addMainComponent(components, usedIds, all, (shared.protein ?? shared.main) as string | undefined, 'shared', shared.quantity as string | undefined)
    addGrainComponent(components, usedIds, all, shared.grain as string | undefined, 'shared', quantityLabel(shared.grain_qty as number | undefined))
    addSabziComponent(components, usedIds, all, ctx, shared.sabzi as string | undefined, 'shared')
    collectSharedReference(sharedSides, shared.side as string | undefined)
    collectSharedReference(sharedSides, shared.curd_raita as string | undefined)
    collectSharedReference(sharedSalads, shared.salad as string | undefined)
  }

  ctx.household.members.slice(0, 2).forEach((member, index) => {
    const party = template[`person_${index + 1}` as 'person_1' | 'person_2']
    if (!party) return

    const scope = scopeForMember(member)
    addMainComponent(components, usedIds, all, (party.protein ?? party.main) as string | undefined, scope, party.quantity as string | undefined)
    addGrainComponent(components, usedIds, all, party.grain as string | undefined, scope, quantityLabel(party.grain_qty as number | undefined))
    addSabziComponent(components, usedIds, all, ctx, party.sabzi as string | undefined, scope)
    collectSharedReference(sharedSides, party.side as string | undefined)
    collectSharedReference(sharedSides, party.curd_raita as string | undefined)
    collectSharedReference(sharedSalads, party.salad as string | undefined)
  })

  sharedSides.forEach(reference => {
    const side = resolveDishReference(all, reference, reference === 'dal' ? 'curry_veg' : 'side')
    if (!side) return
    pushComponent(components, side, 'shared')
    trackRealDishId(usedIds, side)
  })

  sharedSalads.forEach(reference => {
    const salad = resolveDishReference(all, reference, 'salad')
    if (!salad) return
    pushComponent(components, salad, 'shared', { swappable: false })
  })

  return ensureMainMealRequirements(components, usedIds, all, ctx)
}

function buildFallbackSnack(all: Dish[], ctx: RecommendationContext): MealComponent[] {
  const components: MealComponent[] = []
  const usedIds: string[] = []

  for (const member of ctx.household.members) {
    const snack = pickFromCategories(all, SNACK_CATEGORIES[member.diet_type], member.diet_type, ctx, usedIds)
    if (!snack) continue
    pushComponent(components, snack, scopeForMember(member))
    trackRealDishId(usedIds, snack)
  }

  return components
}

function buildTemplateSnack(
  all: Dish[],
  ctx: RecommendationContext,
  template: DietChartMealTemplate,
): MealComponent[] {
  const components: MealComponent[] = []
  const shared = template.shared

  if (shared?.flexible) return buildFallbackSnack(all, ctx)

  for (const reference of shared?.fixed ?? []) {
    const dish = resolveDishReference(all, reference, 'snack_veg')
    if (!dish) continue
    pushComponent(components, dish, 'shared', { swappable: !isVirtualDish(dish) })
  }

  ctx.household.members.slice(0, 2).forEach((member, index) => {
    const party = template[`person_${index + 1}` as 'person_1' | 'person_2'] as DietChartMealParty | undefined
    if (!party) return

    const scope = scopeForMember(member)
    if (party.dish) {
      const dish = resolveDishReference(all, party.dish as string, SNACK_CATEGORIES[member.diet_type][0])
      if (dish) pushComponent(components, dish, scope)
    }
    if (party.accompaniment) {
      const accompaniment = resolveDishReference(all, party.accompaniment as string, 'grain')
      if (accompaniment) pushComponent(components, accompaniment, scope)
    }
  })

  if (components.length === 0) return buildFallbackSnack(all, ctx)
  return components
}

function buildFallbackDessert(all: Dish[], ctx: RecommendationContext): MealComponent[] {
  const dessert = pickFromCategories(all, ['dessert'], 'veg', ctx, [])
  if (!dessert) return []
  return [{ dish: dessert, person_scope: 'shared', swappable: true }]
}

function buildTemplateDessert(
  all: Dish[],
  ctx: RecommendationContext,
  template: DietChartMealTemplate | null,
): MealComponent[] {
  if (!template?.shared || template.shared.flexible) return buildFallbackDessert(all, ctx)

  const fixedDesserts = template.shared.fixed ?? []
  if (fixedDesserts.length === 0) return buildFallbackDessert(all, ctx)

  return fixedDesserts
    .map(reference => resolveDishReference(all, reference, 'dessert'))
    .filter((dish): dish is Dish => dish != null)
    .map(dish => ({
      dish,
      person_scope: 'shared' as const,
      swappable: !isVirtualDish(dish),
    }))
}

function buildMealComponents(
  all: Dish[],
  slot: MealSlotId,
  ctx: RecommendationContext,
): MealComponent[] {
  const template = getMealTemplate(ctx, slot)

  if (slot === 'lunch' || slot === 'dinner') {
    return template ? buildTemplateMainMeal(all, ctx, template) : buildFallbackMainMeal(all, ctx)
  }

  if (slot === 'evening_snack') {
    return template ? buildTemplateSnack(all, ctx, template) : buildFallbackSnack(all, ctx)
  }

  if (slot === 'dessert') {
    return buildTemplateDessert(all, ctx, template)
  }

  return []
}

function computeMacros(components: MealComponent[]): { calories: number | null; protein_g: number | null } {
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

function mealSignature(meal: MealOutput): string {
  return meal.components
    .map(component => `${component.person_scope}:${component.dish.id}:${component.quantity ?? ''}`)
    .sort()
    .join('|')
}

function cloneMeal(meal: MealOutput): MealOutput {
  return {
    ...meal,
    components: meal.components.map(component => ({ ...component })),
    macros: meal.macros ? { ...meal.macros } : undefined,
  }
}

export function generateMeal(
  all: Dish[],
  slot: MealSlotId,
  ctx: RecommendationContext,
): MealOutput {
  const components = buildMealComponents(all, slot, { ...ctx, slot })
  return {
    slot,
    date: ctx.date,
    components,
    approved: false,
    macros: computeMacros(components),
  }
}

export function generateMealSet(
  all: Dish[],
  slot: MealSlotId,
  ctx: RecommendationContext,
  count = 3,
): MealOutput[] {
  const uniqueMeals = new Map<string, MealOutput>()
  const maxAttempts = count * 6

  for (let attempt = 0; attempt < maxAttempts && uniqueMeals.size < count; attempt += 1) {
    const meal = generateMeal(all, slot, ctx)
    uniqueMeals.set(mealSignature(meal), meal)
  }

  const candidates = Array.from(uniqueMeals.values())
  while (candidates.length > 0 && candidates.length < count) {
    candidates.push(cloneMeal(candidates[candidates.length % uniqueMeals.size]))
  }

  return candidates
}

export function getSwapOptions(
  all: Dish[],
  target: Dish,
  currentMealIds: string[],
  ctx: RecommendationContext,
): Dish[] {
  const remainingIds = currentMealIds.filter(id => id !== target.id)

  return all
    .filter(dish =>
      dish.category === target.category &&
      dish.id !== target.id &&
      !remainingIds.includes(dish.id) &&
      !hasCombinationBlock(dish, remainingIds, all, ctx.slot),
    )
    .map(dish => ({ dish, score: scoreDish(dish, ctx, all) }))
    .sort((left, right) => right.score - left.score)
    .map(item => item.dish)
}
