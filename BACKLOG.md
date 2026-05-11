# Backlog

> Repo-local task backlog for What's Cookin.
> Updated: 2026-05-10

## Confirmed

- Full meal scope is in play. Remove stale dinner-only guidance.
- Auth is deferred for now and should not drive current product decisions.
- Linear is not the active task system. Work is tracked here in markdown.
- `food_class` is the final classification model. Canonical table in `STRATEGY.md` and `src/lib/food-classes.ts`.
- `one_pot` is a proper food_class. One-pot dishes also carry `fills_slots[]` so the engine knows which meal slots they satisfy.

## Now

- [ ] Confirm whether implemented onboarding should become the documented source of truth.
- [ ] Reconcile `STRATEGY.md` target model with current `category`-based engine and types.
- [ ] Clean remaining stale "Rotation Bank" wording in lower-priority docs.

## Next

- [ ] **Onboarding: per-household meal tabs** — In the onboarding library-confirm step, each meal tab (Breakfast / Lunch / Dinner / Evening Snacks) should show a dish list filtered and ordered by the household's selected region(s) and diet types. A North India + nonveg household should see dal makhani and chicken curry at the top of Lunch; a South India + veg household should see sambhar, poriyal and rasam. Dishes outside the household's cuisine preferences appear below a visual divider ("Other dishes you might cook") so they are discoverable but not the default. Diet-type mismatches (nonveg dishes for a veg household) should be hidden entirely, not just deprioritised.



- [ ] Decide whether to simplify or temporarily disable auth UI surfaces in the product.
- [ ] Write a single agent-neutral project operating guide to replace fragmented process docs.
- [ ] Audit rules editing UX versus the actual capabilities in `data/rules.json` and Settings.

## Later

- [ ] Plan the `category` -> `food_class` migration if confirmed.
- [ ] Revisit Supabase only when sync or account backup becomes an active product need.

## Done

- [x] Audited major doc/code conflicts for the Codex switch-over.
- [x] Removed stale dinner-only, magic-link-first, and Linear-specific guidance from core docs.
