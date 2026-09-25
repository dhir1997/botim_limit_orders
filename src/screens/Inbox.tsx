import { useEffect } from 'react';
import { COPY } from '../copy';
import { Bell } from '../components/Icons';
import { NotifIcon } from '../components/NotifIcon';
import { useNotificationAction } from '../components/Toasts';
import { EmptyState, TabBar } from '../components/ui';
import { timeAgo } from '../lib/format';
import { useSimNow, useStore } from '../store/StoreProvider';

export default function Inbox() {
  const { state, dispatch } = useStore();
  const run = useNotificationAction();
  const now = useSimNow();
  const unreadIds = state.notifications.filter(n => !n.read).map(n => n.id);

  // Mark as read shortly after the inbox is shown, so unread dots are visible first.
  useEffect(() => {
    if (unreadIds.length === 0) return;
    const t = setTimeout(() => dispatch({ type: 'MARK_ALL_READ' }), 1500);
    return () => clearTimeout(t);
  }, [unreadIds.join(','), dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen">
      <header className="screen__head screen__head--root">
        <p className="screen__title screen__title--lg">{COPY.inbox.title}</p>
      </header>
      <div className="screen__body">
        {state.notifications.length === 0 ? (
          <EmptyState icon={<Bell size={28} />} title={COPY.inbox.empty} body={COPY.inbox.emptySub} />
        ) : (
          <div className="inbox-list">
            {state.notifications.map(n => (
              <div key={n.id} className={`inbox-item card${n.read ? '' : ' unread'}`}>
                <NotifIcon kind={n.kind} />
                <div className="inbox-item__main">
                  <div className="inbox-item__top">
                    <p className="inbox-item__title">{n.title}</p>
                    <span className="inbox-item__time">{timeAgo(n.at, now)}</span>
                  </div>
                  <p className="inbox-item__body">{n.body}</p>
                  {n.cta && (
                    <button className="link-btn" onClick={() => run(n.cta!)}>{n.cta.label} →</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
