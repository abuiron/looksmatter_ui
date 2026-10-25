import { ReactNode, useState, useEffect } from 'react';
import { Link, useRouter } from '../utils/router';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  CreditCard,
  LifeBuoy,
  MapPin,
  Package,
  Printer,
  QrCode,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import api from '../services/api';
import ReportIssue from '../components/ReportIssue';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { useToast } from '../contexts/ToastContext';
import { img } from '../utils/cdn';
import { formatDate, formatDateTime, formatINR, orderRef } from '../utils/format';
import {
  ORDER_STEPS,
  getOrderStatusMeta,
  getOrderStepIndex,
  getPaymentStatusMeta,
  paymentMethodLabel,
} from '../utils/orderStatus';

interface OrderSuccessProps {
  orderId: string;
}

function StatusPill({ label, meta }: { label?: string; meta: ReturnType<typeof getOrderStatusMeta> }) {
  const Icon = meta.icon;
  return (
    <span className={`badge px-3 py-1.5 text-xs ring-1 ring-inset ${meta.badge}`}>
      <Icon className="h-3.5 w-3.5" />
      {label || meta.label}
    </span>
  );
}

function Card({ title, icon, children, className = '' }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-7 print:border-stone-300 ${className}`}>
      {title && (
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-stone-950">
          {icon}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function OrderTracker({ status }: { status: string }) {
  const current = getOrderStepIndex(status);
  return (
    <ol className="grid gap-6 md:grid-cols-7 md:gap-0">
      {ORDER_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <li key={step.key} className="relative flex items-center gap-4 md:flex-col md:gap-3 md:text-center">
            {i < ORDER_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-5 top-10 h-full w-0.5 md:left-[calc(50%+20px)] md:top-[19px] md:h-0.5 md:w-[calc(100%-40px)] ${
                  done ? 'bg-stone-950' : 'bg-stone-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border-2 transition-colors ${
                done
                  ? 'border-stone-950 bg-stone-950 text-white'
                  : active
                    ? 'border-gold-500 bg-gold-500 text-stone-950 ring-4 ring-gold-100'
                    : 'border-stone-200 bg-white text-stone-300'
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
            </span>
            <span className={`text-sm font-medium md:px-1 md:text-xs ${done || active ? 'text-stone-950' : 'text-stone-400'}`}>
              {step.label}
              {active && <span className="block text-xs font-normal text-gold-700">Current status</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderSuccess({ orderId }: OrderSuccessProps) {
  const { navigate } = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'order_issue' | 'payment_issue'>('order_issue');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    fetchOrder();

    // Auto-refresh only for online payments that are still pending
    // Stop for COD orders and completed payment statuses to prevent unnecessary API calls
    const refreshInterval = setInterval(() => {
      if (order?.paymentMethod !== 'cod' &&
          order?.paymentStatus !== 'paid' &&
          order?.paymentStatus !== 'refunded' &&
          order?.paymentStatus !== 'failed') {
        fetchOrder();
      }
    }, 8000);

    return () => clearInterval(refreshInterval);
  }, [orderId, order?.paymentStatus, order?.paymentMethod]);

  const fetchOrder = async () => {
    try {
      const response = await api.getOrder(orderId);
      setOrder(response);

      // Generate QR code if order has pending payment and qrCodeUrl
      if (response.paymentStatus === 'pending' && response.qrCodeUrl) {
        try {
          const qrDataUrl = await QRCode.toDataURL(response.qrCodeUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          setQrCodeDataUrl(qrDataUrl);
        } catch (qrError) {
          console.error('Failed to generate QR code:', qrError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    try {
      setCancelling(true);
      await api.cancelOrder(orderId);
      // Refresh order to show cancelled status
      await fetchOrder();
      setConfirmCancel(false);
      toast({ title: 'Order cancelled', description: 'Your order has been cancelled successfully.' });
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      setConfirmCancel(false);
      toast({
        tone: 'error',
        title: 'Could not cancel order',
        description: error.response?.data?.message || 'Failed to cancel order. Please try again.',
      });
    } finally {
      setCancelling(false);
    }
  };

  const copyOrderNumber = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied', description: `Order number ${value} copied to clipboard.` });
    } catch {
      // Clipboard blocked — the number is visible on screen anyway.
    }
  };

  if (loading) {
    return (
      <div className="container-page max-w-5xl py-12" aria-hidden="true">
        <div className="card flex flex-col items-center p-10">
          <div className="skeleton h-20 w-20 rounded-full" />
          <div className="skeleton mt-6 h-8 w-72" />
          <div className="skeleton mt-3 h-4 w-96 max-w-full" />
        </div>
        <div className="skeleton mt-6 h-40 rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="skeleton h-72 rounded-2xl lg:col-span-3" />
          <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState icon={Package} title="Order not found" description="We couldn't find this order. It may belong to another account.">
        <button onClick={() => navigate('/profile?tab=orders')} className="btn-primary">
          Go to my orders
        </button>
      </EmptyState>
    );
  }

  const ref = orderRef(order) || 'N/A';
  const status = (order.status || 'pending').toLowerCase();
  const paymentStatus = order.paymentStatus || 'pending';
  const cancelled = status === 'cancelled';
  const refundedOrder = status === 'refunded';
  const onTrack = getOrderStepIndex(status) !== -1;

  const hero = cancelled
    ? {
        tone: 'bg-rose-100 text-rose-600',
        icon: <XCircle className="h-10 w-10" />,
        title: 'Order cancelled',
        text: 'This order has been cancelled.',
      }
    : paymentStatus === 'paid'
      ? {
          tone: 'bg-emerald-100 text-emerald-600',
          icon: null,
          title: 'Order Placed Successfully!',
          text: "Thank you for your order. We'll send you a confirmation email shortly.",
        }
      : paymentStatus === 'refunded'
        ? {
            tone: 'bg-fuchsia-100 text-fuchsia-600',
            icon: <RotateCcw className="h-10 w-10" />,
            title: 'Payment Refunded',
            text: 'Your payment has been refunded. The amount will be credited to your account.',
          }
        : paymentStatus === 'failed'
          ? {
              tone: 'bg-rose-100 text-rose-600',
              icon: <AlertCircle className="h-10 w-10" />,
              title: 'Payment Failed',
              text: 'Your payment could not be processed. Please try again.',
            }
          : {
              tone: 'bg-gold-100 text-gold-700',
              icon: null,
              title: order.paymentMethod === 'cod' ? 'Thank you for your order!' : 'Order Received',
              text: order.paymentMethod === 'cod' ? 'Your order has been placed. Pay on delivery.' : 'Your order is being processed.',
            };

  const openReport = (type: 'order_issue' | 'payment_issue') => {
    setReportType(type);
    setShowReportModal(true);
  };

  return (
    <div className="bg-cream-50 print:bg-white">
      <div className="container-page max-w-5xl py-8 sm:py-12">
        {/* Print-only invoice header */}
        <div className="mb-8 hidden border-b border-stone-300 pb-6 print:block">
          <p className="font-display text-2xl font-bold tracking-wide">LOOKSMATTER</p>
          <p className="text-sm">LOOKSMATTER CONSULTING PVT LTD · info@looksmatter.in · +91 6380280076</p>
          <p className="text-sm">Virutal Office only: LOOKSMATTER </p>
        </div>

        <Breadcrumbs
          className="print:hidden"
          items={[
            { label: 'Home', to: '/' },
            { label: 'My orders', to: '/profile?tab=orders' },
            { label: `Order #${ref}` },
          ]}
        />

        {/* Hero */}
        <section className="card relative mt-6 overflow-hidden px-6 py-10 text-center sm:px-10 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-gold-100/70 blur-3xl print:hidden" />
          <div className={`relative mx-auto grid h-20 w-20 animate-pop-in place-items-center rounded-full ${hero.tone}`}>
            {hero.icon || (
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="48" className="animate-draw-check" />
              </svg>
            )}
          </div>
          <h1 className="relative mt-6 text-balance text-3xl font-semibold text-stone-950 sm:text-4xl">{hero.title}</h1>
          <p className="relative mx-auto mt-3 max-w-lg text-[15px] text-stone-600">{hero.text}</p>

          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => copyOrderNumber(ref)}
              className="group inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-950 transition hover:border-stone-950"
              title="Copy order number"
            >
              Order #{ref}
              <Copy className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-950 print:hidden" />
            </button>
            <span className="text-sm text-stone-500">Placed {formatDateTime(order.createdAt)}</span>
          </div>
        </section>

        {/* Progress */}
        <Card className="mt-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-stone-950">Order status</h2>
              <StatusPill meta={getOrderStatusMeta(status)} />
            </div>
            {order.estimatedDeliveryDate && !cancelled && (
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <CalendarDays className="h-4 w-4 text-gold-700" />
                Estimated delivery{' '}
                <span className="font-semibold text-stone-950">
                  {formatDate(order.estimatedDeliveryDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </p>
            )}
          </div>
          {onTrack ? (
            <OrderTracker status={status} />
          ) : (
            <div className={`flex items-start gap-3 rounded-2xl p-4 text-sm ${cancelled ? 'bg-rose-50 text-rose-900' : 'bg-fuchsia-50 text-fuchsia-900'}`}>
              {cancelled ? <XCircle className="h-5 w-5 flex-shrink-0" /> : <RotateCcw className="h-5 w-5 flex-shrink-0" />}
              <p>
                {cancelled
                  ? 'This order was cancelled and will not be shipped.'
                  : refundedOrder
                    ? 'This order has been refunded.'
                    : `Status: ${getOrderStatusMeta(status).label}`}
              </p>
            </div>
          )}
        </Card>

        {/* Pending Payment Alert */}
        {order.paymentMethod !== 'cod' && order.paymentStatus === 'pending' && (
          <Card className="mt-6 border-amber-200 bg-amber-50/40" title="Payment pending" icon={<AlertCircle className="h-5 w-5 text-amber-600" />}>
            <p className="text-sm text-stone-700">
              {qrCodeDataUrl
                ? "If you've already paid, please wait for confirmation. Otherwise, scan the QR code below to complete your payment."
                : 'Your payment is being processed. This page will automatically update once payment is confirmed.'}
            </p>

            {qrCodeDataUrl && (
              <div className="mt-6 grid items-center gap-6 rounded-2xl bg-white p-6 sm:grid-cols-[auto_1fr]">
                <img src={qrCodeDataUrl} alt="Payment QR Code" className="mx-auto h-52 w-52 rounded-xl border border-stone-200" />
                <div>
                  <p className="flex items-center gap-2 font-semibold text-stone-950">
                    <QrCode className="h-4 w-4" />
                    Scan to pay {formatINR(order.total, true)}
                  </p>
                  <ol className="mt-3 space-y-1.5 text-sm text-stone-600">
                    <li>1. Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                    <li>2. Scan the QR code</li>
                    <li>3. Complete the payment</li>
                    <li>4. This page will update automatically</li>
                  </ol>
                </div>
              </div>
            )}

            {order.paymentRefId && (
              <div className="mt-5 text-sm">
                <p className="text-stone-500">Transaction reference ID</p>
                <p className="font-mono font-semibold text-stone-950">{order.paymentRefId}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 border-t border-amber-200 pt-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <p className="text-xs text-stone-600">You can cancel this order while payment is pending.</p>
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={cancelling}
                className="btn btn-sm border border-rose-200 bg-white text-rose-700 hover:border-rose-400 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4" />
                {cancelling ? 'Cancelling...' : 'Cancel order'}
              </button>
            </div>
          </Card>
        )}

        {/* Payment Transaction Details (for online payments) */}
        {order.paymentMethod !== 'cod' && (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') && (
          <Card
            className={`mt-6 ${order.paymentStatus === 'refunded' ? 'border-fuchsia-200 bg-fuchsia-50/40' : 'border-emerald-200 bg-emerald-50/40'}`}
            title={order.paymentStatus === 'refunded' ? 'Payment refunded' : 'Payment transaction details'}
            icon={
              order.paymentStatus === 'refunded' ? (
                <RotateCcw className="h-5 w-5 text-fuchsia-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-emerald-600" />
              )
            }
          >
            {order.paymentStatus === 'refunded' && (
              <p className="mb-5 text-sm text-fuchsia-900">
                Your payment has been refunded. The amount will be credited back to your account within 5-7 business days.
              </p>
            )}
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {order.paymentRefId && (
                <div>
                  <dt className="text-stone-500">Transaction reference ID</dt>
                  <dd className="font-mono font-semibold text-stone-950">{order.paymentRefId}</dd>
                </div>
              )}
              {order.PaymentGatewayOrderId && (
                <div>
                  <dt className="text-stone-500">PaymentGateway order ID</dt>
                  <dd className="font-mono font-semibold text-stone-950">{order.PaymentGatewayOrderId}</dd>
                </div>
              )}
              {order.payerVpa && (
                <div>
                  <dt className="text-stone-500">Payer UPI ID</dt>
                  <dd className="font-mono font-semibold text-stone-950">{order.payerVpa}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        {/* Payment Failed Alert */}
        {order.paymentMethod !== 'cod' && order.paymentStatus === 'failed' && (
          <Card className="mt-6 border-rose-200 bg-rose-50/40" title="Payment failed" icon={<AlertCircle className="h-5 w-5 text-rose-600" />}>
            <p className="text-sm text-rose-900">
              Your payment could not be processed. Please try again or contact support if the amount was debited from your account.
            </p>
            {order.paymentRefId && (
              <div className="mt-4 text-sm">
                <p className="text-stone-500">Transaction reference ID</p>
                <p className="font-mono font-semibold text-stone-950">{order.paymentRefId}</p>
              </div>
            )}
          </Card>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Items + totals */}
          <Card className="lg:col-span-3" title={`Items (${order.items?.length || 0})`}>
            <ul className="divide-y divide-stone-200">
              {order.items?.map((item: any, index: number) => (
                <li key={index} className="flex items-center gap-4 py-4 first:pt-0">
                  {item.image ? (
                    <img src={img(item.image, 160)} alt={item.name || 'Product'} className="h-20 w-[3.75rem] flex-shrink-0 rounded-lg bg-cream-200 object-cover" />
                  ) : (
                    <div className="grid h-20 w-[3.75rem] flex-shrink-0 place-items-center rounded-lg bg-cream-200 text-stone-400">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium leading-snug text-stone-950">{item.name || 'Product'}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {item.size && <>Size {item.size} · </>}Qty {item.qty} × {formatINR(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-stone-950">{formatINR(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2.5 border-t border-stone-200 pt-5 text-sm text-stone-600">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatINR(order.subtotal || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax (0.5%)</dt>
                <dd className="tabular-nums">{formatINR(order.tax || 0, true)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="tabular-nums">{formatINR(order.shippingCost || 0)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-stone-200 pt-4 text-stone-950">
                <dt className="text-base font-semibold">Total</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{formatINR(order.total, true)}</dd>
              </div>
            </dl>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card title="Order details">
              <dl className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Payment method</dt>
                  <dd className="font-semibold text-stone-950">{paymentMethodLabel(order.paymentMethod)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Payment status</dt>
                  <dd>
                    <StatusPill meta={getPaymentStatusMeta(paymentStatus)} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-stone-500">Placed on</dt>
                  <dd className="text-right font-semibold text-stone-950">{formatDateTime(order.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Order ID</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-stone-700">{order._id || order.id}</dd>
                </div>
              </dl>
            </Card>

            <Card title="Shipping address" icon={<MapPin className="h-5 w-5 text-gold-700" />}>
              <address className="text-sm not-italic leading-relaxed text-stone-700">
                <p className="font-semibold text-stone-950">
                  {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                </p>
                <p>
                  {order.shippingAddress?.address1}, {order.shippingAddress?.address2}
                </p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pin}
                </p>
                <p className="mt-2">Phone: {order.shippingAddress?.phone}</p>
              </address>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="btn-outline">
            <Printer className="h-4 w-4" />
            Download invoice
          </button>
          <button onClick={() => navigate('/profile?tab=orders')} className="btn-outline">
            <Package className="h-4 w-4" />
            View all orders
          </button>
          <Link to="/catalog" className="btn-primary group">
            Continue shopping
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Report Issue Section */}
        <section className="mt-8 rounded-3xl bg-stone-950 p-6 text-white sm:p-8 print:hidden">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-white/10 text-gold-400">
                <LifeBuoy className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Having an issue with this order?</h3>
                <p className="mt-1 text-sm text-stone-400">
                  Report any problems with your order or payment, and our team will help you resolve them.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => openReport('order_issue')} className="btn-light btn-sm">
                <Package className="h-4 w-4" />
                Report order issue
              </button>
              <button onClick={() => openReport('payment_issue')} className="btn btn-sm border border-white/20 text-white hover:bg-white/10">
                <CreditCard className="h-4 w-4" />
                Report payment issue
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        tone="danger"
        title="Cancel this order?"
        description="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        loading={cancelling}
        onConfirm={cancelOrder}
        onCancel={() => setConfirmCancel(false)}
      />

      {/* Report Issue Modal */}
      {showReportModal && (
        <ReportIssue
          orderId={orderId}
          orderNumber={order?.orderNumber}
          initialType={reportType}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            toast({ title: 'Report submitted', description: 'You can track it in your account under My reports.' });
          }}
        />
      )}
    </div>
  );
}
