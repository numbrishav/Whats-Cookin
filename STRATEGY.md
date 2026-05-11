# What's Cookin — Strategic Design Document

> This file is the source of truth for app architecture, recommendation logic, and design decisions.
> Always read this before building any module.

---

## Naming

**"Rotation Bank" is now "Dish Library"** across all code, UI, and docs.

---

## Module Architecture

The app has four core modules:

| Module | Purpose | Who configures |
|---|---|---|
| **Goals** | Nutritional north star (calories, protein, carb rules) | User, once |
| **Rules** | Dietary constraints and frequency caps | User, editable |
| **Diet Chart** | Weekly meal slot templates (constraints per slot) | User, weekly |
| **Dish Library** | Library of actual dishes, classified by food_class | User, grows over time |

---

## Household Model

### Configuration
- **People count:** 2
- **Preferences:** 1 non-veg person (primary user, tracks nutrition) + 1 eggitarian person
- **Diet type options:** `veg` | `eggitarian` | `nonveg` — eggitarian is a first-class type, not a workaround
- **Goals scope:** Per person (the primary user tracks nutrition only)
- **Guests:** Handled by temporarily adding personas to household — no separate guest mode

### Key Principle: Individual Preference, Shared Meal
One person inputs for the whole household, but the app must **serve both preferences simultaneously** in every recommendation.

A meal output is not one dish — it is a **structured set of components**, where:
- **Shared components** (carbs, sabzi, curd, etc.) are recommended once and serve both people
- **Protein components** split by preference — one non-veg protein, one veg protein
- Each component is **independently swappable**

### Scaling Logic
When people count is set:
- Quantity estimates scale per person
- Carb cap (e.g., 3 roti / 1.5 scoop rice) applies per person
- Protein targets apply per person (especially for the goal-tracking user)

---

## Meal Output Structure

Every recommendation is a structured object, not a flat string. Example for dinner:

```
Dinner Recommendation
├── grain:   roti × 2–3          [food_class: grain_staple]   [swappable ✓]
├── liquid:  dal                 [food_class: liquid]          [swappable ✓]
├── dry
│   ├── person_1: pan fried chicken  [food_class: dry_semi_dry, protein_primary: true]  [swappable ✓]
│   └── person_2: paneer bhurji      [food_class: dry_semi_dry, protein_primary: true]  [swappable ✓]
├── greens:  kheera pyaaz salad  [food_class: greens]          [always present]
└── side:    garlic curd         [food_class: side_condiment]  [swappable ✓]
```

Each component carries:
- `item` — the suggested dish
- `food_class` — the class it belongs to (governs swap pool)
- `person_scope` — `shared` | `nonveg` | `eggitarian`
- `swappable: true` — always; the UI must expose a swap button per component

---

## Smart Swap Logic

### The Core Rule
**Only the item the user rejects gets replaced. Nothing else changes.**

If a user taps "swap" on a dry sabzi (palak), the engine:
1. Reads the component's `food_class`: `greens`
2. Looks up all `active` items in that food_class from the Dish Library
3. Excludes the current item (palak) and any recently used items
4. Surfaces the next best match from the same food_class

The rest of the meal (grain, liquid, side) stays untouched.

### Food-Class-Locked Swapping
Swaps are **food-class-locked** — you cannot swap a greens/saag and get a dal. The `food_class` defines what pool of alternatives is available.

### Swap Hierarchy
1. Try `active` items in same food_class first
2. If exhausted, try `reserve` items in same food_class
3. If still exhausted, notify user ("no more options in this class today")

### "Not in Mood" vs Swap
- **Swap** (one-time): replaces the item just for today's suggestion
- **Not in Mood** (session flag): marks item as unavailable for the rest of today; app skips it automatically in future suggestions today

---

## Recommendation Engine Logic

### Step 1 — Hard Filter
Start with the full Dish Library. Apply **hard** filters only (these disqualify items):
- Diet type mismatch (don't show nonveg dishes to veg/eggitarian persons)
- Combination blocks (e.g., no dal with non-veg curry on same day)
- One carb source per meal (roti OR rice, not both)

### Step 1b — Soft Score (not a filter)
Frequency caps (chicken ≤3/week, fish ~1/week, eggs ≤4/week) are **scoring penalties only** — they lower a dish's score but never disqualify it. User can always pick or swap to any dish. (D-01)

### Step 2 — Recency Penalty
Downweight items cooked in the last 7 days. The more recent, the heavier the penalty.

### Step 3 — Weighted Shuffle
Score remaining items → weighted random selection → surface top 3 complete meal sets.

### Step 4 — Output
Return 3 full structured meal sets. User can:
- **Approve** — locks in the meal
- **Shuffle** — get 3 new sets
- **Swap one item** — smart swap just that component (see above)
- **Fallback** — pick from reserved dishes

---

## Diet Chart Slot Structure

Each slot in the diet chart has:
```json
{
  "slot": "dinner",
  "day": "monday",
  "constraints": {
    "protein_type": "veg",           // veg | nonveg | either
    "carb": "roti",                  // roti | rice | none | either
    "carb_cap": "3 roti",
    "sabzi": "green preferred",
    "mandatory": ["protein-first"],
    "notes": "paneer or dal-based"
  }
}
```

---

## Rules Engine

Rules are evaluated at filter time. Types:

| Rule type | Example |
|---|---|
| Frequency cap | Chicken ≤ 3 days/week |
| Combination block | No dal on chole/rajma days at lunch |
| Carb stacking prevention | One carb source per meal only |
| Dinner priority | Protein must appear (paneer/chicken/fish mandatory) |
| Category preference | Green sabzi preferred at dinner |

Rules stored in `data/rules.json`. New rules can be added without code changes.

---

## Dish Library Structure

> **Canonical food class table — single source of truth.**
> Code, UI, docs, and data all derive from this. Do not maintain a separate mapping anywhere else.
> Implemented in `src/lib/food-classes.ts`.

### Food Classes → Display Names

| food_class | Display name | Swap pool examples |
|---|---|---|
| `one_pot` | One-Pot Meals | Khichdi ↔ Pongal ↔ Dal Dhokli |
| `grain_staple` | Staples | Roti ↔ Rice ↔ Paratha |
| `liquid` | Main Gravies & Lentils | Dal ↔ Rajma ↔ Sambhar |
| `curry` | Main Gravies & Lentils | Chicken Curry ↔ Butter Chicken |
| `dry_semi_dry` | Curries & Sabzis | Bhindi ↔ Aloo Jeera ↔ Poriyal |
| `greens` | Leafy Veggies and Salad | Palak ↔ Lal Saag |
| `side_condiment` | Condiments | Curd ↔ Raita ↔ Pickle |
| `snack_finger_food` | Evening Snacks | Tikka ↔ Omelette |
| `dessert` | Dessert | Ice Cream ↔ Dark Chocolate |

**Notes:**
- `liquid` and `curry` share the same display name but are separate food classes — their swap pools never mix. Dal swaps with dal; chicken curry swaps with chicken curry.
- `one_pot` dishes also carry `fills_slots[]` to tell the engine which meal slots they satisfy (e.g. khichdi fills `["grain","liquid"]`). Swap logic for one_pot: find other one_pot dishes whose `fills_slots` is a superset of the current dish's slots.
- Manual adds (QuickAdd, swap sheet) are never blocked by slot conflicts — `fills_slots` only affects auto-generation.

### Schema

Every item in the Dish Library has:
```json
{
  "id": "pan_fried_chicken",
  "name": "Pan Fried Chicken",
  "food_class": "dry_semi_dry",
  "fills_slots": ["dry"],
  "diet_type": "nonveg",
  "status": "active",
  "meal_preference": ["lunch", "dinner"],
  "person_scope": "nonveg",
  "protein_primary": true,
  "weight": "medium",
  "cuisine": ["up_bihari", "punjabi"],
  "tags": [],
  "pairs_with": [],
  "calories_per_serving": null,
  "protein_g": null,
  "carbs_g": null,
  "fat_g": null,
  "last_used": null
}
```

### Paired dishes

Paired dishes (Pav + Bhaji, Bhatura + Chole, Biryani + Salan) are **separate dish entries** in their own food_class. The suggestion engine uses `pairs_with` to co-select them. Swaps stay clean: swapping Bhaji only surfaces other curry-class dishes; the Pav is untouched.

---

## Strategic Principles (Do Not Violate)

1. **Every item in a meal output is swappable.** The UI must show a swap affordance on each component.
2. **Swaps are food-class-locked.** A swap never crosses food_class boundaries. Dal (liquid) swaps with dal. Dry sabzi swaps with dry sabzi. Never crosses classes.
3. **Household-aware from day one.** The 2-person nonveg/eggitarian split is a first-class structural concern. Diet type options: `veg` | `eggitarian` | `nonveg`.
4. **Goals are personal, meals are shared.** Nutrition tracking is per the primary user; meal recommendations serve the whole household.
5. **Boring is the enemy.** Recency penalty + weighted randomness is the core loop. A fixed diet chart alone becomes a schedule.
6. **Rules are data, not code.** All frequency caps and combination rules live in `data/rules.json`. Frequency caps are soft scoring signals — never hard blocks.
7. **Local-first.** IndexedDB (Dexie.js) is the source of truth. Supabase syncs in the background.
8. **The app suggests, not logs.** Recency is tracked on approval only. No "what was actually cooked" flow. No logging fidelity — it's a decision engine, not a diary.
9. **Macro data is display-only in v1.** Approx macros shown as subtext on the home screen. Not used as filters or scoring factors until Phase 3.
10. **No reserved dishes concept.** Active/reserve status within the Dish Library + category-locked swaps is the complete fallback system. No separate curated fallback list.
