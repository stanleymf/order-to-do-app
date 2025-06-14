import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Store } from '../types';
import DataService from '../data';

interface StoreContextType {
  currentStore: Store | null;
  allStores: Store[];
  setCurrentStore: (store: Store | null) => void;
  setCurrentStoreById: (storeId: string) => void;
  refreshStores: () => void;
  isLoading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
  defaultStoreId?: string;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ 
  children, 
  defaultStoreId 
}) => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load stores function
  const loadStores = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 StoreContext: Loading stores from storage');
      const stores = DataService.getStores();
      console.log('🏪 StoreContext: Loaded stores:', stores.map(s => s.name));
      setAllStores(stores);
      
      // Check if current store still exists
      if (currentStore) {
        const currentStoreExists = stores.find(store => store.id === currentStore.id);
        if (!currentStoreExists) {
          console.log('⚠️  StoreContext: Current store was deleted, switching to first store');
          // Current store was deleted, fallback to first store
          setCurrentStore(stores[0] || null);
        }
      } else {
        // Set default store if none is set
        if (defaultStoreId) {
          const defaultStore = stores.find(store => store.id === defaultStoreId);
          if (defaultStore) {
            setCurrentStore(defaultStore);
          } else {
            // Fallback to first store if default not found
            setCurrentStore(stores[0] || null);
          }
        } else {
          // No default specified, use first store
          setCurrentStore(stores[0] || null);
        }
      }
    } catch (err) {
      setError('Failed to load stores');
      console.error('Error loading stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh stores function that can be called externally
  const refreshStores = () => {
    console.log('🔄 StoreContext: Refresh stores called externally');
    loadStores();
  };

  // Load stores on component mount
  useEffect(() => {
    loadStores();
  }, [defaultStoreId]);

  // Set current store by ID
  const setCurrentStoreById = (storeId: string) => {
    const store = allStores.find(s => s.id === storeId);
    if (store) {
      setCurrentStore(store);
    } else {
      setError(`Store with ID ${storeId} not found`);
    }
  };

  const value: StoreContextType = {
    currentStore,
    allStores,
    setCurrentStore,
    setCurrentStoreById,
    refreshStores,
    isLoading,
    error
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook to use store context
export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// Hook to get store-specific data
export const useStoreData = () => {
  const { currentStore } = useStore();
  
  if (!currentStore) {
    return {
      orders: [],
      products: [],
      floristStats: [],
      analytics: null
    };
  }

  return {
    orders: DataService.getOrdersByStore(currentStore.id),
    products: DataService.getProductsByStore(currentStore.id),
    floristStats: DataService.getFloristStats(currentStore.id),
    analytics: DataService.getStoreAnalytics(currentStore.id)
  };
};

export default StoreContext; 