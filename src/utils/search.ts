import { Product } from '../types';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Split a free-text query into normalized search tokens. */
export function tokenize(query: string): string[] {
  return normalize(query).split(' ').filter(Boolean);
}

/**
 * True when every token appears in the product's name, category, SKU or description.
 * Also matches with spaces removed so "tshirt" finds "T-Shirts".
 */
export function matchesTokens(product: Product, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = normalize(
    `${product.name} ${product.category} ${product.sku || ''} ${product.description || ''}`
  );
  const compact = haystack.replace(/ /g, '');
  return tokens.every((token) => haystack.includes(token) || compact.includes(token));
}

/** Rank matches so name hits come before description-only hits. */
export function searchProducts(products: Product[], query: string): Product[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const score = (p: Product) => {
    const name = normalize(`${p.name} ${p.category}`);
    return tokens.reduce((s, t) => s + (name.includes(t) ? 2 : 0), 0);
  };
  return products
    .filter((p) => matchesTokens(p, tokens))
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s)
    .map(({ p }) => p);
}
