import { mockUsers, mockStores, mockProducts, mockOrders, mockFloristStats } from './mockData';
import type { User, Store, Product, Order, FloristStats } from '../types';
import { getStores as getStoredStores } from '../utils/storage';

// Data Service Class for centralized data access
export class DataService {
  // Store Management
  static getStores(): Store[] {
    // Get stores from localStorage, fallback to mock data if none exist
    const storedStores = getStoredStores();
    return storedStores.length > 0 ? storedStores : mockStores;
  }

  static getStoreById(storeId: string): Store | undefined {
    return mockStores.find(store => store.id === storeId);
  }

  static getStoreByDomain(domain: string): Store | undefined {
    return mockStores.find(store => store.domain === domain);
  }

  // User Management
  static getUsers(): User[] {
    return mockUsers;
  }

  static getUsersByRole(role: 'admin' | 'florist'): User[] {
    return mockUsers.filter(user => user.role === role);
  }

  static getUserById(userId: string): User | undefined {
    return mockUsers.find(user => user.id === userId);
  }

  // Product Management
  static getProducts(storeId?: string): Product[] {
    if (storeId) {
      return mockProducts.filter(product => product.storeId === storeId);
    }
    return mockProducts;
  }

  static getProductById(productId: string): Product | undefined {
    return mockProducts.find(product => product.id === productId);
  }

  static getProductsByStore(storeId: string): Product[] {
    return mockProducts.filter(product => product.storeId === storeId);
  }

  static getProductsByDifficulty(difficulty: string, storeId?: string): Product[] {
    let products = mockProducts;
    if (storeId) {
      products = products.filter(product => product.storeId === storeId);
    }
    return products.filter(product => product.difficultyLabel === difficulty);
  }

  static getProductsByType(productType: string, storeId?: string): Product[] {
    let products = mockProducts;
    if (storeId) {
      products = products.filter(product => product.storeId === storeId);
    }
    return products.filter(product => product.productTypeLabel === productType);
  }

  // Order Management
  static getOrders(storeId?: string): Order[] {
    if (storeId) {
      return mockOrders.filter(order => order.storeId === storeId);
    }
    return mockOrders;
  }

  static getOrdersByDate(date: string, storeId?: string): Order[] {
    let orders = mockOrders.filter(order => order.date === date);
    if (storeId) {
      orders = orders.filter(order => order.storeId === storeId);
    }
    return orders;
  }

  static getOrdersByStatus(status: 'pending' | 'assigned' | 'completed', storeId?: string): Order[] {
    let orders = mockOrders.filter(order => order.status === status);
    if (storeId) {
      orders = orders.filter(order => order.storeId === storeId);
    }
    return orders;
  }

  static getOrdersByFlorist(floristId: string, storeId?: string): Order[] {
    let orders = mockOrders.filter(order => order.assignedFloristId === floristId);
    if (storeId) {
      orders = orders.filter(order => order.storeId === storeId);
    }
    return orders;
  }

  static getOrderById(orderId: string): Order | undefined {
    return mockOrders.find(order => order.id === orderId);
  }

  static getOrdersByStore(storeId: string): Order[] {
    return mockOrders.filter(order => order.storeId === storeId);
  }

  // Florist Stats Management
  static getFloristStats(storeId?: string): FloristStats[] {
    if (storeId) {
      return mockFloristStats.map(stat => ({
        ...stat,
        completedOrders: stat.storeBreakdown?.[storeId]?.orders || 0,
        averageCompletionTime: stat.storeBreakdown?.[storeId]?.avgTime || 0
      })).filter(stat => stat.completedOrders > 0);
    }
    return mockFloristStats;
  }

  static getFloristStatsById(floristId: string, storeId?: string): FloristStats | undefined {
    const stats = mockFloristStats.find(stat => stat.floristId === floristId);
    if (!stats) return undefined;

    if (storeId) {
      return {
        ...stats,
        completedOrders: stats.storeBreakdown?.[storeId]?.orders || 0,
        averageCompletionTime: stats.storeBreakdown?.[storeId]?.avgTime || 0
      };
    }
    return stats;
  }

  // Analytics and Reporting
  static getStoreAnalytics(storeId: string) {
    const storeOrders = this.getOrdersByStore(storeId);
    const storeProducts = this.getProductsByStore(storeId);
    
    return {
      totalOrders: storeOrders.length,
      pendingOrders: storeOrders.filter(o => o.status === 'pending').length,
      assignedOrders: storeOrders.filter(o => o.status === 'assigned').length,
      completedOrders: storeOrders.filter(o => o.status === 'completed').length,
      totalProducts: storeProducts.length,
      ordersByDifficulty: this.groupOrdersByDifficulty(storeOrders),
      ordersByProductType: this.groupOrdersByProductType(storeOrders),
      ordersByDeliveryType: this.groupOrdersByDeliveryType(storeOrders),
      floristPerformance: this.getFloristPerformanceByStore(storeId)
    };
  }

  static getMultiStoreAnalytics() {
    const stores = this.getStores();
    return stores.map(store => ({
      store,
      analytics: this.getStoreAnalytics(store.id)
    }));
  }

  // Helper methods for analytics
  private static groupOrdersByDifficulty(orders: Order[]) {
    return orders.reduce((acc, order) => {
      const difficulty = order.difficultyLabel;
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private static groupOrdersByProductType(orders: Order[]) {
    return orders.reduce((acc, order) => {
      const type = order.productTypeLabel;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private static groupOrdersByDeliveryType(orders: Order[]) {
    return orders.reduce((acc, order) => {
      const deliveryType = order.deliveryType || 'delivery';
      acc[deliveryType] = (acc[deliveryType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private static getFloristPerformanceByStore(storeId: string) {
    return mockFloristStats.map(stat => {
      const storeStats = stat.storeBreakdown?.[storeId];
      return {
        floristId: stat.floristId,
        floristName: stat.floristName,
        completedOrders: storeStats?.orders || 0,
        averageCompletionTime: storeStats?.avgTime || 0
      };
    }).filter(stat => stat.completedOrders > 0);
  }

  // Search and Filter functionality
  static searchOrders(query: string, storeId?: string): Order[] {
    let orders = mockOrders;
    if (storeId) {
      orders = orders.filter(order => order.storeId === storeId);
    }
    
    const lowerQuery = query.toLowerCase();
    return orders.filter(order => 
      order.productName.toLowerCase().includes(lowerQuery) ||
      order.productVariant.toLowerCase().includes(lowerQuery) ||
      order.id.toLowerCase().includes(lowerQuery) ||
      order.remarks.toLowerCase().includes(lowerQuery)
    );
  }

  static searchProducts(query: string, storeId?: string): Product[] {
    let products = mockProducts;
    if (storeId) {
      products = products.filter(product => product.storeId === storeId);
    }
    
    const lowerQuery = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.variant.toLowerCase().includes(lowerQuery) ||
      product.difficultyLabel.toLowerCase().includes(lowerQuery) ||
      product.productTypeLabel.toLowerCase().includes(lowerQuery)
    );
  }

  // Data validation helpers
  static validateStoreId(storeId: string): boolean {
    return mockStores.some(store => store.id === storeId);
  }

  static validateProductId(productId: string): boolean {
    return mockProducts.some(product => product.id === productId);
  }

  static validateOrderId(orderId: string): boolean {
    return mockOrders.some(order => order.id === orderId);
  }

  static validateUserId(userId: string): boolean {
    return mockUsers.some(user => user.id === userId);
  }
}

// Export individual data arrays for backward compatibility
export { mockUsers, mockStores, mockProducts, mockOrders, mockFloristStats };

// Export the DataService as default
export default DataService; 