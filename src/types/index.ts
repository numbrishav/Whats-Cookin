// ─── Diet & Person ────────────────────────────────────────────────────────────

export type DietType = 'veg' | 'eggitarian' | 'nonveg'

export type RegionId = 'north_india' | 'east_india' | 'south_india' | 'west_india' | 'pan_indian' | 'northeast_india'

export interface HouseholdMember {
  id: string
  label: string
  diet_type: DietType
  is_primary: boolean
  tracks_nutrition: boolean
  home_region?: RegionId
}

export interface Household {
  people_count: number
  members: HouseholdMember[]
}

// ─── Meal Slots ───────────────────────────────────────────────────────────────

export type MealSlotId = 'breakfast' | 'lunch' | 'evening_snack' | 'dinner' | 'dessert'

export interface MealSlotConfig {
  id: MealSlotId
  label: string
  active: boolean        // whether this household uses this slot
  order: number
}

// ─── Dish Library ─────────────────────────────────────────────────────────────

export type DishStatus = 'active' | 'reserve' | 'fixed'

export type MealForm = 'whole' | 'component'
export type ComponentRole = 'staple' | 'liquid' | 'dry' | 'side'
export type LiquidSubtype = 'dal' | 'sambar_rasam' | 'curry_nonveg' | 'curry_veg' | 'legume'
export type DrySubtype = 'leafy' | 'root' | 'cruciferous' | 'coconut_based' | 'mixed' | 'protein_dry'
export type DishSubtype = LiquidSubtype | DrySubtype
export type EffortLevel = 'low' | 'medium' | 'high'

export type DishCategory =
  | 'grain'
  | 'protein_nonveg'
  | 'protein_veg'
  | 'protein_eggitarian'
  | 'curry_nonveg'
  | 'curry_veg'
  | 'curry_eggitarian'
  | 'sukhi_sabzi_leafy'
  | 'sukhi_sabzi_light'
  | 'sukhi_sabzi_cruciferous'
  | 'sukhi_sabzi_dry'
  | 'sukhi_sabzi_mixed'
  | 'snack_nonveg'
  | 'snack_eggitarian'
  | 'snack_veg'
  | 'dessert'
  | 'side'
  | 'salad'

export type PersonScope = 'shared' | 'nonveg' | 'veg' | 'eggitarian'

export interface CategoryDef {
  id: DishCategory
  label: string
  role: string
  person_scope: PersonScope
}

export interface PrepStep {
  action: string
  lead_time_hours: number
  trigger: 'before_cook_time' | 'night_before' | 'morning_of'
}

export interface DishIngredient {
  name: string
  qty_per_serving: string
  category: 'protein' | 'produce' | 'dairy' | 'grain' | 'spice' | 'oil' | 'other'
  shelf_life_days?: number
}

export interface Dish {
  id: string
  name: string
  category: DishCategory
  type: DietType
  status: DishStatus
  tags: string[]
  calories_per_serving?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  last_used?: string | null   // ISO date
  pairs_with?: string
  frequency_rule?: string
  available_to?: DietType[]
  seeded_from?: RegionId      // provenance — set at onboarding, never affects engine
  prep_steps?: PrepStep[]     // optional physical prep steps (defrost, soak, etc.)
  ingredients?: DishIngredient[] // optional ingredient list for grocery view
  // ─── Revised habit-based schema fields ───────────────────────────────────────
  meal_form?: MealForm                 // whole = serve directly, component = assemble into meal
  component_role?: ComponentRole       // staple | liquid | dry | side (null for whole dishes)
  subtype?: DishSubtype                // granularity within role for swap logic and scoring
  effort?: EffortLevel                 // low ≤20min | medium 30-45min | high 60min+
  occasion?: MealSlotId[]             // which slots this dish is eligible for
  eligible_for?: DietType[]           // array — egg dishes valid for eggitarian+nonveg both
}

// ─── Meal Output (structured, not flat) ───────────────────────────────────────

export interface MealComponent {
  dish: Dish
  person_scope: PersonScope
  swappable: boolean
  quantity?: string
  note?: string
}

export interface MealOutput {
  slot: MealSlotId
  date: string            // ISO date YYYY-MM-DD
  components: MealComponent[]
  approved: boolean
  macros?: MealMacros
}

export interface MealCandidateSet {
  slot: MealSlotId
  date: string
  candidates: MealOutput[]
  currentIndex: number
}

export interface MealMacros {
  calories: number | null
  protein_g: number | null
}

// ─── Diet Chart ───────────────────────────────────────────────────────────────

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface DietChartMealParty {
  protein?: string
  main?: string
  sabzi?: string
  side?: string
  curd_raita?: string
  salad?: string
  grain?: string
  quantity?: string
  grain_qty?: number
  dish?: string
  accompaniment?: string
  fixed?: string[]
  flexible?: boolean
  note?: string
  [key: string]: unknown
}

export interface DietChartMealTemplate {
  person_1?: DietChartMealParty
  person_2?: DietChartMealParty
  shared?: DietChartMealParty
}

export interface DietChartDayPlan {
  day: DayOfWeek
  meals: Partial<Record<MealSlotId, DietChartMealTemplate | null>>
}

export interface DietChartSlot {
  day: DayOfWeek
  slot: MealSlotId
  constraints: Record<string, unknown>   // flexible — maps to diet-chart.json structure
  is_flexible?: boolean
  is_eat_out?: boolean
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export type GoalArchetype = 'balanced' | 'high_protein' | 'fat_loss' | 'muscle_gain' | 'no_rules'

export interface Goals {
  daily_calories_min: number
  daily_calories_max: number
  protein_min_g: number
  goal_archetype?: GoalArchetype
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export interface FrequencyCap {
  id: string
  item_categories?: DishCategory[]
  item_tags?: string[]
  item_id?: string
  soft_max_days_per_week?: number
  soft_target_days_per_week?: number
  penalty_weight: number
}

export interface CombinationBlock {
  id: string
  trigger_categories?: DishCategory[]
  trigger_items?: string[]
  blocked_items: string[]
  meal_slot: MealSlotId | 'any'
  type: 'hard'
}

// ─── Meal Plans (pre-planned future meals) ────────────────────────────────────

export interface MealPlan {
  id?: number
  date: string        // YYYY-MM-DD
  slot: MealSlotId
  meal: MealOutput    // full planned meal — bypasses engine for that slot
  created_at: string  // ISO timestamp
}

// ─── Recommendation Engine ────────────────────────────────────────────────────

export interface ScoredDish {
  dish: Dish
  score: number
}

export interface RecommendationContext {
  slot: MealSlotId
  date: string
  day: DayOfWeek
  household: Household
  dietChart: DietChartDayPlan[]
  recentlyUsed: Map<string, string>  // dish_id → last_used ISO date
  weeklyUsage: Map<string, number>   // dish_id → times used this week
}
