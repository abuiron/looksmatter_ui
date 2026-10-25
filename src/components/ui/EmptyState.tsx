import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  children?: ReactNode; // actions
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, children, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center px-4 py-16 text-center sm:py-24 ${className}`}>
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-150 rounded-full bg-gold-100/60 blur-2xl" />
        <div className="relative grid h-20 w-20 place-items-center rounded-full border border-stone-200 bg-white shadow-soft">
          <Icon className="h-8 w-8 text-stone-800" strokeWidth={1.5} />
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-stone-950 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 max-w-md text-[15px] leading-relaxed text-stone-500">{description}</p>}
      {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
