// ── Prototype configuration ──────────────────────────────────────────────────
// Every tunable value lives here. Brand colours live in src/styles/tokens.css.

export type AssetId = 'gold' | 'silver';
export const ASSET_IDS: AssetId[] = ['gold', 'silver'];

export interface AssetConfig {
  id: AssetId;
  label: string;
  purity: string;
  /** Starting mid price, AED per gram. */
  startMid: number;
  /** Spread applied either side of mid. Customer buy = mid × (1 + markup). */
  markup: number;
  /** Execution tolerance around the user's price when a triggered order is re-quoted. */
  buffer: number;
  /** Decimal places when showing a per-gram price. */
  priceDecimals: number;
  /** Std-dev of each random-walk step, as a fraction of mid. */
  walkVolatility: number;
}

export const ASSETS: Record<AssetId, AssetConfig> = {
  gold: {
    id: 'gold',
    label: 'Gold',
    purity: '24K',
    startMid: 520.0,
    markup: 0.012,
    buffer: 0.0025,
    priceDecimals: 2,
    walkVolatility: 0.0006,
  },
  silver: {
    id: 'silver',
    label: 'Silver',
    purity: '.999',
    startMid: 6.2,
    markup: 0.025,
    buffer: 0.005,
    priceDecimals: 3,
    walkVolatility: 0.0012,
  },
};

// ── Engines ──────────────────────────────────────────────────────────────────
export const PRICE_TICK_MS = 2000;
export const POLL_INTERVAL_MS = 5000;
export const SPARKLINE_POINTS = 60;

/** Default max re-quote jitter (fraction of price) to simulate execution delay. */
export const DEFAULT_EXEC_JITTER = 0.0004;

// ── Fees & limits ────────────────────────────────────────────────────────────
export const FEE_AED = 1;
export const MIN_BUY_AED = 10;
export const CARD_AUTH_HOLD_AED = 0.1;
export const CARD_AUTH_DELAY_MS = 1800;

// ── Ticket defaults ──────────────────────────────────────────────────────────
export const VALIDITY_OPTIONS = [1, 7, 30, 60, 90] as const;
export const DEFAULT_VALIDITY_DAYS = 7;
/** Buy tickets prefill at today's price −2%, sell tickets at +2%. */
export const DEFAULT_PRICE_OFFSET = 0.02;
/** Step used by the −/+ buttons on the price field. */
export const PRICE_STEP_PCT = 0.005;
export const BUY_AMOUNT_CHIPS = [50, 100, 500];
export const SELL_PCT_CHIPS = [25, 50, 100];

export const EXPIRY_WARNING_MS = 24 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

// ── Mock user ────────────────────────────────────────────────────────────────
export const MOCK_USER = {
  name: 'Sara',
  walletAed: 500,
  holdings: { gold: 2.0, silver: 50 } as Record<AssetId, number>,
  card: { brand: 'Visa', last4: '4821' },
};

export const GRAM_DECIMALS = 4;
export const LOG_LIMIT = 600;
