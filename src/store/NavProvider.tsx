import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AssetId } from '../config';
import type { TicketDraft } from '../types';

/** Values to prefill on the "At my price" tab. */
export type TicketPrefill = Partial<Pick<TicketDraft, 'limitPrice' | 'amountAed' | 'grams' | 'validityDays'>>;

export type BuyTab = 'now' | 'monthly' | 'price';
export type SellTab = 'now' | 'price';

export type Route =
  | { name: 'asset' }
  | { name: 'portfolio' }
  | { name: 'inbox' }
  /** Buy flow. `amountAed`/`method` prefill "Buy now"; `prefill` fills "At my price". */
  | { name: 'buy'; asset: AssetId; tab?: BuyTab; amountAed?: number; method?: 'wallet' | 'card'; fromOrderId?: string; prefill?: TicketPrefill }
  /** Sell flow. `grams` prefills "Sell now"; `prefill` fills "At my price". */
  | { name: 'sell'; asset: AssetId; tab?: SellTab; grams?: number; prefill?: TicketPrefill }
  | { name: 'review'; draft: TicketDraft }
  | { name: 'payment'; draft: TicketDraft }
  | { name: 'placing'; orderId: string; draft: TicketDraft }
  | { name: 'authFailed'; draft: TicketDraft }
  | { name: 'placed'; orderId: string }
  | { name: 'orders'; asset?: AssetId; tab?: 'open' | 'history' }
  | { name: 'orderDetail'; orderId: string }
  | { name: 'marketResult'; tradeId: string };

export type RootTab = 'asset' | 'portfolio' | 'inbox';

interface NavValue {
  route: Route;
  /** Full stack. Screens below the top stay mounted (hidden) so going back keeps their state. */
  stack: Entry[];
  depth: number;
  push: (r: Route) => void;
  pop: () => void;
  replace: (r: Route) => void;
  /** Reset to a root tab, optionally pushing one screen on top. */
  reset: (root: RootTab, then?: Route) => void;
  asset: AssetId;
  setAsset: (a: AssetId) => void;
}

const NavContext = createContext<NavValue | null>(null);

export interface Entry { route: Route; key: number }
let nextKey = 1;
const entry = (route: Route): Entry => ({ route, key: nextKey++ });

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Entry[]>(() => [entry({ name: 'asset' })]);
  const [asset, setAsset] = useState<AssetId>('gold');

  const push = useCallback((r: Route) => setStack(s => [...s, entry(r)]), []);
  const pop = useCallback(() => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const replace = useCallback((r: Route) => setStack(s => [...s.slice(0, -1), entry(r)]), []);
  const reset = useCallback((root: RootTab, then?: Route) => {
    setStack(then ? [entry({ name: root }), entry(then)] : [entry({ name: root })]);
  }, []);

  const value = useMemo(
    () => ({ stack, route: stack[stack.length - 1].route, depth: stack.length, push, pop, replace, reset, asset, setAsset }),
    [stack, push, pop, replace, reset, asset],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavValue {
  const v = useContext(NavContext);
  if (!v) throw new Error('useNav outside NavProvider');
  return v;
}
