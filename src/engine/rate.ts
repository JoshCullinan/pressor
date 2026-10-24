import { computeMix, fail, positive } from './mix';
import type { DoseUnit, EngineError, Mix, MixResult, Result } from './types';
import { perHour, toBase, fromBase, unitFamily } from './units';

export interface RateResult {
  rateMlH: number;
  mix: MixResult;
}

export interface DoseResult {
  dose: number;
  mix: MixResult;
}

interface Prepared {
  mix: MixResult;
  /** Base units of drug per hour for a dose of 1 in the requested unit. */
  basePerHourPerDose: number;
}

function prepare(mix: Mix, doseUnit: DoseUnit, weightKg: number | undefined): { ok: true; value: Prepared } | { ok: false; error: EngineError } {
  if (unitFamily(mix.ampUnit) !== unitFamily(doseUnit.unit)) {
    return fail('unit-mismatch', `Ampoule is in ${mix.ampUnit} but the dose is in ${doseUnit.unit}`, 'doseUnit');
  }

  let weightFactor = 1;
  if (doseUnit.perKg) {
    if (weightKg === undefined || !Number.isFinite(weightKg) || weightKg <= 0) {
      return fail('weight-required', 'Weight is required for a per-kg dose', 'weightKg');
    }
    weightFactor = weightKg;
  }

  const m = computeMix(mix);
  if (!m.ok) return m;

  return {
    ok: true,
    value: {
      mix: m.value,
      basePerHourPerDose: toBase(1, doseUnit.unit) * weightFactor * perHour(doseUnit.per),
    },
  };
}

/** Pump rate in mL/h for a dose. */
export function doseToRate(mix: Mix, doseUnit: DoseUnit, dose: number, weightKg?: number): Result<RateResult> {
  const bad = positive('dose', dose);
  if (bad) return bad;
  const p = prepare(mix, doseUnit, weightKg);
  if (!p.ok) return p;
  const { mix: m, basePerHourPerDose } = p.value;
  return { ok: true, value: { rateMlH: (dose * basePerHourPerDose) / m.concentrationBase, mix: m } };
}

/** Dose, in the requested unit, delivered by a pump rate in mL/h. */
export function rateToDose(mix: Mix, doseUnit: DoseUnit, rateMlH: number, weightKg?: number): Result<DoseResult> {
  const bad = positive('rateMlH', rateMlH);
  if (bad) return bad;
  const p = prepare(mix, doseUnit, weightKg);
  if (!p.ok) return p;
  const { mix: m, basePerHourPerDose } = p.value;
  return { ok: true, value: { dose: (rateMlH * m.concentrationBase) / basePerHourPerDose, mix: m } };
}

/** Concentration in the units of the chosen dose, e.g. mcg/mL. */
export function concentrationIn(mix: MixResult, unit: DoseUnit['unit']): number {
  return fromBase(mix.concentrationBase, unit);
}
