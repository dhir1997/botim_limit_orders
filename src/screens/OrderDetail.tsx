import { useState } from 'react';
import { FEE_AED } from '../config';
import { COPY } from '../copy';
import { Alert, Clock, Refresh } from '../components/Icons';
import { AssetCoin, Row, Screen, Sheet, StatusPill } from '../components/ui';
import { todayPrice } from '../engine/ledger';
import { aed, fmtDate, fmtDateTime, grams, price, timeLeft } from '../lib/format';
import { useNav } from '../store/NavProvider';
import { useSimNow, useStore } from '../store/StoreProvider';
import type { Order } from '../types';
import { distanceLabel } from './PriceOrders';

function FillSummary({ o, buffer }: { o: Order; buffer: number }) {
  const f = o.fill!;
  const perGramDiff = Math.abs(f.slippagePerGram);
  let note: string;
  if (perGramDiff < 1e-9) note = COPY.detail.exact;
  else if (f.favourable) note = o.side === 'buy' ? COPY.detail.better(price(o.asset, perGramDiff) + '/g') : COPY.detail.betterSell(price(o.asset, perGramDiff) + '/g');
  else note = COPY.detail.within(price(o.asset, perGramDiff) + '/g', buffer);
  return (
    <section className="card card-p">
      <p className="section-label">Result</p>
      <Row label={COPY.detail.filledAt} value={`${price(o.asset, f.price)}/g`} tone={f.favourable ? 'green' : undefined} strong />
      <Row label={COPY.detail.yourPrice} value={`${price(o.asset, f.limit)}/g`} />
      <Row label={COPY.detail.grams} value={grams(f.grams)} />
      <Row label={COPY.detail.fee} value={aed(f.fee)} />
      {o.side === 'buy' ? (
        <Row label={COPY.detail.totalCharged} value={aed(f.amountAed + f.fee)} strong />
      ) : (
        <Row label={COPY.detail.received} value={aed(f.amountAed - f.fee)} strong />
      )}
      <p className={`note ${f.favourable || perGramDiff < 1e-9 ? 'note--green' : 'note--grey'}`}>{note}</p>
    </section>
  );
}

function OutcomeBox({ o }: { o: Order }) {
  const { push } = useNav();
  // Grams aren't carried over for sells: holdings may have changed since.
  const setNew = () => push({ name: o.side, asset: o.asset, tab: 'price', prefill: { amountAed: o.amountAed } });

  if (o.status === 'FAILED' && o.failReason) {
    return (
      <div className="outcome outcome--red">
        <Alert size={20} />
        <div>
          <p className="outcome__title">{COPY.notif.failedTitle(o.asset)}</p>
          <p className="outcome__body">{COPY.reasons[o.failReason]} Nothing was charged.</p>
          {o.side === 'buy' ? (
            <button className="btn btn-brand btn-sm" onClick={() => push({ name: 'buy', asset: o.asset, tab: 'now', amountAed: o.amountAed, fromOrderId: o.id })}>
              {COPY.notif.ctaBuyNow}
            </button>
          ) : (
            <button className="btn btn-brand btn-sm" onClick={setNew}>{COPY.notif.ctaSetPrice}</button>
          )}
        </div>
      </div>
    );
  }
  if (o.status === 'AUTO_CANCELLED') {
    return (
      <div className="outcome outcome--amber">
        <Refresh size={20} />
        <div>
          <p className="outcome__title">{COPY.notif.autoTitle}</p>
          <p className="outcome__body">{o.cancelReason}. We cancel the newest sell orders first so your older ones stay open.</p>
          <button className="btn btn-brand btn-sm" onClick={setNew}>{COPY.notif.ctaSetPrice}</button>
        </div>
      </div>
    );
  }
  if (o.status === 'EXPIRED') {
    return (
      <div className="outcome outcome--grey">
        <Clock size={20} />
        <div>
          <p className="outcome__title">{COPY.notif.expiredTitle}</p>
          <p className="outcome__body">{COPY.notif.expiredBody(o.side, o.asset, o.limitPrice)}</p>
          <button className="btn btn-brand btn-sm" onClick={setNew}>{COPY.notif.ctaSetPrice}</button>
        </div>
      </div>
    );
  }
  if (o.status === 'CANCELLED') {
    return (
      <div className="outcome outcome--grey">
        <Clock size={20} />
        <div>
          <p className="outcome__title">{COPY.notif.cancelledTitle}</p>
          <p className="outcome__body">{o.cancelReason}. Nothing was charged.</p>
          <button className="btn btn-outline btn-sm" onClick={setNew}>{COPY.notif.ctaSetPrice}</button>
        </div>
      </div>
    );
  }
  return null;
}

export default function OrderDetail({ orderId }: { orderId: string }) {
  const { state, dispatch } = useStore();
  const { pop, replace } = useNav();
  const now = useSimNow();
  const [sheet, setSheet] = useState<'cancel' | 'change' | null>(null);
  const o = state.orders.find(x => x.id === orderId);

  if (!o) {
    return (
      <Screen title={COPY.detail.title} onBack={pop}>
        <p className="lead">This order no longer exists (the demo may have been reset).</p>
      </Screen>
    );
  }

  const open = o.status === 'OPEN' || o.status === 'TRIGGERED';
  const today = todayPrice(state, o.asset, o.side);
  const headline = o.side === 'buy'
    ? `Buy ${aed(o.amountAed!)} of ${o.asset}`
    : `Sell ${grams(o.grams!)} of ${o.asset}`;

  const cancel = () => {
    dispatch({ type: 'CANCEL_ORDER', orderId: o.id, reason: 'user', realNow: Date.now() });
    setSheet(null);
  };
  const change = () => {
    dispatch({ type: 'CANCEL_ORDER', orderId: o.id, reason: 'change', realNow: Date.now() });
    setSheet(null);
    replace({
      name: o.side,
      asset: o.asset,
      tab: 'price',
      prefill: { limitPrice: o.limitPrice, amountAed: o.amountAed, grams: o.grams, validityDays: o.validityDays },
    });
  };

  return (
    <Screen
      title={COPY.detail.title}
      onBack={pop}
      footer={
        o.status === 'OPEN' ? (
          <div className="btn-row">
            <button className="btn btn-danger-outline" onClick={() => setSheet('cancel')}>{COPY.detail.cancel}</button>
            <button className="btn btn-outline" onClick={() => setSheet('change')}>{COPY.detail.change}</button>
          </div>
        ) : undefined
      }
    >
      <section className="card detail-hero">
        <div className="detail-hero__top">
          <AssetCoin asset={o.asset} size={44} />
          <StatusPill status={o.status} />
        </div>
        <p className="detail-hero__title">{headline}</p>
        <p className="detail-hero__sub">{COPY.review.whenValue(o.side, o.asset, o.limitPrice)}</p>
        {open && (
          <div className="detail-hero__live">
            <span>{distanceLabel(state, o)}</span>
            <span>{timeLeft(o.expiresAt - now)}</span>
          </div>
        )}
      </section>

      <OutcomeBox o={o} />
      {o.status === 'FILLED' && o.fill && <FillSummary o={o} buffer={state.settings.buffer[o.asset]} />}

      <section className="card card-p">
        <Row label={COPY.detail.yourPrice} value={`${price(o.asset, o.limitPrice)}/g`} />
        {open && <Row label={COPY.detail.todaysPrice} value={`${price(o.asset, today)}/g`} />}
        <Row label={COPY.detail.amount} value={o.side === 'buy' ? aed(o.amountAed!) : grams(o.grams!)} />
        {o.side === 'buy' && open && <Row label={COPY.ticket.fee} value={`${aed(FEE_AED)} when it goes through`} />}
        {o.paymentMethod && <Row label={COPY.detail.payWith} value={o.paymentMethod === 'card' ? COPY.cardName : COPY.payment.wallet} />}
        <Row label={COPY.detail.placed} value={fmtDateTime(o.createdAt)} />
        <Row label={COPY.detail.ends} value={fmtDate(o.expiresAt)} />
        <Row label={COPY.detail.orderId} value={<span className="mono">{o.id}</span>} />
      </section>

      <section className="card card-p">
        <p className="section-label">{COPY.detail.timeline}</p>
        <ol className="timeline">
          {[...o.timeline].reverse().map((t, i) => (
            <li key={i} className={`timeline__item timeline__item--${t.status.toLowerCase()}`}>
              <span className="timeline__dot" />
              <div>
                <p className="timeline__title">{COPY.status[t.status]}</p>
                {t.note && <p className="timeline__note">{t.note}</p>}
                <p className="timeline__time">{fmtDateTime(t.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {o.status === 'OPEN' && <p className="fine-print">{COPY.detail.changeHint}</p>}

      <Sheet open={sheet === 'cancel'} onClose={() => setSheet(null)}>
        <p className="sheet__title">{COPY.detail.cancelSheetTitle}</p>
        <p className="sheet__body">{o.side === 'buy' ? COPY.detail.cancelSheetBody : COPY.detail.cancelSheetBodySell}</p>
        <div className="stack">
          <button className="btn btn-danger" onClick={cancel}>{COPY.detail.cancelConfirm}</button>
          <button className="btn btn-outline" onClick={() => setSheet(null)}>{COPY.detail.keep}</button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'change'} onClose={() => setSheet(null)}>
        <p className="sheet__title">{COPY.detail.changeSheetTitle}</p>
        <p className="sheet__body">{COPY.detail.changeSheetBody}</p>
        <div className="stack">
          <button className="btn btn-brand" onClick={change}>{COPY.detail.changeConfirm}</button>
          <button className="btn btn-outline" onClick={() => setSheet(null)}>{COPY.detail.keep}</button>
        </div>
      </Sheet>
    </Screen>
  );
}
