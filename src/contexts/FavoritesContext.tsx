import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface FavoritesContextType {
  favorites: Product[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getFavoritesCount: () => number;
  resetFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Load favorites from localStorage or API
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load from API and sync localStorage favorites
      loadFavoritesFromAPI();
    } else {
      // Load from localStorage
      const stored = localStorage.getItem('favorites');
      if (stored) {
        try {
          setFavorites(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse favorites:', e);
        }
      }
    }
  }, [isAuthenticated, user]);

  const loadFavoritesFromAPI = async () => {
    try {
      // Get localStorage favorites to sync
      const localFavorites = localStorage.getItem('favorites');
      const localFavs = localFavorites ? JSON.parse(localFavorites) : [];
      
      // Load from API
      const data = await api.getFavorites();
      // Skip entries for deleted products (older servers return them as null).
      const apiFavorites = (data || []).filter(Boolean).map((product: any) => ({
        ...product,
        id: product._id || product.id,
      }));
      
      // Sync localStorage favorites to backend
      if (localFavs.length > 0) {
        for (const product of localFavs) {
          try {
            const exists = apiFavorites.find((p: Product) => p.id === product.id);
            if (!exists) {
              await api.addFavorite(product.id);
              apiFavorites.push(product);
            }
          } catch (err) {
            console.error('Failed to sync favorite:', err);
          }
        }
        // Clear localStorage after syncing
        localStorage.removeItem('favorites');
      }
      
      setFavorites(apiFavorites);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const addToFavorites = async (product: Product) => {
    const newFavorites = [...favorites, product];
    setFavorites(newFavorites);
    
    if (isAuthenticated) {
      try {
        await api.addFavorite(product.id);
      } catch (error) {
        console.error('Failed to add favorite:', error);
        // Revert on error
        setFavorites(favorites);
      }
    } else {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    }
  };

  const removeFromFavorites = async (productId: string) => {
    const newFavorites = favorites.filter(item => item.id !== productId);
    setFavorites(newFavorites);
    
    if (isAuthenticated) {
      try {
        await api.removeFavorite(productId);
      } catch (error) {
        console.error('Failed to remove favorite:', error);
        // Revert on error
        setFavorites(favorites);
      }
    } else {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.some(item => item.id === productId);
  };

  const getFavoritesCount = (): number => {
    return favorites.length;
  };

  const resetFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('favorites');
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        getFavoritesCount,
        resetFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
