// Display helpers shared across the storefront.

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "₹2,999" — pass `exact` for amounts that carry paise (taxes, order totals). */
export function formatINR(value: number | undefined | null, exact = false): string {
  return (exact ? inrExact : inr).format(Number(value) || 0);
}

/** Whole-number discount between the selling price and the MRP, or 0 when there is none. */
export function discountPercent(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}

export function formatDate(
  value: string | number | Date | undefined,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', options);
}

export function formatDateTime(value: string | number | Date | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Short, human order reference: the order number when present, else the last 8 id chars. */
export function orderRef(order: { orderNumber?: string; _id?: string; id?: string } | null | undefined): string {
  if (!order) return '';
  const id = order._id || order.id || '';
  return order.orderNumber || id.slice(-8).toUpperCase();
}

/** Initials for avatars, e.g. "Ravi Kumar" → "RK". */
export function initials(name: string | undefined): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
