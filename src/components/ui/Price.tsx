import { discountPercent, formatINR } from '../../utils/format';

interface PriceProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { price: 'text-[15px]', mrp: 'text-[13px]', off: 'text-[12px]' },
  md: { price: 'text-lg', mrp: 'text-sm', off: 'text-sm' },
  lg: { price: 'text-3xl', mrp: 'text-lg', off: 'text-sm' },
};

/** Selling price with the struck-through MRP and discount, e.g. "₹2,999 ₹4,299 30% off". */
export default function Price({ price, originalPrice, size = 'md', className = '' }: PriceProps) {
  const off = discountPercent(price, originalPrice);
  const s = SIZES[size];

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className={`font-semibold tabular-nums text-stone-950 ${s.price}`}>{formatINR(price)}</span>
      {off > 0 && (
        <>
          <span className={`tabular-nums text-stone-400 line-through ${s.mrp}`}>{formatINR(originalPrice)}</span>
          {size === 'lg' ? (
            <span className="badge bg-gold-100 text-gold-800">{off}% OFF</span>
          ) : (
            <span className={`font-semibold text-gold-700 ${s.off}`}>{off}% off</span>
          )}
        </>
      )}
    </div>
  );
}
