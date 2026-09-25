// ── Demo presets ─────────────────────────────────────────────────────────────
// Each preset resets state, arranges a scenario, and points the phone at the
// right screen. Prices are paused so the scenario stays put until you act.

import { HOUR_MS } from '../config';
import { newOrderId } from '../lib/ids';
import type { Action } from '../store/reducer';
import type { Route, RootTab } from '../store/NavProvider';

interface Deps {
  dispatch: (a: Action) => void;
  reset: (root: RootTab, then?: Route) => void;
  setAsset: (a: 'gold' | 'silver') => void;
}

export interface Preset {
  key: string;
  label: string;
  description: string;
  run: (d: Deps) => void;
}

const now = () => Date.now();

export const PRESETS: Preset[] = [
  {
    key: 'fifo',
    label: '2 buys, same price, wallet covers 1',
    description: 'Two AED 100 gold buys at the same price, wallet AED 150. Oldest fills; the second fails for balance.',
    run: ({ dispatch, reset, setAsset }) => {
      const a = newOrderId();
      const b = newOrderId();
      dispatch({ type: 'RESET', realNow: now() });
      dispatch({ type: 'DEMO_TOGGLE_PAUSE', asset: 'gold', paused: true, realNow: now() });
      dispatch({ type: 'DEMO_SET_WALLET', aed: 150, realNow: now() });
      dispatch({
        type: 'DEMO_INJECT_ORDERS',
        realNow: now(),
        specs: [
          { id: a, asset: 'gold', side: 'buy', offset: -0.005, amountAed: 100, validityDays: 7, paymentMethod: 'wallet', createdAgoMs: 2 * 60_000 },
          { id: b, asset: 'gold', side: 'buy', offset: -0.005, amountAed: 100, validityDays: 7, paymentMethod: 'wallet', createdAgoMs: 60_000 },
        ],
      });
      dispatch({ type: 'DEMO_LOG', msg: `Preset: FIFO — ${a} (older) and ${b} (newer), wallet AED 150`, realNow: now() });
      dispatch({ type: 'DEMO_HINT', hint: `Press Gold "−1%" — on the next check ${a} fills first, then ${b} fails (not enough balance).` });
      setAsset('gold');
      reset('asset', { name: 'orders', asset: 'gold' });
    },
  },
  {
    key: 'lifo',
    label: 'Manual sell cancels newest sell orders',
    description: 'Holdings 2 g gold, three 0.5 g sell orders. A manual sell of 1.2 g leaves 0.8 g → the two newest are cancelled.',
    run: ({ dispatch, reset, setAsset }) => {
      const ids = [newOrderId(), newOrderId(), newOrderId()];
      dispatch({ type: 'RESET', realNow: now() });
      dispatch({ type: 'DEMO_TOGGLE_PAUSE', asset: 'gold', paused: true, realNow: now() });
      dispatch({ type: 'DEMO_SET_HOLDINGS', asset: 'gold', grams: 2, realNow: now() });
      dispatch({
        type: 'DEMO_INJECT_ORDERS',
        realNow: now(),
        specs: ids.map((id, i) => ({
          id, asset: 'gold' as const, side: 'sell' as const, offset: 0.03 + i * 0.01, grams: 0.5, validityDays: 30,
          createdAgoMs: (3 - i) * 60_000,
        })),
      });
      dispatch({ type: 'DEMO_LOG', msg: `Preset: LIFO — sell orders ${ids.join(', ')} (oldest → newest)`, realNow: now() });
      dispatch({ type: 'DEMO_HINT', hint: `Sell flow is open with 1.2 g. Tap "Sell now": the warning lists ${ids[2]} and ${ids[1]}; ${ids[0]} stays open. On "At my price", 100% → "Cancel them and sell all" stages the cancellation until you place the order.` });
      setAsset('gold');
      reset('asset', { name: 'sell', asset: 'gold', grams: 1.2 });
    },
  },
  {
    key: 'expiry',
    label: 'Order about to expire',
    description: 'A 1-day gold buy placed 23½ hours ago. Next check sends "ends soon"; fast-forward +1 hour to expire it.',
    run: ({ dispatch, reset, setAsset }) => {
      const id = newOrderId();
      dispatch({ type: 'RESET', realNow: now() });
      dispatch({ type: 'DEMO_TOGGLE_PAUSE', asset: 'gold', paused: true, realNow: now() });
      dispatch({
        type: 'DEMO_INJECT_ORDERS',
        realNow: now(),
        specs: [{ id, asset: 'gold', side: 'buy', offset: -0.05, amountAed: 100, validityDays: 1, paymentMethod: 'wallet', createdAgoMs: 23.5 * HOUR_MS }],
      });
      dispatch({ type: 'DEMO_LOG', msg: `Preset: expiry — ${id} ends in 30 min`, realNow: now() });
      dispatch({ type: 'DEMO_HINT', hint: 'Wait for the next check ("ends soon" notification), then press Fast-forward "+1 hour" to expire it.' });
      setAsset('gold');
      reset('asset', { name: 'orderDetail', orderId: id });
    },
  },
];
