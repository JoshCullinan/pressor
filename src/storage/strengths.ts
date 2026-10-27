import { AMOUNT_UNITS, sigFigs, type AmountUnit } from '../engine';

/** An ampoule strength the clinician has used before: `amount unit in volumeMl mL`. */
export interface StoredStrength {
  amount: number;
  unit: AmountUnit;
  volumeMl: number;
  /** When it was last used, in ms since the epoch. */
  usedAt: number;
}

/** Remembered strengths, newest first, filed under a drug key (see `drugKey`). */
export type StrengthStore = Record<string, StoredStrength[]>;

export const MAX_PER_DRUG = 3;

const same = (a: StoredStrength, b: Pick<StoredStrength, 'amount' | 'unit' | 'volumeMl'>) =>
  a.amount === b.amount && a.unit === b.unit && a.volumeMl === b.volumeMl;

/** Add a strength as the newest for its drug. A repeat moves to the front; only the latest few are kept. */
export function rememberStrength(
  store: StrengthStore,
  key: string,
  strength: Pick<StoredStrength, 'amount' | 'unit' | 'volumeMl'>,
  now: number,
): StrengthStore {
  const others = (store[key] ?? []).filter((s) => !same(s, strength));
  const next = [{ ...strength, usedAt: now }, ...others].slice(0, MAX_PER_DRUG);
  return { ...store, [key]: next };
}

export function recentStrengths(store: StrengthStore, key: string): StoredStrength[] {
  return store[key] ?? [];
}

export function describeStrength(s: Pick<StoredStrength, 'amount' | 'unit' | 'volumeMl'>): string {
  return `${sigFigs(s.amount)} ${s.unit} in ${sigFigs(s.volumeMl)} mL`;
}

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago", "3 weeks ago", "4 months ago". */
export function ageLabel(now: number, then: number): string {
  const sec = Math.max(0, Math.round((now - then) / 1000));
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'} ago`;
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return plural(min, 'minute');
  const hours = Math.floor(min / 60);
  if (hours < 24) return plural(hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 14) return plural(days, 'day');
  if (days < 60) return plural(Math.floor(days / 7), 'week');
  return plural(Math.floor(days / 30), 'month');
}

/** Read stored JSON defensively: anything malformed is dropped rather than trusted. */
export function parseStore(raw: unknown): StrengthStore {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: StrengthStore = {};
  for (const [key, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const valid = list
      .filter(
        (s): s is StoredStrength =>
          typeof s === 'object' &&
          s !== null &&
          typeof s.amount === 'number' &&
          s.amount > 0 &&
          Number.isFinite(s.amount) &&
          AMOUNT_UNITS.includes(s.unit) &&
          typeof s.volumeMl === 'number' &&
          s.volumeMl > 0 &&
          Number.isFinite(s.volumeMl) &&
          typeof s.usedAt === 'number' &&
          Number.isFinite(s.usedAt),
      )
      .slice(0, MAX_PER_DRUG);
    if (valid.length > 0) out[key] = valid;
  }
  return out;
}
