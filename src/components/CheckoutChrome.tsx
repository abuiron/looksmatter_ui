import { ArrowLeft, Lock } from 'lucide-react';
import { Link } from '../utils/router';
import Logo from './ui/Logo';

// Checkout swaps the full header/footer for a focused version with no
// navigation to leave by accident.

export function CheckoutHeader() {
  return (
    <header className="border-b border-stone-200 bg-white print:hidden">
      <div className="container-page grid h-16 grid-cols-3 items-center lg:h-20">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 justify-self-start text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to bag</span>
        </Link>
        <Link to="/" aria-label="LOOKSMATTER home" className="justify-self-center">
          <Logo compact className="sm:hidden" />
          <Logo className="hidden sm:inline-flex" />
        </Link>
        <span className="inline-flex items-center gap-2 justify-self-end text-sm font-medium text-stone-600">
          <Lock className="h-4 w-4 text-emerald-600" />
          <span className="hidden sm:inline">Secure checkout</span>
        </span>
      </div>
    </header>
  );
}

export function CheckoutFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white print:hidden">
      <div className="container-page flex flex-col gap-3 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} LOOKSMATTER CONSULTING PVT LTD</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/shipping" className="hover:text-stone-950">Shipping policy</Link>
          <Link to="/refund" className="hover:text-stone-950">Refund policy</Link>
          <Link to="/privacy" className="hover:text-stone-950">Privacy</Link>
          <Link to="/terms" className="hover:text-stone-950">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
