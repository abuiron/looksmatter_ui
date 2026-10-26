import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  CircleDashed,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  Settings2,
  Truck,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  // Classes for a soft pill: background + text colour.
  badge: string;
  // Solid colour for dots and progress fills.
  dot: string;
}

// Fulfilment steps in the order an order moves through them.
export const ORDER_STEPS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'pending', label: 'Order placed', icon: Clock },
  { key: 'order confirmed', label: 'Confirmed', icon: BadgeCheck },
  { key: 'processing', label: 'Processing', icon: Settings2 },
  { key: 'ready to shipment', label: 'Ready to ship', icon: Package },
  { key: 'in transit', label: 'In transit', icon: Truck },
  { key: 'out for delivery', label: 'Out for delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
];

const ORDER_STATUS: Record<string, StatusMeta> = {
  pending: { label: 'Order placed', icon: Clock, badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  'order confirmed': { label: 'Confirmed', icon: BadgeCheck, badge: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  processing: { label: 'Processing', icon: Settings2, badge: 'bg-indigo-50 text-indigo-800 ring-indigo-200', dot: 'bg-indigo-500' },
  'ready to shipment': { label: 'Ready to ship', icon: Package, badge: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-500' },
  'in transit': { label: 'In transit', icon: Truck, badge: 'bg-orange-50 text-orange-800 ring-orange-200', dot: 'bg-orange-500' },
  'out for delivery': { label: 'Out for delivery', icon: MapPin, badge: 'bg-teal-50 text-teal-800 ring-teal-200', dot: 'bg-teal-500' },
  delivered: { label: 'Delivered', icon: PackageCheck, badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, badge: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
  refunded: { label: 'Refunded', icon: RotateCcw, badge: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200', dot: 'bg-fuchsia-500' },
};

const PAYMENT_STATUS: Record<string, StatusMeta> = {
  pending: { label: 'Pending', icon: Clock, badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  paid: { label: 'Paid', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  failed: { label: 'Failed', icon: XCircle, badge: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
  refunded: { label: 'Refunded', icon: RotateCcw, badge: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200', dot: 'bg-fuchsia-500' },
};

const REPORT_STATUS: Record<string, StatusMeta> = {
  pending: { label: 'Pending', icon: Clock, badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  in_progress: { label: 'In progress', icon: CircleDashed, badge: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  resolved: { label: 'Resolved', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', icon: XCircle, badge: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const fallback = (status: string): StatusMeta => ({
  label: capitalize(status.replace(/_/g, ' ')),
  icon: Clock,
  badge: 'bg-stone-100 text-stone-700 ring-stone-200',
  dot: 'bg-stone-400',
});

export function getOrderStatusMeta(status: string | undefined): StatusMeta {
  const key = (status || 'pending').toLowerCase();
  return ORDER_STATUS[key] || fallback(key);
}

export function getPaymentStatusMeta(status: string | undefined): StatusMeta {
  const key = (status || 'pending').toLowerCase();
  return PAYMENT_STATUS[key] || fallback(key);
}

export function getReportStatusMeta(status: string | undefined): StatusMeta {
  const key = (status || 'pending').toLowerCase();
  return REPORT_STATUS[key] || fallback(key);
}

/** Index of the status within ORDER_STEPS, or -1 for cancelled/refunded/unknown. */
export function getOrderStepIndex(status: string | undefined): number {
  const key = (status || 'pending').toLowerCase();
  return ORDER_STEPS.findIndex((step) => step.key === key);
}

export function paymentMethodLabel(method: string | undefined): string {
  if (method === 'cod') return 'Cash on Delivery';
  if (method === 'PaymentGateway') return 'PaymentGateway (UPI)';
  if (method === 'online') return 'Online payment';
  return method ? method.toUpperCase() : '—';
}
