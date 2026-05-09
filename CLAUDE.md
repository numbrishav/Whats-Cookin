# What's Cookin

## Why

Deciding what to cook tonight is a daily friction point — for couples with household cooks and bachelor flat setups alike. People run out of ideas, get occupied, repeat the same dishes, or just give up and order out. The cook waits. The decision never happens cleanly.

## What

A PWA that makes the "what's for dinner" decision — automatically, daily, without being boring. Not a recipe app. Not a meal planner in the traditional sense. A lightweight decision engine that knows your household's food habits and picks for you, with just enough randomness to keep it fresh.

## Who

- **Primary:** Indian households with a cook — someone needs to tell the cook what to make by morning
- **Secondary:** Bachelor flats (Bangalore-type) — 2–4 people, shared kitchen, no one wants to decide
- **Distribution:** Friend-to-friend, shared URL — each household manages their own independent setup

## How

Two layers drive every suggestion:

| Layer | What it is | Who sets it |
|---|---|---|
| Diet chart | Weekly template of constraints per meal slot (light/heavy, veg/non-veg, cuisine type) | User, once |
| Rotation bank | Personal library of dishes the household actually cooks, tagged richly | User, grows over time |

**Recommendation engine** — not random, not deterministic:
1. Filter rotation bank by today's diet chart constraints
2. Apply recency penalty — downweight dishes cooked in last 7 days
3. Weighted shuffle — surface top 3 suggestions
4. User approves / shuffles / overrides with a fallback (reserved dishes)

Reserved dishes are a small set of always-acceptable meals shown when the user is stuck.

## Where

- **App:** PWA — installable on iPhone/Android via "Add to Home Screen", no App Store
- **Hosting:** Vercel (free tier)
- **Auth + Database:** Supabase (free tier) — magic link auth, row-level isolation per household
- **Offline:** IndexedDB via Dexie.js — works without internet after first load

No Apple Developer account. No $99/year. Share a URL, friend signs up, runs their own household.

## When

**Daily use — under 30 seconds:**
Open app → see tonight's suggestion → approve or shuffle → done.

**Setup — once:**
Add dishes to rotation bank → tag them → set weekly diet chart constraints → done.

**Occasional:**
Mark "not in mood" → app skips that dish today, picks next best.

## Strategy

- **Start minimal:** dinner slot only, single user, local-first. Prove the recommendation loop works.
- **No over-engineering:** no ML, no external recipe APIs, no nutritional databases. The rotation bank is user-defined — that's the moat.
- **Boring is the enemy:** the recency penalty + weighted randomness is the core insight. A diet chart alone becomes a fixed schedule. The engine makes it feel alive.
- **Free to run:** zero infra cost at personal scale. Supabase + Vercel free tiers handle this indefinitely for dozens of households.

## Phases

| Phase | Scope |
|---|---|
| 1 — Core loop | Rotation bank, diet chart, daily recommendation, mood override, meal history |
| 2 — Household | Partner access to same household, cook notification via share sheet |
| 3 — Intelligence | Learning from skip/approve patterns, seasonal context, grocery list |

## Stack

| Concern | Choice | Why |
|---|---|---|
| UI | React + Vite + Tailwind | Fast, PWA-ready, free |
| Hosting | Vercel | Free tier, deploys from GitHub |
| Auth + DB | Supabase | Free tier, magic link auth, Postgres |
| Offline | Dexie.js (IndexedDB) | Lightweight, free |
| Language | TypeScript | Catches data model errors early |

---

## Non-Negotiable Working Rules (All Agents)

1. **Close the Linear task on completion — every time.** When you finish work tied to a Linear issue, you MUST move it to the "Done" state in Linear before reporting completion to the user. This applies to every `agent:*` role (pm, product, architect, frontend, backend, qa). No exceptions. If you can't close it (blocked, partial work, follow-up needed), say so explicitly and move it to the appropriate state — never leave a finished ticket in `In Progress` or `In Review`.

   - Linear team: `Whats Cookin` (key `WHA`), team id `6f5f93d6-9d0a-46d3-ae37-4bf1c5c9f403`
   - GraphQL endpoint: `https://api.linear.app/graphql`
   - API key: stored in `.claude/settings.local.json` (LINEAR_API_KEY)
   - Query the "Done" state id at runtime via `team.states(filter:{name:{eq:"Done"}})` — do not hardcode

---

## Strategic Reference Files

> Always read these before building any feature. They are the source of truth.

| File | Purpose |
|---|---|
| `STRATEGY.md` | Module architecture, meal output structure, smart swap logic, recommendation engine, design principles |
| `temp/decisions-log.md` | All explicit product decisions — what was decided, which module it affects, how the app must behave |
| `temp/product-flow.md` | PM-level user flow for all screens and interactions |
| `data/household.json` | People count (2), diet types (nonveg + eggitarian), meal model |
| `data/goals.json` | Nutritional goals — 1800–2100 kcal/day, ≥100g protein (per person, primary user) |
| `data/rules.json` | Frequency caps (soft scoring only), combination blocks, carb rules, dinner rules |
| `data/diet-chart.json` | Weekly meal slot templates with per-day constraints |
| `data/rotation-bank.json` | Dish Library — categories, active/reserve status, person scope, macros, tags |

## Key Design Decisions (Locked)

- **Naming:** "Rotation Bank" is now **"Dish Library"** everywhere — code, UI, docs.
- **Household model:** 2 people — 1 non-veg (primary, tracks nutrition) + 1 eggitarian. Diet type enum: `veg | eggitarian | nonveg`.
- **Meal output is structured, not a flat string.** Every component (protein, carb, sabzi, side) is a separate object with its own `category` and `swappable: true`.
- **Smart swap is category-locked.** Dal swaps with dal. Sabzi swaps with sabzi. Never crosses category boundaries.
- **Protein splits by person.** Non-veg protein for person_1, eggitarian protein (eggs) for person_2. Carbs and sabzi are shared.
- **Rules are data, not code.** Frequency caps are soft scoring penalties — never hard blocks. Combination rules are hard filters.
- **The app is a suggestion engine, not a meal logger.** Recency tracked on approval only. No "what was actually cooked" flow.
- **Macro data is display-only in v1.** Approx macros shown as subtext on home screen, not used in scoring.
- **All product decisions are in `temp/decisions-log.md`.** Read it before building any module.
