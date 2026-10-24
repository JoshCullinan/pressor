import type { AmountUnit, TimeUnit } from './units';

/** What is in the bag. Every value comes from the clinician. */
export interface Mix {
  /** Ampoule strength as printed on the label: `ampAmount` `ampUnit` in `ampVolumeMl` mL. */
  ampAmount: number;
  ampUnit: AmountUnit;
  ampVolumeMl: number;
  /** Decimals allowed (a part-ampoule). */
  nAmps: number;
  /** Fluid in the bag before anything is removed. */
  bagVolumeMl: number;
  /** Fluid taken out of the bag before the drug is added. */
  removedVolumeMl: number;
}

/** The form a dose is expressed in, e.g. mcg/kg/min. */
export interface DoseUnit {
  unit: AmountUnit;
  perKg: boolean;
  per: TimeUnit;
}

export type EngineErrorCode =
  | 'invalid-input'
  | 'unit-mismatch'
  | 'removed-exceeds-bag'
  | 'final-volume-not-positive'
  | 'weight-required';

export interface EngineError {
  code: EngineErrorCode;
  /** Name of the offending input, when one applies. */
  field?: string;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };

export type Notice = {
  code: 'final-volume-differs';
  finalVolumeMl: number;
  bagVolumeMl: number;
};

export interface MixResult {
  /** Total drug in the bag, in the ampoule's unit. */
  drugTotal: number;
  drugVolumeMl: number;
  finalVolumeMl: number;
  /** Drug per mL in base units (mcg/mL for mass drugs, units/mL otherwise). */
  concentrationBase: number;
  notices: Notice[];
}
