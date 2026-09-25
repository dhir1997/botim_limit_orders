import type { NotificationKind } from '../types';
import { Alert, Check, Clock, Close, Refresh, Target } from './Icons';

const MAP: Record<NotificationKind, { tone: string; icon: JSX.Element }> = {
  placed: { tone: 'blue', icon: <Target size={18} /> },
  filled: { tone: 'green', icon: <Check size={18} /> },
  failed: { tone: 'red', icon: <Alert size={18} /> },
  auto_cancelled: { tone: 'amber', icon: <Refresh size={18} /> },
  expiring: { tone: 'amber', icon: <Clock size={18} /> },
  expired: { tone: 'grey', icon: <Clock size={18} /> },
  cancelled: { tone: 'grey', icon: <Close size={18} /> },
  market: { tone: 'green', icon: <Check size={18} /> },
};

export function NotifIcon({ kind }: { kind: NotificationKind }) {
  const m = MAP[kind];
  return <span className={`notif-icon notif-icon--${m.tone}`}>{m.icon}</span>;
}
