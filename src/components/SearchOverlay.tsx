import { FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { Link, useRouter } from '../utils/router';
import { summarizeCategories, useProducts } from '../hooks/useProducts';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { searchProducts } from '../utils/search';
import { img } from '../utils/cdn';
import Price from './ui/Price';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { products, loading } = useProducts();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);

  useLockBodyScroll(open);
  useEscapeKey(open, onClose);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  const results = useMemo(() => searchProducts(products, deferredQuery), [products, deferredQuery]);
  const categories = useMemo(() => summarizeCategories(products), [products]);
  const trimmed = query.trim();
  const resultsHref = `/catalog?q=${encodeURIComponent(trimmed)}`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onClose();
    navigate(resultsHref);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="absolute inset-0 animate-fade-in bg-stone-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative animate-slide-down bg-white shadow-2xl">
        <div className="container-page">
          <form onSubmit={handleSubmit} className="flex h-20 items-center gap-3 sm:h-24 sm:gap-4">
            <Search className="h-5 w-5 flex-shrink-0 text-stone-400 sm:h-6 sm:w-6" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dresses, jeans, kurtas…"
              enterKeyHint="search"
              aria-label="Search products"
              className="h-full min-w-0 flex-1 bg-transparent font-display text-xl font-medium text-stone-950 outline-none placeholder:text-stone-300 sm:text-3xl [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" onClick={onClose} className="icon-btn -mr-2 flex-shrink-0" aria-label="Close search">
              <X className="h-6 w-6" />
            </button>
          </form>
        </div>

        <div className="border-t border-stone-200">
          <div className="container-page max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain py-6 sm:py-8">
            {!trimmed ? (
              <div>
                <p className="eyebrow mb-4">Popular categories</p>
                {loading && categories.length === 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="skeleton h-9 w-28 rounded-full" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Link
                        key={c.name}
                        to={`/catalog?category=${encodeURIComponent(c.name)}`}
                        onClick={onClose}
                        className="chip"
                      >
                        {c.name}
                        <span className="text-stone-400">{c.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center">
                <p className="font-display text-xl font-semibold text-stone-950">No matches for “{trimmed}”</p>
                <p className="mt-2 text-sm text-stone-500">Check the spelling or try a broader word like “dress” or “shirt”.</p>
              </div>
            ) : (
              <div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="eyebrow">
                    {results.length} {results.length === 1 ? 'result' : 'results'}
                  </p>
                  <Link
                    to={resultsHref}
                    onClick={onClose}
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-stone-950"
                  >
                    <span className="link-underline">View all</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {results.slice(0, 6).map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/product/${p.slug || p.id}`}
                        onClick={onClose}
                        className="flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-cream-100"
                      >
                        <img
                          src={img(p.image, 160)}
                          alt=""
                          loading="lazy"
                          className="h-20 w-[3.75rem] flex-shrink-0 rounded-xl bg-cream-200 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{p.category}</p>
                          <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-stone-900">{p.name}</p>
                          <Price price={p.price} originalPrice={p.originalPrice} size="sm" className="mt-1" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
