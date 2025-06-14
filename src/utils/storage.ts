import type { User, Order, Product, ProductLabel, FloristStats, AuthState, Store } from '../types';
import { mockUsers, mockOrders, mockProducts, mockFloristStats, mockStores } from '../data/mockData';

const STORAGE_KEYS = {
  AUTH: 'florist-dashboard-auth',
  ORDERS: 'florist-dashboard-orders',
  PRODUCTS: 'florist-dashboard-products',
  PRODUCT_LABELS: 'florist-dashboard-product-labels',
  STATS: 'florist-dashboard-stats',
  STORES: 'florist-dashboard-stores',
  // Additional persistence keys
  SHOPIFY_MAPPING_CONFIG: 'shopify-mapping-config',
  MULTI_STORE_WEBHOOK_CONFIGS: 'multi-store-webhook-configs',
  USER_PREFERENCES: 'florist-dashboard-user-preferences',
  DATA_VERSION: 'florist-dashboard-data-version'
};

// Current data version for migration purposes
const CURRENT_DATA_VERSION = '2.0.0-alpha.36';

// Default product labels
const defaultProductLabels: ProductLabel[] = [
  // Difficulty labels
  { id: '1', name: 'Easy', color: '#22c55e', category: 'difficulty', priority: 1, createdAt: new Date() },
  { id: '2', name: 'Medium', color: '#eab308', category: 'difficulty', priority: 2, createdAt: new Date() },
  { id: '3', name: 'Hard', color: '#f97316', category: 'difficulty', priority: 3, createdAt: new Date() },
  { id: '4', name: 'Very Hard', color: '#ef4444', category: 'difficulty', priority: 4, createdAt: new Date() },
  // Product type labels
  { id: '5', name: 'Bouquet', color: '#8b5cf6', category: 'productType', priority: 1, createdAt: new Date() },
  { id: '6', name: 'Vase', color: '#3b82f6', category: 'productType', priority: 2, createdAt: new Date() },
  { id: '7', name: 'Arrangement', color: '#10b981', category: 'productType', priority: 3, createdAt: new Date() },
  { id: '8', name: 'Wreath', color: '#f59e0b', category: 'productType', priority: 4, createdAt: new Date() },
  { id: '9', name: 'Bundle', color: '#ec4899', category: 'productType', priority: 5, createdAt: new Date() }
];

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Safe localStorage operations with error handling
const safeGetItem = (key: string): string | null => {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

// Initialize localStorage with mock data ONLY if no data exists
// This preserves user data on refresh
export const initializeStorage = () => {
  console.log('🔄 Initializing storage - preserving existing user data');
  
  // Set data version
  if (!safeGetItem(STORAGE_KEYS.DATA_VERSION)) {
    safeSetItem(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
  }
  
  // Only initialize with mock data if no existing data
  if (!safeGetItem(STORAGE_KEYS.ORDERS)) {
    console.log('📦 No existing orders found, initializing with mock data');
    safeSetItem(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
  } else {
    console.log('✅ Existing orders found, preserving user data');
  }
  
  if (!safeGetItem(STORAGE_KEYS.PRODUCTS)) {
    console.log('📦 No existing products found, initializing with mock data');
    safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mockProducts));
  } else {
    console.log('✅ Existing products found, preserving user data');
  }
  
  if (!safeGetItem(STORAGE_KEYS.PRODUCT_LABELS)) {
    console.log('📦 No existing product labels found, initializing with defaults');
    safeSetItem(STORAGE_KEYS.PRODUCT_LABELS, JSON.stringify(defaultProductLabels));
  } else {
    console.log('✅ Existing product labels found, preserving user data');
  }
  
  if (!safeGetItem(STORAGE_KEYS.STATS)) {
    console.log('📦 No existing stats found, initializing with mock data');
    safeSetItem(STORAGE_KEYS.STATS, JSON.stringify(mockFloristStats));
  } else {
    console.log('✅ Existing stats found, preserving user data');
  }
  
  if (!safeGetItem(STORAGE_KEYS.STORES)) {
    console.log('📦 No existing stores found, initializing with mock data');
    safeSetItem(STORAGE_KEYS.STORES, JSON.stringify(mockStores));
  } else {
    console.log('✅ Existing stores found, preserving user data');
  }
  
  console.log('✅ Storage initialization complete - all user data preserved');
};

// Force refresh localStorage with latest mock data (use sparingly)
export const refreshMockData = () => {
  console.warn('⚠️  Force refreshing with mock data - this will overwrite user data!');
  safeSetItem(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
  safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mockProducts));
  safeSetItem(STORAGE_KEYS.PRODUCT_LABELS, JSON.stringify(defaultProductLabels));
  safeSetItem(STORAGE_KEYS.STATS, JSON.stringify(mockFloristStats));
  safeSetItem(STORAGE_KEYS.STORES, JSON.stringify(mockStores));
};

// Data backup and restore functions
export const createDataBackup = (): string => {
  const backup = {
    version: CURRENT_DATA_VERSION,
    timestamp: new Date().toISOString(),
    data: {
      auth: safeGetItem(STORAGE_KEYS.AUTH),
      orders: safeGetItem(STORAGE_KEYS.ORDERS),
      products: safeGetItem(STORAGE_KEYS.PRODUCTS),
      productLabels: safeGetItem(STORAGE_KEYS.PRODUCT_LABELS),
      stats: safeGetItem(STORAGE_KEYS.STATS),
      stores: safeGetItem(STORAGE_KEYS.STORES),
      shopifyMappingConfig: safeGetItem(STORAGE_KEYS.SHOPIFY_MAPPING_CONFIG),
      multiStoreWebhookConfigs: safeGetItem(STORAGE_KEYS.MULTI_STORE_WEBHOOK_CONFIGS),
      userPreferences: safeGetItem(STORAGE_KEYS.USER_PREFERENCES)
    }
  };
  return JSON.stringify(backup, null, 2);
};

export const restoreDataFromBackup = (backupJson: string): boolean => {
  try {
    const backup = JSON.parse(backupJson);
    
    if (!backup.data) {
      throw new Error('Invalid backup format');
    }
    
    // Restore all data
    Object.entries(backup.data).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        const storageKey = Object.values(STORAGE_KEYS).find(k => 
          k.includes(key.replace(/([A-Z])/g, '-$1').toLowerCase())
        );
        if (storageKey) {
          safeSetItem(storageKey, value);
        }
      }
    });
    
    console.log('✅ Data restored from backup successfully');
    return true;
  } catch (error) {
    console.error('❌ Error restoring data from backup:', error);
    return false;
  }
};

// Auth functions
export const getAuthState = (): AuthState => {
  const stored = safeGetItem(STORAGE_KEYS.AUTH);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing auth state:', error);
    }
  }
  return { user: null, isAuthenticated: false };
};

export const setAuthState = (authState: AuthState) => {
  safeSetItem(STORAGE_KEYS.AUTH, JSON.stringify(authState));
};

export const login = (email: string, password: string): User | null => {
  // Simple mock authentication
  const user = mockUsers.find(u => u.email === email);
  if (user && password === 'password') {
    const authState: AuthState = { user, isAuthenticated: true };
    setAuthState(authState);
    return user;
  }
  return null;
};

export const logout = () => {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};

// Stores functions
export const getStores = (): Store[] => {
  const stored = safeGetItem(STORAGE_KEYS.STORES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stores:', error);
    }
  }
  return [];
};

export const saveStores = (stores: Store[]) => {
  const success = safeSetItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  if (success) {
    console.log('✅ Stores saved successfully');
  } else {
    console.error('❌ Failed to save stores');
  }
};

// Product Labels functions
export const getProductLabels = (): ProductLabel[] => {
  const stored = safeGetItem(STORAGE_KEYS.PRODUCT_LABELS);
  if (stored) {
    try {
      const labels = JSON.parse(stored);
      return labels.map((label: any, index: number) => ({
        ...label,
        priority: label.priority ?? (index + 1), // Assign default priority if missing
        createdAt: new Date(label.createdAt)
      }));
    } catch (error) {
      console.error('Error parsing product labels:', error);
    }
  }
  return defaultProductLabels;
};

export const saveProductLabels = (labels: ProductLabel[]) => {
  const success = safeSetItem(STORAGE_KEYS.PRODUCT_LABELS, JSON.stringify(labels));
  if (success) {
    console.log('✅ Product labels saved successfully');
  } else {
    console.error('❌ Failed to save product labels');
  }
};

export const addProductLabel = (name: string, color: string, category: 'difficulty' | 'productType', priority: number): ProductLabel => {
  const labels = getProductLabels();
  const newLabel: ProductLabel = {
    id: Date.now().toString(),
    name,
    color,
    category,
    priority,
    createdAt: new Date()
  };
  labels.push(newLabel);
  saveProductLabels(labels);
  return newLabel;
};

export const deleteProductLabel = (labelId: string) => {
  const labels = getProductLabels();
  const updatedLabels = labels.filter(label => label.id !== labelId);
  saveProductLabels(updatedLabels);
  
  // Update products that use this label to use default
  const products = getProducts();
  const updatedProducts = products.map(product => {
    const deletedLabel = labels.find(l => l.id === labelId);
    if (deletedLabel) {
      if (product.difficultyLabel === deletedLabel.name) {
        product.difficultyLabel = 'Easy'; // Default difficulty
      }
      if (product.productTypeLabel === deletedLabel.name) {
        product.productTypeLabel = 'Bouquet'; // Default product type
      }
    }
    return product;
  });
  saveProducts(updatedProducts);
};

// Orders functions
export const getOrders = (): Order[] => {
  const stored = safeGetItem(STORAGE_KEYS.ORDERS);
  if (stored) {
    try {
      const orders = JSON.parse(stored);
      // Convert date strings back to Date objects
      return orders.map((order: any) => ({
        ...order,
        assignedAt: order.assignedAt ? new Date(order.assignedAt) : undefined,
        completedAt: order.completedAt ? new Date(order.completedAt) : undefined
      }));
    } catch (error) {
      console.error('Error parsing orders:', error);
    }
  }
  return [];
};

export const saveOrders = (orders: Order[]) => {
  const success = safeSetItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  if (success) {
    console.log('✅ Orders saved successfully');
  } else {
    console.error('❌ Failed to save orders');
  }
};

export const addOrders = (newOrders: Order[]) => {
  const existingOrders = getOrders();
  const updatedOrders = [...existingOrders, ...newOrders];
  saveOrders(updatedOrders);
};

export const updateOrderFromShopify = (shopifyOrder: Order) => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(order => order.shopifyId === shopifyOrder.shopifyId);
  
  if (orderIndex !== -1) {
    // Update existing order
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...shopifyOrder,
      // Preserve florist assignment and completion data
      assignedFloristId: orders[orderIndex].assignedFloristId,
      assignedAt: orders[orderIndex].assignedAt,
      completedAt: orders[orderIndex].completedAt,
      status: orders[orderIndex].status,
    };
  } else {
    // Add new order
    orders.push(shopifyOrder);
  }
  
  saveOrders(orders);
};

export const syncOrdersFromShopifyToStorage = async (
  store: Store, 
  accessToken: string, 
  date?: string,
  apiVersion?: string
) => {
  try {
    const { syncOrdersFromShopify } = await import('./shopifyApi');
    const shopifyOrders = await syncOrdersFromShopify(store, accessToken, date, apiVersion);
    
    // Update existing orders or add new ones
    for (const shopifyOrder of shopifyOrders) {
      updateOrderFromShopify(shopifyOrder);
    }
    
    return shopifyOrders;
  } catch (error) {
    console.error('Error syncing orders from Shopify:', error);
    throw error;
  }
};

export const getOrdersByDate = (date: string): Order[] => {
  const orders = getOrders();
  return orders.filter(order => order.date === date);
};

export const getOrdersByDateAndStore = (date: string, storeId?: string): Order[] => {
  const orders = getOrdersByDate(date);
  if (!storeId) return orders;
  return orders.filter(order => order.storeId === storeId);
};

export const getOrdersByDateStoreAndLabels = (
  date: string, 
  storeId?: string, 
  difficultyLabel?: string, 
  productTypeLabel?: string
): Order[] => {
  let orders = getOrdersByDate(date);
  
  if (storeId) {
    orders = orders.filter(order => order.storeId === storeId);
  }
  
  if (difficultyLabel) {
    orders = orders.filter(order => order.difficultyLabel === difficultyLabel);
  }
  
  if (productTypeLabel) {
    orders = orders.filter(order => order.productTypeLabel === productTypeLabel);
  }
  
  return orders;
};

export const assignOrder = (orderId: string, floristId: string) => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex !== -1) {
    if (floristId === 'unassigned') {
      // Unassign the order
      orders[orderIndex] = {
        ...orders[orderIndex],
        assignedFloristId: undefined,
        assignedAt: undefined,
        status: 'pending'
      };
    } else {
      // Assign to florist
      orders[orderIndex] = {
        ...orders[orderIndex],
        assignedFloristId: floristId,
        assignedAt: new Date(),
        status: 'assigned'
      };
    }
    saveOrders(orders);
  }
};

export const completeOrder = (orderId: string) => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    
    if (order.status === 'completed') {
      // Toggle back to previous status
      const previousStatus = order.assignedFloristId ? 'assigned' : 'pending';
      orders[orderIndex] = {
        ...order,
        status: previousStatus,
        completedAt: undefined
      };
    } else {
      // Mark as completed
      orders[orderIndex] = {
        ...order,
        status: 'completed',
        completedAt: new Date()
      };
    }
    
    saveOrders(orders);
  }
};

export const updateOrderRemarks = (orderId: string, remarks: string) => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex] = {
      ...orders[orderIndex],
      remarks
    };
    saveOrders(orders);
  }
};

export const updateProductCustomizations = (orderId: string, customizations: string) => {
  const orders = getOrders();
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex] = {
      ...orders[orderIndex],
      productCustomizations: customizations
    };
    saveOrders(orders);
  }
};

// Products functions
export const getProducts = (): Product[] => {
  const stored = safeGetItem(STORAGE_KEYS.PRODUCTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing products:', error);
    }
  }
  return [];
};

export const getProductsByStore = (storeId: string): Product[] => {
  const products = getProducts();
  return products.filter(product => product.storeId === storeId);
};

export const saveProducts = (products: Product[]) => {
  const success = safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  if (success) {
    console.log('✅ Products saved successfully');
  } else {
    console.error('❌ Failed to save products');
  }
};

export const updateProductDifficultyLabel = (productId: string, difficultyLabel: string) => {
  const products = getProducts();
  const productIndex = products.findIndex(product => product.id === productId);
  if (productIndex !== -1) {
    products[productIndex] = {
      ...products[productIndex],
      difficultyLabel: difficultyLabel
    };
    saveProducts(products);
    
    // Also update any existing orders with this product
    const orders = getOrders();
    const updatedOrders = orders.map(order => 
      order.productId === productId 
        ? { ...order, difficultyLabel }
        : order
    );
    saveOrders(updatedOrders);
  }
};

export const updateProductTypeLabel = (productId: string, productTypeLabel: string) => {
  const products = getProducts();
  const productIndex = products.findIndex(product => product.id === productId);
  if (productIndex !== -1) {
    products[productIndex] = {
      ...products[productIndex],
      productTypeLabel: productTypeLabel
    };
    saveProducts(products);
    
    // Also update any existing orders with this product
    const orders = getOrders();
    const updatedOrders = orders.map(order => 
      order.productId === productId 
        ? { ...order, productTypeLabel }
        : order
    );
    saveOrders(updatedOrders);
  }
};

// Users functions
export const getUsers = (): User[] => {
  return mockUsers;
};

export const getFlorists = (): User[] => {
  return mockUsers.filter(user => user.role === 'florist');
};

// Helper function to calculate completion rate accounting for batch processing
const calculateCompletionRate = (floristOrders: Order[]) => {
  if (floristOrders.length === 0) return 0;

  // Group orders by date to calculate daily work sessions
  const ordersByDate: { [date: string]: Order[] } = {};
  
  for (const order of floristOrders) {
    if (!ordersByDate[order.date]) {
      ordersByDate[order.date] = [];
    }
    ordersByDate[order.date].push(order);
  }

  let totalWorkTimeMinutes = 0;
  let totalOrdersCompleted = 0;

  // Calculate work time for each day
  for (const dayOrders of Object.values(ordersByDate)) {
    const ordersWithTimes = dayOrders.filter(order => order.assignedAt && order.completedAt);
    
    if (ordersWithTimes.length === 0) continue;

    // Find the earliest assignment time and latest completion time for the day
    const assignmentTimes = ordersWithTimes.map(order => order.assignedAt!.getTime());
    const completionTimes = ordersWithTimes.map(order => order.completedAt!.getTime());
    
    const earliestAssignment = Math.min(...assignmentTimes);
    const latestCompletion = Math.max(...completionTimes);
    
    // Total work time for the day (from first assignment to last completion)
    const dayWorkTime = (latestCompletion - earliestAssignment) / (1000 * 60); // Convert to minutes
    
    totalWorkTimeMinutes += dayWorkTime;
    totalOrdersCompleted += ordersWithTimes.length;
  }

  // Return average minutes per order
  return totalOrdersCompleted > 0 ? Math.round(totalWorkTimeMinutes / totalOrdersCompleted) : 0;
};

// Stats functions
export const getFloristStats = (): FloristStats[] => {
  const stored = safeGetItem(STORAGE_KEYS.STATS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing florist stats:', error);
    }
  }
  return [];
};

export const updateFloristStats = () => {
  const orders = getOrders();
  const florists = getFlorists();
  const stores = getStores();
  
  const stats: FloristStats[] = florists.map(florist => {
    const floristOrders = orders.filter(order => 
      order.assignedFloristId === florist.id && order.status === 'completed'
    );
    
    const completedOrders = floristOrders.length;
    const averageCompletionTime = calculateCompletionRate(floristOrders);
    
    // Calculate store breakdown using the same logic
    const storeBreakdown: { [storeId: string]: { orders: number; avgTime: number } } = {};
    
    for (const store of stores) {
      const storeOrders = floristOrders.filter(order => order.storeId === store.id);
      const storeOrderCount = storeOrders.length;
      const storeAvgTime = calculateCompletionRate(storeOrders);
      
      if (storeOrderCount > 0) {
        storeBreakdown[store.id] = {
          orders: storeOrderCount,
          avgTime: storeAvgTime
        };
      }
    }
    
    return {
      floristId: florist.id,
      floristName: florist.name,
      completedOrders,
      averageCompletionTime,
      storeBreakdown
    };
  });
  
  const success = safeSetItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  if (success) {
    console.log('✅ Florist stats updated successfully');
  } else {
    console.error('❌ Failed to update florist stats');
  }
  return stats;
};

// User preferences functions
export const getUserPreferences = (): any => {
  const stored = safeGetItem(STORAGE_KEYS.USER_PREFERENCES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing user preferences:', error);
    }
  }
  return {};
};

export const saveUserPreferences = (preferences: any) => {
  const success = safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  if (success) {
    console.log('✅ User preferences saved successfully');
  } else {
    console.error('❌ Failed to save user preferences');
  }
};

// Data integrity check
export const checkDataIntegrity = (): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  try {
    // Check if all required data exists
    const orders = getOrders();
    const products = getProducts();
    const stores = getStores();
    const labels = getProductLabels();
    
    if (orders.length === 0) issues.push('No orders found');
    if (products.length === 0) issues.push('No products found');
    if (stores.length === 0) issues.push('No stores found');
    if (labels.length === 0) issues.push('No product labels found');
    
    // Check data relationships
    const storeIds = stores.map(s => s.id);
    const orphanedOrders = orders.filter(o => !storeIds.includes(o.storeId));
    if (orphanedOrders.length > 0) {
      issues.push(`${orphanedOrders.length} orders reference non-existent stores`);
    }
    
    const orphanedProducts = products.filter(p => !storeIds.includes(p.storeId));
    if (orphanedProducts.length > 0) {
      issues.push(`${orphanedProducts.length} products reference non-existent stores`);
    }
    
  } catch (error) {
    issues.push(`Data integrity check failed: ${error}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

export const VERSION = '2.0.0-alpha.36';