// Server-side storage utilities to replace localStorage
// All data is now stored on the server and accessible across devices

// Authentication token management
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem('auth-token', token); // Keep token in localStorage for persistence
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('auth-token');
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('auth-token');
}

// Generic API call helper
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      clearAuthToken();
      throw new Error('Authentication required');
    }
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ===== SHOPIFY CONFIGURATION STORAGE =====

export async function loadMappingConfig() {
  try {
    return await apiCall('/api/config/shopify-mapping');
  } catch (error: any) {
    console.error('Failed to load Shopify mapping config:', error);
    // Return default config if server fails
    return {
      api: {
        accessToken: '',
        shopDomain: '',
        apiVersion: '2024-01',
        webhookSecret: '',
        autoSync: true,
        syncInterval: 60
      },
      dateSource: 'tags',
      dateTagPattern: '(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})',
      dateFormat: 'DD/MM/YYYY',
      timeslotSource: 'tags',
      timeslotTagPattern: '(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})',
      timeslotFormat: 'HH:MM-HH:MM',
      deliveryTypeSource: 'tags',
      deliveryTypeKeywords: {
        delivery: ['delivery', 'deliver'],
        collection: ['collection', 'pickup', 'collect'],
        express: ['express', 'urgent', 'rush']
      },
      instructionsSource: 'line_item_properties',
      instructionsPropertyName: 'Special Instructions',
      instructionsKeywords: ['instruction', 'note', 'special', 'request', 'preference'],
      customizationsSource: 'line_item_properties',
      excludeProperties: ['Delivery Time', 'Special Instructions', 'delivery', 'time', 'instruction', 'note', 'special'],
      customerNameFormat: 'first_last',
      includeCustomerPhone: true,
      includeCustomerEmail: true
    };
  }
}

export async function saveMappingConfig(config: any) {
  return await apiCall('/api/config/shopify-mapping', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// ===== STORE-SPECIFIC ORDER MAPPING STORAGE =====

export async function loadStoreOrderMappingConfigs() {
  try {
    return await apiCall('/api/config/store-order-mappings');
  } catch (error) {
    console.error('Failed to load store order mapping configs:', error);
    return {};
  }
}

export async function saveStoreOrderMappingConfigs(configs: any) {
  return await apiCall('/api/config/store-order-mappings', {
    method: 'POST',
    body: JSON.stringify(configs),
  });
}

export async function loadStoreOrderMappingConfig(storeId: string) {
  try {
    return await apiCall(`/api/config/store-order-mappings/${storeId}`);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('404')) {
      return null; // Store config doesn't exist
    }
    console.error('Failed to load store order mapping config:', error);
    throw error;
  }
}

export async function saveStoreOrderMappingConfig(storeId: string, config: any) {
  return await apiCall(`/api/config/store-order-mappings/${storeId}`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// ===== STORE MANAGEMENT =====

export async function getStores() {
  try {
    return await apiCall('/api/stores');
  } catch (error) {
    console.error('Failed to load stores:', error);
    return [];
  }
}

export async function saveStore(store: any) {
  if (store.id && store.id !== `store-${Date.now()}`) {
    // Update existing store
    return await apiCall(`/api/stores/${store.id}`, {
      method: 'PUT',
      body: JSON.stringify(store),
    });
  } else {
    // Create new store
    return await apiCall('/api/stores', {
      method: 'POST',
      body: JSON.stringify(store),
    });
  }
}

export async function deleteStore(storeId: string) {
  return await apiCall(`/api/stores/${storeId}`, {
    method: 'DELETE',
  });
}

// ===== ORDERS MANAGEMENT =====

export async function getOrders(filters?: { storeId?: string; date?: string; status?: string }) {
  try {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    
    const endpoint = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiCall(endpoint);
  } catch (error) {
    console.error('Failed to load orders:', error);
    return [];
  }
}

export async function saveOrders(orders: any[]) {
  return await apiCall('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orders),
  });
}

export async function saveOrder(order: any) {
  return await apiCall('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

// ===== PRODUCTS MANAGEMENT =====

export async function getProducts(storeId?: string) {
  try {
    const endpoint = storeId ? `/api/products?storeId=${storeId}` : '/api/products';
    return await apiCall(endpoint);
  } catch (error) {
    console.error('Failed to load products:', error);
    return [];
  }
}

export async function saveProducts(products: any[]) {
  return await apiCall('/api/products', {
    method: 'POST',
    body: JSON.stringify(products),
  });
}

export async function saveProduct(product: any) {
  return await apiCall('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

// ===== USER PREFERENCES =====

export async function getUserPreferences() {
  try {
    return await apiCall('/api/preferences');
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return {
      theme: 'light',
      notifications: true,
      autoSync: true,
      defaultView: 'dashboard',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    };
  }
}

export async function saveUserPreferences(preferences: any) {
  return await apiCall('/api/preferences', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
}

// ===== SESSION MANAGEMENT =====

export async function refreshAuthToken() {
  try {
    const response = await apiCall('/api/auth/refresh');
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    clearAuthToken();
    throw error;
  }
}

// ===== DATA EXPORT/IMPORT =====

export async function exportAllData() {
  return await apiCall('/api/export/all');
}

export async function importAllData(data: any) {
  return await apiCall('/api/import/all', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ===== AUTHENTICATION =====

export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(errorData.error || 'Login failed');
  }

  const data = await response.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  
  return data;
}

export async function getUserProfile() {
  return await apiCall('/api/auth/profile');
}

export async function updateUserProfile(updates: any) {
  return await apiCall('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ===== MIGRATION UTILITIES =====

// Helper function to migrate from localStorage to server storage
export async function migrateFromLocalStorage() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.log('No auth token found, skipping migration');
      return;
    }

    console.log('🔄 Starting migration from localStorage to server storage...');

    // Migrate Shopify mapping config
    const localShopifyConfig = localStorage.getItem('shopify-mapping-config');
    if (localShopifyConfig) {
      try {
        const config = JSON.parse(localShopifyConfig);
        await saveMappingConfig(config);
        console.log('✅ Migrated Shopify mapping configuration');
      } catch (error) {
        console.error('❌ Failed to migrate Shopify mapping config:', error);
      }
    }

    // Migrate store order mapping configs
    const localStoreConfigs = localStorage.getItem('store-order-mapping-configs');
    if (localStoreConfigs) {
      try {
        const configs = JSON.parse(localStoreConfigs);
        await saveStoreOrderMappingConfigs(configs);
        console.log('✅ Migrated store order mapping configurations');
      } catch (error) {
        console.error('❌ Failed to migrate store order mapping configs:', error);
      }
    }

    // Migrate stores
    const localStores = localStorage.getItem('stores');
    if (localStores) {
      try {
        const stores = JSON.parse(localStores);
        for (const store of stores) {
          await saveStore(store);
        }
        console.log('✅ Migrated stores');
      } catch (error) {
        console.error('❌ Failed to migrate stores:', error);
      }
    }

    // Migrate orders
    const localOrders = localStorage.getItem('orders');
    if (localOrders) {
      try {
        const orders = JSON.parse(localOrders);
        if (orders.length > 0) {
          await saveOrders(orders);
          console.log('✅ Migrated orders');
        }
      } catch (error) {
        console.error('❌ Failed to migrate orders:', error);
      }
    }

    // Migrate products
    const localProducts = localStorage.getItem('products');
    if (localProducts) {
      try {
        const products = JSON.parse(localProducts);
        if (products.length > 0) {
          await saveProducts(products);
          console.log('✅ Migrated products');
        }
      } catch (error) {
        console.error('❌ Failed to migrate products:', error);
      }
    }

    console.log('🎉 Migration completed successfully!');
    
    // Optionally clear localStorage after successful migration
    const shouldClearLocal = confirm('Migration completed! Would you like to clear the old localStorage data?');
    if (shouldClearLocal) {
      localStorage.removeItem('shopify-mapping-config');
      localStorage.removeItem('store-order-mapping-configs');
      localStorage.removeItem('stores');
      localStorage.removeItem('orders');
      localStorage.removeItem('products');
      console.log('🧹 Cleared old localStorage data');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Auto-migration check on app startup
export async function checkAndMigrate() {
  const token = getAuthToken();
  if (!token) return;

  // Check if migration is needed
  const hasLocalData = 
    localStorage.getItem('shopify-mapping-config') ||
    localStorage.getItem('store-order-mapping-configs') ||
    localStorage.getItem('stores') ||
    localStorage.getItem('orders') ||
    localStorage.getItem('products');

  if (hasLocalData) {
    const shouldMigrate = confirm(
      'Local data detected! Would you like to migrate your existing configurations and data to the server? ' +
      'This will make your data accessible from any device.'
    );
    
    if (shouldMigrate) {
      await migrateFromLocalStorage();
    }
  }
} 