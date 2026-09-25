import { COPY } from '../copy';
import { Alert, Check } from '../components/Icons';
import { Row } from '../components/ui';
import { aed, grams, price } from '../lib/format';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';

export default function MarketResult({ tradeId }: { tradeId: string }) {
  const { state } = useStore();
  const { reset, replace } = useNav();
  const t = state.trades.find(x => x.id === tradeId);
  if (!t) return null;

  if (!t.ok) {
    return (
      <div className="screen">
        <div className="screen__body result">
          <div className="result__icon result__icon--red"><Alert size={34} /></div>
          <p className="result__title">{COPY.marketResult.failTitle}</p>
          <p className="result__body">{t.failReason ? COPY.reasons[t.failReason].replace(' when the price was reached', '') : ''} Nothing was charged.</p>
        </div>
        <div className="screen__footer stack">
          {t.method === 'wallet' && (
            <button className="btn btn-brand" onClick={() => replace({ name: 'buy', asset: t.asset, amountAed: t.amountAed, method: 'card' })}>
              {COPY.marketResult.tryCard}
            </button>
          )}
          <button className="btn btn-outline" onClick={() => replace({ name: 'buy', asset: t.asset, amountAed: t.amountAed })}>
            {COPY.marketResult.back}
          </button>
        </div>
      </div>
    );
  }

  const net = t.side === 'buy' ? t.amountAed + t.fee : t.amountAed - t.fee;
  return (
    <div className="screen">
      <div className="screen__body result">
        <div className="result__icon result__icon--green result__icon--pop"><Check size={36} /></div>
        <p className="result__title">{t.side === 'buy' ? COPY.marketResult.buyOk(t.asset) : COPY.marketResult.sellOk(t.asset)}</p>
        <section className="card card-p result__card">
          <Row label="Price" value={`${price(t.asset, t.price)}/g`} />
          <Row label={COPY.detail.grams} value={grams(t.grams)} />
          <Row label={COPY.ticket.fee} value={aed(t.fee)} />
          <Row label={t.side === 'buy' ? COPY.detail.totalCharged : COPY.detail.received} value={aed(net)} strong />
        </section>
        {t.cancelledOrderIds.length > 0 && (
          <div className="outcome outcome--amber">
            <Alert size={20} />
            <div>
              <p className="outcome__body">{COPY.marketResult.cancelledOrders(t.cancelledOrderIds.length)}</p>
              <button className="link-btn" onClick={() => reset('asset', { name: 'orders', asset: t.asset, tab: 'history' })}>See which ones →</button>
            </div>
          </div>
        )}
      </div>
      <div className="screen__footer stack">
        <button className="btn btn-brand" onClick={() => reset('portfolio')}>{COPY.marketResult.viewPortfolio}</button>
        <button className="btn btn-outline" onClick={() => reset('asset')}>{COPY.marketResult.done}</button>
      </div>
    </div>
  );
}
