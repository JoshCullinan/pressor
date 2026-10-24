import type { EngineError, Mix, MixResult, Notice, Result } from './types';
import { toBase } from './units';

export function fail(code: EngineError['code'], message: string, field?: string): { ok: false; error: EngineError } {
  return { ok: false, error: { code, message, field } };
}

export function positive(field: string, value: number): { ok: false; error: EngineError } | null {
  if (!Number.isFinite(value) || value <= 0) {
    return fail('invalid-input', `${field} must be a number greater than zero`, field);
  }
  return null;
}

/** Volume removed when the clinician replaces what they add, which is the common practice. */
export function replacedVolumeMl(nAmps: number, ampVolumeMl: number): number {
  return nAmps * ampVolumeMl;
}

export function computeMix(mix: Mix): Result<MixResult> {
  const bad =
    positive('ampAmount', mix.ampAmount) ??
    positive('ampVolumeMl', mix.ampVolumeMl) ??
    positive('nAmps', mix.nAmps) ??
    positive('bagVolumeMl', mix.bagVolumeMl);
  if (bad) return bad;

  if (!Number.isFinite(mix.removedVolumeMl) || mix.removedVolumeMl < 0) {
    return fail('invalid-input', 'removedVolumeMl must be zero or more', 'removedVolumeMl');
  }
  if (mix.removedVolumeMl > mix.bagVolumeMl) {
    return fail('removed-exceeds-bag', 'Volume removed is larger than the bag', 'removedVolumeMl');
  }

  const drugTotal = mix.nAmps * mix.ampAmount;
  const drugVolumeMl = mix.nAmps * mix.ampVolumeMl;
  const finalVolumeMl = mix.bagVolumeMl - mix.removedVolumeMl + drugVolumeMl;
  if (!(finalVolumeMl > 0)) {
    return fail('final-volume-not-positive', 'Final bag volume must be greater than zero');
  }

  const notices: Notice[] = [];
  if (!nearlyEqual(finalVolumeMl, mix.bagVolumeMl)) {
    notices.push({ code: 'final-volume-differs', finalVolumeMl, bagVolumeMl: mix.bagVolumeMl });
  }

  return {
    ok: true,
    value: {
      drugTotal,
      drugVolumeMl,
      finalVolumeMl,
      concentrationBase: toBase(drugTotal, mix.ampUnit) / finalVolumeMl,
      notices,
    },
  };
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}
