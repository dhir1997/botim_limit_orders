import { ASSETS, GRAM_DECIMALS, type AssetId, DAY_MS, HOUR_MS } from '../config';

export function fmtNum(n: number, dp = 2): string {
  return n.toLocaleString('en-AE', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function aed(n: number, dp = 2): string {
  return `AED ${fmtNum(n, dp)}`;
}

/** A per-gram price for an asset, with its configured precision. */
export function price(asset: AssetId, n: number): string {
  return aed(n, ASSETS[asset].priceDecimals);
}

export function grams(n: number, dp = GRAM_DECIMALS): string {
  return `${fmtNum(n, dp)} g`;
}

export function pct(fraction: number, dp = 1): string {
  return `${fmtNum(Math.abs(fraction) * 100, dp)}%`;
}

export function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function floorTo(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.floor(n * f + 1e-9) / f;
}

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function fmtClock(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function timeLeft(ms: number): string {
  if (ms <= 0) return 'Ending now';
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const mins = Math.floor((ms % HOUR_MS) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${Math.max(mins, 1)}m left`;
}

export function timeAgo(ms: number, now: number): string {
  const diff = Math.max(now - ms, 0);
  if (diff < 60_000) return 'Just now';
  if (diff < HOUR_MS) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  return `${Math.floor(diff / DAY_MS)}d ago`;
}

/** Parses user input like "1,234.5" → 1234.5, or NaN. */
export function parseNum(s: string): number {
  const cleaned = s.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '.') return NaN;
  return Number(cleaned);
}
