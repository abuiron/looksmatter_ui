import { useState, useEffect, ReactNode, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useRouter } from '../utils/router';
import api from '../services/api';
import {
  User,
  Package,
  Lock,
  LogOut,
  FileText,
  ChevronDown,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  MessageSquareText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { formatDate, formatDateTime, formatINR, initials, orderRef } from '../utils/format';
import { getOrderStatusMeta, getReportStatusMeta } from '../utils/orderStatus';
import { img } from '../utils/cdn';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

type TabType = 'profile' | 'orders' | 'password' | 'reports';

const TABS: { id: TabType; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile details', icon: User },
  { id: 'orders', label: 'My orders', icon: Package },
  { id: 'reports', label: 'My reports', icon: FileText },
  { id: 'password', label: 'Change password', icon: Lock },
];

interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
  country: string;
}

function PanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-stone-950 sm:text-3xl">{title}</h2>
      {description && <p className="mt-1.5 text-[15px] text-stone-500">{description}</p>}
    </div>
  );
}

function FormSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-5 py-6 sm:px-8 sm:py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
          {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-3">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-6 w-11 flex-shrink-0 rounded-full bg-stone-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-stone-950 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500 peer-focus-visible:ring-offset-2" />
    </label>
  );
}

// Shared by the shipping and billing address blocks.
function AddressFields({
  section,
  value,
  onChange,
  disabled = false,
}: {
  section: 'shipping' | 'billing';
  value: Address;
  onChange: (field: keyof Address, fieldValue: string) => void;
  disabled?: boolean;
}) {
  const bind = (name: keyof Address) => ({
    id: `${section}-${name}`,
    value: value?.[name] ?? '',
    disabled,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(name, e.target.value),
  });

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor={`${section}-firstName`} className="label">First name</label>
        <input type="text" autoComplete={`${section} given-name`} className="input" {...bind('firstName')} />
      </div>
      <div>
        <label htmlFor={`${section}-lastName`} className="label">Last name</label>
        <input type="text" autoComplete={`${section} family-name`} className="input" {...bind('lastName')} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${section}-address1`} className="label">Address line 1</label>
        <input type="text" autoComplete={`${section} address-line1`} placeholder="Flat, house no., building" className="input" {...bind('address1')} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${section}-address2`} className="label">Address line 2</label>
        <input type="text" autoComplete={`${section} address-line2`} placeholder="Area, street, locality" className="input" {...bind('address2')} />
      </div>
      <div>
        <label htmlFor={`${section}-city`} className="label">City</label>
        <input type="text" autoComplete={`${section} address-level2`} className="input" {...bind('city')} />
      </div>
      <div>
        <label htmlFor={`${section}-state`} className="label">State</label>
        <select autoComplete={`${section} address-level1`} className="input" {...bind('state')}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${section}-pin`} className="label">PIN code</label>
        <input type="text" inputMode="numeric" autoComplete={`${section} postal-code`} className="input" {...bind('pin')} />
      </div>
      <div>
        <label htmlFor={`${section}-phone`} className="label">Phone number</label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete={`${section} tel-national`}
          placeholder="10 digit mobile number"
          className="input"
          {...bind('phone')}
        />
      </div>
      <div>
        <label htmlFor={`${section}-country`} className="label">Country</label>
        <select
          id={`${section}-country`}
          autoComplete={`${section} country-name`}
          className="input"
          disabled={disabled}
          value={value?.country || 'India'}
          onChange={(e) => onChange('country', e.target.value)}
        >
          <option value="India">India</option>
        </select>
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="input pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-stone-400 transition-colors hover:text-stone-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  );
}

function Thumb({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return (
    <span className={`relative block flex-shrink-0 overflow-hidden rounded-lg bg-cream-200 ${className}`}>
      <span className="absolute inset-0 grid place-items-center text-stone-400">
        <Package className="h-4 w-4" />
      </span>
      {src && (
        <img
          src={img(src, 160)}
          alt={alt}
          loading="lazy"
          className="relative h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </span>
  );
}

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, updateUser, logout, refetchUser } = useAuth();
  const { resetCart } = useCart();
  const { resetFavorites } = useFavorites();
  const { navigate, query } = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reports, setReports] = useState<any[]>([]);

  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    shippingAddress: {
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      pin: '',
      phone: '',
      country: 'India',
    },
    billingAddress: {
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      pin: '',
      phone: '',
      country: 'India',
    },
  });
  const [sameAsShipping, setSameAsShipping] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deletionNotification, setDeletionNotification] = useState({
    show: false,
    orderId: '',
    message: '',
    items: [] as any[]
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Select the tab named in the URL (?tab=orders). Keyed on the query so a link to
  // /profile?tab=... switches tabs even while this page is already open.
  useEffect(() => {
    const tabParam = query.get('tab');
    if (tabParam && ['profile', 'orders', 'password', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    } else if (!tabParam) {
      setActiveTab('profile');
    }
  }, [query]);

  // Refetch user data when component mounts to ensure latest profile info
  useEffect(() => {
    if (isAuthenticated) {
      refetchUser();
    }
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        shippingAddress: user.shippingAddress || profileData.shippingAddress,
        billingAddress: user.billingAddress || profileData.billingAddress,
      });
      fetchOrders();
      fetchReports();
    }
  }, [user]);

  useEffect(() => {
    // Check for deleted orders and show notification
    const deletedOrder = orders.find(o => o.isDeleted && !o._deletionAcknowledged);
    if (deletedOrder) {
      setDeletionNotification({
        show: true,
        orderId: deletedOrder._id,
        message: deletedOrder.deletionMessage || 'This order has been cancelled by the administrator.',
        items: deletedOrder.items || []
      });
    }
  }, [orders]);

  useEffect(() => {
    if (sameAsShipping) {
      setProfileData(prev => ({
        ...prev,
        billingAddress: { ...prev.shippingAddress }
      }));
    }
  }, [sameAsShipping, profileData.shippingAddress]);

  useEffect(() => {
    calculatePasswordStrength(passwordData.newPassword);
  }, [passwordData.newPassword]);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await api.getMyReports();
      setReports(data || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 13;
    setPasswordStrength(Math.min(strength, 100));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate shipping address if provided
    if (profileData.shippingAddress.phone && !validatePhone(profileData.shippingAddress.phone)) {
      setMessage({ type: 'error', text: 'Invalid phone number. Must be 10 digits starting with 6-9.' });
      setLoading(false);
      return;
    }

    if (profileData.shippingAddress.pin && !validatePincode(profileData.shippingAddress.pin)) {
      setMessage({ type: 'error', text: 'Invalid PIN code. Must be 6 digits.' });
      setLoading(false);
      return;
    }

    // Validate billing address if provided
    if (profileData.billingAddress.phone && !validatePhone(profileData.billingAddress.phone)) {
      setMessage({ type: 'error', text: 'Invalid billing phone number. Must be 10 digits starting with 6-9.' });
      setLoading(false);
      return;
    }

    if (profileData.billingAddress.pin && !validatePincode(profileData.billingAddress.pin)) {
      setMessage({ type: 'error', text: 'Invalid billing PIN code. Must be 6 digits.' });
      setLoading(false);
      return;
    }

    try {
      const updated = await api.updateProfile(profileData);
      updateUser(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    // Matches the backend's minimum, so the shopper sees the rule before submitting.
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeDeletion = async () => {
    try {
      await api.confirmOrderDeletion(deletionNotification.orderId);
      setDeletionNotification({ show: false, orderId: '', message: '', items: [] });
      await fetchOrders();
    } catch (error) {
      console.error('Failed to confirm deletion:', error);
      toast({ tone: 'error', title: 'Failed to confirm order deletion', description: 'Please try again.' });
    }
  };

  const handleLogout = () => {
    logout({
      onLogout: () => {
        resetCart();
        resetFavorites();
      }
    });
    navigate('/');
    // Force page reload for fresh start
    setTimeout(() => window.location.reload(), 100);
  };

  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true, scroll: false });
  };

  const updateAddress = (kind: 'shippingAddress' | 'billingAddress') => (field: keyof Address, value: string) =>
    setProfileData((prev) => ({ ...prev, [kind]: { ...prev[kind], [field]: value } }));

  const getStrengthColor = () => {
    if (passwordStrength < 34) return 'bg-rose-500';
    if (passwordStrength < 67) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthTextColor = () => {
    if (passwordStrength < 34) return 'text-rose-600';
    if (passwordStrength < 67) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getStrengthText = () => {
    if (passwordStrength < 34) return 'Weak';
    if (passwordStrength < 67) return 'Medium';
    return 'Strong';
  };

  const tabCount = (tab: TabType) => (tab === 'orders' ? orders.length : tab === 'reports' ? reports.length : 0);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-stone-500" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        <p className="text-sm">Loading your account…</p>
      </div>
    );
  }

  if (!user) return null;

  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'there';

  return (
    <div className="bg-white">
      <PageHero
        eyebrow="My account"
        title={`Hi, ${firstName}`}
        description={user.email}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'My account' }]}
      >
        <button onClick={handleLogout} className="btn-outline btn-sm mt-6 text-rose-600 hover:border-rose-300 lg:hidden">
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </PageHero>

      <div className="container-page py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="card p-5 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-5">
                <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-stone-950 font-display text-base font-semibold text-gold-400">
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-950">{user.name}</p>
                  <p className="truncate text-[13px] text-stone-500">{user.email}</p>
                </div>
              </div>

              <nav className="mt-4 space-y-1" aria-label="Account">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  const count = tabCount(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => selectTab(tab.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        active ? 'bg-stone-950 text-white' : 'text-stone-600 hover:bg-cream-100 hover:text-stone-950'
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${active ? 'text-gold-400' : 'text-stone-400'}`} />
                      <span className="flex-1">{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            active ? 'bg-white/15 text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 border-t border-stone-200 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Log out
                </button>
              </div>
            </div>
          </aside>

          {/* Tabs (mobile) */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden" role="tablist" aria-label="Account">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const count = tabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(tab.id)}
                  className={`chip ${active ? 'chip-active' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {count > 0 && <span className={active ? 'text-white/70' : 'text-stone-400'}>{count}</span>}
                </button>
              );
            })}
          </div>

          <section className="min-w-0">
            {/* Message */}
            {message.text && (
              <div
                role={message.type === 'error' ? 'alert' : 'status'}
                className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                  message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                )}
                <p>{message.text}</p>
              </div>
            )}

            {/* Profile Details Tab */}
            {activeTab === 'profile' && (
              <div>
                <PanelHeader title="Profile details" description="Keep your details up to date for faster checkout." />
                <form onSubmit={handleProfileUpdate} className="card">
                  <div className="divide-y divide-stone-200">
                    <FormSection title="Basic information" description="Your name and the email you sign in with.">
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="profile-name" className="label">
                            Full name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="profile-name"
                            type="text"
                            required
                            autoComplete="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            className="input"
                          />
                        </div>
                        <div>
                          <label htmlFor="profile-email" className="label">Email address</label>
                          <div className="relative">
                            <input id="profile-email" type="email" value={profileData.email} disabled className="input pr-11" />
                            <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                          </div>
                        </div>
                      </div>
                    </FormSection>

                    <FormSection title="Shipping address" description="Your saved address pre-fills checkout.">
                      <AddressFields
                        section="shipping"
                        value={profileData.shippingAddress}
                        onChange={updateAddress('shippingAddress')}
                      />
                    </FormSection>

                    <FormSection
                      title="Billing address"
                      action={<Toggle checked={sameAsShipping} onChange={setSameAsShipping} label="Same as shipping" />}
                    >
                      <AddressFields
                        section="billing"
                        value={profileData.billingAddress}
                        onChange={updateAddress('billingAddress')}
                        disabled={sameAsShipping}
                      />
                    </FormSection>
                  </div>

                  <div className="sticky bottom-0 flex justify-end rounded-b-2xl border-t border-stone-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
                    <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <PanelHeader
                  title="My orders"
                  description={
                    orders.length > 0
                      ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed with us`
                      : undefined
                  }
                />

                {orders.length === 0 ? (
                  <div className="card">
                    <EmptyState
                      icon={Package}
                      title="No orders yet"
                      description="When you place an order, you can track it right here."
                      className="sm:py-16"
                    >
                      <Link to="/catalog" className="btn-primary">
                        Start shopping
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </EmptyState>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const status = getOrderStatusMeta(order.status);
                      const StatusIcon = status.icon;
                      const items: any[] = order.items || [];
                      const thumbs = items.slice(0, 4);
                      const extra = items.length - thumbs.length;
                      const expanded = expandedOrder === order._id;

                      return (
                        <article key={order._id} className="card overflow-hidden transition-shadow hover:shadow-soft">
                          <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-display text-lg font-semibold text-stone-950">Order #{orderRef(order)}</p>
                                <p className="mt-0.5 text-[13px] text-stone-500">
                                  Placed {formatDate(order.createdAt)} · {items.length} {items.length === 1 ? 'item' : 'items'}
                                </p>
                              </div>
                              <span className={`badge ring-1 ring-inset ${status.badge}`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                {status.label}
                              </span>
                            </div>

                            <div className="mt-5 flex items-end justify-between gap-4">
                              <div className="flex items-center">
                                {thumbs.map((item, idx) => (
                                  <Thumb
                                    key={idx}
                                    src={item.image}
                                    alt={item.name || 'Product'}
                                    className={`h-16 w-12 ring-2 ring-white ${idx > 0 ? '-ml-2' : ''}`}
                                  />
                                ))}
                                {extra > 0 && (
                                  <span className="-ml-2 grid h-16 w-12 place-items-center rounded-lg bg-stone-950 text-xs font-semibold text-white ring-2 ring-white">
                                    +{extra}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-stone-500">Total</p>
                                <p className="text-lg font-semibold tabular-nums text-stone-950">{formatINR(order.total, true)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-cream-50 px-5 py-3 sm:px-6">
                            <button
                              type="button"
                              onClick={() => setExpandedOrder(expanded ? null : order._id)}
                              aria-expanded={expanded}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
                            >
                              {expanded ? 'Hide items' : 'Show items'}
                              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            </button>
                            <Link to={`/order-success/${order._id}`} className="btn-outline btn-sm">
                              View details
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>

                          {expanded && (
                            <ul className="animate-fade-in divide-y divide-stone-100 border-t border-stone-200 px-5 sm:px-6">
                              {items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 py-4">
                                  <Thumb src={item.image} alt={item.name || 'Product'} className="h-16 w-12" />
                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-medium text-stone-900">{item.name}</p>
                                    <p className="mt-0.5 text-xs text-stone-500">
                                      {item.size ? `Size ${item.size} · ` : ''}Qty {item.qty}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold tabular-nums text-stone-950">
                                    {formatINR(item.price * item.qty)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div>
                <PanelHeader
                  title="Change password"
                  description="Use at least 6 characters. Longer passwords mixing cases, numbers and symbols are stronger."
                />
                <form onSubmit={handlePasswordChange} className="card max-w-xl space-y-5 p-5 sm:p-8">
                  <PasswordInput
                    id="current-password"
                    label="Current password"
                    value={passwordData.currentPassword}
                    onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                    autoComplete="current-password"
                  />

                  <div>
                    <PasswordInput
                      id="new-password"
                      label="New password"
                      value={passwordData.newPassword}
                      onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                      autoComplete="new-password"
                    />
                    {passwordData.newPassword && (
                      <div className="mt-3">
                        <div className="flex gap-1.5" aria-hidden="true">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                passwordStrength > i * 25 ? getStrengthColor() : 'bg-stone-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-stone-500">Password strength</span>
                          <span className={`font-semibold ${getStrengthTextColor()}`}>{getStrengthText()}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <PasswordInput
                    id="confirm-password"
                    label="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                    autoComplete="new-password"
                  />

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Changing…' : 'Change password'}
                  </button>
                </form>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <PanelHeader
                  title="My reports"
                  description={
                    reports.length > 0 ? 'Issues you have reported and our responses.' : undefined
                  }
                />

                {reports.length === 0 ? (
                  <div className="card">
                    <EmptyState
                      icon={FileText}
                      title="No reports yet"
                      description="Having trouble with an order? You can report an issue from its order details page."
                      className="sm:py-16"
                    >
                      <button onClick={() => selectTab('orders')} className="btn-outline">
                        View my orders
                      </button>
                    </EmptyState>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => {
                      const meta = getReportStatusMeta(report.status);
                      const StatusIcon = meta.icon;
                      const TypeIcon = report.type === 'order_issue' ? Package : CreditCard;
                      const ref = orderRef(report.order);

                      return (
                        <article key={report._id} className="card p-5 sm:p-6">
                          <div className="flex items-start gap-4">
                            <span className="hidden h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-cream-200 text-stone-800 sm:grid">
                              <TypeIcon className="h-5 w-5" strokeWidth={1.75} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                                    <TypeIcon className="h-3.5 w-3.5 sm:hidden" />
                                    {report.type === 'order_issue' ? 'Order issue' : 'Payment issue'}
                                    {ref && <span>· Order #{ref}</span>}
                                  </p>
                                  <h3 className="mt-1 font-sans text-base font-semibold tracking-normal text-stone-950">
                                    {report.subject}
                                  </h3>
                                </div>
                                <span className={`badge ring-1 ring-inset ${meta.badge}`}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {meta.label}
                                </span>
                              </div>

                              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{report.notes}</p>

                              {report.image && (
                                <a href={report.image} target="_blank" rel="noreferrer" className="mt-4 inline-block">
                                  <img
                                    src={report.image}
                                    alt="Report attachment"
                                    className="h-28 w-auto max-w-full rounded-xl border border-stone-200 object-cover transition-opacity hover:opacity-90"
                                  />
                                </a>
                              )}

                              {report.adminNotes && (
                                <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50 p-4">
                                  <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-800">
                                    <MessageSquareText className="h-3.5 w-3.5" />
                                    Response from our team
                                  </p>
                                  <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{report.adminNotes}</p>
                                </div>
                              )}

                              <p className="mt-4 text-xs text-stone-400">Submitted {formatDateTime(report.createdAt)}</p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Order Deletion Notification Modal */}
      <Modal open={deletionNotification.show} onClose={() => {}} dismissible={false} size="md" label="Order cancelled">
        <div className="p-6 sm:p-8">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-center text-2xl font-semibold text-stone-950">Order cancelled</h3>
          <p className="mt-2 text-center text-[15px] text-stone-600">
            One of your orders has been cancelled by the administrator.
          </p>

          {/* Cancelled Products */}
          {deletionNotification.items && deletionNotification.items.length > 0 && (
            <div className="mt-6">
              <p className="eyebrow mb-3">Cancelled items</p>
              <ul className="space-y-2">
                {deletionNotification.items.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 rounded-2xl bg-cream-100 p-3">
                    <Thumb src={item.image} alt={item.name || 'Product'} className="h-16 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-stone-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {item.size ? `Size ${item.size} · ` : ''}Qty {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-stone-950">{formatINR(item.price)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-stone-200 p-4">
            <p className="eyebrow">Reason</p>
            <p className="mt-1.5 text-[15px] text-stone-800">{deletionNotification.message}</p>
          </div>

          <button onClick={handleAcknowledgeDeletion} className="btn-primary mt-6 w-full">
            I understand
          </button>
        </div>
      </Modal>
    </div>
  );
}
