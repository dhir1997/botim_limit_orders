// Headless checks for the order engine. Run with: npm test
import { reducer, type Action } from '../src/store/reducer';
import { initialState, type AppState } from '../src/store/state';
import { validateTicket } from '../src/engine/validation';
import { todayPrice } from '../src/engine/ledger';
import { HOUR_MS } from '../src/config';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const T = 1_800_000_000_000;
const run = (s: AppState, ...as: Action[]) => as.reduce(reducer, s);
const poll = (s: AppState, r = 0.5) => reducer(s, { type: 'POLL_TICK', rands: [r], realNow: T });
const st = (s: AppState, id: string) => s.orders.find(o => o.id === id)!.status;

// 1. FIFO: wallet covers one
{
  let s = run(initialState(T),
    { type: 'DEMO_SET_WALLET', aed: 150, realNow: T },
    { type: 'DEMO_INJECT_ORDERS', realNow: T, specs: [
      { id: 'A', asset: 'gold', side: 'buy', offset: -0.005, amountAed: 100, validityDays: 7, paymentMethod: 'wallet', createdAgoMs: 120000 },
      { id: 'B', asset: 'gold', side: 'buy', offset: -0.005, amountAed: 100, validityDays: 7, paymentMethod: 'wallet', createdAgoMs: 60000 } ] });
  s = poll(s); ok(st(s, 'A') === 'OPEN' && st(s, 'B') === 'OPEN', 'FIFO: no trigger above price');
  s = run(s, { type: 'DEMO_NUDGE', asset: 'gold', pct: -0.01, realNow: T }); s = poll(s);
  ok(st(s, 'A') === 'FILLED', 'FIFO: oldest fills');
  ok(st(s, 'B') === 'FAILED' && s.orders.find(o => o.id === 'B')!.failReason === 'insufficient_balance', 'FIFO: second FAILS for balance');
  ok(Math.abs(s.wallet - 49) < 1e-6, `FIFO: wallet 150-101 = ${s.wallet.toFixed(2)}`);
  const f = s.orders.find(o => o.id === 'A')!.fill!;
  ok(f.favourable && f.slippageBps < 0, `fill recorded: price ${f.price} limit ${f.limit} bps ${f.slippageBps.toFixed(1)} aed ${f.slippageAed.toFixed(3)}`);
  ok(s.notifications.some(n => n.kind === 'failed' && n.cta?.type === 'market_buy' && n.cta.amountAed === 100), 'FAILED notif → prefilled market buy');
  const filled = s.notifications.find(n => n.kind === 'filled')!;
  ok(/^Gold bought at AED [\d,.]+\/g \(your price AED [\d,.]+\/g\)$/.test(filled.title) && !/at your price/.test(filled.title + filled.body), `fill notification: "${filled.title}"`);
  ok(s.orders.find(o => o.id === 'A')!.timeline.map(t => t.status).join('>') === 'DRAFT>OPEN>TRIGGERED>FILLED', 'timeline DRAFT>OPEN>TRIGGERED>FILLED');
}
// 2. LIFO
{
  let s = run(initialState(T), { type: 'DEMO_INJECT_ORDERS', realNow: T, specs: ['S1', 'S2', 'S3'].map((id, i) => ({ id, asset: 'gold' as const, side: 'sell' as const, offset: 0.03 + i * 0.01, grams: 0.5, validityDays: 30, createdAgoMs: (3 - i) * 60000 })) });
  const v = validateTicket(s, { asset: 'gold', side: 'sell', limitPrice: 9999, amountAed: NaN, grams: 0.6 });
  ok(!v.ok && /up to 0.5000 g/.test(v.gramsError!), `sell cap blocks: "${v.gramsError}"`);
  s = run(s, { type: 'MARKET_SELL', tradeId: 'T1', asset: 'gold', grams: 1.2, realNow: T });
  ok(st(s, 'S1') === 'OPEN' && st(s, 'S2') === 'AUTO_CANCELLED' && st(s, 'S3') === 'AUTO_CANCELLED', 'LIFO: newest two auto-cancelled, oldest kept');
  ok(s.trades[0].cancelledOrderIds.join() === 'S3,S2', 'trade lists cancelled newest first');
  ok(s.notifications.filter(n => n.kind === 'auto_cancelled').length === 1, 'auto-cancels batched into 1 notification');
}
// 2b. "Cancel them and sell all" — staged on the ticket, applied only on placement
{
  const specs = ['K1', 'K2'].map(id => ({ id, asset: 'gold' as const, side: 'sell' as const, offset: 0.05, grams: 0.5, validityDays: 7 }));
  let s = run(initialState(T),
    { type: 'DEMO_INJECT_ORDERS', realNow: T, specs },
    { type: 'DEMO_INJECT_ORDERS', realNow: T, specs: [{ id: 'KS', asset: 'silver', side: 'sell', offset: 0.05, grams: 5, validityDays: 7 }] });
  const sellAll = { asset: 'gold' as const, side: 'sell' as const, limitPrice: 9999, grams: 2, validityDays: 7 };
  ok(!validateTicket(s, { ...sellAll, amountAed: NaN }).ok, 'sell-all blocked without the replace flag');
  ok(validateTicket(s, { ...sellAll, amountAed: NaN, replaceSellOrders: true }).ok, 'sell-all valid with the replace flag (nothing cancelled yet)');
  ok(st(s, 'K1') === 'OPEN' && st(s, 'K2') === 'OPEN', 'staging alone cancels nothing');
  s = run(s, { type: 'PLACE_ORDER', orderId: 'NEW', realNow: T, draft: { ...sellAll, replaceSellOrders: true } });
  ok(st(s, 'K1') === 'CANCELLED' && st(s, 'K2') === 'CANCELLED' && st(s, 'KS') === 'OPEN' && st(s, 'NEW') === 'OPEN', 'on placement: gold sells cancelled, silver kept, new order open');
  const batch = s.notifications.filter(n => n.kind === 'cancelled');
  ok(batch.length === 1 && batch[0].title === '2 price orders cancelled' && batch[0].body.split('\n').length === 3, 'one batched notification listing both orders');
  // a rejected placement (price now invalid) must not cancel anything
  let s2 = run(initialState(T), { type: 'DEMO_INJECT_ORDERS', realNow: T, specs });
  s2 = run(s2, { type: 'PLACE_ORDER', orderId: 'BAD', realNow: T, draft: { ...sellAll, limitPrice: 1, replaceSellOrders: true } });
  ok(st(s2, 'K1') === 'OPEN' && !s2.orders.some(o => o.id === 'BAD'), 'rejected placement cancels nothing');
}
// 2c. LIFO auto-cancel is batched into one notification
{
  let s = run(initialState(T), { type: 'DEMO_INJECT_ORDERS', realNow: T, specs: ['L1', 'L2', 'L3'].map((id, i) => ({ id, asset: 'gold' as const, side: 'sell' as const, offset: 0.03, grams: 0.5, validityDays: 7, createdAgoMs: (3 - i) * 1000 })) });
  s = run(s, { type: 'MARKET_SELL', tradeId: 'TT', asset: 'gold', grams: 1.2, realNow: T });
  const n = s.notifications.filter(x => x.kind === 'auto_cancelled');
  ok(n.length === 1 && n[0].title === '2 price orders cancelled' && n[0].cta?.type === 'view_orders', 'LIFO: one batched notification for 2 orders');
}
// 3. Expiry
{
  let s = run(initialState(T), { type: 'DEMO_INJECT_ORDERS', realNow: T, specs: [{ id: 'E', asset: 'gold', side: 'buy', offset: -0.05, amountAed: 100, validityDays: 1, paymentMethod: 'wallet', createdAgoMs: 23.5 * HOUR_MS }] });
  s = poll(s); ok(s.notifications.filter(n => n.kind === 'expiring').length === 1, 'expiring notif once');
  s = poll(s); ok(s.notifications.filter(n => n.kind === 'expiring').length === 1, 'expiring not repeated');
  s = run(s, { type: 'DEMO_FAST_FORWARD', ms: HOUR_MS, label: '+1h', realNow: T }); ok(st(s, 'E') === 'EXPIRED', 'expired after +1h');
  let s2 = run(initialState(T), { type: 'PLACE_ORDER', orderId: 'N', realNow: T, draft: { asset: 'gold', side: 'buy', limitPrice: 400, amountAed: 50, validityDays: 1, paymentMethod: 'wallet' } });
  s2 = poll(s2); ok(!s2.notifications.some(n => n.kind === 'expiring'), 'fresh 1-day order not warned');
}
// 4. Buffer miss
{
  let s = run(initialState(T), { type: 'DEMO_SET_JITTER', jitter: 0.01 }, { type: 'DEMO_SET_JITTER_ADVERSE', adverse: true, realNow: T },
    { type: 'DEMO_INJECT_ORDERS', realNow: T, specs: [{ id: 'M', asset: 'gold', side: 'buy', offset: -0.001, amountAed: 100, validityDays: 7, paymentMethod: 'wallet' }] },
    { type: 'DEMO_NUDGE', asset: 'gold', pct: -0.002, realNow: T });
  s = poll(s); ok(st(s, 'M') === 'OPEN' && s.log.some(l => l.kind === 'miss'), 'buffer miss → back to OPEN, logged');
  ok(s.orders.find(o => o.id === 'M')!.timeline.map(t => t.status).join('>') === 'DRAFT>OPEN>TRIGGERED>OPEN', 'timeline shows TRIGGERED>OPEN');
}
// 5. Card paths
{
  const d = { asset: 'gold' as const, side: 'buy' as const, limitPrice: 400, amountAed: 50, validityDays: 7, paymentMethod: 'card' as const };
  let s = run(initialState(T), { type: 'DEMO_FORCE_AUTH_FAIL', on: true, realNow: T }, { type: 'PLACE_ORDER', orderId: 'C1', draft: d, realNow: T });
  ok(st(s, 'C1') === 'AUTH_PENDING', 'card → AUTH_PENDING');
  s = run(s, { type: 'CARD_AUTH_RESULT', orderId: 'C1', realNow: T });
  ok(st(s, 'C1') === 'AUTH_FAILED' && !s.settings.forceCardAuthFail, 'forced auth fail → AUTH_FAILED, flag consumed');
  s = run(s, { type: 'PLACE_ORDER', orderId: 'C2', draft: d, realNow: T }, { type: 'CARD_AUTH_RESULT', orderId: 'C2', realNow: T });
  ok(st(s, 'C2') === 'OPEN', 'retry → OPEN');
  s = run(s, { type: 'DEMO_FORCE_DEBIT_DECLINE', on: true, realNow: T }, { type: 'DEMO_SET_BUY_PRICE', asset: 'gold', buy: 399, realNow: T }); s = poll(s);
  ok(st(s, 'C2') === 'FAILED' && s.orders.find(o => o.id === 'C2')!.failReason === 'card_declined', 'forced debit decline → FAILED card_declined');
  ok(Math.abs(s.wallet - 500) < 1e-9, 'wallet untouched');
}
// 6. Validation + sell fill + buy fill doesn't touch sells
{
  const s0 = initialState(T); const buy = todayPrice(s0, 'gold', 'buy');
  ok(!validateTicket(s0, { asset: 'gold', side: 'buy', limitPrice: buy + 1, amountAed: 100, grams: NaN }).ok, 'buy above today rejected');
  ok(!validateTicket(s0, { asset: 'gold', side: 'buy', limitPrice: buy - 1, amountAed: 5, grams: NaN }).ok, 'min AED 10 enforced');
  let s = run(s0, { type: 'PLACE_ORDER', orderId: 'X', realNow: T, draft: { asset: 'silver', side: 'sell', limitPrice: 6.2, grams: 10, validityDays: 7 } });
  ok(st(s, 'X') === 'OPEN', 'sell → OPEN directly');
  s = run(s, { type: 'DEMO_NUDGE', asset: 'silver', pct: 0.05, realNow: T }); s = poll(s);
  ok(st(s, 'X') === 'FILLED' && Math.abs(s.holdings.silver - 40) < 1e-9, `sell fill: holdings 40, wallet ${s.wallet.toFixed(2)}`);
  const f = s.orders.find(o => o.id === 'X')!.fill!;
  ok(Math.abs(s.wallet - (500 + f.grams * f.price - 1)) < 1e-9, 'sell credits proceeds - AED 1');
  // illegal transition guarded
  let threw = false; try { run(s, { type: 'CANCEL_ORDER', orderId: 'X', reason: 'user', realNow: T }); } catch { threw = true; }
  ok(!threw && st(run(s, { type: 'CANCEL_ORDER', orderId: 'X', reason: 'user', realNow: T }), 'X') === 'FILLED', 'cancel on FILLED is a no-op');
}
if (fails) throw new Error(`${fails} check(s) failed`);
console.log('\nALL PASS');
