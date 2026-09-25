import { ASSETS, ASSET_IDS } from '../config';
import { COPY } from '../copy';
import { Bell, ChevronLeft, ChevronRight, Target } from '../components/Icons';
import Sparkline from '../components/Sparkline';
import { AssetCoin, Flash, TabBar } from '../components/ui';
import { todayPrice } from '../engine/ledger';
import { aed, pct, price } from '../lib/format';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';

export default function AssetPage() {
  const { state } = useStore();
  const { asset, setAsset, push, reset } = useNav();
  const cfg = ASSETS[asset];
  const buy = todayPrice(state, asset, 'buy');
  const sell = todayPrice(state, asset, 'sell');
  const m = state.market[asset];
  const change = (buy - m.openBuy) / m.openBuy;
  const holdings = state.holdings[asset];
  const openCount = state.orders.filter(o => o.asset === asset && (o.status === 'OPEN' || o.status === 'TRIGGERED')).length;
  const unread = state.notifications.filter(n => !n.read).length;

  return (
    <div className={`screen asset-page asset-page--${asset}`}>
      <header className="asset-page__head">
        <button className="icon-btn" aria-label="Back to Botim Money">
          <ChevronLeft />
        </button>
        <div className="asset-tabs" role="tablist">
          {ASSET_IDS.map(a => (
            <button key={a} role="tab" className={`asset-tabs__tab${a === asset ? ' active' : ''}`} onClick={() => setAsset(a)}>
              {ASSETS[a].label}
            </button>
          ))}
        </div>
        <button className="icon-btn" aria-label="Inbox" onClick={() => reset('inbox')}>
          <Bell />
          {unread > 0 && <span className="badge badge--dot">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </header>

      <div className="screen__body">
        <div className="asset-page__rate-row">
          <div className="live-badge">
            <span className="live-dot" />
            <span>{COPY.asset.live}</span>
          </div>
          <AssetCoin asset={asset} size={42} />
        </div>

        <section className="card price-card">
          <p className="price-card__label">{COPY.asset.buyPrice} · {cfg.label} {cfg.purity}</p>
          <p className="price-card__big">
            <Flash value={buy}>{price(asset, buy)}</Flash>
            <span className="price-card__unit">{COPY.asset.perGram}</span>
          </p>
          <p className={`price-card__change ${change >= 0 ? 'up' : 'down'}`}>
            {change >= 0 ? '▲' : '▼'} {pct(change, 2)} <span>{COPY.asset.sinceOpen}</span>
          </p>
          <Sparkline data={m.history} height={70} />
          <div className="price-card__split">
            <div>
              <p className="price-card__mini-label">{COPY.asset.buyPrice}</p>
              <p className="price-card__mini"><Flash value={buy}>{price(asset, buy)}</Flash></p>
            </div>
            <div>
              <p className="price-card__mini-label">{COPY.asset.sellPrice}</p>
              <p className="price-card__mini"><Flash value={sell}>{price(asset, sell)}</Flash></p>
            </div>
          </div>
        </section>

        <section className="card holdings-strip">
          <div>
            <p className="holdings-strip__title">{COPY.asset.youOwn(asset, holdings)}</p>
            <p className="holdings-strip__sub">{COPY.asset.worth(holdings * sell)}</p>
          </div>
        </section>

        <div className="action-row">
          <button className="btn btn-outline" onClick={() => push({ name: 'sell', asset })}>
            {COPY.asset.sell}
          </button>
          <button className="btn btn-brand" onClick={() => push({ name: 'buy', asset })}>
            {COPY.asset.buy}
          </button>
        </div>

        <button className="set-price-btn" onClick={() => push({ name: 'buy', asset, tab: 'price' })}>
          <span className="set-price-btn__icon"><Target size={22} /></span>
          <span className="set-price-btn__text">
            <span className="set-price-btn__title">
              {COPY.asset.setPrice} <span className="chip chip-new">{COPY.asset.newBadge}</span>
            </span>
            <span className="set-price-btn__sub">{COPY.asset.setPriceSub}</span>
          </span>
          <ChevronRight />
        </button>

        <button className="list-row card" onClick={() => push({ name: 'orders', asset })}>
          <span className="list-row__text">
            <span className="list-row__title">{COPY.asset.priceOrders(openCount)}</span>
            <span className="list-row__sub">{COPY.asset.priceOrdersSub(openCount)}</span>
          </span>
          <ChevronRight />
        </button>

        <section className="how card">
          <p className="how__title">{COPY.asset.howTitle}</p>
          {COPY.asset.howSteps.map((s, i) => (
            <div className="how__step" key={s.title}>
              <span className="how__num">{i + 1}</span>
              <div>
                <p className="how__step-title">{s.title}</p>
                <p className="how__step-body">{s.body}</p>
              </div>
            </div>
          ))}
        </section>

        <p className="fine-print">Wallet {aed(state.wallet)} · Prices include our spread</p>
      </div>
      <TabBar />
    </div>
  );
}
