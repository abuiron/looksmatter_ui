import { useMemo } from 'react';
import {
  ArrowRight,
  Award,
  Eye,
  Headphones,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
} from 'lucide-react';
import { Link } from '../utils/router';
import { summarizeCategories, useProducts } from '../hooks/useProducts';
import { img, imgSet } from '../utils/cdn';
import Logo from '../components/ui/Logo';
import SectionHeading from '../components/ui/SectionHeading';

const values = [
  {
    icon: Award,
    title: 'Quality First',
    description:
      'Every product is carefully selected and quality-checked to ensure it meets our high standards before it reaches you.',
  },
  {
    icon: Heart,
    title: 'Customer Obsessed',
    description:
      'Your satisfaction drives everything we do. We listen, we care, and we go the extra mile for every customer.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Transparency',
    description:
      'Honest pricing, secure payments, and clear policies. We build lasting relationships through trust.',
  },
  {
    icon: Sparkles,
    title: 'Constant Innovation',
    description:
      'We continuously refresh our collections and improve your shopping experience with the latest trends.',
  },
];

const features = [
  {
    icon: Truck,
    title: 'Fast & Reliable Delivery',
    description: 'Quick dispatch and dependable shipping across the country.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: 'Safe, encrypted checkout powered by trusted payment partners.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'A friendly team ready to help you before and after every purchase.',
  },
];

const stats = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '500+', label: 'Products' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '24/7', label: 'Support' },
];

export default function About() {
  const { products, loading } = useProducts();
  // Real catalogue photography for the story section: covers of the two largest categories.
  const [mainImage, accentImage] = useMemo(
    () => summarizeCategories(products).map((c) => c.image).filter(Boolean),
    [products]
  );

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-24 h-[30rem] w-[30rem] rounded-full bg-gold-500/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-gold-700/20 blur-3xl" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]"
        />

        <div className="container-page relative pb-32 pt-16 sm:pb-40 sm:pt-24 lg:pt-28">
          <p className="eyebrow inline-flex items-center gap-2 text-gold-400">
            <Sparkles className="h-3.5 w-3.5" />
            About LOOKSMATTER
          </p>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            Quality clothing & lifestyle, delivered with{' '}
            <span className="font-serif font-normal italic text-gold-400">care</span>
          </h1>
          <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">LOOKSMATTER CONSULTING PVT LTD</p>
            <p className="max-w-2xl text-lg leading-relaxed text-stone-300">
              We're on a mission to make great products accessible to everyone. From everyday
              essentials to standout pieces, LOOKSMATTER brings you a curated shopping experience
              built around quality, value, and trust.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page relative z-10 -mt-16 sm:-mt-20">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-stone-200 bg-stone-200 shadow-lift md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse bg-white px-6 py-8 text-center sm:py-10">
              <dt className="mt-2 text-sm text-stone-500">{stat.label}</dt>
              <dd className="font-display text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Our Story */}
      <section className="container-page py-20 sm:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div aria-hidden="true" className="absolute -left-5 -top-5 h-28 w-28 rounded-full border border-gold-300" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-cream-200">
              {mainImage ? (
                <img
                  src={img(mainImage, 900)}
                  srcSet={imgSet(mainImage, [600, 900, 1300])}
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  alt="LOOKSMATTER collection"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : loading ? (
                <div className="skeleton h-full w-full rounded-none" />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <Logo />
                </div>
              )}
            </div>
            {accentImage && (
              <div className="absolute -bottom-8 -right-3 hidden aspect-[3/4] w-40 overflow-hidden rounded-2xl border-[6px] border-white bg-cream-200 shadow-lift sm:block md:w-48">
                <img src={img(accentImage, 400)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <span aria-hidden="true" className="mb-6 block h-px w-14 bg-gold-500" />
            <h2 className="text-4xl font-semibold text-stone-950 sm:text-5xl">Our Story</h2>
            <div className="mt-8 max-w-xl space-y-5 text-[15px] leading-relaxed text-stone-600 sm:text-base">
              <p className="text-lg leading-relaxed text-stone-900 sm:text-xl">
                LOOKSMATTER began with a simple idea: shopping for quality clothing and lifestyle
                products should be easy, affordable, and enjoyable. What started as a small venture
                has grown into a destination trusted by thousands of customers.
              </p>
              <p>
                We work closely with reliable suppliers and partners to bring you a thoughtfully
                curated collection — products we genuinely believe in. Every item in our catalog is
                chosen with care, so you can shop with confidence.
              </p>
              <p>
                Today, we continue to grow with our community, constantly improving our products,
                service, and experience to serve you better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container-page pb-20 sm:pb-28">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-stone-950 p-8 text-stone-300 sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-500/15 blur-2xl" />
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gold-500 text-stone-950">
              <Target className="h-6 w-6" />
            </span>
            <h2 className="relative mt-8 text-3xl font-semibold text-white">Our Mission</h2>
            <p className="relative mt-4 text-[15px] leading-relaxed">
              To make high-quality clothing and lifestyle products accessible to everyone through
              honest pricing, dependable service, and a seamless shopping experience that puts the
              customer first.
            </p>
          </div>
          <div className="rounded-3xl border border-gold-200 bg-gold-50 p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-950 text-gold-400">
              <Eye className="h-6 w-6" />
            </span>
            <h2 className="mt-8 text-3xl font-semibold text-stone-950">Our Vision</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-stone-700">
              To become the most trusted and loved online shopping destination — known for quality,
              value, and a community of customers who keep coming back.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream-100 py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading
            align="center"
            title="What We Stand For"
            description="Our values shape every decision we make and every product we offer."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="rounded-3xl border border-stone-200/80 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-950 text-gold-400">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-display text-sm font-semibold text-stone-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold text-stone-950">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className="container-page py-20 sm:py-28">
        <SectionHeading
          align="center"
          title="Why Shop With Us"
          description="We're committed to giving you the best shopping experience from start to finish."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-stone-200 bg-stone-200 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white p-8 text-center sm:p-10">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cream-200 text-stone-900">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-stone-950">{feature.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact / CTA */}
      <section className="container-page pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 px-6 py-12 text-stone-300 sm:px-12 sm:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
            <div>
              <h2 className="text-balance text-3xl font-semibold text-white sm:text-4xl">Have questions? We're here to help.</h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed">
                Reach out to our team any time — we'd love to hear from you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/shop" className="btn-gold">
                  Start Shopping
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="btn border border-white/25 text-white hover:bg-white/10">
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">LOOKSMATTER CONSULTING PVT LTD</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <a href="mailto:info@looksmatter.in" className="flex items-center gap-3 transition-colors hover:text-white">
                    <Mail className="h-5 w-5 flex-shrink-0 text-gold-500" />
                    info@looksmatter.in
                  </a>
                </li>
                <li>
                  <a href="tel:+916380280076" className="flex items-center gap-3 transition-colors hover:text-white">
                    <Phone className="h-5 w-5 flex-shrink-0 text-gold-500" />
                    +91 6380280076
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-500" />
                  <address className="not-italic leading-relaxed">
                   Virutal Office only: LOOKSMATTER 
                  </address>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
