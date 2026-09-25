// ── Trigger engine ───────────────────────────────────────────────────────────
// Runs once per poll tick (never between ticks):
//   1. Expire / warn orders near their end date.
//   2. Evaluate every OPEN order against today's CUSTOMER price.
//   3. Process triggered orders oldest-first: re-quote with jitter, check the
//      buffer, then either fill (one payment attempt) or return to OPEN.
// Balances and holdings update after each fill, so a later order in the same
// tick sees the effect of an earlier one.

import { ASSETS, FEE_AED } from '../config';
import { COPY } from '../copy';
import type { FillRecord, Order } from '../types';
import { findOrder, log, move, notify, roundPrice, sweepExpiry, todayPrice, type Ctx } from './ledger';

const EPS = 1e-9;

/** Re-quote at execution time: today's price nudged by a small random jitter. */
function requote(ctx: Ctx, o: Order, today: number, rand: () => number): { quote: number; jitter: number } {
  const { execJitter, jitterAdverse } = ctx.s.settings;
  let jitter: number;
  if (jitterAdverse) {
    // Always against the user: buy quotes go up, sell quotes go down.
    const mag = execJitter * (0.6 + 0.4 * rand());
    jitter = o.side === 'buy' ? mag : -mag;
  } else {
    jitter = (rand() * 2 - 1) * execJitter;
  }
  return { quote: roundPrice(o.asset, today * (1 + jitter)), jitter };
}

function fmtP(o: Order, p: number): string {
  return p.toFixed(ASSETS[o.asset].priceDecimals);
}

export function runPollTick(ctx: Ctx, rand: () => number): void {
  const { s } = ctx;
  sweepExpiry(ctx);

  const open = s.orders.filter(o => o.status === 'OPEN').sort((a, b) => a.seq - b.seq);
  if (open.length === 0) {
    log(ctx, 'eval', 'Check: no open orders');
    return;
  }

  // 1) Evaluate every open order against the same snapshot of prices.
  const triggered: string[] = [];
  for (const o of open) {
    const today = todayPrice(s, o.asset, o.side);
    const hit = o.side === 'buy' ? today <= o.limitPrice : today >= o.limitPrice;
    log(
      ctx,
      'eval',
      `Check ${o.id} ${o.side} ${o.asset} ${o.side === 'buy' ? '≤' : '≥'} ${fmtP(o, o.limitPrice)} · today ${fmtP(o, today)} → ${hit ? 'TRIGGER' : 'wait'}`,
    );
    if (hit) triggered.push(o.id);
  }
  if (triggered.length > 1) log(ctx, 'trigger', `${triggered.length} orders triggered — processing oldest first: ${triggered.join(', ')}`);

  // 2) Process triggered orders oldest first.
  for (const id of triggered) {
    const o = findOrder(s, id)!;
    const today = todayPrice(s, o.asset, o.side);
    move(ctx, id, 'TRIGGERED', COPY.timeline.triggered(o.asset, today));

    const buffer = s.settings.buffer[o.asset];
    const { quote, jitter } = requote(ctx, o, today, rand);
    const bound = o.side === 'buy' ? o.limitPrice * (1 + buffer) : o.limitPrice * (1 - buffer);
    const within = o.side === 'buy' ? quote <= bound + EPS : quote >= bound - EPS;
    log(
      ctx,
      'trigger',
      `${id} re-quote ${fmtP(o, quote)} (jitter ${(jitter * 1e4).toFixed(1)} bps) vs ${o.side === 'buy' ? 'max' : 'min'} ${fmtP(o, bound)} (buffer ${(buffer * 100).toFixed(2)}%)`,
    );

    if (!within) {
      move(ctx, id, 'OPEN', COPY.timeline.missed);
      log(ctx, 'miss', `${id} buffer miss — price moved, still waiting`);
      continue;
    }

    if (o.side === 'buy') executeBuy(ctx, o, quote);
    else executeSell(ctx, o, quote);
  }
}

function fillRecord(ctx: Ctx, o: Order, fillPrice: number, grams: number, amountAed: number): FillRecord {
  const slippagePerGram = fillPrice - o.limitPrice;
  return {
    at: ctx.now,
    price: fillPrice,
    limit: o.limitPrice,
    grams,
    amountAed,
    fee: FEE_AED,
    slippagePerGram,
    slippageAed: slippagePerGram * grams,
    slippageBps: (slippagePerGram / o.limitPrice) * 1e4,
    favourable: o.side === 'buy' ? fillPrice < o.limitPrice : fillPrice > o.limitPrice,
  };
}

function fail(ctx: Ctx, o: Order, reason: 'insufficient_balance' | 'card_declined' | 'insufficient_holdings'): void {
  move(ctx, o.id, 'FAILED', COPY.reasons[reason], { failReason: reason });
  log(ctx, 'fail', `${o.id} FAILED · ${reason}`);
  notify(ctx, {
    kind: 'failed',
    title: COPY.notif.failedTitle(o.asset),
    body: COPY.notif.failedBody(reason),
    asset: o.asset,
    orderId: o.id,
    cta:
      o.side === 'buy'
        ? { type: 'market_buy', asset: o.asset, amountAed: o.amountAed ?? 0, label: COPY.notif.ctaBuyNow }
        : { type: 'set_price', asset: o.asset, side: 'sell', label: COPY.notif.ctaSetPrice },
  });
}

function executeBuy(ctx: Ctx, o: Order, fillPrice: number): void {
  const { s } = ctx;
  const amount = o.amountAed ?? 0;
  const total = amount + FEE_AED;

  // ONE payment attempt. No retries.
  if (o.paymentMethod === 'card') {
    if (s.settings.forceCardDebitDecline) {
      s.settings.forceCardDebitDecline = false;
      log(ctx, 'demo', 'Forced card decline consumed');
      fail(ctx, o, 'card_declined');
      return;
    }
  } else if (s.wallet + EPS < total) {
    log(ctx, 'fail', `${o.id} wallet ${s.wallet.toFixed(2)} < needed ${total.toFixed(2)}`);
    fail(ctx, o, 'insufficient_balance');
    return;
  }

  const grams = amount / fillPrice;
  if (o.paymentMethod !== 'card') s.wallet -= total;
  s.holdings[o.asset] += grams; // does not affect existing sell orders
  const fill = fillRecord(ctx, o, fillPrice, grams, amount);
  move(ctx, o.id, 'FILLED', COPY.timeline.filled(o.asset, 'buy', grams, fillPrice), { fill });
  logFill(ctx, o, fill, total);
  notify(ctx, {
    kind: 'filled',
    title: COPY.notif.filledTitle('buy', o.asset),
    body: COPY.notif.filledBody(o.asset, fillPrice, o.limitPrice, grams, total, 'buy'),
    asset: o.asset,
    orderId: o.id,
    cta: { type: 'view_portfolio', label: COPY.notif.ctaPortfolio },
  });
}

function executeSell(ctx: Ctx, o: Order, fillPrice: number): void {
  const { s } = ctx;
  const grams = o.grams ?? 0;
  if (s.holdings[o.asset] + EPS < grams) {
    fail(ctx, o, 'insufficient_holdings');
    return;
  }
  const proceeds = grams * fillPrice;
  s.holdings[o.asset] = Math.max(s.holdings[o.asset] - grams, 0);
  s.wallet += proceeds - FEE_AED;
  const fill = fillRecord(ctx, o, fillPrice, grams, proceeds);
  move(ctx, o.id, 'FILLED', COPY.timeline.filled(o.asset, 'sell', grams, fillPrice), { fill });
  logFill(ctx, o, fill, proceeds - FEE_AED);
  notify(ctx, {
    kind: 'filled',
    title: COPY.notif.filledTitle('sell', o.asset),
    body: COPY.notif.filledBody(o.asset, fillPrice, o.limitPrice, grams, proceeds - FEE_AED, 'sell'),
    asset: o.asset,
    orderId: o.id,
    cta: { type: 'view_portfolio', label: COPY.notif.ctaPortfolio },
  });
}

function logFill(ctx: Ctx, o: Order, f: FillRecord, net: number): void {
  log(
    ctx,
    'fill',
    `${o.id} FILLED ${o.side} ${f.grams.toFixed(4)} g @ ${fmtP(o, f.price)} (limit ${fmtP(o, f.limit)}) · slippage ${f.slippageAed >= 0 ? '+' : ''}${f.slippageAed.toFixed(2)} AED / ${f.slippageBps.toFixed(1)} bps${f.favourable ? ' (favourable)' : ''} · net ${net.toFixed(2)} AED · wallet ${ctx.s.wallet.toFixed(2)}`,
  );
}
