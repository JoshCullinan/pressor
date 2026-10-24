# Contributing

Thanks for helping. This app is used near patients, so the rules are strict where it matters and relaxed everywhere else.

## Policy

- **No built-in drug strengths, concentrations or dose ranges.** The clinician supplies every number that matters. Pull requests that add them are declined, however well sourced.
- **No network access, accounts, analytics, ads or purchases.**
- **Keep it small.** If a feature isn't needed to turn "what's in the bag" into "what rate", it probably doesn't belong.

## Changes to the maths (`src/engine`)

- Add or update tests in `src/engine/__tests__`.
- Put a worked example in the pull request description, calculated by hand, with the inputs and the expected result.
- Keep the engine free of React and platform imports.
- Round only for display, never inside a calculation.

## Everything else

- `npm test` and `npm run typecheck` must pass.
- Adding a drug name to `src/data/drugs.json` (once it exists) is a one-line change: name, aliases, default dose unit. No strengths.
- Read [SPEC.md](SPEC.md) first. If your change contradicts it, say so in the pull request and we'll update the spec together.

By contributing you agree your work is licensed under the [Apache License 2.0](LICENSE).
