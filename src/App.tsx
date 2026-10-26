import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Router, useRouter } from './utils/router';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { CheckoutFooter, CheckoutHeader } from './components/CheckoutChrome';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Shop from './pages/Shop';
import Contact from './pages/Contact';
import About from './pages/About';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';

// Shoppers never need the admin panel, so it loads as a separate chunk.
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function AppContent() {
  // Match on the pathname so query strings (e.g. /profile?tab=orders) still route correctly.
  const { pathname } = useRouter();

  const getPage = () => {
    if (pathname === '/') return <Home />;
    if (pathname === '/catalog') return <Catalog />;
    if (pathname === '/shop') return <Shop />;
    if (pathname === '/contact') return <Contact />;
    if (pathname === '/about') return <About />;
    if (pathname === '/cart') return <Cart />;
    if (pathname === '/favorites') return <Favorites />;
    if (pathname === '/login') return <Auth />;
    if (pathname === '/profile') return <Profile />;
    if (pathname === '/checkout') return <Checkout />;
    if (pathname === '/privacy') return <PrivacyPolicy />;
    if (pathname === '/terms') return <TermsOfService />;
    if (pathname === '/refund') return <RefundPolicy />;
    if (pathname === '/shipping') return <ShippingPolicy />;
    if (pathname.startsWith('/order-success/')) {
      const orderId = pathname.split('/order-success/')[1];
      return <OrderSuccess orderId={orderId} />;
    }
    if (pathname.startsWith('/product/')) {
      const raw = pathname.split('/product/')[1];
      let slug = raw;
      try {
        slug = decodeURIComponent(raw);
      } catch {
        // Malformed escape sequence in a hand-typed URL — use it as-is.
      }
      return <ProductDetail slug={slug} />;
    }
    return <Home />;
  };

  // Admin Dashboard has its own layout - no header/footer
  if (pathname === '/admin') {
    return (
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          </div>
        }
      >
        <AdminDashboard />
      </Suspense>
    );
  }

  const isCheckout = pathname === '/checkout';

  return (
    <div className="flex min-h-screen flex-col">
      {isCheckout ? <CheckoutHeader /> : <Header />}
      {/* Keyed by path so each page mounts fresh (resets scroll-linked state and replays the fade). */}
      <main key={pathname} className="flex-1 animate-fade-in">
        {getPage()}
      </main>
      {isCheckout ? <CheckoutFooter /> : <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
