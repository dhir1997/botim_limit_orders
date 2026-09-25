// Shared layout for the Buy and Sell flows: header, segmented tabs, and
// tab panels that stay mounted (hidden) so entered values survive tab switches.

import type { ReactNode } from 'react';
import { COPY } from '../../copy';
import { ChevronLeft } from '../../components/Icons';

export function FlowShell<T extends string>({
  title,
  subtitle,
  tabs,
  active,
  onTab,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  tabs: { key: T; label: string }[];
  active: T;
  onTab: (t: T) => void;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="screen">
      <header className="screen__head">
        <button className="icon-btn" onClick={onBack} aria-label={COPY.common.back}>
          <ChevronLeft />
        </button>
        <div className="screen__title-wrap">
          <p className="screen__title">{title}</p>
          {subtitle && <p className="screen__subtitle">{subtitle}</p>}
        </div>
        <span className="icon-btn icon-btn--ghost" />
      </header>
      <div className="flow-tabs">
        <div className="seg" role="tablist">
          {tabs.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={t.key === active}
              className={`seg__btn${t.key === active ? ' active' : ''}`}
              onClick={() => onTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

/** One tab's content: its own scroll area and sticky footer. */
export function FlowPanel({ hidden, footer, children }: { hidden: boolean; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flow-panel" hidden={hidden} role="tabpanel">
      <div className="screen__body">{children}</div>
      {footer && <div className="screen__footer">{footer}</div>}
    </div>
  );
}

/** Tracks the active tab plus which tabs have been opened (panels mount on first visit, then stay). */
export function nextVisited<T>(visited: Set<T>, t: T): Set<T> {
  return visited.has(t) ? visited : new Set(visited).add(t);
}
