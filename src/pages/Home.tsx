import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, RefreshCw, Store } from 'lucide-react';
import { Link } from '../utils/router';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import SectionHeading from '../components/ui/SectionHeading';
import EmptyState from '../components/ui/EmptyState';
import Price from '../components/ui/Price';
import { summarizeCategories, useProducts } from '../hooks/useProducts';
import { discountPercent } from '../utils/format';
import { img, imgSet } from '../utils/cdn';
import { isBundle, sortProducts } from '../utils/products';

type TabKey = 'deals' | 'new' | 'value';

const TABS: { key: TabKey; label: string; href: string; cta: string }[] = [
  { key: 'deals', label: 'Top deals', href: '/catalog?sort=discount', cta: 'Shop all deals' },
  { key: 'new', label: 'New arrivals', href: '/catalog?sort=newest', cta: 'Shop new arrivals' },
  { key: 'value', label: 'Under ₹1,000', href: '/catalog?price=0-999', cta: 'Shop under ₹1,000' },
];

export default function Home() {
  const { products, loading, error, retry } = useProducts();
  const [tab, setTab] = useState<TabKey>('deals');

  const categories = useMemo(() => summarizeCategories(products), [products]);
  const inStockCount = useMemo(() => products.filter((p) => p.inStock !== false).length, [products]);
  const byDiscount = useMemo(() => sortProducts(products, 'discount'), [products]);
  const maxDiscount = byDiscount.length ? discountPercent(byDiscount[0].price, byDiscount[0].originalPrice) : 0;
  const topDeal = byDiscount[0];
  const bundles = useMemo(() => byDiscount.filter(isBundle), [byDiscount]);

  const tabProducts = useMemo(() => {
    if (tab === 'new') return sortProducts(products, 'newest').slice(0, 8);
    if (tab === 'value') return sortProducts(products.filter((p) => p.price < 1000), 'discount').slice(0, 8);
    return byDiscount.slice(0, 8);
  }, [tab, products, byDiscount]);

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0];

  // Editorial images: the best deal in a category, avoiding the photo already used on its category tile.
  const pickImage = (category: string | undefined) => {
    if (!category) return '';
    const tileImage = categories.find((c) => c.name === category)?.image;
    const pick = byDiscount.find((p) => p.category === category && p.image && p.image !== tileImage);
    return pick?.image || tileImage || '';
  };
  const heroImages = categories.slice(0, 3).map((c) => pickImage(c.name));
  const storyImages = categories.slice(3, 5).map((c) => pickImage(c.name));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-100">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-gold-200/50 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-white/80 blur-3xl" />

        <div className="container-page relative grid grid-cols-1 items-center gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
          <div className="animate-fade-up lg:col-span-6 xl:col-span-5">
            <p className="eyebrow flex items-center gap-3 text-gold-700">
              <span className="h-px w-8 bg-gold-500" />
              Clothing &amp; lifestyle
            </p>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[0.95] text-stone-950 sm:text-6xl xl:text-7xl">
              Style that stands <span className="font-serif font-normal italic text-gold-600">proud.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
              Curated clothing, footwear and accessories for women, men and kids — with cash on delivery across India.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/catalog" className="btn-primary btn-lg group">
                Shop the collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/shop" className="btn-outline btn-lg">
                Explore collections
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 divide-x divide-stone-300/70 border-t border-stone-300/70 pt-6">
              {[
                { value: inStockCount ? String(inStockCount) : '', label: 'Styles in stock' },
                { value: categories.length ? String(categories.length) : '', label: 'Categories' },
                { value: maxDiscount ? `${maxDiscount}%` : '', label: 'Max savings' },
              ].map((stat, i) => (
                <div key={stat.label} className={`flex flex-col-reverse gap-1 ${i === 0 ? 'pr-4' : 'px-4'}`}>
                  <dt className="text-xs text-stone-500">{stat.label}</dt>
                  <dd className="font-display text-2xl font-semibold text-stone-950 sm:text-3xl">
                    {stat.value || <span className="skeleton inline-block h-7 w-14 align-middle" />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Collage */}
          <div className="relative lg:col-span-6 xl:col-span-7">
            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              {[0, 1, 2].map((i) => {
                const src = heroImages[i];
                const shape = i === 0 ? 'col-span-3 row-span-2' : 'col-span-2 aspect-square';
                return (
                  <div key={i} className={`relative overflow-hidden rounded-3xl bg-cream-200 ${shape}`}>
                    {src ? (
                      <img
                        src={img(src, i === 0 ? 900 : 600)}
                        srcSet={imgSet(src, i === 0 ? [600, 900, 1200] : [400, 600, 900])}
                        sizes={i === 0 ? '(min-width: 1024px) 34vw, 60vw' : '(min-width: 1024px) 22vw, 40vw'}
                        alt=""
                        className="h-full w-full animate-fade-in object-cover object-[center_20%]"
                      />
                    ) : (
                      <div className="skeleton h-full w-full rounded-none" />
                    )}
                  </div>
                );
              })}
            </div>

            {maxDiscount > 0 && (
              <div className="absolute right-3 top-3 animate-pop-in rounded-full bg-stone-950 px-4 py-2 text-[13px] font-semibold text-gold-400 shadow-lift sm:right-5 sm:top-5">
                Up to {maxDiscount}% off
              </div>
            )}

            {topDeal && (
              <Link
                to={`/product/${topDeal.slug || topDeal.id}`}
                className="group absolute bottom-3 left-3 flex max-w-[78%] animate-fade-up items-center gap-3 rounded-2xl bg-white/95 p-2.5 pr-4 shadow-lift backdrop-blur sm:bottom-6 sm:left-6 sm:max-w-[20rem]"
              >
                <img src={img(topDeal.image, 160)} alt="" className="h-16 w-12 flex-shrink-0 rounded-xl bg-cream-200 object-cover" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">Today's top deal</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-stone-900 group-hover:text-gold-700">{topDeal.name}</p>
                  <Price price={topDeal.price} originalPrice={topDeal.originalPrice} size="sm" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Category ticker */}
      {categories.length > 0 && (
        <section aria-label="Browse categories" className="overflow-hidden bg-stone-950 py-5">
          <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex items-center" aria-hidden={copy === 1 ? true : undefined}>
                {categories.map((c) => (
                  <li key={c.name} className="flex items-center">
                    <Link
                      to={`/catalog?category=${encodeURIComponent(c.name)}`}
                      tabIndex={copy === 1 ? -1 : undefined}
                      className="px-7 font-display text-2xl font-medium text-white/85 transition-colors hover:text-gold-400 sm:text-3xl"
                    >
                      {c.name}
                    </Link>
                    <span className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      )}

      {/* Shop by category */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading
          eyebrow="Categories"
          title="Shop by category"
          description="From everyday tees to festive kurtas — find your fit."
          action={{ label: 'View all products', to: '/catalog' }}
        />
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
          {loading && categories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[3/4] w-44 flex-shrink-0 rounded-2xl lg:w-auto" />
              ))
            : categories.map((c) => (
                <Link
                  key={c.name}
                  to={`/catalog?category=${encodeURIComponent(c.name)}`}
                  className="group relative w-44 flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-cream-200 sm:w-52 lg:w-auto"
                >
                  <div className="aspect-[3/4]">
                    {c.image && (
                      <img
                        src={img(c.image, 500)}
                        srcSet={imgSet(c.image, [360, 500, 800])}
                        sizes="(min-width: 1024px) 18vw, 45vw"
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold leading-tight">{c.name}</p>
                      <p className="mt-0.5 text-xs text-white/75">{c.count} styles</p>
                    </div>
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-gold-500 group-hover:text-stone-950">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Curated tabs */}
      <section className="bg-cream-100 py-16 sm:py-24">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-3 text-gold-700">The edit</p>
              <h2 className="text-3xl font-semibold leading-[1.1] text-stone-950 sm:text-4xl">Handpicked for you</h2>
            </div>
            <div role="tablist" aria-label="Product picks" className="inline-flex self-start rounded-full bg-white p-1 shadow-soft md:self-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`h-10 rounded-full px-3.5 text-[13px] font-semibold transition-colors sm:px-5 ${
                    tab === t.key ? 'bg-stone-950 text-white' : 'text-stone-600 hover:text-stone-950'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4" />
          ) : error ? (
            <EmptyState icon={Store} title="We couldn't load products" description="Please check your connection and try again.">
              <button onClick={retry} className="btn-primary">
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </EmptyState>
          ) : (
            <div key={tab} className="mt-10 grid animate-fade-in grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
              {tabProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
          )}

          {!error && (
            <div className="mt-12 text-center">
              <Link to={activeTab.href} className="btn-primary group">
                {activeTab.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Packs & combos */}
      {bundles.length >= 3 && (
        <section className="container-page py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
            <div className="relative grid grid-cols-1 items-center gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
              <div>
                <p className="eyebrow mb-4 text-gold-400">Packs &amp; combos</p>
                <h2 className="text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl">
                  Buy together, <span className="font-serif font-normal italic text-gold-400">save more.</span>
                </h2>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-300">
                  Multipacks and complete looks bundled at a better price than buying each piece on its own —{' '}
                  {bundles.length} sets to choose from.
                </p>
                <Link to="/catalog?bundle=1" className="btn-gold group mt-8">
                  Shop packs &amp; combos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Absolutely-positioned children of a centered flex box start at its center. */}
              <Link
                to="/catalog?bundle=1"
                className="group relative mx-auto flex h-72 w-full max-w-md items-center justify-center sm:h-96"
                aria-label="Shop packs and combos"
              >
                {bundles.slice(0, 3).map((p, i) => {
                  const pose = [
                    '-translate-x-[55%] translate-y-3 -rotate-[8deg] group-hover:-translate-x-[72%] group-hover:-rotate-[12deg]',
                    'z-10 -translate-y-2 group-hover:-translate-y-4',
                    'translate-x-[55%] translate-y-3 rotate-[8deg] group-hover:translate-x-[72%] group-hover:rotate-[12deg]',
                  ][i];
                  return (
                    <div
                      key={p.id}
                      className={`absolute w-36 overflow-hidden rounded-2xl bg-cream-200 shadow-2xl ring-4 ring-stone-950 transition-transform duration-500 sm:w-48 ${pose}`}
                    >
                      <img src={img(p.image, 500)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
                    </div>
                  );
                })}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Brand promise */}
      <section className="container-page pb-20 pt-4 sm:pb-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 grid grid-cols-2 items-start gap-4 lg:order-1">
            {[0, 1].map((i) => (
              <div key={i} className={`overflow-hidden rounded-3xl bg-cream-200 ${i === 1 ? 'mt-12' : ''}`}>
                {storyImages[i] ? (
                  <img src={img(storyImages[i], 700)} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="skeleton aspect-[3/4] w-full rounded-none" />
                )}
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow mb-4 text-gold-700">Our promise</p>
            <h2 className="text-balance text-4xl font-semibold leading-[1.05] text-stone-950 sm:text-5xl">
              Chosen with care. <span className="font-serif font-normal italic text-gold-600">Delivered with pride.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-stone-600 sm:text-base">
              Every product is carefully selected and quality-checked to ensure it meets our high standards before it reaches you.
              Honest pricing, secure payments and clear policies — we build lasting relationships through trust.
            </p>
            <Link to="/about" className="btn-outline group mt-8">
              Our story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
