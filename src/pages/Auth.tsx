import { ReactNode, useEffect, useState } from 'react';
import { AlertCircle, Check, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useRouter } from '../utils/router';
import { useProducts } from '../hooks/useProducts';
import { img } from '../utils/cdn';
import Logo from '../components/ui/Logo';

// Only follow same-site paths, never "//host" or absolute URLs.
const safeRedirect = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '');

const BENEFITS = [
  'Track every order from one place',
  'Keep your wishlist and bag across devices',
  'Check out faster with saved addresses',
];

function InputWithIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">{icon}</span>
      {children}
    </div>
  );
}

export default function Auth() {
  const { query, navigate } = useRouter();
  const [isLogin, setIsLogin] = useState(query.get('mode') !== 'register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const { products } = useProducts();
  const redirectTo = safeRedirect(query.get('redirect'));
  const coverImage = (products.find((p) => p.category === 'Kurtas & Suits') || products[0])?.image;

  // Already signed in (e.g. an old bookmark) — skip the form.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectTo || '/profile', { replace: true });
    }
    // Only on the initial auth check; a fresh sign-in navigates from handleSubmit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password);
      }
      navigate(redirectTo || '/profile');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="grid min-h-[calc(100vh-6.5rem)] lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-stone-950 lg:block">
        {coverImage && (
          <img src={img(coverImage, 1200)} alt="" className="absolute inset-0 h-full w-full animate-fade-in object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-950/20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <Link to="/" aria-label="LOOKSMATTER home">
            <Logo tone="light" />
          </Link>
          <div>
            <h2 className="max-w-md text-balance text-5xl font-semibold leading-[1.05]">
              Your style, <span className="font-serif font-normal italic text-gold-400">saved.</span>
            </h2>
            <ul className="mt-8 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-[15px] text-stone-200">
                  <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-gold-500 text-stone-950">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Form */}
      <div className="flex items-center justify-center bg-cream-50 px-4 py-12 sm:px-6 lg:bg-white">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-semibold text-stone-950">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="mt-2 text-[15px] text-stone-500">
              {isLogin ? 'Sign in to your account' : 'Register for a new account'}
              {redirectTo === '/checkout' && ' to continue to checkout'}
            </p>
          </div>

          <div role="tablist" aria-label="Sign in or register" className="mt-8 grid grid-cols-2 rounded-full bg-stone-100 p-1">
            {[
              { label: 'Sign in', value: true },
              { label: 'Create account', value: false },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={isLogin === tab.value}
                onClick={() => switchMode(tab.value)}
                className={`h-10 rounded-full text-sm font-semibold transition ${
                  isLogin === tab.value ? 'bg-white text-stone-950 shadow-soft' : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {!isLogin && (
              <div className="animate-fade-in">
                <label htmlFor="name" className="label">
                  Full name <span className="text-rose-500">*</span>
                </label>
                <InputWithIcon icon={<User className="h-4 w-4" />}>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required={!isLogin}
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input pl-11"
                    placeholder="Your full name"
                  />
                </InputWithIcon>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email address <span className="text-rose-500">*</span>
              </label>
              <InputWithIcon icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-11"
                  placeholder="you@example.com"
                />
              </InputWithIcon>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password <span className="text-rose-500">*</span>
              </label>
              <InputWithIcon icon={<Lock className="h-4 w-4" />}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-11 pr-12"
                  placeholder={isLogin ? 'Your password' : 'Create a password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </InputWithIcon>
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <label htmlFor="confirmPassword" className="label">
                  Confirm password <span className="text-rose-500">*</span>
                </label>
                <InputWithIcon icon={<Lock className="h-4 w-4" />}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    required={!isLogin}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pl-11"
                    placeholder="Repeat your password"
                  />
                </InputWithIcon>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => switchMode(!isLogin)} className="font-semibold text-stone-950 underline underline-offset-4 hover:text-gold-700">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
