import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs, { Crumb } from './Breadcrumbs';

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  breadcrumbs?: Crumb[];
  children?: ReactNode;
}

/** Quiet page header for content pages (policies, contact, account). */
export default function PageHero({ eyebrow, title, description, icon: Icon, breadcrumbs, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-stone-200/70 bg-cream-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-200/40 blur-3xl"
      />
      <div className="container-page relative py-10 sm:py-14">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-6" />}
        <div className="flex items-start gap-5">
          {Icon && (
            <span className="hidden h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-stone-950 text-gold-400 sm:grid">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
          )}
          <div className="max-w-3xl">
            {eyebrow && <p className="eyebrow mb-3 text-gold-700">{eyebrow}</p>}
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] text-stone-950 sm:text-5xl">{title}</h1>
            {description && <div className="mt-4 text-[15px] leading-relaxed text-stone-600 sm:text-base">{description}</div>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
