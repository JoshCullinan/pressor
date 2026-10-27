import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { PumpStep } from '../engine';
import { rememberStrength, parseStore, type StoredStrength, type StrengthStore } from './strengths';

// Storage can fail (private mode, blocked data, full disk). The app must still work without it.
async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore: nothing to do but carry on without remembering
  }
}

const STRENGTHS_KEY = 'pressor.strengths.v1';
const SETTINGS_KEY = 'pressor.settings.v1';

/** Ampoule strengths used before, per drug. Never holds weight, doses or anything about a patient. */
export function useStrengthMemory() {
  const [store, setStore] = useState<StrengthStore>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    readJson(STRENGTHS_KEY).then((raw) => {
      if (!alive) return;
      setStore(parseStore(raw));
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const remember = useCallback((key: string, strength: Pick<StoredStrength, 'amount' | 'unit' | 'volumeMl'>) => {
    setStore((prev) => {
      const next = rememberStrength(prev, key, strength, Date.now());
      void writeJson(STRENGTHS_KEY, next);
      return next;
    });
  }, []);

  return { store, loaded, remember };
}

export interface Settings {
  pumpStep: PumpStep;
}

const DEFAULT_SETTINGS: Settings = { pumpStep: 0.1 };

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let alive = true;
    readJson(SETTINGS_KEY).then((raw) => {
      if (!alive || typeof raw !== 'object' || raw === null) return;
      const step = (raw as Partial<Settings>).pumpStep;
      if (step === 0.1 || step === 1) setSettings({ pumpStep: step });
    });
    return () => {
      alive = false;
    };
  }, []);

  const setPumpStep = useCallback((pumpStep: PumpStep) => {
    setSettings((prev) => {
      const next = { ...prev, pumpStep };
      void writeJson(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  return { settings, setPumpStep };
}
