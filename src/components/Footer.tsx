import { useMemo } from 'react';
import { Banknote, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from '../utils/router';
import { summarizeCategories, useProducts } from '../hooks/useProducts';
import { TrustStrip } from './ui/TrustBadges';
import Logo from './ui/Logo';

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-sm text-stone-400 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { products } = useProducts();
  const topCategories = useMemo(() => summarizeCategories(products).slice(0, 4), [products]);

  const shopLinks = [
    { label: 'All products', to: '/catalog' },
    { label: 'Collections', to: '/shop' },
    ...topCategories.map((c) => ({ label: c.name, to: `/catalog?category=${encodeURIComponent(c.name)}` })),
  ];

  return (
    <footer className="mt-auto print:hidden">
      <section className="border-t border-stone-200/70 bg-cream-100">
        <div className="container-page py-12 sm:py-14">
          <TrustStrip />
        </div>
      </section>

      <div className="bg-stone-950 text-stone-400">
        <div className="container-page grid gap-12 py-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link to="/" aria-label="LOOKSMATTER home">
              <Logo tone="light" />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              Curated clothing, footwear and accessories for women, men and kids — chosen with care and delivered across India.
            </p>
            <ul className="mt-8 space-y-3.5 text-sm">
              <li>
                <a href="mailto:info@looksmatter.in" className="flex items-center gap-3 transition-colors hover:text-white">
                  <Mail className="h-4 w-4 flex-shrink-0 text-gold-500" />
                  info@looksmatter.in
                </a>
              </li>
              <li>
                <a href="tel:+916380280076" className="flex items-center gap-3 transition-colors hover:text-white">
                  <Phone className="h-4 w-4 flex-shrink-0 text-gold-500" />
                  +91 99452 47655
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-500" />
                <span className="leading-relaxed">
                  Virutal Office only: LOOKSMATTER 
                </span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            <FooterColumn title="Shop" links={shopLinks} />
            <FooterColumn
              title="Help"
              links={[
                { label: 'Track your order', to: '/profile?tab=orders' },
                { label: 'Shipping policy', to: '/shipping' },
                { label: 'Returns & refunds', to: '/refund' },
                { label: 'Contact us', to: '/contact' },
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                { label: 'About us', to: '/about' },
                { label: 'My account', to: '/profile' },
                { label: 'Privacy policy', to: '/privacy' },
                { label: 'Terms of service', to: '/terms' },
              ]}
            />
          </div>
        </div>

        <div className="container-page pb-16">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold text-white">Need help with an order?</p>
              <p className="mt-1.5 text-sm">Our team is here Monday to Saturday, 10 AM – 6 PM IST.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+916380280076" className="btn-gold btn-sm">
                <Phone className="h-4 w-4" />
                Call us
              </a>
              <a href="mailto:info@looksmatter.in" className="btn btn-sm border border-white/20 text-white hover:bg-white/10">
                <Mail className="h-4 w-4" />
                Email us
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-page flex flex-col gap-3 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} LOOKSMATTER CONSULTING PVT LTD. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-gold-500" />
              Cash on Delivery available across India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
