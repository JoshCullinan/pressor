import type { Mix, MixResult } from './types';
import type { AmountUnit } from './units';
import { fromBase } from './units';

export type PumpStep = 0.1 | 1;

/** Round half up to the pump's resolution. Rounding is for display only. */
export function roundRate(rateMlH: number, step: PumpStep): { value: number; roundsToZero: boolean } {
  const decimals = step === 0.1 ? 1 : 0;
  // The epsilon stops a binary-float miss like 8.85 / 0.1 = 88.4999… rounding a true half down.
  const value = Number((Math.round(rateMlH / step + 1e-9) * step).toFixed(decimals));
  return { value, roundsToZero: value === 0 && rateMlH > 0 };
}

/** Three significant figures by default, without trailing zeros. */
export function sigFigs(n: number, digits = 3): string {
  return String(Number(n.toPrecision(digits)));
}

/** One-line statement of every assumption behind a result, e.g. `4 × 4 mg/4 mL into 100 mL (16 mL removed) = 160 mcg/mL`. */
export function describeMix(mix: Mix, result: MixResult, concentrationUnit: AmountUnit = mix.ampUnit): string {
  const conc = sigFigs(fromBase(result.concentrationBase, concentrationUnit));
  return (
    `${sigFigs(mix.nAmps)} × ${sigFigs(mix.ampAmount)} ${mix.ampUnit}/${sigFigs(mix.ampVolumeMl)} mL ` +
    `into ${sigFigs(mix.bagVolumeMl)} mL (${sigFigs(mix.removedVolumeMl)} mL removed) = ${conc} ${concentrationUnit}/mL`
  );
}
