import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { unit2 } from '../data/unit2';
import { DEFAULT_THRESHOLDS } from './grading';
import { DEFAULT_EQUIPPED, DEFAULT_OWNED } from './pirates';
import type { AppState } from './types';

const STORAGE_KEY = 'english-exam-trainer:v1';

export function defaultState(): AppState {
  return {
    version: 1,
    units: [structuredClone(unit2)],
    activeUnitId: unit2.id,
    results: [],
    decks: {},
    weak: {},
    xp: 0,
    badges: {},
    learnDays: [],
    settings: { thresholds: { ...DEFAULT_THRESHOLDS }, pin: null, learnMinutes: 10, goalWithBonus: false },
    heroId: null,
    goldSpent: 0,
    owned: [...DEFAULT_OWNED],
    equipped: { ...DEFAULT_EQUIPPED },
  };
}

/** Reads saved data; unknown or broken data falls back to defaults field by field. */
export function loadState(raw: string | null): AppState {
  const base = defaultState();
  if (!raw) return base;
  try {
    const saved = JSON.parse(raw) as Partial<AppState>;
    if (saved.version !== 1) return base;
    const state: AppState = {
      ...base,
      ...saved,
      settings: { ...base.settings, ...saved.settings, thresholds: { ...base.settings.thresholds, ...saved.settings?.thresholds } },
    };
    state.equipped = { ...base.equipped, ...saved.equipped };
    if (!state.units?.length) state.units = base.units;
    if (!state.units.some((u) => u.id === state.activeUnitId)) state.activeUnitId = state.units[0].id;
    return state;
  } catch {
    return base;
  }
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

interface Store {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  replace: (s: AppState) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState(readStorage()));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the app keeps working for this session.
    }
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);
  const replace = useCallback((s: AppState) => setState(s), []);
  return <StoreContext.Provider value={{ state, update, replace }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export function activeUnit(state: AppState) {
  return state.units.find((u) => u.id === state.activeUnitId) ?? state.units[0];
}
