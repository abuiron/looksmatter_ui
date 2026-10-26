import { CartItem } from '../types';

// Flat charges shown in the bag and at checkout (see the Shipping Policy).
// The server computes the final order total; these mirror its breakdown.
export const SHIPPING_FEE = 45;
export const TAX_RATE = 0.005; // 0.5%

export const calcTax = (subtotal: number) => subtotal * TAX_RATE;

export const calcOrderTotal = (subtotal: number) => subtotal + calcTax(subtotal) + SHIPPING_FEE;

/** Sum of MRPs for the bag (falls back to the selling price when a product has no MRP). */
export const calcMrpTotal = (items: CartItem[]) =>
  items.reduce(
    (total, item) => total + Math.max(item.product.originalPrice || 0, item.product.price) * item.quantity,
    0
  );
