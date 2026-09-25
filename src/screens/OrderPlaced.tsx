import { COPY } from '../copy';
import { Check } from '../components/Icons';
import { Row } from '../components/ui';
import { aed, fmtDate, grams, price } from '../lib/format';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';

export default function OrderPlaced({ orderId }: { orderId: string }) {
  const { state } = useStore();
  const { reset } = useNav();
  const o = state.orders.find(x => x.id === orderId);

  if (!o) {
    return (
      <div className="screen screen--center">
        <p className="result__body">We couldn't place that order. Please try again.</p>
        <button className="btn btn-brand" style={{ width: 'auto', marginTop: 16 }} onClick={() => reset('asset')}>{COPY.placed.done}</button>
      </div>
    );
  }

  const amount = o.side === 'buy' ? aed(o.amountAed!) : grams(o.grams!);

  return (
    <div className="screen">
      <div className="screen__body result">
        <div className="result__icon result__icon--green result__icon--pop"><Check size={36} /></div>
        <p className="result__title">{COPY.placed.title}</p>
        <p className="result__body">{COPY.placed.body(o.side, o.asset, o.limitPrice, amount, fmtDate(o.expiresAt))}</p>
        <section className="card card-p result__card">
          <Row label={COPY.review.type} value={COPY.review.typeValue(o.side, o.asset)} />
          <Row label={COPY.ticket.yourPrice} value={`${price(o.asset, o.limitPrice)}/g`} />
          <Row label={COPY.ticket.amount} value={amount} />
          {o.paymentMethod && <Row label={COPY.detail.payWith} value={o.paymentMethod === 'card' ? COPY.cardName : COPY.payment.wallet} />}
          <Row label={COPY.ticket.ends} value={fmtDate(o.expiresAt)} />
          <Row label={COPY.placed.orderId} value={<span className="mono">{o.id}</span>} />
        </section>
      </div>
      <div className="screen__footer stack">
        <button className="btn btn-brand" onClick={() => reset('asset', { name: 'orders', asset: o.asset })}>{COPY.placed.viewOrders}</button>
        <button className="btn btn-outline" onClick={() => reset('asset')}>{COPY.placed.done}</button>
      </div>
    </div>
  );
}
