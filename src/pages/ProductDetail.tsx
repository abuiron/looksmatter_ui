import { MouseEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, Heart, RefreshCw, SearchX, Share2, ShoppingBag, Zap } from 'lucide-react';
import { Link, useRouter } from '../utils/router';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useToast } from '../contexts/ToastContext';
import { useProducts } from '../hooks/useProducts';
import { readRecentlyViewed, recordRecentlyViewed } from '../hooks/recentlyViewed';
import { Product } from '../types';
import { sortSizes } from '../utils/sizes';
import { img, imgSet } from '../utils/cdn';
import { discountPercent, formatINR } from '../utils/format';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Price from '../components/ui/Price';
import QuantityStepper from '../components/ui/QuantityStepper';
import EmptyState from '../components/ui/EmptyState';
import { TrustList } from '../components/ui/TrustBadges';
import ProductRail from '../components/ProductRail';

interface ProductDetailProps {
  slug: string;
}

/* ---------- Gallery ---------- */

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const many = images.length > 1;

  const goTo = (index: number) => {
    const next = (index + images.length) % images.length;
    setActive(next);
    const el = scroller.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };

  // Keep the dots in sync while swiping on touch screens.
  const handleScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const zoomStyle = zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined;

  return (
    <div>
      {/* Desktop: thumbnails + zoomable main image */}
      <div className="hidden gap-4 lg:flex">
        {/* Padding keeps the active thumbnail's ring from being clipped by the scroll container. */}
        {many && (
          <div className="no-scrollbar -m-1 flex max-h-[calc(100vh-9rem)] w-[5.5rem] flex-shrink-0 flex-col gap-3 overflow-y-auto p-1">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => setActive(i)}
                className={`aspect-[3/4] flex-shrink-0 overflow-hidden rounded-xl bg-cream-200 transition ${
                  active === i ? 'ring-2 ring-stone-950 ring-offset-2' : 'opacity-60 hover:opacity-100'
                }`}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={active === i}
              >
                <img src={img(src, 200)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1">
          <div
            className="relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-3xl bg-cream-200"
            onMouseMove={handleMove}
            onMouseLeave={() => setZoom(null)}
          >
            <img
              key={active}
              src={img(images[active], 1200)}
              srcSet={imgSet(images[active], [800, 1200, 1600])}
              sizes="(min-width: 1024px) 45vw, 100vw"
              alt={`${name} — image ${active + 1}`}
              className="h-full w-full animate-fade-in object-cover transition-transform duration-200 ease-out"
              style={zoomStyle}
            />
            {zoom && (
              <img
                src={img(images[active], 2000)}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                style={zoomStyle}
              />
            )}
          </div>

          {many && !zoom && (
            <>
              <button
                onClick={() => goTo(active - 1)}
                className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-900 shadow-soft backdrop-blur transition hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => goTo(active + 1)}
                className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-900 shadow-soft backdrop-blur transition hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-stone-950/70 px-3 py-1 text-xs font-medium tabular-nums text-white backdrop-blur">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Touch: swipeable carousel */}
      <div className="relative -mx-4 sm:-mx-6 lg:hidden">
        <div ref={scroller} onScroll={handleScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="aspect-[3/4] w-full flex-shrink-0 snap-center bg-cream-200">
              <img
                src={img(src, 900)}
                srcSet={imgSet(src, [600, 900, 1200])}
                sizes="100vw"
                alt={`${name} — image ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        {many && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${active === i ? 'w-6 bg-stone-950' : 'w-1.5 bg-stone-950/30'}`}
                aria-label={`Show image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Accordion ---------- */

function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-5 text-left text-[15px] font-semibold text-stone-950"
      >
        {title}
        <ChevronDown className={`h-5 w-5 text-stone-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="animate-fade-in pb-6 text-[15px] leading-relaxed text-stone-600">{children}</div>}
    </div>
  );
}

/* ---------- Page ---------- */

function DetailSkeleton() {
  return (
    <div className="container-page py-8" aria-hidden="true">
      <div className="skeleton h-4 w-64" />
      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="skeleton aspect-[3/4] rounded-3xl lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-9 w-4/5" />
          <div className="skeleton h-9 w-2/5" />
          <div className="skeleton h-12 w-full rounded-full" />
          <div className="skeleton h-12 w-full rounded-full" />
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail({ slug }: ProductDetailProps) {
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const toast = useToast();
  const { products, loading, error, retry } = useProducts();

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [refreshedForMissing, setRefreshedForMissing] = useState(false);
  const [recentIds] = useState(readRecentlyViewed);
  const buyBox = useRef<HTMLDivElement>(null);
  const sizePicker = useRef<HTMLDivElement>(null);

  // Find by slug first, then by id.
  const product = useMemo(() => products.find((p) => p.slug === slug || p.id === slug) || null, [products, slug]);
  const productId = product?.id;

  const related = useMemo(
    () => (product ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 8) : []),
    [products, product]
  );
  const recentlyViewed = useMemo(
    () =>
      recentIds
        .filter((id) => id !== productId)
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p)
        .slice(0, 8),
    [recentIds, products, productId]
  );

  // A product created moments ago may not be in the shared cache yet — refetch once before giving up.
  useEffect(() => {
    if (!loading && !error && !product && !refreshedForMissing) {
      setRefreshedForMissing(true);
      retry();
    }
  }, [loading, error, product, refreshedForMissing, retry]);

  // One-size products (e.g. sizes: ["Onesize"]) need no manual pick — auto-select it.
  // Keyed on the id so a background catalogue refresh doesn't wipe the shopper's choice.
  useEffect(() => {
    if (!product) return;
    const productSizes = product.sizes || [];
    setSelectedSize(productSizes.length === 1 ? productSizes[0] : '');
    setSizeError(false);
    recordRecentlyViewed(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Show the mobile buy bar once the main buttons have scrolled out of view.
  // Re-runs when loading ends: the buy box only mounts after the skeleton is gone.
  useEffect(() => {
    const el = buyBox.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [productId, loading]);

  if (loading || (!product && !error && !refreshedForMissing)) {
    return <DetailSkeleton />;
  }

  if (error && !product) {
    return (
      <EmptyState icon={RefreshCw} title="We couldn't load this product" description="Please check your connection and try again.">
        <button onClick={retry} className="btn-primary">
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </EmptyState>
    );
  }

  if (!product) {
    return (
      <EmptyState icon={SearchX} title="Product not found" description="It may have sold out or moved. Explore the rest of the collection instead.">
        <button onClick={() => navigate('/catalog')} className="btn-primary">
          Back to catalog
        </button>
      </EmptyState>
    );
  }

  const sizes = product.sizes && product.sizes.length > 0 ? sortSizes(product.sizes) : [];
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const favorite = isFavorite(product.id);
  const inStock = product.inStock !== false;
  const lowStock = inStock && typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5;
  const savings = discountPercent(product.price, product.originalPrice) > 0 ? (product.originalPrice || 0) - product.price : 0;
  const needsSize = sizes.length > 0 && !selectedSize;
  const categoryHref = `/catalog?category=${encodeURIComponent(product.category)}`;

  const flagMissingSize = () => {
    setSizeError(true);
    setShakeKey((k) => k + 1);
    sizePicker.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAddToCart = () => {
    // Force a size choice when the product offers sizes.
    if (needsSize) {
      flagMissingSize();
      return;
    }
    addToCart(product, quantity, selectedSize);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    toast({
      title: 'Added to bag',
      description: `${product.name}${selectedSize && selectedSize.toLowerCase() !== 'onesize' ? ` · Size ${selectedSize}` : ''}${quantity > 1 ? ` · Qty ${quantity}` : ''}`,
      image: img(product.image, 160),
      action: { label: 'View bag', onClick: () => navigate('/cart') },
    });
  };

  const handleBuyNow = () => {
    if (needsSize) {
      flagMissingSize();
      return;
    }
    addToCart(product, quantity, selectedSize);
    navigate('/checkout');
  };

  const toggleFavorite = () => {
    if (favorite) {
      removeFromFavorites(product.id);
      toast({ tone: 'info', title: 'Removed from wishlist', description: product.name });
    } else {
      addToFavorites(product);
      toast({
        title: 'Saved to wishlist',
        description: product.name,
        image: img(product.image, 160),
        action: { label: 'View', onClick: () => navigate('/favorites') },
      });
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Paste it anywhere to share this product.' });
    } catch {
      // Share sheet dismissed or clipboard blocked — nothing to do.
    }
  };

  return (
    <div className="pb-24 lg:pb-0">
      <div className="container-page pt-6 sm:pt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/catalog' },
            { label: product.category, to: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7">
            <Gallery images={images} name={product.name} />
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Link to={categoryHref} className="eyebrow text-gold-700 transition-colors hover:text-gold-900">
                {product.category}
              </Link>
              <h1 className="mt-3 text-balance text-3xl font-semibold leading-[1.15] text-stone-950 sm:text-4xl">{product.name}</h1>
              {product.sku && <p className="mt-2 text-xs text-stone-400">SKU: {product.sku}</p>}

              <Price price={product.price} originalPrice={product.originalPrice} size="lg" className="mt-6" />
              {savings > 0 && (
                <p className="mt-2 text-sm font-medium text-emerald-700">You save {formatINR(savings)} on the MRP</p>
              )}
              <p className="mt-1 text-xs text-stone-500">0.5% tax and flat ₹45 shipping added at checkout</p>

              <p className="mt-5 flex items-center gap-2 text-sm font-medium">
                {!inStock ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-rose-700">Out of stock</span>
                  </>
                ) : lowStock ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                    <span className="text-amber-700">Only {product.stock} left — order soon</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700">In stock and ready to ship</span>
                  </>
                )}
              </p>

              <div className="my-7 h-px bg-stone-200" />

              {sizes.length > 0 && (
                <div ref={sizePicker} className="mb-6 scroll-mt-32">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-stone-950">
                      Size {selectedSize && <span className="font-normal text-stone-500">— {selectedSize}</span>}
                    </p>
                    {sizeError && (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600" role="alert">
                        <AlertCircle className="h-4 w-4" />
                        Please select a size
                      </p>
                    )}
                  </div>
                  <div key={shakeKey} className={`flex flex-wrap gap-2 ${sizeError ? 'animate-shake' : ''}`}>
                    {sizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => {
                            setSelectedSize(size);
                            setSizeError(false);
                          }}
                          aria-pressed={active}
                          className={`h-12 min-w-[3.25rem] rounded-xl border px-4 text-sm font-semibold transition ${
                            active
                              ? 'border-stone-950 bg-stone-950 text-white'
                              : sizeError
                                ? 'border-rose-300 bg-white text-stone-900 hover:border-stone-950'
                                : 'border-stone-300 bg-white text-stone-900 hover:border-stone-950'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div ref={buyBox} className="space-y-3">
                <div className="flex gap-3">
                  {inStock && <QuantityStepper value={quantity} onChange={(v) => setQuantity(Math.max(1, v))} />}
                  <button onClick={handleAddToCart} disabled={!inStock} className="btn-primary min-w-0 flex-1 px-4 sm:px-6">
                    {!inStock ? (
                      'Sold out'
                    ) : addedToCart ? (
                      <>
                        <Check className="h-4 w-4" />
                        Added to bag
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        Add to bag
                      </>
                    )}
                  </button>
                  <button
                    onClick={toggleFavorite}
                    aria-pressed={favorite}
                    aria-label={favorite ? 'Remove from wishlist' : 'Save to wishlist'}
                    className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border transition ${
                      favorite ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-stone-300 text-stone-800 hover:border-stone-950'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${favorite ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
                {inStock && (
                  <button onClick={handleBuyNow} className="btn-gold w-full">
                    <Zap className="h-4 w-4" />
                    Buy it now
                  </button>
                )}
              </div>

              <div className="mt-7 rounded-2xl bg-cream-100 p-5">
                <TrustList />
              </div>

              <div className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
                <Accordion title="Description" defaultOpen>
                  <p className="whitespace-pre-line">{product.description}</p>
                </Accordion>
                <Accordion title="Product details">
                  <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2.5 text-sm">
                    {product.sku && (
                      <>
                        <dt className="text-stone-500">SKU</dt>
                        <dd className="font-medium text-stone-900">{product.sku}</dd>
                      </>
                    )}
                    <dt className="text-stone-500">Category</dt>
                    <dd className="font-medium text-stone-900">{product.category}</dd>
                    {sizes.length > 0 && (
                      <>
                        <dt className="text-stone-500">Sizes</dt>
                        <dd className="font-medium text-stone-900">{sizes.join(', ')}</dd>
                      </>
                    )}
                    <dt className="text-stone-500">Availability</dt>
                    <dd className="font-medium text-stone-900">{inStock ? 'In stock' : 'Out of stock'}</dd>
                  </dl>
                </Accordion>
                <Accordion title="Shipping & returns">
                  <ul className="space-y-2.5 text-sm">
                    <li>Orders are processed within 1–2 business days and usually delivered in 4–7 business days.</li>
                    <li>A flat shipping charge of ₹45 applies to every order. Cash on Delivery is available.</li>
                    <li>Not quite right? Start a return within 7 days of delivery.</li>
                  </ul>
                  <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-stone-950">
                    <Link to="/shipping" className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-950">
                      Shipping policy
                    </Link>
                    <Link to="/refund" className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-950">
                      Refund policy
                    </Link>
                  </p>
                </Accordion>
              </div>

              <button
                onClick={share}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
              >
                <Share2 className="h-4 w-4" />
                Share this product
              </button>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="container-page mt-20 sm:mt-28">
          <ProductRail
            eyebrow="More like this"
            title="You may also like"
            products={related}
            action={{ label: `Shop all ${product.category}`, to: categoryHref }}
          />
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div className="container-page mt-20 sm:mt-24">
          <ProductRail eyebrow="Pick up where you left off" title="Recently viewed" products={recentlyViewed} />
        </div>
      )}

      <div className="h-20 sm:h-28" />

      {/* Mobile buy bar */}
      {showStickyBar && inStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
          <div className="flex items-center gap-3">
            <img src={img(product.image, 120)} alt="" className="h-12 w-9 flex-shrink-0 rounded-lg bg-cream-200 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-stone-500">{selectedSize ? `Size ${selectedSize}` : product.name}</p>
              <p className="font-semibold tabular-nums text-stone-950">{formatINR(product.price)}</p>
            </div>
            <button onClick={handleAddToCart} className="btn-primary h-11 px-5">
              {needsSize ? 'Select size' : addedToCart ? 'Added' : 'Add to bag'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
