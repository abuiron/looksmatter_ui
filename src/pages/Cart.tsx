import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgePercent, Heart, Loader2, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useRouter } from '../utils/router';
import { useProducts } from '../hooks/useProducts';
import { CartItem } from '../types';
import { img } from '../utils/cdn';
import { formatINR } from '../utils/format';
import { SHIPPING_FEE, calcMrpTotal, calcOrderTotal, calcTax } from '../utils/pricing';
import { sortProducts } from '../utils/products';
import CheckoutSteps from '../components/CheckoutSteps';
import ProductRail from '../components/ProductRail';
import EmptyState from '../components/ui/EmptyState';
import QuantityStepper from '../components/ui/QuantityStepper';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TrustList } from '../components/ui/TrustBadges';

function SummaryRow({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartCount, clearCart, addToCart, cartReady } = useCart();
  const { addToFavorites, isFavorite, getFavoritesCount } = useFavorites();
  const { navigate } = useRouter();
  const toast = useToast();
  const { products } = useProducts();
  const [confirmClear, setConfirmClear] = useState(false);

  const suggestions = useMemo(() => sortProducts(products, 'discount').slice(0, 8), [products]);

  const handleRemove = (item: CartItem) => {
    removeFromCart(item.id);
    toast({
      tone: 'info',
      title: 'Removed from bag',
      description: item.product.name,
      image: img(item.product.image, 160),
      action: { label: 'Undo', onClick: () => addToCart(item.product, item.quantity, item.size || '') },
    });
  };

  const handleSaveForLater = (item: CartItem) => {
    if (!isFavorite(item.product.id)) addToFavorites(item.product);
    removeFromCart(item.id);
    toast({
      title: 'Moved to wishlist',
      description: item.product.name,
      image: img(item.product.image, 160),
      action: { label: 'View', onClick: () => navigate('/favorites') },
    });
  };

  // Signed-in bags load from the server; don't flash "empty" while that happens.
  if (cartItems.length === 0 && !cartReady) {
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading your bag">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container-page pb-24">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Looks like you haven't added anything yet. Explore the collection and find something you love."
        >
          <Link to="/catalog" className="btn-primary">
            Start shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
          {getFavoritesCount() > 0 && (
            <Link to="/favorites" className="btn-outline">
              <Heart className="h-4 w-4" />
              View wishlist
            </Link>
          )}
        </EmptyState>
        {suggestions.length > 0 && <ProductRail eyebrow="Worth a look" title="Top deals right now" products={suggestions} />}
      </div>
    );
  }

  const subtotal = getCartTotal();
  const mrpTotal = calcMrpTotal(cartItems);
  const discount = Math.max(0, mrpTotal - subtotal);
  const itemCount = getCartCount();

  return (
    <div className="bg-cream-50">
      <div className="container-page py-8 sm:py-12">
        <CheckoutSteps current={0} />

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-semibold text-stone-950 sm:text-5xl">
            Your bag <span className="text-stone-400">({itemCount})</span>
          </h1>
          <button
            onClick={() => setConfirmClear(true)}
            className="text-sm font-medium text-stone-500 underline-offset-4 transition-colors hover:text-rose-600 hover:underline"
          >
            Clear bag
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            {discount > 0 && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <BadgePercent className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span>
                  You're saving <span className="font-semibold">{formatINR(discount)}</span> on this order.
                </span>
              </div>
            )}

            <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200/80 bg-white px-4 sm:px-6">
              {cartItems.map((item) => {
                const href = `/product/${item.product.slug || item.product.id}`;
                const mrp = Math.max(item.product.originalPrice || 0, item.product.price);
                return (
                  <li key={item.id} className="flex gap-4 py-6 sm:gap-6">
                    <Link to={href} className="w-24 flex-shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:w-28">
                      <img src={img(item.product.image, 300)} alt={item.product.name} className="aspect-[3/4] w-full object-cover" />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{item.product.category}</p>
                          <Link to={href} className="mt-1 line-clamp-2 font-medium leading-snug text-stone-950 hover:text-gold-700">
                            {item.product.name}
                          </Link>
                          {item.size && (
                            <span className="badge mt-2.5 bg-stone-100 text-stone-700">Size {item.size}</span>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-semibold tabular-nums text-stone-950">{formatINR(item.product.price * item.quantity)}</p>
                          {mrp > item.product.price && (
                            <p className="text-xs tabular-nums text-stone-400 line-through">{formatINR(mrp * item.quantity)}</p>
                          )}
                          {item.quantity > 1 && (
                            <p className="mt-0.5 text-xs text-stone-500">{formatINR(item.product.price)} each</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                        <QuantityStepper size="sm" value={item.quantity} onChange={(v) => updateQuantity(item.id, v)} />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveForLater(item)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
                            aria-label={`Move ${item.product.name} to wishlist`}
                          >
                            <Heart className="h-4 w-4" />
                            <span className="hidden sm:inline">Save for later</span>
                          </button>
                          <button
                            onClick={() => handleRemove(item)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-stone-600 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Remove ${item.product.name} from bag`}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link to="/catalog" className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="link-underline">Continue shopping</span>
            </Link>
          </div>

          <aside className="lg:col-span-4">
            <div className="card p-6 sm:p-7 lg:sticky lg:top-28">
              <h2 className="text-xl font-semibold text-stone-950">Order summary</h2>
              <dl className="mt-6 space-y-3 text-sm text-stone-600">
                <SummaryRow label={`Total MRP (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`} value={formatINR(mrpTotal)} />
                {discount > 0 && (
                  <SummaryRow label="Discount on MRP" value={`− ${formatINR(discount)}`} className="text-emerald-700" />
                )}
                <SummaryRow label="Shipping" value={formatINR(SHIPPING_FEE)} />
                <SummaryRow label="Tax (0.5%)" value={formatINR(calcTax(subtotal), true)} />
                <div className="border-t border-stone-200 pt-4">
                  <SummaryRow label="Estimated total" value={formatINR(calcOrderTotal(subtotal), true)} className="text-base font-semibold text-stone-950" />
                </div>
              </dl>

              <button onClick={() => navigate('/checkout')} className="btn-primary btn-lg group mt-6 w-full">
                Checkout
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-500">
                <Lock className="h-3.5 w-3.5" />
                Secure checkout · Cash on Delivery available
              </p>

              <TrustList className="mt-6 border-t border-stone-200 pt-6" keys={['returns', 'shipping', 'support']} />
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        title="Clear your bag?"
        description="This removes every item from your bag. You can't undo this."
        confirmLabel="Clear bag"
        cancelLabel="Keep items"
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
