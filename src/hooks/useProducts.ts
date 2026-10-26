import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { Product } from '../types';

// One shared copy of the catalogue for every page. The full list is small
// (~26 KB compressed), so loading it once makes catalog, search and product
// pages instant after the first visit. A stale copy is shown immediately and
// refreshed in the background.
const STALE_AFTER_MS = 60_000;

let cache: Product[] | null = null;
let fetchedAt = 0;
let inflight: Promise<Product[]> | null = null;
const subscribers = new Set<(products: Product[]) => void>();

const normalize = (product: Product): Product => ({ ...product, id: product._id || product.id });

export function loadProducts(force = false): Promise<Product[]> {
  if (!force && cache && Date.now() - fetchedAt < STALE_AFTER_MS) {
    return Promise.resolve(cache);
  }
  if (!inflight) {
    inflight = api
      .getProducts({ limit: 0 })
      .then((response) => {
        const items: Product[] = (response.items || []).map(normalize);
        cache = items;
        fetchedAt = Date.now();
        subscribers.forEach((notify) => notify(items));
        return items;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [error, setError] = useState(false);

  const fetchProducts = useCallback((force: boolean) => {
    let active = true;
    loadProducts(force)
      .then((items) => {
        if (active) {
          setProducts(items);
          setError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        if (active && cache === null) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    subscribers.add(setProducts);
    const cancel = fetchProducts(false);
    return () => {
      subscribers.delete(setProducts);
      cancel();
    };
  }, [fetchProducts]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchProducts(true);
  }, [fetchProducts]);

  return { products, loading, error, retry };
}

export interface CategorySummary {
  name: string;
  count: number;
  image: string;
}

/** Categories present in the catalogue, largest first, each with a cover image. */
export function summarizeCategories(products: Product[]): CategorySummary[] {
  const map = new Map<string, CategorySummary>();
  products.forEach((p) => {
    if (!p.category) return;
    const entry = map.get(p.category);
    if (entry) {
      entry.count += 1;
      if (!entry.image && p.image) entry.image = p.image;
    } else {
      map.set(p.category, { name: p.category, count: 1, image: p.image || '' });
    }
  });
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
