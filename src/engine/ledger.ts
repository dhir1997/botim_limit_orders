// ── Ledger helpers ───────────────────────────────────────────────────────────
// Mutating helpers used by the reducer and trigger engine. They always operate
// on a *draft* copy of state (see `begin` in store/reducer.ts), never on the
// live React state.

import { ASSETS, EXPIRY_WARNING_MS, HOUR_MS, LOG_LIMIT, type AssetId } from '../config';
import { COPY } from '../copy';
import type { AppState } from '../store/state';
import type { AppNotification, LogKind, Order, OrderStatus } from '../types';
import { fmtDate } from '../lib/format';
import { isLive, transition } from './orderMachine';
import { customerPrice } from './priceEngine';

export interface Ctx {
  s: AppState;
  /** Simulated "now" (real time + fast-forward offset). */
  now: number;
  realNow: number;
}

export function log(ctx: Ctx, kind: LogKind, msg: string): void {
  const { s } = ctx;
  s.log.push({ id: s.nextId++, simAt: ctx.now, realAt: ctx.realNow, kind, msg });
  if (s.log.length > LOG_LIMIT) s.log.splice(0, s.log.length - LOG_LIMIT);
}

export function notify(ctx: Ctx, n: Omit<AppNotification, 'id' | 'at' | 'read'>): void {
  const { s } = ctx;
  s.notifications.unshift({ ...n, id: `N${s.nextId++}`, at: ctx.now, read: false });
  log(ctx, 'notify', `Notification → "${n.title}"`);
}

export function findOrder(s: AppState, id: string): Order | undefined {
  return s.orders.find(o => o.id === id);
}

/** Apply a state-machine transition to an order in the draft and log it. */
export function move(ctx: Ctx, id: string, to: OrderStatus, note?: string, patch: Partial<Order> = {}): Order {
  const idx = ctx.s.orders.findIndex(o => o.id === id);
  if (idx < 0) throw new Error(`Unknown order ${id}`);
  const before = ctx.s.orders[idx];
  const after = transition(before, to, ctx.now, note, patch);
  ctx.s.orders[idx] = after;
  log(ctx, 'transition', `${id}: ${before.status} → ${to}${note ? ` · ${note}` : ''}`);
  return after;
}

export function todayPrice(s: AppState, asset: AssetId, side: 'buy' | 'sell'): number {
  return customerPrice(asset, s.market[asset].mid, side);
}

/** Grams already committed to live sell orders for an asset. */
export function reservedSellGrams(s: AppState, asset: AssetId, excludeId?: string): number {
  return s.orders
    .filter(o => o.asset === asset && o.side === 'sell' && isLive(o) && o.id !== excludeId)
    .reduce((sum, o) => sum + (o.grams ?? 0), 0);
}

const EPS = 1e-9;

/** Pure preview of which sell orders a holdings drop would cancel (newest first). */
export function previewAutoCancels(s: AppState, asset: AssetId, newHoldings: number): Order[] {
  const live = s.orders
    .filter(o => o.asset === asset && o.side === 'sell' && o.status === 'OPEN')
    .sort((a, b) => b.seq - a.seq);
  let total = reservedSellGrams(s, asset);
  const out: Order[] = [];
  for (const o of live) {
    if (total <= newHoldings + EPS) break;
    out.push(o);
    total -= o.grams ?? 0;
  }
  return out;
}

/**
 * After holdings drop, cancel the NEWEST live sell orders first until the
 * total left in sell orders fits within holdings. Returns cancelled order ids.
 */
export function reconcileSellCap(ctx: Ctx, asset: AssetId): string[] {
  const { s } = ctx;
  const holdings = s.holdings[asset];
  const live = s.orders
    .filter(o => o.asset === asset && o.side === 'sell' && o.status === 'OPEN')
    .sort((a, b) => b.seq - a.seq); // newest first
  let total = reservedSellGrams(s, asset);
  const cancelled: string[] = [];
  for (const o of live) {
    if (total <= holdings + EPS) break;
    move(ctx, o.id, 'AUTO_CANCELLED', COPY.timeline.autoCancelled(holdings), {
      cancelReason: COPY.timeline.autoCancelled(holdings),
    });
    total -= o.grams ?? 0;
    cancelled.push(o.id);
  }
  if (cancelled.length) {
    notifyCancelledBatch(ctx, asset, cancelled, 'auto');
    log(ctx, 'demo', `Sell cap: holdings ${holdings.toFixed(4)} g < orders → auto-cancelled newest first: ${cancelled.join(', ')}`);
  }
  return cancelled;
}

/**
 * One toast + inbox item for all orders cancelled by a single user action,
 * listing each order. `reason` picks the explanation line.
 */
export function notifyCancelledBatch(ctx: Ctx, asset: AssetId, ids: string[], reason: 'auto' | 'replace'): void {
  if (ids.length === 0) return;
  const orders = ids.map(id => findOrder(ctx.s, id)!);
  notify(ctx, {
    kind: reason === 'auto' ? 'auto_cancelled' : 'cancelled',
    title: COPY.notif.batchTitle(orders.length),
    body: [
      reason === 'auto' ? COPY.notif.batchReasonAuto(asset) : COPY.notif.batchReasonReplace(asset),
      ...orders.map(o => COPY.notif.batchLine(o.asset, o.grams ?? 0, o.limitPrice)),
    ].join('\n'),
    asset,
    orderId: orders.length === 1 ? orders[0].id : undefined,
    cta: orders.length === 1
      ? { type: 'view_order', orderId: orders[0].id, label: COPY.notif.ctaViewOrder }
      : { type: 'view_orders', asset, label: COPY.notif.ctaViewCancelled },
  });
}

/** EXPIRED transitions and the one-time "ends in 24h" warning. */
export function sweepExpiry(ctx: Ctx): void {
  const { s, now } = ctx;
  for (const o of [...s.orders]) {
    if (o.status !== 'OPEN') continue;
    if (now >= o.expiresAt) {
      move(ctx, o.id, 'EXPIRED', COPY.timeline.expired);
      notify(ctx, {
        kind: 'expired',
        title: COPY.notif.expiredTitle,
        body: COPY.notif.expiredBody(o.side, o.asset, o.limitPrice),
        asset: o.asset,
        orderId: o.id,
        cta: { type: 'set_price', asset: o.asset, side: o.side, label: COPY.notif.ctaSetPrice },
      });
      continue;
    }
    // Warn once when under 24h remain — but not for an order placed moments ago.
    const remaining = o.expiresAt - now;
    if (!o.expiryWarned && remaining < EXPIRY_WARNING_MS && now - o.createdAt >= HOUR_MS) {
      const idx = s.orders.findIndex(x => x.id === o.id);
      s.orders[idx] = { ...s.orders[idx], expiryWarned: true };
      notify(ctx, {
        kind: 'expiring',
        title: COPY.notif.expiringTitle,
        body: COPY.notif.expiringBody(o.side, o.asset, o.limitPrice),
        asset: o.asset,
        orderId: o.id,
        cta: { type: 'view_order', orderId: o.id, label: COPY.notif.ctaViewOrder },
      });
    }
  }
}

export function notifyPlaced(ctx: Ctx, o: Order): void {
  notify(ctx, {
    kind: 'placed',
    title: COPY.notif.placedTitle,
    body: COPY.notif.placedBody(o.side, o.asset, o.limitPrice, fmtDate(o.expiresAt)),
    asset: o.asset,
    orderId: o.id,
    cta: { type: 'view_order', orderId: o.id, label: COPY.notif.ctaViewOrder },
  });
}

export function roundPrice(asset: AssetId, p: number): number {
  const f = 10 ** ASSETS[asset].priceDecimals;
  return Math.round(p * f) / f;
}
