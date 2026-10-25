import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  label?: string;
}

const PANEL = {
  left: 'inset-y-0 left-0 w-[88%] max-w-sm animate-slide-in-left',
  right: 'inset-y-0 right-0 w-[92%] max-w-md animate-slide-in-right',
  bottom: 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl animate-slide-up',
};

/** Slide-over panel used for the mobile menu and filter sheet. */
export default function Drawer({ open, onClose, side = 'right', title, footer, children, label }: DrawerProps) {
  useLockBodyScroll(open);
  useEscapeKey(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 animate-fade-in bg-stone-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`absolute flex flex-col bg-white shadow-2xl ${PANEL[side]}`}>
        {side === 'bottom' && <div className="mx-auto mt-3 h-1 w-10 flex-shrink-0 rounded-full bg-stone-300" />}
        {title !== undefined && (
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-stone-200 px-5">
            <div className="font-display text-lg font-semibold text-stone-950">{title}</div>
            <button onClick={onClose} className="icon-btn -mr-2" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="flex-shrink-0 border-t border-stone-200 bg-white p-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
