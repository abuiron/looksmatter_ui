import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Heart, Mail, Menu, Package, Phone, Search, ShieldCheck, ShoppingBag, User } from 'lucide-react';
import { Link, useRouter } from '../utils/router';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { summarizeCategories, useProducts } from '../hooks/useProducts';
import { img } from '../utils/cdn';
import { initials } from '../utils/format';
import Logo from './ui/Logo';
import Drawer from './ui/Drawer';
import SearchOverlay from './SearchOverlay';

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/catalog', mega: true },
  { label: 'Collections', to: '/shop' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const ANNOUNCEMENTS = ['Cash on Delivery across India', 'Easy 7-day returns', 'Flat ₹45 shipping on every order'];

function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length), 3500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="bg-stone-950 text-[12px] font-medium tracking-wide text-stone-200">
      <div className="container-page flex h-9 items-center justify-center">
        <p key={index} className="animate-fade-in sm:hidden">
          {ANNOUNCEMENTS[index]}
        </p>
        <ul className="hidden items-center gap-6 sm:flex">
          {ANNOUNCEMENTS.map((text, i) => (
            <li key={text} className="flex items-center gap-6">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-gold-500" />}
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-bold leading-none text-stone-950 ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Header() {
  const { getCartCount } = useCart();
  const { getFavoritesCount } = useFavorites();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const { pathname } = useRouter();
  const { products } = useProducts();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number>();

  const categories = useMemo(() => summarizeCategories(products), [products]);
  const cartCount = getCartCount();
  const favoritesCount = getFavoritesCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus whenever the page changes.
  useEffect(() => {
    setMobileMenuOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  // Press "/" anywhere to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 120);
  };

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const featured = categories.slice(0, 2);

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl transition-shadow duration-300 supports-[backdrop-filter]:bg-white/80 print:hidden ${
          scrolled ? 'border-stone-200 shadow-[0_6px_24px_-12px_rgba(12,10,9,0.18)]' : 'border-transparent'
        }`}
      >
        {/* Not `relative`: the mega menu positions against the sticky <header> so it spans the full width. */}
        <div className="container-page flex h-16 items-center gap-2 lg:h-[72px]">
          {/* Left: menu (mobile) + logo */}
          <div className="flex flex-1 items-center gap-1 lg:flex-none">
            <button className="icon-btn -ml-2 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <Menu className="h-[22px] w-[22px]" />
            </button>
            <Link to="/" aria-label="LOOKSMATTER home" className="flex items-center">
              <Logo compact className="sm:hidden" />
              <Logo className="hidden sm:inline-flex" />
            </Link>
          </div>

          {/* Center: desktop navigation */}
          <nav className="hidden h-full flex-1 items-center justify-center lg:flex" aria-label="Main">
            <ul className="flex h-full items-center gap-1">
              {NAV.map((item) =>
                item.mega ? (
                  <li key={item.to} className="flex h-full items-center" onMouseEnter={openMega} onMouseLeave={closeMega}>
                    <Link
                      to={item.to}
                      aria-expanded={megaOpen}
                      onFocus={openMega}
                      className={`relative flex h-full items-center gap-1 px-4 text-[14px] font-medium transition-colors hover:text-stone-950 ${
                        isActive(item.to) ? 'text-stone-950' : 'text-stone-600'
                      }`}
                    >
                      {item.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`} />
                      {isActive(item.to) && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gold-500" />}
                    </Link>

                    {megaOpen && (
                      <div
                        className="absolute inset-x-0 top-full animate-slide-down border-t border-stone-200 bg-white shadow-[0_24px_48px_-24px_rgba(12,10,9,0.25)]"
                        onMouseEnter={openMega}
                        onMouseLeave={closeMega}
                      >
                        <div className="container-page grid grid-cols-12 gap-10 py-10">
                          <div className="col-span-7">
                            <p className="eyebrow mb-5">Shop by category</p>
                            <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
                              {categories.map((c) => (
                                <li key={c.name}>
                                  <Link
                                    to={`/catalog?category=${encodeURIComponent(c.name)}`}
                                    onClick={() => setMegaOpen(false)}
                                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] text-stone-700 transition-colors hover:bg-cream-100 hover:text-stone-950"
                                  >
                                    <span>{c.name}</span>
                                    <span className="text-xs text-stone-400 group-hover:text-gold-700">{c.count}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            <Link
                              to="/catalog"
                              onClick={() => setMegaOpen(false)}
                              className="group mt-6 inline-flex items-center gap-2 px-3 text-sm font-semibold text-stone-950"
                            >
                              <span className="link-underline">View all products</span>
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                          <div className="col-span-5 grid grid-cols-2 gap-4">
                            {featured.map((c) => (
                              <Link
                                key={c.name}
                                to={`/catalog?category=${encodeURIComponent(c.name)}`}
                                onClick={() => setMegaOpen(false)}
                                className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream-200"
                              >
                                {c.image && (
                                  <img
                                    src={img(c.image, 500)}
                                    alt=""
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/0 to-transparent" />
                                <div className="absolute inset-x-4 bottom-4 text-white">
                                  <p className="font-display text-lg font-semibold">{c.name}</p>
                                  <p className="text-xs text-white/80">{c.count} styles</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ) : (
                  <li key={item.to} className="flex h-full items-center">
                    <Link
                      to={item.to}
                      className={`relative flex h-full items-center px-4 text-[14px] font-medium transition-colors hover:text-stone-950 ${
                        isActive(item.to) ? 'text-stone-950' : 'text-stone-600'
                      }`}
                    >
                      {item.label}
                      {isActive(item.to) && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gold-500" />}
                    </Link>
                  </li>
                )
              )}
              {isAdmin && (
                <li className="ml-2">
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 text-[13px] font-semibold text-gold-800 transition-colors hover:bg-gold-200"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Right: actions */}
          <div className="flex flex-1 items-center justify-end gap-0.5 lg:flex-none">
            <button
              onClick={() => setSearchOpen(true)}
              className="icon-btn group hidden h-10 w-auto gap-2 rounded-full border border-stone-200 pl-3.5 pr-2 text-stone-500 hover:border-stone-300 hover:bg-white xl:inline-flex"
              aria-label="Search products"
            >
              <Search className="h-4 w-4" />
              <span className="pr-6 text-[13px]">Search products</span>
              <kbd className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-sans text-[11px] text-stone-400">/</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="icon-btn xl:hidden" aria-label="Search products">
              <Search className="h-5 w-5" />
            </button>

            <Link
              to="/profile"
              className="icon-btn hidden sm:inline-flex"
              aria-label={isAuthenticated ? 'My account' : 'Sign in'}
              title={isAuthenticated ? user?.name : 'Sign in'}
            >
              {isAuthenticated ? (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-stone-950 text-[11px] font-bold text-gold-400">
                  {initials(user?.name)}
                </span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>

            <Link to="/favorites" className="icon-btn relative hidden sm:inline-flex" aria-label={`Wishlist (${favoritesCount})`}>
              <Heart className="h-5 w-5" />
              <CountBadge count={favoritesCount} />
            </Link>

            <Link to="/cart" className="icon-btn relative -mr-2 sm:mr-0" aria-label={`Bag (${cartCount} items)`}>
              <ShoppingBag className="h-5 w-5" />
              <CountBadge count={cartCount} />
            </Link>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} side="left" label="Menu" title={<Logo compact />}>
        <div className="flex min-h-full flex-col">
          <div className="p-5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="flex h-12 w-full items-center gap-3 rounded-full border border-stone-200 bg-cream-50 px-4 text-sm text-stone-500"
            >
              <Search className="h-4 w-4" />
              Search products
            </button>
          </div>

          <nav className="px-5" aria-label="Mobile">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 font-display text-xl font-medium ${
                      isActive(item.to) ? 'bg-cream-100 text-stone-950' : 'text-stone-700'
                    }`}
                  >
                    {item.label}
                    {isActive(item.to) && <span className="h-2 w-2 rounded-full bg-gold-500" />}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-3 font-display text-xl font-medium text-gold-700">
                    <ShieldCheck className="h-5 w-5" />
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {categories.length > 0 && (
            <div className="mt-6 border-t border-stone-200 px-5 pt-6">
              <p className="eyebrow mb-3 px-3">Categories</p>
              <ul className="grid grid-cols-2 gap-1">
                {categories.map((c) => (
                  <li key={c.name}>
                    <Link
                      to={`/catalog?category=${encodeURIComponent(c.name)}`}
                      className="block truncate rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-cream-100 hover:text-stone-950"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 border-t border-stone-200 px-5 pt-6">
            <ul className="space-y-1 text-[15px]">
              <li>
                <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-stone-700 hover:bg-cream-100">
                  <User className="h-5 w-5 text-stone-400" />
                  {isAuthenticated ? 'My account' : 'Sign in / Register'}
                </Link>
              </li>
              {isAuthenticated && (
                <li>
                  <Link to="/profile?tab=orders" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-stone-700 hover:bg-cream-100">
                    <Package className="h-5 w-5 text-stone-400" />
                    My orders
                  </Link>
                </li>
              )}
              <li>
                <Link to="/favorites" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-stone-700 hover:bg-cream-100">
                  <Heart className="h-5 w-5 text-stone-400" />
                  Wishlist {favoritesCount > 0 && <span className="text-stone-400">({favoritesCount})</span>}
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-auto space-y-2 bg-cream-100 px-8 py-6 text-[13px] text-stone-600">
            <a href="tel:+916380280076" className="flex items-center gap-2 hover:text-stone-950">
              <Phone className="h-4 w-4" /> +91 99452 47655
            </a>
            <a href="mailto:info@looksmatter.in" className="flex items-center gap-2 hover:text-stone-950">
              <Mail className="h-4 w-4" /> info@looksmatter.in
            </a>
          </div>
        </div>
      </Drawer>
    </>
  );
}
