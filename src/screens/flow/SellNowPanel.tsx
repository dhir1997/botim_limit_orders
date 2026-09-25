// "Sell now" tab — simplified existing market sell. Always allowed; if it would
// leave too little for open sell orders, a sheet warns which (newest first) get cancelled.

import { useEffect, useState } from 'react';
import { FEE_AED, type AssetId } from '../../config';
import { COPY } from '../../copy';
import { Alert } from '../../components/Icons';
import { Flash, Row, Sheet } from '../../components/ui';
import { previewAutoCancels, todayPrice } from '../../engine/ledger';
import { aed, grams, parseNum, price } from '../../lib/format';
import { newTradeId } from '../../lib/ids';
import { useNav } from '../../store/NavProvider';
import { useStore } from '../../store/StoreProvider';
import type { Seed } from './BuyNowPanel';
import { FlowPanel } from './FlowShell';
import SellGramsField from './SellGramsField';

export default function SellNowPanel({ asset, hidden, grams: prefill, seed }: { asset: AssetId; hidden: boolean; grams?: number; seed: Seed }) {
  const { state, dispatch } = useStore();
  const { replace } = useNav();
  const [gramsStr, setGramsStr] = useState(() => {
    const initial = seed.value ?? prefill;
    return initial ? String(initial) : '';
  });
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    if (seed.n > 0 && seed.value) setGramsStr(String(seed.value));
  }, [seed.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const holdings = state.holdings[asset];
  const sell = todayPrice(state, asset, 'sell');
  const g = parseNum(gramsStr);
  const valid = Number.isFinite(g) && g > 0 && g <= holdings + 1e-9;
  const willCancel = valid ? previewAutoCancels(state, asset, holdings - g) : [];

  const execute = () => {
    const tradeId = newTradeId();
    dispatch({ type: 'MARKET_SELL', tradeId, asset, grams: g, realNow: Date.now() });
    setWarn(false);
    replace({ name: 'marketResult', tradeId });
  };

  const onSell = () => {
    if (!valid) return;
    if (willCancel.length > 0) setWarn(true);
    else execute();
  };

  return (
    <FlowPanel
      hidden={hidden}
      footer={<button className="btn btn-brand" disabled={!valid} onClick={onSell}>{COPY.marketSell.sellNow}</button>}
    >
      <div className="today-strip">
        <span className="live-dot" />
        <span>{COPY.marketSell.todays}</span>
        <strong><Flash value={sell}>{price(asset, sell)}/g</Flash></strong>
      </div>

      <SellGramsField asset={asset} value={gramsStr} onChange={setGramsStr} mode="now" />

      {valid && (
        <section className="card card-p">
          <Row label={COPY.ticket.amount} value={grams(g)} />
          <Row label={COPY.marketSell.fee} value={aed(FEE_AED)} />
          <Row label={COPY.marketSell.receive} value={COPY.flow.receiveApprox(g * sell - FEE_AED)} strong />
        </section>
      )}

      <Sheet open={warn} onClose={() => setWarn(false)}>
        <div className="sheet__icon sheet__icon--amber"><Alert size={26} /></div>
        <p className="sheet__title">{COPY.marketSell.warnTitle(willCancel.length)}</p>
        <p className="sheet__body">{COPY.marketSell.warnBody}</p>
        <div className="sheet__list">
          {willCancel.map(o => (
            <div key={o.id} className="sheet__list-row">
              <span>Sell {grams(o.grams!)} at {price(asset, o.limitPrice)}</span>
              <span className="mono muted">{o.id}</span>
            </div>
          ))}
        </div>
        <div className="stack">
          <button className="btn btn-brand" onClick={execute}>{COPY.marketSell.warnConfirm}</button>
          <button className="btn btn-outline" onClick={() => setWarn(false)}>{COPY.marketSell.warnKeep}</button>
        </div>
      </Sheet>
    </FlowPanel>
  );
}
