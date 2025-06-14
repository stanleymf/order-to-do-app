# 🏪 Multi-Store Upgrade Plan - Order To-Do App v2.0.0

## 📋 **Overview**

This document outlines the major upgrade required to support multiple Shopify stores with proper isolation, individual configurations, and unified order management.

## 🎯 **Goals**

1. **Multi-Store Support**: Handle unlimited Shopify stores
2. **Store Isolation**: Each store has its own configuration and data
3. **Unified Interface**: Single dashboard for all stores
4. **Individual Settings**: Per-store API and mapping configurations
5. **Scalable Architecture**: Support for growing business needs

## 🏗️ **Architecture Changes**

### **1. Store Management System**

#### **Store Configuration Structure**
```typescript
interface Store {
  id: string;                    // Unique store identifier
  name: string;                  // Display name
  domain: string;               // shop.myshopify.com
  accessToken: string;          // Store-specific API token
  apiVersion: string;           // Shopify API version
  webhookSecret?: string;       // Store-specific webhook secret
  color: string;                // Brand color for UI
  isActive: boolean;            // Enable/disable store
  createdAt: string;
  updatedAt: string;
  
  // Store-specific settings
  settings: {
    autoSync: boolean;
    syncInterval: number;
    orderMapping: OrderMappingConfig;
    productMapping: ProductMappingConfig;
  };
}
```

#### **Order Structure Enhancement**
```typescript
interface Order {
  id: string;
  storeId: string;              // NEW: Link to specific store
  shopifyId: string;            // Shopify order ID
  storeName: string;            // NEW: Store name for display
  // ... existing fields
}
```

### **2. Settings Interface Evolution**

#### **Current Settings (v1.x)**
- Single Shopify API configuration
- Global mapping settings
- One webhook secret

#### **New Settings (v2.0)**
- **Store Management Tab**: Add, edit, remove stores
- **Per-Store Configuration**: Individual API and mapping settings
- **Store Overview**: Status, sync history, webhook health
- **Bulk Operations**: Sync all stores, manage all webhooks

### **3. Order Tab Enhancements**

#### **Current Order Tab**
- All orders in one list
- Store filter (basic)
- No store-specific features

#### **New Order Tab (v2.0)**
- **Store Tabs**: Separate tabs for each store
- **Unified View**: Combined view of all stores
- **Store Indicators**: Visual store identification
- **Store-Specific Actions**: Sync, manage per store
- **Advanced Filtering**: Filter by store, date range, status

## 🔧 **Implementation Plan**

### **Phase 1: Data Structure Migration**

#### **1.1 Update Type Definitions**
```typescript
// src/types/index.ts
export interface Store {
  id: string;
  name: string;
  domain: string;
  accessToken: string;
  apiVersion: string;
  webhookSecret?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: StoreSettings;
}

export interface StoreSettings {
  autoSync: boolean;
  syncInterval: number;
  orderMapping: OrderMappingConfig;
  productMapping: ProductMappingConfig;
}

export interface Order {
  id: string;
  storeId: string;              // NEW
  storeName: string;            // NEW
  shopifyId: string;
  // ... existing fields
}
```

#### **1.2 Storage Migration**
```typescript
// Migrate existing single-store config to multi-store
const migrateToMultiStore = () => {
  const existingConfig = localStorage.getItem('shopify-mapping-config');
  if (existingConfig) {
    const config = JSON.parse(existingConfig);
    
    // Create default store
    const defaultStore: Store = {
      id: 'default-store',
      name: 'Default Store',
      domain: config.api.shopDomain || '',
      accessToken: config.api.accessToken || '',
      apiVersion: config.api.apiVersion || '2024-10',
      webhookSecret: config.api.webhookSecret || '',
      color: '#FF6B6B',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        autoSync: config.api.autoSync || true,
        syncInterval: config.api.syncInterval || 60,
        orderMapping: {
          // Migrate existing mapping config
          orderIdSource: config.orderIdSource || 'order_name',
          productNameSource: config.productNameSource || 'line_item_title',
          // ... other mappings
        },
        productMapping: {
          // Product-specific mappings
        }
      }
    };
    
    // Save new multi-store structure
    localStorage.setItem('stores', JSON.stringify([defaultStore]));
    localStorage.setItem('orders', JSON.stringify([]));
  }
};
```

### **Phase 2: Store Management Interface**

#### **2.1 Store Management Component**
```typescript
// src/components/StoreManagement.tsx
export function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  return (
    <div className="space-y-6">
      {/* Store List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map(store => (
          <StoreCard 
            key={store.id}
            store={store}
            onSelect={() => setSelectedStore(store)}
            onEdit={() => handleEditStore(store)}
            onDelete={() => handleDeleteStore(store)}
          />
        ))}
        
        {/* Add New Store */}
        <AddStoreCard onAdd={handleAddStore} />
      </div>
      
      {/* Store Configuration */}
      {selectedStore && (
        <StoreConfiguration 
          store={selectedStore}
          onSave={handleSaveStore}
          onTest={handleTestStore}
        />
      )}
    </div>
  );
}
```

#### **2.2 Store Configuration Component**
```typescript
// src/components/StoreConfiguration.tsx
export function StoreConfiguration({ store, onSave, onTest }) {
  const [config, setConfig] = useState(store.settings);
  
  return (
    <div className="space-y-6">
      {/* Store Info */}
      <StoreInfoSection store={store} />
      
      {/* API Configuration */}
      <APIConfigSection 
        store={store}
        onUpdate={(updates) => setConfig({...config, ...updates})}
      />
      
      {/* Order Mapping */}
      <OrderMappingSection 
        config={config.orderMapping}
        onUpdate={(mapping) => setConfig({
          ...config, 
          orderMapping: mapping
        })}
      />
      
      {/* Product Mapping */}
      <ProductMappingSection 
        config={config.productMapping}
        onUpdate={(mapping) => setConfig({
          ...config, 
          productMapping: mapping
        })}
      />
      
      {/* Webhook Management */}
      <WebhookManagementSection store={store} />
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => onTest(store)}>Test Connection</Button>
        <Button onClick={() => onSave({...store, settings: config})}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
```

### **Phase 3: Enhanced Order Management**

#### **3.1 Multi-Store Order View**
```typescript
// src/components/OrdersView.tsx
export function OrdersView() {
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'unified' | 'separate'>('unified');
  
  const filteredOrders = useMemo(() => {
    if (selectedStore === 'all') return orders;
    return orders.filter(order => order.storeId === selectedStore);
  }, [orders, selectedStore]);
  
  return (
    <div className="space-y-6">
      {/* Store Selection */}
      <StoreSelector 
        stores={stores}
        selectedStore={selectedStore}
        onSelect={setSelectedStore}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {/* Orders Display */}
      {viewMode === 'unified' ? (
        <UnifiedOrdersView orders={filteredOrders} />
      ) : (
        <SeparateOrdersView stores={stores} orders={orders} />
      )}
    </div>
  );
}
```

#### **3.2 Store Selector Component**
```typescript
// src/components/StoreSelector.tsx
export function StoreSelector({ stores, selectedStore, onSelect, viewMode, onViewModeChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      {/* Store Tabs */}
      <div className="flex space-x-1">
        <button
          className={`px-4 py-2 rounded-lg ${
            selectedStore === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => onSelect('all')}
        >
          All Stores ({orders.length})
        </button>
        
        {stores.map(store => (
          <button
            key={store.id}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              selectedStore === store.id 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => onSelect(store.id)}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: store.color }}
            />
            {store.name} ({getStoreOrderCount(store.id)})
          </button>
        ))}
      </div>
      
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">View:</span>
        <button
          className={`px-3 py-1 rounded ${
            viewMode === 'unified' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => onViewModeChange('unified')}
        >
          Unified
        </button>
        <button
          className={`px-3 py-1 rounded ${
            viewMode === 'separate' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => onViewModeChange('separate')}
        >
          Separate
        </button>
      </div>
    </div>
  );
}
```

### **Phase 4: Enhanced Webhook Management**

#### **4.1 Multi-Store Webhook Manager**
```typescript
// src/utils/multiStoreWebhookManager.ts
export class MultiStoreWebhookManager {
  private stores: Store[];
  
  constructor(stores: Store[]) {
    this.stores = stores;
  }
  
  // Register webhooks for all stores
  async registerAllWebhooks(): Promise<WebhookResult[]> {
    const results: WebhookResult[] = [];
    
    for (const store of this.stores) {
      if (!store.isActive) continue;
      
      try {
        const manager = new ShopifyWebhookManager(store);
        const result = await manager.autoRegisterWebhooks();
        results.push({
          storeId: store.id,
          storeName: store.name,
          success: result.errors.length === 0,
          registered: result.registered.length,
          existing: result.existing.length,
          errors: result.errors
        });
      } catch (error) {
        results.push({
          storeId: store.id,
          storeName: store.name,
          success: false,
          registered: 0,
          existing: 0,
          errors: [error.message]
        });
      }
    }
    
    return results;
  }
  
  // Test connectivity for all stores
  async testAllConnectivity(): Promise<ConnectivityResult[]> {
    const results: ConnectivityResult[] = [];
    
    for (const store of this.stores) {
      if (!store.isActive) continue;
      
      try {
        const manager = new ShopifyWebhookManager(store);
        const isAccessible = await manager.testWebhookConnectivity();
        results.push({
          storeId: store.id,
          storeName: store.name,
          accessible: isAccessible,
          error: null
        });
      } catch (error) {
        results.push({
          storeId: store.id,
          storeName: store.name,
          accessible: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}
```

## 🎨 **UI/UX Enhancements**

### **1. Navigation Updates**
- **Settings Tab**: Split into "Store Management" and "Global Settings"
- **Order Tab**: Enhanced with store selection and view modes
- **Store Indicators**: Color-coded store identification throughout the app

### **2. Visual Improvements**
- **Store Cards**: Individual cards for each store with status indicators
- **Order Cards**: Store badges and color coding
- **Dashboard**: Multi-store overview with key metrics
- **Responsive Design**: Mobile-friendly multi-store interface

### **3. User Experience**
- **Store Switching**: Easy switching between stores
- **Bulk Operations**: Sync all stores, manage all webhooks
- **Store Status**: Real-time status indicators for each store
- **Error Handling**: Store-specific error reporting

## 🔄 **Migration Strategy**

### **1. Backward Compatibility**
- Migrate existing single-store configuration
- Preserve existing orders and settings
- Gradual rollout with feature flags

### **2. Data Migration**
- Convert existing config to multi-store format
- Update existing orders with store information
- Preserve webhook registrations

### **3. User Onboarding**
- Guided setup for first multi-store configuration
- Help documentation for store management
- Video tutorials for common operations

## 📊 **Benefits of Multi-Store Architecture**

### **1. Business Benefits**
- **Scalability**: Handle unlimited stores
- **Flexibility**: Different configurations per store
- **Efficiency**: Unified management interface
- **Growth**: Easy addition of new stores

### **2. Technical Benefits**
- **Isolation**: Store-specific data and settings
- **Performance**: Optimized per-store operations
- **Maintenance**: Easier troubleshooting and updates
- **Security**: Store-specific API credentials

### **3. User Benefits**
- **Unified View**: Single dashboard for all stores
- **Customization**: Per-store configurations
- **Efficiency**: Bulk operations across stores
- **Clarity**: Clear store identification and separation

## 🚀 **Implementation Timeline**

### **Week 1-2: Foundation**
- Update type definitions
- Create store management components
- Implement data migration

### **Week 3-4: Core Features**
- Multi-store order management
- Enhanced webhook management
- Store configuration interface

### **Week 5-6: Polish & Testing**
- UI/UX improvements
- Testing and bug fixes
- Documentation and tutorials

### **Week 7: Deployment**
- Gradual rollout
- User onboarding
- Monitoring and support

## 🎯 **Success Metrics**

### **1. Technical Metrics**
- Webhook delivery success rate per store
- API response times
- Error rates by store
- Sync performance

### **2. User Metrics**
- Store adoption rate
- Feature usage statistics
- User satisfaction scores
- Support ticket reduction

### **3. Business Metrics**
- Number of stores managed
- Order processing efficiency
- Time saved per operation
- User retention rates

---

This upgrade will transform the Order To-Do App into a powerful multi-store management platform, ready to scale with your business growth. 