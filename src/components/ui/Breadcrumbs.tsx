import { ChevronRight } from 'lucide-react';
import { Link } from '../../utils/router';

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-stone-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {item.to && !last ? (
                <Link to={item.to} className="transition-colors hover:text-stone-950">
                  {item.label}
                </Link>
              ) : (
                <span className={`truncate ${last ? 'max-w-[16rem] font-medium text-stone-900 sm:max-w-md' : ''}`} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-stone-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
