# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
Doctors and nurses in South African ICUs, theatres and emergency/resus rooms who have just mixed an inotrope or vasopressor infusion and need the pump rate (or need to know what dose a running rate gives). They use it at the bedside or drug trolley, often gloved, under bright theatre lights or in dim wards on night shifts, and are interrupted constantly.

## Product Purpose
Pressor converts between an infusion dose and a pump rate (mL/h) for a bag the clinician mixed themselves, with any bag volume and any number of ampoules. It does the arithmetic and nothing else. Success is a correct rate read at a glance, with every assumption visible so a second person can check it.

## Positioning
Free, open-source (Apache-2.0), fully offline, and deliberately knowledge-free: it ships no drug strengths, concentrations or dose ranges. The clinician reads every number off the ampoule; a remembered strength is always marked old and must be confirmed. No accounts, ads, tracking or purchases.

## Operating Context
- Mixing at the bedside: ampoule in one hand, phone in the other.
- South African naming (adrenaline, noradrenaline) and decimal comma accepted.
- Pumps set in 0.1 or 1 mL/h steps; the result can be rounded to either.
- Titration table pop-up for stepping a dose or rate up and down.

## Capabilities and Constraints
- One calculator screen, an About screen, a "working" sheet and a titration sheet.
- Directions: dose → rate and rate → dose. Dose units mcg/mg/g/units, optional per kg, per min or h.
- Weight required for per-kg doses; never stored. No patient memory.
- Expo / React Native, one design language on Android and iOS (native keyboards and sheets only). Android is the primary test target; iOS is checked on a Mac. A web build exists but is not a goal.
- Light and dark mode, following the system.

## Brand Commitments
- Name: Pressor. No other brand constraints.

## Evidence on Hand
- SPEC.md (worked examples A–G), DISCLAIMER.md, README.md. No users, testimonials or clinical validation yet; do not invent any.

## Product Principles
1. The clinician supplies every number that matters; a remembered value is visibly old until confirmed.
2. Show every assumption next to the answer.
3. Fast under pressure: the answer is visible without scrolling, tap targets are large, numeric keypad only.
4. Small: if it doesn't turn "what's in the bag" into "what rate", it's out.
5. Never judge a dose as safe or unsafe.

## Accessibility & Inclusion
- Readable in bright theatre light and in a dark ward at night; high contrast in both themes.
- Gloved use: large touch targets (48 dp minimum).
- Screen-reader labels on every control (done on Android).
