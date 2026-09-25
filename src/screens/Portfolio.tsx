import { ASSETS, ASSET_IDS } from '../config';
import { COPY } from '../copy';
import { ChevronRight, Wallet } from '../components/Icons';
import { AssetCoin, TabBar } from '../components/ui';
import { todayPrice } from '../engine/ledger';
import { isLive } from '../engine/orderMachine';
import { aed, fmtDateTime, grams, price } from '../lib/format';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';

interface Activity { id: string; at: number; title: string; sub: string; amount: string; positive: boolean; onClick?: () => void }

export default function Portfolio() {
  const { state } = useStore();
  const { push, setAsset, reset } = useNav();
  const openCount = state.orders.filter(isLive).length;
  const values = ASSET_IDS.map(a => state.holdings[a] * todayPrice(state, a, 'sell'));
  const total = values.reduce((s, v) => s + v, 0) + state.wallet;

  const activity: Activity[] = [
    ...state.orders.filter(o => o.status === 'FILLED' && o.fill).map(o => ({
      id: o.id,
      at: o.fill!.at,
      title: `${o.side === 'buy' ? 'Bought' : 'Sold'} ${ASSETS[o.asset].label.toLowerCase()} · price order`,
      sub: `${grams(o.fill!.grams)} at ${price(o.asset, o.fill!.price)} · ${fmtDateTime(o.fill!.at)}`,
      amount: `${o.side === 'buy' ? '−' : '+'}${aed(o.side === 'buy' ? o.fill!.amountAed + o.fill!.fee : o.fill!.amountAed - o.fill!.fee)}`,
      positive: o.side === 'sell',
      onClick: () => push({ name: 'orderDetail', orderId: o.id }),
    })),
    ...state.trades.filter(t => t.ok).map(t => ({
      id: t.id,
      at: t.at,
      title: `${t.side === 'buy' ? 'Bought' : 'Sold'} ${ASSETS[t.asset].label.toLowerCase()}`,
      sub: `${grams(t.grams)} at ${price(t.asset, t.price)} · ${fmtDateTime(t.at)}`,
      amount: `${t.side === 'buy' ? '−' : '+'}${aed(t.side === 'buy' ? t.amountAed + t.fee : t.amountAed - t.fee)}`,
      positive: t.side === 'sell',
    })),
  ].sort((a, b) => b.at - a.at).slice(0, 8);

  return (
    <div className="screen">
      <header className="screen__head screen__head--root">
        <p className="screen__title screen__title--lg">{COPY.portfolio.title}</p>
      </header>
      <div className="screen__body">
        <section className="card portfolio-total">
          <p className="portfolio-total__label">{COPY.portfolio.total}</p>
          <p className="portfolio-total__value">{aed(total)}</p>
          <div className="portfolio-total__wallet">
            <Wallet size={16} />
            <span>{COPY.portfolio.wallet}</span>
            <strong>{aed(state.wallet)}</strong>
          </div>
        </section>

        <p className="section-label section-label--pad">{COPY.portfolio.holdings}</p>
        {ASSET_IDS.map((a, i) => (
          <button key={a} className="holding-row card" onClick={() => { setAsset(a); reset('asset'); }}>
            <AssetCoin asset={a} size={40} />
            <span className="holding-row__text">
              <span className="holding-row__title">{ASSETS[a].label}</span>
              <span className="holding-row__sub">{COPY.portfolio.value(values[i])}</span>
            </span>
            <span className="holding-row__grams">{grams(state.holdings[a])}</span>
          </button>
        ))}

        <button className="list-row card" onClick={() => push({ name: 'orders' })}>
          <span className="list-row__text">
            <span className="list-row__title">{COPY.portfolio.priceOrders(openCount)}</span>
            <span className="list-row__sub">{COPY.asset.priceOrdersSub(openCount)}</span>
          </span>
          <ChevronRight />
        </button>

        <p className="section-label section-label--pad">{COPY.portfolio.activity}</p>
        {activity.length === 0 ? (
          <p className="fine-print">{COPY.portfolio.noActivity}</p>
        ) : (
          <div className="card activity">
            {activity.map(a => (
              <button key={a.id} className="activity__row" onClick={a.onClick} disabled={!a.onClick}>
                <span className="activity__text">
                  <span className="activity__title">{a.title}</span>
                  <span className="activity__sub">{a.sub}</span>
                </span>
                <span className={`activity__amount${a.positive ? ' pos' : ''}`}>{a.amount}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
