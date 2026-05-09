# Scheduled Task Run — 2026-05-05

**Task:** Check Linear project for "What's Cookin", retrieve tasks per agent, invoke agents, complete tasks, submit for QA.

---

## Status: BLOCKED — Linear Still Not Reachable (2nd consecutive run)

### Root Cause

The Cowork sandbox network does **not** allow outbound connections to `api.linear.app`. This is enforced at the proxy level — curl, Python urllib, and the web_fetch tool all confirm the same block:

> `Host "api.linear.app" is not on the network allowlist (cowork-egress-blocked)`

The Linear API key is present in `.claude/settings.local.json`:
```
lin_api_REDACTED
```
…but it cannot be used from within Cowork until Linear is added as an installed plugin/connector.

No Linear MCP connector is installed in this Cowork session (`list_connectors` returns empty).

---

## What I Did This Run

Since Linear is unreachable, I did a **full codebase audit** to map what's built vs. what's likely in Linear as open tasks. This way, once Linear is connected, the agent invocation step can proceed immediately.

---

## Codebase Audit — Current State (as of 2026-05-05)

### ✅ Files That Exist

| File | What It Does |
|---|---|
| `src/types/index.ts` | Full TypeScript type system — Dish, Household, MealOutput, DietChart, Goals, Rules, etc. |
| `src/db/schema.ts` | Dexie/IndexedDB schema |
| `src/lib/seed.ts` | DB seeding logic (loads rotation-bank.json, diet-chart.json, etc.) |
| `src/lib/dates.ts` | Date utility helpers |
| `src/lib/auth.ts` | Supabase auth integration |
| `src/lib/supabase.ts` | Supabase client setup |
| `src/engine/recommendation.ts` | Full recommendation engine (filter → score → weighted shuffle → 3 meal sets) |
| `src/App.tsx` | Root app with routing, auth guard, onboarding gate |
| `src/main.tsx` | Vite entry point |
| `src/pages/LoginPage.tsx` | Magic link login page |
| `src/pages/OnboardingPage.tsx` | Multi-step onboarding (headcount → diet type per person → goals → diet chart) |
| `src/pages/DishLibraryPage.tsx` | Dish Library browse/filter page |
| `src/pages/DietChartPage.tsx` | Diet chart view/edit page |
| `src/components/home/HomeScreen.tsx` | Main daily suggestion screen |
| `src/components/home/MealCard.tsx` | Individual meal component card |
| `src/components/home/SwapSheet.tsx` | Bottom sheet for swapping a meal component |
| `src/components/home/HouseholdEditSheet.tsx` | Inline household headcount/diet editor |
| `src/components/home/RecencyChip.tsx` | "Last used N days ago" chip |
| `src/components/dishes/DishEditSheet.tsx` | Add/edit dish sheet |
| `src/components/shared/QuickAddSheet.tsx` | Quick-add dish from home screen |
| `src/components/ui/Badge.tsx` | Badge/pill UI component |
| `src/components/ui/Button.tsx` | Button UI component |
| `src/components/ui/BottomSheet.tsx` | Reusable bottom drawer |
| `src/components/ui/BottomNav.tsx` | Bottom navigation bar |
| `src/index.css` | Global styles |

### ❓ Likely Missing / Not Yet Verified

Based on the product-flow.md and STRATEGY.md, these are expected features that are **not visible as source files**:

| Feature | Why It's Expected |
|---|---|
| `src/hooks/` — custom hooks | useMealState, useHousehold, useDishLibrary etc. probably needed |
| History / meal log screen | product-flow.md describes this as a P2 feature — may be open in Linear |
| Grocery list export | Phase 3 per CLAUDE.md |
| Cook notification (share sheet) | Phase 2 per CLAUDE.md |
| PWA manifest / service worker | `vite-plugin-pwa` in config but no manifest file found in `public/` |
| Supabase row-level security policies | DB schema exists, but auth policies on Supabase side unclear |
| "Not in mood" persistence | Defined in decisions-log.md, UI component unclear |
| "Eating out" day dismissal | Defined in decisions-log.md (D-02), needs home screen button |

---

## What Needs to Happen — Action Required

### Step 1 — Connect Linear in Cowork (YOU must do this)

1. Open **Cowork** → click the **Plugins / Connectors** panel
2. Search for **"Linear"** in the marketplace
3. Install it and authenticate with your API key:
   ```
   lin_api_REDACTED
   ```
4. Once connected, re-run this scheduled task (or just ask me: *"Run the start-coding task"*)

### Step 2 — What Will Happen Automatically Once Linear Is Connected

The next run will:
1. List all open issues in the Linear "What's Cookin" project
2. Read the assignee (agent) for each issue
3. Spawn sub-agents per task and instruct them to complete the work
4. Verify the output (TypeScript compile check, visual review)
5. Mark tasks done and submit for QA

---

## Note on This Scheduled Task

This task has now blocked twice in a row on the same issue. Until the Linear MCP is connected, it cannot proceed beyond the audit stage. The codebase audit above should help you prioritize manually if needed.

