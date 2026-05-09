# Discovery Backlog — Feedback Grooming (First Principles Rewrite)

> Source: User feedback session, 2026-05-08
> Rethought from first principles against STRATEGY.md
> Status: Groups 1 & 3 built and closed. Group 2 cancelled. Group 4 pending.

---

## First Principles Anchors (Do Not Violate)

- App is a **decision engine**, not a nutrition tracker
- Macros are **display-only in v1** — not used in filtering or scoring
- Engine logic: hard filter → recency penalty → soft score weights → weighted shuffle
- Goal archetypes can only influence **soft scoring weights on dish categories** — not caloric math
- Household identity = people count + diet types (not a separate "household type" label)

---

## Group 1 — Onboarding Redesign
> ✅ GROOMED — 2026-05-08

**D-OB-01 — Replace explicit numeric goals with goal archetypes**
- Options: Balanced Eating · High Protein · Fat Loss · Muscle Gain · **No Rules**
- "No Rules" = yolo / no restriction / just enjoy food (no scoring modifiers applied)
- Each archetype translates to **soft scoring weights on dish categories** — not caloric targets:
  - Balanced → default weights, equal category distribution
  - High Protein → upweight `protein_*` and `curry_*` categories
  - Fat Loss → upweight `sukhi_sabzi_*`, downweight heavy carbs
  - Muscle Gain → strongly upweight protein categories, complex carbs OK
  - No Rules → pure recency-based shuffle, no modifiers
- One-line description shown under each option in onboarding UI
- No numbers shown to user — fully implicit
- Individual profile allows overriding later (Phase 2+)

**D-OB-02 — Drop "Household Type" as an onboarding question**
- Family / Friends / Solo adds no functional value to recommendations
- People count + diet type already captures everything the engine needs
- Can be cosmetic profile label if desired, but not an onboarding question

**D-OB-03 — Gender and age: profile only, not onboarding**
- With no caloric math in v1, gender/age only affect the display-only macro subtext
- Not prompted during onboarding — available in individual profile settings
- When provided, refines display macro estimates only

**D-OB-04 — Protein target hidden by default**
- Pre-filled from goal archetype; user can expand "Details" to override
- Removes cold-start confusion ("100g protein? What does that mean?")
- Consistent with minimising cognitive load on setup

---

## Group 2 — Food Library Restructure
> ❌ CANCELLED — 2026-05-09 (no action needed, tickets deleted from Linear)

---

## Group 3 — Today's Suggestion Page

**D-SUG-01 — Remove "Not in Mood / Not Today" feature**
- Shuffle already covers the use case
- Removing reduces decision surface on the home screen
- No replacement needed

**D-SUG-02 — Swap becomes auto-replace, not a picker**
- Current: tap Swap → bottom sheet with list → user picks
- New: tap Swap → engine picks best alternative (#1 ranked from same category) → shows it immediately
- "Pick different" link below → bottom sheet slides up, category-filtered, shows all alternatives + "Add new" at bottom
- Behavior change in swap handler only — engine ranking logic unchanged
- Consistent with category-locked swap rules in STRATEGY.md

**D-SUG-03 — "Pick from library" visible on suggestion page**
- Distinct from "Add new dish" (which creates a new entry)
- "Pick from library" = browse existing dishes, filtered to today's slot + constraints
- Should be accessible but not prominent — secondary affordance

**D-SUG-04 — Add new dish inline from today's page**
- Already exists as "Add dish for today" → quick-add form
- Review UX: 3 fields max (name + meal slot + category)
- Adds to library + uses for today in one action

---

## Group 4 — Prep & Grocery Nudges
> ✅ BUILT — 2026-05-09

**D-PREP-01 — Prep steps: app-seeded + user-editable**
- App ships with built-in prep steps for known dishes: rajma (soak 8h), chole (soak 8h), urad dal (soak 4h), chicken/fish from freezer (thaw ~8h)
- User can also add prep instructions when adding or editing any dish — including their own custom dishes
- UX: "Prep needed?" expandable in add/edit dish form — simple options: Soak overnight · Thaw from freezer · Marinate · Custom note
- `prep_steps` field already exists on `Dish` type — no schema change needed
- App-seeded entries apply automatically; user entries override or extend them

**D-PREP-02 — Inline prep nudge on home screen**
- Shown inline below the current meal slot card, not as a push notification
- Trigger: "one meal before" — when viewing a slot, check if the next active slot has a dish with prep steps
  - Viewing lunch → check dinner; viewing dinner → check tomorrow's first slot
- Copy: "Rajma tomorrow — soak tonight" / "Chicken for dinner — move to fridge now"
- Dismissible; does not repeat once dismissed for that dish + date pair

**D-PREP-03 — Perishables grocery nudge**
- Frequency: Saturday, Sunday, Wednesday
- Content: perishable ingredients from next 2–3 days of suggestions (palak, chicken, fish, eggs, fresh greens)
- App has a built-in perishables map per dish — user never configures this
- Shown as a subtle chip/banner, not prominent
- Dismissible, max one nudge per trigger day
