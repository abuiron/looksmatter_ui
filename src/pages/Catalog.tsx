import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Columns3, Columns4, RefreshCw, SearchX, SlidersHorizontal, Store, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import EmptyState from '../components/ui/EmptyState';
import Drawer from '../components/ui/Drawer';
import { summarizeCategories, useProducts } from '../hooks/useProducts';
import { useRouter } from '../utils/router';
import { matchesTokens, tokenize } from '../utils/search';
import {
  DISCOUNT_STEPS,
  PRICE_BUCKETS,
  SORT_OPTIONS,
  SortKey,
  inPriceBucket,
  isBundle,
  isSortKey,
  sortProducts,
} from '../utils/products';
import { discountPercent } from '../utils/format';
import { sortSizes } from '../utils/sizes';

const PAGE_SIZE = 24;
const SIZE_PREVIEW = 16;

/* ---------- Small filter controls ---------- */

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200 py-5 first:pt-0 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-950"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

function OptionRow({
  checked,
  onClick,
  label,
  count,
  shape = 'box',
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  shape?: 'box' | 'round';
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg py-1.5 text-left text-sm"
    >
      <span
        className={`grid h-[18px] w-[18px] flex-shrink-0 place-items-center border transition-colors ${
          shape === 'round' ? 'rounded-full' : 'rounded-[5px]'
        } ${checked ? 'border-stone-950 bg-stone-950' : 'border-stone-300 bg-white group-hover:border-stone-500'}`}
      >
        {checked &&
          (shape === 'round' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          ) : (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          ))}
      </span>
      <span className={`flex-1 ${checked ? 'font-semibold text-stone-950' : 'text-stone-600 group-hover:text-stone-950'}`}>{label}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-stone-400">{count}</span>}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1.5 text-left text-sm text-stone-700"
    >
      {label}
      <span className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-stone-950' : 'bg-stone-300'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

/* ---------- Page ---------- */

export default function Catalog() {
  const { query, navigate, action } = useRouter();
  const { products, loading, error, retry } = useProducts();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [dense, setDense] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const countRef = useRef(displayedCount);
  countRef.current = displayedCount;

  // Every filter lives in the URL so it survives refresh, back/forward and sharing.
  const category = query.get('category') || '';
  const q = (query.get('q') || '').trim();
  const bundleOnly = query.get('bundle') === '1';
  const inStockOnly = query.get('stock') === '1';
  const priceKey = query.get('price') || '';
  const minOff = Number(query.get('off')) || 0;
  const sizeParam = query.get('size') || '';
  const selectedSizes = useMemo(() => sizeParam.split(',').filter(Boolean), [sizeParam]);
  const sortParam = query.get('sort');
  const sortBy: SortKey = isSortKey(sortParam) ? sortParam : 'featured';
  const search = query.toString();

  const updateParams = (changes: Record<string, string | null>, push = false) => {
    const next = new URLSearchParams(query);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    const qs = next.toString();
    navigate(qs ? `/catalog?${qs}` : '/catalog', { replace: !push, scroll: false });
  };

  // Facet filters only — keeps the category, search and sort.
  const clearFacets = () => updateParams({ bundle: null, stock: null, price: null, off: null, size: null });
  const clearAll = () => navigate('/catalog', { replace: true, scroll: false });

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size) ? selectedSizes.filter((s) => s !== size) : [...selectedSizes, size];
    updateParams({ size: next.join(',') || null });
  };

  /* ----- Filtering ----- */

  const tokens = useMemo(() => tokenize(q), [q]);

  // Everything except the category — drives the category chip counts.
  const categoryScope = useMemo(
    () =>
      products.filter(
        (p) => (!bundleOnly || isBundle(p)) && (!inStockOnly || p.inStock !== false) && matchesTokens(p, tokens)
      ),
    [products, bundleOnly, inStockOnly, tokens]
  );

  // Products in scope before the facet filters — drives price/size/discount counts.
  const scoped = useMemo(
    () => (category ? categoryScope.filter((p) => p.category === category) : categoryScope),
    [categoryScope, category]
  );

  const results = useMemo(
    () =>
      sortProducts(
        scoped.filter(
          (p) =>
            inPriceBucket(p, priceKey) &&
            (!minOff || discountPercent(p.price, p.originalPrice) >= minOff) &&
            (selectedSizes.length === 0 || (p.sizes || []).some((s) => selectedSizes.includes(s)))
        ),
        sortBy
      ),
    [scoped, priceKey, minOff, selectedSizes, sortBy]
  );

  const allCategories = useMemo(() => summarizeCategories(products), [products]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    categoryScope.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return counts;
  }, [categoryScope]);

  const priceOptions = useMemo(
    () =>
      PRICE_BUCKETS.map((b) => ({ ...b, count: scoped.filter((p) => inPriceBucket(p, b.key)).length })).filter(
        (b) => b.count > 0 || b.key === priceKey
      ),
    [scoped, priceKey]
  );

  const discountOptions = useMemo(
    () =>
      DISCOUNT_STEPS.map((n) => ({
        n,
        count: scoped.filter((p) => discountPercent(p.price, p.originalPrice) >= n).length,
      })).filter((d) => d.count > 0 || d.n === minOff),
    [scoped, minOff]
  );

  const sizeOptions = useMemo(() => {
    const set = new Set<string>(selectedSizes);
    scoped.forEach((p) => (p.sizes || []).forEach((s) => set.add(s)));
    return sortSizes([...set]);
  }, [scoped, selectedSizes]);

  /* ----- Paging & scroll memory ----- */

  // Back to page one whenever the filters change (but not on the first render).
  const lastSearch = useRef(search);
  useEffect(() => {
    if (lastSearch.current === search) return;
    lastSearch.current = search;
    setDisplayedCount(PAGE_SIZE);
  }, [search]);

  // Remember how far the shopper scrolled, so "Back" from a product lands in the same spot.
  const storageKey = `catalog-view:${search}`;
  useEffect(() => {
    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify({ count: countRef.current, y: window.scrollY }));
        } catch {
          // Storage unavailable (private mode) — scroll memory is a nicety.
        }
      });
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      window.removeEventListener('scroll', save);
      cancelAnimationFrame(frame);
    };
  }, [storageKey]);

  const restored = useRef(false);
  useLayoutEffect(() => {
    if (restored.current || loading) return;
    restored.current = true;
    if (action !== 'pop') return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved && saved.y > 0) {
        setDisplayedCount(Math.max(PAGE_SIZE, Number(saved.count) || PAGE_SIZE));
        requestAnimationFrame(() => window.scrollTo(0, saved.y));
      }
    } catch {
      // Ignore malformed or unavailable storage.
    }
    // Runs once, after the first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const visibleProducts = results.slice(0, displayedCount);
  const hasMore = displayedCount < results.length;
  const progress = results.length ? Math.round((Math.min(displayedCount, results.length) / results.length) * 100) : 0;

  /* ----- Labels ----- */

  const title = q ? `Results for “${q}”` : category || (bundleOnly ? 'Packs & combos' : 'All products');
  const activeChips: { label: string; onRemove: () => void }[] = [
    ...(q ? [{ label: `“${q}”`, onRemove: () => updateParams({ q: null }) }] : []),
    ...(category ? [{ label: category, onRemove: () => updateParams({ category: null }, true) }] : []),
    ...(bundleOnly ? [{ label: 'Packs & combos', onRemove: () => updateParams({ bundle: null }) }] : []),
    ...(priceKey
      ? [{ label: PRICE_BUCKETS.find((b) => b.key === priceKey)?.label || priceKey, onRemove: () => updateParams({ price: null }) }]
      : []),
    ...selectedSizes.map((s) => ({ label: `Size ${s}`, onRemove: () => toggleSize(s) })),
    ...(minOff ? [{ label: `${minOff}%+ off`, onRemove: () => updateParams({ off: null }) }] : []),
    ...(inStockOnly ? [{ label: 'In stock', onRemove: () => updateParams({ stock: null }) }] : []),
  ];
  const facetCount = activeChips.length - (q ? 1 : 0) - (category ? 1 : 0);

  const filterPanel = (
    <div>
      <FilterSection title="Price">
        <div className="space-y-0.5">
          {priceOptions.map((b) => (
            <OptionRow
              key={b.key}
              shape="round"
              checked={priceKey === b.key}
              onClick={() => updateParams({ price: priceKey === b.key ? null : b.key })}
              label={b.label}
              count={b.count}
            />
          ))}
        </div>
      </FilterSection>

      {sizeOptions.length > 0 && (
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {(showAllSizes ? sizeOptions : sizeOptions.slice(0, SIZE_PREVIEW)).map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSize(size)}
                  className={`h-9 min-w-[2.75rem] rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-stone-950 bg-stone-950 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-950'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {sizeOptions.length > SIZE_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAllSizes(!showAllSizes)}
              className="mt-3 text-[13px] font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-950"
            >
              {showAllSizes ? 'Show fewer sizes' : `Show all ${sizeOptions.length} sizes`}
            </button>
          )}
        </FilterSection>
      )}

      {discountOptions.length > 0 && (
        <FilterSection title="Discount">
          <div className="space-y-0.5">
            {discountOptions.map((d) => (
              <OptionRow
                key={d.n}
                shape="round"
                checked={minOff === d.n}
                onClick={() => updateParams({ off: minOff === d.n ? null : String(d.n) })}
                label={`${d.n}% and above`}
                count={d.count}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="More filters">
        <div className="space-y-1">
          <Toggle checked={bundleOnly} onChange={(v) => updateParams({ bundle: v ? '1' : null })} label="Packs & combos only" />
          <Toggle checked={inStockOnly} onChange={(v) => updateParams({ stock: v ? '1' : null })} label="In stock only" />
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <section className="border-b border-stone-200/70 bg-cream-100">
        <div className="container-page pb-6 pt-8 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Shop', to: '/catalog' },
              ...(category ? [{ label: category }] : []),
            ]}
          />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] text-stone-950 sm:text-5xl">{title}</h1>
            <p className="pb-1 text-sm text-stone-500">
              {loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'style' : 'styles'}`}
            </p>
          </div>

          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
            <button
              type="button"
              onClick={() => updateParams({ category: null }, true)}
              className={`chip ${!category ? 'chip-active' : ''}`}
            >
              All
              <span className={!category ? 'text-white/60' : 'text-stone-400'}>{categoryScope.length}</span>
            </button>
            {allCategories.map((c) => {
              const active = category === c.name;
              const count = categoryCounts.get(c.name) || 0;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => updateParams({ category: active ? null : c.name }, true)}
                  className={`chip ${active ? 'chip-active' : ''} ${count === 0 && !active ? 'opacity-50' : ''}`}
                >
                  {c.name}
                  <span className={active ? 'text-white/60' : 'text-stone-400'}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container-page pb-20 pt-6 sm:pt-8">
        <div className="flex gap-10">
          {/* Desktop filters */}
          <aside className="hidden w-60 flex-shrink-0 lg:block" aria-label="Filters">
            <div className="no-scrollbar sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-stone-950">Filters</p>
                {facetCount > 0 && (
                  <button onClick={clearFacets} className="text-[13px] font-medium text-stone-500 underline-offset-4 hover:text-stone-950 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setFiltersOpen(true)} className="btn-outline btn-sm lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {facetCount > 0 && (
                  <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-stone-950 px-1 text-[11px] text-white">
                    {facetCount}
                  </span>
                )}
              </button>
              <p className="hidden text-sm text-stone-500 lg:block">
                Showing <span className="font-semibold text-stone-950">{Math.min(displayedCount, results.length)}</span> of{' '}
                <span className="font-semibold text-stone-950">{results.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="hidden text-sm text-stone-500 sm:block">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => updateParams({ sort: e.target.value === 'featured' ? null : e.target.value })}
                  className="input h-10 w-auto rounded-full py-0 pl-4 text-[13px] font-semibold"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <div className="ml-1 hidden items-center rounded-full border border-stone-200 p-0.5 xl:flex" role="group" aria-label="Grid density">
                  <button
                    type="button"
                    onClick={() => setDense(false)}
                    aria-pressed={!dense}
                    className={`grid h-8 w-8 place-items-center rounded-full transition ${!dense ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-950'}`}
                    aria-label="Three per row"
                  >
                    <Columns3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDense(true)}
                    aria-pressed={dense}
                    className={`grid h-8 w-8 place-items-center rounded-full transition ${dense ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-950'}`}
                    aria-label="Four per row"
                  >
                    <Columns4 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters */}
            {activeChips.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.onRemove}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-stone-100 pl-3 pr-2 text-[13px] font-medium text-stone-800 transition hover:bg-stone-200"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label}
                    <X className="h-3.5 w-3.5 text-stone-500" />
                  </button>
                ))}
                {activeChips.length > 1 && (
                  <button onClick={clearAll} className="ml-1 text-[13px] font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-950">
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            <div className="mt-6">
              {loading ? (
                <ProductGridSkeleton
                  count={12}
                  className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 ${dense ? 'xl:grid-cols-4' : ''}`}
                />
              ) : error ? (
                <EmptyState icon={Store} title="We couldn't load products" description="Please check your connection and try again.">
                  <button onClick={retry} className="btn-primary">
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                </EmptyState>
              ) : results.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="Nothing matches just yet"
                  description={q ? `We couldn't find products for “${q}” with these filters.` : 'Try removing a filter or two to see more styles.'}
                >
                  <button onClick={clearAll} className="btn-primary">
                    Clear all filters
                  </button>
                </EmptyState>
              ) : (
                <div className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 ${dense ? 'xl:grid-cols-4' : ''}`}>
                  {visibleProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i < 4} />
                  ))}
                </div>
              )}
            </div>

            {!loading && hasMore && (
              <div className="mt-16 flex flex-col items-center gap-4">
                <p className="text-sm text-stone-500">
                  You've viewed {Math.min(displayedCount, results.length)} of {results.length} styles
                </p>
                <div className="h-1 w-56 overflow-hidden rounded-full bg-stone-200">
                  <div className="h-full rounded-full bg-stone-950 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <button onClick={() => setDisplayedCount((c) => c + PAGE_SIZE)} className="btn-outline mt-2 min-w-[12rem]">
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="bottom"
        title="Filters"
        label="Filters"
        footer={
          <div className="flex gap-3">
            <button onClick={clearFacets} disabled={facetCount === 0} className="btn-outline flex-1">
              Clear filters
            </button>
            <button onClick={() => setFiltersOpen(false)} className="btn-primary flex-[2]">
              Show {results.length} {results.length === 1 ? 'style' : 'styles'}
            </button>
          </div>
        }
      >
        <div className="p-5">{filterPanel}</div>
      </Drawer>
    </div>
  );
}
