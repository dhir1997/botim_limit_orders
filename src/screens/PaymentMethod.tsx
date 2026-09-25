import { useState } from 'react';
import { FEE_AED } from '../config';
import { COPY } from '../copy';
import { Card, Wallet } from '../components/Icons';
import { Screen } from '../components/ui';
import { validateTicket } from '../engine/validation';
import { aed } from '../lib/format';
import { newOrderId } from '../lib/ids';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';
import type { PaymentMethod as PM, TicketDraft } from '../types';

export default function PaymentMethod({ draft }: { draft: TicketDraft }) {
  const { state, dispatch } = useStore();
  const { pop, replace } = useNav();
  const [method, setMethod] = useState<PM>(draft.paymentMethod ?? 'wallet');
  const [error, setError] = useState<string | null>(null);
  const need = (draft.amountAed ?? 0) + FEE_AED;

  const place = () => {
    const v = validateTicket(state, {
      asset: draft.asset, side: draft.side, limitPrice: draft.limitPrice, amountAed: draft.amountAed ?? NaN, grams: NaN,
    });
    if (!v.ok) {
      setError(v.priceError ? COPY.review.priceMoved : v.amountError ?? null);
      return;
    }
    const orderId = newOrderId();
    const full = { ...draft, paymentMethod: method };
    dispatch({ type: 'PLACE_ORDER', orderId, draft: full, realNow: Date.now() });
    replace(method === 'card' ? { name: 'placing', orderId, draft: full } : { name: 'placed', orderId });
  };

  return (
    <Screen
      title={COPY.payment.title}
      onBack={pop}
      footer={<button className="btn btn-brand" onClick={place}>{COPY.payment.place}</button>}
    >
      <p className="lead">{COPY.payment.sub}</p>

      <button className={`radio-card${method === 'wallet' ? ' selected' : ''}`} onClick={() => setMethod('wallet')}>
        <span className="radio-card__icon"><Wallet size={20} /></span>
        <span className="radio-card__text">
          <span className="radio-card__title">{COPY.payment.wallet}</span>
          <span className="radio-card__sub">{COPY.payment.walletBal(state.wallet)}</span>
          {state.wallet < need && <span className="radio-card__warn">{COPY.payment.walletLow(need)}</span>}
        </span>
        <span className={`radio-o${method === 'wallet' ? ' checked' : ''}`} />
      </button>

      <button className={`radio-card${method === 'card' ? ' selected' : ''}`} onClick={() => setMethod('card')}>
        <span className="radio-card__icon"><Card size={20} /></span>
        <span className="radio-card__text">
          <span className="radio-card__title">{COPY.payment.card}</span>
          <span className="radio-card__sub">{COPY.payment.cardSub}</span>
        </span>
        <span className={`radio-o${method === 'card' ? ' checked' : ''}`} />
      </button>

      {error && (
        <div className="inline-error inline-error--box">
          <p>{error}</p>
          <button className="link-btn" onClick={pop}>← Change my order</button>
        </div>
      )}

      <p className="fine-print">Total when it goes through: {aed(need)}</p>
    </Screen>
  );
}
