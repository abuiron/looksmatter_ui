// Size helpers shared by the admin product form and the storefront.
//
// Apparel (t-shirts, shirts, hoodies, pants, ...) uses letter sizes.
// Footwear (shoes, sandals, sneakers, ...) uses numeric sizes.
// These are only *suggestions* shown as quick-pick chips — the admin can always
// add custom sizes, and each product stores its own explicit `sizes` array.

export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

export const FOOTWEAR_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];

// Category keywords that indicate footwear (numeric sizing).
const FOOTWEAR_KEYWORDS = [
  'shoe', 'footwear', 'sneaker', 'sandal', 'slipper', 'boot',
  'loafer', 'heel', 'flip', 'flop', 'croc', 'clog',
];

/** True when the category looks like footwear, so numeric sizes should be suggested. */
export function isFootwearCategory(category?: string): boolean {
  const c = (category || '').toLowerCase();
  return FOOTWEAR_KEYWORDS.some((kw) => c.includes(kw));
}

/** Suggested quick-pick sizes for a category (numeric for footwear, letters otherwise). */
export function getSuggestedSizes(category?: string): string[] {
  return isFootwearCategory(category) ? FOOTWEAR_SIZES : APPAREL_SIZES;
}

// Letter sizes in wearing order, including the larger sizes some products use.
const LETTER_ORDER = [...APPAREL_SIZES, '5XL', '6XL'];

/** Kids sizes like "6M", "6-9M", "0-1Y" or "10Y" as [start, end] in months; null otherwise. */
function kidsAgeRange(size: string): [number, number] | null {
  const match = /^(\d+)\s*(?:-\s*(\d+)\s*)?([MY])$/i.exec(size.trim());
  if (!match) return null;
  const unit = match[3].toUpperCase() === 'Y' ? 12 : 1;
  const start = Number(match[1]) * unit;
  return [start, match[2] ? Number(match[2]) * unit : start];
}

/**
 * Order sizes naturally: numeric (footwear, waist) ascending, then XS–6XL,
 * then kids ages youngest first, then anything else (e.g. "Onesize").
 */
export function sortSizes(sizes: string[]): string[] {
  const rank = (size: string): [number, number, number] => {
    const n = Number(size);
    if (size.trim() !== '' && !Number.isNaN(n)) return [0, n, 0];
    const letter = LETTER_ORDER.indexOf(size.toUpperCase());
    if (letter !== -1) return [1, letter, 0];
    const age = kidsAgeRange(size);
    if (age) return [2, age[0], age[1]];
    return [3, 0, 0];
  };
  return [...sizes].sort((a, b) => {
    const [groupA, primaryA, secondaryA] = rank(a);
    const [groupB, primaryB, secondaryB] = rank(b);
    return (
      groupA - groupB ||
      primaryA - primaryB ||
      secondaryA - secondaryB ||
      a.localeCompare(b, undefined, { numeric: true })
    );
  });
}
