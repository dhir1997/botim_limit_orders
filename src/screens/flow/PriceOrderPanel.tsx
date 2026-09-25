// "At my price" tab — the price-order ticket, embedded in the Buy or Sell flow.
// Continues into the shared Review → Payment (buy) → Confirmation screens.

import { useState } from 'react';
import {
  ASSETS,
  BUY_AMOUNT_CHIPS,
  DAY_MS,
  DEFAULT_PRICE_OFFSET,
  DEFAULT_VALIDITY_DAYS,
  FEE_AED,
  GRAM_DECIMALS,
  PRICE_STEP_PCT,
  VALIDITY_OPTIONS,
  type AssetId,
} from '../../config';
import { COPY } from '../../copy';
import { Minus, Plus } from '../../components/Icons';
import { Flash, Row } from '../../components/ui';
import { roundPrice, todayPrice } from '../../engine/ledger';
import { validateTicket } from '../../engine/validation';
import { aed, floorTo, fmtDate, grams, parseNum, price } from '../../lib/format';
import { useNav, type TicketPrefill } from '../../store/NavProvider';
import { useSimNow, useStore } from '../../store/StoreProvider';
import type { Side } from '../../types';
import { FlowPanel } from './FlowShell';
import SellGramsField from './SellGramsField';

export default function PriceOrderPanel({
  asset,
  side,
  prefill = {},
  hidden,
  onGoNow,
}: {
  asset: AssetId;
  side: Side;
  prefill?: TicketPrefill;
  hidden: boolean;
  /** "Buy/Sell now at today's price": switch to the Now tab, carrying the amount over. */
  onGoNow: (value?: number) => void;
}) {
  const { state } = useStore();
  const { push } = useNav();
  const now = useSimNow();
  const cfg = ASSETS[asset];

  const [priceStr, setPriceStr] = useState(() => {
    if (prefill.limitPrice) return prefill.limitPrice.toFixed(cfg.priceDecimals);
    const today = todayPrice(state, asset, side);
    const target = today * (side === 'buy' ? 1 - DEFAULT_PRICE_OFFSET : 1 + DEFAULT_PRICE_OFFSET);
    return roundPrice(asset, target).toFixed(cfg.priceDecimals);
  });
  const [amountStr, setAmountStr] = useState(prefill.amountAed ? String(prefill.amountAed) : '100');
  const [gramsStr, setGramsStr] = useState(prefill.grams ? String(prefill.grams) : '');
  const [validity, setValidity] = useState<number>(prefill.validityDays ?? DEFAULT_VALIDITY_DAYS);
  const [touched, setTouched] = useState(false);
  /** "Cancel them and sell all" staged — applied only when the order is placed. */
  const [replaceOthers, setReplaceOthers] = useState(false);

  const limitPrice = parseNum(priceStr);
  const amountAed = parseNum(amountStr);
  const g = parseNum(gramsStr);
  const v = validateTicket(state, { asset, side, limitPrice, amountAed, grams: g, replaceSellOrders: side === 'sell' && replaceOthers });
  const endsAt = now + validity * DAY_MS;
  const showPriceError = v.priceError && (touched || v.showMarketLink);

  const stepPrice = (dir: 1 | -1) => {
    const base = Number.isFinite(limitPrice) ? limitPrice : v.today;
    setPriceStr(roundPrice(asset, Math.max(base + dir * v.today * PRICE_STEP_PCT, 0.001)).toFixed(cfg.priceDecimals));
    setTouched(true);
  };

  const onReview = () => {
    setTouched(true);
    if (!v.ok) return;
    push({
      name: 'review',
      draft: {
        asset,
        side,
        limitPrice: roundPrice(asset, limitPrice),
        amountAed: side === 'buy' ? amountAed : undefined,
        grams: side === 'sell' ? floorTo(g, GRAM_DECIMALS) : undefined,
        validityDays: validity,
        replaceSellOrders: side === 'sell' && replaceOthers ? true : undefined,
      },
    });
  };

  return (
    <FlowPanel
      hidden={hidden}
      footer={
        <button className="btn btn-brand" disabled={!v.ok} onClick={onReview}>
          {COPY.ticket.review}
        </button>
      }
    >
      <div className="today-strip">
        <span className="live-dot" />
        <span>{COPY.ticket.todaysPrice(side)}</span>
        <strong><Flash value={v.today}>{price(asset, v.today)}/g</Flash></strong>
      </div>

      {/* Price */}
      <section className="card field-card">
        <p className="field-card__label">{COPY.ticket.yourPriceLabel(side)}</p>
        <div className={`price-input${showPriceError ? ' error' : ''}`}>
          <button className="price-input__step" onClick={() => stepPrice(-1)} aria-label="Lower price">
            <Minus />
          </button>
          <div className="price-input__field">
            <span className="price-input__prefix">AED</span>
            <input
              inputMode="decimal"
              value={priceStr}
              onChange={e => { setPriceStr(e.target.value.replace(/[^0-9.,]/g, '')); setTouched(true); }}
              aria-label="Your price per gram"
            />
            <span className="price-input__suffix">/g</span>
          </div>
          <button className="price-input__step" onClick={() => stepPrice(1)} aria-label="Raise price">
            <Plus />
          </button>
        </div>
        {showPriceError ? (
          <div className="inline-error">
            <p>{v.priceError}</p>
            {v.showMarketLink && (
              <button
                className="link-btn"
                onClick={() => onGoNow(side === 'buy' ? (Number.isFinite(amountAed) ? amountAed : undefined) : (g > 0 ? g : undefined))}
              >
                {COPY.ticket.marketLink(side)} →
              </button>
            )}
          </div>
        ) : (
          Number.isFinite(limitPrice) && <p className="field-card__hint good">{COPY.ticket.distance(v.distance, side)}</p>
        )}
      </section>

      {/* Amount */}
      {side === 'buy' ? (
        <section className="card field-card">
          <p className="field-card__label">{COPY.ticket.amountLabel}</p>
          <div className={`amount-input${v.amountError && amountStr !== '' ? ' error' : ''}`}>
            <span className="amount-input__prefix">AED</span>
            <input
              inputMode="decimal"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
              aria-label="Amount in AED"
            />
          </div>
          <div className="chips">
            {BUY_AMOUNT_CHIPS.map(c => (
              <button key={c} className={`chip-btn${amountAed === c ? ' active' : ''}`} onClick={() => setAmountStr(String(c))}>
                AED {c}
              </button>
            ))}
          </div>
          {v.amountError && (touched || amountStr !== '') ? (
            <p className="field-card__hint bad">{v.amountError}</p>
          ) : (
            Number.isFinite(amountAed) && limitPrice > 0 && (
              <p className="field-card__hint">{COPY.ticket.approxGrams(amountAed / limitPrice)}</p>
            )
          )}
          <p className="field-card__note">{COPY.ticket.walletHint(state.wallet)}</p>
        </section>
      ) : (
        <SellGramsField
          asset={asset}
          value={gramsStr}
          onChange={setGramsStr}
          mode="price"
          replaceOthers={replaceOthers}
          onReplaceOthers={setReplaceOthers}
          estimatePrice={Number.isFinite(limitPrice) ? limitPrice : undefined}
        />
      )}

      {/* Validity */}
      <section className="card field-card">
        <p className="field-card__label">{COPY.ticket.validityLabel}</p>
        <div className="chips chips--5">
          {VALIDITY_OPTIONS.map(d => (
            <button key={d} className={`chip-btn${validity === d ? ' active' : ''}`} onClick={() => setValidity(d)}>
              {d}d
            </button>
          ))}
        </div>
        <p className="field-card__hint">{COPY.ticket.endsOn(fmtDate(endsAt))}</p>
      </section>

      {/* Summary */}
      <section className="card card-p">
        <p className="section-label">{COPY.ticket.summary}</p>
        <Row label={COPY.ticket.yourPrice} value={Number.isFinite(limitPrice) ? `${price(asset, limitPrice)}/g` : '—'} />
        <Row
          label={COPY.ticket.amount}
          value={side === 'buy' ? (Number.isFinite(amountAed) ? aed(amountAed) : '—') : g > 0 ? grams(g) : '—'}
        />
        <Row label={COPY.ticket.fee} value={COPY.ticket.feeValue} />
        {side === 'sell' && g > 0 && limitPrice > 0 && (
          <Row label={COPY.marketSell.receive} value={COPY.flow.receiveApprox(g * limitPrice - FEE_AED)} strong />
        )}
        <Row label={COPY.ticket.ends} value={fmtDate(endsAt)} />
      </section>
    </FlowPanel>
  );
}
