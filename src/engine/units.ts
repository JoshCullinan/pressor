export type MassUnit = 'mcg' | 'mg' | 'g';
export type AmountUnit = MassUnit | 'units';
export type TimeUnit = 'min' | 'h';
export type UnitFamily = 'mass' | 'units';

export const AMOUNT_UNITS: readonly AmountUnit[] = ['mcg', 'mg', 'g', 'units'];

// Base units: mcg for the mass family, units for the units family.
const TO_BASE: Record<AmountUnit, number> = {
  mcg: 1,
  mg: 1_000,
  g: 1_000_000,
  units: 1,
};

export function unitFamily(unit: AmountUnit): UnitFamily {
  return unit === 'units' ? 'units' : 'mass';
}

export function toBase(amount: number, unit: AmountUnit): number {
  return amount * TO_BASE[unit];
}

export function fromBase(base: number, unit: AmountUnit): number {
  return base / TO_BASE[unit];
}

export function perHour(time: TimeUnit): number {
  return time === 'min' ? 60 : 1;
}
