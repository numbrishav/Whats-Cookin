# What's Cookin — Product Flow (PM Draft)

> Temp file — discard once app is built.
> Written from a product manager's lens. Focus: frictionless lifecycle, not tech.

---

## North Star UX Principle

> Open → See → Done. Every interaction must complete in under 3 taps.

The app should feel like a smart friend who already knows your household and just tells you what to cook. Not a tool you configure. Not a form you fill. A decision you confirm.

---

## The Three Lifecycles

| Lifecycle | Frequency | Target time |
|---|---|---|
| **Daily use** — see and confirm today's menu | Every day | < 30 seconds |
| **Swap/edit** — replace one dish you don't want | Occasional | < 1 minute |
| **Setup/management** — rotation bank, diet chart, household | Rarely | 5–10 min, once |

Design priority follows this order. Daily use must be the most beautiful screen. Setup/management can be dense — users are in "configure mode" mindset there.

---

## Flow 1 — Onboarding (First Launch)

**Goal:** Get user from zero to their first suggestion in under 2 minutes.

### Step 1 — Signup
- Email entry → magic link sent → user clicks link → logged in
- No password, no username, no profile photo. One field.
- Copy: "We'll send you a magic link. No password ever."

### Step 2 — Household Setup (one-time, ~60 seconds)
This is the only "form" in the app. Keep it conversational — one question per screen, big tap targets.

**Screen A — How many people are we cooking for?**
Large number picker: 1 / 2 / 3 / 4+
Subtext: "You can always change this later."

**Screen B — Tell us about each person** (repeat per person)
- Name or label (Me / Partner / Flatmate / etc.)
- Diet: Veg 🌿 or Non-veg 🍗 (two large cards, tap to select)
- Gender (optional): Male / Female / Skip — used only for rough portion calibration, not displayed anywhere else
- Who tracks nutrition? Toggle: "I want to track calories/protein" (only for primary user)

**Screen C — Quick Goals** (only shown to the person who said yes to nutrition tracking)
Pre-filled with sensible defaults. User just confirms or nudges sliders.
- Daily calories: 1800–2100 kcal (range slider)
- Daily protein: 100g minimum (slider)
- Copy: "These are your personal targets. We'll use them to balance your meals."

**Screen D — Diet chart: start with a template or skip?**
Two options:
- "Use my current plan" → lets user quickly enter their weekly slots (simplified input)
- "Skip for now, I'll set it up later" → app uses a balanced default template and tells the user

**Done screen:**
"All set. Here's what's cooking tonight →" — immediately drops user into Day 1 home screen with a suggestion ready.

---

## Flow 2 — Daily Home Screen (THE core screen)

**This is the screen users open every morning or evening. It must be the most polished view.**

### Layout
```
─────────────────────────────────
  What's Cookin today?           ← app name/header, minimal
  Sunday, 4 May                  ← date
─────────────────────────────────
  DINNER TONIGHT                 ← slot label

  [ Person 1 — Non-veg ]
  🍗 Chicken Curry        [swap]
  🫓 2 Roti               [swap]

  [ Person 2 — Veg ]
  🧀 Paneer Bhurji        [swap]

  [ Shared ]
  🥬 Palak                [swap]
  🥛 Curd                 [swap]

─────────────────────────────────
  [ 🔀 Shuffle whole meal ]   [ ✓ Looks good ]
─────────────────────────────────
  LUNCH TODAY (collapsed)     ▾
─────────────────────────────────
```

**Key UX decisions:**
- Each component is its own tappable row with a `[swap]` affordance on the right
- Person labels are subtle (small chip above each section) — not clinical, just clear
- "Shuffle whole meal" regenerates the full suggestion (keeps recency penalty in play)
- "Looks good" = approve and log the meal. This is the primary CTA.
- Lunch slot is collapsed by default if dinner is the primary use case — one tap to expand

### Meal History Chip (bottom of screen)
Small pill below the cards: "Last 3 days: Paneer · Chicken · Fish" — gives context on why today's suggestion is what it is. Reassures the user the engine is thinking.

---

## Flow 3 — Swap a Dish

**Trigger:** User taps `[swap]` next to any component (e.g., Palak)

### Bottom Sheet appears
```
─────────────────────────────────
  Replace: Palak
  From: Leafy Sabzi
─────────────────────────────────
  ● Lal Saag              ← same category, active
  ● Moringa Leaves        ← same category, reserve
─────────────────────────────────
  + Add something else    ← manual entry
─────────────────────────────────
```

**Rules:**
- Only shows items from the same category (category-locked swap — never shows a dal when swapping a sabzi)
- Recently used items shown but greyed out with "had this 2 days ago" subtext — user can still pick them
- If category is exhausted: "That's everything in this category. Add something new?"

### Manual Entry from Swap Sheet
User taps "Add something else" → inline text input appears

```
  Dish name: [ Methi              ]
  Category:  [ Leafy Sabzi   ▾   ]  ← pre-filled from context
  Type:      [ Veg ✓ ] [ Non-veg ]
  [ Save to rotation bank ]  ← checkbox, checked by default
  [ Add to diet chart too ]  ← secondary checkbox, unchecked by default
  [ Use for today ]
```

- "Save to rotation bank" is checked by default → grows the bank organically through daily use, no separate management needed
- "Add to diet chart too" is secondary — only if user wants this to become a recurring constraint
- Tapping "Use for today" swaps the dish and returns to home screen

---

## Flow 4 — Rotation Bank Management

**Access:** Settings → Rotation Bank, or from any swap sheet via "Manage bank"

**This screen is for occasional use — power user territory. Dense is okay here.**

### Layout
Tabbed by category:
```
[ Grains ] [ Proteins ] [ Sabzi ] [ Sides ] [ Snacks ] [ Desserts ]
```

Under each tab, two sections:
- **Active** — shown in daily suggestions
- **Reserve** — available for manual swap but not in auto-rotation

Each item row:
```
Palak                       [●Active]  [Last used: 2 days ago]
Lal Saag                    [●Active]  [Last used: 5 days ago]
Moringa Leaves              [○Reserve] [Never used]
+ Add new dish              ← always at bottom
```

**Add new dish:**
- Name, Category (dropdown), Veg/Non-veg toggle, Active/Reserve toggle
- Optional tags (green, light, heavy, summer, etc.)
- One tap to save

**Swipe actions on each row:**
- Swipe left → Archive (moves to reserve)
- Swipe right → "Used today" (quick log without opening home screen)

---

## Flow 5 — Diet Chart Management

**Access:** Settings → Diet Chart

**This is the weekly template that drives the filter engine. One-time setup, rarely changed.**

### Layout
Horizontal week strip at top (Mon → Sun), tap to select a day.

Below: meal slots for that day (Lunch / Snack / Dinner / Sweet) each as a card.

Each slot card shows:
```
DINNER — Monday
Protein: Paneer (veg mandatory)
Carb: Roti × 1
Sabzi: Green preferred
Notes: Protein-first
[Edit slot]
```

**Edit slot bottom sheet:**
- Meal type: dropdown
- Protein type: Veg / Non-veg / Either / None
- Carb: Roti / Rice / None / Either + quantity
- Sabzi preference: Green preferred / Any / None
- Notes: free text
- Rules triggered: shown as chips (read-only, auto-detected)

**Shortcut:** "Copy Mon–Thu pattern to rest of week" — if user has a repeating structure

---

## Flow 6 — Settings / Household

**Access:** Profile icon or hamburger → Settings

Sections:

**Household**
- People count (editable)
- Per person: name, diet type, gender — all editable inline
- "Add another person" button

**Goals** (only for nutrition-tracking user)
- Calorie range slider
- Protein minimum slider
- Simple, no essay

**Rules**
- List of active rules, each with a toggle
- "Chicken ≤ 3 days/week" → can toggle off if going through a chicken phase
- "Add a custom rule" → text input (stored in rules.json, applied at filter time)

**Notifications** (Phase 2)
- Morning reminder: "What's cooking today?" at 8am
- Cook notification: share today's menu via WhatsApp/share sheet

---

## Key UX Decisions — Do Not Compromise

### 1. Home screen is suggestion-first, not input-first
User opens the app and sees a suggestion immediately. No loading state, no "please set up your plan first" gate. If setup is incomplete, show a best-guess suggestion with a soft banner: "Set up your diet chart to get better suggestions →"

### 2. Swap is a bottom sheet, not a new screen
Navigation depth kills mobile apps. Every swap interaction stays on the home screen via a sheet. No back buttons in the middle of a task.

### 3. Manual add lives inside the swap flow
The rotation bank grows organically as users swap. There is no separate "onboarding your food library" step. You see a suggestion, you want something else, you type it, it gets saved. That's the moment.

### 4. One primary CTA per screen
Home screen: "Looks good ✓" is the only big button.
Swap sheet: "Use for today" is the only big button.
Never two equal CTAs fighting for attention.

### 5. Veg/non-veg split is always visible, never buried
The person labels (Person 1 — Non-veg, Person 2 — Veg) must always appear on the home screen. Users need to see that the app is thinking about both people. This is the trust signal.

### 6. Recency context is always shown
The "Last 3 days" chip on the home screen. This is not optional. Users need to understand WHY they're seeing today's suggestion. Without it, the app feels random.

### 7. Reserve items are available but downweighted, not hidden
In swap sheets, reserve items appear — they're just below active items. Users can always pick them. The engine downweights them; the UI doesn't hide them.

---

## Edge Cases to Design For

| Situation | App behaviour |
|---|---|
| Rotation bank empty (new user) | Show skeleton suggestion with prompt to add dishes |
| All active items in a category recently used | Show with "had this X days ago" note, still tappable |
| Two people want conflicting proteins | Show both, let each person's section be independent |
| User marks "not in mood" for an item | Item skipped for rest of day, shown greyed with ↩ undo option |
| Diet chart slot is "Flexible" | Engine picks from full bank with only recency penalty applied |
| Offline | Show last approved meal or most recent suggestion from IndexedDB |

---

## Screen Inventory

| Screen | Type | Priority |
|---|---|---|
| Home — today's menu | Core | P0 |
| Swap bottom sheet | Overlay | P0 |
| Onboarding — household setup | Flow | P0 |
| Onboarding — magic link | Flow | P0 |
| Rotation bank management | Settings | P1 |
| Diet chart management | Settings | P1 |
| Settings — household, goals, rules | Settings | P1 |
| Meal history / log | Secondary | P2 |
| Cook notification / share sheet | Phase 2 | P2 |
| Partner invite / household sharing | Phase 2 | P3 |

---

## Open Questions (to resolve before build)

1. **Lunch vs Dinner:** Do we build both slots from day 1, or ship dinner-only and add lunch in v1.1? Recommendation: dinner-only first. Prove the loop.
2. **Approval logging:** When user taps "Looks good", do we log it immediately to Supabase or queue it in IndexedDB and sync? Answer: IndexedDB first, sync opportunistically.
3. **Notification timing:** For households with a cook, morning notification is key. But push notifications on PWA are patchy on iOS. Phase 2 decision — use share sheet as workaround for now.
4. **Reserve dishes in auto-rotation:** Should reserve dishes ever surface in the daily suggestion automatically, or only via manual swap? Current thinking: only via swap. Reserve = "I like this but don't want it often."
5. **Gender for portion size:** Do we actually use gender to adjust quantities, or just collect it for future use? Ship without the logic first — collect the data, use it in Phase 3.
