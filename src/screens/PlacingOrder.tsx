import { useEffect } from 'react';
import { CARD_AUTH_DELAY_MS } from '../config';
import { COPY } from '../copy';
import { Card } from '../components/Icons';
import { Spinner } from '../components/ui';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';
import type { TicketDraft } from '../types';

/** Card orders only: AUTH_PENDING while we save the card with a refundable AED 0.10 check. */
export default function PlacingOrder({ orderId, draft }: { orderId: string; draft: TicketDraft }) {
  const { state, dispatch } = useStore();
  const { replace } = useNav();
  const order = state.orders.find(o => o.id === orderId);

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'CARD_AUTH_RESULT', orderId, realNow: Date.now() }), CARD_AUTH_DELAY_MS);
    return () => clearTimeout(t);
  }, [orderId, dispatch]);

  useEffect(() => {
    if (order?.status === 'OPEN') replace({ name: 'placed', orderId });
    if (order?.status === 'AUTH_FAILED') replace({ name: 'authFailed', draft });
  }, [order?.status, orderId, draft, replace]);

  return (
    <div className="screen screen--center screen--brand">
      <div className="placing">
        <div className="placing__ring">
          <Spinner size={96} />
          <span className="placing__icon"><Card size={30} /></span>
        </div>
        <p className="placing__title">{COPY.placing.title}</p>
        <p className="placing__sub">{COPY.placing.sub}</p>
        <p className="placing__card">{COPY.cardName}</p>
      </div>
    </div>
  );
}
