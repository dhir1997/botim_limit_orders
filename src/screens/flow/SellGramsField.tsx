// Grams input shared by "Sell now" and "At my price" (sell).
// % chips are a share of TOTAL holdings. If the grams asked for exceed what's
// free (holdings minus open sell orders), an inline card offers to cancel
// those orders and sell everything.

import type { ReactNode } from 'react';
import { GRAM_DECIMALS, SELL_PCT_CHIPS, type AssetId } from '../../config';
import { COPY } from '../../copy';
import { Alert } from '../../components/Icons';
import { reservedSellGrams } from '../../engine/ledger';
import { floorTo, grams, parseNum } from '../../lib/format';
import { useStore } from '../../store/StoreProvider';

const EPS = 1e-9;

export function sellFieldState(holdings: number, reserved: number, g: number) {
  const available = Math.max(holdings - reserved, 0);
  return {
    available,
    overHoldings: Number.isFinite(g) && g > holdings + EPS,
    overAvailable: Number.isFinite(g) && g > available + EPS && g <= holdings + EPS && reserved > EPS,
  };
}

export default function SellGramsField({
  asset,
  value,
  onChange,
  mode,
  hint,
}: {
  asset: AssetId;
  value: string;
  onChange: (v: string) => void;
  mode: 'now' | 'price';
  /** Shown under the field when there's nothing to warn about (e.g. estimated proceeds). */
  hint?: ReactNode;
}) {
  const { state, dispatch } = useStore();
  const holdings = state.holdings[asset];
  const reserved = reservedSellGrams(state, asset);
  const g = parseNum(value);
  const { available, overHoldings, overAvailable } = sellFieldState(holdings, reserved, g);
  const chipGrams = (p: number) => floorTo((holdings * p) / 100, GRAM_DECIMALS);

  const cancelAndSellAll = () => {
    dispatch({ type: 'CANCEL_SELL_ORDERS', asset, realNow: Date.now() });
    onChange(String(floorTo(holdings, GRAM_DECIMALS)));
  };

  return (
    <section className="card field-card">
      <p className="field-card__label">{COPY.ticket.gramsLabel}</p>
      <div className={`amount-input${overHoldings ? ' error' : ''}`}>
        <input
          inputMode="decimal"
          placeholder="0.0000"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          aria-label="Grams to sell"
        />
        <span className="amount-input__suffix">g</span>
      </div>
      <div className="chips">
        {SELL_PCT_CHIPS.map(p => (
          <button
            key={p}
            className={`chip-btn${g > 0 && g === chipGrams(p) ? ' active' : ''}`}
            disabled={holdings <= 0}
            onClick={() => onChange(String(chipGrams(p)))}
          >
            {p}%
          </button>
        ))}
      </div>
      <p className="field-card__note">
        {COPY.marketSell.youOwn(holdings)}
        {reserved > EPS && ` · ${grams(reserved)} in other sell orders`}
      </p>

      {overHoldings && <p className="field-card__hint bad">{COPY.marketSell.tooMuch(holdings)}</p>}
      {mode === 'price' && value !== '' && !(g > 0) && <p className="field-card__hint bad">{COPY.ticket.gramsMissing}</p>}

      {hint && !overHoldings && !overAvailable && <p className="field-card__hint">{hint}</p>}

      {overAvailable && (
        <div className="reserved-card">
          <div className="reserved-card__head">
            <Alert size={18} />
            <p className="reserved-card__title">{COPY.flow.reservedTitle(reserved)}</p>
          </div>
          <p className="reserved-card__body">
            {mode === 'now' ? COPY.flow.reservedBodyNow(available) : COPY.flow.reservedBodyPrice(available)}
          </p>
          <button className="btn btn-outline btn-sm reserved-card__btn" onClick={cancelAndSellAll}>
            {COPY.flow.reservedCta(holdings)}
          </button>
        </div>
      )}
    </section>
  );
}
