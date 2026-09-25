import { useEffect, useMemo, useState } from 'react';
import { ASSETS, ASSET_IDS, DAY_MS, HOUR_MS, type AssetId } from '../config';
import { todayPrice } from '../engine/ledger';
import { fmtClock, fmtDateTime } from '../lib/format';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';
import type { LogKind } from '../types';
import { PRESETS } from './presets';
import './DemoPanel.css';

const NUDGES = [-0.05, -0.01, -0.001, 0.001, 0.01, 0.05];
const FAST_FORWARDS = [
  { label: '+1 hour', ms: HOUR_MS },
  { label: '+1 day', ms: DAY_MS },
  { label: '+7 days', ms: 7 * DAY_MS },
  { label: '+30 days', ms: 30 * DAY_MS },
];
const LOG_KINDS: { kind: LogKind; label: string }[] = [
  { kind: 'transition', label: 'State' },
  { kind: 'eval', label: 'Checks' },
  { kind: 'trigger', label: 'Triggers' },
  { kind: 'miss', label: 'Buffer miss' },
  { kind: 'fill', label: 'Fills' },
  { kind: 'fail', label: 'Fails' },
  { kind: 'notify', label: 'Notifs' },
  { kind: 'trade', label: 'Trades' },
  { kind: 'price', label: 'Price' },
  { kind: 'demo', label: 'Demo' },
];

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="dp-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="dp-section__body">{children}</div>
    </details>
  );
}

/** Number input that commits on Enter / blur, so typing isn't fought by live updates. */
function CommitInput({ value, onCommit, step = 'any', suffix }: { value: number; onCommit: (n: number) => void; step?: string; suffix?: string }) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const n = Number(text);
    if (Number.isFinite(n) && n >= 0) onCommit(n);
    setText(null);
  };
  return (
    <span className="dp-input">
      <input
        type="number"
        step={step}
        value={text ?? String(value)}
        onFocus={() => setText(String(value))}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      {suffix && <em>{suffix}</em>}
    </span>
  );
}

function AssetControls({ asset }: { asset: AssetId }) {
  const { state, dispatch } = useStore();
  const cfg = ASSETS[asset];
  const m = state.market[asset];
  const buy = todayPrice(state, asset, 'buy');
  const sell = todayPrice(state, asset, 'sell');
  const dp = cfg.priceDecimals;
  const newest = state.orders
    .filter(o => o.asset === asset && o.status === 'OPEN')
    .sort((a, b) => b.seq - a.seq)[0];

  // Move today's price exactly onto the newest order's price, so it triggers on
  // the next check with no room to spare — combine with jitter to force a miss.
  const touchNewest = () => {
    if (!newest) return;
    const buyTarget = newest.side === 'buy'
      ? newest.limitPrice
      : (newest.limitPrice / (1 - cfg.markup)) * (1 + cfg.markup);
    dispatch({ type: 'DEMO_SET_BUY_PRICE', asset, buy: buyTarget, realNow: Date.now() });
  };

  return (
    <div className="dp-asset">
      <div className="dp-asset__head">
        <strong>{cfg.label}</strong>
        <button className={`dp-btn dp-btn--sm${m.paused ? ' dp-btn--warn' : ''}`} onClick={() => dispatch({ type: 'DEMO_TOGGLE_PAUSE', asset, realNow: Date.now() })}>
          {m.paused ? '▶ Resume walk' : '❚❚ Pause walk'}
        </button>
      </div>
      <div className="dp-prices">
        <span>mid <b>{m.mid.toFixed(dp + 1)}</b></span>
        <span>buy <b>{buy.toFixed(dp)}</b></span>
        <span>sell <b>{sell.toFixed(dp)}</b></span>
      </div>
      <div className="dp-row">
        <label>Set buy price</label>
        <CommitInput value={Number(buy.toFixed(dp))} onCommit={n => n > 0 && dispatch({ type: 'DEMO_SET_BUY_PRICE', asset, buy: n, realNow: Date.now() })} />
      </div>
      <div className="dp-nudges">
        {NUDGES.map(p => (
          <button key={p} className={`dp-btn dp-btn--sm ${p < 0 ? 'dp-btn--down' : 'dp-btn--up'}`} onClick={() => dispatch({ type: 'DEMO_NUDGE', asset, pct: p, realNow: Date.now() })}>
            {p > 0 ? '+' : '−'}{Math.abs(p * 100) < 1 ? Math.abs(p * 100).toFixed(1) : Math.abs(p * 100).toFixed(0)}%
          </button>
        ))}
      </div>
      <button className="dp-btn dp-btn--sm" disabled={!newest} onClick={touchNewest}>
        {newest ? `⌖ Move price to newest order (${newest.id} ${newest.side} @ ${newest.limitPrice.toFixed(dp)})` : '⌖ Move price to newest order (none open)'}
      </button>
      <div className="dp-row">
        <label>Buffer</label>
        <CommitInput
          value={Number((state.settings.buffer[asset] * 100).toFixed(3))}
          suffix="%"
          onCommit={n => dispatch({ type: 'DEMO_SET_BUFFER', asset, buffer: n / 100, realNow: Date.now() })}
        />
        <span className="dp-muted">default {(cfg.buffer * 100).toFixed(2)}%</span>
      </div>
      <div className="dp-row">
        <label>Holdings</label>
        <CommitInput value={Number(state.holdings[asset].toFixed(4))} suffix="g" onCommit={n => dispatch({ type: 'DEMO_SET_HOLDINGS', asset, grams: n, realNow: Date.now() })} />
      </div>
    </div>
  );
}

function PollCountdown() {
  const { state } = useStore();
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 250);
    return () => clearInterval(t);
  }, []);
  const last = state.lastPollRealAt;
  const left = last ? Math.max(state.settings.pollIntervalMs - (Date.now() - last), 0) : null;
  return <span className="dp-muted">{left === null ? 'waiting for first check…' : `next check in ${(left / 1000).toFixed(1)}s`}</span>;
}

export default function DemoPanel() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const [collapsed, setCollapsed] = useState(false);
  const [kinds, setKinds] = useState<Set<LogKind>>(new Set(LOG_KINDS.map(k => k.kind).filter(k => k !== 'eval')));
  const s = state.settings;
  const simNow = Date.now() + state.clockOffsetMs;

  const logs = useMemo(() => [...state.log].reverse().filter(l => kinds.has(l.kind)), [state.log, kinds]);
  const toggleKind = (k: LogKind) =>
    setKinds(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  if (collapsed) {
    return (
      <button className="dp-collapsed" onClick={() => setCollapsed(false)}>
        ⚙ Demo controls
      </button>
    );
  }

  return (
    <aside className="dp">
      <div className="dp-head">
        <div>
          <p className="dp-title">Demo controls</p>
          <p className="dp-muted">Outside the app · not seen by users</p>
        </div>
        <button className="dp-btn dp-btn--sm" onClick={() => setCollapsed(true)}>Hide ✕</button>
      </div>

      {state.demoHint && (
        <div className="dp-hint">
          <span>💡 {state.demoHint}</span>
          <button onClick={() => dispatch({ type: 'DEMO_HINT', hint: null })} aria-label="Dismiss hint">✕</button>
        </div>
      )}

      <Section title="Scenarios">
        <div className="dp-presets">
          {PRESETS.map(p => (
            <button key={p.key} className="dp-preset" onClick={() => p.run({ dispatch, reset: nav.reset, setAsset: nav.setAsset })}>
              <strong>{p.label}</strong>
              <span>{p.description}</span>
            </button>
          ))}
        </div>
        <button className="dp-btn dp-btn--danger" onClick={() => { dispatch({ type: 'RESET', realNow: Date.now() }); nav.reset('asset'); }}>
          Reset all state
        </button>
      </Section>

      <Section title="Prices">
        {ASSET_IDS.map(a => <AssetControls key={a} asset={a} />)}
      </Section>

      <Section title="Engine">
        <div className="dp-row">
          <label>Poll interval</label>
          <input type="range" min={1000} max={15000} step={500} value={s.pollIntervalMs} onChange={e => dispatch({ type: 'DEMO_SET_POLL', ms: Number(e.target.value) })} />
          <b>{(s.pollIntervalMs / 1000).toFixed(1)}s</b>
        </div>
        <div className="dp-row"><label /> <PollCountdown /></div>
        <div className="dp-row">
          <label>Exec jitter</label>
          <input type="range" min={0} max={0.02} step={0.0001} value={s.execJitter} onChange={e => dispatch({ type: 'DEMO_SET_JITTER', jitter: Number(e.target.value) })} />
          <b>±{(s.execJitter * 100).toFixed(2)}%</b>
        </div>
        <label className="dp-check">
          <input type="checkbox" checked={s.jitterAdverse} onChange={e => dispatch({ type: 'DEMO_SET_JITTER_ADVERSE', adverse: e.target.checked, realNow: Date.now() })} />
          Jitter always against user (set jitter &gt; buffer to force misses)
        </label>
      </Section>

      <Section title="Time">
        <div className="dp-row">
          <label>Sim clock</label>
          <b>{fmtDateTime(simNow)}</b>
          {state.clockOffsetMs > 0 && <span className="dp-muted">(+{(state.clockOffsetMs / HOUR_MS).toFixed(1)}h)</span>}
        </div>
        <div className="dp-nudges">
          {FAST_FORWARDS.map(f => (
            <button key={f.label} className="dp-btn dp-btn--sm" onClick={() => dispatch({ type: 'DEMO_FAST_FORWARD', ms: f.ms, label: f.label, realNow: Date.now() })}>
              ⏩ {f.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Money & cards">
        <div className="dp-row">
          <label>Wallet</label>
          <CommitInput value={Number(state.wallet.toFixed(2))} suffix="AED" onCommit={n => dispatch({ type: 'DEMO_SET_WALLET', aed: n, realNow: Date.now() })} />
        </div>
        <label className="dp-check">
          <input type="checkbox" checked={s.forceCardAuthFail} onChange={e => dispatch({ type: 'DEMO_FORCE_AUTH_FAIL', on: e.target.checked, realNow: Date.now() })} />
          Force next card save (AED 0.10 check) to fail
        </label>
        <label className="dp-check">
          <input type="checkbox" checked={s.forceCardDebitDecline} onChange={e => dispatch({ type: 'DEMO_FORCE_DEBIT_DECLINE', on: e.target.checked, realNow: Date.now() })} />
          Force next card payment to decline
        </label>
      </Section>

      <Section title={`Event log (${state.log.length})`}>
        <div className="dp-kinds">
          {LOG_KINDS.map(k => (
            <button key={k.kind} className={`dp-kind dp-kind--${k.kind}${kinds.has(k.kind) ? ' on' : ''}`} onClick={() => toggleKind(k.kind)}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="dp-log">
          {logs.length === 0 && <p className="dp-muted">No entries for the selected filters.</p>}
          {logs.map(l => (
            <div key={l.id} className={`dp-log__row dp-log__row--${l.kind}`}>
              <span className="dp-log__time" title={`sim ${fmtDateTime(l.simAt)}`}>{fmtClock(l.realAt)}</span>
              <span className="dp-log__kind">{l.kind}</span>
              <span className="dp-log__msg">{l.msg}</span>
            </div>
          ))}
        </div>
      </Section>
    </aside>
  );
}
