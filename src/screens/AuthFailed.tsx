import { COPY } from '../copy';
import { Card } from '../components/Icons';
import { newOrderId } from '../lib/ids';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';
import type { TicketDraft } from '../types';

export default function AuthFailed({ draft }: { draft: TicketDraft }) {
  const { dispatch } = useStore();
  const { replace, reset } = useNav();

  const retry = (method: 'card' | 'wallet') => {
    const orderId = newOrderId();
    const next = { ...draft, paymentMethod: method };
    dispatch({ type: 'PLACE_ORDER', orderId, draft: next, realNow: Date.now() });
    replace(method === 'card' ? { name: 'placing', orderId, draft: next } : { name: 'placed', orderId });
  };

  return (
    <div className="screen">
      <div className="screen__body result">
        <div className="result__icon result__icon--red"><Card size={34} /></div>
        <p className="result__title">{COPY.authFailed.title}</p>
        <p className="result__body">{COPY.authFailed.body}</p>
        <div className="result__card card card-p">
          <p className="result__meta">{COPY.cardName}</p>
        </div>
      </div>
      <div className="screen__footer stack">
        <button className="btn btn-brand" onClick={() => retry('card')}>{COPY.authFailed.tryAgain}</button>
        <button className="btn btn-outline" onClick={() => retry('wallet')}>{COPY.authFailed.useWallet}</button>
        <button className="btn btn-text" onClick={() => reset('asset')}>{COPY.authFailed.cancel}</button>
      </div>
    </div>
  );
}
