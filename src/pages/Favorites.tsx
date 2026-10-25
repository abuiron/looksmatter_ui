import { ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useRouter } from '../utils/router';
import { img } from '../utils/cdn';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import PageHero from '../components/ui/PageHero';

export default function Favorites() {
  const { favorites, getFavoritesCount } = useFavorites();
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const toast = useToast();

  const notifyAdded = (product: Product, size?: string) =>
    toast({
      title: 'Added to bag',
      description: size && size.toLowerCase() !== 'onesize' ? `${product.name} · Size ${size}` : product.name,
      image: img(product.image, 160),
      action: { label: 'View bag', onClick: () => navigate('/cart') },
    });

  const handleAddToCart = (product: any) => {
    const sizes = product.sizes || [];
    // One-size products (e.g. sizes: ["Onesize"]) go straight to the cart with that size.
    if (sizes.length === 1) {
      addToCart(product, 1, sizes[0]);
      notifyAdded(product, sizes[0]);
      return;
    }
    // Products with multiple size options must be chosen on the product page.
    if (sizes.length > 1) {
      navigate(`/product/${product.slug || product.id}`);
      return;
    }
    addToCart(product);
    notifyAdded(product);
  };

  const count = getFavoritesCount();

  if (count === 0) {
    return (
      <div className="container-page">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here for later."
        >
          <Link to="/catalog" className="btn-primary">
            Discover products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        eyebrow="Saved for later"
        title={
          <>
            Wishlist <span className="text-stone-400">({count})</span>
          </>
        }
        description="Everything you've saved, in one place. Add pieces to your bag when you're ready."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
      />

      <div className="container-page py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
          {favorites.map((product) => {
            const multiSize = (product.sizes || []).length > 1;
            return (
              <div key={product.id} className="flex flex-col">
                <ProductCard product={product} />
                <button onClick={() => handleAddToCart(product)} className="btn-outline btn-sm mt-4 w-full">
                  <ShoppingBag className="h-4 w-4" />
                  {multiSize ? 'Select size' : 'Add to bag'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <Link to="/catalog" className="group inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
            <span className="link-underline">Continue shopping</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
