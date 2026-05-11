# What's Cookin

## Why

Deciding what to cook across the day is a daily friction point — for couples with household cooks and bachelor flat setups alike. People run out of ideas, get occupied, repeat the same dishes, or just give up and order out. The cook waits. The decision never happens cleanly.

## What

A PWA that makes the "what should we cook today?" decision — automatically, daily, without being boring. Not a recipe app. Not a meal planner in the traditional sense. A lightweight decision engine that knows your household's food habits and picks for you, with just enough randomness to keep it fresh.

## Who

- **Primary:** Indian households with a cook — someone needs to tell the cook what to make by morning
- **Secondary:** Bachelor flats (Bangalore-type) — 2–4 people, shared kitchen, no one wants to decide
- **Distribution:** Friend-to-friend, shared URL — each household manages their own independent setup

## How

Two layers drive every suggestion:

| Layer | What it is | Who sets it |
|---|---|---|
| Diet chart | Weekly template of constraints per meal slot (light/heavy, veg/non-veg, cuisine type) | User, once |
| Dish Library | Personal library of dishes the household actually cooks, tagged richly | User, grows over time |

**Recommendation engine** — not random, not deterministic:
1. Filter the Dish Library by today's diet chart constraints
2. Apply recency penalty — downweight dishes cooked in last 7 days
3. Weighted shuffle — surface top 3 suggestions
4. User approves / shuffles / swaps individual components using category-locked alternatives from the Dish Library

There is no separate fallback list. `active` and `reserve` dish status inside the Dish Library is the fallback system.

## Where

- **App:** PWA — installable on iPhone/Android via "Add to Home Screen", no App Store
- **Hosting:** Vercel (free tier)
- **Database:** IndexedDB via Dexie.js — current source of truth
- **Backend / Sync (revisit later):** Supabase remains available for future auth/sync, but auth is not part of the active product scope right now
- **Offline:** IndexedDB via Dexie.js — works without internet after first load

No Apple Developer account. No $99/year. Share a URL, friend signs up, runs their own household.

## When

**Daily use — under 30 seconds:**
Open app → see today's suggestions → approve or shuffle → done.

**Setup — once:**
Add dishes to the Dish Library → tag them → set weekly diet chart constraints → done.

**Occasional:**
Mark "not in mood" → app skips that dish today, picks next best.

## Strategy

- **Current scope:** full meal planning across the app's active meal slots, household-aware, local-first.
- **No over-engineering:** no ML, no external recipe APIs, no nutritional databases. The Dish Library is user-defined — that's the moat.
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
| Local Data | Dexie.js (IndexedDB) | Lightweight, fast, offline-first |
| Backend / Future Sync | Supabase | Available for future auth/sync when revisited |
| Language | TypeScript | Catches data model errors early |

---

## Working Rules

1. Update [BACKLOG.md](/Users/Numb/Work/Whats%20Cookin/BACKLOG.md) when meaningful work starts, changes scope, or completes.
2. Treat [STRATEGY.md](/Users/Numb/Work/Whats%20Cookin/STRATEGY.md) and [temp/decisions-log.md](/Users/Numb/Work/Whats%20Cookin/temp/decisions-log.md) as the primary product references until superseded by newer explicit decisions.
3. When docs and code disagree, log the conflict before making architectural changes.

---

## Strategic Reference Files

> Always read these before building any feature. They are the source of truth.

| File | Purpose |
|---|---|
| `STRATEGY.md` | Module architecture, meal output structure, smart swap logic, recommendation engine, design principles |
| `temp/decisions-log.md` | All explicit product decisions — what was decided, which module it affects, how the app must behave |
| `temp/product-flow.md` | PM-level user flow for all screens and interactions |
| `temp/codex-switch-audit.md` | Current doc/code conflicts to resolve during the Codex handoff |
| `BACKLOG.md` | Local task backlog and current work queue |
| `data/household.json` | People count (2), diet types (nonveg + eggitarian), meal model |
| `data/goals.json` | Nutritional goals — 1800–2100 kcal/day, ≥100g protein (per person, primary user) |
| `data/rules.json` | Frequency caps (soft scoring only), combination blocks, carb rules, dinner rules |
| `data/diet-chart.json` | Weekly meal slot templates with per-day constraints |
| `data/rotation-bank.json` | Legacy seed data for the Dish Library — categories, active/reserve status, person scope, macros, tags |

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
