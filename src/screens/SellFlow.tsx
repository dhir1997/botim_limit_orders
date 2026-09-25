import { useState } from 'react';
import { ASSETS, type AssetId } from '../config';
import { COPY } from '../copy';
import { useNav, type SellTab, type TicketPrefill } from '../store/NavProvider';
import type { Seed } from './flow/BuyNowPanel';
import { FlowShell, nextVisited } from './flow/FlowShell';
import PriceOrderPanel from './flow/PriceOrderPanel';
import SellNowPanel from './flow/SellNowPanel';

/** Sell flow: "Sell now" | "At my price". */
export default function SellFlow({
  asset,
  tab: initialTab = 'now',
  grams,
  prefill,
}: {
  asset: AssetId;
  tab?: SellTab;
  grams?: number;
  prefill?: TicketPrefill;
}) {
  const { pop } = useNav();
  const [tab, setTab] = useState<SellTab>(initialTab);
  const [visited, setVisited] = useState<Set<SellTab>>(() => new Set([initialTab]));
  const [seed, setSeed] = useState<Seed>({ n: 0 });

  const go = (t: SellTab) => {
    setTab(t);
    setVisited(v => nextVisited(v, t));
  };
  const goNow = (value?: number) => {
    setSeed(s => ({ value, n: s.n + 1 }));
    go('now');
  };

  const tabs: { key: SellTab; label: string }[] = [
    { key: 'now', label: COPY.flow.sellTabs.now },
    { key: 'price', label: COPY.flow.sellTabs.price },
  ];

  return (
    <FlowShell
      title={COPY.flow.sellTitle(asset)}
      subtitle={`${ASSETS[asset].label} ${ASSETS[asset].purity}`}
      tabs={tabs}
      active={tab}
      onTab={go}
      onBack={pop}
    >
      {visited.has('now') && <SellNowPanel asset={asset} hidden={tab !== 'now'} grams={grams} seed={seed} />}
      {visited.has('price') && (
        <PriceOrderPanel asset={asset} side="sell" prefill={prefill} hidden={tab !== 'price'} onGoNow={goNow} />
      )}
    </FlowShell>
  );
}
