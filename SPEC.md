# Pressor: specification

Status: draft v0.1, 2026-10-24.

## 1. What it is

An offline, open-source phone app that converts between an infusion's **dose** and the **pump rate** (mL/h) for a drug bag the clinician has mixed.

It does the arithmetic and nothing else. The clinician reads the ampoule, decides the dose and checks the answer. It supplies no clinical knowledge.

## 2. Principles

1. **The clinician supplies every number that matters.** The app ships with no drug strengths, no default concentrations and no dose ranges. The ampoule strength comes from the clinician reading the label. The app may remember strengths the clinician has used before (see 5), but a remembered strength is always shown as old and must be confirmed with a tap before it is used. Products differ between suppliers and countries, and a wrong silent number is the one failure that can't be tolerated.
2. **Show every assumption on the result screen.** Anyone glancing at the screen can see "4 amps × 1 mg / 1 mL, 16 mL removed, bag 100 mL → 160 mcg/mL".
3. **Fully offline.** No network calls, no accounts, no analytics, no ads, no stored patient data. The release build should not even request the INTERNET permission.
4. **Free and open source.** No premium tier, no purchases, no tracking. Nothing is sold.
5. **Small.** One main screen. If a feature isn't needed to turn "what's in the bag" into "what rate", it's out.
6. **Fast under pressure.** Large tap targets, numeric keypad, readable in the dark, answer visible without scrolling.

## 3. Non-goals

- Dose recommendations, ranges, limits or "safe/unsafe" judgements. Users look those up elsewhere.
- Patient records, saved patients or history.
- Drug interactions, paediatric/renal adjustments or any other clinical logic.
- Pump integration.
- Selling anything, or collecting any data.

## 4. Calculation model

### 4.1 Inputs

| Input | Notes |
|---|---|
| **Ampoule strength** | *amount* + *unit* in *volume* mL, typed from the label. Example: `1 mg in 1 mL`, `4 mg in 4 mL`, `10 mg in 1 mL`. |
| **Number of ampoules** | Decimals allowed (a part-ampoule drawn up, e.g. 0.5). |
| **Bag volume** | mL. Common values (50, 100, 250, 500) as quick-pick chips, but any number is allowed. |
| **Volume removed** | mL. Default = volume of drug added, with a toggle: "Replace removed volume" (default on) and "Add without removing". Can be edited directly. |
| **Weight** | kg. Required when the dose is per-kg. Never stored to disk. |
| **Dose**, or **pump rate** | The direction is switchable (dose → rate, or rate → dose). |

### 4.2 Units

- **Amount units:** mcg, mg, g, units. The "mass family" (mcg, mg, g) converts internally. "units" is its own family and never converts to mass. A mismatch between the ampoule's unit and the dose's unit across families is a hard error, not a guess.
- **Dose form:** `amount / [kg] / time`, with the `/kg` part switchable and time = min or h. Examples: mcg/kg/min, mcg/min, mg/h, units/h.
- **Volume:** mL only.
- **Drug choice only sets the default dose unit** (see section 6). The user can always change it.
- The app uses exactly the number the user enters. It does not convert between salt and base forms.

### 4.3 Formulas

```
drug_total      = n_amps × amp_amount                      (in the ampoule's unit)
drug_volume     = n_amps × amp_volume                      (mL)
final_volume    = bag_volume − volume_removed + drug_volume
concentration   = drug_total / final_volume                (per mL)

dose → rate:   rate_mL_h = (dose × weight × time_factor) / concentration
rate → dose:   dose      = (rate_mL_h × concentration) / (weight × time_factor)
```

- All amounts are converted to one base unit first (e.g. mcg), then the formulas run, then the result is shown in the user's chosen unit.
- `time_factor` converts the dose's time unit to hours (per min → ×60, per h → ×1).
- With the per-kg toggle off, drop `weight`.
- "Bag volume" means the volume of fluid in the bag before any removal.

### 4.4 Precision and display

- Calculate with IEEE double precision, round only for display.
- Rate: rounded to the pump's resolution (setting: 0.1 or 1 mL/h; default 0.1), with the unrounded value available in the "working" panel.
- Concentration and totals: 3 significant figures.
- Every displayed number carries its unit.

### 4.5 Input validation (arithmetic only, no clinical judgement)

Hard errors (no result is shown):
- any required field empty, zero, negative or non-numeric;
- units from incompatible families (e.g. ampoule in `units`, dose in `mg`);
- `final_volume ≤ 0`;
- `volume_removed > bag_volume`.

Soft notices (result shown, notice displayed next to it):
- "Volume removed ≠ volume added": final bag volume differs from the entered bag volume (shown with the actual final volume);
- result so large or small that display rounding hides it (e.g. rounds to 0.0 mL/h).

There are deliberately no warnings of the form "this dose is too high", because those are clinical claims.

### 4.6 Worked examples (these become the first tests)

| # | Setup | Result |
|---|---|---|
| A | 10 amps × (1 mg in 1 mL), 200 mL bag, 10 mL removed. 0.1 mcg/kg/min, 70 kg | final 200 mL, **50 mcg/mL**, **8.4 mL/h** |
| B | As A but nothing removed | final 210 mL, 47.62 mcg/mL, **8.82 mL/h** |
| C | 4 amps × (4 mg in 4 mL), 100 mL bag, 16 mL removed. 0.05 mcg/kg/min, 80 kg | final 100 mL, **160 mcg/mL**, **1.5 mL/h** |
| D | 1 amp × (10 mg in 1 mL), 100 mL bag, 1 mL removed. 0.5 mcg/kg/min, 70 kg | final 100 mL, **100 mcg/mL**, **21 mL/h** |
| E | As A, not per-kg: 10 mcg/min | **12 mL/h** |
| F | As A, dose entered as 0.6 mg/h, not per-kg | **12 mL/h** (same as E) |
| G | Reverse of A: 8.4 mL/h, 70 kg | **0.1 mcg/kg/min** |

Property tests: dose → rate → dose returns the input; changing the dose's unit (mcg/min ↔ mg/h) never changes the rate; scaling drug and volume together leaves the concentration unchanged.

## 5. Screens (v1)

**Calculator** (home, single scrolling-free screen where possible)
1. Drug name (optional label; type to search or enter your own).
2. Ampoule strength: `[amount] [unit] in [volume] mL`, with a placeholder hint "as printed on the label". **Remembered strengths:** after a calculation, the strength is saved against the drug label (the last 3 per drug). When the drug is picked again, the most recent one is pre-filled in an **unconfirmed** state: amber styling, a "Last used 3 days ago, check your ampoule" tag, and no result until the clinician taps **"Matches my ampoule"** or edits the field. The other saved strengths show as chips, each with its full text and age; tapping one fills and confirms it. Only the strength is remembered; weight, bag size, ampoule count and dose never are.
3. Number of ampoules, bag volume, replace-removed-volume toggle.
4. Weight and per-kg toggle.
5. Dose and unit, or rate (with direction switch).
6. **Result:** the rate (or dose) in large type. Below it, a one-line summary of the assumptions, e.g. `4 × 1 mg/1 mL into 100 mL (16 mL removed) = 160 mcg/mL`. A "Show working" expander prints the formula with the numbers substituted.
7. A **Reset** button clears everything.

**Pump rounding** (0.1 or 1 mL/h) is a small toggle in the corner of the result card, so it is changeable at the point of use. It is remembered between sessions.

**About:** the disclaimer, the licence and a link to the source repository. The theme follows the phone's light/dark setting. A separate Settings screen and an optional list of external dosing references (links open the browser; the app itself stays offline) are not built yet.

**Working sheet:** "Show working" in the result card opens a pop-up sheet listing each step of the calculation with the numbers substituted. The same sheet component will host the titration table.

**Titration table (v1.1, after the calculator works):** not a separate page. It opens as a pop-up sheet from a button next to the result, and closes back to the calculator, so it is never in the way.
- Uses the current mix and weight. The header repeats the assumptions line.
- Two modes, switched with a toggle: **by dose** (dose → rate) and **by pump rate** (rate → dose, for "if I nudge the pump to 4 mL/h, what dose is that?").
- Controls: start, step, number of rows. Pre-filled from the calculator; the step defaults to the current value (0.1 gives 0.1, 0.2, 0.3 …) and is editable. The row matching the current value is highlighted.
- Tapping a row loads that dose or rate into the calculator and closes the sheet.
- With 1 mL/h pump rounding, a small note shows the dose actually delivered at the rounded rate.
- Every row comes from the same engine function as the main screen, and tests check each row against a single calculation.

**Not in v1, may come later:** additional languages.

## 6. Drug list

A bundled JSON file (`src/data/drugs.json`) of **names only**:

```json
{ "name": "Adrenaline", "aliases": ["Epinephrine"], "defaultDoseUnit": "mcg/kg/min" }
```

- It has **no strengths, concentrations or dose ranges**. Search matches the name or an alias. The label shown follows the user's setting (default: South African naming, adrenaline/noradrenaline).
- Starting entries: adrenaline (epinephrine), noradrenaline (norepinephrine), phenylephrine, dopamine, dobutamine, vasopressin, milrinone, isoprenaline.
- `defaultDoseUnit` is purely a convenience for the first-open state. Entries without one default to mcg/kg/min.
- Any text the user types becomes a custom label. Remembered strengths are keyed by the label, so custom labels get them too.
- Adding a drug is a one-line pull request.

## 7. Technical approach

- **Expo + React Native + TypeScript**, Expo Router. iOS and Android native; web export as a bonus.
- **Engine is a pure TypeScript module** (`src/engine/`) with no React imports. Unit-tested with Vitest, including the examples in 4.6 and property tests.
- **State:** plain React state. Settings (theme, rounding) and the remembered ampoule strengths per drug label (4.1, 5) are persisted via AsyncStorage. Weight, bag size, ampoule count, dose and rate are never persisted.
- **Theme tokens** in a single file so colours and themes can be changed later in one place.
- **No network:** no fetch calls in app code; release build blocks the INTERNET permission on Android (verify in the built manifest).
- **CI:** GitHub Actions running typecheck, lint and tests on every push and PR.
- **Dependencies:** as few as possible; each one is an audit burden for a medical-adjacent project.

Suggested layout:

```
src/app/             Expo Router screens
src/engine/          units, concentration, rate maths (pure TS)
src/engine/__tests__ golden cases from 4.6 + property tests
src/data/drugs.json  drug names and aliases only
src/theme/           colour/spacing/type tokens
docs/                this spec, disclaimer, contribution notes
```

## 8. Open source

- **Licence:** Apache-2.0 (decided). Permissive, accepted by both app stores, thorough warranty/liability disclaimer, requires modified files to be marked as changed, and grants no right to use the project's name. GPL was ruled out because it complicates store distribution.
- **Files:** `README` (what it is, the disclaimer in plain words, screenshots), `LICENSE`, `NOTICE`, `DISCLAIMER.md`, `CONTRIBUTING.md`, `SPEC.md`.
- **Contributions:** any change to the engine needs tests, plus a worked example in the PR description. Data-file changes (drug names) are low-risk. Any proposal to add dose ranges or built-in strengths is declined by policy (see section 2).
- **Disclaimer wording (to appear in the app and README):** "This app is a calculation aid. It is not a medical device and gives no clinical advice. Always check the ampoule label, verify every calculation independently and follow local protocols. Provided as is, with no warranty."
- **Distribution (all free to the user):**
  - Android APK attached to GitHub Releases, plus Google Play later (one-time developer fee).
  - iOS via App Store later (annual developer fee) and TestFlight for early testers.
  - Web is not a target. Expo can export a static web build, so we keep the code web-compatible where that's free (no native-only dependencies without a reason) and may host it later.
  - The fees are the only costs, and they are the maintainer's.

## 9. Reference material gathered (informational; **not** shipped in the app)

Looked up on 2026-10-24 to confirm that the manual-entry design is warranted. The point is that strengths and label wording vary, not that any of these should be defaults.

- **Adrenaline, South Africa:** [Pharma-Q professional information](https://pi-pil-repository.sahpra.org.za/wp-content/uploads/2024/11/Approved-Adrenaline-PI.pdf) states 1 mg adrenaline *base (as tartrate)* per mL. A Fresenius 1 mg/1 mL product is also registered in South Africa ([listing](https://pharmacompass.com/south-african-mcc-mpr-drug-database/epipen)).
- **Phenylephrine, South Africa:** [Abbott insert (SAHPRA)](https://pi-pil-repository.sahpra.org.za/wp-content/uploads/2022/11/1.3.1-PI-Phenylephrine-hydrochloride-injection.pdf): 10 mg/mL, 1 mL ampoule (hydrochloride).
- **Noradrenaline, South Africa:** no SAHPRA insert found in this search; **still to confirm** against SAHPRA or the South African Medicines Formulary.
- **Noradrenaline elsewhere:** Australia registers several strengths (1 mg/1 mL, 4 mg/4 mL, 10 mg/10 mL) from [Kabi](https://tga.gov.au/resources/artg/424894) and others, as the acid tartrate monohydrate; the UK lists 4 mL and 8 mL ampoules, and a US 4 mg/4 mL product states its strength as base. Label wording (base vs salt) differs between products, which is why the app never converts: it uses exactly the number the clinician types.

## 10. Open questions

None at the moment.

Decided: the name is **Pressor** (clinicians' slang for vasopressors; the maths works for any drug, and the licence grants no name rights, so a rename stays free); Apache-2.0; remembered strengths are in, shown as old and confirmed with a tap (5); the titration table is a pop-up sheet in v1.1 (5); web is optional, not a target.
