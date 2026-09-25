// Grams input shared by "Sell now" and "At my price" (sell). % chips are a
// share of TOTAL holdings.
//
// "Sell now": if the sale leaves too little for open sell orders, an inline
//   note says how many will be cancelled (newest first); the flow confirms with
//   a warning sheet before selling.
// "At my price": if the grams exceed what's free, a card offers "Cancel them
//   and sell all". Tapping it cancels NOTHING — it sets full holdings and stages
//   the cancellation, which only happens when the order is placed.

import { FEE_AED, GRAM_DECIMALS, SELL_PCT_CHIPS, type AssetId } from '../../config';
import { COPY } from '../../copy';
import { Alert } from '../../components/Icons';
import { previewAutoCancels, reservedSellGrams } from '../../engine/ledger';
import { aed, floorTo, grams, parseNum } from '../../lib/format';
import { useStore } from '../../store/StoreProvider';

const EPS = 1e-9;

export default function SellGramsField({
  asset,
  value,
  onChange,
  mode,
  replaceOthers = false,
  onReplaceOthers,
  estimatePrice,
}: {
  asset: AssetId;
  value: string;
  onChange: (v: string) => void;
  mode: 'now' | 'price';
  /** "At my price": the user chose to replace their other sell orders on placement. */
  replaceOthers?: boolean;
  onReplaceOthers?: (on: boolean) => void;
  /** "At my price": the user's price, for the receive estimate. */
  estimatePrice?: number;
}) {
  const { state } = useStore();
  const holdings = state.holdings[asset];
  const openSells = state.orders.filter(o => o.asset === asset && o.side === 'sell' && o.status === 'OPEN');
  const reserved = reservedSellGrams(state, asset);
  const available = Math.max(holdings - reserved, 0);
  const g = parseNum(value);
  const hasGrams = Number.isFinite(g) && g > 0;
  const overHoldings = hasGrams && g > holdings + EPS;
  const overAvailable = hasGrams && !overHoldings && g > available + EPS && reserved > EPS;
  const willCancel = mode === 'now' && hasGrams && !overHoldings ? previewAutoCancels(state, asset, holdings - g) : [];
  const chipGrams = (p: number) => floorTo((holdings * p) / 100, GRAM_DECIMALS);

  // Any manual change un-stages the replacement; the card shows again if still needed.
  const set = (v: string) => {
    onChange(v);
    if (replaceOthers) onReplaceOthers?.(false);
  };
  const stageReplace = () => {
    onChange(String(floorTo(holdings, GRAM_DECIMALS)));
    onReplaceOthers?.(true);
  };

  const pending = mode === 'price' && replaceOthers && openSells.length > 0;
  const blocked = mode === 'price' && overAvailable && !replaceOthers;
  const showEstimate = mode === 'price' && hasGrams && !overHoldings && !blocked && !!estimatePrice && estimatePrice > 0;

  return (
    <section className="card field-card">
      <p className="field-card__label">{COPY.ticket.gramsLabel}</p>
      <div className={`amount-input${overHoldings ? ' error' : ''}`}>
        <input
          inputMode="decimal"
          placeholder="0.0000"
          value={value}
          onChange={e => set(e.target.value.replace(/[^0-9.]/g, ''))}
          aria-label="Grams to sell"
        />
        <span className="amount-input__suffix">g</span>
      </div>
      <div className="chips">
        {SELL_PCT_CHIPS.map(p => (
          <button
            key={p}
            className={`chip-btn${hasGrams && g === chipGrams(p) ? ' active' : ''}`}
            disabled={holdings <= 0}
            onClick={() => set(String(chipGrams(p)))}
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
      {mode === 'price' && value !== '' && !hasGrams && <p className="field-card__hint bad">{COPY.ticket.gramsMissing}</p>}

      {willCancel.length > 0 && (
        <p className="note note--amber"><Alert size={14} /> {COPY.flow.lifoNote(g, willCancel.length)}</p>
      )}

      {blocked && (
        <div className="reserved-card">
          <div className="reserved-card__head">
            <Alert size={18} />
            <p className="reserved-card__title">{COPY.flow.reservedTitle(reserved)}</p>
          </div>
          <p className="reserved-card__body">{COPY.flow.reservedBodyPrice(available)}</p>
          <button className="btn btn-outline btn-sm reserved-card__btn" onClick={stageReplace}>
            {COPY.flow.reservedCta(holdings)}
          </button>
        </div>
      )}

      {pending && (
        <div className="pending-note">
          <p className="pending-note__title">{COPY.flow.pendingCancel(openSells.length)}</p>
          <p className="pending-note__body">{COPY.flow.pendingBody}</p>
          <button className="link-btn" onClick={() => set(String(floorTo(available, GRAM_DECIMALS)))}>
            {COPY.flow.keepThem(available)}
          </button>
        </div>
      )}

      {showEstimate && (
        <div className="estimate">
          <div className="estimate__row"><span>{COPY.ticket.fee}</span><span>{aed(FEE_AED)}</span></div>
          <div className="estimate__row estimate__row--total">
            <span>{COPY.marketSell.receive}</span>
            <span>{COPY.flow.receiveApprox(g * estimatePrice! - FEE_AED)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
