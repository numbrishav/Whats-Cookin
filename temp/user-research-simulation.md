# What's Cookin — Simulated User Research
## 15-Household Lifecycle Study

> Synthetic research simulation. Each household is a composite persona built from realistic Indian household archetypes.
> Purpose: stress-test the current dish library, diet chart structure, and swap logic against real Indian food diversity before building.
> All simulations run against current data files: rotation-bank.json (v4, 62 dishes), diet-chart.json (v7), rules.json.

---

## Methodology

### Recruitment criteria
15 households selected to cover:
- 5 regions (North, South, West, East, Hyderabad/Deccan)
- 4 diet profiles (all-nonveg, nonveg+eggitarian, nonveg+veg, all-veg, strict-veg/Jain)
- 4 household types (couple, family with cook, bachelor flat, solo professional)
- Both with-cook and self-cook setups

### Pre-screen questionnaire (simulated answers per persona)
Each household answered:
1. What do you eat for dinner most weeknights?
2. What grain — roti, rice, or both?
3. How many distinct dishes are "your household's usuals" (not counting variations)?
4. Diet types across household members
5. Do you have a cook? How many days/week?
6. What's your biggest decision pain point around food?

### Simulation protocol
- **Onboarding:** Walk through the 4-step flow (household → goals → diet chart → dish library quick-pick). Note where it breaks.
- **7-day simulation:** Each day, the engine picks from the dish library filtered by diet chart + rules. We trace: what was suggested, whether it had good swaps, whether day 7 still felt fresh.
- **Scoring:** Each dimension rated 1–10 by the simulated user at end of week.

### Scoring rubric
| Dimension | 9–10 | 7–8 | 5–6 | 3–4 | 1–2 |
|---|---|---|---|---|---|
| **Diet chart closeness** | Feels like our household | Mostly right, 1–2 off days | Roughly right but generic | Significant cuisine/constraint gaps | Barely applicable |
| **Swappability** | Every swap has 3+ good options | Most swaps have 2–3 options | Some classes thin, repeats start | Pool frequently exhausted | Swaps almost useless |
| **Sustainability** | Day 7 still fresh, no obvious loops | Minor repetition days 5–7 | Noticeable repeat by day 4–5 | Cycling obviously by day 3 | App breaks within 2 days |

---

## The 15 Households

---

### P01 — Rahul & Priya · Delhi couple · Nonveg + Eggitarian · No cook
**Profile:** 2 working professionals, Delhi NCR. Rahul (nonveg, tracks macros), Priya (eggitarian). Cook every night, order on weekends. The app's primary design target.

**Pre-screen:**
- Dinner: chicken/fish with roti, dal, one sabzi, curd
- Grain: both (roti on weekdays, rice on weekends)
- Usual dishes: ~25 (matches library well)
- Pain point: "We run out of ideas by Wednesday and just make chicken curry again"

**Onboarding:**
- Household setup: smooth — 2 people, nonveg+eggitarian, perfect fit
- Diet chart: current template matches almost exactly — minor adjustment (Priya wants egg at lunch 3x/week)
- Dish quick-pick: ~80% of their usuals already in library. Added "Masoor Dal" and "Aloo Matar" manually
- **Onboarding friction: LOW**

**7-day simulation:**

| Day | Suggested | Swaps needed | Issues |
|---|---|---|---|
| Mon | Pan Fried Chicken + Dal + Bhindi + Curd | None — approved | ✓ |
| Tue | Fish + Dal + Beans Broccoli + Garlic Curd | Swapped Beans Broccoli → Patta Gobhi | Swap pool had 4 options ✓ |
| Wed | Egg Curry + Dal + Carrot Beans Capsicum + Curd | None | ✓ |
| Thu | Chinese Chicken + Butter Garlic Rice | Approved | Pairs_with worked perfectly ✓ |
| Fri | Grilled Chicken + Kadhi + Rice | Approved | ✓ |
| Sat | Pan Fried Chicken + Dal + Bhindi | **Repeat of Monday** — swapped protein | Nonveg curry pool is only 2 active: thin |
| Sun | Bihari Chicken Curry + Roti + Palak | Approved | ✓ |

**Key observation:** By day 6, the nonveg curry pool (chicken_curry, bihari_chicken_curry) is exhausted. Pan_fried_chicken recurred. Engine needs either more nonveg curry options or the recency penalty needs to push toward fish/egg harder.

**Scores:**
- Diet chart closeness: **8/10** — structure is right, minor eggitarian lunch gap
- Swappability: **7/10** — nonveg curry class thin (2 active), dry sabzi good (5 active)
- Sustainability: **7/10** — mild repeat by day 6, still usable

---

### P02 — Sundar family · Chennai · 3 veg + 1 nonveg (father) · Has cook
**Profile:** 4-person family. Mother, 2 children (veg). Father (nonveg). Cook comes 6 days/week. South Indian traditional household.

**Pre-screen:**
- Dinner: rice + sambhar + 1 poriyal/kootu + rasam + curd (5-component plate — different structure entirely)
- Grain: predominantly rice; roti only 2x/week
- Usual dishes: ~35 (most completely absent from library)
- Pain point: "Cook asks what to make every morning. We can never remember what we had last week."

**Onboarding:**
- Household setup: OK for diet types, but "eggitarian" doesn't capture father's nonveg well
- Diet chart: **BREAKS HERE** — the slot structure (1 protein + 1 carb + 1 sabzi + 1 side) doesn't match South Indian plate (rice + sambhar [liquid] + poriyal [dry] + rasam [second liquid] + curd [side] + papad [another side]). South Indian dinner often has 2 liquids.
- Dish quick-pick: of 35 usual dishes, **only 6 appear in library** (rice, dal [as approximation for sambhar], curd, palak, bhindi, chole). All authentic South Indian dishes missing: rasam, kootu, avial, poriyal, thayir sadam, keerai masiyal, etc.
- **Onboarding friction: VERY HIGH**

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Rice + Dal + Broccoli + Curd | "This is not how we eat. Where's sambhar? Where's rasam?" |
| Tue | Rice + Chole + Patta Gobhi + Curd | Chole feels very North Indian for this family |
| Wed | Rice + Kadhi + Bhindi + Curd | Kadhi is North Indian — family would never make this |
| Thu | Roti + Dal + Palak | "Why roti? We barely eat roti for dinner" |
| Fri | Rice + Rajma + Carrot Beans Capsicum | Rajma is alien to this household |
| Sat | Rice + Paneer Bhurji + Lal Saag | Father's nonveg protein completely absent (no fish curry option for him) |
| Sun | *Gave up by day 5* | — |

**Swap attempts:** Tried to swap "Dal" for something more South Indian — swap pool only has kadhi, rajma, chole, sambhar. Sambhar is the only South Indian option and was already used.

**Key observation:** The current library is entirely North Indian. A South Indian family using this app would have a completely different, frustrating experience. The diet chart's 1-liquid-slot model doesn't match the South Indian 2-liquid plate (sambhar + rasam). Father's nonveg is ignored entirely — no fish curry, no chicken chettinad, no prawn masala.

**Scores:**
- Diet chart closeness: **2/10** — wrong meal structure, wrong cuisine set
- Swappability: **2/10** — almost no South Indian dishes in any class
- Sustainability: **1/10** — app becomes unusable by day 4 for this family

---

### P03 — Karthik, Aman, Rishi · Bangalore bachelor flat · Eggitarian + Nonveg + Veg
**Profile:** 3 flatmates, shared kitchen, take turns cooking. Karthik (eggitarian), Aman (nonveg), Rishi (veg). Urban Bangalore, mixed food habits, cook ~4 nights/week.

**Pre-screen:**
- Dinner: rice or roti depending on who cooks; mostly quick dishes
- 3 diet types in one household → complex protein split
- Usual dishes: ~20 shared, ~10 person-specific
- Pain point: "Rishi always ends up eating just dal and sabzi while we get proper protein. Someone needs to plan for him too."

**Onboarding:**
- **3-person household isn't supported well** — the app models 2 people (shared + person_1 + person_2). Third person has no slot.
- Rishi (veg) gets the "shared" protein suggestions, but shared proteins lean toward paneer/soya which he also likes. Workable but imperfect.
- Diet chart: needs customization for 3 different protein requirements. Onboarding screen B only handles 2 people well.
- Dish quick-pick: reasonable — all 3 have overlapping sabzis, Aman adds his nonveg, Karthik adds eggs, Rishi has paneer options

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Roti + Dal + Bhindi + [Aman: Pan Fried Chicken] + [Karthik+Rishi: Paneer Bhurji] | Works but Rishi has no distinct protein |
| Tue | Rice + Chole + Carrot Beans Capsicum | Chole works for all 3 — good shared day |
| Wed | Roti + Dal + Beans Broccoli + [Aman: Fish] + [Karthik: Egg Curry] | Rishi still eating just sabzi + dal |
| Thu | Roti + Dal + Patta Gobhi + [Aman: Chinese Chicken] + [Karthik: Masala Omelette] | Rishi again no protein |
| Fri | Rice + Rajma + Palak | Good veg day — all 3 happy |
| Sat | Roti + Dal + Bhindi | Dal + Bhindi repeat from week start |
| Sun | Roti + Paneer Sabzi + Lal Saag | Paneer as main — Rishi finally gets protein day |

**Key observation:** The 2-person model fails for 3+ people. Rishi goes 4 out of 7 days without a protein-primary dish. The app needs a "shared veg protein" slot that activates when a veg person is in the household, even if the meal also has nonveg proteins.

**Scores:**
- Diet chart closeness: **5/10** — structure roughly works, 3-person gap is real
- Swappability: **6/10** — decent for urban flat food, North Indian bias
- Sustainability: **6/10** — holds for 7 days but Rishi's protein monotony is a problem

---

### P04 — Meena & Vikram · Hyderabad · Both nonveg · Cook 4x/week
**Profile:** 2 people, Hyderabad. Heavy Hyderabadi food culture: biryani on weekends, haleem in winter, mirchi ka salan, double ka meetha. Cook comes 4 days.

**Pre-screen:**
- Dinner: biryani 1–2x/week, chicken curry or kebabs other nights, rice-based
- Grain: rice dominant, roti 2–3x/week
- Usual dishes: ~20 of which 8 are Hyderabadi-specific
- Pain point: "When the cook asks what to make, we always say 'whatever' and it ends up being the same 3 things"

**Onboarding:**
- Household: 2 nonveg — smooth fit
- Diet chart: biryani night (Friday/Saturday) hard to encode — biryani is a one-pot that fills grain+protein, and the current diet chart doesn't have a "biryani night" slot template
- Dish quick-pick: chicken curry, biryani ✓; but missing: haleem, mirchi ka salan, bagara baingan, pathar gosht, keema, Hyderabadi dal (khatti dal)
- **Onboarding friction: MEDIUM** — Hyderabadi dishes mostly absent

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Chicken Curry + Rice + Bhindi + Curd | Works fine |
| Tue | Pan Fried Chicken + Dal + Beans Broccoli | Works |
| Wed | Fish + Dal + Broccoli + Curd | Works |
| Thu | Bihari Chicken Curry + Roti + Palak | "This is Bihar chicken, not ours" — culturally off |
| Fri | **Biryani** suggested (reserve, pairs_with salan+raita) | Pairs_with worked — Salan surfaced ✓ |
| Sat | Chinese Chicken + Butter Garlic Rice | "Chinese food on Saturday? We'd want biryani or kebabs" |
| Sun | Grilled Chicken + Kadhi + Rice | Kadhi is very North Indian for this household |

**Key observation:** The one-pot biryani logic works beautifully (day 5). But missing haleem, mirchi ka salan, and Hyderabadi-specific dishes means the week's variety quickly defaults to generic North Indian. By day 6, the household is frustrated.

**Scores:**
- Diet chart closeness: **6/10** — biryani night works, rest is generic North Indian
- Swappability: **5/10** — nonveg curry class only has 2 active entries; no Hyderabadi-specific swaps
- Sustainability: **6/10** — holds for a week but culturally feels wrong by day 4

---

### P05 — Shah family · Ahmedabad · Strict veg (no onion/garlic 2 days/week) · No cook
**Profile:** 4 people, Gujarati household. All veg. 2 days/week Jain-style (no onion, no garlic). Heavy farsan (snacks), dal-rotli, kadhi-khichdi, undhiyu culture.

**Pre-screen:**
- Dinner: dal + 2 rotli (thin roti) + shaak (vegetable) + curd + chaas
- Grain: rotli (thinner than North Indian roti) — almost no rice at dinner
- Usual dishes: ~30 all veg, 20 Gujarat-specific
- Pain point: "I can never get a variety going. The app should know not to give me onion-garlic dishes on Tuesday and Friday."

**Onboarding:**
- Household: 4 veg — OK, but no "Jain mode" toggle for specific days
- Diet chart: no mechanism to mark 2 days as "no onion/garlic" constraint. This is a hard gap.
- Dish quick-pick: of 30 usual dishes, **only ~8 overlap with library** (dal, curd, chole, bhindi, broccoli, palak, rice, roti). All Gujarat-specific missing: undhiyu, sev tameta, ringan no olo, dal dhokli, handvo, kadhi (exists but not Gujarati-style), vaghareli dal
- **Onboarding friction: VERY HIGH** — Jain constraint + Gujarati cuisine both unsupported

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Roti + Dal + Bhindi + Curd | Acceptable but plain |
| Tue (Jain day) | Roti + Dal + Broccoli | App has no awareness this is a Jain day |
| Wed | Roti + Chole + Patta Gobhi | Chole is fine but not Gujarati |
| Thu | Roti + Kadhi + Beans Broccoli | Kadhi works (Gujarati kadhi ≈ what's in library) |
| Fri (Jain day) | Roti + Dal + Bhindi | Same as Monday — recency not preventing repeat |
| Sat | Roti + Rajma + Palak | "We've never made Rajma in our lives" |
| Sun | Paratha + Dal + Gobhi Aloo | Paratha is too heavy for Gujarati dinner |

**Swaps tried:** Tried to swap "Rajma" (liquid) for something more appropriate — pool has dal, sambhar, kadhi, chole, salan. None are authentically Gujarati.

**Key observation:** Two compounding failures: (1) the Jain constraint (no onion/garlic on certain days) is completely invisible to the app, and (2) the Gujarati cuisine set is entirely absent. Families like this cannot use the app at all without first manually adding 20+ dishes and there's no way to encode the day-specific constraints.

**Scores:**
- Diet chart closeness: **2/10** — Jain days ignored, cuisine entirely wrong
- Swappability: **2/10** — veg liquid/curry pool has no Gujarati options
- Sustainability: **2/10** — repeats by day 4, Rajma and Paratha feel completely foreign

---

### P06 — Didi & Boudi · Kolkata · Both nonveg (fish dominant) · Cook 5x/week
**Profile:** Bengali couple, retired. Cook every day. Fish 5x/week. Mustard-heavy cooking. Very specific preparation preferences: shorshe, doi maach, kosha mangsho.

**Pre-screen:**
- Dinner: rice + dal (musur/moong) + fish curry + one vegetable dish + curd
- Grain: rice almost exclusively at dinner
- Usual dishes: ~25, 18 Bengali-specific
- Pain point: "The cook knows what we like but when she's on leave, we're completely lost"

**Onboarding:**
- Household: 2 nonveg — smooth
- Diet chart: rice-dominant dinner works, but fish 5x/week target can't be set (frequency rules only go to ~1/week in current rules.json)
- Dish quick-pick: "Fish" is in library but no shorshe ilish, doi maach, chingri malai curry, machher jhol — just generic "Fish". No kosha mangsho, no cholar dal, no shukto, no aloo posto.
- **Onboarding friction: HIGH** — must manually add ~15 Bengali dishes

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Rice + Dal + Fish + Palak + Curd | Works, but "Fish" is generic — which fish? Which preparation? |
| Tue | Rice + Dal + Chicken Curry | "We don't make chicken curry Tue — it's a fish day" |
| Wed | Rice + Dal + Pan Fried Chicken | Chicken again — recency not penalizing enough |
| Thu | Rice + Chole + Broccoli | "Chole with rice? We don't eat this." |
| Fri | Rice + Dal + Fish | Fish repeated (Mon and Fri) — frequency rule should push higher |
| Sat | Rice + Dal + Grilled Chicken | Grilled chicken feels continental for this household |
| Sun | Rice + Rajma | "Rajma? This is a Punjabi dish." |

**Key observation:** The `fish_weekly_target` rule aims for ~1/week but this family needs 4–5x/week. The current rules.json can't encode a "fish-dominant" household pattern. Bengali cuisine is also entirely absent — no mustard-based, no specific fish varieties, no Bengali vegetables (potol, begun, kochur shak).

**Scores:**
- Diet chart closeness: **3/10** — rice+dal structure right, but fish frequency and Bengali dishes completely wrong
- Swappability: **2/10** — no Bengali alternatives in any class; nonveg curry pool (2 entries) exhausted by day 3
- Sustainability: **3/10** — defaults to generic North Indian by day 3

---

### P07 — Ananya · Bangalore solo professional · Nonveg · Gym-focused · No cook
**Profile:** 26F, data scientist. Lives alone. Cooks her own meals. Tracks macros obsessively. Wants high protein, low carb variations. Goes to gym 5x/week.

**Pre-screen:**
- Dinner: grilled/pan-fried protein + 1 sabzi + salad, minimal grain
- Grain: 1–2 roti or skips grain entirely on gym days
- Usual dishes: ~15 (simple, high protein)
- Pain point: "I want to know if my dinner hits 40g protein before I start cooking. I don't want to figure this out myself."

**Onboarding:**
- Household: 1 person, nonveg — smooth
- Goals: calorie range 1600–1800, protein ≥130g — app defaults to 1800–2100/100g which she adjusts. Range slider works.
- Diet chart: single-person diet chart isn't a standard template — has to build from scratch. No "high-protein low-carb" template.
- Dish quick-pick: her library is small (~15 dishes) — pan fried chicken, grilled chicken, fish, eggs, paneer, most sabzis, salad, curd. Good overlap with library.
- **Onboarding friction: LOW** — small library, protein-focused, matches well

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Roti (×2) + Pan Fried Chicken + Bhindi + Curd | "2 roti is 300 carbs, I want 1 or zero" — carb cap can't go to 0 |
| Tue | Rice + Grilled Chicken + Broccoli | Macro display: "~580 kcal · ~45g protein" — she loves this |
| Wed | Roti + Fish + Palak + Garlic Curd | Good, but macro data missing for Fish (null values) |
| Thu | Roti + Dal + Patta Gobhi | "Where's the protein? Dal alone isn't enough." |
| Fri | Roti + Pan Fried Chicken + Beans Broccoli | Repeat protein (Mon) — only 4 nonveg dry proteins total |
| Sat | Roti + Egg Curry + Lal Saag | "I don't want curry-style on Saturday, I want grilled" |
| Sun | Rice + Bihari Chicken Curry | Fine but can't see macros (null) |

**Key observation:** Solo high-protein users expose a gap: the engine has no "minimal carb" mode, no way to set grain_qty to 0, and macro nulls on many dishes make the display half-useful. The protein pool (4 nonveg dry items) starts cycling by day 5. But overall, the app structure is closest to this user's needs.

**Scores:**
- Diet chart closeness: **7/10** — structure right, carb floor can't go to 0, missing "no-grain dinner" option
- Swappability: **6/10** — nonveg dry protein pool (4 active) adequate for a week, starts repeating after
- Sustainability: **7/10** — small library means faster cycling, but user's low variety tolerance means she doesn't mind

---

### P08 — Sharma family · Lucknow · 2 nonveg + 3 veg · Cook 6x/week · Joint family
**Profile:** 5-person joint family. Grandparents (veg), parents (nonveg), teenage son (nonveg). Cook comes daily. UP household — very similar cuisine to the app's primary target but joint family scale.

**Pre-screen:**
- Dinner: roti × 6–8 total + dal + 1 sabzi + 1 protein per nonveg person + curd + salad
- Grain: roti at dinner, rice at lunch
- Usual dishes: ~35, heavily North Indian
- Pain point: "Cooking for 5 means cooking 2 proteins every night — one veg for the elders, one nonveg for us."

**Onboarding:**
- Household: 5-person setup — app only models 2 people cleanly. 3rd/4th/5th person has no clear slot.
- The veg grandparents + nonveg parents split is exactly the app's model, but at 5 people, scale breaks down.
- Diet chart: close match for North Indian pattern — would mostly work
- Dish quick-pick: ~90% overlap with library for this family
- **Onboarding friction: MEDIUM** — person count beyond 2 is clunky

**7-day simulation:**
Similar to P01 (Delhi couple) but with veg protein needed every night.

| Day | Suggested | Issues |
|---|---|---|
| Mon | Roti + Dal + Bhindi + [NV: Pan Fried Chicken] + [V: Paneer Stir Fry] | Works, but quantity/scaling for 5 not shown |
| Tue | Roti + Dal + Beans Broccoli + [NV: Fish] + [V: Paneer Bhurji] | Fine but grandparents have no lunch protein shown |
| Wed | Roti + Dal + Carrot Beans Capsicum + [NV: Egg Curry] | Grandparents (veg) can't eat egg curry — no veg protein shown for them |
| Thu | Rice + Rajma + Palak | Good shared day — rajma works for all 5 |
| Fri | Roti + Kadhi + Bhindi + [NV: Chicken Curry] | Works |
| Sat | Roti + Dal + Patta Gobhi + [NV: Bihari Chicken Curry] + [V: Soy Bean Sabzi] | OK but Soy Bean Sabzi is person_scope: shared not person_2-specific |
| Sun | Rice + Dal + Broccoli + [NV: Chinese Chicken] | Chinese chicken on Sunday — unexpected but acceptable |

**Key observation:** 5-person household is awkward. The app works conceptually but the home screen won't show 3-person protein splits cleanly, and quantity scaling (roti × 8) is never communicated. Elders' nutrition isn't tracked anywhere.

**Scores:**
- Diet chart closeness: **7/10** — cuisine match is high, scaling model breaks
- Swappability: **7/10** — North Indian library serves this household well
- Sustainability: **7/10** — same pool as P01, same day-6 thin-ness in nonveg curry

---

### P09 — Kavita & Suresh · Pune · Both veg · No cook · Maharashtrian
**Profile:** Maharashtrian couple, both veg. Cook every night. Traditional Marathi food: bhakri (jowar/bajra roti), pitla, zunka, varan bhaat, amti, misal. No nonveg.

**Pre-screen:**
- Dinner: bhakri + amti (thin dal-like) OR varan-bhaat (dal-rice) + bhaji (dry sabzi) + koshimbir (salad)
- Grain: bhakri (millet/jowar) more than wheat roti; rice 2–3x/week
- Usual dishes: ~25, 18 Marathi-specific
- Pain point: "Nobody has Maharashtrian food in any app. We always get suggested paneer which we don't like."

**Onboarding:**
- Household: 2 veg — smooth
- Diet chart: amti (thin dal) maps to "liquid" class — OK; bhakri maps to "grain_staple" as millet_roti — passable
- Dish quick-pick: bhakri isn't in the library (millet_roti approximates it), amti isn't there (dal approximates), zunka isn't there, pitla isn't there, misal isn't there, koshimbir isn't there (kheera_pyaaz_salad is different)
- **Onboarding friction: HIGH** — all Marathi-specific dishes absent, user must add 15+ manually

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Roti + Dal + Bhindi + Curd | "We'd use bhakri not roti. Close but wrong." |
| Tue | Roti + Chole + Patta Gobhi | "We never make chole. This is Punjabi." |
| Wed | Roti + Dal + Broccoli + Curd | "Broccoli? Nobody cooks broccoli in Pune." |
| Thu | Roti + Kadhi + Beans | Kadhi works — Maharashtrian kadhi exists |
| Fri | Roti + Rajma + Palak | "Rajma? Never in our lives." |
| Sat | Millet Roti + Dal + Gobhi Aloo | Millet roti finally surfaced — closer |
| Sun | Rice + Dal + Carrot Beans Capsicum | Acceptable |

**Swaps tried:** Tried to swap Chole (liquid) for something more Marathi — only options: dal, sambhar, kadhi, rajma, salan. None are Marathi. No amti, no solkadhi, no varan.

**Key observation:** The app uses the word "sabzi" but suggests broccoli and beans — completely foreign to traditional Maharashtrian cooking. The veg user is particularly hurt because all the "interesting" dishes (biryani, Chinese chicken, egg curry) are unavailable to them, and the veg alternatives (paneer-heavy) don't match Marathi taste.

**Scores:**
- Diet chart closeness: **3/10** — structure roughly right, cuisine entirely wrong
- Swappability: **2/10** — no Marathi options in any class; veg pool thin overall
- Sustainability: **2/10** — repeats North Indian defaults within 3 days

---

### P10 — Nair family · Kochi · Kerala · 2 nonveg + 1 eggitarian + 1 veg
**Profile:** 4-person family. Heavy fish and coconut. Rice dominant. 1 daughter is veg, 1 son is eggitarian, parents are nonveg. Appam/stew on Sundays.

**Pre-screen:**
- Dinner: rice + fish curry / chicken stew + 1 thoran (dry coconut sabzi) + rasam + curd
- Grain: rice at every meal; appam/puttu for breakfast
- Usual dishes: ~30, 22 Kerala-specific
- Pain point: "My daughter (veg) always feels the app ignores her"

**Onboarding:**
- Household: 4-person, mixed diet — 3-4 person model isn't supported cleanly
- Daughter (veg) has no protein slot currently
- Dish quick-pick: rice ✓, fish ✓ (generic); but no: fish molly, karimeen pollichathu, prawn curry, avial, erissery, thoran, rasam, moru curry, Kerala chicken stew, puttu, appam
- **Onboarding friction: VERY HIGH** — Kerala cuisine entirely absent

**7-day simulation:**
Same failure pattern as P02 (South Indian) but compounded by 4-person split. Fish is there but as a generic entry, not prepared Kerala-style. No coconut in any dish. No rasam. Thoran (dry coconut vegetable) has no analog in the current library.

**Key observation:** Kerala cuisine requires coconut-based preparations in dry, curry, and liquid classes. None exist. This household can use maybe 5 dishes from the current library.

**Scores:**
- Diet chart closeness: **2/10**
- Swappability: **1/10** — critically thin; South Indian fish-coconut culture entirely absent
- Sustainability: **1/10** — unusable by day 3

---

### P11 — Taneja family · Chandigarh · All nonveg · 3 people · Cook 3x/week
**Profile:** Punjabi family. Heavy roti, dairy. Makki di roti + sarson ka saag in winter. Chicken and mutton dominant. Very dairy-heavy (extra ghee, butter, cream).

**Pre-screen:**
- Dinner: 4–6 roti + dal makhani OR sabzi + 1 chicken dish + curd/raita + salad
- Grain: roti almost exclusively; rice only with dal makhani
- Usual dishes: ~20, 12 Punjabi-specific
- Pain point: "Every suggestion feels like it's for Delhi people. We want proper Punjabi food."

**Onboarding:**
- Household: 3 nonveg — only 2-person model available
- Dish quick-pick: chicken curry ✓, paneer ✓, dal ✓, roti ✓; but no: dal makhani, sarson ka saag, makki di roti, butter chicken, kadai paneer, palak chicken, amritsari fish
- Sarson ka saag would be greens class — not in library; makki di roti = grain_staple — not in library
- **Onboarding friction: MEDIUM** — cuisine is North Indian adjacent, but Punjabi-specific missing

**7-day simulation:**

| Day | Suggested | Issues |
|---|---|---|
| Mon | Roti + Dal + Pan Fried Chicken + Bhindi | Acceptable but bland for Punjabi taste |
| Tue | Roti + Dal + Bihari Chicken Curry | "Wrong curry style — this is Bihari" |
| Wed | Roti + Dal + Fish + Palak | Fish okay, palak okay |
| Thu | Roti + Dal + Chicken Curry + Beans Broccoli | Chicken curry finally! 4 days in |
| Fri | Roti + Dal + Grilled Chicken | Grilled chicken = Continental, not Punjabi |
| Sat | Roti + Dal + Dry Chicken + Broccoli | Dry chicken OK; but dal every day is monotonous |
| Sun | Roti + Dal + Chinese Chicken | "Chinese on Sunday?" |

**Key observation:** Dal every single day — the liquid class has no Punjabi alternative (no dal makhani, no langar dal). This family eats dal makhani 1–2x/week but it's not in the library. The app defaults to "Dal" for every day's liquid slot, which gets old by day 3.

**Scores:**
- Diet chart closeness: **5/10** — roti-dominant structure right, Punjabi flavor profile absent
- Swappability: **4/10** — liquid class is a single dish for 7 days (only Dal is meaningfully Punjabi); nonveg curry thin
- Sustainability: **5/10** — holds 7 days only because nonveg proteins are varied enough

---

### P12 — Kiran & Deepa · Mumbai · Nonveg + Veg · Time-poor · Cook 3x/week
**Profile:** Mumbai working couple. Cook only 3 nights/week; other 4 nights they order out or eat outside. Want the app just for the nights they cook — quick meals only.

**Pre-screen:**
- Cook nights: need "quick" dishes only (<30 min); no elaborate preparations
- Grain: both rice and roti, depends on dish
- Usual dishes: ~15 quick dishes
- Pain point: "When we cook, we don't want to think. Just tell us something quick with what we have."

**Onboarding:**
- Household: 1 nonveg + 1 veg — Kiran (nonveg), Deepa (veg)
- No "quick only" mode in diet chart — user would have to manually tag or filter
- "Eating out today" option covers 4 non-cook days — this is in the design, good
- Dish quick-pick: limited to ~15 quick dishes; current `quick` tags: masala_omelette, boiled_eggs, bhindi, patta_gobhi, toast, grilled_chicken, paneer_bhurji — reasonable coverage
- **Onboarding friction: LOW-MEDIUM** — eating-out feature fits, but no "quick mode" filter

**7-day simulation:**
Mon: cook; Tue: eat out; Wed: cook; Thu: eat out; Fri: cook; Sat–Sun: eat out

| Cook Day | Suggested | Issues |
|---|---|---|
| Mon | Roti + Dal + [Kiran: Pan Fried Chicken] + [Deepa: Paneer Bhurji] + Bhindi | Both dishes have `quick` tag — good match |
| Wed | Rice + Kadhi + [Kiran: Grilled Chicken] + [Deepa: Beans Broccoli Paneer] | Kadhi takes 30 min — not quick; no `quick` tag on kadhi |
| Fri | Roti + Dal + [Kiran: Chinese Chicken] + Patta Gobhi | Works |

**Key observation:** The `quick` tag on dishes isn't used by the diet chart filter. There's no mechanism to say "only suggest quick dishes tonight." Deepa (veg) has a thin quick-veg pool: paneer_bhurji, paneer_stir_fry, capsicum_paneer_sabzi, soy_bean_sabzi. For Kiran (nonveg), quick proteins: grilled_chicken, pan_fried_chicken. Workable for 3-cook-nights, but the "eating out" feature is critical and must work smoothly.

**Scores:**
- Diet chart closeness: **6/10** — eating-out pattern fits; quick filter absent
- Swappability: **7/10** — 3-cook-nights means less repetition pressure
- Sustainability: **7/10** — light usage means pool doesn't exhaust

---

### P13 — Jain family · Jaipur · Strict Jain veg · 4 people · Cook 7x/week
**Profile:** Strict Jain household. No root vegetables (no potato, no onion, no garlic, no carrot, no radish). No eating after sunset. Dal-bati-churma culture mixed with Rajasthani and Jain restrictions.

**Pre-screen:**
- Dinner: eaten before sunset (6–7pm); roti + dal + 1 shaak (only surface vegetables) + curd
- Grain: roti (wheat); bajra/jowar seasonally
- Usual dishes: ~20 strict Jain shaaks; NO aloo, no onion, no garlic, no carrot
- Pain point: "Every app gives us onion-garlic dishes. We're tired of explaining Jain food."

**Onboarding:**
- No Jain diet type in the app (only veg / eggitarian / nonveg)
- No "no root vegetable" filter possible
- Diet chart can't encode "before sunset" constraint
- Dish quick-pick: the library contains carrot (not Jain), gobhi_aloo (not Jain — has potato), garlic_curd (not Jain — has garlic). Even the default salad (kheera_pyaaz_salad) has onion — not Jain.
- **Onboarding friction: CRITICALLY HIGH** — the app's entire data model has no Jain mode

**7-day simulation:**
Every suggestion violates at least one Jain restriction:

| Day | Suggested | Jain violation |
|---|---|---|
| Mon | Roti + Dal + **Gobhi Aloo** | Aloo (potato) = not Jain |
| Tue | Roti + Chole + **Bhindi with garlic curd** | Garlic curd = not Jain |
| Wed | Roti + Dal + **Carrot Beans Capsicum** | Carrot = not Jain |
| Thu | Roti + Kadhi + Broccoli | **Kadhi uses garlic in standard prep** — not Jain |
| Fri | Roti + Rajma + Palak | Rajma OK; palak OK — one acceptable day |
| Sat | Roti + Dal + **Patta Gobhi** | Standard gobhi prep uses onion — not Jain |
| Sun | Roti + Chole + Beans Broccoli | Chole prep uses onion/garlic — not Jain |

**Key observation:** Jain users cannot use this app at all. The dish library doesn't tag onion/garlic content, there's no Jain diet type, and several "always served" items (garlic curd, standard salad with onion) directly violate Jain restrictions. This is a complete blocker.

**Scores:**
- Diet chart closeness: **1/10** — fundamental incompatibility
- Swappability: **1/10** — most swap options also violate Jain rules
- Sustainability: **1/10** — not usable

---

### P14 — Reddy family · Vijayawada · Andhra nonveg · 4 people · Cook 7x/week
**Profile:** Andhra household. All nonveg. Very spicy. Rice dominant. Gongura (sorrel), royyala iguru (prawn), chepa pulusu (fish curry), gutti vankaya, pesarattu breakfast.

**Pre-screen:**
- Dinner: rice + pappu (dal) + fry (dry sabzi) + pulusu (tangy tamarind curry) or iguru (thick masala)
- Grain: rice exclusively at dinner; idli/pesarattu for breakfast
- Usual dishes: ~25, 20 Andhra-specific
- Pain point: "South Indian apps either give us Tamil food or North Indian food. Nobody has Andhra."

**Onboarding:**
- Household: 4 nonveg — 3+ person model breaks
- Dish quick-pick: "Fish" ✓ (generic); "Dal" ✓ (pappu approximation); nothing else matches. No gongura, no pulusu, no iguru, no gutti vankaya, no pesarattu, no royyala.
- **Onboarding friction: VERY HIGH** — Andhra is the most underrepresented cuisine in the library

**Scores (skipping full simulation — same failure pattern as P02, P10):**
- Diet chart closeness: **2/10** — rice structure right, everything else wrong
- Swappability: **1/10** — no Andhra dishes in any class
- Sustainability: **1/10** — app is unusable for this family

---

### P15 — Ravi & Divya · Bangalore · Nonveg + Eggitarian · Health-conscious · NRI-returned
**Profile:** 2 people. Ravi (nonveg), Divya (eggitarian). Both work in tech. 2 years in the US, recently returned. Mix of Indian food + salads + quinoa + protein bowls. Divya tracks macros.

**Pre-screen:**
- Dinner: Indian ~5 nights/week; western 2 nights/week
- Grain: roti 3x, rice 2x, quinoa/no-grain 2x
- Usual dishes: ~30 (20 Indian + 10 Western-influenced)
- Pain point: "Some nights we want dal-chawal, some nights we want a grain bowl. One app can't do both."

**Onboarding:**
- Household: 2 nonveg+eggitarian — very close to P01, smooth
- Goals: Divya's protein target is 120g (higher than default 100g). Adjustable.
- Dish quick-pick: strong overlap with library + they add quinoa (grain_staple), grilled salmon (nonveg dry), mixed greens (greens)
- "No-grain dinner" 2x/week can't be encoded — grain slot is always filled
- **Onboarding friction: LOW-MEDIUM** — closest to app's design target

**7-day simulation:**
Similar to P01 (Delhi couple) but with:
- 2 days they want "no grain or minimal" — app can't do this
- Continental dishes (grilled chicken, broccoli) score higher with this household
- Macro display (when filled) is heavily used by Divya

| Day | Suggested | Issues |
|---|---|---|
| Mon | Roti + Dal + Pan Fried Chicken + [Divya: Egg Curry] + Bhindi | ✓ |
| Tue | Rice + Kadhi + Grilled Chicken + [Divya: Masala Omelette] | Kadhi+omelette feels odd pairing |
| Wed | **No grain day** (they want grain bowl) | App forces roti/rice — can't skip |
| Thu | Roti + Dal + Chinese Chicken + Broccoli | ✓ |
| Fri | Rice + Chole + Fish | ✓ |
| Sat | **No grain day** | Again forced grain |
| Sun | Roti + Dal + Bihari Chicken + Lal Saag | ✓ |

**Key observation:** This household has the highest satisfaction with the existing library but exposes the "no grain" gap clearly. They also add more dishes than average (quinoa, salmon, mixed greens) and want those to surface — which they do via normal active status.

**Scores:**
- Diet chart closeness: **8/10** — very close to design target; no-grain mode missing
- Swappability: **7/10** — same nonveg curry thinness as P01
- Sustainability: **8/10** — varied enough for 7+ days with their broader library

---

## Score Summary

| # | Household | Region | Diet | Diet Chart | Swappability | Sustainability | **Avg** |
|---|---|---|---|---|---|---|---|
| P01 | Rahul & Priya | North | NV+Egg | 8 | 7 | 7 | **7.3** |
| P02 | Sundar family | South | Veg (trad) | 2 | 2 | 1 | **1.7** |
| P03 | Bangalore flat | Urban | NV+Egg+Veg | 5 | 6 | 6 | **5.7** |
| P04 | Meena & Vikram | Hyderabad | NV+NV | 6 | 5 | 6 | **5.7** |
| P05 | Shah family | Gujarat | Strict Veg | 2 | 2 | 2 | **2.0** |
| P06 | Didi & Boudi | Bengal | NV (fish) | 3 | 2 | 3 | **2.7** |
| P07 | Ananya | Urban | NV solo | 7 | 6 | 7 | **6.7** |
| P08 | Sharma family | North | NV+Veg | 7 | 7 | 7 | **7.0** |
| P09 | Kavita & Suresh | Maharashtra | Veg | 3 | 2 | 2 | **2.3** |
| P10 | Nair family | Kerala | Mixed | 2 | 1 | 1 | **1.3** |
| P11 | Taneja family | Punjab | NV | 5 | 4 | 5 | **4.7** |
| P12 | Kiran & Deepa | Mumbai | NV+Veg | 6 | 7 | 7 | **6.7** |
| P13 | Jain family | Rajasthan | Strict Jain | 1 | 1 | 1 | **1.0** |
| P14 | Reddy family | Andhra | NV | 2 | 1 | 1 | **1.3** |
| P15 | Ravi & Divya | Urban (NRI) | NV+Egg | 8 | 7 | 8 | **7.7** |
| | **Mean** | | | **4.5** | **4.0** | **4.4** | **4.3** |

---

## Key Findings

### Finding 1 — The app is a North Indian nonveg app, not a pan-Indian app
10 out of 15 households scored ≤5.7. Every household outside North India effectively cannot use the app. The current 62-dish library covers ~1 of India's 6–8 distinct food cultures. **The app is not a pan-Indian meal planner — it is a North Indian nonveg household tool.**

### Finding 2 — Veg users are second-class citizens
The veg protein pool (dry_semi_dry) has 8 entries, most paneer-based. No dal-dominant veg households (South Indian, Gujarati, Maharashtrian) are served. The app's protein model assumes nonveg = interesting, veg = generic — which is wrong for 40%+ of India.

### Finding 3 — The nonveg curry class is dangerously thin
Only 2 active entries in the curry class for nonveg (chicken_curry, bihari_chicken_curry). Every nonveg household hits a repeat by day 5–6. This is the most impactful single gap for the primary target users.

### Finding 4 — Jain and strict regional constraints have no model
Jain (no root veg, no onion/garlic), South Indian (2-liquid plate), Bengali (fish-dominant frequency), Gujarat (specific day-rules) all require constraint types that don't exist in the current diet chart or rules model.

### Finding 5 — The 3+ person model breaks
3 of 15 households are 3–5 people. The app models exactly 2 people. The 3rd person either has no protein slot or gets folded into "shared" incorrectly. This affects P03, P08, P10 directly.

### Finding 6 — Swappability is strongest where the library is deepest
North Indian dry sabzi pool (8+ options) and grain pool (7+ options) are strong. The swap experience is good here. But nonveg curry (2), South Indian anything (1–2), Bengali (0–1), Maharashtrian (0) are critical thin spots.

### Finding 7 — The "no grain" dinner use case is unsupported
2 households (P07 solo, P15 NRI couple) explicitly want grain-free dinner options. The diet chart requires a grain slot. There's no way to set grain = none for a slot.

---

## Gap Matrix — What to Add

### Priority 1 — Nonveg curry class (affects P01, P04, P06, P08, P11, P15 = 6/15)
Add at minimum:
- `butter_chicken` (curry, nonveg, north_indian)
- `kadai_chicken` (curry, nonveg, north_indian)
- `mutton_curry` (curry, nonveg, north_indian)
- `fish_curry` (curry, nonveg, pan_indian)
- `prawn_curry` (curry, nonveg, coastal)
- `keema` (dry_semi_dry, nonveg, north_indian)

### Priority 2 — South Indian liquid + dry class (affects P02, P10, P14 = 3/15 but large population)
Add:
- `rasam` (liquid, veg, south_indian)
- `poriyal` (dry_semi_dry, veg, south_indian) — generic dry sabzi South Indian style
- `kootu` (dry_semi_dry, veg, south_indian)
- `avial` (dry_semi_dry, veg, south_indian)
- `thoran` (dry_semi_dry, veg, south_indian)
- `fish_curry_kerala` (curry, nonveg, south_indian)

### Priority 3 — Veg curry expansion (affects P03, P05, P08, P09 = 4/15)
Add:
- `dal_makhani` (liquid, veg, north_indian) — Punjab, Delhi staple
- `matar_paneer` (curry, veg, north_indian)
- `aloo_matar` (curry, veg, north_indian)
- `chana_masala` (curry, veg, north_indian) — distinct from chole
- `amti` (liquid, veg, maharashtrian)

### Priority 4 — Jain constraint model (affects P05, P13 = 2/15 but blocks completely)
Product decision needed: add `jain_mode: true` flag on dishes (no root veg, no onion, no garlic). This is a tagging problem, not a new food class.

### Priority 5 — Grain-free dinner slot (affects P07, P15)
Product decision: allow grain slot quantity = 0 in diet chart, and allow "no grain" as a valid slot constraint.

### Priority 6 — Bengali / coastal fish culture (affects P06, P10, P14 = 3/15)
Current "Fish" entry is too generic. Add:
- `fish_curry_mustard` (curry, nonveg, bengali)
- `fish_fry` (dry_semi_dry, nonveg, pan_indian)
- Extend `fish_weekly_target` rule to allow higher caps for fish-dominant households

---

## Recommended Action

**For the app to be genuinely usable by 10/15 households (≥67%), minimum additions needed:**

| Action | Households unblocked | Effort |
|---|---|---|
| Add 5 nonveg curry entries (butter chicken, fish curry, mutton, keema, kadai) | P01, P04, P06, P08, P11 → score jumps +1.5 avg | Low — just data |
| Add dal_makhani to liquid class | P11, P08 → strong | Low |
| Add rasam + poriyal + thoran to South Indian classes | P02, P10, P14 → partial unblock | Low |
| Add `jain_mode` tag on dishes | P13 → unblock | Medium |
| Allow grain_qty = 0 in diet chart | P07, P15 → unblock | Medium |
| Expand 3-person household model | P03, P08, P10 → partial fix | High (product change) |

Without changes: **4.3/10 average across all Indian households.**
With Priority 1+2+3 additions: estimated **~6.0/10 average.**
To reach 8.0/10 across all households: requires regional cuisine expansion (Priority 1–6 + Bengali + Gujarati + Marathi).
