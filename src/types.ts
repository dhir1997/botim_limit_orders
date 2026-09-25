import type { AssetId } from './config';

export type Side = 'buy' | 'sell';
export type PaymentMethod = 'wallet' | 'card';

export type OrderStatus =
  | 'DRAFT'
  | 'AUTH_PENDING'
  | 'AUTH_FAILED'
  | 'OPEN'
  | 'TRIGGERED'
  | 'FILLED'
  | 'FAILED'
  | 'CANCELLED'
  | 'AUTO_CANCELLED'
  | 'EXPIRED';

export type FailReason = 'insufficient_balance' | 'card_declined' | 'insufficient_holdings';

export interface TimelineEntry {
  status: OrderStatus;
  at: number; // simulated epoch ms
  note?: string;
}

export interface FillRecord {
  at: number;
  price: number; // AED/g actually executed
  limit: number; // the user's price
  grams: number;
  amountAed: number; // gross value of the metal
  fee: number;
  /** Per-gram price minus user's price (signed). */
  slippagePerGram: number;
  /** Total AED difference vs executing exactly at the user's price (signed, positive = user paid more / received more). */
  slippageAed: number;
  slippageBps: number;
  favourable: boolean;
}

export interface Order {
  id: string;
  seq: number; // placement order, used for oldest-first processing and newest-first auto-cancel
  asset: AssetId;
  side: Side;
  limitPrice: number;
  amountAed?: number; // buy orders
  grams?: number; // sell orders (fixed at placement)
  paymentMethod?: PaymentMethod; // buy orders
  validityDays: number;
  createdAt: number;
  expiresAt: number;
  status: OrderStatus;
  timeline: TimelineEntry[];
  expiryWarned: boolean;
  failReason?: FailReason;
  cancelReason?: string;
  fill?: FillRecord;
}

/** Everything the user entered on the ticket. */
export interface TicketDraft {
  asset: AssetId;
  side: Side;
  limitPrice: number;
  amountAed?: number;
  grams?: number;
  validityDays: number;
  paymentMethod?: PaymentMethod;
}

export type NotificationKind =
  | 'placed'
  | 'filled'
  | 'failed'
  | 'auto_cancelled'
  | 'expiring'
  | 'expired'
  | 'cancelled'
  | 'market';

export type NotificationCta =
  | { type: 'view_order'; orderId: string }
  | { type: 'view_portfolio' }
  | { type: 'market_buy'; asset: AssetId; amountAed: number }
  | { type: 'set_price'; asset: AssetId; side: Side };

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  at: number;
  title: string;
  body: string;
  asset?: AssetId;
  orderId?: string;
  cta?: NotificationCta & { label: string };
  read: boolean;
}

export interface MarketTrade {
  id: string;
  at: number;
  asset: AssetId;
  side: Side;
  grams: number;
  price: number;
  amountAed: number;
  fee: number;
  method?: PaymentMethod;
  ok: boolean;
  failReason?: FailReason;
  cancelledOrderIds: string[];
}

export type LogKind = 'transition' | 'eval' | 'trigger' | 'miss' | 'fill' | 'fail' | 'notify' | 'price' | 'demo' | 'trade';

export interface LogEntry {
  id: number;
  simAt: number;
  realAt: number;
  kind: LogKind;
  msg: string;
}
