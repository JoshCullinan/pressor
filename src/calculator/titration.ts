import { doseToRate, rateToDose, roundRate, sigFigs, type PumpStep } from '../engine';
import type { CalcInputs } from './evaluate';

/** By dose: "what rate for each dose?". By rate: "what dose does each pump rate give?". */
export type TableMode = 'by-dose' | 'by-rate';

export interface TableSpec {
  start: number;
  step: number;
  rows: number;
}

export interface TitrationRow {
  /** The value in the left column: a dose (by dose) or a pump rate (by rate). */
  input: number;
  inputText: string;
  outputText: string;
  /** By dose with coarse pump steps: the dose the rounded rate actually delivers. */
  deliveredText?: string;
  /** This row matches what is on the calculator now. */
  current: boolean;
}

export const MAX_ROWS = 50;

/** Avoid 0.30000000000000004 when stepping. */
const tidy = (n: number) => Number(n.toPrecision(12));
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

export function validSpec(spec: TableSpec): boolean {
  return (
    Number.isFinite(spec.start) &&
    spec.start > 0 &&
    Number.isFinite(spec.step) &&
    spec.step > 0 &&
    Number.isInteger(spec.rows) &&
    spec.rows >= 1 &&
    spec.rows <= MAX_ROWS
  );
}

/**
 * Starting values for the table. By dose, the step is the current dose (0.1 gives 0.1, 0.2, 0.3 …) and the
 * table starts there. By rate, pumps move in whole mL/h, so it steps by 1 mL/h starting a few below the current rate.
 */
export function defaultSpec(mode: TableMode, inputs: CalcInputs, pumpStep: PumpStep): TableSpec {
  if (mode === 'by-dose') {
    // A dose worked back from a rate can be 0.0714285…; three significant figures is a usable step.
    const dose = Number(sigFigs(inputs.dose));
    return { start: dose, step: dose, rows: 10 };
  }
  const current = roundRate(inputs.rateMlH, pumpStep).value;
  return { start: Math.max(1, Math.floor(current) - 4), step: 1, rows: 12 };
}

export function titrationTable(inputs: CalcInputs, mode: TableMode, spec: TableSpec, pumpStep: PumpStep): TitrationRow[] {
  if (!validSpec(spec)) return [];
  const { mix, doseUnit, weightKg } = inputs;
  const decimals = pumpStep === 0.1 ? 1 : 0;
  const currentRate = roundRate(inputs.rateMlH, pumpStep).value;
  const rows: TitrationRow[] = [];

  for (let i = 0; i < spec.rows; i++) {
    const input = tidy(spec.start + i * spec.step);
    if (mode === 'by-dose') {
      const r = doseToRate(mix, doseUnit, input, weightKg);
      if (!r.ok) return [];
      const rounded = roundRate(r.value.rateMlH, pumpStep).value;
      const row: TitrationRow = {
        input,
        inputText: sigFigs(input),
        outputText: rounded.toFixed(decimals),
        current: near(input, inputs.dose),
      };
      if (pumpStep === 1) {
        const d = rounded > 0 ? rateToDose(mix, doseUnit, rounded, weightKg) : undefined;
        row.deliveredText = d?.ok ? sigFigs(d.value.dose) : '0';
      }
      rows.push(row);
    } else {
      const d = rateToDose(mix, doseUnit, input, weightKg);
      if (!d.ok) return [];
      rows.push({
        input,
        inputText: input.toFixed(Math.max(decimals, decimalsOf(spec.step), decimalsOf(spec.start))),
        outputText: sigFigs(d.value.dose),
        current: near(input, currentRate),
      });
    }
  }
  return rows;
}

function decimalsOf(n: number): number {
  const s = String(tidy(n));
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}
