import PhoneShell from './components/PhoneShell';
import Toasts from './components/Toasts';
import DemoPanel from './demo/DemoPanel';
import AssetPage from './screens/AssetPage';
import AuthFailed from './screens/AuthFailed';
import BuyFlow from './screens/BuyFlow';
import SellFlow from './screens/SellFlow';
import Inbox from './screens/Inbox';
import MarketResult from './screens/MarketResult';
import OrderDetail from './screens/OrderDetail';
import OrderPlaced from './screens/OrderPlaced';
import PaymentMethod from './screens/PaymentMethod';
import PlacingOrder from './screens/PlacingOrder';
import Portfolio from './screens/Portfolio';
import PriceOrders from './screens/PriceOrders';
import ReviewOrder from './screens/ReviewOrder';
import { NavProvider, useNav, type Route } from './store/NavProvider';
import { StoreProvider } from './store/StoreProvider';

function renderRoute(r: Route) {
  switch (r.name) {
    case 'asset': return <AssetPage />;
    case 'portfolio': return <Portfolio />;
    case 'inbox': return <Inbox />;
    case 'buy': return <BuyFlow asset={r.asset} tab={r.tab} amountAed={r.amountAed} method={r.method} fromOrderId={r.fromOrderId} prefill={r.prefill} />;
    case 'sell': return <SellFlow asset={r.asset} tab={r.tab} grams={r.grams} prefill={r.prefill} />;
    case 'review': return <ReviewOrder draft={r.draft} />;
    case 'payment': return <PaymentMethod draft={r.draft} />;
    case 'placing': return <PlacingOrder orderId={r.orderId} draft={r.draft} />;
    case 'authFailed': return <AuthFailed draft={r.draft} />;
    case 'placed': return <OrderPlaced orderId={r.orderId} />;
    case 'orders': return <PriceOrders asset={r.asset} tab={r.tab} />;
    case 'orderDetail': return <OrderDetail orderId={r.orderId} />;
    case 'marketResult': return <MarketResult tradeId={r.tradeId} />;
  }
}

function Phone() {
  const { stack, route, asset } = useNav();
  const dark = route.name === 'placing';
  const tint = route.name === 'asset' ? `var(--tint-${asset})` : dark ? 'var(--brand-deep)' : undefined;
  return (
    <PhoneShell bg={tint} dark={dark}>
      {/* Screens below the top stay mounted but hidden, so Back restores what the user entered. */}
      {stack.map((e, i) => (
        <div className="route" key={e.key} hidden={i !== stack.length - 1}>
          {renderRoute(e.route)}
        </div>
      ))}
      <Toasts />
    </PhoneShell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <NavProvider>
        <div className="proto-root">
          <header className="proto-header">
            <span className="proto-header__pill">Botim Money · Gold &amp; Silver</span>
            <h1 className="proto-header__title">Set a price — price orders</h1>
            <p className="proto-header__sub">Clickable prototype · all state in memory · prices move every 2s, orders checked on each poll</p>
          </header>
          <div className="proto-stage">
            <div className="proto-phone-col">
              <Phone />
            </div>
            <DemoPanel />
          </div>
        </div>
      </NavProvider>
    </StoreProvider>
  );
}
