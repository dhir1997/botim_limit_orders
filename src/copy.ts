// ── User-facing copy ─────────────────────────────────────────────────────────
// Plain English for everyday users. Never use: "limit order", "bid/ask",
// "slippage", "GTC", "FIFO". Say "price order", "your price", "today's price".

import { ASSETS, CARD_AUTH_HOLD_AED, FEE_AED, MIN_BUY_AED, MOCK_USER, type AssetId } from './config';
import type { FailReason, OrderStatus, Side } from './types';
import { aed, fmtNum, grams, pct, price } from './lib/format';

const label = (a: AssetId) => ASSETS[a].label;
const lower = (a: AssetId) => ASSETS[a].label.toLowerCase();
const cardName = `${MOCK_USER.card.brand} ••${MOCK_USER.card.last4}`;

export const COPY = {
  appTitle: 'Gold & Silver',
  cardName,

  tabs: { markets: 'Markets', portfolio: 'Portfolio', inbox: 'Inbox' },

  asset: {
    live: 'Live',
    buyPrice: 'Buy price',
    sellPrice: 'Sell price',
    perGram: '/g',
    sinceOpen: 'since you opened the app',
    youOwn: (a: AssetId, g: number) => `You own ${grams(g)} ${lower(a)}`,
    worth: (v: number) => `Worth ${aed(v)} at today's sell price`,
    buy: 'Buy',
    sell: 'Sell',
    setPrice: 'Set a price',
    setPriceSub: 'Buy or sell automatically at a price you choose',
    newBadge: 'New',
    priceOrders: (n: number) => `Price orders (${n})`,
    priceOrdersSub: (n: number) => (n === 0 ? 'None waiting right now' : `${n} waiting for your price`),
    howTitle: 'How price orders work',
    howSteps: [
      { title: 'Pick your price', body: 'Choose the price you want to buy or sell at.' },
      { title: 'We keep watch', body: 'We check the price for you, day and night, for up to 90 days.' },
      { title: 'It happens automatically', body: 'When today\'s price reaches yours, we complete it and let you know.' },
    ],
  },

  flow: {
    buyTitle: (a: AssetId) => `Buy ${lower(a)}`,
    sellTitle: (a: AssetId) => `Sell ${lower(a)}`,
    buyTabs: { now: 'Buy now', monthly: 'Every month', price: 'At my price' },
    sellTabs: { now: 'Sell now', price: 'At my price' },
    reservedTitle: (g: number) => `${grams(g)} is already in other price orders`,
    reservedBodyPrice: (avail: number) => `You can place sell orders for up to ${grams(avail)}.`,
    reservedCta: (h: number) => `Cancel them and sell all ${grams(h)}`,
    pendingCancel: (n: number) => `${n} price order${n === 1 ? '' : 's'} will be cancelled when you confirm`,
    pendingBody: 'Nothing is cancelled yet. If you go back or change your mind, they stay open.',
    keepThem: (avail: number) => `Keep them and sell ${grams(avail)} instead`,
    lifoNote: (g: number, n: number) => `Selling ${grams(g)} will cancel ${n} price order${n === 1 ? '' : 's'}`,
    receiveApprox: (v: number) => `≈ ${aed(v)}`,
  },

  autoInvest: {
    title: 'Buy every month',
    body: 'Set up a monthly amount and we buy for you automatically on the same day each month.',
    placeholder: 'Existing auto-invest flow — shown for context, not part of this prototype.',
    cta: 'Set up monthly buying',
    amount: 'AED 200 / month',
    next: 'Next buy on 3 Oct',
  },

  ticket: {
    todaysPrice: (side: Side) => (side === 'buy' ? "Today's buy price" : "Today's sell price"),
    yourPriceLabel: (side: Side) => (side === 'buy' ? 'Buy when the price drops to' : 'Sell when the price rises to'),
    distance: (fraction: number, side: Side) =>
      `${pct(fraction)} ${side === 'buy' ? 'below' : 'above'} today's price`,
    priceTooHigh: (a: AssetId, today: number) =>
      `Your price must be below today's buy price (${price(a, today)}).`,
    priceTooLow: (a: AssetId, today: number) =>
      `Your price must be above today's sell price (${price(a, today)}).`,
    priceMissing: 'Enter the price you want per gram.',
    marketLink: (side: Side) => (side === 'buy' ? "Buy now at today's price" : "Sell now at today's price"),
    amountLabel: 'How much do you want to spend?',
    gramsLabel: 'How much do you want to sell?',
    approxGrams: (g: number) => `≈ ${grams(g)} at your price`,
    minBuy: `The minimum is ${aed(MIN_BUY_AED, 0)}.`,
    walletHint: (bal: number) =>
      `Your wallet has ${aed(bal)}. We only take the money when your order goes through.`,
    sellCap: (g: number) => `You can place sell orders for up to ${grams(g)}.`,
    gramsMissing: 'Enter how many grams to sell.',
    validityLabel: 'Keep my order open for',
    days: (d: number) => (d === 1 ? '1 day' : `${d} days`),
    endsOn: (date: string) => `Ends on ${date}`,
    summary: 'Summary',
    yourPrice: 'Your price',
    amount: 'Amount',
    fee: 'Fee',
    feeValue: `${aed(FEE_AED)} when it goes through`,
    ends: 'Ends',
    review: 'Review',
  },

  review: {
    title: 'Review your price order',
    type: 'Order',
    typeValue: (side: Side, a: AssetId) => (side === 'buy' ? `Buy ${lower(a)}` : `Sell ${lower(a)}`),
    when: 'When',
    whenValue: (side: Side, a: AssetId, p: number) =>
      side === 'buy' ? `Price drops to ${price(a, p)}/g` : `Price rises to ${price(a, p)}/g`,
    todaysPrice: "Today's price",
    estGrams: 'You\'ll get about',
    estProceeds: "You'll receive",
    totalAtFill: 'Charged when it goes through',
    disclosures: {
      buffer: (buffer: number, side: Side) =>
        `Your order may fill up to ${fmtNum(buffer * 100, 2)}% ${side === 'buy' ? 'above' : 'below'} your price.`,
      notGuaranteed: 'Not guaranteed to fill. Prices include our spread.',
      chargeLater: "We'll charge you when your order fills, not now.",
      manualSell: 'If you sell manually, this order may be cancelled.',
    },
    consent: 'I authorise Botim to place this order automatically when the price is reached.',
    continueBuy: 'Choose how to pay',
    place: 'Place price order',
    priceMoved: "Today's price has moved past yours. Go back and choose a new price.",
  },

  payment: {
    title: 'How do you want to pay?',
    sub: "Nothing is charged now. We'll take the payment only when your order goes through.",
    wallet: 'Botim Wallet',
    walletBal: (bal: number) => `${aed(bal)} available`,
    walletLow: (need: number) => `You'll need ${aed(need)} in your wallet when it goes through.`,
    card: cardName,
    cardSub: `We'll save your card for this order — ${aed(CARD_AUTH_HOLD_AED)} check, refunded instantly`,
    place: 'Place price order',
  },

  placing: {
    title: 'Saving your card for this order',
    sub: `${aed(CARD_AUTH_HOLD_AED)}, refunded instantly`,
  },

  authFailed: {
    title: "We couldn't save your card",
    body: `Your bank didn't approve the ${aed(CARD_AUTH_HOLD_AED)} check, so your price order wasn't placed. No money was taken.`,
    tryAgain: 'Try again',
    useWallet: 'Use wallet instead',
    cancel: 'Not now',
  },

  placed: {
    title: 'Price order placed',
    body: (side: Side, a: AssetId, p: number, amount: string, ends: string) =>
      side === 'buy'
        ? `We'll buy ${amount} of ${lower(a)} if the price drops to ${price(a, p)}/g before ${ends}.`
        : `We'll sell ${amount} of ${lower(a)} if the price rises to ${price(a, p)}/g before ${ends}.`,
    orderId: 'Order ID',
    viewOrders: 'View my price orders',
    done: 'Done',
  },

  orders: {
    title: 'Price orders',
    open: 'Open',
    history: 'History',
    all: 'All',
    emptyOpen: 'No price orders waiting',
    emptyOpenSub: "Set a price and we'll buy or sell for you when it's reached.",
    emptyHistory: 'Nothing here yet',
    emptyHistorySub: 'Completed, cancelled and expired orders will show up here.',
    needsDrop: (f: number) => `Needs to drop ${pct(f, 2)}`,
    needsRise: (f: number) => `Needs to rise ${pct(f, 2)}`,
    atPrice: 'At your price — checking now',
    side: (side: Side, a: AssetId) => `${side === 'buy' ? 'Buy' : 'Sell'} ${lower(a)}`,
  },

  status: {
    DRAFT: 'Draft',
    AUTH_PENDING: 'Setting up',
    AUTH_FAILED: 'Card not saved',
    OPEN: 'Open',
    TRIGGERED: 'Going through',
    FILLED: 'Filled',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
    AUTO_CANCELLED: 'Auto-cancelled',
    EXPIRED: 'Expired',
  } satisfies Record<OrderStatus, string>,

  detail: {
    title: 'Order details',
    yourPrice: 'Your price',
    todaysPrice: "Today's price",
    distance: 'Distance to your price',
    amount: 'Amount',
    grams: 'Grams',
    placed: 'Placed',
    ends: 'Ends',
    payWith: 'Pay with',
    orderId: 'Order ID',
    filledAt: 'Filled at',
    fee: 'Fee',
    totalCharged: 'Total charged',
    received: 'Credited to wallet',
    better: (v: string) => `You got a better price — ${v} less than your price.`,
    betterSell: (v: string) => `You got a better price — ${v} more than your price.`,
    within: (v: string, buffer: number) =>
      `Price moved by ${v} while we completed it — within the ${fmtNum(buffer * 100, 2)}% we agreed.`,
    exact: 'Filled exactly at your price.',
    timeline: 'What happened',
    cancel: 'Cancel order',
    change: 'Change price',
    changeHint: 'To change your price, we cancel this order and you set a new one.',
    cancelSheetTitle: 'Cancel this price order?',
    cancelSheetBody: "We'll stop watching the price. Nothing has been charged.",
    cancelSheetBodySell: "We'll stop watching the price. Your grams stay in your account.",
    cancelConfirm: 'Yes, cancel order',
    keep: 'Keep order',
    changeSheetTitle: 'Change your price?',
    changeSheetBody: "We'll cancel this order and open a new one with the same details for you to edit.",
    changeConfirm: 'Cancel and set new price',
  },

  reasons: {
    insufficient_balance: 'Not enough balance in your wallet when the price was reached.',
    card_declined: 'Your card was declined when the price was reached.',
    insufficient_holdings: 'You no longer had enough grams to sell.',
  } satisfies Record<FailReason, string>,

  timeline: {
    placed: 'Order created',
    authPending: 'Saving your card',
    authOk: 'Card saved — order is live',
    authFailed: 'Your bank didn\'t approve the card check',
    open: 'Order is live — watching the price',
    triggered: (a: AssetId, p: number) => `Price reached ${price(a, p)}`,
    missed: 'Price moved before we could complete it — still waiting',
    filled: (a: AssetId, side: Side, g: number, p: number) =>
      `${side === 'buy' ? 'Bought' : 'Sold'} ${grams(g)} at ${price(a, p)}/g`,
    cancelled: 'You cancelled this order',
    replacedBy: (id: string) => `Cancelled when you placed ${id} to sell all your holdings`,
    changed: 'Cancelled to set a new price',
    autoCancelled: (g: number) => `Cancelled because you sold manually and now hold ${grams(g)}`,
    expired: 'Reached the end date without filling',
  },

  notif: {
    placedTitle: 'Price order placed',
    placedBody: (side: Side, a: AssetId, p: number, ends: string) =>
      `${side === 'buy' ? 'Buy' : 'Sell'} ${lower(a)} at ${price(a, p)}/g · open until ${ends}`,
    filledTitle: (side: Side, a: AssetId, fill: number, limit: number) =>
      `${label(a)} ${side === 'buy' ? 'bought' : 'sold'} at ${price(a, fill)}/g (your price ${price(a, limit)}/g)`,
    filledBody: (g: number, total: number, side: Side) =>
      `${grams(g)} · ${aed(total)} ${side === 'buy' ? 'charged' : 'credited to your wallet'}.`,
    failedTitle: (a: AssetId) => `Your ${lower(a)} order couldn't go through`,
    failedBody: (reason: FailReason) => COPY.reasons[reason],
    autoTitle: 'Price order cancelled',
    batchTitle: (n: number) => (n === 1 ? '1 price order cancelled' : `${n} price orders cancelled`),
    batchReasonAuto: (a: AssetId) => `You sold some ${lower(a)} yourself, so we cancelled the newest sell orders:`,
    batchReasonReplace: (a: AssetId) => `You chose to sell all your ${lower(a)} in a new price order:`,
    batchLine: (a: AssetId, g: number, p: number) => `• Sell ${grams(g)} ${lower(a)} at ${price(a, p)}/g`,
    ctaViewCancelled: 'See cancelled orders',
    expiringTitle: 'Your price order ends soon',
    expiringBody: (side: Side, a: AssetId, p: number) =>
      `Your order to ${side} ${lower(a)} at ${price(a, p)} ends in less than 24 hours.`,
    expiredTitle: 'Price order ended',
    expiredBody: (side: Side, a: AssetId, p: number) =>
      `${label(a)} didn't reach ${price(a, p)}, so your ${side} order has ended. Nothing was charged.`,
    cancelledTitle: 'Price order cancelled',
    cancelledBody: (side: Side, a: AssetId, p: number) => `Your order to ${side} ${lower(a)} at ${price(a, p)} is cancelled.`,
    marketBuyTitle: (a: AssetId) => `You bought ${lower(a)}`,
    marketSellTitle: (a: AssetId) => `You sold ${lower(a)}`,
    marketBody: (g: number, total: number, side: Side) => `${grams(g)} · ${aed(total)} ${side === 'buy' ? 'charged' : 'credited'}`,
    ctaViewOrder: 'View order',
    ctaPortfolio: 'View portfolio',
    ctaBuyNow: "Buy now at today's price",
    ctaSetPrice: 'Set a new price',
  },

  inbox: {
    title: 'Inbox',
    empty: 'No notifications yet',
    emptySub: "We'll let you know here when something happens with your orders.",
  },

  marketSell: {
    title: (a: AssetId) => `Sell ${lower(a)}`,
    todays: "Today's sell price",
    gramsLabel: 'How much do you want to sell?',
    youOwn: (g: number) => `You own ${grams(g)}`,
    receive: 'You\'ll receive',
    fee: 'Fee',
    sellNow: 'Sell now',
    tooMuch: (g: number) => `You can sell up to ${grams(g)}.`,
    warnTitle: (n: number) => `Selling now will cancel ${n} of your price orders`,
    warnBody: 'You won\'t have enough left for these sell orders, so we\'ll cancel the newest ones:',
    warnConfirm: 'Sell and cancel orders',
    warnKeep: 'Keep my orders',
  },

  marketBuy: {
    title: (a: AssetId) => `Buy ${lower(a)}`,
    todays: "Today's buy price",
    amountLabel: 'How much do you want to spend?',
    youGet: 'You\'ll get about',
    total: 'Total',
    payWith: 'Pay with',
    buyNow: 'Buy now',
    notEnough: (bal: number) => `Your wallet has ${aed(bal)}. Pay by card or choose a smaller amount.`,
    prefilledNote: 'We filled in the amount from your price order.',
  },

  marketResult: {
    buyOk: (a: AssetId) => `You bought ${lower(a)}`,
    sellOk: (a: AssetId) => `You sold ${lower(a)}`,
    failTitle: 'Payment didn\'t go through',
    cancelledOrders: (n: number) => `${n} price order${n === 1 ? ' was' : 's were'} cancelled because you now hold less.`,
    done: 'Done',
    viewPortfolio: 'View portfolio',
    tryCard: 'Pay by card instead',
    back: 'Go back',
  },

  portfolio: {
    title: 'Portfolio',
    wallet: 'Botim Wallet',
    holdings: 'Your holdings',
    value: (v: number) => `${aed(v)} at today's sell price`,
    priceOrders: (n: number) => `Price orders (${n})`,
    activity: 'Recent activity',
    noActivity: 'Your buys and sells will show up here.',
    total: 'Total value',
  },

  common: {
    back: 'Back',
    close: 'Close',
    fee: aed(FEE_AED),
  },
};
