import { useEffect } from 'react';

// Counts open overlays so nested drawers/modals don't unlock scrolling early.
let openLocks = 0;

export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    openLocks += 1;
    if (openLocks === 1) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      openLocks -= 1;
      if (openLocks === 0) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [active]);
}
