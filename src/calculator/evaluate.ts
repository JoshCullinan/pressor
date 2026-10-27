import { doseUnitLabel } from '../data/drugs';
import {
  computeMix,
  concentrationIn,
  describeMix,
  doseToRate,
  rateToDose,
  replacedVolumeMl,
  roundRate,
  sigFigs,
  type AmountUnit,
  type DoseUnit,
  type EngineError,
  type Mix,
  type PumpStep,
} from '../engine';
import { parseNumber } from './parse';

export type Direction = 'dose-to-rate' | 'rate-to-dose';

/** Everything on the screen, exactly as typed. Numbers stay strings until `evaluate`. */
export interface FormState {
  drugLabel: string;
  ampAmount: string;
  ampUnit: AmountUnit;
  ampVolume: string;
  /** False while the strength is a remembered one the clinician hasn't yet checked against the ampoule. */
  strengthConfirmed: boolean;
  /** When the pre-filled strength was last used; only set while it is unconfirmed. */
  strengthUsedAt: number | null;
  nAmps: string;
  bagVolume: string;
  /** Remove the volume of drug added (the usual practice), or enter the volume removed by hand. */
  replaceRemoved: boolean;
  removedVolume: string;
  weight: string;
  doseUnit: DoseUnit;
  direction: Direction;
  dose: string;
  rate: string;
}

export const initialForm: FormState = {
  drugLabel: '',
  ampAmount: '',
  ampUnit: 'mg',
  ampVolume: '',
  strengthConfirmed: true,
  strengthUsedAt: null,
  nAmps: '',
  bagVolume: '',
  replaceRemoved: true,
  removedVolume: '',
  weight: '',
  doseUnit: { unit: 'mcg', perKg: true, per: 'min' },
  direction: 'dose-to-rate',
  dose: '',
  rate: '',
};

export interface Headline {
  label: string;
  value: string;
  unit: string;
}

export type Evaluation =
  | { status: 'unconfirmed' }
  | { status: 'incomplete'; missing: string[] }
  | { status: 'error'; message: string }
  | {
      status: 'ok';
      headline: Headline;
      /** One line stating every assumption behind the result. */
      summary: string;
      /** The formulas with the numbers substituted. */
      working: string[];
      notices: string[];
    };

const FIELD_NAMES: Record<string, string> = {
  ampAmount: 'Ampoule strength',
  ampVolumeMl: 'Ampoule volume',
  nAmps: 'Number of ampoules',
  bagVolumeMl: 'Bag volume',
  removedVolumeMl: 'Volume removed',
  dose: 'Dose',
  rateMlH: 'Pump rate',
  weightKg: 'Weight',
};

function errorMessage(error: EngineError): string {
  if (error.code === 'invalid-input' && error.field) {
    const name = FIELD_NAMES[error.field] ?? error.field;
    return error.field === 'removedVolumeMl'
      ? `${name} must be zero or more`
      : `${name} must be a number greater than zero`;
  }
  if (error.code === 'weight-required') return "Enter the patient's weight";
  return error.message;
}

export function evaluate(form: FormState, pumpStep: PumpStep): Evaluation {
  if (!form.strengthConfirmed) return { status: 'unconfirmed' };

  const ampAmount = parseNumber(form.ampAmount);
  const ampVolume = parseNumber(form.ampVolume);
  const nAmps = parseNumber(form.nAmps);
  const bagVolume = parseNumber(form.bagVolume);
  const weight = parseNumber(form.weight);
  const dose = parseNumber(form.dose);
  const rate = parseNumber(form.rate);
  const toRate = form.direction === 'dose-to-rate';

  const missing: string[] = [];
  if (ampAmount === undefined || ampVolume === undefined) missing.push('the ampoule strength');
  if (nAmps === undefined) missing.push('the number of ampoules');
  if (bagVolume === undefined) missing.push('the bag volume');
  if (form.doseUnit.perKg && weight === undefined) missing.push("the patient's weight");
  if (toRate && dose === undefined) missing.push('the dose');
  if (!toRate && rate === undefined) missing.push('the pump rate');
  if (missing.length > 0) return { status: 'incomplete', missing };

  const removedVolumeMl = form.replaceRemoved
    ? replacedVolumeMl(nAmps!, ampVolume!)
    : (parseNumber(form.removedVolume) ?? 0);

  const mix: Mix = {
    ampAmount: ampAmount!,
    ampUnit: form.ampUnit,
    ampVolumeMl: ampVolume!,
    nAmps: nAmps!,
    bagVolumeMl: bagVolume!,
    removedVolumeMl,
  };

  const mixResult = computeMix(mix);
  if (!mixResult.ok) return { status: 'error', message: errorMessage(mixResult.error) };
  const m = mixResult.value;

  const du = form.doseUnit;
  const doseLabel = doseUnitLabel(du);
  const conc = sigFigs(concentrationIn(m, du.unit));
  const concText = `${conc} ${du.unit}/mL`;
  const notices: string[] = [];
  for (const n of m.notices) {
    notices.push(`The final bag volume is ${sigFigs(n.finalVolumeMl)} mL, not ${sigFigs(n.bagVolumeMl)} mL`);
  }

  const working = [
    `Drug in bag: ${sigFigs(mix.nAmps)} × ${sigFigs(mix.ampAmount)} ${mix.ampUnit} = ${sigFigs(m.drugTotal)} ${mix.ampUnit}`,
    `Final volume: ${sigFigs(mix.bagVolumeMl)} − ${sigFigs(mix.removedVolumeMl)} + ${sigFigs(m.drugVolumeMl)} = ${sigFigs(m.finalVolumeMl)} mL`,
    `Concentration: ${sigFigs(m.drugTotal)} ${mix.ampUnit} ÷ ${sigFigs(m.finalVolumeMl)} mL = ${concText}`,
  ];
  // Factors that turn "per kg per minute" into "per hour": weight, and 60 for per-minute doses.
  const factors = [...(du.perKg ? [`${sigFigs(weight!)} kg`] : []), ...(du.per === 'min' ? ['60'] : [])];
  const times = factors.map((f) => ` × ${f}`).join('');
  const divisor = factors.length > 0 ? factors.join(' × ') : '1';

  let headline: Headline;
  if (toRate) {
    const r = doseToRate(mix, du, dose!, weight);
    if (!r.ok) return { status: 'error', message: errorMessage(r.error) };
    const rounded = roundRate(r.value.rateMlH, pumpStep);
    headline = { label: 'Pump rate', value: rounded.value.toFixed(pumpStep === 0.1 ? 1 : 0), unit: 'mL/h' };
    working.push(
      `Rate: ${sigFigs(dose!)} ${doseLabel}${times} ÷ ${concText} = ${sigFigs(r.value.rateMlH, 4)} mL/h`,
    );
    if (rounded.roundsToZero) notices.push('The rate rounds to 0 at this pump resolution');
  } else {
    const r = rateToDose(mix, du, rate!, weight);
    if (!r.ok) return { status: 'error', message: errorMessage(r.error) };
    headline = { label: 'Dose', value: sigFigs(r.value.dose), unit: doseLabel };
    working.push(
      `Dose: ${sigFigs(rate!)} mL/h × ${concText} ÷ (${divisor}) = ${sigFigs(r.value.dose, 4)} ${doseLabel}`,
    );
  }

  return {
    status: 'ok',
    headline,
    summary: describeMix(mix, m, du.unit),
    working,
    notices,
  };
}
