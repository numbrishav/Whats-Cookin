# What's Cookin — Product Decisions Log

> Every decision here was made explicitly. Each entry shows: what was decided, why, which module it touches, and exactly how the app must behave as a result.
> This is a living document — update it when a decision changes, don't delete old entries.

---

## Naming Change

**"Rotation Bank" is now "Dish Library"**

Cleaner, more intuitive. Users think of it as their personal library of dishes the household actually cooks — not a "bank." Every reference in code, UI, and docs uses "Dish Library" going forward.

---

## Decision Log

---

### D-01 — Frequency rules are soft targets, not hard blocks

**Question:** If fish day is Monday but I don't have fish, does the app block other suggestions?

**Decision:** No. The user swaps to something else that day. Frequency rules (chicken ≤3/week, fish = 1/week, eggs ≤4/week) are weighted preferences that influence the suggestion engine — they never block or reject a user's choice.

**Why:** Enforcement creates friction. The goal is smart suggestions, not a food prison.

**Module: Rules Engine**
- Frequency caps feed into the scoring/weighting step, not the hard filter step
- A dish that exceeds its weekly frequency gets a heavy penalty score, not a disqualification
- The rules.json field changes from `max_days_per_week` enforced to `max_days_per_week` as a weight signal
- UI never shows "you can't pick this" — it may show "you've had this 3 times this week" as a soft nudge

**Module: Rules Engine → Filter step**
- Rename the filter step to "soft-filter + score" — hard filters only apply to diet type (veg/non-veg) and combination blocks (e.g., no dal with non-veg curry)
- Frequency rules live in the scoring step only

---

### D-02 — "Eating out" days are ignored entirely

**Question:** If I'm eating out, does it count as a day in the recency engine?

**Decision:** Eating out = that day is invisible to the app. No logging, no recency tracking. The suggestion engine behaves as if that day didn't happen.

**Module: Home Screen**
- Add an "Eating out today" option on the home screen (secondary action, not primary CTA)
- Tapping it dismisses the suggestion for the day — shows "Enjoy your meal! 🍽️" state
- No logging, no history entry, no recency update for that day

**Module: Recency Engine**
- Only approved meals update the recency tracker
- Skipped / eating-out days do not affect dish last_used dates

---

### D-03 — The app is a suggestion engine, not a meal logger

**Question:** Should users be able to log what was actually cooked vs what was suggested?

**Decision:** No. Logging fidelity is not the point. The app suggests what to cook, the user approves or swaps. What actually happened in the kitchen is not tracked separately.

**Why:** Adding a logging layer (suggested vs cooked) makes the app heavier and shifts the mental model from "decision tool" to "diary." That's not what this is.

**Module: Recency Engine**
- Recency is tracked on *approval*, not on actual cooking
- Keep it simple: when user taps "Looks good ✓", the dish IDs in that meal get their `last_used` date updated
- No "what did you actually cook" flow anywhere in the app

**Module: Meal History (deprioritized)**
- History page (if built) shows approved suggestions, not a cooking log
- This is a P2 feature — don't build in Phase 1

---

### D-04 — Household headcount visible and editable from home screen

**Question:** How does the user know the suggestion is calibrated for the right number of people?

**Decision:** Show a persistent pill/chip at the top of the home screen: "2 people · 1 NV + 1 V". Tapping it opens an inline edit — change people count or diet breakdown → suggestion regenerates immediately.

**Module: Home Screen**
- Household chip sits below the date header, above the meal suggestion
- Format: "{N} people · {X} NV + {Y} V" (or "· {Z} Egg" if eggitarian present)
- Tapping opens a compact edit sheet (not full settings page) — just headcount and diet type toggles per person
- Editing regenerates the current suggestion in place

**Module: Suggestion Engine**
- Input to the engine includes current household state (people count + diet types)
- Engine generates one protein per diet type present (non-veg protein, veg protein, eggitarian protein)
- Shared components (carb, sabzi, side) scale by total people count

---

### D-05 — Guests handled by temporarily adding personas

**Question:** Guests are coming — how does the app adjust?

**Decision:** No "guest mode." User simply adds temporary people to the household (e.g., 2 extra non-veg guests). The suggestion regenerates. When guests leave, user removes them.

**Why:** A separate guest mode is a second mental model. Adding people is already the model.

**Module: Home Screen / Household Edit**
- The household chip edit sheet has "+ Add person" and individual remove buttons
- Changes are session-level by default — app asks "Keep this for future days too?" when user removes a guest
- If "No" → reverts to saved household config next day

**Module: Suggestion Engine**
- No special guest logic — engine just reads current household state

---

### D-06 — Diet type includes "Eggitarian" as first-class option

**Question:** What if Person 2 eats eggs but is otherwise vegetarian?

**Decision:** "Eggitarian" is a configurable diet type alongside Veg and Non-veg. It's not a workaround — it's a first-class option in household setup and person settings.

**Module: Household Config (household.json)**
- `diet_type` field changes from `"veg" | "nonveg"` to `"veg" | "eggitarian" | "nonveg"`
- Person 2 in current household is `"eggitarian"`

**Module: Dish Library**
- Egg-based dishes (omelettes, boiled eggs, egg curry) get `type: "eggitarian"` tag
- These surface for eggitarian persons but not for veg persons

**Module: Suggestion Engine**
- Eggitarian persons get egg-based proteins as options alongside veg proteins
- The home screen label shows "Egg" in the chip: "2 people · 1 NV + 1 Egg"

---

### D-07 — No "show full bank" mode; diet chart accessible from separate page

**Question:** What if all swap options feel wrong and user wants to browse the full library?

**Decision:** No "show everything" mode. The swap sheet keeps cycling through category-locked alternatives. If truly stuck, user can open the Dish Library page separately to browse. The home screen also has an "Add dish I want today" button that adds to the Dish Library and uses it in today's meal.

**Module: Swap Sheet (Home Screen)**
- Swap sheet cycles through category-locked options indefinitely (wraps around if exhausted)
- No "see all" escape hatch from the swap sheet

**Module: Home Screen**
- Secondary action: "Add dish for today" — opens a quick-add sheet, creates the dish in the Dish Library, and slots it into today's suggestion in the right position
- View current diet chart: accessible via a link/button on home (navigates to Diet Chart page, read-only summary)

**Module: Dish Library Page**
- Standalone page with full browse/edit capability — not connected to the swap flow
- Diet Chart Page: standalone page, full edit capability

---

### D-08 — No learning/pattern recognition in v1

**Question:** Will the app learn that I always swap chicken curry for dry chicken?

**Decision:** No learning in v1. Weighted shuffle + recency penalty is the full engine. Pattern recognition only if a simple technical solution exists — not a v1 priority.

**Module: Recommendation Engine**
- Engine stays as: filter (hard) → score (soft, recency + frequency penalty) → weighted shuffle → top 3
- No user behavior tracking, no preference learning
- Revisit in Phase 3 if adoption justifies it

---

### D-09 — Category-locked swap IS the fallback; no separate "reserved dishes" concept

**Question:** What are "reserved dishes" — a curated fallback list or auto-generated?

**Decision:** Drop the "reserved dishes" concept entirely. The Dish Library with active/reserve status + category-locked swapping is the only fallback mechanism. Dishes marked "reserve" appear in swap sheets but not in auto-generated daily suggestions. That's the complete system.

**Why:** A separate reserved list is a third mental model on top of active/reserve. It creates confusion about where to add things.

**Module: Dish Library**
- Two statuses only: `active` (surfaces in daily suggestions) and `reserve` (available in swap sheets only, never auto-suggested)
- Reserve items shown at the bottom of swap sheets with a subtle label "Reserve"

**Module: STRATEGY.md**
- Remove all references to "reserved dishes" as a separate concept
- Update smart swap logic to reflect active/reserve within category

---

### D-10 — Adding a new dish: name + category (existing or new) + manual details

**Question:** What's the fastest path to add a dish I just cooked that's not in the library?

**Decision:** Quick-add flow available from multiple entry points. Required: name + category (pick from existing or type a new one). Optional but encouraged: diet type, active/reserve, approximate macros.

**Module: Dish Library — Add Flow**
Entry points:
  1. Home screen → "Add dish for today" button
  2. Swap sheet → "Add something else" at the bottom
  3. Dish Library page → "+ Add dish" button

Fields:
  - Name (required, free text)
  - Category (required, dropdown of existing categories + "Create new category" option)
  - Diet type (required, Veg / Eggitarian / Non-veg — toggles)
  - Status (default: Active)
  - Approx macros per serving: Calories, Protein, Carbs, Fat (optional, manual, numeric fields)

When accessed from home screen or swap sheet, the category field is pre-filled from context (the component being swapped).

**Module: Dish Library Data Model**
- Each dish item gains optional macro fields: `calories_per_serving`, `protein_g`, `carbs_g`, `fat_g`
- All nullable — user can add a dish without macros, add macros later

---

### D-11 — Fixing dish details happens in the Dish Library page

**Question:** I saved a dish with wrong diet type — where do I fix it?

**Decision:** Dish Library page is the single place for editing all dish properties. Each dish row is tappable → opens an edit sheet with all fields.

**Module: Dish Library Page**
- Every dish is editable: name, category, diet type, status, macros
- Swipe-left on a dish row: quick actions (Archive → moves to Reserve, Delete)
- No inline editing on home screen or swap sheet — edits go through the Dish Library page

---

### D-12 — Seasonality not in scope

**Decision:** No seasonal tagging, no automatic activate/deactivate by month. If a dish is seasonal, user manually changes its status (active ↔ reserve) in the Dish Library when the season changes.

**Module: Dish Data Model**
- No `seasonal`, `available_months`, or date-range fields on dishes
- Keep the model lean

---

### D-13 — Approximate macros shown as subtext on home screen

**Question:** How does the user know if today's suggestion hits their protein/calorie target?

**Decision:** Show approximate meal-level macro summary as subtext below the meal suggestion on the home screen. Format: "~1,850 kcal · ~108g protein" — calculated by summing macro fields of all dish components in the suggestion.

**Why:** Goals are personal (primary user). Showing the number gives quick confidence without requiring a separate nutrition screen.

**Module: Home Screen**
- Macro summary shown as a single line below the meal components
- Only shown if at least some dishes in the suggestion have macro data filled in
- If data is incomplete: "Add macros to dishes for calorie estimates" as a soft prompt
- Applies to the primary user's goal tracking — not shown per-person

**Module: Recommendation Engine**
- Macro data is display-only in v1 — not used as a filter or scoring factor
- Future: could use it to score suggestions against daily goals

**Module: Dish Data Model**
- Macro fields on each dish item (see D-10) feed this calculation
- Calculation: sum calories/protein across all components in the current meal suggestion

---

### D-14 — Single goal profile, no cut/maintain modes

**Decision:** One set of goals (calories, protein). No mode switching between cut/maintain/bulk. If goals change, user edits the numbers directly in Settings → Goals.

**Module: Goals Module**
- Single profile: `daily_calories` (range), `protein_min_g`
- No mode enum, no profile switching logic

---

### D-15 — Share button generates shareable image; regional language is optional/deferred

**Question:** How does the cook receive today's menu?

**Decision:** A "Share" button on the home screen generates a clean, readable card of today's menu (not a screenshot of the full app UI). The card is shareable via the native share sheet (WhatsApp, Messages, etc.).

Optional enhancement (deferred, not blocking): Hindi/Kannada translation of dish names on the shared card. Bengaluru use case — user can toggle "share in Kannada." Not required for Phase 1.

**Module: Home Screen**
- Share button (secondary action) below the meal components
- Generates a card with: date, meal slot, dish list per person, household label
- Uses native Web Share API → opens WhatsApp, Messages, etc.

**Module: Dish Library Data Model (future)**
- Optional field: `name_regional: { hindi: "", kannada: "" }` — can be filled later to enable translated share cards
- Not required for Phase 1

---

### D-16 — No separate "what was cooked" logging; use the Dish Library add flow

**Question:** The cook made something I didn't plan — how do I log it?

**Decision:** There is no separate "log what was cooked" flow. If the user wants to capture an unplanned dish, they use the standard "Add dish" flow → it gets added to the Dish Library in the right category. That's the only action needed.

**Why:** Matches D-03. The app doesn't distinguish suggested vs cooked. Adding a dish to the library is the capture action. The recency engine only tracks approvals.

**Module: Home Screen / Dish Library**
- No "what did you actually cook" prompt anywhere in the app
- The "Add dish for today" button on home screen is the closest analog — it captures the dish and uses it today

---

### D-17 — Food classes defined by texture/consistency, not by ingredient or protein type

**Question:** How should dishes be classified in the Dish Library? The old system used categories like `curry_nonveg`, `sukhi_sabzi_leafy`, `protein_veg` — splitting dishes by ingredient type and person scope. This creates overlapping categories and breaks swap logic (you can't swap a paneer dish for another paneer dish if they're in different categories).

**Decision:** Every dish belongs to exactly one `food_class`, determined by its texture and physical consistency:

| food_class | What it is |
|---|---|
| `grain_staple` | Dry starchy base — roti, rice, bread, one-pot grains |
| `liquid` | Thin to medium consistency, spoonable — dal, sambhar, kadhi, rajma, chole |
| `curry` | Thick gravy — chicken curry, egg curry, paneer masala |
| `dry_semi_dry` | No gravy or minimal — bhujia, stir-fry, pan-fried proteins, dry sabzis |
| `greens` | Leafy, raw or lightly cooked — saag, salad, sprouts |
| `side_condiment` | Accompaniment, never a main slot — curd, raita, pickle |
| `snack_finger_food` | Standalone, no grain needed — tikka, omelette, boiled eggs |
| `dessert` | Sweet, end-of-meal |

**Why:** Texture-based classification is how Indian cooks think about meal balance. A plate is complete when it has one from each texture class. This makes swap pools naturally clean — a dry sabzi swaps with another dry sabzi, liquid swaps with liquid. Person scope and diet eligibility are handled by separate fields (`diet_type`, `person_scope`, `protein_primary`), not by splitting categories.

**Module: Dish Library**
- Replace `category` field with `food_class` on every dish item
- Add `diet_type: veg | egg | nonveg` (replaces old `type` field; "egg" = contains egg, available to eggitarian and nonveg)
- Add `protein_primary: true | false` — true means this dish counts toward protein goal scoring
- Add `meal_preference: [breakfast | lunch | dinner | snack | dessert]` — array, multiple allowed
- Add `weight: light | medium | heavy` — for balance scoring
- Add `cuisine: north_indian | south_indian | hyderabadi | bengali | gujarati | indo_chinese | continental | pan_indian | other`

**Module: Smart Swap**
- Swap pool = all dishes in same `food_class` (active first, then reserve)
- Filter swap pool by `diet_type` eligibility for the person making the swap

**Module: Diet Chart**
- Slot field names updated: "sabzi" → "dry", "curd_raita" → "side", "side: dal" → "liquid: dal", "main: kadhi" → "liquid: kadhi"

---

### D-18 — One-pot dishes use `fills_slots`; paired dishes use `pairs_with` — these are structurally different

**Question:** How do dishes like Khichdi (rice+dal combined), Biryani (rice+protein combined), and Pav Bhaji (pav + bhaji served together) fit the single-food-class model?

**Decision:** Two separate mechanisms:

**`fills_slots` — for true one-pots only:**
A dish that physically combines ingredients from multiple classes (khichdi = grain+dal cooked together, biryani = grain+protein cooked together) declares which meal slots it fills:
```json
{ "id": "khichdi", "food_class": "grain_staple", "fills_slots": ["grain", "liquid"] }
{ "id": "biryani", "food_class": "grain_staple", "fills_slots": ["grain", "protein"], "pairs_with": ["salan", "boondi_raita"] }
```
When the engine selects a one-pot dish, it marks all listed slots as filled — no additional dish needed for those slots.

**`pairs_with` — for suggestion-layer pairing only:**
Structurally separate dishes that are traditionally eaten together (Pav + Bhaji, Bhatura + Chole, Biryani + Salan) remain as separate Dish Library entries — each with their own `food_class`. `pairs_with` is a suggestion hint that pre-weights those companion dishes. It has no structural effect:
```json
{ "id": "pav",   "food_class": "grain_staple", "pairs_with": ["bhaji"] }
{ "id": "bhaji", "food_class": "curry",        "pairs_with": ["pav"] }
```

**Why:** Keeping paired dishes structurally separate means swaps stay clean. If the user wants to swap the bhaji, the engine surfaces other curry-class dishes — the pav is untouched. If we merged them into one dish, swapping either component would require special-case logic.

**Rule:** `fills_slots` is used only when the dish physically cannot be decomposed (cooked together in the same pot). `pairs_with` is used for traditional pairings that happen to be served together but are cooked separately.

**Module: Dish Library** — `fills_slots` array on every dish (single-element for regular dishes, multi-element for one-pots)
**Module: Suggestion Engine** — when a dish is selected, mark all `fills_slots` entries as satisfied; use `pairs_with` to boost companion dish scores

---

### D-20 — Suggestion engine filters by cuisine overlap before picking

**Question:** With ~150 dishes across 16 cuisine values, a Gujarati household gets Maharashtrian dishes (amti, zunka) suggested alongside their own because both are veg and the same food_class. Nothing in the engine currently prevents this — cuisine is stored on dishes and on the household but never used at suggestion time.

**Decision:** At suggestion time, the engine applies a **cuisine filter** before weighted scoring:

```
eligible = dishes where:
  (dish.cuisine ∩ household.cuisine_preferences) is non-empty
  OR "pan_indian" ∈ dish.cuisine
```

`pan_indian` dishes (rice, curd, salad, generic dal) are always eligible for every household — they're the universal base. Cuisine-specific dishes (amti, zunka, gatte ki sabzi) only surface for households that listed that cuisine in their preferences.

**This is a soft filter, not a hard one for swaps:**
- Auto-suggestion (daily pick): cuisine filter applied — only matching cuisine + pan_indian dishes considered
- Swap sheet: cuisine filter still applied for the top section, but a "Show all" option at the bottom reveals non-matching dishes in the same food_class (user may deliberately want something different)
- Add-dish flow: no cuisine filter — user can add any dish from any cuisine

**Why:** Without this filter, the suggestion engine's "variety" comes partly from presenting culturally foreign dishes — a Gujarati family seeing Bihari chicken curry or a Tamil family getting Rajma. This breaks trust. The cuisine filter ensures the engine stays within the household's food culture unless they explicitly reach out.

**Module: Suggestion Engine**
- Before weighted scoring step, reduce the candidate pool to `eligible` dishes as defined above
- Store cuisine match as a boolean flag on each candidate for potential future scoring boost
- Log cuisine-filter exclusions for debugging (e.g., "amti excluded: no maharashtrian in household preferences")

**Module: Swap Sheet**
- Top section: cuisine-matching options (same food_class + cuisine overlap or pan_indian)
- Bottom section (collapsed): "Other options" — same food_class but non-matching cuisine — user can expand

---

### D-19 — Cuisine is an array of state-level values; `north_indian` and `south_indian` are retired

**Question:** The `cuisine` field on dishes was a single string, and used coarse regional labels like `north_indian` and `south_indian`. These are too broad — a Tamil household and a Karnataka household have almost nothing in common at the dish level. Sambhar belongs to Tamil, Karnataka, Andhra, and Kerala all at once. A household can be Maharashtrian + UP_Bihari (mixed marriage, common reality).

**Decision:**
1. `cuisine` on every dish is now an **array** — a dish can belong to multiple food cultures simultaneously.
2. Values are **state/cultural level only** — no `north_indian`, no `south_indian`. These were regions, not food cultures.
3. `household.cuisine_preferences` stays an array — a household picks one or more cultures.
4. Matching logic: **any overlap = match**. If household is `[up_bihari, hyderabadi]` and a dish has `cuisine: [up_bihari, punjabi]`, it matches because `up_bihari` overlaps.

**Valid cuisine values:**
`punjabi` | `up_bihari` | `rajasthani` | `gujarati` | `maharashtrian` | `bengali` | `odia` | `tamil` | `karnataka` | `kerala` | `andhra` | `hyderabadi` | `coastal` | `indo_chinese` | `continental` | `pan_indian`

**Why:**
- `south_indian` was doing the work of four distinct food cultures (Tamil, Karnataka, Kerala, Andhra). A Tamil household seeing Karnataka dishes felt wrong.
- Indian households are often mixed — Maharashtrian wife + UP husband, Hyderabadi family living in Bangalore with Karnataka food habits. The array model captures this naturally.
- Sambhar is legitimately Tamil, Karnataka, Andhra, and Kerala. A single string forced a wrong choice.
- `pan_indian` exists for dishes that genuinely work everywhere (plain rice, plain curd, generic salad).

**How the engine uses this:**
- Onboarding Step D: "What cuisine(s) do you cook at home?" → multi-select → stored in `household.cuisine_preferences`
- Quick-pick screen: dishes with matching cuisine surfaced first; others available below
- Suggestion scoring: `cuisine_match: true` = soft scoring boost (same weight as recency, not a hard filter)
- Swap sheet: matching-cuisine alternatives shown higher in the list

**What was deleted:** All occurrences of `"north_indian"` and `"south_indian"` as cuisine values in rotation-bank.json and household.json.

---

## Summary Table — Module Impact

| Module | Decisions that touch it |
|---|---|
| Rules Engine | D-01 (soft caps), D-09 (no reserved dishes) |
| Recency Engine | D-02 (eating out ignored), D-03 (approval-only tracking) |
| Suggestion Engine | D-04 (household-aware), D-05 (guests as personas), D-06 (eggitarian), D-08 (no learning), D-13 (macros display-only) |
| Home Screen | D-02 (eating out CTA), D-03 (no logging), D-04 (household chip), D-07 (add dish + diet chart link), D-13 (macro subtext), D-15 (share button), D-16 (no cook log) |
| Swap Sheet | D-01 (soft nudge not block), D-07 (category-locked, no full-bank escape), D-09 (active/reserve tiers), D-10 (add from swap) |
| Dish Library | D-06 (eggitarian type), D-09 (active/reserve = only two statuses), D-10 (quick-add flow + macro fields), D-11 (edit from library page), D-12 (no seasonality), D-15 (regional name field, deferred) |
| Diet Chart | D-07 (separate page, editable) |
| Goals Module | D-13 (single profile), D-14 (no modes) |
| Household Config | D-04 (editable from home), D-05 (add/remove personas), D-06 (eggitarian diet type) |
| Naming | "Rotation Bank" → "Dish Library" everywhere |
| Dish Library | D-17 (food_class taxonomy replaces category), D-18 (fills_slots vs pairs_with), D-19 (cuisine as array, state-level) |
| Smart Swap | D-17 (swap pool = same food_class), D-18 (paired dishes stay structurally separate) |
| Suggestion Engine | D-18 (fills_slots collapses slots, pairs_with boosts companion scores), D-19 (cuisine match = soft scoring boost), D-20 (cuisine filter before scoring) |
| Household Config | D-19 (cuisine_preferences is array, any overlap triggers match) |
| Onboarding | D-19 (Step D asks cuisine preference, filters quick-pick screen) |
