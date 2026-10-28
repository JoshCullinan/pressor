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

/** A number field on the form, by its FormState key. */
export type InputField = 'ampAmount' | 'ampVolume' | 'nAmps' | 'bagVolume' | 'weight' | 'dose' | 'rate';

/** Something still to fill in, and the field to take the clinician to. */
export interface Missing {
  label: string;
  field: InputField;
}

export type Evaluation =
  | { status: 'unconfirmed' }
  | { status: 'incomplete'; missing: Missing[] }
  | { status: 'error'; message: string }
  | {
      status: 'ok';
      headline: Headline;
      /** One line stating every assumption behind the result. */
      summary: string;
      /** The bag's concentration in the dose's unit, e.g. "50 mcg/mL". */
      concentration: string;
      /** What the answer was worked from, e.g. "for 0.1 mcg/kg/min at 70 kg". */
      basis: string;
      /** The formulas with the numbers substituted. */
      working: string[];
      notices: string[];
      /** The parsed inputs and both sides of the answer, for the titration table. */
      inputs: CalcInputs;
    };

export interface CalcInputs {
  mix: Mix;
  doseUnit: DoseUnit;
  weightKg: number | undefined;
  dose: number;
  rateMlH: number;
}

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
  // A blank weight is reported as missing before the engine runs, so here the weight was entered but is not usable.
  if (error.code === 'weight-required') return 'Weight must be a number greater than zero';
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

  const missing: Missing[] = [];
  if (ampAmount === undefined || ampVolume === undefined)
    missing.push({ label: 'Ampoule strength', field: ampAmount === undefined ? 'ampAmount' : 'ampVolume' });
  if (nAmps === undefined) missing.push({ label: 'Ampoules added', field: 'nAmps' });
  if (bagVolume === undefined) missing.push({ label: 'Bag volume', field: 'bagVolume' });
  if (form.doseUnit.perKg && weight === undefined) missing.push({ label: 'Weight', field: 'weight' });
  if (toRate && dose === undefined) missing.push({ label: 'Dose', field: 'dose' });
  if (!toRate && rate === undefined) missing.push({ label: 'Pump rate', field: 'rate' });
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
  let solved: { dose: number; rateMlH: number };
  if (toRate) {
    const r = doseToRate(mix, du, dose!, weight);
    if (!r.ok) return { status: 'error', message: errorMessage(r.error) };
    const rounded = roundRate(r.value.rateMlH, pumpStep);
    headline = { label: 'Pump rate', value: rounded.value.toFixed(pumpStep === 0.1 ? 1 : 0), unit: 'mL/h' };
    working.push(
      `Rate: ${sigFigs(dose!)} ${doseLabel}${times} ÷ ${concText} = ${sigFigs(r.value.rateMlH, 4)} mL/h`,
    );
    if (rounded.roundsToZero) notices.push('The rate rounds to 0 at this pump resolution');
    solved = { dose: dose!, rateMlH: r.value.rateMlH };
  } else {
    const r = rateToDose(mix, du, rate!, weight);
    if (!r.ok) return { status: 'error', message: errorMessage(r.error) };
    headline = { label: 'Dose', value: sigFigs(r.value.dose), unit: doseLabel };
    solved = { dose: r.value.dose, rateMlH: rate! };
    working.push(
      `Dose: ${sigFigs(rate!)} mL/h × ${concText} ÷ (${divisor}) = ${sigFigs(r.value.dose, 4)} ${doseLabel}`,
    );
  }

  return {
    status: 'ok',
    headline,
    summary: describeMix(mix, m, du.unit),
    concentration: concText,
    basis: `${toRate ? `for ${sigFigs(dose!)} ${doseLabel}` : `from ${sigFigs(rate!)} mL/h`}${du.perKg ? ` at ${sigFigs(weight!)} kg` : ''}`,
    working,
    notices,
    inputs: { mix, doseUnit: du, weightKg: du.perKg ? weight : undefined, ...solved },
  };
}
