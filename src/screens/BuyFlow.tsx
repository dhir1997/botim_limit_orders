import { useState } from 'react';
import { ASSETS, type AssetId } from '../config';
import { COPY } from '../copy';
import { useNav, type BuyTab, type TicketPrefill } from '../store/NavProvider';
import type { PaymentMethod } from '../types';
import AutoInvestPanel from './flow/AutoInvestPanel';
import BuyNowPanel, { type Seed } from './flow/BuyNowPanel';
import { FlowShell, nextVisited } from './flow/FlowShell';
import PriceOrderPanel from './flow/PriceOrderPanel';

/** Buy flow: "Buy now" | "Every month" | "At my price". */
export default function BuyFlow({
  asset,
  tab: initialTab = 'now',
  amountAed,
  method,
  fromOrderId,
  prefill,
}: {
  asset: AssetId;
  tab?: BuyTab;
  amountAed?: number;
  method?: PaymentMethod;
  fromOrderId?: string;
  prefill?: TicketPrefill;
}) {
  const { pop } = useNav();
  const [tab, setTab] = useState<BuyTab>(initialTab);
  const [visited, setVisited] = useState<Set<BuyTab>>(() => new Set([initialTab]));
  const [seed, setSeed] = useState<Seed>({ n: 0 });

  const go = (t: BuyTab) => {
    setTab(t);
    setVisited(v => nextVisited(v, t));
  };
  const goNow = (value?: number) => {
    setSeed(s => ({ value, n: s.n + 1 }));
    go('now');
  };

  const tabs: { key: BuyTab; label: string }[] = [
    { key: 'now', label: COPY.flow.buyTabs.now },
    { key: 'monthly', label: COPY.flow.buyTabs.monthly },
    { key: 'price', label: COPY.flow.buyTabs.price },
  ];

  return (
    <FlowShell
      title={COPY.flow.buyTitle(asset)}
      subtitle={`${ASSETS[asset].label} ${ASSETS[asset].purity}`}
      tabs={tabs}
      active={tab}
      onTab={go}
      onBack={pop}
    >
      {visited.has('now') && (
        <BuyNowPanel
          asset={asset}
          hidden={tab !== 'now'}
          amountAed={amountAed}
          method={method}
          prefilled={!!(amountAed || fromOrderId)}
          seed={seed}
        />
      )}
      {visited.has('monthly') && <AutoInvestPanel hidden={tab !== 'monthly'} />}
      {visited.has('price') && (
        <PriceOrderPanel asset={asset} side="buy" prefill={prefill} hidden={tab !== 'price'} onGoNow={goNow} />
      )}
    </FlowShell>
  );
}
