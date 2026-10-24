import { describe, expect, it } from 'vitest';
import {
  computeMix,
  concentrationIn,
  describeMix,
  doseToRate,
  rateToDose,
  replacedVolumeMl,
  roundRate,
  sigFigs,
  type DoseUnit,
  type Mix,
  type Result,
} from '..';

const mcgKgMin: DoseUnit = { unit: 'mcg', perKg: true, per: 'min' };
const mcgMin: DoseUnit = { unit: 'mcg', perKg: false, per: 'min' };
const mgH: DoseUnit = { unit: 'mg', perKg: false, per: 'h' };

function ok<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`expected ok, got ${r.error.code}: ${r.error.message}`);
  return r.value;
}

// Section 4.6 of SPEC.md
const adrenaline: Mix = { ampAmount: 1, ampUnit: 'mg', ampVolumeMl: 1, nAmps: 10, bagVolumeMl: 200, removedVolumeMl: 10 };

describe('worked examples', () => {
  it('A: 10 mg adrenaline in 200 mL, 0.1 mcg/kg/min at 70 kg', () => {
    const r = ok(doseToRate(adrenaline, mcgKgMin, 0.1, 70));
    expect(r.mix.finalVolumeMl).toBe(200);
    expect(concentrationIn(r.mix, 'mcg')).toBeCloseTo(50, 10);
    expect(r.rateMlH).toBeCloseTo(8.4, 10);
  });

  it('B: nothing removed, so the bag ends up at 210 mL', () => {
    const r = ok(doseToRate({ ...adrenaline, removedVolumeMl: 0 }, mcgKgMin, 0.1, 70));
    expect(r.mix.finalVolumeMl).toBe(210);
    expect(concentrationIn(r.mix, 'mcg')).toBeCloseTo(47.619, 3);
    expect(r.rateMlH).toBeCloseTo(8.82, 10);
    expect(r.mix.notices).toEqual([{ code: 'final-volume-differs', finalVolumeMl: 210, bagVolumeMl: 200 }]);
  });

  it('C: 4 × (4 mg in 4 mL) in 100 mL, 0.05 mcg/kg/min at 80 kg', () => {
    const mix: Mix = { ampAmount: 4, ampUnit: 'mg', ampVolumeMl: 4, nAmps: 4, bagVolumeMl: 100, removedVolumeMl: 16 };
    const r = ok(doseToRate(mix, mcgKgMin, 0.05, 80));
    expect(r.mix.finalVolumeMl).toBe(100);
    expect(concentrationIn(r.mix, 'mcg')).toBeCloseTo(160, 10);
    expect(r.rateMlH).toBeCloseTo(1.5, 10);
  });

  it('D: 1 × (10 mg in 1 mL) in 100 mL, 0.5 mcg/kg/min at 70 kg', () => {
    const mix: Mix = { ampAmount: 10, ampUnit: 'mg', ampVolumeMl: 1, nAmps: 1, bagVolumeMl: 100, removedVolumeMl: 1 };
    const r = ok(doseToRate(mix, mcgKgMin, 0.5, 70));
    expect(concentrationIn(r.mix, 'mcg')).toBeCloseTo(100, 10);
    expect(r.rateMlH).toBeCloseTo(21, 10);
  });

  it('E: not per-kg, 10 mcg/min', () => {
    expect(ok(doseToRate(adrenaline, mcgMin, 10)).rateMlH).toBeCloseTo(12, 10);
  });

  it('F: 0.6 mg/h gives the same rate as 10 mcg/min', () => {
    expect(ok(doseToRate(adrenaline, mgH, 0.6)).rateMlH).toBeCloseTo(12, 10);
  });

  it('G: reverse of A', () => {
    expect(ok(rateToDose(adrenaline, mcgKgMin, 8.4, 70)).dose).toBeCloseTo(0.1, 10);
  });

  it('works for a drug dosed in units', () => {
    const mix: Mix = { ampAmount: 40, ampUnit: 'units', ampVolumeMl: 2, nAmps: 1, bagVolumeMl: 50, removedVolumeMl: 2 };
    const r = ok(doseToRate(mix, { unit: 'units', perKg: false, per: 'h' }, 2));
    expect(r.rateMlH).toBeCloseTo(2.5, 10); // 40 units / 50 mL = 0.8 units/mL
  });
});

describe('errors', () => {
  const code = (r: Result<unknown>) => (r.ok ? 'ok' : r.error.code);

  it('rejects empty, zero, negative and non-numeric inputs', () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(code(doseToRate({ ...adrenaline, ampAmount: bad }, mcgKgMin, 0.1, 70))).toBe('invalid-input');
      expect(code(doseToRate({ ...adrenaline, bagVolumeMl: bad }, mcgKgMin, 0.1, 70))).toBe('invalid-input');
      expect(code(doseToRate(adrenaline, mcgKgMin, bad, 70))).toBe('invalid-input');
      expect(code(rateToDose(adrenaline, mcgKgMin, bad, 70))).toBe('invalid-input');
    }
    expect(code(doseToRate({ ...adrenaline, removedVolumeMl: -1 }, mcgKgMin, 0.1, 70))).toBe('invalid-input');
  });

  it('allows zero volume removed', () => {
    expect(code(doseToRate({ ...adrenaline, removedVolumeMl: 0 }, mcgKgMin, 0.1, 70))).toBe('ok');
  });

  it('requires weight only for per-kg doses', () => {
    expect(code(doseToRate(adrenaline, mcgKgMin, 0.1))).toBe('weight-required');
    expect(code(doseToRate(adrenaline, mcgKgMin, 0.1, 0))).toBe('weight-required');
    expect(code(doseToRate(adrenaline, mcgMin, 10))).toBe('ok');
  });

  it('refuses to convert between mass and units', () => {
    expect(code(doseToRate({ ...adrenaline, ampUnit: 'units' }, mcgKgMin, 0.1, 70))).toBe('unit-mismatch');
    expect(code(doseToRate(adrenaline, { unit: 'units', perKg: false, per: 'h' }, 1))).toBe('unit-mismatch');
  });

  it('rejects removing more than the bag holds', () => {
    expect(code(computeMix({ ...adrenaline, removedVolumeMl: 201 }))).toBe('removed-exceeds-bag');
  });
});

describe('helpers', () => {
  it('replacedVolumeMl is the volume of drug added', () => {
    expect(replacedVolumeMl(10, 1)).toBe(10);
    expect(replacedVolumeMl(4, 4)).toBe(16);
  });

  it('roundRate rounds half up to the pump resolution', () => {
    expect(roundRate(8.82, 0.1)).toEqual({ value: 8.8, roundsToZero: false });
    expect(roundRate(8.85, 0.1).value).toBe(8.9);
    expect(roundRate(8.4, 0.1).value).toBe(8.4);
    expect(roundRate(8.5, 1).value).toBe(9);
    expect(roundRate(0.04, 0.1)).toEqual({ value: 0, roundsToZero: true });
    expect(roundRate(0.4, 1)).toEqual({ value: 0, roundsToZero: true });
  });

  it('sigFigs drops trailing zeros', () => {
    expect(sigFigs(50)).toBe('50');
    expect(sigFigs(47.6190476)).toBe('47.6');
    expect(sigFigs(0.0123456)).toBe('0.0123');
  });

  it('describeMix states every assumption', () => {
    const mix: Mix = { ampAmount: 4, ampUnit: 'mg', ampVolumeMl: 4, nAmps: 4, bagVolumeMl: 100, removedVolumeMl: 16 };
    const m = ok(computeMix(mix));
    expect(describeMix(mix, m, 'mcg')).toBe('4 × 4 mg/4 mL into 100 mL (16 mL removed) = 160 mcg/mL');
  });
});

// Small seeded generator so failures are reproducible.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('properties', () => {
  const rand = rng(12345);
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);

  function randomMix(): Mix {
    const ampVolumeMl = between(0.5, 20);
    const nAmps = between(0.5, 20);
    const bagVolumeMl = between(nAmps * ampVolumeMl + 1, 1000);
    return {
      ampAmount: between(0.1, 500),
      ampUnit: (['mcg', 'mg', 'g'] as const)[Math.floor(rand() * 3)],
      ampVolumeMl,
      nAmps,
      bagVolumeMl,
      removedVolumeMl: rand() < 0.5 ? nAmps * ampVolumeMl : 0,
    };
  }

  it('dose → rate → dose returns the input', () => {
    for (let i = 0; i < 300; i++) {
      const mix = randomMix();
      const dose = between(0.001, 50);
      const weight = between(2, 150);
      const rate = ok(doseToRate(mix, mcgKgMin, dose, weight)).rateMlH;
      expect(ok(rateToDose(mix, mcgKgMin, rate, weight)).dose).toBeCloseTo(dose, 8);
    }
  });

  it('changing the dose unit (mcg/min ↔ mg/h) never changes the rate', () => {
    for (let i = 0; i < 300; i++) {
      const mix = randomMix();
      const mcgPerMin = between(0.1, 500);
      const mgPerH = (mcgPerMin * 60) / 1000;
      const a = ok(doseToRate(mix, mcgMin, mcgPerMin)).rateMlH;
      const b = ok(doseToRate(mix, mgH, mgPerH)).rateMlH;
      expect(b).toBeCloseTo(a, 8);
    }
  });

  it('scaling drug and volumes together leaves the concentration unchanged', () => {
    for (let i = 0; i < 300; i++) {
      const mix = randomMix();
      const k = between(0.5, 4);
      const scaled: Mix = {
        ...mix,
        nAmps: mix.nAmps * k,
        bagVolumeMl: mix.bagVolumeMl * k,
        removedVolumeMl: mix.removedVolumeMl * k,
      };
      const a = ok(computeMix(mix)).concentrationBase;
      const b = ok(computeMix(scaled)).concentrationBase;
      expect(Math.abs(b - a) / a).toBeLessThan(1e-12);
    }
  });
});
