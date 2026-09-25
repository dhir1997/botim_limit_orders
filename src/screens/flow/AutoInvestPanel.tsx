// "Every month" tab — placeholder for the existing auto-invest flow.

import { COPY } from '../../copy';
import { Refresh } from '../../components/Icons';
import { FlowPanel } from './FlowShell';

export default function AutoInvestPanel({ hidden }: { hidden: boolean }) {
  return (
    <FlowPanel hidden={hidden} footer={<button className="btn btn-outline" disabled>{COPY.autoInvest.cta}</button>}>
      <section className="card placeholder-card">
        <span className="placeholder-card__icon"><Refresh size={22} /></span>
        <p className="placeholder-card__title">{COPY.autoInvest.title}</p>
        <p className="placeholder-card__body">{COPY.autoInvest.body}</p>
        <div className="placeholder-card__demo">
          <strong>{COPY.autoInvest.amount}</strong>
          <span>{COPY.autoInvest.next}</span>
        </div>
      </section>
      <p className="fine-print">{COPY.autoInvest.placeholder}</p>
    </FlowPanel>
  );
}
