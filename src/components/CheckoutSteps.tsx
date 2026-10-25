import { Check } from 'lucide-react';

const STEPS = ['Bag', 'Details & payment', 'Confirmation'];

/** Progress indicator shared by the bag, checkout and order confirmation pages. */
export default function CheckoutSteps({ current, className = '' }: { current: 0 | 1 | 2; className?: string }) {
  return (
    <ol className={`flex items-center gap-2 text-[13px] sm:gap-3 print:hidden ${className}`} aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={active ? 'step' : undefined}>
            <span className={`flex items-center gap-2 font-medium ${done || active ? 'text-stone-950' : 'text-stone-400'}`}>
              <span
                className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  done ? 'bg-stone-950 text-white' : active ? 'bg-gold-500 text-stone-950' : 'bg-stone-200 text-stone-500'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={active ? '' : 'hidden sm:inline'}>{label}</span>
            </span>
            {i < STEPS.length - 1 && <span className={`h-px w-6 sm:w-12 ${done ? 'bg-stone-950' : 'bg-stone-300'}`} />}
          </li>
        );
      })}
    </ol>
  );
}
