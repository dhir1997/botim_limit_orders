# Botim Money · Gold & Silver — "Set a price" (price orders)

Clickable mobile prototype of buy and sell price orders for gold and silver. It runs as a single React app (Vite + TypeScript) with no backend; all state lives in memory. The app renders inside a 390×844 phone frame, with a collapsible demo control panel beside it. On a phone-sized browser the frame drops away and the app fills the screen.

Structure and visual language follow `../botim_physical_delivery`: the phone shell, status bar, blue brand, warm gold and silver tints, 20px cards and pill chips.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # headless checks of the order engine (31 checks)
npm run build      # typecheck + production build
```

## How it works

| | |
|---|---|
| Prices | Mid price random-walks every **2s**, 24×7. Users only ever see **customer** prices: buy = mid × (1 + markup), sell = mid × (1 − markup). Markup is 1.2% for gold and 2.5% for silver. |
| Poll | The trigger engine runs only on poll ticks (**5s** by default; adjustable in the demo panel). |
| Trigger | A buy triggers when the customer buy price ≤ your price. A sell triggers when the customer sell price ≥ your price. |
| Re-quote | On trigger, the engine takes a fresh quote with a small random jitter. A buy fills if the quote ≤ price × (1 + buffer); a sell fills if the quote ≥ price × (1 − buffer). The fill executes at the live quote, so a favourable move gives the user a better price. Outside the buffer, the order goes back to OPEN silently and a line is written to the event log. |
| Order | Triggered orders are processed oldest first. Wallet balance and holdings update after each fill. |
| Payment | One debit attempt of amount + AED 1. Insufficient wallet balance or a forced card decline makes the order FAILED (terminal). |
| Sell cap | Grams in open sell orders plus the new order must be ≤ holdings. |
| Holdings drop | After a manual sell (or a demo holdings change), the **newest** open sell orders are cancelled first until they fit. Each becomes AUTO_CANCELLED and sends a notification. |
| Expiry | An OPEN order past its validity becomes EXPIRED. The "ends in 24h" notice is sent once, and is skipped for orders placed less than an hour ago. |
| Fill record | Each fill stores the fill price, your price, and slippage in AED and bps. These show in the event log and the order detail. |

### State machine ([src/engine/orderMachine.ts](src/engine/orderMachine.ts))

```
Card buy:          DRAFT → AUTH_PENDING → OPEN | AUTH_FAILED
Wallet buy / sell: DRAFT → OPEN
OPEN → TRIGGERED → FILLED | FAILED
TRIGGERED → OPEN                         (re-quote outside buffer)
OPEN → CANCELLED | AUTO_CANCELLED | EXPIRED
```

Every status change goes through `transition()`, which checks it against the table and appends to the order's timeline. The order detail screen renders that timeline.

## Code map

| File | What it holds |
|---|---|
| [src/config.ts](src/config.ts) | **All tunables**: start prices, markups, buffers, poll interval, fee, min buy, validity options, mock user |
| [src/styles/tokens.css](src/styles/tokens.css) | **Brand colours** as CSS variables. Swap them here. |
| [src/copy.ts](src/copy.ts) | Every user-facing string, in plain English |
| [src/engine/priceEngine.ts](src/engine/priceEngine.ts) | Random walk, customer buy/sell pricing |
| [src/engine/orderMachine.ts](src/engine/orderMachine.ts) | Order state machine |
| [src/engine/triggerEngine.ts](src/engine/triggerEngine.ts) | Poll tick: expiry, evaluation, oldest-first processing, re-quote/buffer, payment, fills |
| [src/engine/ledger.ts](src/engine/ledger.ts) | Shared mutators: transitions + logging, notifications, sell-cap reconciliation, expiry sweep |
| [src/engine/validation.ts](src/engine/validation.ts) | Ticket rules: price side, min buy, sell cap |
| [src/store/reducer.ts](src/store/reducer.ts) | The single app reducer (user actions + demo actions). Randomness and ids arrive on the action, so the reducer stays pure. |
| [src/store/StoreProvider.tsx](src/store/StoreProvider.tsx) | Price and poll timers |
| [src/store/NavProvider.tsx](src/store/NavProvider.tsx) | In-phone navigation stack. Screens under the top stay mounted (hidden), so Back keeps what the user entered. |
| [src/screens/](src/screens/) | One file per screen. [BuyFlow](src/screens/BuyFlow.tsx) and [SellFlow](src/screens/SellFlow.tsx) host the tabbed panels in [src/screens/flow/](src/screens/flow/). |
| [src/demo/](src/demo/) | Demo control panel and presets |
| [tests/engine.test.ts](tests/engine.test.ts) | Headless engine checks |

## Screens

Price orders are not a separate flow. They live as a tab inside the normal Buy and Sell flows:

| Flow | Tabs |
|---|---|
| **Buy** | **Buy now** (default) · **Every month** (auto-invest placeholder) · **At my price** |
| **Sell** | **Sell now** (default) · **At my price** |

- **At my price** holds the price-order fields (price, amount, validity, summary). It continues into the shared Review (disclosures and consent) → Payment method (buy only) → Saving your card (card only) → Placed screens.
- Each tab keeps its own values. Switching tabs, or going back from Review, doesn't wipe what was entered.
- The asset page's **Set a price** promo card opens the Buy flow with **At my price** selected. The Buy and Sell buttons open their flows on the "now" tab.
- On "At my price", a price on the wrong side of today's price shows **Buy/Sell now at today's price**. That link switches to the "now" tab and carries the amount over.
- **Sell % chips are a share of total holdings.** If the grams chosen exceed what's free (holdings minus open sell orders), an inline card says "{x} g is already in other price orders" and offers **Cancel them and sell all {holdings} g**. Tapping it cancels those orders, sends a notification for each, and sets the amount to full holdings. This works the same on both sell tabs.

Other screens: asset page (Gold/Silver tabs, live prices, sparkline, "Price orders (n)"), Price orders (Open / History), Order detail (timeline, cancel, change price), Market result, Inbox, Portfolio. Every new notification also appears as a toast banner.

## Simulated scenarios and how to trigger them

Controls are in the **Demo controls** panel to the right of the phone. Scenario presets reset state first and pause that asset's price movement, so nothing drifts while you demo.

| # | Scenario | How to trigger |
|---|---|---|
| 1 | **Place a wallet buy** → OPEN + "placed" notification | Phone: *Set a price* card (or Buy → **At my price**) → Review → tick consent → Choose how to pay → Botim Wallet → Place price order |
| 2 | **Place a card buy** → AUTH_PENDING → OPEN | As above but pick **Visa ••4821**. You'll see "Saving your card for this order — AED 0.10, refunded instantly". |
| 3 | **Card save fails** → AUTH_FAILED screen (Try again / Use wallet instead) | Panel → *Money & cards* → tick **Force next card save to fail**, then do #2 |
| 4 | **Place a sell** → OPEN | Sell → **At my price** → pick grams or 25/50/100% → Review → consent → Place price order |
| 5 | **Buy price above today's price** blocked, with a "Buy now at today's price" link that switches to the Buy now tab with the amount carried over | Buy → At my price → type a price above today's buy price (or press + repeatedly) |
| 6 | **Sell price below today's price** blocked, with a "Sell now at today's price" link | Sell → At my price → type a price below today's sell price |
| 7 | **Sell cap** → inline card "{x} g is already in other price orders" + "You can place sell orders for up to X g" | Place a sell for 1.5 g gold, then Sell → At my price → enter more than 0.5 g (or tap 100%) |
| 7b | **Cancel them and sell all** → those orders CANCELLED (one notification each), amount set to full holdings | From #7 (or #14), tap **Cancel them and sell all {holdings} g**. Works on both Sell now and At my price. |
| 7c | **Tab values persist** | Buy → type an amount on Buy now → switch to At my price, change things → switch back. Both tabs keep their values, and so does Back from Review. |
| 8 | **Min buy AED 10** | Buy → At my price → amount 5 |
| 9 | **Buy fills** (with a better price if the market moved past you) → FILLED + notification → View portfolio | Place a buy, then press the asset's **−1%** / **−5%** until the buy price is ≤ your price. It fills on the next check. |
| 10 | **Sell fills** | Place a sell, then press **+1%** / **+5%** until the sell price is ≥ your price |
| 11 | **Oldest first: 2 buys at the same price, wallet covers only one** → oldest FILLED, second FAILED ("not enough balance") → *Buy now at today's price* (prefilled market buy) | Preset **"2 buys, same price, wallet covers 1"**, then press Gold **−1%** |
| 12 | **Buffer miss** → TRIGGERED → OPEN, "price moved, still waiting" in the log | Place an order, set **Exec jitter** above the buffer (e.g. ±1%), tick **Jitter always against user**, then press **⌖ Move price to newest order**. On the next check the log shows `TRIGGER`, then `miss`. |
| 13 | **Card payment declined at fill** → FAILED ("card was declined") | Place a card buy (#2), tick **Force next card payment to decline**, then move the price onto it (#9) |
| 14 | **Manual sell cancels newest sell orders first** → warning sheet, then AUTO_CANCELLED + notifications | Preset **"Manual sell cancels newest sell orders"** (3 × 0.5 g sell orders; Sell flow opens with 1.2 g). The reserved-orders card is shown. Tap **Sell now** → **Sell and cancel orders**. |
| 15 | **Holdings drop from outside** → auto-cancel, newest first | Place sell orders, then lower **Holdings** in the panel |
| 16 | **Ends-in-24h notice** (sent once) → View order | Preset **"Order about to expire"**, then wait for the next check (~5s) |
| 17 | **Expired** → EXPIRED + "Set a new price" | After #16, press **Fast-forward +1 hour** (or place any order and use +1 / +7 / +30 days) |
| 18 | **Cancel an order** → CANCELLED | Order detail → Cancel order → confirm |
| 19 | **Change price** = cancel + new ticket prefilled | Order detail → Change price → confirm |
| 20 | **A buy fill doesn't affect sell orders** | Place a sell, then a buy that fills. The sell order stays as it was. |
| 21 | **Buy now fails** → result screen with "Pay by card instead" | Set **Wallet** to 5 in the panel, then Buy → Buy now → Botim Wallet (the button is disabled, and the message suggests card). With a card, tick *Force next card payment to decline* to see the failure screen. |
| 22 | **Every month** placeholder | Buy → Every month |
| — | **Reset** | Panel → *Reset all state* |

Other panel controls: pause or resume each asset's price walk, set the buy price directly, nudge the price by ±0.1% / ±1% / ±5%, override the buffer per asset, adjust the poll interval, set the wallet balance and holdings, and filter the live event log. The log covers state changes, checks, triggers, buffer misses, fills, fails, notifications, trades, price moves and demo actions, each with a timestamp.

## Out of scope (v1)

Stop-loss, take-profit, good-till-cancelled, partial fills, modify-in-place, auto-resize and payment retries.
