import { MouseEvent, useMemo } from 'react';
import { ArrowRight, ArrowUpRight, RefreshCw, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { Product } from '../types';
import { Link } from '../utils/router';
import { summarizeCategories, useProducts } from '../hooks/useProducts';
import { img, imgSet } from '../utils/cdn';
import { discountPercent, formatINR } from '../utils/format';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import SectionHeading from '../components/ui/SectionHeading';
import { ProductGridSkeleton } from '../components/ui/Skeleton';

interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  count: number;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'T-Shirts': 'Everyday comfort meets timeless style',
  'Shirts': 'Elevate your professional wardrobe',
  'Hoodies': 'Performance-driven athletic apparel',
  'Accessories': 'Complete your look with premium extras',
};

// Bento placement by number of collections (2-column grid on mobile, 4 on desktop).
const BENTO_LAYOUTS: Record<number, string[]> = {
  1: ['col-span-2 row-span-2 lg:col-span-4'],
  2: ['col-span-2 row-span-2', 'col-span-2 row-span-2'],
  3: ['col-span-2 row-span-2', 'col-span-2', 'col-span-2'],
  4: ['col-span-2 row-span-2', 'col-span-2', 'col-span-1', 'col-span-1'],
};

// Fanned hero cards: left, centre (front), right.
const FAN_LEFT = 'left-0 z-10 -rotate-[7deg]';
const FAN_CENTER = 'left-1/2 z-20 -translate-x-1/2 scale-[1.06]';
const FAN_RIGHT = 'right-0 z-10 rotate-[7deg]';
const FAN_POSITIONS: Record<number, string[]> = {
  1: [FAN_CENTER],
  2: [FAN_LEFT, FAN_RIGHT],
  3: [FAN_LEFT, FAN_CENTER, FAN_RIGHT],
};

function CollectionTile({ collection, large, className }: { collection: Collection; large: boolean; className: string }) {
  return (
    <Link
      to={`/catalog?category=${encodeURIComponent(collection.category)}`}
      className={`group relative isolate flex flex-col overflow-hidden rounded-3xl bg-stone-900 p-5 sm:p-7 ${className}`}
    >
      {collection.image && (
        <img
          src={img(collection.image, large ? 1000 : 700)}
          srcSet={imgSet(collection.image, large ? [600, 1000, 1400] : [400, 700, 1000])}
          sizes={large ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_25%] transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-stone-950/5" />

      <span className="badge self-start bg-white/90 text-stone-900 backdrop-blur">
        {collection.count} {collection.count === 1 ? 'item' : 'items'}
      </span>

      <div className="mt-auto flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className={`font-semibold leading-tight text-white ${large ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
            {collection.name}
          </h3>
          <p className={`mt-1.5 line-clamp-2 text-white/80 ${large ? 'text-[15px]' : 'hidden text-[13px] sm:block'}`}>
            {collection.description}
          </p>
        </div>
        <span
          className={`grid flex-shrink-0 place-items-center rounded-full bg-white text-stone-950 transition-transform duration-300 group-hover:-rotate-45 ${
            large ? 'h-12 w-12' : 'h-9 w-9 sm:h-11 sm:w-11'
          }`}
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function PremiumTile({ product, large, className }: { product: Product; large: boolean; className: string }) {
  const off = discountPercent(product.price, product.originalPrice);
  return (
    <Link
      to={`/product/${product.slug || product.id}`}
      className={`group relative isolate flex flex-col overflow-hidden rounded-3xl bg-stone-900 p-5 sm:p-7 ${className}`}
    >
      <img
        src={img(product.image, large ? 1000 : 700)}
        srcSet={imgSet(product.image, large ? [600, 1000, 1400] : [400, 700, 1000])}
        sizes={large ? '(min-width: 1024px) 50vw, 100vw' : '50vw'}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />

      {off > 0 && <span className="badge self-start bg-gold-500 text-stone-950">{off}% OFF</span>}

      <div className="mt-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">{product.category}</p>
        <h3 className={`mt-1.5 line-clamp-2 font-semibold leading-snug text-white ${large ? 'text-2xl sm:text-3xl' : 'text-base sm:text-xl'}`}>
          {product.name}
        </h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className={`font-semibold tabular-nums text-white ${large ? 'text-xl' : 'text-base'}`}>{formatINR(product.price)}</span>
            {off > 0 && <span className="text-sm tabular-nums text-white/55 line-through">{formatINR(product.originalPrice)}</span>}
          </p>
          <span className="hidden items-center gap-1.5 text-sm font-semibold text-white sm:inline-flex">
            Shop now
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Shop() {
  const { products, loading, error, retry } = useProducts();

  // Build collections from the categories that actually exist in the catalog,
  // largest first, so no card can ever show "0 items".
  const collections: Collection[] = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({
        id: category,
        name: category,
        description: CATEGORY_DESCRIPTIONS[category] || `Explore our latest ${category} styles`,
        image: products.find((p) => p.category === category && p.image)?.image || '',
        category,
        count,
      }));
  }, [products]);

  const allCategories = useMemo(() => summarizeCategories(products), [products]);

  const featuredProducts = useMemo(
    () =>
      products
        .filter((p) => p.inStock)
        .sort((a, b) => b.price - a.price)
        .slice(0, 3),
    [products]
  );

  const moreProducts = useMemo(
    () => products.filter((p) => p.inStock && !featuredProducts.some((f) => f.id === p.id)).slice(0, 4),
    [products, featuredProducts]
  );

  const heroImages = collections.slice(0, 3).map((c) => c.image).filter(Boolean);
  const showSkeletons = loading && products.length === 0;
  const failed = error && products.length === 0;
  const empty = !loading && !error && products.length === 0;
  const bento = BENTO_LAYOUTS[Math.min(collections.length, 4)] || BENTO_LAYOUTS[4];

  const scrollToCollections = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('collections');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-100">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold-200/50 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold-100 blur-3xl" />

        <div className="container-page relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-2 lg:gap-10 lg:py-24">
          <div className="animate-fade-up">
            <p className="eyebrow mb-5 inline-flex items-center gap-2 text-gold-700">
              <Sparkles className="h-3.5 w-3.5" />
              Collections
            </p>
            <h1 className="text-6xl font-semibold leading-[0.95] text-stone-950 sm:text-7xl lg:text-8xl">
              Style <span className="font-serif font-normal italic text-gold-700">Studio</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-stone-600">
              Discover curated collections that define your unique style
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#collections" onClick={scrollToCollections} className="btn-primary">
                Explore collections
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/catalog" className="btn-outline">
                View all products
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[22rem] w-full max-w-md sm:h-[28rem] lg:max-w-lg">
            {showSkeletons
              ? FAN_POSITIONS[3].map((position) => (
                  <div
                    key={position}
                    className={`skeleton absolute top-1/2 aspect-[3/4] w-[46%] -translate-y-1/2 rounded-3xl border-[6px] border-white ${position}`}
                  />
                ))
              : heroImages.map((src, i) => (
                  <div
                    key={`${i}-${src}`}
                    className={`absolute top-1/2 aspect-[3/4] w-[46%] -translate-y-1/2 overflow-hidden rounded-3xl border-[6px] border-white bg-cream-200 shadow-lift ${FAN_POSITIONS[heroImages.length][i]}`}
                  >
                    <img
                      src={img(src, 600)}
                      srcSet={imgSet(src, [400, 600, 900])}
                      sizes="(min-width: 1024px) 240px, 45vw"
                      alt=""
                      loading="eager"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {failed ? (
        <EmptyState
          icon={RefreshCw}
          title="We couldn't load the collections"
          description="Please check your connection and try again."
        >
          <button onClick={retry} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link to="/catalog" className="btn-outline">
            View all products
          </Link>
        </EmptyState>
      ) : empty ? (
        <EmptyState icon={ShoppingBag} title="No collections to show yet" description="Please check back soon." />
      ) : (
        <>
          {/* Shop by Collection */}
          <section id="collections" className="container-page scroll-mt-28 py-16 sm:py-24">
            <SectionHeading
              eyebrow="Top categories"
              title="Shop by Collection"
              action={{ label: 'View all products', to: '/catalog' }}
            />

            <div className="mt-10 grid auto-rows-[14rem] grid-cols-2 gap-3 sm:auto-rows-[17rem] sm:gap-4 lg:auto-rows-[18rem] lg:grid-cols-4">
              {showSkeletons
                ? BENTO_LAYOUTS[4].map((span, i) => <div key={i} className={`skeleton rounded-3xl ${span}`} />)
                : collections.map((collection, i) => (
                    <CollectionTile key={collection.id} collection={collection} large={i === 0} className={bento[i] || 'col-span-1'} />
                  ))}
            </div>

            {allCategories.length > collections.length && (
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-sm font-semibold text-stone-950">All categories</span>
                {allCategories.map((c) => (
                  <Link key={c.name} to={`/catalog?category=${encodeURIComponent(c.name)}`} className="chip">
                    {c.name}
                    <span className="text-stone-400">{c.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Premium Picks */}
          {(showSkeletons || featuredProducts.length > 0) && (
            <section className="border-t border-stone-200/70 bg-cream-50 py-16 sm:py-24">
              <div className="container-page">
                <h2 className="flex items-center gap-3 text-3xl font-semibold leading-[1.1] text-stone-950 sm:text-4xl">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-950 text-gold-400">
                    <Star className="h-4 w-4" />
                  </span>
                  Premium Picks
                </h2>

                <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:h-[44rem] lg:grid-rows-2">
                  {showSkeletons ? (
                    <>
                      <div className="skeleton col-span-2 aspect-[4/5] rounded-3xl sm:aspect-[16/11] lg:col-span-1 lg:row-span-2 lg:aspect-auto" />
                      <div className="skeleton aspect-[3/4] rounded-3xl lg:aspect-auto" />
                      <div className="skeleton aspect-[3/4] rounded-3xl lg:aspect-auto" />
                    </>
                  ) : (
                    featuredProducts.map((product, i) => (
                      <PremiumTile
                        key={product.id}
                        product={product}
                        large={i === 0}
                        className={
                          i === 0
                            ? 'col-span-2 aspect-[4/5] sm:aspect-[16/11] lg:col-span-1 lg:row-span-2 lg:aspect-auto'
                            : 'aspect-[3/4] lg:aspect-auto'
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {/* More to explore */}
          {(showSkeletons || moreProducts.length > 0) && (
            <section className="container-page py-16 sm:py-24">
              <SectionHeading eyebrow="Keep browsing" title="More to explore" action={{ label: 'View all products', to: '/catalog' }} />
              {showSkeletons ? (
                <ProductGridSkeleton count={4} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4" />
              ) : (
                <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
                  {moreProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* CTA */}
      <section className="container-page pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 px-6 py-14 text-center sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gold-700/25 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold text-white sm:text-5xl">
              Explore Our Complete <span className="font-serif font-normal italic text-gold-400">Catalog</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-stone-300">
              Browse through our entire collection and find exactly what you're looking for
            </p>
            <Link to="/catalog" className="btn-gold btn-lg mt-9">
              View all products
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
