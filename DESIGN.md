---
name: Pressor
description: Infusion dose to pump rate, printed like the label on the syringe.
colors:
  ground: "#F3F0F6"
  label-stock: "#FFFFFF"
  ink: "#1C1822"
  ink-muted: "#5E5668"
  rule: "#D6CFDD"
  violet: "#5A2D75"
  on-violet: "#FFFFFF"
  violet-wash: "#EDE3F3"
  band: "#C9A2DC"
  on-band: "#1C1822"
  on-ink: "#F3F0F6"
  amber-bg: "#FCEFD8"
  amber-line: "#B86A00"
  amber-ink: "#5C3500"
  error: "#B3261E"
  ground-night: "#131017"
  label-stock-night: "#1E1A23"
  ink-night: "#EFEAF3"
  label-ink-night: "#F5F1F8"
  ink-muted-night: "#A9A1B2"
  label-muted-night: "#B5ADBE"
  rule-night: "#3A3341"
  label-line-night: "#3F3747"
  violet-night: "#D4B4E6"
  on-violet-night: "#24132E"
  violet-wash-night: "#33263D"
  chosen-night: "#4A3558"
  band-night: "#B993CD"
  on-band-night: "#17121B"
  amber-bg-night: "#33250F"
  amber-line-night: "#E0A23C"
  amber-ink-night: "#F7D49A"
  error-night: "#FFB4AB"
typography:
  display:
    fontFamily: "Barlow Condensed"
    fontSize: "84px"
    fontWeight: 800
    lineHeight: "92px"
    letterSpacing: "-1px"
    fontFeature: "tnum"
  headline:
    fontFamily: "Barlow Condensed"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: "34px"
    letterSpacing: "0.4px"
  brand:
    fontFamily: "Barlow Condensed"
    fontSize: "26px"
    fontWeight: 800
    letterSpacing: "1.5px"
  title:
    fontFamily: "Barlow Condensed"
    fontSize: "19px"
    fontWeight: 700
    letterSpacing: "1px"
  field-figure:
    fontFamily: "Barlow"
    fontSize: "24px"
    fontWeight: 600
    fontFeature: "tnum"
  body-strong:
    fontFamily: "Barlow"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
  body:
    fontFamily: "Barlow"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "21px"
  action:
    fontFamily: "Barlow"
    fontSize: "17px"
    fontWeight: 700
  label:
    fontFamily: "Barlow"
    fontSize: "14px"
    fontWeight: 600
rounded:
  sm: "8px"
  control: "10px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  result-card:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  result-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.on-band}"
    typography: "{typography.headline}"
    padding: "8px 16px 6px"
  chip:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sm}"
  chip-selected-night:
    backgroundColor: "{colors.chosen-night}"
    textColor: "{colors.label-ink-night}"
    rounded: "{rounded.sm}"
  segmented-selected:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.on-violet}"
    rounded: "{rounded.sm}"
    height: "44px"
  number-field:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.ink}"
    typography: "{typography.field-figure}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    height: "56px"
  number-field-unconfirmed:
    backgroundColor: "{colors.amber-bg}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.control}"
  button-confirm:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.on-violet}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.label-stock}"
    textColor: "{colors.violet}"
    rounded: "{rounded.control}"
    height: "44px"
  sheet:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 16px 16px"
---

# Design System: Pressor

## Overview

**Creative North Star: "The Syringe Label"**

Pressor prints its answer the way a clinician labels a drawn-up syringe: a coloured band carrying the drug name in heavy condensed capitals, white label stock beneath, and the one number that matters set huge in condensed figures. Everything else on the screen is the form you fill in to produce that label, in the order the bag was mixed. The world is borrowed from the ISO 26825 user-applied label, but only its grammar: band, stock, ink. Pressor uses a single violet band for every drug as its own brand colour, not as a drug-class code.

The system is quiet, flat and high-contrast so it reads in theatre glare and in a dim ward at night. There are no shadows, gradients (other than the scroll edge fade) or decorative illustration. Hierarchy comes from scale contrast (one enormous figure against small, even text), from the condensed face marking "things printed on the label", and from a tiny, strictly assigned colour vocabulary where amber and red each mean exactly one thing. Light and dark follow the system; the band stays violet in both.

Native platform pieces are used as-is: the decimal keypad, the system switch, modal bottom sheets, the Android back gesture. Pressor styles them with its tokens but does not reinvent them.

**Key Characteristics:**
- The result card is the label: violet band, 2px ink rule, white stock, one huge condensed figure.
- Violet-tinted near-white ground by day, violet-black by night; ink is never pure black or pure white.
- Barlow for the interface, Barlow Condensed for anything "printed" (brand, band, section heads, figures, sheet titles).
- Flat: borders and tone separate surfaces, never shadows.
- Gloved-hand sizing: 48dp minimum targets, 56dp number fields.

## Colors

A violet-tinted neutral world with one brand violet, one lilac band, and two reserved signal colours.

### Primary
- **Ampoule Violet** (`violet` / `violet-night`): every interactive affordance that is not a choice already made: text buttons (Reset, About, Done, Show working, Titration table), unit pickers and their chevron, the focused field border, the selected segment, the confirm button, the cursor and selection, the switch track. By night it lifts to a pale lilac so it keeps contrast on the violet-black ground.
- **Violet Wash** (`violet-wash` / `violet-wash-night`): pressed state for chips, rows, unit buttons and outline buttons, and the highlight on the current titration row. Never a resting fill.

### Secondary
- **Label Band Lilac** (`band` / `band-night`): only the band across the top of the result card, and the Android adaptive-icon background. It carries the drug name and concentration in `on-band` ink. Same band for every drug.

### Tertiary (reserved signals)
- **Old-Strength Amber** (`amber-bg`, `amber-line`, `amber-ink` and night variants): a strength remembered from last time that has not been checked against the ampoule in hand. Used on the dashed "check it" stamp, on unconfirmed number fields, and on result-card notices. Nothing else.
- **Hard-Error Red** (`error` / `error-night`): an input combination that cannot be computed (the result card error line, the titration table's invalid-range message). Nothing else.

### Neutral
- **Lavender Ground** (`ground` / `ground-night`): screen and sheet background; also the splash background.
- **Label Stock** (`label-stock` / `label-stock-night`): the result card body, fields, chips, the titration table. White by day; a raised violet-grey by night.
- **Label Ink** (`ink`, `ink-night`, `label-ink-night`): all primary text and the 2px rule under the band. A violet-tinted near-black.
- **Muted Ink** (`ink-muted`, `ink-muted-night`, `label-muted-night`): field labels, units printed inside fields, joiners ("in", "into"), the assumption summary line, hints.
- **Hairline** (`rule`, `rule-night`, `label-line-night`): every border, the segmented outline, row dividers, sheet grabber.
- **Chosen** (`ink` by day, `chosen-night` with a `violet-night` border by night): a selected chip or option row.

### Named Rules
**The One Meaning Rule.** Amber means only "old value, check it". Red means only "cannot compute". Neither is used for emphasis, branding or a dose judgement.

**The Brand Band Rule.** The band is Pressor's violet on every drug. It is not ISO 26825 class colour coding and must never change hue by drug.

**The Nothing Outshines the Answer Rule.** Selected chips print in solid ink by day; at night they drop to a dim violet (`chosen-night`) with a lilac border, so no control is brighter than the result figure.

## Typography

**Display Font:** Barlow Condensed 700 and 800 (bundled)
**Body Font:** Barlow 400 / 500 / 600 / 700 (bundled)

**Character:** Barlow Condensed is the printer on the label: tall, tight, heavy, always uppercase for words. Barlow is the calm, slightly technical interface voice around it. Both are bundled at build time; nothing loads from the network.

### Hierarchy
- **Display** (Condensed 800, 84/92, -1 tracking, tabular figures): the result figure only, shrinking to fit on one line. One per screen.
- **Headline** (Condensed 800, 28/34, uppercase, 0.4 tracking): the drug name in the band, which also shrinks to fit. The concentration beside it is Condensed 700 at 19. The empty and "Check your ampoule" states use Condensed 800 at 30, uppercase.
- **Brand** (Condensed 800, 26, uppercase, 1.5 tracking): "PRESSOR" in the top bar. Sheet titles use Condensed 800 at 24, uppercase; the About title 34.
- **Title** (Condensed 700, 19, uppercase, 1 tracking): section headings (Drug, Ampoule label, Bag, Patient and dose) and table column heads.
- **Field figure** (Barlow 600, 24, tabular): typed values in number fields.
- **Body strong** (Barlow 600, 16/22): the basis line under the figure, chip labels, segment labels, units.
- **Body** (Barlow 400–500, 15/21): the assumption summary, sheet hints, the working lines (17/25), About prose (17/25, max 640 wide).
- **Action** (Barlow 700, 16–17): text and outline buttons.
- **Label** (Barlow 600, 14): field labels and hints; "Pump steps" at 13.

### Named Rules
**The One Huge Figure Rule.** The result figure is the only display-size type. Under it, the basis and assumption lines use two small sizes (16 and 15). Do not add a second large number anywhere on the screen.

**The Unbroken Quantity Rule.** A number and its unit never split across lines, and neither does a compound unit: the assumption line joins number and unit with a no-break space and puts a word joiner after every slash.

**The Tabular Figures Rule.** Every computed or typed number uses tabular figures so columns and re-renders do not jitter.

## Layout

A single portrait column with a 16dp gutter. The top bar (brand left, Reset and About right) and the result card stay pinned; the form scrolls beneath the card, and a stepped fade in the ground colour (six 3dp bands) dissolves content as it slides under the label rather than slicing letters. When the keyboard is up, the card goes compact: only the band, the figure and the basis line remain.

The form follows the order a bag is mixed: Drug, Ampoule label, Bag, Patient and dose. Sections sit 16dp apart with 12dp between a heading and its contents. Paired fields share a row with a muted joiner word between them ("1 mg in 1 mL", "10 into 200 mL"). Quick-pick chips run in a horizontal row that bleeds to the screen edge. Spacing steps are 4, 8, 12, 16, 24, 32. The layout holds at 1.3x font scale.

## Elevation & Depth

Flat. No surface casts a shadow, including the About header (its shadow is explicitly turned off). Depth is carried by tone (label stock on lavender ground, a lighter stock on violet-black at night), by 1–1.5px hairline borders, and by the modal backdrop under sheets (ink at 50% by day, black at 65% by night). The only gradient-like device is the edge fade under the pinned card.

### Named Rules
**The Flat Label Rule.** Surfaces are separated by stock colour and hairlines. A shadow would make the label look like a floating card; it is printed, not lifted.

## Shapes

Gently squared corners, not pills. The result card and chips use 8px; fields, option rows, outline buttons, the confirm button and the stamp use 10px; the titration table 12px; the top of bottom sheets 16px. Borders are 1.5px on controls (2px on a focused field), 1px on the result card and compact segmented control. The band ends in a 2px rule in its own ink, like the printed edge of a label. The unit chevron is drawn from two borders rotated 45 degrees; the app carries no icon font.

## Components

### Result Card (signature)
The answer, printed as a syringe label and pinned above the form.
- **Band:** `band` fill, drug name in Headline left, concentration right, 2px `on-band` rule beneath.
- **Body:** label stock, 16dp side padding. A compact Find rate / Find dose segmented control, then the figure with its unit beside it (Barlow 600, 22) and, for rates, a compact Pump steps 0.1 / 1 segmented control at the right. Below: the basis line ("for 0.1 mcg/kg/min at 70 kg") in body strong ink, the assumption summary in muted ink, any amber notices, then two equal outline actions (Show working, Titration table).
- **States:** "Still needed" lists missing inputs; "Check your ampoule" appears when the strength is remembered; an error replaces the figure in red. Compact mode drops everything but band, figure and basis. Announced as a polite live region.

### Chips
- **Style:** label stock, 1.5px hairline border, 8px radius, Barlow 600 16, 44dp tall plus hit slop.
- **Selected:** solid ink with ground-coloured text by day; `chosen-night` fill with a lilac border by night. Pressed: violet wash.
- **Use:** drug names, bag volumes, remembered strengths. Tapping the selected drug clears it.

### Segmented Control
- **Style:** 1.5px hairline outline, 10px radius, 2px inset; selected segment fills violet with `on-violet` text at 8px radius.
- **Compact:** inside the result card, 36dp tall with vertical hit slop keeping the 48dp target, 1px outline, 15px text.

### Number Fields
- **Style:** muted label above (14), 56dp box, label stock, 1.5px hairline, 10px radius, Barlow 600 24 tabular figure. A fixed unit is printed muted inside the right edge; a changeable unit is a violet button with chevron behind a 1px divider, at least 48dp wide.
- **Focus:** 2px violet border, violet cursor and selection; contents select on focus. Decimal keypad only.
- **Unconfirmed (remembered strength):** amber background, dashed amber border, amber ink.
- **Empty:** genuinely empty. No numeric placeholder.

### Old-Strength Stamp
A dashed amber box (1.5px, 10px radius) with a Condensed 800 uppercase title and body text, ending in a full-width violet "Matches my ampoule" button. It is the only place amber fills a block.

### Buttons
- **Text buttons** (Reset, About, Done): violet Barlow 700 17, no container, 48dp tall.
- **Outline buttons** (Show working, Titration table): 1.5px label-line border, 10px radius, violet text, violet wash when pressed.
- **Confirm:** solid violet, `on-violet` text, 48dp, 10px radius; pressed drops to 85% opacity.

### Option List and Unit Row
Sheet radio rows at 52dp: 1.5px border, 10px radius, Barlow 600 18 with an optional right-aligned hint; selected rows print like a selected chip. The "Show the dose in" row on the main form is a 52dp bordered row with the current unit in violet and a chevron.

### Sheets
Native modal bottom sheet sliding up, ground background, 16px top corners, a 36x4 grabber, a Condensed 800 uppercase title and a violet Done. Dismissed by Done, backdrop tap or the back gesture. Capped at 85% height.

### Titration Table
Inside its sheet: a by-dose / by-pump-rate segmented control, three compact number fields (start, step, rows), then a bordered 12px-radius table on label stock. Column heads in Condensed 700 16; values Barlow 500 19 with the computed column in Condensed 800 22, all tabular. Rows are 48dp tap targets; the current row is violet-washed with violet figures.

### Navigation
No tab bar or drawer. One calculator screen, an About screen pushed with a flat, shadowless native header, and sheets. The brand mark "PRESSOR" doubles as the screen header.

## Do's and Don'ts

### Do:
- **Do** keep exactly one display-size figure on the screen: the result, in Barlow Condensed 800.
- **Do** use Barlow Condensed for anything "printed" (brand, band, section heads, sheet titles, table heads, computed figures) and Barlow for everything you operate.
- **Do** keep every tap target at least 48dp; use hit slop when a control is visually smaller.
- **Do** keep number and unit together with a no-break space, and put a word joiner after slashes in units.
- **Do** separate surfaces with label stock and 1–1.5px hairlines.
- **Do** print selected choices in ink by day and dim violet by night.
- **Do** keep the same violet band for every drug.

### Don't:
- **Don't** use amber for anything except an unconfirmed remembered value, or red for anything except a value that cannot be computed.
- **Don't** colour the band by drug class or imply ISO 26825 class coding.
- **Don't** put numeric placeholders in fields; an empty field must never look filled.
- **Don't** add shadows or elevation to cards, sheets or headers.
- **Don't** use pure black or pure white ink; use the violet-tinted ink tokens.
- **Don't** let a selected control outshine the result figure at night.
- **Don't** add a second large number or a decorative hero; the label is the only focal point.
