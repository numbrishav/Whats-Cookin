# Codex Switch Audit

> Purpose: capture the exact product and implementation conflicts discovered during the switch from Claude-based workflow to Codex.
> Updated: 2026-05-10

---

## Confirmed Direction Already Given

- Full meal scope is in play. We should remove stale "dinner-only" guidance.
- Auth is not part of the active product scope for now and can be revisited later.
- Linear should not be the working source of truth right now.
- The repo should maintain its own markdown backlog.
- `food_class` is the final classification model.
- Important nuance: `one-pot` is not a top-level `food_class`; one-pot dishes stay in a food class such as `grain_staple` and use `fills_slots` to express multi-slot behavior.

---

## Exact Conflicts To Confirm

### 1. Product scope: dinner-first docs vs multi-slot app

**Docs say**
- [CLAUDE.md](/Users/Numb/Work/Whats%20Cookin/CLAUDE.md) said "dinner slot only, single user".
- [temp/product-flow.md](/Users/Numb/Work/Whats%20Cookin/temp/product-flow.md) asked whether lunch should wait until later.

**Code says**
- [src/lib/seed.ts](/Users/Numb/Work/Whats%20Cookin/src/lib/seed.ts) enables `lunch`, `evening_snack`, `dinner`, and `dessert`.
- [src/components/home/HomeScreen.tsx](/Users/Numb/Work/Whats%20Cookin/src/components/home/HomeScreen.tsx) renders multiple active meal slots, plus past/future timeline behavior.

**My current understanding**
- The app is now a broader household meal planner, not a dinner-only MVP.

### 2. Auth flow: magic-link-first docs vs current local-first reality

**Docs say**
- Older docs described email signup and magic-link-first onboarding.

**Code says**
- [src/lib/auth.ts](/Users/Numb/Work/Whats%20Cookin/src/lib/auth.ts) boots anonymous auth first, then offers OTP email upgrade.
- [src/components/auth/SavePromptSheet.tsx](/Users/Numb/Work/Whats%20Cookin/src/components/auth/SavePromptSheet.tsx) treats sign-in as a backup/save prompt, not a first-run gate.
- You confirmed auth is effectively disabled/deferred for now.

**My current understanding**
- Product truth for now should be: local-first app, auth/sync postponed.

### 3. Naming: Dish Library is the product term, but older wording still appears

**Docs say**
- [STRATEGY.md](/Users/Numb/Work/Whats%20Cookin/STRATEGY.md) and [temp/decisions-log.md](/Users/Numb/Work/Whats%20Cookin/temp/decisions-log.md) say "Dish Library".
- Older docs still reference "Rotation Bank".

**Code says**
- UI routes and pages already use "Dish Library" in key places like [src/pages/DishLibraryPage.tsx](/Users/Numb/Work/Whats%20Cookin/src/pages/DishLibraryPage.tsx).
- Seed data file is still named [data/rotation-bank.json](/Users/Numb/Work/Whats%20Cookin/data/rotation-bank.json), which is okay as a legacy filename if we treat it as implementation detail.

**My current understanding**
- User-facing and planning docs should consistently say "Dish Library".

### 4. Fallback model: separate reserved-dishes concept vs active/reserve status inside library

**Docs say**
- Older high-level docs described "reserved dishes" as a separate fallback list.
- [temp/decisions-log.md](/Users/Numb/Work/Whats%20Cookin/temp/decisions-log.md) explicitly dropped that concept.

**Code says**
- Current library model already uses `active` and `reserve` dish status in [src/types/index.ts](/Users/Numb/Work/Whats%20Cookin/src/types/index.ts) and library UI flows.

**My current understanding**
- There should be no separate fallback entity. Reserve status inside the Dish Library is the fallback system.

### 5. Architecture target: `food_class` strategy vs `category` implementation

**Docs say**
- [STRATEGY.md](/Users/Numb/Work/Whats%20Cookin/STRATEGY.md) describes a newer `food_class` model with classes like `grain_staple`, `liquid`, `dry_semi_dry`, and `greens`.
- [data/diet-chart.json](/Users/Numb/Work/Whats%20Cookin/data/diet-chart.json) also talks in terms of food-class slots.

**Code says**
- [src/types/index.ts](/Users/Numb/Work/Whats%20Cookin/src/types/index.ts) still uses `DishCategory` values like `protein_nonveg`, `curry_veg`, `sukhi_sabzi_leafy`.
- [src/engine/recommendation.ts](/Users/Numb/Work/Whats%20Cookin/src/engine/recommendation.ts) is built around those categories.

**My current understanding**
- `food_class` is the confirmed target architecture.
- The live app still runs on the older category model, so migration work is still needed.

### 6. Onboarding shape: PM draft vs implemented onboarding

**Docs say**
- [temp/product-flow.md](/Users/Numb/Work/Whats%20Cookin/temp/product-flow.md) still carries some PM-draft ideas like gender-related future questions and a more idealized flow than the implemented onboarding.

**Code says**
- [src/pages/OnboardingPage.tsx](/Users/Numb/Work/Whats%20Cookin/src/pages/OnboardingPage.tsx) asks for people count, names, diet type, home region, goals, diet-chart choices, and seed-library confirmation.

**My current understanding**
- The code reflects the more current onboarding direction; the PM draft is stale.

### 7. Rules ownership: "user editable" promise vs partial implementation

**Docs say**
- [STRATEGY.md](/Users/Numb/Work/Whats%20Cookin/STRATEGY.md) says rules are data and user-editable.
- [temp/product-flow.md](/Users/Numb/Work/Whats%20Cookin/temp/product-flow.md) imagines toggles and custom-rule entry in Settings.

**Code says**
- [src/pages/SettingsPage.tsx](/Users/Numb/Work/Whats%20Cookin/src/pages/SettingsPage.tsx) exposes some rule toggling behavior, but the full custom-rule authoring story is not clearly complete.

**My current understanding**
- Rules are data-driven today, but end-user rule authoring/editing is only partially realized.

### 8. Backend positioning: Supabase-heavy docs vs Dexie-first implementation

**Docs say**
- Some older docs present Supabase as a central auth + database layer.

**Code says**
- [src/db/schema.ts](/Users/Numb/Work/Whats%20Cookin/src/db/schema.ts) and [src/lib/seed.ts](/Users/Numb/Work/Whats%20Cookin/src/lib/seed.ts) show IndexedDB via Dexie as the actual runtime source of truth.

**My current understanding**
- The app is operationally local-first today; Supabase is secondary and currently dormant.

---

## Help Needed From You

One architectural call is now confirmed:

1. `STRATEGY.md`'s `food_class` model is the architecture we should actively migrate toward.

Still need your call on:

2. Should I treat the implemented onboarding flow as the source of truth and update PM docs around it, or do you want onboarding redesigned again first?
