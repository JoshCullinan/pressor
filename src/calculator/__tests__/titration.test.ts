import { describe, expect, it } from 'vitest';
import { doseToRate, roundRate } from '../../engine';
import { evaluate, initialForm, type CalcInputs, type FormState } from '../evaluate';
import { defaultSpec, titrationTable, validSpec, MAX_ROWS } from '../titration';

// Worked example A: 50 mcg/mL, 70 kg, 0.1 mcg/kg/min = 8.4 mL/h.
const form: FormState = {
  ...initialForm,
  ampAmount: '1',
  ampVolume: '1',
  nAmps: '10',
  bagVolume: '200',
  weight: '70',
  dose: '0.1',
};

function inputsFor(f: FormState): CalcInputs {
  const e = evaluate(f, 0.1);
  if (e.status !== 'ok') throw new Error(e.status);
  return e.inputs;
}

const inputs = inputsFor(form);

describe('evaluate inputs', () => {
  it('carries both sides of the answer', () => {
    expect(inputs.dose).toBe(0.1);
    expect(inputs.rateMlH).toBeCloseTo(8.4, 10);
    expect(inputs.weightKg).toBe(70);
    const back = inputsFor({ ...form, direction: 'rate-to-dose', rate: '8.4' });
    expect(back.dose).toBeCloseTo(0.1, 10);
    expect(back.rateMlH).toBe(8.4);
  });
});

describe('by dose', () => {
  it('defaults to steps of the current dose, starting at it', () => {
    expect(defaultSpec('by-dose', inputs, 0.1)).toEqual({ start: 0.1, step: 0.1, rows: 10 });
  });

  it('rounds a worked-back dose to three significant figures for its defaults', () => {
    const back = inputsFor({ ...form, direction: 'rate-to-dose', rate: '6' }); // 0.0714285… mcg/kg/min
    expect(defaultSpec('by-dose', back, 0.1)).toEqual({ start: 0.0714, step: 0.0714, rows: 10 });
    const rows = titrationTable(back, 'by-dose', defaultSpec('by-dose', back, 0.1), 0.1);
    expect(rows.filter((r) => r.current).map((r) => r.inputText)).toEqual(['0.0714']);
  });

  it('gives the rounded rate for each dose and marks the current one', () => {
    const rows = titrationTable(inputs, 'by-dose', { start: 0.05, step: 0.05, rows: 4 }, 0.1);
    expect(rows.map((r) => [r.inputText, r.outputText, r.current])).toEqual([
      ['0.05', '4.2', false],
      ['0.1', '8.4', true],
      ['0.15', '12.6', false],
      ['0.2', '16.8', false],
    ]);
    expect(rows[0].deliveredText).toBeUndefined();
  });

  it('steps without floating-point drift', () => {
    const rows = titrationTable(inputs, 'by-dose', { start: 0.1, step: 0.1, rows: 10 }, 0.1);
    expect(rows.map((r) => r.inputText)).toEqual(['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1']);
  });

  it('agrees row by row with a single calculation', () => {
    const rows = titrationTable(inputs, 'by-dose', { start: 0.013, step: 0.037, rows: 30 }, 0.1);
    for (const row of rows) {
      const r = doseToRate(inputs.mix, inputs.doseUnit, row.input, 70);
      if (!r.ok) throw new Error('engine');
      expect(row.outputText).toBe(roundRate(r.value.rateMlH, 0.1).value.toFixed(1));
    }
  });

  it('shows the dose actually delivered when the pump only takes whole mL/h', () => {
    const rows = titrationTable(inputs, 'by-dose', { start: 0.1, step: 0.05, rows: 2 }, 1);
    // 8.4 mL/h rounds to 8, which delivers 8 × 50 / (70 × 60) = 0.0952 mcg/kg/min.
    expect(rows[0]).toMatchObject({ outputText: '8', deliveredText: '0.0952' });
    // 12.6 rounds to 13: 0.155 mcg/kg/min.
    expect(rows[1]).toMatchObject({ outputText: '13', deliveredText: '0.155' });
  });
});

describe('by rate', () => {
  it('defaults to whole mL/h steps from a few below the current rate', () => {
    expect(defaultSpec('by-rate', inputs, 0.1)).toEqual({ start: 4, step: 1, rows: 12 });
    const slow = inputsFor({ ...form, dose: '0.01' }); // 0.84 mL/h
    expect(defaultSpec('by-rate', slow, 0.1).start).toBe(1);
  });

  it('gives the dose for each rate and marks the current rate', () => {
    const rows = titrationTable(inputs, 'by-rate', { start: 7.4, step: 0.5, rows: 4 }, 0.1);
    expect(rows.map((r) => [r.inputText, r.outputText, r.current])).toEqual([
      ['7.4', '0.0881', false],
      ['7.9', '0.094', false],
      ['8.4', '0.1', true],
      ['8.9', '0.106', false],
    ]);
  });

  it('prints whole rates without decimals when the pump takes whole mL/h', () => {
    const rows = titrationTable(inputs, 'by-rate', { start: 1, step: 1, rows: 2 }, 1);
    expect(rows.map((r) => r.inputText)).toEqual(['1', '2']);
  });
});

describe('table spec', () => {
  it('rejects nonsense instead of drawing a table', () => {
    for (const bad of [
      { start: 0, step: 1, rows: 5 },
      { start: 1, step: 0, rows: 5 },
      { start: 1, step: -1, rows: 5 },
      { start: NaN, step: 1, rows: 5 },
      { start: 1, step: 1, rows: 0 },
      { start: 1, step: 1, rows: 2.5 },
      { start: 1, step: 1, rows: MAX_ROWS + 1 },
    ]) {
      expect(validSpec(bad)).toBe(false);
      expect(titrationTable(inputs, 'by-dose', bad, 0.1)).toEqual([]);
    }
  });
});
