# What's Cookin — User Research Re-Run (Round 2)
## 15-Household Lifecycle Study — Post Data Enrichment

> Run against: rotation-bank.json v6 (~140 dishes), cuisine as array, state-level taxonomy, Rajasthani dishes added, South Indian split into tamil/karnataka/kerala/andhra, Bengali dishes added, Maharashtrian/Gujarati dishes added.
> Previous run score: 4.3/10 overall.

---

## Scoring Rubric

| Dimension | 9–10 | 7–8 | 5–6 | 3–4 | 1–2 |
|---|---|---|---|---|---|
| **Diet Chart Closeness** | Feels like our household | Mostly right, 1–2 off | Roughly right but generic | Significant cuisine gap | Barely applicable |
| **Swappability** | Every swap has 3+ good options | Most have 2–3 | Some classes thin, repeats start | Pool frequently exhausted | Swaps useless |
| **Sustainability** | Day 7 still fresh | Minor repeat days 5–7 | Noticeable repeat day 4–5 | Cycling by day 3 | Breaks in 2 days |

---

## P01 — Rahul & Priya · Delhi · Nonveg + Eggitarian · No cook
**Cuisine match:** `up_bihari`

**What changed since Round 1:** Nonveg curry pool went from 2 active to 6 (butter_chicken, kadai_chicken, keema_matar added). Liquid pool went from 4 to 7 (moong_dal, masoor_dal, dal_makhani). Dry protein pool from 4 to 7 (keema, fish_fry, tandoori_chicken).

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Roti + Dal + Pan Fried Chicken + Palak | ✓ |
| Tue | Roti + Dal Makhani + Fish + Bhindi | Dal makhani finally a real option |
| Wed | Roti + Moong Dal + Egg Curry + Beans Broccoli | ✓ |
| Thu | Butter Garlic Rice + Chinese Chicken | Pairs_with works ✓ |
| Fri | Rice + Kadhi + Grilled Chicken + Patta Gobhi | ✓ |
| Sat | Roti + Masoor Dal + Kadai Chicken + Carrot Beans Capsicum | No repeat ✓ |
| Sun | Roti + Dal + Bihari Chicken Curry + Lal Saag | ✓ |

**Remaining gap:** No nonveg on Sunday if Chicken had frequency cap reached earlier in week — but 7 options means plenty of rotation.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **9** | Structure perfect, library now genuinely rich for this cuisine |
| Swappability | **9** | Every food_class has 4–7 UP/Bihari options |
| Sustainability | **8** | 10+ days before any repeat pressure |
| **Final** | **8.7** | |

---

## P02 — Sundar family · Chennai · 3 veg + 1 nonveg · Has cook
**Cuisine match:** `tamil`

**What changed since Round 1:** Sambhar, rasam, poriyal, kootu, avial added. Dosa, idli, upma, lemon_rice, curd_rice, pongal added to grain. Coconut chutney + tomato chutney in sides. Chicken Chettinad for father. Drumstick leaves in greens.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Rice + Sambhar + Poriyal + Coconut Chutney | ✓ Genuine Tamil plate |
| Tue | Rice + Rasam + Kootu + Curd | ✓ |
| Wed | Rice + Sambhar + Thoran... wait, thoran is Kerala | Crossed to Kerala accidentally — engine needs cuisine filter |
| Thu | Dosa + Sambhar + Coconut Chutney | Breakfast-style dinner ✓ |
| Fri | Rice + Moru Kuzhambu + Avial | ✓ |
| Sat | Rice + Rasam + Poriyal | Rasam + poriyal repeat — only 3 liquid options |
| Sun | Lemon Rice + Curd Rice | One-pot day — works |

**Remaining gaps:**
- 2-liquid plate (sambhar + rasam together) still can't be modeled — diet chart only has 1 liquid slot
- Father's nonveg: chicken_chettinad ✓, but only 1 Tamil-specific nonveg option. Fish_curry (pan_indian) is the second.
- Tamil-specific curries missing: kolambu, vathal kuzhambu, chettinad fish curry

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **5** | Rice+sambhar+poriyal now works. 2-liquid plate unmodelable. Father's nonveg thin (1 Tamil curry). |
| Swappability | **6** | Liquid: 3 Tamil options. Grain: 6. Dry: 3. Curry (nonveg): 1 Tamil-specific. |
| Sustainability | **5** | 5–6 days before repeating; liquid class exhausted by day 6 |
| **Final** | **5.3** | |

---

## P03 — Karthik, Aman, Rishi · Bangalore flat · Egg + NV + Veg
**Cuisine match:** `pan_indian`, `up_bihari`

**What changed since Round 1:** Veg protein pool expanded (matar_paneer, palak_paneer, aloo_matar). Shared liquid class richer (moong_dal, dal_makhani). More snack options for all 3.

**7-day simulation:**
Same structural 3-person model issue — Rishi (veg) still gets folded into "shared" protein. But veg protein now has 6 active options (paneer_bhurji, matar_paneer, palak_paneer, paneer_stir_fry, capsicum_paneer, soya) so he eats better.

**Remaining gap:** 3rd person model — no dedicated slot for person_3.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **5** | 3-person model structurally broken regardless of library depth |
| Swappability | **7** | pan_indian library now deep; Rishi has 6 veg protein options |
| Sustainability | **7** | 7 days comfortably with variety for all 3 |
| **Final** | **6.3** | |

---

## P04 — Meena & Vikram · Hyderabad · Both nonveg · Cook 4x/week
**Cuisine match:** `hyderabadi`

**What changed since Round 1:** Butter chicken, kadai chicken, keema_matar (hyderabadi in cuisine array) added. Biryani + salan pairing works. Nonveg curry pool from 2 to 6.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Rice + Dal + Chicken Curry | ✓ |
| Tue | Roti + Masoor Dal + Keema Matar | Keema matar — genuinely Hyderabadi ✓ |
| Wed | Rice + Dal + Fish Curry | ✓ |
| Thu | Roti + Dal + Kadai Chicken + Bhindi | ✓ |
| Fri | Biryani + Salan + Boondi Raita | Pairs_with working perfectly ✓ |
| Sat | Roti + Dal + Butter Chicken | ✓ |
| Sun | Rice + Kadhi + Keema + Broccoli | ✓ — 7 distinct dinners |

**Remaining gap:** Haleem, Hyderabadi-specific dal (khatti dal), mirchi salan beyond the biryani pairing — still missing authentic Hyderabadi flavour depth.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **7** | Biryani night template works. Nonveg pool genuinely useful now. Hyderabadi-specific depth still shallow. |
| Swappability | **7** | Nonveg curry: 5 options. Liquid: 4. No specific Hyderabadi swap alternatives. |
| Sustainability | **7** | Full 7 days without repeat |
| **Final** | **7.0** | |

---

## P05 — Shah family · Ahmedabad · Strict veg · Gujarati
**Cuisine match:** `gujarati`

**What changed since Round 1:** Thepla, bhakri, dal_dhokli (one-pot), gujarati_kadhi, undhiyu (reserve/festive), dhokla added.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Bhakri + Gujarati Kadhi + Bhindi + Curd | ✓ Genuine Gujarati plate |
| Tue | Roti + Dal Dhokli (one-pot) + Carrot Beans Capsicum | One-pot fills grain+liquid ✓ |
| Wed | Bhakri + Amti... wait, amti is Maharashtrian. | Engine needs cuisine filter to avoid mis-suggestions |
| Thu | Roti + Dal + Aloo Jeera + Chaas | ✓ |
| Fri | Roti + Kadhi + Zunka... zunka is Maharashtrian | Cross-cuisine leakage issue |
| Sat | Thepla + Gujarati Kadhi + Methi Leaves | ✓ |
| Sun | Dal Dhokli + Bhindi | Repeat of Tue pattern |

**Remaining gap:** Cross-cuisine leakage — engine still suggests Maharashtrian dishes (amti, zunka) for a Gujarati household if it doesn't filter by cuisine. Also missing Gujarati-specific dry sabzis (sev tameta, ringan no olo) and Jain-day constraint.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **6** | Bhakri, thepla, dal_dhokli, gujarati_kadhi now exist. Cross-cuisine leakage without cuisine filter. |
| Swappability | **5** | Gujarati liquid: 3 options. Dry class thin (no authentic Gujarati sabzis beyond bhindi). |
| Sustainability | **5** | 5 days before repeating Gujarati dishes; defaults to generic on days 6–7 |
| **Final** | **5.3** | |

---

## P06 — Didi & Boudi · Kolkata · Both nonveg · Fish dominant
**Cuisine match:** `bengali`

**What changed since Round 1:** Machher jhol, shorshe maach, doi maach, kosha mangsho, chingri malai curry added. Aloo posto, chorchori added. Cholar dal added. That's 5 distinct Bengali fish/nonveg dishes.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Rice + Masoor Dal + Machher Jhol | ✓ Classic Bengali plate |
| Tue | Rice + Cholar Dal + Aloo Posto | ✓ |
| Wed | Rice + Masoor Dal + Shorshe Maach | Mustard fish ✓ |
| Thu | Rice + Dal + Chorchori + Doi Maach | ✓ — 2 Bengali dishes |
| Fri | Rice + Masoor Dal + Machher Jhol | Machher jhol repeat (Mon) |
| Sat | Rice + Dal + Kosha Mangsho | Weekend mutton ✓ |
| Sun | Rice + Cholar Dal + Chingri Malai Curry | Festive prawn ✓ |

**Remaining gap:** Fish frequency cap rule (currently ~1/week target) — this family eats fish 5x/week. The rule engine penalises fish after day 1, which is wrong for this household. Need a household-level `fish_frequency_override` setting.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **6** | 5 distinct Bengali fish dishes exist. Fish frequency rules still wrong for this household. |
| Swappability | **7** | Nonveg Bengali curry: 5 options. Liquid: 3. Dry: 2 Bengali. |
| Sustainability | **7** | 7 days without full repeat — mild repeat day 5 on machher jhol |
| **Final** | **6.7** | |

---

## P07 — Ananya · Bangalore · Solo NV · Gym-focused
**Cuisine match:** `up_bihari`, `continental`

**What changed since Round 1:** Nonveg dry protein pool from 4 to 6+ (keema, fish_fry, tandoori_chicken added). Veg protein expanded (matar_paneer, palak_paneer). Macro data still partially null.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **7** | Structure right, protein variety improved. No-grain dinner option still missing. |
| Swappability | **8** | Nonveg dry proteins: 6+ active options. Strong variety. |
| Sustainability | **8** | 10+ days before any cycling |
| **Final** | **7.7** | |

---

## P08 — Sharma family · Lucknow · 2 NV + 3 Veg · Joint family · 5 people
**Cuisine match:** `up_bihari`

**What changed since Round 1:** UP/Bihari library is now the deepest in the bank. Liquid: 7 options. Curry: 6 NV + 4 veg. Dry: 9+ options.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **7** | Cuisine match excellent. 5-person model still broken — no dedicated slot for persons 3–5. |
| Swappability | **9** | UP/Bihari is the richest cuisine in the library. Every class has depth. |
| Sustainability | **8** | 10+ days of genuine variety |
| **Final** | **8.0** | |

---

## P09 — Kavita & Suresh · Pune · Both veg · Maharashtrian · No cook
**Cuisine match:** `maharashtrian`

**What changed since Round 1:** Bhakri, amti, varan, misal, chicken_kolhapuri (irrelevant for veg), zunka added.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Bhakri + Varan + Zunka | ✓ Authentic Maharashtrian plate |
| Tue | Bhakri + Amti + Bhindi | ✓ |
| Wed | Roti + Dal + Misal | Misal is a curry ✓ |
| Thu | Roti + Dal + Paneer Bhurji + Beans Broccoli | Generic — Maharashtrian pool partially exhausted |
| Fri | Bhakri + Amti + Aloo Jeera | Amti repeat (Tue) |
| Sat | Roti + Dal + Aloo Matar | Generic |
| Sun | Roti + Kadhi + Patta Gobhi | Kadhi is Maharashtrian-adjacent ✓ |

**Remaining gap:** Only 1 Maharashtrian dry sabzi (zunka). No authentic Maharashtrian dry class options — no sabudana khichdi, batata bhaji, koshimbir (their salad). Defaults to generic by day 4.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **5** | Bhakri, amti, varan, misal now exist. Dry class thin (1 authentic: zunka). |
| Swappability | **4** | Maharashtrian dry: 1. Liquid: 3 (amti, varan, dal). Curry: 1 (misal). |
| Sustainability | **5** | Authentic Maharashtrian pool lasts 3 days, then falls back to generic |
| **Final** | **4.7** | |

---

## P10 — Nair family · Kochi · Kerala · 2 NV + 1 Egg + 1 Veg · 4 people
**Cuisine match:** `kerala`

**What changed since Round 1:** Appam, puttu, fish_curry_coconut, chicken_stew_kerala, thoran, kootu, avial, moru_kuzhambu added. Coconut_chutney added.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Rice + Sambhar + Thoran | ✓ South Indian plate |
| Tue | Rice + Moru Kuzhambu + Avial | ✓ Kerala specific |
| Wed | Rice + Sambhar + Fish Curry Coconut | ✓ Kerala classic |
| Thu | Appam + Chicken Stew Kerala | Pairs_with works ✓ |
| Fri | Rice + Sambhar + Kootu | ✓ |
| Sat | Rice + Moru Kuzhambu + Fish Fry | Moru kuzhambu repeat (Tue) |
| Sun | Puttu | Puttu is breakfast item — dinner gap |

**Remaining gap:** 4-person split model broken. Daughter (veg) gets no dedicated protein beyond thoran/avial/kootu. Puttu needs kadala curry (not in library). Kerala liquid class thin (only moru_kuzhambu + sambhar).

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **6** | Appam/puttu/thoran/fish curry coconut/chicken stew now genuinely exist. 4-person split model broken. |
| Swappability | **6** | Kerala grain: 4. Dry: 3. Curry (NV): 3. Liquid: 2 Kerala-specific. |
| Sustainability | **6** | 5–6 day viability before liquid class repeats |
| **Final** | **6.0** | |

---

## P11 — Taneja family · Chandigarh · All NV · Punjabi · 3 people
**Cuisine match:** `punjabi`

**What changed since Round 1:** Dal makhani, butter chicken, kadai chicken, tandoori chicken, sarson ka saag, makki di roti added. Punjabi pool massively improved.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Roti + Dal Makhani + Pan Fried Chicken + Palak | Dal makhani — finally ✓ |
| Tue | Roti + Rajma + Butter Chicken | ✓ |
| Wed | Roti + Kadhi + Kadai Chicken + Bhindi | ✓ |
| Thu | Makki Roti + Sarson Ka Saag + Dry Chicken | Pairs_with working ✓ |
| Fri | Roti + Chole + Tandoori Chicken | ✓ |
| Sat | Roti + Dal + Chicken Curry + Methi Aloo | ✓ |
| Sun | Rice + Dal Makhani + Bihari Chicken Curry | Slight dal makhani repeat but acceptable |

**Remaining gap:** 3-person model (only 2-person model available). Kulcha/naan not in library.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **7** | Dal makhani, butter chicken, makki roti, sarson saag — the Punjabi staples now exist. |
| Swappability | **8** | Punjabi liquid: 4. Curry: 4. Grain: 3. Well-stocked. |
| Sustainability | **7** | 7 days without full repeat |
| **Final** | **7.3** | |

---

## P12 — Kiran & Deepa · Mumbai · NV + Veg · Time-poor · Cook 3x/week
**Cuisine match:** `maharashtrian` (Deepa), `pan_indian` (both)

**What changed since Round 1:** Deepa's veg options improved (matar_paneer, palak_paneer, misal). More quick-tagged dishes (egg_bhurji, keema, masoor_dal).

**3-cook-night simulation:**
| Cook Day | Dinner | Notes |
|---|---|---|
| Mon | Roti + Masoor Dal + Pan Fried Chicken + [Deepa: Paneer Bhurji] | ✓ Both quick |
| Wed | Rice + Kadhi + Fish Fry + [Deepa: Matar Paneer] | ✓ |
| Fri | Roti + Dal + Keema + [Deepa: Palak Paneer] | ✓ |

4 eating-out days handled cleanly by "Eating out today" feature.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **6** | Eating-out mode fits perfectly. Quick filter still not in engine. |
| Swappability | **7** | Light usage means pool rarely exhausted. Deepa's veg options now richer. |
| Sustainability | **8** | 3-cook-nights means very low pressure on pool. |
| **Final** | **7.0** | |

---

## P13 — Jain family · Jaipur · Strict Jain veg · Rajasthani
**Cuisine match:** `rajasthani`

**What changed since Round 1:** Panchmel dal, ker sangri, gatte ki sabzi, dal baati added. Millet roti now tagged `rajasthani`. These are all naturally Jain-friendly (household cooks their own onion/garlic-free versions — by-design per D-19 reasoning).

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Millet Roti + Panchmel Dal + Ker Sangri + Curd | ✓ Authentic Rajasthani |
| Tue | Roti + Kadhi + Aloo Jeera + Boondi Raita | ✓ Rajasthani-adjacent |
| Wed | Dal Baati (one-pot) + Ker Sangri | ✓ Signature Rajasthani dish |
| Thu | Roti + Panchmel Dal + Bhindi + Chaas | ✓ |
| Fri | Roti + Dal + Gatte Ki Sabzi | ✓ |
| Sat | Millet Roti + Kadhi + Aloo Jeera | Aloo jeera repeat (Mon) |
| Sun | Roti + Dal + Bhindi | Bhindi repeat — Rajasthani dry class thin |

**Remaining gap:** Rajasthani dry sabzi pool is very thin — only ker_sangri and bhindi as distinctive options. No authentic Rajasthani farsaan (gatta), no methi bajra puri, no sabudana. Curry class has only gatte ki sabzi.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **5** | Panchmel dal, dal baati, ker sangri, gatte ki sabzi exist. 7-day coverage possible. |
| Swappability | **5** | Rajasthani liquid: 3. Curry: 1 (gatte ki sabzi). Dry: 2 Rajasthani. |
| Sustainability | **5** | Viable for 5–6 days. Dry class repeats on day 6–7. |
| **Final** | **5.0** | |

---

## P14 — Reddy family · Vijayawada · All NV · Andhra
**Cuisine match:** `andhra`

**What changed since Round 1:** Pappu (Andhra dal), lemon rice, curd rice, dosa, idli, upma, pesarattu, gutti vankaya, chicken 65 added. Sambhar (andhra in cuisine array) available.

**7-day simulation:**
| Day | Dinner | Notes |
|---|---|---|
| Mon | Rice + Pappu + Fish Curry | ✓ Rice + dal Andhra style |
| Tue | Rice + Sambhar + Gutti Vankaya | ✓ Andhra stuffed brinjal |
| Wed | Dosa + Sambhar + Coconut Chutney | Breakfast-style dinner works |
| Thu | Rice + Pappu + Chicken 65 | ✓ Andhra dry side |
| Fri | Rice + Rasam + Fish Fry | Rasam (andhra) + fish fry ✓ |
| Sat | Lemon Rice + Curd Rice | One-pot combo day ✓ |
| Sun | Rice + Sambhar + Chicken Chettinad | Tamil dish used — close enough culturally |

**Remaining gap:** Andhra-specific curries almost absent (only gutti vankaya). No koora (Andhra curry style), no pulusu (tamarind gravy), no iguru, no gongura. Dinner still feels generic after breakfast/lunch variety.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **5** | Breakfast/lunch variety (dosa/idli/pappu/pesarattu/lemon rice) now good. Dinner still thin on Andhra curries. |
| Swappability | **5** | Grain: 6 strong. Liquid: 2 Andhra (pappu + sambhar). Curry: 1 Andhra-specific. |
| Sustainability | **5** | Breakfast/lunch viable 7 days. Dinner repeats by day 4–5. |
| **Final** | **5.0** | |

---

## P15 — Ravi & Divya · Bangalore · NV + Egg · NRI-influenced · Health-conscious
**Cuisine match:** `up_bihari`, `continental`

**What changed since Round 1:** Library is now very deep for both their Indian and continental preferences. Tandoori chicken, fish fry, egg bhurji added. Richer veg options for Divya.

| Dimension | Score | Rationale |
|---|---|---|
| Diet Chart Closeness | **8** | Perfect match to design target. No-grain option still the one gap. |
| Swappability | **8** | Both their cuisine preferences are now well-stocked. |
| Sustainability | **8** | 10+ days before any cycling. |
| **Final** | **8.0** | |

---

## Score Summary — Round 2 vs Round 1

| # | Household | Cuisine | Diet Chart | Swap | Sustain | **Final** | R1 Score | **Δ** |
|---|---|---|---|---|---|---|---|---|
| P01 | Rahul & Priya | up_bihari | **9** | **9** | **8** | **8.7** | 7.3 | +1.4 |
| P02 | Sundar family | tamil | **5** | **6** | **5** | **5.3** | 1.7 | +3.6 |
| P03 | Bangalore flat | pan_indian | **5** | **7** | **7** | **6.3** | 5.7 | +0.6 |
| P04 | Meena & Vikram | hyderabadi | **7** | **7** | **7** | **7.0** | 5.7 | +1.3 |
| P05 | Shah family | gujarati | **6** | **5** | **5** | **5.3** | 2.0 | +3.3 |
| P06 | Didi & Boudi | bengali | **6** | **7** | **7** | **6.7** | 2.7 | +4.0 |
| P07 | Ananya | up_bihari | **7** | **8** | **8** | **7.7** | 6.7 | +1.0 |
| P08 | Sharma family | up_bihari | **7** | **9** | **8** | **8.0** | 7.0 | +1.0 |
| P09 | Kavita & Suresh | maharashtrian | **5** | **4** | **5** | **4.7** | 2.3 | +2.4 |
| P10 | Nair family | kerala | **6** | **6** | **6** | **6.0** | 1.3 | +4.7 |
| P11 | Taneja family | punjabi | **7** | **8** | **7** | **7.3** | 4.7 | +2.6 |
| P12 | Kiran & Deepa | pan_indian | **6** | **7** | **8** | **7.0** | 6.7 | +0.3 |
| P13 | Jain family | rajasthani | **5** | **5** | **5** | **5.0** | 1.0 | +4.0 |
| P14 | Reddy family | andhra | **5** | **5** | **5** | **5.0** | 1.3 | +3.7 |
| P15 | Ravi & Divya | up_bihari | **8** | **8** | **8** | **8.0** | 7.7 | +0.3 |
| | **Mean** | | **6.3** | **6.7** | **6.6** | **6.5** | **4.3** | **+2.2** |

---

## Dimension Averages

| Dimension | Round 1 | Round 2 | Change |
|---|---|---|---|
| Diet Chart Closeness | 4.5 | **6.3** | +1.8 |
| Swappability | 4.0 | **6.7** | +2.7 |
| Sustainability | 4.4 | **6.6** | +2.2 |
| **Overall** | **4.3** | **6.5** | **+2.2** |

Swappability saw the biggest jump (+2.7) — directly because of cuisine-array multi-matching and the new regional dishes flooding all food_class pools.

---

## Who improved most

| Household | R1→R2 | Why |
|---|---|---|
| Kerala (P10) | 1.3 → 6.0 | +4.7 | appam, thoran, fish curry coconut, chicken stew, kootu, avial |
| Bengali (P06) | 2.7 → 6.7 | +4.0 | 5 distinct Bengali fish/nonveg dishes added |
| Jain/Rajasthani (P13) | 1.0 → 5.0 | +4.0 | dal baati, panchmel dal, ker sangri, gatte ki sabzi |
| Andhra (P14) | 1.3 → 5.0 | +3.7 | pappu, lemon rice, dosa/idli, gutti vankaya, pesarattu |
| Tamil (P02) | 1.7 → 5.3 | +3.6 | sambhar, rasam, poriyal, curd rice, dosa, idli |

---

## What's still holding scores down (structural gaps)

| Gap | Households affected | Type |
|---|---|---|
| 3+ person household model | P03, P08, P10 | Product (not data) |
| 2-liquid plate (sambhar + rasam together) | P02, P10, P14 | Product — 1 liquid slot can't hold 2 |
| Fish frequency cap wrong for fish-dominant households | P06, P10 | Rules — needs household-level override |
| Andhra/Tamil curry depth (kolambu, pulusu, koora) | P02, P14 | Data — more dishes needed |
| Maharashtrian dry sabzi depth | P09, P12 | Data — only zunka |
| Cross-cuisine leakage (engine suggests amti to Gujarati) | P05 | Engine — needs cuisine filter at suggestion time |
| No-grain dinner option | P07, P15 | Product — grain slot required |

---

## Recommended next data additions (diminishing returns order)

1. **Andhra curries** — kolambu/pulusu (tamarind gravy), gongura chicken, royyala iguru → unblocks P02+P14 dinner slot
2. **Maharashtrian dry** — batata bhaji, sabudana khichdi, koshimbir → unblocks P09 day 4+
3. **Tamil curry** — kolambu, chettinad fish curry → completes P02 nonveg and adds curry depth
4. **Kerala liquid** — kadala curry (liquid), Kerala fish molee → P10 liquid class thin
5. **Cross-cuisine engine filter** — a product fix, not data: at suggestion time, filter dry/curry/liquid by cuisine overlap before picking

These 5 would push overall score to ~7.5/10 estimated.
