// ── Price engine ─────────────────────────────────────────────────────────────
// Mid prices random-walk every PRICE_TICK_MS. Customers never see mid: every
// price shown and every trigger check uses the customer buy / sell price.

import { ASSETS, type AssetId } from '../config';

export function customerBuyPrice(asset: AssetId, mid: number): number {
  return mid * (1 + ASSETS[asset].markup);
}

export function customerSellPrice(asset: AssetId, mid: number): number {
  return mid * (1 - ASSETS[asset].markup);
}

export function customerPrice(asset: AssetId, mid: number, side: 'buy' | 'sell'): number {
  return side === 'buy' ? customerBuyPrice(asset, mid) : customerSellPrice(asset, mid);
}

/** Inverse: what mid gives this customer buy price. Used by demo "set price". */
export function midFromCustomerBuy(asset: AssetId, buy: number): number {
  return buy / (1 + ASSETS[asset].markup);
}

/** Standard normal sample (Box–Muller). Called outside the reducer so reducers stay pure. */
export function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** One random-walk step. `shock` is a standard normal sample. */
export function stepMid(asset: AssetId, mid: number, shock: number): number {
  const next = mid * (1 + ASSETS[asset].walkVolatility * shock);
  return Math.max(next, 0.01);
}
