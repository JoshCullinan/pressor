import { describe, expect, it } from 'vitest';
import {
  MAX_PER_DRUG,
  ageLabel,
  describeStrength,
  parseStore,
  recentStrengths,
  rememberStrength,
  type StrengthStore,
} from '../strengths';

const mg = (amount: number, volumeMl: number) => ({ amount, unit: 'mg' as const, volumeMl });

describe('rememberStrength', () => {
  it('puts the newest first and stamps the time', () => {
    let s: StrengthStore = {};
    s = rememberStrength(s, 'noradrenaline', mg(4, 4), 1000);
    s = rememberStrength(s, 'noradrenaline', mg(1, 1), 2000);
    expect(recentStrengths(s, 'noradrenaline')).toEqual([
      { amount: 1, unit: 'mg', volumeMl: 1, usedAt: 2000 },
      { amount: 4, unit: 'mg', volumeMl: 4, usedAt: 1000 },
    ]);
  });

  it('moves a repeat to the front instead of duplicating it', () => {
    let s: StrengthStore = {};
    s = rememberStrength(s, 'a', mg(4, 4), 1);
    s = rememberStrength(s, 'a', mg(1, 1), 2);
    s = rememberStrength(s, 'a', mg(4, 4), 3);
    expect(recentStrengths(s, 'a').map((x) => [x.amount, x.usedAt])).toEqual([
      [4, 3],
      [1, 2],
    ]);
  });

  it('treats a different unit as a different strength', () => {
    let s: StrengthStore = {};
    s = rememberStrength(s, 'a', mg(1, 1), 1);
    s = rememberStrength(s, 'a', { amount: 1, unit: 'mcg', volumeMl: 1 }, 2);
    expect(recentStrengths(s, 'a')).toHaveLength(2);
  });

  it('keeps only the latest few per drug and leaves other drugs alone', () => {
    let s: StrengthStore = {};
    s = rememberStrength(s, 'other', mg(9, 9), 0);
    for (let i = 1; i <= MAX_PER_DRUG + 2; i++) s = rememberStrength(s, 'a', mg(i, 1), i);
    expect(recentStrengths(s, 'a').map((x) => x.amount)).toEqual([5, 4, 3]);
    expect(recentStrengths(s, 'other')).toHaveLength(1);
  });

  it('does not mutate the store it was given', () => {
    const before: StrengthStore = { a: [{ ...mg(1, 1), usedAt: 1 }] };
    const copy = JSON.parse(JSON.stringify(before));
    rememberStrength(before, 'a', mg(2, 2), 2);
    expect(before).toEqual(copy);
  });

  it('returns nothing for an unknown drug', () => {
    expect(recentStrengths({}, 'nope')).toEqual([]);
  });
});

describe('describeStrength', () => {
  it('prints the label form', () => {
    expect(describeStrength(mg(4, 4))).toBe('4 mg in 4 mL');
    expect(describeStrength({ amount: 0.5, unit: 'units', volumeMl: 2 })).toBe('0.5 units in 2 mL');
  });
});

describe('ageLabel', () => {
  const now = 1_000_000_000_000;
  const ago = (ms: number) => ageLabel(now, now - ms);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it('reads naturally at each scale', () => {
    expect(ago(0)).toBe('just now');
    expect(ago(59_000)).toBe('just now');
    expect(ago(MIN)).toBe('1 minute ago');
    expect(ago(5 * MIN)).toBe('5 minutes ago');
    expect(ago(HOUR)).toBe('1 hour ago');
    expect(ago(23 * HOUR)).toBe('23 hours ago');
    expect(ago(DAY)).toBe('1 day ago');
    expect(ago(3 * DAY)).toBe('3 days ago');
    expect(ago(14 * DAY)).toBe('2 weeks ago');
    expect(ago(59 * DAY)).toBe('8 weeks ago');
    expect(ago(60 * DAY)).toBe('2 months ago');
    expect(ago(400 * DAY)).toBe('13 months ago');
  });

  it('never goes negative if the clock moved', () => {
    expect(ageLabel(now, now + 5 * DAY)).toBe('just now');
  });
});

describe('parseStore', () => {
  it('keeps well-formed entries', () => {
    const good = { a: [{ amount: 1, unit: 'mg', volumeMl: 1, usedAt: 5 }] };
    expect(parseStore(good)).toEqual(good);
  });

  it('drops anything malformed instead of trusting it', () => {
    expect(parseStore(null)).toEqual({});
    expect(parseStore('x')).toEqual({});
    expect(parseStore([])).toEqual({});
    expect(
      parseStore({
        a: [
          { amount: -1, unit: 'mg', volumeMl: 1, usedAt: 1 },
          { amount: 1, unit: 'lb', volumeMl: 1, usedAt: 1 },
          { amount: 1, unit: 'mg', volumeMl: 0, usedAt: 1 },
          { amount: '1', unit: 'mg', volumeMl: 1, usedAt: 1 },
          { amount: 2, unit: 'mg', volumeMl: 2, usedAt: 1 },
        ],
        b: 'nope',
        c: [],
      }),
    ).toEqual({ a: [{ amount: 2, unit: 'mg', volumeMl: 2, usedAt: 1 }] });
  });
});
