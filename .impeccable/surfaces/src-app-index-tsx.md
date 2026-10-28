---
version: 1
slug: "src-app-index-tsx"
primary_target: "src/app/index.tsx"
related_targets: ["src/components/ResultCard.tsx"]
---

# Calculator screen

Scope: the calculator (src/app/index.tsx), its result card, sheets (working, titration, units) and About. Mode: Operate.

Job: turn "what's in the bag" into a pump rate (or a rate into a dose) at the bedside, gloved, in theatre glare or a dim ward. The answer must be readable at arm's length and every assumption visible beside it.

## Direction contract

THESIS: The answer is printed like the label you stick on the syringe. Refuses the category's blue result card on white cards.

OWN-WORLD: ISO 26825 user-applied syringe label. Violet-tinted near-white ground, white label stock, violet band (PMS 256 family) with the drug name in heavy condensed caps (Barlow Condensed 800), ink never pure black. UI in Barlow. Deep violet for interactive state; amber only for "old, check it"; red only for hard errors. Dark mode: violet-black ground, label stock goes dark, band stays violet. Signature move: the result card is the label: violet band = drug + concentration, the rate set huge in condensed figures beneath.

STORY: The clinician sees the label, reads the rate, checks the line of assumptions under it, and corrects any field below in the order they mixed the bag.

FIRST VIEWPORT: Brand bar (PRESSOR condensed caps, Reset, About). Label card: band, Solve-for segmented (Rate | Dose), huge number + unit, assumption line, Working / Titrate / pump steps. Below: Drug chips, Ampoule (amount with unit picker "in" volume), old-strength stamp, Bag, Patient and dose (unit picker on the dose field).

FORM: Syringe Label, my rank 1 of 7 (pick card, chosen by the user over the roll). seed:e5522ba5adf732a2

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
