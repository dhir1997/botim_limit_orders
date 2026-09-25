import { useState } from 'react';
import { DAY_MS, FEE_AED } from '../config';
import { COPY } from '../copy';
import { Shield } from '../components/Icons';
import { Checkbox, Row, Screen } from '../components/ui';
import { validateTicket } from '../engine/validation';
import { aed, fmtDate, grams, price } from '../lib/format';
import { newOrderId } from '../lib/ids';
import { useNav } from '../store/NavProvider';
import { useSimNow, useStore } from '../store/StoreProvider';
import type { TicketDraft } from '../types';

export default function ReviewOrder({ draft }: { draft: TicketDraft }) {
  const { state, dispatch } = useStore();
  const { pop, push, replace } = useNav();
  const now = useSimNow();
  const [consent, setConsent] = useState(false);
  const [stale, setStale] = useState(false);
  const { asset, side } = draft;
  const buffer = state.settings.buffer[asset];

  const v = validateTicket(state, {
    asset,
    side,
    limitPrice: draft.limitPrice,
    amountAed: draft.amountAed ?? NaN,
    grams: draft.grams ?? NaN,
    replaceSellOrders: draft.replaceSellOrders,
  });
  const toCancel = draft.replaceSellOrders
    ? state.orders.filter(o => o.asset === asset && o.side === 'sell' && o.status === 'OPEN')
    : [];

  const submit = () => {
    if (!v.ok) {
      setStale(true);
      return;
    }
    if (side === 'buy') {
      push({ name: 'payment', draft });
      return;
    }
    const orderId = newOrderId();
    dispatch({ type: 'PLACE_ORDER', orderId, draft, realNow: Date.now() });
    replace({ name: 'placed', orderId });
  };

  return (
    <Screen
      title={COPY.review.title}
      onBack={pop}
      footer={
        <button className="btn btn-brand" disabled={!consent} onClick={submit}>
          {side === 'buy' ? COPY.review.continueBuy : COPY.review.place}
        </button>
      }
    >
      <section className="card card-p">
        <Row label={COPY.review.type} value={COPY.review.typeValue(side, asset)} />
        <Row label={COPY.review.when} value={COPY.review.whenValue(side, asset, draft.limitPrice)} tone="brand" />
        <Row label={COPY.review.todaysPrice} value={`${price(asset, v.today)}/g`} />
        {side === 'buy' ? (
          <>
            <Row label={COPY.ticket.amount} value={aed(draft.amountAed!)} />
            <Row label={COPY.review.estGrams} value={grams(draft.amountAed! / draft.limitPrice)} />
            <Row label={COPY.ticket.fee} value={aed(FEE_AED)} />
            <Row label={COPY.review.totalAtFill} value={aed(draft.amountAed! + FEE_AED)} strong />
          </>
        ) : (
          <>
            <Row label={COPY.ticket.amount} value={grams(draft.grams!)} />
            <Row label={COPY.ticket.fee} value={aed(FEE_AED)} />
            <Row label={COPY.review.estProceeds} value={COPY.flow.receiveApprox(draft.grams! * draft.limitPrice - FEE_AED)} strong />
          </>
        )}
        <Row label={COPY.ticket.ends} value={fmtDate(now + draft.validityDays * DAY_MS)} />
      </section>

      {toCancel.length > 0 && (
        <div className="pending-note">
          <p className="pending-note__title">{COPY.flow.pendingCancel(toCancel.length)}</p>
          {toCancel.map(o => (
            <p key={o.id} className="pending-note__body">{COPY.notif.batchLine(o.asset, o.grams ?? 0, o.limitPrice)}</p>
          ))}
        </div>
      )}

      {(stale || !v.ok) && (
        <div className="inline-error inline-error--box">
          <p>{v.priceError ? COPY.review.priceMoved : v.gramsError ?? v.amountError}</p>
          <button className="link-btn" onClick={pop}>← Change my order</button>
        </div>
      )}

      <section className="disclosures">
        <p className="section-label">Good to know</p>
        <ul>
          <li>{COPY.review.disclosures.buffer(buffer, side)}</li>
          <li>{COPY.review.disclosures.notGuaranteed}</li>
          {side === 'buy' && <li>{COPY.review.disclosures.chargeLater}</li>}
          {side === 'sell' && <li>{COPY.review.disclosures.manualSell}</li>}
        </ul>
      </section>

      <div className="consent card">
        <Checkbox checked={consent} onChange={setConsent}>
          {COPY.review.consent}
        </Checkbox>
      </div>

      <p className="fine-print fine-print--icon"><Shield size={14} /> Protected by Botim Money</p>
    </Screen>
  );
}
