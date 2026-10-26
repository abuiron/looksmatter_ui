import { Product } from '../types';
import { discountPercent } from './format';

export type SortKey = 'featured' | 'newest' | 'discount' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest first' },
  { key: 'discount', label: 'Biggest discount' },
  { key: 'price-low', label: 'Price: Low to high' },
  { key: 'price-high', label: 'Price: High to low' },
  { key: 'name-az', label: 'Name: A to Z' },
  { key: 'name-za', label: 'Name: Z to A' },
];

export const isSortKey = (value: string | null): value is SortKey =>
  !!value && SORT_OPTIONS.some((o) => o.key === value);

const time = (p: Product) => (p.createdAt ? new Date(p.createdAt).getTime() || 0 : 0);

/** Returns a sorted copy; "featured" keeps the catalogue order from the API. */
export function sortProducts(list: Product[], key: SortKey): Product[] {
  const sorted = [...list];
  switch (key) {
    case 'newest':
      return sorted.sort((a, b) => time(b) - time(a));
    case 'discount':
      return sorted.sort(
        (a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice)
      );
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name-az':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-za':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sorted;
  }
}

// Price bands for filtering; `max` is exclusive.
export const PRICE_BUCKETS = [
  { key: '0-999', label: 'Under ₹1,000', min: 0, max: 1000 },
  { key: '1000-1999', label: '₹1,000 – ₹1,999', min: 1000, max: 2000 },
  { key: '2000-2999', label: '₹2,000 – ₹2,999', min: 2000, max: 3000 },
  { key: '3000-4999', label: '₹3,000 – ₹4,999', min: 3000, max: 5000 },
  { key: '5000+', label: '₹5,000 & above', min: 5000, max: Infinity },
];

export const inPriceBucket = (p: Product, key: string) => {
  const bucket = PRICE_BUCKETS.find((b) => b.key === key);
  return !bucket || (p.price >= bucket.min && p.price < bucket.max);
};

export const DISCOUNT_STEPS = [30, 40, 50, 60];

/** Multipacks and combo sets, identified by the catalogue's naming ("Pack of 3 …", "3-Piece Combo: …"). */
export const isBundle = (p: Product) => /\bcombo\b|\bpack of\b/i.test(p.name);
