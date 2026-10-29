import { ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  // Optional product thumbnail shown instead of the tone icon.
  image?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((options: ToastOptions) => void) | undefined>(undefined);

const TONE_ICON = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  error: <AlertCircle className="h-5 w-5 text-rose-600" />,
  info: <Info className="h-5 w-5 text-stone-700" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, ms: number) => {
      window.clearTimeout(timers.current.get(id));
      timers.current.set(id, window.setTimeout(() => dismiss(id), ms));
    },
    [dismiss]
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = ++nextId.current;
      // Keep at most three on screen.
      setToasts((current) => [...current.slice(-2), { ...options, id }]);
      // Toasts with an action (Undo, View bag) stay a little longer.
      schedule(id, options.duration ?? (options.action ? 6000 : 4000));
    },
    [schedule]
  );

  // Hovering a toast pauses its timer so its action stays clickable.
  const pause = (id: number) => window.clearTimeout(timers.current.get(id));
  const resume = (id: number) => schedule(id, 2500);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-5 sm:top-24 sm:items-end print:hidden"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            onMouseEnter={() => pause(t.id)}
            onMouseLeave={() => resume(t.id)}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-down items-center gap-3 rounded-2xl border border-stone-200 bg-white/95 p-3 pr-2 shadow-lift backdrop-blur"
          >
            {t.image ? (
              <img src={t.image} alt="" className="h-14 w-11 flex-shrink-0 rounded-lg bg-cream-200 object-cover" />
            ) : (
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-stone-100">
                {TONE_ICON[t.tone || 'success']}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-950">{t.title}</p>
              {t.description && <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{t.description}</p>}
            </div>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="flex-shrink-0 rounded-full bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
