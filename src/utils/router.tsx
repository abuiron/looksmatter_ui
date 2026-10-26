import {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface NavigateOptions {
  // Replace the current history entry instead of pushing a new one (e.g. filter changes).
  replace?: boolean;
  // Jump to the top of the page after navigating. Defaults to true.
  scroll?: boolean;
}

export type NavigationAction = 'push' | 'replace' | 'pop';

interface RouterContextType {
  // Full path including the query string, e.g. "/catalog?category=Jeans".
  currentPath: string;
  // Path without the query string, e.g. "/catalog".
  pathname: string;
  // Parsed query string of the current path.
  query: URLSearchParams;
  // How we arrived at the current path; "pop" means browser back/forward.
  action: NavigationAction;
  navigate: (path: string, options?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

const readLocation = () => window.location.pathname + window.location.search;

export function Router({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState(readLocation);
  const [action, setAction] = useState<NavigationAction>('pop');

  useEffect(() => {
    const handlePopState = () => {
      setAction('pop');
      setCurrentPath(readLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string, options: NavigateOptions = {}) => {
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setAction(options.replace ? 'replace' : 'push');
    setCurrentPath(path);
    if (options.scroll !== false) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  const [pathname, search = ''] = currentPath.split('?');
  const query = useMemo(() => new URLSearchParams(search), [search]);

  const value = useMemo(
    () => ({ currentPath, pathname: pathname || '/', query, action, navigate }),
    [currentPath, pathname, query, action, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within Router');
  }
  return context;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: ReactNode;
  replace?: boolean;
}

export function Link({ to, children, className = '', onClick, replace, target, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Let the browser handle "open in new tab/window" clicks natively.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (target && target !== '_self') return;
    e.preventDefault();
    navigate(to, { replace });
  };

  return (
    <a href={to} onClick={handleClick} className={className} target={target} {...rest}>
      {children}
    </a>
  );
}
