import { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../../utils/router';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; to: string };
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeading({ eyebrow, title, description, action, align = 'left', className = '' }: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div
      className={`flex flex-col gap-4 ${centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'} ${className}`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && <p className="eyebrow mb-3 text-gold-700">{eyebrow}</p>}
        <h2 className="text-balance text-3xl font-semibold leading-[1.1] text-stone-950 sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-stone-500">{description}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="group inline-flex flex-shrink-0 items-center gap-2 text-sm font-semibold text-stone-950"
        >
          <span className="link-underline">{action.label}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
