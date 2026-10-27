import type { AmountUnit, DoseUnit, TimeUnit } from '../engine';
import { AMOUNT_UNITS } from '../engine';
import drugList from './drugs.json';

export interface Drug {
  name: string;
  aliases: string[];
  /** A convenience for the first-open state only, e.g. "mcg/kg/min". The clinician can change it. */
  defaultDoseUnit?: string;
}

export const DRUGS: readonly Drug[] = drugList;

const norm = (s: string) => s.trim().toLowerCase();

/** Exact match on name or alias, ignoring case. */
export function findDrug(label: string): Drug | undefined {
  const n = norm(label);
  if (n === '') return undefined;
  return DRUGS.find((d) => norm(d.name) === n || d.aliases.some((a) => norm(a) === n));
}

/** Drugs whose name or alias starts with, or contains, the query. Everything when the query is blank. */
export function searchDrugs(query: string): Drug[] {
  const n = norm(query);
  if (n === '') return [...DRUGS];
  const names = (d: Drug) => [d.name, ...d.aliases].map(norm);
  const starts = DRUGS.filter((d) => names(d).some((x) => x.startsWith(n)));
  const contains = DRUGS.filter((d) => !starts.includes(d) && names(d).some((x) => x.includes(n)));
  return [...starts, ...contains];
}

/** Key that remembered strengths are filed under: the canonical name for a known drug, else the typed text. */
export function drugKey(label: string): string {
  const drug = findDrug(label);
  return norm(drug ? drug.name : label);
}

/** Parse "mcg/kg/min", "mg/h", "units/h". Returns undefined for anything else. */
export function parseDoseUnit(text: string): DoseUnit | undefined {
  const parts = text.split('/');
  const unit = parts[0] as AmountUnit;
  if (!AMOUNT_UNITS.includes(unit)) return undefined;
  const perKg = parts.length === 3;
  if (parts.length !== 2 && parts.length !== 3) return undefined;
  if (perKg && parts[1] !== 'kg') return undefined;
  const per = parts[parts.length - 1];
  if (per !== 'min' && per !== 'h') return undefined;
  return { unit, perKg, per: per as TimeUnit };
}

export function doseUnitLabel(du: DoseUnit): string {
  return `${du.unit}${du.perKg ? '/kg' : ''}/${du.per}`;
}
