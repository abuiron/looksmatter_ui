import { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Info, LifeBuoy, Mail, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useRouter } from '../utils/router';
import PageHero from './ui/PageHero';

// Shared shell for the Privacy, Terms, Refund and Shipping pages: hero, a
// sticky "On this page" index with scroll-spy, readable body and contact card.

export interface PolicySection {
  id: string;
  title: string;
  content: ReactNode;
}

interface PolicyLayoutProps {
  title: string;
  icon: LucideIcon;
  updated: string;
  sections: PolicySection[];
  contact: {
    title: string;
    text: string;
    showContactForm?: boolean;
  };
  // Optional "Need Help?" note shown above the contact card.
  help?: string;
  // Optional key facts (restated from the policy text) shown above the sections.
  highlights?: { icon: LucideIcon; value: string; label: string }[];
}

const POLICIES = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Refund Policy', to: '/refund' },
  { label: 'Shipping Policy', to: '/shipping' },
];

const CONTACT_ID = 'contact';

// Body copy styling, including <strong> labels and inline links inside sections.
const PROSE =
  'space-y-4 [&_strong]:font-semibold [&_strong]:text-stone-950 [&_a]:font-medium [&_a]:text-stone-950 [&_a]:underline [&_a]:decoration-stone-300 [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:decoration-gold-500';

/** Tracks which section is currently near the top of the viewport. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join('|');

  useEffect(() => {
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: '-112px 0px -60% 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return [active, setActive] as const;
}

export default function PolicyLayout({ title, icon, updated, sections, contact, help, highlights }: PolicyLayoutProps) {
  const { pathname } = useRouter();
  const toc = [...sections.map(({ id, title }) => ({ id, title })), { id: CONTACT_ID, title: contact.title }];
  const [active, setActive] = useActiveSection(toc.map((item) => item.id));
  const mobileTocRef = useRef<HTMLDetailsElement>(null);

  // Honour deep links such as /refund#cancellations on first load.
  useEffect(() => {
    let id = window.location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // Malformed escape in a hand-typed URL — use it as-is.
    }
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, []);

  const jumpTo = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(window.history.state, '', `#${id}`);
    setActive(id);
    if (mobileTocRef.current) mobileTocRef.current.open = false;
  };

  const otherPolicies = POLICIES.filter((p) => p.to !== pathname);

  return (
    <div className="bg-white">
      <PageHero
        eyebrow="Policies"
        title={title}
        icon={icon}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: title }]}
        description={
          <p className="inline-flex items-center gap-2 text-sm font-medium text-stone-500">
            <CalendarDays className="h-4 w-4" />
            Last updated: {updated}
          </p>
        }
      />

      <div className="container-page py-10 sm:py-14 lg:py-16">
        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-20">
          {/* Desktop index */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <nav aria-label="On this page">
                <p className="eyebrow mb-4">On this page</p>
                <ul className="border-l border-stone-200">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => jumpTo(e, item.id)}
                        aria-current={active === item.id ? 'location' : undefined}
                        className={`-ml-px block border-l-2 py-1.5 pl-4 text-[13px] leading-snug transition-colors ${
                          active === item.id
                            ? 'border-gold-500 font-semibold text-stone-950'
                            : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-900'
                        }`}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-8 rounded-2xl bg-cream-100 p-5">
                <p className="text-sm font-semibold text-stone-950">Other policies</p>
                <ul className="mt-3 space-y-2">
                  {otherPolicies.map((policy) => (
                    <li key={policy.to}>
                      <Link
                        to={policy.to}
                        className="group inline-flex items-center gap-1.5 text-[13px] text-stone-600 transition-colors hover:text-stone-950"
                      >
                        {policy.label}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <article className="min-w-0 max-w-3xl text-[15px] leading-relaxed text-stone-700">
            {highlights && highlights.length > 0 && (
              <div className="mb-10 grid gap-3 sm:grid-cols-3">
                {highlights.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-stone-950 text-gold-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-4 font-display text-2xl font-semibold text-stone-950">{value}</p>
                    <p className="mt-1 text-[13px] leading-snug text-stone-500">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Mobile index */}
            <details ref={mobileTocRef} className="group card mb-10 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-stone-950 [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown className="h-4 w-4 text-stone-500 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="border-t border-stone-200 px-2 py-2">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => jumpTo(e, item.id)}
                      className="block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-cream-100 hover:text-stone-950"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 border-t border-stone-200/80 py-10 first-of-type:border-t-0 first-of-type:pt-0"
              >
                <h2 className="mb-5 text-2xl font-semibold text-stone-950 sm:text-[1.7rem]">{section.title}</h2>
                <div className={PROSE}>{section.content}</div>
              </section>
            ))}

            <section id={CONTACT_ID} className="scroll-mt-28 space-y-6 border-t border-stone-200/80 pt-10">
              {help && (
                <PolicyCallout icon={LifeBuoy} title="Need Help?">
                  <p>{help}</p>
                  <p className="text-sm">
                    <strong className="font-semibold text-stone-950">Business Hours:</strong> Monday - Saturday, 10:00 AM - 6:00 PM IST
                  </p>
                </PolicyCallout>
              )}

              <div className="overflow-hidden rounded-3xl bg-stone-950 text-stone-300">
                <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1.15fr_1fr] md:gap-10">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{contact.title}</h2>
                    <p className="mt-3 leading-relaxed">{contact.text}</p>
                    <address className="mt-6 text-sm not-italic leading-relaxed text-stone-400">
                      <span className="block font-semibold text-white">LOOKSMATTER CONSULTING PVT LTD</span>
                      Virutal Office only: LOOKSMATTER 
                    </address>
                  </div>

                  <div className="flex flex-col gap-3">
                    <a
                      href="mailto:info@looksmatter.in"
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-gold-500/60 hover:bg-white/[0.07]"
                    >
                      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-gold-500 text-stone-950">
                        <Mail className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Email</span>
                        <span className="block truncate font-semibold text-white">info@looksmatter.in</span>
                      </span>
                    </a>
                    <a
                      href="tel:+916380280076"
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-gold-500/60 hover:bg-white/[0.07]"
                    >
                      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-gold-500 text-stone-950">
                        <Phone className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Phone</span>
                        <span className="block font-semibold text-white">+91 6380280076</span>
                      </span>
                    </a>
                    {contact.showContactForm && (
                      <Link
                        to="/contact"
                        className="group mt-1 inline-flex items-center gap-2 self-start text-sm font-semibold text-gold-400 transition-colors hover:text-gold-300"
                      >
                        <Mail className="h-4 w-4" />
                        Or use our Contact Form
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-10">
              <Link to="/" className="btn-outline">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

/** Sub-heading inside a policy section. */
export function PolicyH3({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg font-semibold text-stone-950">{children}</h3>;
}

/** Bulleted (gold diamond) or numbered list for policy copy. */
export function PolicyList({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  if (ordered) {
    return (
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3.5">
            <span className="mt-px grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-stone-950 text-[11px] font-bold text-gold-400">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3.5">
          <span aria-hidden="true" className="mt-[0.6rem] h-1.5 w-1.5 flex-shrink-0 rotate-45 rounded-[1px] bg-gold-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Highlighted notice, e.g. "Important Notice". */
export function PolicyCallout({ icon: Icon = Info, title, children }: { icon?: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-gold-200 bg-gold-50 p-5 sm:p-6">
      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white text-gold-700 shadow-sm ring-1 ring-gold-200">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold text-stone-950">{title}</p>
        <div className="mt-1.5 space-y-2 text-stone-700">{children}</div>
      </div>
    </div>
  );
}

/** Small aside for notes and tips; `warning` for cost/eligibility caveats. */
export function PolicyNote({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warning' }) {
  return (
    <p
      className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
        tone === 'warning' ? 'bg-rose-50 text-rose-900 [&_strong]:!text-rose-900' : 'bg-cream-100 text-stone-700'
      }`}
    >
      {children}
    </p>
  );
}

/** Bordered panel used for steps and key facts. */
export function PolicyPanel({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-stone-200 bg-cream-50 p-5 sm:p-6">
      {Icon && (
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white text-stone-800 shadow-sm ring-1 ring-stone-200">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 space-y-3">{children}</div>
    </div>
  );
}
