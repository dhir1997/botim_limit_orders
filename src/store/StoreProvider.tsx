import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { ASSET_IDS, PRICE_TICK_MS, type AssetId } from '../config';
import { gaussian } from '../engine/priceEngine';
import { reducer, type Action } from './reducer';
import { initialState, type AppState } from './state';

interface StoreValue {
  state: AppState;
  dispatch: (a: Action) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(Date.now()));

  // Price engine: random walk every PRICE_TICK_MS (24x7, no market hours).
  useEffect(() => {
    const t = setInterval(() => {
      const shocks = Object.fromEntries(ASSET_IDS.map(a => [a, gaussian()])) as Record<AssetId, number>;
      dispatch({ type: 'PRICE_TICK', shocks, realNow: Date.now() });
    }, PRICE_TICK_MS);
    return () => clearInterval(t);
  }, []);

  // Trigger engine: orders are only evaluated on poll ticks.
  useEffect(() => {
    const t = setInterval(() => {
      const rands = Array.from({ length: 64 }, () => Math.random());
      dispatch({ type: 'POLL_TICK', rands, realNow: Date.now() });
    }, state.settings.pollIntervalMs);
    return () => clearInterval(t);
  }, [state.settings.pollIntervalMs]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

/** Simulated "now" (real clock + fast-forward), refreshed every second. */
export function useSimNow(): number {
  const { state } = useStore();
  const [real, setReal] = useState(Date.now());
  const ref = useRef<number>();
  useEffect(() => {
    ref.current = window.setInterval(() => setReal(Date.now()), 1000);
    return () => clearInterval(ref.current);
  }, []);
  return real + state.clockOffsetMs;
}

