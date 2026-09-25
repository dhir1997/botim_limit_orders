import { useState } from 'react';
import { ASSETS, ASSET_IDS, type AssetId } from '../config';
import { COPY } from '../copy';
import { ChevronRight, Clock, Target } from '../components/Icons';
import { AssetCoin, EmptyState, Screen, StatusPill } from '../components/ui';
import { todayPrice } from '../engine/ledger';
import { HISTORY_STATUSES, isLive } from '../engine/orderMachine';
import { aed, fmtDateTime, grams, price, timeLeft } from '../lib/format';
import { useNav } from '../store/NavProvider';
import { useSimNow, useStore } from '../store/StoreProvider';
import type { Order } from '../types';
import type { AppState } from '../store/state';

export function distanceLabel(state: AppState, o: Order): string {
  const today = todayPrice(state, o.asset, o.side);
  if (o.side === 'buy') {
    const f = (today - o.limitPrice) / today;
    return f <= 0 ? COPY.orders.atPrice : COPY.orders.needsDrop(f);
  }
  const f = (o.limitPrice - today) / today;
  return f <= 0 ? COPY.orders.atPrice : COPY.orders.needsRise(f);
}

export default function PriceOrders({ asset: initialAsset, tab: initialTab }: { asset?: AssetId; tab?: 'open' | 'history' }) {
  const { state } = useStore();
  const { pop, push } = useNav();
  const now = useSimNow();
  const [tab, setTab] = useState<'open' | 'history'>(initialTab ?? 'open');
  const [filter, setFilter] = useState<AssetId | 'all'>(initialAsset ?? 'all');

  const byAsset = state.orders.filter(o => filter === 'all' || o.asset === filter);
  const open = byAsset.filter(isLive).sort((a, b) => b.seq - a.seq);
  const history = byAsset
    .filter(o => HISTORY_STATUSES.includes(o.status))
    .sort((a, b) => b.timeline[b.timeline.length - 1].at - a.timeline[a.timeline.length - 1].at);
  const list = tab === 'open' ? open : history;
  const newAsset = filter === 'all' ? 'gold' : filter;

  return (
    <Screen title={COPY.orders.title} onBack={pop}>
      <div className="seg">
        <button className={`seg__btn${tab === 'open' ? ' active' : ''}`} onClick={() => setTab('open')}>
          {COPY.orders.open} ({open.length})
        </button>
        <button className={`seg__btn${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          {COPY.orders.history} ({history.length})
        </button>
      </div>

      <div className="chips chips--left">
        {(['all', ...ASSET_IDS] as const).map(a => (
          <button key={a} className={`chip-btn chip-btn--sm${filter === a ? ' active' : ''}`} onClick={() => setFilter(a)}>
            {a === 'all' ? COPY.orders.all : ASSETS[a].label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        tab === 'open' ? (
          <EmptyState
            icon={<Target size={28} />}
            title={COPY.orders.emptyOpen}
            body={COPY.orders.emptyOpenSub}
            action={
              <button className="btn btn-brand btn-inline" onClick={() => push({ name: 'buy', asset: newAsset, tab: 'price' })}>
                {COPY.asset.setPrice}
              </button>
            }
          />
        ) : (
          <EmptyState icon={<Clock size={28} />} title={COPY.orders.emptyHistory} body={COPY.orders.emptyHistorySub} />
        )
      ) : (
        <div className="order-list">
          {list.map(o => (
            <button key={o.id} className="order-card card" onClick={() => push({ name: 'orderDetail', orderId: o.id })}>
              <AssetCoin asset={o.asset} size={38} />
              <div className="order-card__main">
                <div className="order-card__top">
                  <span className={`side-tag side-tag--${o.side}`}>{COPY.orders.side(o.side, o.asset)}</span>
                  {tab === 'history' && <StatusPill status={o.status} />}
                </div>
                <p className="order-card__price">
                  {price(o.asset, o.limitPrice)}<span>/g</span>
                  <span className="order-card__amount"> · {o.side === 'buy' ? aed(o.amountAed!) : grams(o.grams!)}</span>
                </p>
                {tab === 'open' ? (
                  <p className="order-card__meta">
                    <span className="order-card__dist">{distanceLabel(state, o)}</span>
                    <span>· {timeLeft(o.expiresAt - now)}</span>
                  </p>
                ) : (
                  <p className="order-card__meta">
                    {o.fill ? `Filled at ${price(o.asset, o.fill.price)} · ` : ''}
                    {fmtDateTime(o.timeline[o.timeline.length - 1].at)}
                  </p>
                )}
              </div>
              <ChevronRight />
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}
