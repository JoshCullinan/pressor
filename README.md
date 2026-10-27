# Pressor

A free, open-source, fully offline app for working out infusion pump rates. Tell it what is in the bag and the dose you want, and it gives you the rate in mL/h. Or give it the rate and it gives you the dose.

Built by a doctor in South Africa for use under pressure: one screen, big numbers, no accounts, no ads, no tracking, no purchases. The name is clinicians' slang for vasopressors, but the maths works for any drug you can put in a bag.

> **This is a calculation aid, not a medical device.** It has no built-in drug strengths or dose ranges. Read the ampoule, check every result, and follow local protocols. See [DISCLAIMER.md](DISCLAIMER.md).

## How it works

You type in the ampoule strength from the label (e.g. `1 mg in 1 mL`), how many ampoules went into the bag, the bag size, the volume removed, and the patient's weight. The app works out the concentration and converts between dose and pump rate:

```
concentration  = total drug / final bag volume
rate (mL/h)    = dose × weight × time factor / concentration
```

Example: 10 ampoules of 1 mg/1 mL in a 200 mL bag with 10 mL removed is 50 mcg/mL. At 0.1 mcg/kg/min for 70 kg, the rate is 8.4 mL/h.

The full design is in [SPEC.md](SPEC.md).

## Status

Early development. The calculation engine (`src/engine`), the calculator screen (both directions, remembered strengths, working sheet, dark mode) and an About screen are in place and tested on an Android emulator. Still to come: the titration pop-up, release builds (including blocking the INTERNET permission), and iOS testing.

## Development

```
npm install
npm test            # engine tests
npm run typecheck
npx expo start      # run the app
```

Built with Expo (React Native) and TypeScript. The maths lives in `src/engine`, which has no React code in it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: any change to the maths needs tests and a worked example, and the app will not ship built-in strengths or dose ranges.

## Licence

[Apache License 2.0](LICENSE). The licence does not grant any right to use the project's name.
