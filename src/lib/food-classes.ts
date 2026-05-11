// ─── Canonical food class definitions ────────────────────────────────────────
//
// This is the single source of truth for food classification across the app.
// Display names, swap pools, and onboarding groupings all derive from here.
//
// Rules:
//   • Every dish belongs to exactly one FoodClass.
//   • `liquid` and `curry` share the same display name ("Main Gravies & Lentils")
//     but are separate classes so their swap pools stay distinct.
//   • `one_pot` dishes also carry fills_slots[] to tell the engine which
//     meal slots they satisfy (e.g. khichdi fills ["grain","liquid"]).
//   • Swap logic: one_pot swaps with one_pot dishes whose fills_slots is a
//     superset of the current dish's fills_slots. All other classes swap
//     within their own class only.

export type FoodClass =
  | 'one_pot'
  | 'grain_staple'
  | 'liquid'
  | 'curry'
  | 'dry_semi_dry'
  | 'greens'
  | 'side_condiment'
  | 'snack_finger_food'
  | 'dessert'

// Display name shown to users in swap sheets, dish library, and onboarding.
// NOTE: liquid and curry intentionally share the same display name.
export const FOOD_CLASS_DISPLAY: Record<FoodClass, string> = {
  one_pot:           'One-Pot Meals',
  grain_staple:      'Staples',
  liquid:            'Main Gravies & Lentils',
  curry:             'Main Gravies & Lentils',
  dry_semi_dry:      'Curries & Sabzis',
  greens:            'Leafy Veggies and Salad',
  side_condiment:    'Condiments',
  snack_finger_food: 'Evening Snacks',
  dessert:           'Dessert',
}

// Example swaps — used in documentation and onboarding hints.
export const FOOD_CLASS_SWAP_EXAMPLES: Record<FoodClass, string> = {
  one_pot:           'Khichdi ↔ Pongal ↔ Dal Dhokli',
  grain_staple:      'Roti ↔ Rice ↔ Paratha',
  liquid:            'Dal ↔ Rajma ↔ Sambhar',
  curry:             'Chicken Curry ↔ Butter Chicken',
  dry_semi_dry:      'Bhindi ↔ Aloo Jeera ↔ Poriyal',
  greens:            'Palak ↔ Lal Saag',
  side_condiment:    'Curd ↔ Raita ↔ Pickle',
  snack_finger_food: 'Tikka ↔ Omelette',
  dessert:           'Ice Cream ↔ Dark Chocolate',
}

// Maps old seed-file category values (component_role + category fields) to FoodClass.
// Seed files use the old schema — this mapping bridges old → new without touching seed data.
export function foodClassFromSeedFields(params: {
  componentRole?: string
  category?: string
  fillsSlots?: string[]
  tags?: string[]
}): FoodClass {
  const { componentRole = '', category = '', fillsSlots = [], tags = [] } = params

  const isOnePot = fillsSlots.length > 1 || tags.includes('one-pot')
  if (isOnePot)                                              return 'one_pot'
  if (componentRole === 'staple')                            return 'grain_staple'
  if (componentRole === 'liquid' || category.startsWith('curry_')) return 'liquid'
  if (category === 'sukhi_sabzi_leafy' || category === 'salad')    return 'greens'
  if (category === 'side')                                         return 'side_condiment'
  if (category === 'dessert')                                      return 'dessert'
  if (category.startsWith('snack_'))                               return 'snack_finger_food'
  if (componentRole === 'dry')                                     return 'dry_semi_dry'
  return 'dry_semi_dry'
}

// Resolves FoodClass for any dish — checks food_class field first (rotation-bank
// dishes), falls back to seed-field mapping for onboarding seed dishes.
// Accepts any object that has the relevant fields — Dish, seed records, etc.
export function resolveFoodClass(dish: {
  food_class?: string
  category?: string
  fills_slots?: string[]
  tags?: string[]
}): FoodClass {
  if (dish.food_class && dish.food_class in FOOD_CLASS_DISPLAY) {
    return dish.food_class as FoodClass
  }
  // Seed file dishes don't have food_class — derive from component_role + category
  const anyDish = dish as Record<string, unknown>
  return foodClassFromSeedFields({
    componentRole: anyDish.component_role as string | undefined,
    category: dish.category,
    fillsSlots: dish.fills_slots,
    tags: dish.tags,
  })
}
