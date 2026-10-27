import { describe, expect, it } from 'vitest';
import { evaluate, initialForm, type Evaluation, type FormState } from '../evaluate';
import { parseNumber, sanitizeNumberInput } from '../parse';

// Worked example A from SPEC.md: 10 × (1 mg in 1 mL) in 200 mL, 0.1 mcg/kg/min, 70 kg.
const adrenaline: FormState = {
  ...initialForm,
  drugLabel: 'Adrenaline',
  ampAmount: '1',
  ampVolume: '1',
  nAmps: '10',
  bagVolume: '200',
  weight: '70',
  dose: '0.1',
};

function ok(e: Evaluation) {
  if (e.status !== 'ok') throw new Error(`expected ok, got ${JSON.stringify(e)}`);
  return e;
}

describe('parseNumber', () => {
  it('returns undefined for blank, NaN for junk, and the number otherwise', () => {
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('   ')).toBeUndefined();
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber('0.1')).toBe(0.1);
    expect(parseNumber(' 7.5 ')).toBe(7.5);
    expect(parseNumber('.5')).toBe(0.5);
    expect(parseNumber('5.')).toBe(5);
    for (const bad of ['abc', '1e3', '-1', '1.2.3', '.', ',', '1,2,3']) {
      expect(parseNumber(bad)).toBeNaN();
    }
  });

  it('accepts a decimal comma', () => {
    expect(parseNumber('0,1')).toBe(0.1);
    expect(parseNumber('2,5')).toBe(2.5);
  });

  it('sanitizeNumberInput strips everything but digits and separators', () => {
    expect(sanitizeNumberInput('1a2-3 .4')).toBe('123.4');
  });
});

describe('evaluate', () => {
  it('gives the rate for worked example A', () => {
    const e = ok(evaluate(adrenaline, 0.1));
    expect(e.headline).toEqual({ label: 'Pump rate', value: '8.4', unit: 'mL/h' });
    expect(e.summary).toBe('10 × 1 mg/1 mL into 200 mL (10 mL removed) = 50 mcg/mL');
    expect(e.notices).toEqual([]);
    expect(e.working).toEqual([
      'Drug in bag: 10 × 1 mg = 10 mg',
      'Final volume: 200 − 10 + 10 = 200 mL',
      'Concentration: 10 mg ÷ 200 mL = 50 mcg/mL',
      'Rate: 0.1 mcg/kg/min × 70 kg × 60 ÷ 50 mcg/mL = 8.4 mL/h',
    ]);
  });

  it('rounds to the pump resolution', () => {
    expect(ok(evaluate(adrenaline, 1)).headline.value).toBe('8');
    const b = { ...adrenaline, replaceRemoved: false, removedVolume: '' };
    const e = ok(evaluate(b, 0.1)); // 210 mL final, 8.82 mL/h
    expect(e.headline.value).toBe('8.8');
    expect(e.notices).toEqual(['The final bag volume is 210 mL, not 200 mL']);
  });

  it('takes a manual volume removed', () => {
    const e = ok(evaluate({ ...adrenaline, replaceRemoved: false, removedVolume: '10' }, 0.1));
    expect(e.headline.value).toBe('8.4');
  });

  it('reads a decimal comma everywhere', () => {
    expect(ok(evaluate({ ...adrenaline, dose: '0,1' }, 0.1)).headline.value).toBe('8.4');
  });

  it('works backwards from a rate to a dose', () => {
    const e = ok(evaluate({ ...adrenaline, direction: 'rate-to-dose', dose: '', rate: '8.4' }, 0.1));
    expect(e.headline).toEqual({ label: 'Dose', value: '0.1', unit: 'mcg/kg/min' });
    expect(e.working.at(-1)).toBe('Dose: 8.4 mL/h × 50 mcg/mL ÷ (70 kg × 60) = 0.1 mcg/kg/min');
  });

  it('handles a dose that is not per-kg and needs no weight', () => {
    const form: FormState = {
      ...adrenaline,
      weight: '',
      dose: '10',
      doseUnit: { unit: 'mcg', perKg: false, per: 'min' },
    };
    const e = ok(evaluate(form, 0.1));
    expect(e.headline.value).toBe('12.0');
    expect(e.working.at(-1)).toBe('Rate: 10 mcg/min × 60 ÷ 50 mcg/mL = 12 mL/h');
  });

  it('handles a per-hour dose in another mass unit', () => {
    const form: FormState = {
      ...adrenaline,
      weight: '',
      dose: '0.6',
      doseUnit: { unit: 'mg', perKg: false, per: 'h' },
    };
    const e = ok(evaluate(form, 0.1));
    expect(e.headline.value).toBe('12.0');
    expect(e.summary).toContain('= 0.05 mg/mL');
    expect(e.working.at(-1)).toBe('Rate: 0.6 mg/h ÷ 0.05 mg/mL = 12 mL/h');
  });

  it('says what is missing, in a sensible order, without shouting', () => {
    expect(evaluate(initialForm, 0.1)).toEqual({
      status: 'incomplete',
      missing: ['the ampoule strength', 'the number of ampoules', 'the bag volume', "the patient's weight", 'the dose'],
    });
    expect(evaluate({ ...adrenaline, dose: '' }, 0.1)).toEqual({ status: 'incomplete', missing: ['the dose'] });
    expect(evaluate({ ...adrenaline, weight: '' }, 0.1)).toEqual({
      status: 'incomplete',
      missing: ["the patient's weight"],
    });
    expect(evaluate({ ...adrenaline, direction: 'rate-to-dose' }, 0.1)).toEqual({
      status: 'incomplete',
      missing: ['the pump rate'],
    });
  });

  it('does not ask for weight on a dose that is not per-kg', () => {
    const form: FormState = { ...adrenaline, weight: '', doseUnit: { unit: 'mcg', perKg: false, per: 'min' } };
    expect(evaluate(form, 0.1).status).toBe('ok');
  });

  it('shows no result while a remembered strength is unconfirmed', () => {
    expect(evaluate({ ...adrenaline, strengthConfirmed: false }, 0.1)).toEqual({ status: 'unconfirmed' });
  });

  it('reports bad numbers in plain words', () => {
    expect(evaluate({ ...adrenaline, bagVolume: '0' }, 0.1)).toEqual({
      status: 'error',
      message: 'Bag volume must be a number greater than zero',
    });
    expect(evaluate({ ...adrenaline, dose: '1.2.3' }, 0.1)).toEqual({
      status: 'error',
      message: 'Dose must be a number greater than zero',
    });
    expect(evaluate({ ...adrenaline, nAmps: 'x' }, 0.1)).toEqual({
      status: 'error',
      message: 'Number of ampoules must be a number greater than zero',
    });
  });

  it('says a zero or junk weight is unusable rather than missing', () => {
    for (const weight of ['0', 'x']) {
      expect(evaluate({ ...adrenaline, weight }, 0.1)).toEqual({
        status: 'error',
        message: 'Weight must be a number greater than zero',
      });
    }
  });

  it('refuses units that cannot be converted', () => {
    const form: FormState = { ...adrenaline, doseUnit: { unit: 'units', perKg: false, per: 'h' } };
    expect(evaluate(form, 0.1)).toEqual({
      status: 'error',
      message: 'Ampoule is in mg but the dose is in units',
    });
  });

  it('refuses to remove more than the bag holds', () => {
    const form = { ...adrenaline, replaceRemoved: false, removedVolume: '250' };
    expect(evaluate(form, 0.1)).toEqual({ status: 'error', message: 'Volume removed is larger than the bag' });
  });

  it('warns when the rate rounds away to nothing', () => {
    const e = ok(evaluate({ ...adrenaline, dose: '0.001' }, 1));
    expect(e.headline.value).toBe('0');
    expect(e.notices).toContain('The rate rounds to 0 at this pump resolution');
  });
});
