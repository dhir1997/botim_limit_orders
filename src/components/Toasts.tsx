import { useEffect, useRef, useState } from 'react';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';
import type { AppNotification, NotificationCta } from '../types';
import { NotifIcon } from './NotifIcon';
import { Close } from './Icons';

/** Maps a notification's call-to-action onto in-app navigation. */
export function useNotificationAction() {
  const { reset, setAsset } = useNav();
  return (cta: NotificationCta) => {
    switch (cta.type) {
      case 'view_order':
        reset('asset', { name: 'orderDetail', orderId: cta.orderId });
        break;
      case 'view_portfolio':
        reset('portfolio');
        break;
      case 'market_buy':
        setAsset(cta.asset);
        reset('asset', { name: 'buy', asset: cta.asset, tab: 'now', amountAed: cta.amountAed });
        break;
      case 'view_orders':
        setAsset(cta.asset);
        reset('asset', { name: 'orders', asset: cta.asset, tab: 'history' });
        break;
      case 'set_price':
        setAsset(cta.asset);
        reset('asset', { name: cta.side, asset: cta.asset, tab: 'price' });
        break;
    }
  };
}

const TOAST_MS = 4500;

/** Banner toasts for new notifications, one at a time, newest queued last. */
export default function Toasts() {
  const { state } = useStore();
  const run = useNotificationAction();
  const seen = useRef<Set<string>>(new Set(state.notifications.map(n => n.id)));
  const [queue, setQueue] = useState<AppNotification[]>([]);

  useEffect(() => {
    const live = new Set(state.notifications.map(n => n.id));
    const fresh = state.notifications.filter(n => !seen.current.has(n.id)).reverse();
    fresh.forEach(n => seen.current.add(n.id));
    // Drop queued toasts whose notification is gone (e.g. after a demo reset).
    setQueue(q => {
      const kept = q.filter(n => live.has(n.id));
      return fresh.length === 0 && kept.length === q.length ? q : [...kept, ...fresh];
    });
  }, [state.notifications]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue(q => q.slice(1)), TOAST_MS);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;
  const dismiss = () => setQueue(q => q.slice(1));

  return (
    <div className="toast-wrap">
      <div
        key={current.id}
        className={`toast toast--${current.kind}`}
        role="status"
        onClick={() => {
          if (current.cta) run(current.cta);
          dismiss();
        }}
      >
        <NotifIcon kind={current.kind} />
        <div className="toast__text">
          <p className="toast__title">{current.title}</p>
          <p className="toast__body">{current.body}</p>
          {current.cta && <span className="toast__cta">{current.cta.label} →</span>}
        </div>
        <button
          className="toast__close"
          aria-label="Dismiss"
          onClick={e => {
            e.stopPropagation();
            dismiss();
          }}
        >
          <Close size={14} />
        </button>
        {queue.length > 1 && <span className="toast__more">+{queue.length - 1}</span>}
      </div>
    </div>
  );
}
