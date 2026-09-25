import {
  ASSETS,
  ASSET_IDS,
  DEFAULT_EXEC_JITTER,
  MOCK_USER,
  POLL_INTERVAL_MS,
  SPARKLINE_POINTS,
  type AssetId,
} from '../config';
import { customerBuyPrice, gaussian } from '../engine/priceEngine';
import type { AppNotification, LogEntry, MarketTrade, Order } from '../types';

export interface MarketState {
  mid: number;
  /** Customer buy price at session start, for "since you opened the app". */
  openBuy: number;
  paused: boolean;
  /** Recent customer buy prices for the sparkline. */
  history: number[];
}

export interface Settings {
  pollIntervalMs: number;
  buffer: Record<AssetId, number>;
  /** Max re-quote jitter as a fraction of price. */
  execJitter: number;
  /** When true, jitter always moves against the user (forces buffer misses). */
  jitterAdverse: boolean;
  forceCardAuthFail: boolean;
  forceCardDebitDecline: boolean;
}

export interface AppState {
  clockOffsetMs: number;
  nextId: number;
  nextSeq: number;
  market: Record<AssetId, MarketState>;
  settings: Settings;
  wallet: number;
  holdings: Record<AssetId, number>;
  orders: Order[];
  notifications: AppNotification[];
  trades: MarketTrade[];
  log: LogEntry[];
  lastPollRealAt: number | null;
  demoHint: string | null;
}

/** Seeds the sparkline with a plausible recent walk ending at today's price. */
function seedHistory(asset: AssetId, buy: number): number[] {
  const out = [buy];
  for (let i = 1; i < SPARKLINE_POINTS; i++) out.unshift(out[0] / (1 + ASSETS[asset].walkVolatility * gaussian()));
  return out;
}

function initialMarket(asset: AssetId): MarketState {
  const mid = ASSETS[asset].startMid;
  const buy = customerBuyPrice(asset, mid);
  return { mid, openBuy: buy, paused: false, history: seedHistory(asset, buy) };
}

export function initialState(realNow: number): AppState {
  return {
    clockOffsetMs: 0,
    nextId: 1,
    nextSeq: 1,
    market: { gold: initialMarket('gold'), silver: initialMarket('silver') },
    settings: {
      pollIntervalMs: POLL_INTERVAL_MS,
      buffer: { gold: ASSETS.gold.buffer, silver: ASSETS.silver.buffer },
      execJitter: DEFAULT_EXEC_JITTER,
      jitterAdverse: false,
      forceCardAuthFail: false,
      forceCardDebitDecline: false,
    },
    wallet: MOCK_USER.walletAed,
    holdings: { ...MOCK_USER.holdings },
    orders: [],
    notifications: [],
    trades: [],
    log: [
      { id: 0, simAt: realNow, realAt: realNow, kind: 'demo', msg: 'Session started' },
    ],
    lastPollRealAt: null,
    demoHint: null,
  };
}

export const assetIds = ASSET_IDS;
