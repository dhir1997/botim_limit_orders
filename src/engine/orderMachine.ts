// ── Order state machine ──────────────────────────────────────────────────────
// The ONLY place an order's status changes. Every change is validated against
// the transition table and appended to the order's timeline.
//
//   Card buy:          DRAFT → AUTH_PENDING → OPEN | AUTH_FAILED
//   Wallet buy / sell: DRAFT → OPEN
//   OPEN → TRIGGERED → FILLED | FAILED
//   TRIGGERED → OPEN                      (re-quote outside the buffer)
//   OPEN → CANCELLED | AUTO_CANCELLED | EXPIRED

import type { Order, OrderStatus } from '../types';

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['AUTH_PENDING', 'OPEN'],
  AUTH_PENDING: ['OPEN', 'AUTH_FAILED'],
  AUTH_FAILED: [],
  OPEN: ['TRIGGERED', 'CANCELLED', 'AUTO_CANCELLED', 'EXPIRED'],
  TRIGGERED: ['FILLED', 'FAILED', 'OPEN'],
  FILLED: [],
  FAILED: [],
  CANCELLED: [],
  AUTO_CANCELLED: [],
  EXPIRED: [],
};

export const TERMINAL: OrderStatus[] = ['AUTH_FAILED', 'FILLED', 'FAILED', 'CANCELLED', 'AUTO_CANCELLED', 'EXPIRED'];
export const HISTORY_STATUSES: OrderStatus[] = ['FILLED', 'FAILED', 'CANCELLED', 'AUTO_CANCELLED', 'EXPIRED'];
/** Statuses that still reserve money / grams. */
export const LIVE_STATUSES: OrderStatus[] = ['OPEN', 'TRIGGERED'];

export class InvalidTransitionError extends Error {}

export function canTransition(order: Order, to: OrderStatus): boolean {
  if (!TRANSITIONS[order.status].includes(to)) return false;
  // Card-paid buys must pass card authorisation before going live.
  if (order.status === 'DRAFT' && order.side === 'buy' && order.paymentMethod === 'card' && to === 'OPEN') return false;
  if (order.status === 'DRAFT' && to === 'AUTH_PENDING' && !(order.side === 'buy' && order.paymentMethod === 'card')) return false;
  return true;
}

/** Returns a new order in status `to`. Throws on an illegal transition. */
export function transition(order: Order, to: OrderStatus, at: number, note?: string, patch: Partial<Order> = {}): Order {
  if (!canTransition(order, to)) {
    throw new InvalidTransitionError(`Illegal transition ${order.status} → ${to} for ${order.id}`);
  }
  return {
    ...order,
    ...patch,
    status: to,
    timeline: [...order.timeline, { status: to, at, note }],
  };
}

export function isLive(order: Order): boolean {
  return LIVE_STATUSES.includes(order.status);
}
