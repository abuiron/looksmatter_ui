import { Banknote, Headphones, RotateCcw, Truck } from 'lucide-react';
import { Link } from '../../utils/router';

type TrustKey = 'cod' | 'returns' | 'shipping' | 'support';

// Facts taken from the Shipping and Refund policies — keep them in sync.
const TRUST_POINTS: { key: TrustKey; icon: typeof Banknote; title: string; text: string; to: string }[] = [
  { key: 'cod', icon: Banknote, title: 'Cash on Delivery', text: 'Pay when your order arrives', to: '/shipping' },
  { key: 'returns', icon: RotateCcw, title: 'Easy 7-day returns', text: 'Return within 7 days of delivery', to: '/refund' },
  { key: 'shipping', icon: Truck, title: 'Flat ₹45 shipping', text: 'Delivered across India in 4–7 days', to: '/shipping' },
  { key: 'support', icon: Headphones, title: 'Real support', text: 'Mon–Sat, 10 AM – 6 PM IST', to: '/contact' },
];

/** Four-up band of store promises. */
export function TrustStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 ${className}`}>
      {TRUST_POINTS.map(({ icon: Icon, title, text, to }) => (
        <Link key={title} to={to} className="group flex items-start gap-4">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-stone-900 transition-colors group-hover:border-gold-500 group-hover:text-gold-700">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-stone-950">{title}</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-stone-500">{text}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Stacked list variant used next to buy buttons and order summaries. */
export function TrustList({ className = '', keys = ['cod', 'returns', 'shipping'] }: { className?: string; keys?: TrustKey[] }) {
  const points = TRUST_POINTS.filter((p) => keys.includes(p.key));
  return (
    <ul className={`space-y-3 ${className}`}>
      {points.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-center gap-3 text-[13px]">
          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-cream-200 text-stone-800">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span>
            <span className="font-semibold text-stone-900">{title}</span>
            <span className="text-stone-500"> · {text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
