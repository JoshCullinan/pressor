import { describe, expect, it } from 'vitest';
import { DRUGS, doseUnitLabel, drugKey, findDrug, parseDoseUnit, searchDrugs } from '../drugs';

describe('drug list', () => {
  it('holds names, aliases and a dose unit only: no strengths or ranges', () => {
    for (const d of DRUGS) {
      expect(Object.keys(d).sort()).toEqual(['aliases', 'defaultDoseUnit', 'name']);
      expect(parseDoseUnit(d.defaultDoseUnit!)).toBeDefined();
    }
  });

  it('finds a drug by name or alias, ignoring case and spaces', () => {
    expect(findDrug('adrenaline')?.name).toBe('Adrenaline');
    expect(findDrug('  EPINEPHRINE ')?.name).toBe('Adrenaline');
    expect(findDrug('Norepinephrine')?.name).toBe('Noradrenaline');
    expect(findDrug('adren')).toBeUndefined();
    expect(findDrug('')).toBeUndefined();
  });

  it('searches by prefix first, then substring, across aliases', () => {
    expect(searchDrugs('')).toHaveLength(DRUGS.length);
    expect(searchDrugs('ad').map((d) => d.name)[0]).toBe('Adrenaline');
    expect(searchDrugs('epi').map((d) => d.name)).toContain('Adrenaline');
    expect(searchDrugs('adrenaline').map((d) => d.name)).toEqual(['Adrenaline', 'Noradrenaline']);
    expect(searchDrugs('zzz')).toEqual([]);
  });

  it('files an alias under the canonical drug, and unknown text under itself', () => {
    expect(drugKey('Epinephrine')).toBe('adrenaline');
    expect(drugKey('adrenaline')).toBe('adrenaline');
    expect(drugKey('  My Custom Drug ')).toBe('my custom drug');
    expect(drugKey('')).toBe('');
  });
});

describe('dose units', () => {
  it('parses and prints them', () => {
    expect(parseDoseUnit('mcg/kg/min')).toEqual({ unit: 'mcg', perKg: true, per: 'min' });
    expect(parseDoseUnit('mg/h')).toEqual({ unit: 'mg', perKg: false, per: 'h' });
    expect(parseDoseUnit('units/h')).toEqual({ unit: 'units', perKg: false, per: 'h' });
    expect(doseUnitLabel({ unit: 'mcg', perKg: true, per: 'min' })).toBe('mcg/kg/min');
    expect(doseUnitLabel({ unit: 'units', perKg: false, per: 'h' })).toBe('units/h');
  });

  it('rejects anything malformed', () => {
    for (const bad of ['', 'mcg', 'mcg/kg', 'mcg/lb/min', 'ml/h', 'mcg/min/kg', 'mcg/kg/day']) {
      expect(parseDoseUnit(bad)).toBeUndefined();
    }
  });
});
