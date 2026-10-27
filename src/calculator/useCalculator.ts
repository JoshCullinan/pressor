import { useCallback, useEffect, useMemo, useState } from 'react';
import { findDrug, drugKey, parseDoseUnit } from '../data/drugs';
import type { AmountUnit, DoseUnit } from '../engine';
import { useSettings, useStrengthMemory } from '../storage/persist';
import { recentStrengths, type StoredStrength } from '../storage/strengths';
import { evaluate, initialForm, type FormState } from './evaluate';
import { parseNumber } from './parse';

export function useCalculator() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [strengthFocused, setStrengthFocused] = useState(false);
  const memory = useStrengthMemory();
  const { settings, setPumpStep } = useSettings();

  const patch = useCallback((p: Partial<FormState>) => setForm((f) => ({ ...f, ...p })), []);

  /** Any edit to the strength is the clinician reading the ampoule, so it counts as confirmed. */
  const editStrength = useCallback(
    (p: Partial<Pick<FormState, 'ampAmount' | 'ampUnit' | 'ampVolume'>>) =>
      setForm((f) => ({ ...f, ...p, strengthConfirmed: true, strengthUsedAt: null })),
    [],
  );

  const confirmStrength = useCallback(
    () => setForm((f) => ({ ...f, strengthConfirmed: true, strengthUsedAt: null })),
    [],
  );

  const applyStrength = useCallback(
    (s: StoredStrength) =>
      setForm((f) => ({
        ...f,
        ampAmount: String(s.amount),
        ampUnit: s.unit,
        ampVolume: String(s.volumeMl),
        strengthConfirmed: true,
        strengthUsedAt: null,
      })),
    [],
  );

  const setDoseUnit = useCallback((p: Partial<DoseUnit>) => setForm((f) => ({ ...f, doseUnit: { ...f.doseUnit, ...p } })), []);

  /**
   * The drug label was picked or typed. Switching to a different drug clears the strength so one drug's
   * ampoule is never carried over silently; the newest remembered strength for the new drug is pre-filled
   * as unconfirmed.
   */
  const selectDrug = useCallback(
    (label: string) => {
      setForm((f) => {
        const drug = findDrug(label);
        const key = drugKey(label);
        const oldKey = drugKey(f.drugLabel);
        const next: FormState = { ...f, drugLabel: drug ? drug.name : label.trim() };
        // Same drug, or the label was cleared: leave the strength alone.
        if (key === oldKey || key === '') return next;

        const du = drug?.defaultDoseUnit ? parseDoseUnit(drug.defaultDoseUnit) : undefined;
        if (du) next.doseUnit = du;

        const strengthEmpty = f.ampAmount === '' && f.ampVolume === '';
        if (oldKey !== '' || strengthEmpty) {
          const latest = key ? recentStrengths(memory.store, key)[0] : undefined;
          next.ampAmount = latest ? String(latest.amount) : '';
          next.ampVolume = latest ? String(latest.volumeMl) : '';
          if (latest) next.ampUnit = latest.unit;
          next.strengthConfirmed = !latest;
          next.strengthUsedAt = latest ? latest.usedAt : null;
        }
        return next;
      });
    },
    [memory.store],
  );

  const reset = useCallback(() => setForm(initialForm), []);

  const evaluation = useMemo(() => evaluate(form, settings.pumpStep), [form, settings.pumpStep]);

  // Remember a strength once it has produced a result and the clinician has stopped editing it.
  const key = drugKey(form.drugLabel);
  const { remember, loaded } = memory;
  useEffect(() => {
    if (!loaded || key === '' || strengthFocused || evaluation.status !== 'ok') return;
    const amount = parseNumber(form.ampAmount);
    const volumeMl = parseNumber(form.ampVolume);
    if (!(amount !== undefined && amount > 0 && volumeMl !== undefined && volumeMl > 0)) return;
    const t = setTimeout(() => remember(key, { amount, unit: form.ampUnit as AmountUnit, volumeMl }), 800);
    return () => clearTimeout(t);
  }, [loaded, key, strengthFocused, evaluation.status, form.ampAmount, form.ampUnit, form.ampVolume, remember]);

  const recents = key ? recentStrengths(memory.store, key) : [];

  return {
    form,
    patch,
    editStrength,
    confirmStrength,
    applyStrength,
    setDoseUnit,
    selectDrug,
    reset,
    evaluation,
    recents,
    setStrengthFocused,
    pumpStep: settings.pumpStep,
    setPumpStep,
  };
}
