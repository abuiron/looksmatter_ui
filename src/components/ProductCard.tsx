import { useMemo, useState } from 'react';
import { Heart, Plus, ShoppingBag, X } from 'lucide-react';
import { Product } from '../types';
import { Link, useRouter } from '../utils/router';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { sortSizes } from '../utils/sizes';
import { img, imgSet } from '../utils/cdn';
import Price from './ui/Price';

interface ProductCardProps {
  product: Product;
  // Load the image eagerly (for cards visible on first paint).
  priority?: boolean;
}

const CARD_SIZES = '(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw';

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const toast = useToast();
  const [pickingSize, setPickingSize] = useState(false);

  const productId = product._id || product.id;
  const favorite = isFavorite(productId);
  const href = `/product/${product.slug || productId}`;
  const sizes = useMemo(() => (product.sizes && product.sizes.length > 0 ? sortSizes(product.sizes) : []), [product.sizes]);
  const hoverImage = (product.images || []).find((url) => url && url !== product.image);
  const soldOut = product.inStock === false;
  const lowStock = !soldOut && typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5;

  const handleFavorite = () => {
    if (favorite) {
      removeFromFavorites(productId);
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

  const add = (size: string) => {
    addToCart(product, 1, size);
    setPickingSize(false);
    toast({
      title: 'Added to bag',
      description: size && size.toLowerCase() !== 'onesize' ? `${product.name} · Size ${size}` : product.name,
      image: img(product.image, 160),
      action: { label: 'View bag', onClick: () => navigate('/cart') },
    });
  };

  // Products with several sizes ask for one first; one-size products go straight in.
  const handleQuickAdd = () => {
    if (sizes.length > 1) setPickingSize(true);
    else add(sizes[0] || '');
  };

  return (
    <article className="group relative" onMouseLeave={() => setPickingSize(false)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream-200">
        <Link to={href} className="block h-full w-full" aria-label={product.name}>
          <img
            src={img(product.image, 600)}
            srcSet={imgSet(product.image, [360, 600, 900])}
            sizes={CARD_SIZES}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03] ${soldOut ? 'opacity-60 grayscale' : ''}`}
          />
          {hoverImage && !soldOut && (
            <img
              src={img(hoverImage, 600)}
              srcSet={imgSet(hoverImage, [360, 600, 900])}
              sizes={CARD_SIZES}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:block"
            />
          )}
        </Link>

        {(soldOut || lowStock) && (
          <div className="pointer-events-none absolute left-3 top-3">
            {soldOut ? (
              <span className="badge bg-stone-950 text-white">Sold out</span>
            ) : (
              <span className="badge bg-white/95 text-rose-700 shadow-sm">Only {product.stock} left</span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-stone-900 shadow-sm backdrop-blur transition hover:scale-110 hover:bg-white"
        >
          <Heart className={`h-[18px] w-[18px] transition ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {!soldOut &&
          (pickingSize ? (
            <div className="absolute inset-x-2 bottom-2 max-h-[85%] animate-slide-down overflow-y-auto rounded-xl bg-white/95 p-3 shadow-lift backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900">Select size</span>
                <button
                  type="button"
                  onClick={() => setPickingSize(false)}
                  className="grid h-6 w-6 place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Close size picker"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => add(size)}
                    className="h-8 min-w-[2.5rem] rounded-lg border border-stone-200 bg-white px-2 text-xs font-semibold text-stone-900 transition hover:border-stone-950 hover:bg-stone-950 hover:text-white"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop: full-width bar revealed on hover */}
              <button
                type="button"
                onClick={handleQuickAdd}
                className="absolute inset-x-3 bottom-3 hidden h-11 translate-y-3 items-center justify-center gap-2 rounded-full bg-white/95 text-[13px] font-semibold text-stone-950 opacity-0 shadow-lift backdrop-blur transition-all duration-300 hover:bg-stone-950 hover:text-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 lg:flex"
              >
                <Plus className="h-4 w-4" />
                {sizes.length > 1 ? 'Quick add' : 'Add to bag'}
              </button>
              {/* Touch: compact always-visible button */}
              <button
                type="button"
                onClick={handleQuickAdd}
                className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-stone-950 shadow-soft backdrop-blur active:scale-95 lg:hidden"
                aria-label={`Add ${product.name} to bag`}
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            </>
          ))}
      </div>

      <div className="mt-3 space-y-1 px-0.5">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{product.category}</p>
        <h3 className="text-sm font-medium leading-snug text-stone-900">
          <Link to={href} className="line-clamp-2 transition-colors hover:text-gold-700">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} originalPrice={product.originalPrice} size="sm" />
      </div>
    </article>
  );
}
