import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  favorites?: string[];
  cart?: any[];
  shippingAddress?: any;
  billingAddress?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: (callbacks?: { onLogout?: () => void }) => void;
  updateUser: (data: Partial<User>) => void;
  refetchUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await api.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.register({ name, email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = (callbacks?: { onLogout?: () => void }) => {
    api.logout();
    setUser(null);
    // Clear all localStorage data
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    localStorage.removeItem('favorites');
    
    // Execute any provided callbacks
    if (callbacks?.onLogout) {
      callbacks.onLogout();
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refetchUser: fetchUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
