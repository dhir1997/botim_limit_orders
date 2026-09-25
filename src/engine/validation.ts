// ── Ticket validation ────────────────────────────────────────────────────────
// Shared by the ticket screen (inline messages) and the reducer (final guard).

import { MIN_BUY_AED, type AssetId } from '../config';
import { COPY } from '../copy';
import type { AppState } from '../store/state';
import type { Side } from '../types';
import { reservedSellGrams, todayPrice } from './ledger';

export interface TicketInput {
  asset: AssetId;
  side: Side;
  limitPrice: number; // NaN when empty
  amountAed: number; // NaN when empty (buy)
  grams: number; // NaN when empty (sell)
}

export interface TicketValidation {
  ok: boolean;
  priceError?: string;
  /** Show the "Buy/Sell now at today's price" link next to the price error. */
  showMarketLink?: boolean;
  amountError?: string;
  gramsError?: string;
  today: number;
  /** Signed distance: positive means your price is on the valid side. */
  distance: number;
  sellAvailable: number;
  sellReserved: number;
}

const EPS = 1e-9;

export function validateTicket(s: AppState, t: TicketInput): TicketValidation {
  const today = todayPrice(s, t.asset, t.side);
  const sellReserved = reservedSellGrams(s, t.asset);
  const sellAvailable = Math.max(s.holdings[t.asset] - sellReserved, 0);
  const res: TicketValidation = { ok: true, today, distance: 0, sellAvailable, sellReserved };

  if (!Number.isFinite(t.limitPrice) || t.limitPrice <= 0) {
    res.priceError = COPY.ticket.priceMissing;
  } else if (t.side === 'buy') {
    res.distance = (today - t.limitPrice) / today;
    // Buy price must be BELOW today's buy price.
    if (t.limitPrice >= today) {
      res.priceError = COPY.ticket.priceTooHigh(t.asset, today);
      res.showMarketLink = true;
    }
  } else {
    res.distance = (t.limitPrice - today) / today;
    // Sell price must be ABOVE today's sell price.
    if (t.limitPrice <= today) {
      res.priceError = COPY.ticket.priceTooLow(t.asset, today);
      res.showMarketLink = true;
    }
  }

  if (t.side === 'buy') {
    if (!Number.isFinite(t.amountAed) || t.amountAed < MIN_BUY_AED) res.amountError = COPY.ticket.minBuy;
  } else if (!Number.isFinite(t.grams) || t.grams <= 0) {
    res.gramsError = COPY.ticket.gramsMissing;
  } else if (t.grams > sellAvailable + EPS) {
    // SELL CAP: open sell grams + this order must fit within holdings.
    res.gramsError = COPY.ticket.sellCap(sellAvailable);
  }

  res.ok = !res.priceError && !res.amountError && !res.gramsError;
  return res;
}
