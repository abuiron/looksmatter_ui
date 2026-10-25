import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  // Set false for flows that must not be dismissed by a stray click (e.g. payment).
  dismissible?: boolean;
  label?: string;
}

const WIDTH = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Centered dialog; becomes a bottom sheet on small screens. */
export default function Modal({ open, onClose, title, size = 'md', children, dismissible = true, label }: ModalProps) {
  useLockBodyScroll(open);
  useEscapeKey(open && dismissible, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <div
        className="absolute inset-0 animate-fade-in bg-stone-950/50 backdrop-blur-[2px]"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:animate-scale-in sm:rounded-3xl ${WIDTH[size]}`}
      >
        {title !== undefined && (
          <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-stone-200 px-6 py-4">
            <div className="font-display text-xl font-semibold text-stone-950">{title}</div>
            <button onClick={onClose} className="icon-btn -mr-2" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body
  );
}
