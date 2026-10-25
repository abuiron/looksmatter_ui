import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import SectionHeading from './ui/SectionHeading';

interface ProductRailProps {
  products: Product[];
  title: string;
  eyebrow?: string;
  action?: { label: string; to: string };
}

/** Horizontally scrolling row of product cards with arrow controls on larger screens. */
export default function ProductRail({ products, title, eyebrow, action }: ProductRailProps) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-6">
        <SectionHeading eyebrow={eyebrow} title={title} action={action} className="flex-1" />
        {products.length > 4 && (
          <div className="hidden flex-shrink-0 gap-2 sm:flex">
            <button onClick={() => scrollBy(-1)} className="icon-btn h-11 w-11 border border-stone-300 hover:border-stone-950" aria-label="Scroll left">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => scrollBy(1)} className="icon-btn h-11 w-11 border border-stone-300 hover:border-stone-950" aria-label="Scroll right">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scroller}
        className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:px-0"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[46%] flex-shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-15px)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
