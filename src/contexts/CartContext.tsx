import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, CartItem } from '../types';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  resetCart: () => void;
  // Reload the bag from the server (signed-in users) and return it.
  refreshCart: () => Promise<CartItem[]>;
  // False while a signed-in user's bag is still being loaded from the server.
  cartReady: boolean;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// A product can be in the cart in multiple sizes, so each cart line is identified
// by product id + size rather than product id alone.
const makeLineId = (productId: string, size?: string) => `${productId}::${size || ''}`;

interface ServerCartLine {
  product: Product | null;
  qty?: number;
  quantity?: number;
  size?: string;
}

// Server bag lines -> cart items. Lines whose product no longer exists (older
// servers return them with `product: null`) are skipped instead of crashing.
const fromServerCart = (lines: ServerCartLine[] | null | undefined): CartItem[] =>
  (lines || [])
    .filter((item): item is ServerCartLine & { product: Product } => Boolean(item?.product))
    .map((item) => {
      const productId = item.product._id || item.product.id;
      const size = item.size || '';
      return {
        id: makeLineId(productId, size),
        product: { ...item.product, id: productId },
        quantity: item.qty || item.quantity || 1,
        size,
      };
    });

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  // Signed-in bags live on the server, so they're only known after the first sync.
  const [serverSynced, setServerSynced] = useState(false);
  const cartReady = !authLoading && (!isAuthenticated || serverSynced);

  // Server cart calls run one at a time, in the order they were made, so quick
  // changes (e.g. + + −) can't land out of order and leave the server bag — which
  // is what gets ordered — different from the one on screen.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(task, task);
    queue.current = run.catch(() => undefined);
    return run;
  };

  // Sync cart with backend when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      syncCartWithBackend();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const syncCartWithBackend = () =>
    enqueue(async () => {
      try {
        // Get localStorage cart
        const localCart = localStorage.getItem('cart');
        const localItems = localCart ? JSON.parse(localCart) : [];

        // Sync local items to backend
        if (localItems.length > 0) {
          for (const item of localItems) {
            try {
              await api.addToCart(item.product.id, item.quantity, item.size || '');
            } catch (err) {
              // e.g. a product deleted since it was added — the server rejects it.
              console.error('Failed to sync cart item:', err);
            }
          }
          // Clear localStorage after syncing
          localStorage.removeItem('cart');
        }

        // Load updated cart from backend
        const updatedCart = await api.getCart();
        setCartItems(fromServerCart(updatedCart));
      } catch (error) {
        console.error('Failed to sync cart:', error);
      } finally {
        setServerSynced(true);
      }
    });

  const refreshCart = async (): Promise<CartItem[]> => {
    if (!isAuthenticated) return cartItems;
    try {
      // Queued, so it reflects every change made before it.
      const next = fromServerCart(await enqueue(() => api.getCart()));
      setCartItems(next);
      return next;
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      return cartItems;
    }
  };

  const addToCart = async (product: Product, quantity = 1, size = '') => {
    // Functional update so callers holding an older reference (e.g. an "Undo" toast) still merge correctly.
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && (item.size || '') === size
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && (item.size || '') === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: makeLineId(product.id, size), product, quantity, size }];
    });

    // Sync with backend if authenticated
    if (isAuthenticated) {
      try {
        await enqueue(() => api.addToCart(product.id, quantity, size));
      } catch (error) {
        console.error('Failed to sync cart with backend:', error);
      }
    }
  };

  const removeFromCart = async (lineId: string) => {
    const item = cartItems.find((it) => it.id === lineId);
    setCartItems((prev) => prev.filter((it) => it.id !== lineId));

    // Sync with backend if authenticated
    if (isAuthenticated && item) {
      try {
        await enqueue(() => api.removeFromCart(item.product.id, item.size || ''));
      } catch (error) {
        console.error('Failed to remove from backend cart:', error);
      }
    }
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineId);
      return;
    }

    const item = cartItems.find((it) => it.id === lineId);
    setCartItems((prev) =>
      prev.map((it) => (it.id === lineId ? { ...it, quantity } : it))
    );

    // Sync with backend if authenticated
    if (isAuthenticated && item) {
      try {
        await enqueue(() => api.updateCartItem(item.product.id, quantity, item.size || ''));
      } catch (error) {
        console.error('Failed to update cart quantity:', error);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);

    // Clear backend cart if authenticated
    if (isAuthenticated) {
      try {
        await enqueue(() => api.clearCart());
      } catch (error) {
        console.error('Failed to clear backend cart:', error);
      }
    }
  };

  const resetCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        resetCart,
        refreshCart,
        cartReady,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
