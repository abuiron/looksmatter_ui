import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  size?: 'sm' | 'md';
  label?: string;
}

export default function QuantityStepper({ value, onChange, min = 1, size = 'md', label = 'Quantity' }: QuantityStepperProps) {
  const dims = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';
  return (
    <div
      className={`inline-flex items-center rounded-full border border-stone-300 bg-white ${size === 'sm' ? 'h-9' : 'h-12'}`}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={`${dims} grid place-items-center rounded-full text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className={`min-w-[2rem] text-center font-semibold tabular-nums text-stone-950 ${size === 'sm' ? 'text-sm' : 'text-base'}`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={`${dims} grid place-items-center rounded-full text-stone-700 transition hover:bg-stone-100`}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
