// Shared in-phone UI primitives.

import { useEffect, useState, type ReactNode } from 'react';
import { COPY } from '../copy';
import { useNav } from '../store/NavProvider';
import { useStore } from '../store/StoreProvider';
import type { OrderStatus } from '../types';
import { ChevronLeft, Chart, Inbox, Pie, Check } from './Icons';

/** Standard screen: sticky header, scrollable body, optional sticky footer. */
export function Screen({
  title,
  subtitle,
  onBack,
  right,
  footer,
  children,
  bg,
  className = '',
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bg?: string;
  className?: string;
}) {
  return (
    <div className={`screen ${className}`} style={bg ? { background: bg } : undefined}>
      {(title || onBack) && (
        <header className="screen__head">
          {onBack ? (
            <button className="icon-btn" onClick={onBack} aria-label={COPY.common.back}>
              <ChevronLeft />
            </button>
          ) : (
            <span className="icon-btn icon-btn--ghost" />
          )}
          <div className="screen__title-wrap">
            {title && <p className="screen__title">{title}</p>}
            {subtitle && <p className="screen__subtitle">{subtitle}</p>}
          </div>
          {right ?? <span className="icon-btn icon-btn--ghost" />}
        </header>
      )}
      <div className="screen__body">{children}</div>
      {footer && <div className="screen__footer">{footer}</div>}
    </div>
  );
}

const PILL_TONE: Record<OrderStatus, string> = {
  DRAFT: 'grey',
  AUTH_PENDING: 'blue',
  AUTH_FAILED: 'red',
  OPEN: 'blue',
  TRIGGERED: 'amber',
  FILLED: 'green',
  FAILED: 'red',
  CANCELLED: 'grey',
  AUTO_CANCELLED: 'amber',
  EXPIRED: 'grey',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`pill pill--${PILL_TONE[status]}`}>{COPY.status[status]}</span>;
}

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} role="dialog">
        <div className="sheet__grabber" />
        {children}
      </div>
    </div>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={`checkbox${checked ? ' checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="checkbox__box">{checked && <Check size={14} />}</span>
      <span className="checkbox__label">{children}</span>
    </label>
  );
}

export function Row({ label, value, tone, strong }: { label: ReactNode; value: ReactNode; tone?: 'green' | 'amber' | 'red' | 'brand'; strong?: boolean }) {
  return (
    <div className="sum-row">
      <span className="sum-label">{label}</span>
      <span className={`sum-value${tone ? ` ${tone}` : ''}${strong ? ' strong' : ''}`}>{value}</span>
    </div>
  );
}

export function TabBar() {
  const { route, reset } = useNav();
  const { state } = useStore();
  const unread = state.notifications.filter(n => !n.read).length;
  const tabs = [
    { key: 'asset' as const, label: COPY.tabs.markets, icon: <Chart size={20} /> },
    { key: 'portfolio' as const, label: COPY.tabs.portfolio, icon: <Pie size={20} /> },
    { key: 'inbox' as const, label: COPY.tabs.inbox, icon: <Inbox size={20} />, badge: unread },
  ];
  return (
    <nav className="tabbar">
      {tabs.map(t => (
        <button key={t.key} className={`tabbar__btn${route.name === t.key ? ' active' : ''}`} onClick={() => reset(t.key)}>
          <span className="tabbar__icon">
            {t.icon}
            {!!t.badge && <span className="badge">{t.badge > 9 ? '9+' : t.badge}</span>}
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export function Spinner({ size = 56 }: { size?: number }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

/** Briefly flashes when `value` changes — used on live prices. */
export function Flash({ value, children }: { value: number; children: ReactNode }) {
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  const [prev, setPrev] = useState(value);
  useEffect(() => {
    if (value === prev) return;
    setDir(value > prev ? 'up' : 'down');
    setPrev(value);
    const t = setTimeout(() => setDir(null), 700);
    return () => clearTimeout(t);
  }, [value, prev]);
  return <span className={`flash${dir ? ` flash--${dir}` : ''}`}>{children}</span>;
}

export function AssetCoin({ asset, size = 36 }: { asset: 'gold' | 'silver'; size?: number }) {
  return (
    <span className={`coin coin--${asset}`} style={{ width: size, height: size, fontSize: size * 0.3 }}>
      {asset === 'gold' ? 'Au' : 'Ag'}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <p className="empty__title">{title}</p>
      <p className="empty__body">{body}</p>
      {action}
    </div>
  );
}
