// "Buy now" tab — simplified existing market buy. Also where the FAILED
// notification's "Buy now at today's price" lands, with the amount prefilled.

import { useEffect, useState } from 'react';
import { BUY_AMOUNT_CHIPS, FEE_AED, MIN_BUY_AED, type AssetId } from '../../config';
import { COPY } from '../../copy';
import { Card, Wallet } from '../../components/Icons';
import { Flash, Row } from '../../components/ui';
import { todayPrice } from '../../engine/ledger';
import { aed, grams, parseNum, price } from '../../lib/format';
import { newTradeId } from '../../lib/ids';
import { useNav } from '../../store/NavProvider';
import { useStore } from '../../store/StoreProvider';
import type { PaymentMethod } from '../../types';
import { FlowPanel } from './FlowShell';

export interface Seed { value?: number; n: number }

export default function BuyNowPanel({
  asset,
  hidden,
  amountAed,
  method: initialMethod,
  prefilled,
  seed,
}: {
  asset: AssetId;
  hidden: boolean;
  amountAed?: number;
  method?: PaymentMethod;
  /** Show the "we filled in the amount" note (e.g. arriving from a failed price order). */
  prefilled?: boolean;
  /** Amount handed over from the "At my price" tab. */
  seed: Seed;
}) {
  const { state, dispatch } = useStore();
  const { replace } = useNav();
  const [amountStr, setAmountStr] = useState(String(seed.value ?? amountAed ?? 100));
  const [method, setMethod] = useState<PaymentMethod>(initialMethod ?? 'wallet');

  useEffect(() => {
    if (seed.n > 0 && seed.value) setAmountStr(String(seed.value));
  }, [seed.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const buy = todayPrice(state, asset, 'buy');
  const amount = parseNum(amountStr);
  const validAmount = Number.isFinite(amount) && amount >= MIN_BUY_AED;
  const total = (validAmount ? amount : 0) + FEE_AED;
  const walletShort = method === 'wallet' && validAmount && state.wallet < total;

  const submit = () => {
    const tradeId = newTradeId();
    dispatch({ type: 'MARKET_BUY', tradeId, asset, amountAed: amount, method, realNow: Date.now() });
    replace({ name: 'marketResult', tradeId });
  };

  return (
    <FlowPanel
      hidden={hidden}
      footer={<button className="btn btn-brand" disabled={!validAmount || walletShort} onClick={submit}>{COPY.marketBuy.buyNow}</button>}
    >
      <div className="today-strip">
        <span className="live-dot" />
        <span>{COPY.marketBuy.todays}</span>
        <strong><Flash value={buy}>{price(asset, buy)}/g</Flash></strong>
      </div>

      {prefilled && <p className="note note--blue">{COPY.marketBuy.prefilledNote}</p>}

      <section className="card field-card">
        <p className="field-card__label">{COPY.marketBuy.amountLabel}</p>
        <div className={`amount-input${!validAmount && amountStr !== '' ? ' error' : ''}`}>
          <span className="amount-input__prefix">AED</span>
          <input inputMode="decimal" value={amountStr} onChange={e => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Amount in AED" />
        </div>
        <div className="chips">
          {BUY_AMOUNT_CHIPS.map(c => (
            <button key={c} className={`chip-btn${amount === c ? ' active' : ''}`} onClick={() => setAmountStr(String(c))}>AED {c}</button>
          ))}
        </div>
        {!validAmount && amountStr !== '' && <p className="field-card__hint bad">{COPY.ticket.minBuy}</p>}
      </section>

      <p className="section-label section-label--pad">{COPY.marketBuy.payWith}</p>
      <button className={`radio-card${method === 'wallet' ? ' selected' : ''}`} onClick={() => setMethod('wallet')}>
        <span className="radio-card__icon"><Wallet size={20} /></span>
        <span className="radio-card__text">
          <span className="radio-card__title">{COPY.payment.wallet}</span>
          <span className="radio-card__sub">{COPY.payment.walletBal(state.wallet)}</span>
        </span>
        <span className={`radio-o${method === 'wallet' ? ' checked' : ''}`} />
      </button>
      <button className={`radio-card${method === 'card' ? ' selected' : ''}`} onClick={() => setMethod('card')}>
        <span className="radio-card__icon"><Card size={20} /></span>
        <span className="radio-card__text">
          <span className="radio-card__title">{COPY.cardName}</span>
          <span className="radio-card__sub">Debit card</span>
        </span>
        <span className={`radio-o${method === 'card' ? ' checked' : ''}`} />
      </button>
      {walletShort && <p className="field-card__hint bad pad-x">{COPY.marketBuy.notEnough(state.wallet)}</p>}

      {validAmount && (
        <section className="card card-p">
          <Row label={COPY.marketBuy.youGet} value={grams(amount / buy)} />
          <Row label={COPY.ticket.fee} value={aed(FEE_AED)} />
          <Row label={COPY.marketBuy.total} value={aed(total)} strong />
        </section>
      )}
    </FlowPanel>
  );
}
