import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useRouter, Link } from '../utils/router';
import { AlertCircle, Banknote, ChevronDown, Loader2, Lock, ShoppingBag } from 'lucide-react';
import api, { ApiError } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PaymentGatewayModal from '../components/PaymentGatewayModal';
import CheckoutSteps from '../components/CheckoutSteps';
import { img } from '../utils/cdn';
import { formatINR, initials } from '../utils/format';
import { SHIPPING_FEE, calcMrpTotal, calcTax } from '../utils/pricing';

interface ShippingAddress {
  name: string;
  phone: string;
  doorNo: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface BillingAddress extends ShippingAddress {}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

type FieldKey =
  | 'name' | 'phone' | 'doorNo' | 'street' | 'city' | 'state' | 'pincode'
  | 'billingName' | 'billingPhone' | 'billingPincode';

// DOM ids in page order, used to focus the first invalid field.
const FIELD_IDS: Record<FieldKey, string> = {
  name: 'ship-name',
  phone: 'ship-phone',
  doorNo: 'ship-door',
  street: 'ship-street',
  city: 'ship-city',
  state: 'ship-state',
  pincode: 'ship-pincode',
  billingName: 'bill-name',
  billingPhone: 'bill-phone',
  billingPincode: 'bill-pincode',
};

/** Saved profile phones are 10 digits; checkout stores "+91" + 10 digits. */
const toPlus91 = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return '+91' + (digits.length > 10 ? digits.slice(-10) : digits);
};

/** Digits typed or pasted into the local-number box, without a country code or trunk 0. */
const localDigits = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(2);
  return digits.replace(/^0+/, '');
};

/* ---------- Presentational helpers ---------- */

function Section({ step, title, description, aside, children }: { step: number; title: string; description?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-stone-950 text-sm font-bold text-gold-400">{step}</span>
          <div>
            <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, required, error, hint, className = '', children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

function PhoneInput({ id, value, onChange, invalid, autoComplete }: { id: string; value: string; onChange: (value: string) => void; invalid?: boolean; autoComplete: string }) {
  const display = value.startsWith('+91') ? value.slice(3) : value.replace(/\D/g, '');
  return (
    <div
      className={`flex h-12 items-center overflow-hidden rounded-xl border bg-white transition focus-within:border-stone-950 focus-within:ring-4 focus-within:ring-stone-950/5 ${
        invalid ? 'border-rose-400' : 'border-stone-300'
      }`}
    >
      <span className="flex h-full items-center border-r border-stone-200 bg-stone-50 px-3.5 text-[15px] font-medium text-stone-600">+91</span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        value={display}
        onChange={(e) => onChange('+91' + localDigits(e.target.value))}
        placeholder="98765 43210"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-stone-900 outline-none placeholder:text-stone-400"
      />
    </div>
  );
}

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { cartItems, getCartTotal, clearCart, refreshCart, cartReady } = useCart();
  const toast = useToast();
  const { navigate } = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '+91',
    doorNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    name: '',
    phone: '+91',
    doorNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Wait until a signed-in shopper's bag has loaded before deciding it's empty —
  // otherwise refreshing this page bounced them back to /cart.
  useEffect(() => {
    if (cartReady && cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, cartReady]);

  // Orders are built from the server-side bag, so show exactly that: reload it
  // once when checkout opens (after any pending bag changes have been sent).
  const refreshedOnOpen = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !cartReady || refreshedOnOpen.current) return;
    refreshedOnOpen.current = true;
    const linesBefore = cartItems.length;
    refreshCart().then((lines) => {
      if (lines.length < linesBefore) {
        toast({
          tone: 'info',
          title: 'Your bag was updated',
          description: 'Some items are no longer available and were removed.',
          duration: 8000,
        });
      }
    });
  }, [isAuthenticated, cartReady, refreshCart, cartItems.length, toast]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Pre-fill with saved shipping address, falling back to the account name
      const userShipping = (user as any).shippingAddress;
      setShippingAddress((prev) => ({
        name:
          `${userShipping?.firstName || ''} ${userShipping?.lastName || ''}`.trim() ||
          user.name ||
          prev.name,
        phone: userShipping?.phone ? toPlus91(userShipping.phone) : prev.phone,
        doorNo: userShipping?.address1 || prev.doorNo,
        street: userShipping?.address2 || prev.street,
        city: userShipping?.city || prev.city,
        state: userShipping?.state || prev.state,
        pincode: userShipping?.pin || prev.pincode,
      }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (sameAsShipping) {
      setBillingAddress({ ...shippingAddress });
    }
  }, [sameAsShipping, shippingAddress]);

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  // Shipping name entered on the form, falling back to the account name
  const getShippingName = (): string =>
    shippingAddress.name.trim() || user?.name?.trim() || '';

  // A single name is valid — lastName is simply left empty
  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
    };
  };

  const validateForm = (): boolean => {
    if (!getShippingName()) {
      setError('Please enter your name');
      return false;
    }
    if (!validatePhone(shippingAddress.phone)) {
      setError('Please enter a valid Indian phone number (10 digits after +91)');
      return false;
    }
    if (!shippingAddress.doorNo.trim() || !shippingAddress.street.trim()) {
      setError('Please enter complete address');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      setError('Please enter city');
      return false;
    }
    if (!shippingAddress.state) {
      setError('Please select state');
      return false;
    }
    if (!validatePincode(shippingAddress.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }

    if (!sameAsShipping) {
      if (!billingAddress.name.trim()) {
        setError('Please enter billing name');
        return false;
      }
      if (!validatePhone(billingAddress.phone)) {
        setError('Please enter a valid billing phone number');
        return false;
      }
      if (!validatePincode(billingAddress.pincode)) {
        setError('Please enter a valid billing pincode');
        return false;
      }
    }

    return true;
  };

  // Per-field messages for inline display; mirrors validateForm.
  const getFieldErrors = (): Partial<Record<FieldKey, string>> => {
    const errors: Partial<Record<FieldKey, string>> = {};
    if (!getShippingName()) errors.name = 'Please enter your name';
    if (!validatePhone(shippingAddress.phone)) errors.phone = 'Enter a valid 10-digit mobile number';
    if (!shippingAddress.doorNo.trim()) errors.doorNo = 'Please enter your flat or house number';
    if (!shippingAddress.street.trim()) errors.street = 'Please enter your street or area';
    if (!shippingAddress.city.trim()) errors.city = 'Please enter city';
    if (!shippingAddress.state) errors.state = 'Please select state';
    if (!validatePincode(shippingAddress.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
    if (!sameAsShipping) {
      if (!billingAddress.name.trim()) errors.billingName = 'Please enter billing name';
      if (!validatePhone(billingAddress.phone)) errors.billingPhone = 'Enter a valid 10-digit mobile number';
      if (!validatePincode(billingAddress.pincode)) errors.billingPincode = 'Enter a valid 6-digit pincode';
    }
    return errors;
  };

  const fieldErrors = submitAttempted ? getFieldErrors() : {};
  const formValid = Object.keys(getFieldErrors()).length === 0;

  // Drop the banner once the shopper has fixed every highlighted field.
  useEffect(() => {
    if (submitAttempted && formValid && isAuthenticated) setError('');
  }, [formValid, submitAttempted, isAuthenticated]);

  const handlePhoneChange = (value: string, type: 'shipping' | 'billing') => {
    // Ensure +91 prefix
    if (!value.startsWith('+91')) {
      value = '+91';
    }
    // Allow only numbers after +91
    const phoneNumber = value.slice(3).replace(/\D/g, '').slice(0, 10);
    const formattedPhone = '+91' + phoneNumber;

    if (type === 'shipping') {
      setShippingAddress({ ...shippingAddress, phone: formattedPhone });
    } else {
      setBillingAddress({ ...billingAddress, phone: formattedPhone });
    }
  };

  const handlePincodeChange = (value: string, type: 'shipping' | 'billing') => {
    const pincode = value.replace(/\D/g, '').slice(0, 6);
    if (type === 'shipping') {
      setShippingAddress({ ...shippingAddress, pincode });
    } else {
      setBillingAddress({ ...billingAddress, pincode });
    }
  };

  const calculateSubtotal = () => {
    return getCartTotal();
  };

  const calculateTax = () => {
    return calcTax(calculateSubtotal()); // 0.5% tax
  };

  const calculateShipping = () => {
    return SHIPPING_FEE; // ₹45 shipping
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  const focusFirstInvalid = () => {
    const first = (Object.keys(FIELD_IDS) as FieldKey[]).find((key) => getFieldErrors()[key]);
    const el = first ? document.getElementById(FIELD_IDS[first]) : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setSuccessMessage('');

    if (!isAuthenticated) {
      setError('Please sign in to place an order');
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // From here on, highlight invalid fields inline.
    setSubmitAttempted(true);

    if (!validateForm()) {
      focusFirstInvalid();
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const shippingName = getShippingName();
      const shipping = { ...shippingAddress, name: shippingName };
      const billing = sameAsShipping
        ? shipping
        : { ...billingAddress, name: billingAddress.name.trim() || shippingName };

      const toAddressPayload = (addr: ShippingAddress) => ({
        country: 'India',
        ...splitName(addr.name),
        address1: addr.doorNo,
        address2: addr.street,
        city: addr.city,
        state: addr.state,
        pin: addr.pincode,
        phone: addr.phone,
      });

      const orderData = {
        shippingAddress: toAddressPayload(shipping),
        billingAddress: toAddressPayload(billing),
        shippingMethod: 'standard',
        paymentMethod: paymentMethod === 'online' ? 'online' : 'cod',
      };

      const response = await api.createOrder(orderData);

      // If COD, go directly to success page
      if (paymentMethod === 'cod') {
        clearCart();
        navigate(`/order-success/${response._id || response.id}`);
      } else {
        // If PaymentGateway, initiate payment (PaymentGateway requires non-empty first/last name)
        const { firstName: shipFirst, lastName: shipLast } = splitName(shippingName);
        const firstName = shipFirst || 'Customer';
        const lastName = shipLast || 'User';

        const paymentResponse = await api.initiatePayment({
          orderId: response._id || response.id,
          amount: calculateTotal(),
          firstName: firstName,
          lastName: lastName,
          email: user?.email || '',
          phone: shippingAddress.phone,
          userIP: '127.0.0.1', // You may want to get actual IP
        });

        if (paymentResponse.success) {
          setPaymentData({
            paymentUrl: paymentResponse.paymentUrl,
            txnRefId: paymentResponse.txnRefId,
            orderId: response._id || response.id,
            PaymentGatewayOrderId: paymentResponse.PaymentGatewayOrderId,
            amount: calculateTotal(),
          });
          setShowPaymentModal(true);
        } else {
          throw new Error('Failed to initiate payment');
        }
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.data?.code === 'CART_ITEMS_UNAVAILABLE') {
        // The server removed items that no longer exist — show the bag as it is now.
        await refreshCart();
        toast({ tone: 'error', title: 'Your bag was updated', description: err.message, duration: 8000 });
      }
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    setShowPaymentModal(false);
    clearCart();
    navigate(`/order-success/${orderId}`);
  };

  const handleCheckPaymentStatus = async (txnRefId: string) => {
    try {
      // Send complete order data for status check (PaymentGateway requires amount and PaymentGatewayOrderId)
      const { firstName: shipFirst, lastName: shipLast } = splitName(getShippingName());
      const firstName = shipFirst || 'Customer';
      const lastName = shipLast || 'User';

      const orderData = {
        PaymentGatewayOrderId: paymentData?.PaymentGatewayOrderId || '',
        orderId: paymentData?.orderId || '',
        amount: paymentData?.amount || 0,
        firstName: firstName,
        lastName: lastName,
        email: user?.email || 'customer@example.com',
        phone: shippingAddress.phone.replace('+91', ''),
        userIP: '10.0.0.0',
        userId: user?._id || 'guest'
      };

      console.log('Checking payment status with:', { txnRefId, PaymentGatewayOrderId: orderData.PaymentGatewayOrderId });
      return await api.checkPaymentStatus(txnRefId, orderData);
    } catch (error) {
      console.error('Failed to check payment status:', error);
      return null;
    }
  };

  if (cartItems.length === 0) {
    return cartReady ? null : (
      <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading your bag">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  const loginHref = `/login?redirect=${encodeURIComponent('/checkout')}`;
  const itemCount = cartItems.reduce((n, item) => n + item.quantity, 0);
  const savings = Math.max(0, calcMrpTotal(cartItems) - calculateSubtotal());

  const orderSummary = (
    <>
      <ul className="max-h-[22rem] space-y-5 overflow-y-auto pr-1 pt-2">
        {cartItems.map((item) => (
          <li key={item.id} className="flex items-center gap-4">
            <div className="relative w-14 flex-shrink-0">
              <img src={img(item.product.image, 160)} alt={item.product.name} className="aspect-[3/4] w-full rounded-lg bg-cream-200 object-cover" />
              <span className="absolute -right-2 -top-2 grid h-6 min-w-[1.5rem] place-items-center rounded-full bg-stone-950 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-stone-900">{item.product.name}</p>
              {item.size && <p className="mt-0.5 text-xs text-stone-500">Size {item.size}</p>}
            </div>
            <p className="text-sm font-semibold tabular-nums text-stone-950">{formatINR(item.product.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-3 border-t border-stone-200 pt-6 text-sm text-stone-600">
        <div className="flex justify-between">
          <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
          <dd className="tabular-nums">{formatINR(calculateSubtotal())}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Tax (0.5%)</dt>
          <dd className="tabular-nums">{formatINR(calculateTax(), true)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="tabular-nums">{formatINR(calculateShipping())}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-stone-200 pt-4 text-stone-950">
          <dt className="text-base font-semibold">Total</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">{formatINR(calculateTotal(), true)}</dd>
        </div>
      </dl>
      {savings > 0 && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-800">
          You're saving <span className="font-semibold">{formatINR(savings)}</span> on the MRP with this order.
        </p>
      )}
    </>
  );

  const placeOrder = (
    <div>
      <button
        onClick={handlePlaceOrder}
        disabled={loading || cartItems.length === 0}
        className="btn-primary btn-lg w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Placing order…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Place order · {formatINR(calculateTotal(), true)}
          </>
        )}
      </button>
      <p className="mt-4 text-center text-xs leading-relaxed text-stone-500">
        By placing your order you agree to our{' '}
        <Link to="/shipping" className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-950">Shipping Policy</Link>
        {' '}and{' '}
        <Link to="/refund" className="font-medium text-stone-800 underline underline-offset-2 hover:text-stone-950">Refund Policy</Link>.
      </p>
    </div>
  );

  const inputClass = (key: FieldKey) => `input ${fieldErrors[key] ? 'input-error' : ''}`;

  return (
    <div className="bg-cream-50">
      <div className="container-page py-8 sm:py-10">
        <CheckoutSteps current={1} />
        <h1 className="mt-6 text-4xl font-semibold text-stone-950 sm:text-5xl">Checkout</h1>

        <div ref={errorRef} className="scroll-mt-6">
          {error && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
              <div className="text-sm">
                <p className="font-medium text-rose-900">{error}</p>
                {!isAuthenticated && (
                  <Link to={loginHref} className="mt-1 inline-block font-semibold text-rose-900 underline underline-offset-2">
                    Sign in now — we'll bring you back here
                  </Link>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-900">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Mobile: collapsible summary */}
        <div className="mt-6 lg:hidden">
          <button
            onClick={() => setSummaryOpen(!summaryOpen)}
            aria-expanded={summaryOpen}
            className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-4"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-stone-950">
              <ShoppingBag className="h-4 w-4" />
              {summaryOpen ? 'Hide' : 'Show'} order summary
              <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
            </span>
            <span className="font-semibold tabular-nums text-stone-950">{formatINR(calculateTotal(), true)}</span>
          </button>
          {summaryOpen && <div className="card mt-2 animate-slide-down p-5">{orderSummary}</div>}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Section - User Details */}
          <div className="space-y-6 lg:col-span-7">
            <Section step={1} title="Contact information">
              {!isAuthenticated ? (
                <div className="rounded-2xl bg-cream-100 p-5">
                  <p className="font-semibold text-stone-950">Sign in to place your order</p>
                  <p className="mt-1 text-sm text-stone-600">
                    Already have an account? Sign in and we'll bring you right back to checkout with your bag intact.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link to={loginHref} className="btn-primary btn-sm">
                      Sign in
                    </Link>
                    <Link to={`${loginHref}&mode=register`} className="btn-outline btn-sm">
                      Create account
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl bg-cream-100 p-4">
                  <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-stone-950 text-sm font-bold text-gold-400">
                    {initials(user?.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-950">{user?.name}</p>
                    <p className="truncate text-sm text-stone-500">{user?.email}</p>
                  </div>
                  <span className="badge ml-auto flex-shrink-0 bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">Signed in</span>
                </div>
              )}
            </Section>

            <Section step={2} title="Shipping address" description="Where should we deliver your order?">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="ship-name" label="Full name" required error={fieldErrors.name} className="sm:col-span-2">
                  <input
                    id="ship-name"
                    type="text"
                    autoComplete="shipping name"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    className={inputClass('name')}
                    placeholder="Enter your full name"
                  />
                </Field>

                <Field id="ship-phone" label="Mobile number" required error={fieldErrors.phone} hint="For delivery updates from the courier" className="sm:col-span-2">
                  <PhoneInput
                    id="ship-phone"
                    autoComplete="shipping tel-national"
                    value={shippingAddress.phone}
                    onChange={(value) => handlePhoneChange(value, 'shipping')}
                    invalid={!!fieldErrors.phone}
                  />
                </Field>

                <Field id="ship-door" label="Flat / house no." required error={fieldErrors.doorNo}>
                  <input
                    id="ship-door"
                    type="text"
                    autoComplete="shipping address-line1"
                    value={shippingAddress.doorNo}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, doorNo: e.target.value })}
                    className={inputClass('doorNo')}
                    placeholder="Flat, house no., building"
                  />
                </Field>

                <Field id="ship-street" label="Street / area" required error={fieldErrors.street}>
                  <input
                    id="ship-street"
                    type="text"
                    autoComplete="shipping address-line2"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className={inputClass('street')}
                    placeholder="Area, street, locality"
                  />
                </Field>

                <Field id="ship-city" label="City" required error={fieldErrors.city}>
                  <input
                    id="ship-city"
                    type="text"
                    autoComplete="shipping address-level2"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className={inputClass('city')}
                    placeholder="Enter city"
                  />
                </Field>

                <Field id="ship-pincode" label="Pincode" required error={fieldErrors.pincode}>
                  <input
                    id="ship-pincode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="shipping postal-code"
                    value={shippingAddress.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value, 'shipping')}
                    className={inputClass('pincode')}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                </Field>

                <Field id="ship-state" label="State" required error={fieldErrors.state} className="sm:col-span-2">
                  <select
                    id="ship-state"
                    autoComplete="shipping address-level1"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className={`${inputClass('state')} ${shippingAddress.state ? '' : 'text-stone-400'}`}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state} className="text-stone-900">
                        {state}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            <Section
              step={3}
              title="Billing address"
              aside={
                <button
                  type="button"
                  role="switch"
                  aria-checked={sameAsShipping}
                  onClick={() => setSameAsShipping(!sameAsShipping)}
                  className="flex items-center gap-3 text-sm font-medium text-stone-700"
                >
                  Same as shipping
                  <span className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors ${sameAsShipping ? 'bg-stone-950' : 'bg-stone-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${sameAsShipping ? 'left-[18px]' : 'left-0.5'}`} />
                  </span>
                </button>
              }
            >
              {sameAsShipping ? (
                <p className="text-sm text-stone-500">Your billing address matches the shipping address above.</p>
              ) : (
                <div className="grid animate-fade-in gap-5 sm:grid-cols-2">
                  <Field id="bill-name" label="Full name" required error={fieldErrors.billingName} className="sm:col-span-2">
                    <input
                      id="bill-name"
                      type="text"
                      autoComplete="billing name"
                      value={billingAddress.name}
                      onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                      className={inputClass('billingName')}
                      placeholder="Enter full name"
                    />
                  </Field>

                  <Field id="bill-phone" label="Mobile number" required error={fieldErrors.billingPhone} className="sm:col-span-2">
                    <PhoneInput
                      id="bill-phone"
                      autoComplete="billing tel-national"
                      value={billingAddress.phone}
                      onChange={(value) => handlePhoneChange(value, 'billing')}
                      invalid={!!fieldErrors.billingPhone}
                    />
                  </Field>

                  <Field id="bill-door" label="Flat / house no." required>
                    <input
                      id="bill-door"
                      type="text"
                      autoComplete="billing address-line1"
                      value={billingAddress.doorNo}
                      onChange={(e) => setBillingAddress({ ...billingAddress, doorNo: e.target.value })}
                      className="input"
                      placeholder="Flat, house no."
                    />
                  </Field>

                  <Field id="bill-street" label="Street / area" required>
                    <input
                      id="bill-street"
                      type="text"
                      autoComplete="billing address-line2"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                      className="input"
                      placeholder="Area, street"
                    />
                  </Field>

                  <Field id="bill-city" label="City" required>
                    <input
                      id="bill-city"
                      type="text"
                      autoComplete="billing address-level2"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      className="input"
                      placeholder="Enter city"
                    />
                  </Field>

                  <Field id="bill-pincode" label="Pincode" required error={fieldErrors.billingPincode}>
                    <input
                      id="bill-pincode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="billing postal-code"
                      value={billingAddress.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value, 'billing')}
                      className={inputClass('billingPincode')}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </Field>

                  <Field id="bill-state" label="State" required className="sm:col-span-2">
                    <select
                      id="bill-state"
                      autoComplete="billing address-level1"
                      value={billingAddress.state}
                      onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                      className={`input ${billingAddress.state ? '' : 'text-stone-400'}`}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state} className="text-stone-900">
                          {state}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
            </Section>

            <Section step={4} title="Delivery notes" description="Optional — anything the courier should know?">
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Landmark, preferred time, gate code…"
                aria-label="Delivery notes"
              />
            </Section>

            <Section step={5} title="Payment method">
              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-colors ${
                    paymentMethod === 'cod' ? 'border-stone-950 bg-cream-50' : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                    className="sr-only"
                  />
                  <span className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 ${paymentMethod === 'cod' ? 'border-stone-950' : 'border-stone-300'}`}>
                    {paymentMethod === 'cod' && <span className="h-2.5 w-2.5 rounded-full bg-stone-950" />}
                  </span>
                  <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-800">
                    <Banknote className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-stone-950">Cash on Delivery</span>
                    <span className="block text-sm text-stone-500">Pay when you receive the order</span>
                  </span>
                </label>

                {/* Online payment (PaymentGateway) is disabled for now — re-enable by restoring a radio
                    card with value="online" here; the order and payment flow above already supports it. */}
              </div>
            </Section>

            {/* Mobile place-order */}
            <div className="lg:hidden">{placeOrder}</div>
          </div>

          {/* Right Section - Order Summary */}
          <aside className="hidden lg:col-span-5 lg:block">
            <div className="card sticky top-8 p-7">
              <h2 className="text-xl font-semibold text-stone-950">Order summary</h2>
              <div className="mt-4">{orderSummary}</div>
              <div className="mt-6">{placeOrder}</div>
            </div>
          </aside>
        </div>
      </div>

      {/* PaymentGateway Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentGatewayModal
          paymentData={paymentData}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          onCheckStatus={handleCheckPaymentStatus}
        />
      )}
    </div>
  );
}
