# Order To-Do App

A modern, multi-store order management application designed for florist businesses to efficiently manage orders across multiple Shopify stores.

## 🚀 **Version 2.0.0-alpha.3 - Multi-Store Webhook Management**

### **Multi-Store Webhook System - Phase 2 Implementation**

The application now features **advanced multi-store webhook management** with store-specific configurations and bulk operations.

#### **✅ Phase 2 Features (COMPLETE)**

- **🎯 Multi-Store Webhook Manager**: Store-specific webhook configurations
- **🏪 Individual Store Management**: Per-store webhook enable/disable
- **🔄 Bulk Operations**: Register/cleanup webhooks for all stores
- **📊 Status Monitoring**: Real-time webhook status with visual indicators
- **👑 Admin Controls**: Multi-store webhook management for admin users
- **💾 Persistent Storage**: Store configurations saved in localStorage

#### **🔧 Technical Implementation**

- **MultiStoreWebhookManager Class**: Store-specific webhook operations
- **StoreWebhookConfig Interface**: Individual store configurations
- **Bulk Operations**: Efficient multi-store webhook management
- **Status Dashboard**: Visual webhook completion indicators
- **Legacy Support**: Original single-store webhook system maintained

### **Multi-Store Architecture - Phase 1 Implementation**

The application supports **multi-store functionality** with a complete data structure migration and store management system.

#### **✅ Phase 1 Features (COMPLETE)**

- **🎯 Data Service Layer**: Centralized data access with store-specific filtering
- **🏪 Store Context Management**: Global store state with React context
- **🎨 Store Selection UI**: Desktop dropdown and mobile indicator components
- **📊 Store-Specific Analytics**: Filtered analytics by current store
- **📱 Mobile Experience**: Responsive store selection and display
- **🔒 Type Safety**: Complete TypeScript coverage for multi-store operations

#### **🔧 Technical Implementation**

- **DataService Class**: Comprehensive data access layer
- **StoreProvider Context**: Global store state management
- **StoreSelector Component**: Desktop store selection interface
- **StoreIndicator Component**: Mobile store display
- **Enhanced Analytics**: Store-specific reporting and metrics

## 🏗️ **Architecture Overview**

### **Multi-Store Webhook Management**
- **Store-Specific Configurations**: Each store has independent webhook settings
- **Individual API Credentials**: Separate access tokens and shop domains per store
- **Bulk Operations**: Manage webhooks for all stores simultaneously
- **Status Monitoring**: Real-time webhook status per store
- **Admin-Only Access**: Multi-store webhook features for admin users

### **Multi-Store Support**
- **Store Isolation**: Each store has independent data and settings
- **Unified Interface**: Single application manages multiple stores
- **Store Switching**: Seamless switching between stores
- **Visual Identification**: Color-coded store indicators

### **Data Structure**
```typescript
interface Store {
  id: string;
  name: string;
  domain: string;
  color: string;
}

interface StoreWebhookConfig {
  storeId: string;
  storeName: string;
  accessToken: string;
  shopDomain: string;
  apiVersion: string;
  webhookSecret?: string;
  enabled: boolean;
}

interface Order {
  id: string;
  storeId: string; // Multi-store support
  // ... other fields
}
```

### **Store Context**
```typescript
const { currentStore, allStores, setCurrentStoreById } = useStore();
const { orders, products, floristStats } = useStoreData();
```

## 🎯 **Core Features**

### **Multi-Store Webhook Management**
- **Store-Specific Webhooks**: Individual webhook configurations per store
- **Bulk Operations**: Register/cleanup webhooks for all stores simultaneously
- **Status Monitoring**: Real-time webhook status with visual indicators
- **Admin Interface**: Multi-store webhook management for admin users
- **Persistent Configs**: Store webhook settings saved in localStorage
- **Legacy Support**: Original single-store webhook system maintained

### **Order Management**
- **Multi-Store Orders**: View and manage orders from all stores
- **Store Filtering**: Filter orders by specific store
- **Real-time Updates**: Live order synchronization
- **Batch Operations**: Assign multiple orders at once
- **Search & Filter**: Advanced search across all order fields

### **Analytics Dashboard**
- **Store-Specific Metrics**: Performance data by store
- **Florist Performance**: Individual florist statistics
- **Order Trends**: Historical order analysis
- **Completion Rates**: Store and florist efficiency metrics

### **Product Management**
- **Store Products**: Manage products per store
- **Difficulty Labels**: Product complexity classification
- **Product Types**: Categorization system
- **Bulk Operations**: Mass product updates

### **Settings & Configuration**
- **Store Management**: Add, edit, and remove stores
- **API Configuration**: Shopify API settings per store
- **Multi-Store Webhook Management**: Advanced webhook management for multiple stores
- **Legacy Webhook Management**: Original single-store webhook system
- **User Management**: Role-based access control

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- pnpm package manager
- Shopify store with API access

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd order-to-do-app

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### **Configuration**
1. **Shopify API Setup**: Configure API credentials in Settings
2. **Store Management**: Add your Shopify stores
3. **Multi-Store Webhook Setup**: Configure webhooks for each store
4. **Bulk Webhook Registration**: Set up automated order sync for all stores
5. **User Roles**: Configure admin and florist accounts

## 📱 **Mobile Support**

The application is fully responsive with:
- **Mobile-First Design**: Optimized for mobile devices
- **Touch-Friendly Interface**: Gesture-based interactions
- **Compact Store Indicator**: Mobile-optimized store display
- **Responsive Analytics**: Mobile-friendly dashboard
- **Mobile Webhook Management**: Touch-friendly webhook interface

## 🔧 **Development**

### **Tech Stack**
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Lucide React icons
- **State Management**: React Context, Custom hooks
- **Build Tool**: Vite
- **Package Manager**: pnpm

### **Project Structure**
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── StoreSelector.tsx
│   ├── StoreIndicator.tsx
│   ├── MultiStoreWebhookManager.tsx
│   └── ...
├── contexts/           # React contexts
│   └── StoreContext.tsx
├── data/              # Data layer
│   ├── index.ts       # DataService class
│   └── mockData.ts    # Mock data
├── types/             # TypeScript definitions
├── utils/             # Utility functions
│   ├── multiStoreWebhooks.ts
│   └── shopifyWebhooks.ts
└── App.tsx           # Main application
```

### **Key Components**

#### **MultiStoreWebhookManager**
Advanced webhook management component for multiple stores with bulk operations.

#### **StoreSelector**
Desktop component for switching between stores with dropdown interface.

#### **StoreIndicator**
Mobile component showing current store with compact display.

#### **DataService**
Centralized data access layer with store-specific operations.

#### **StoreContext**
Global state management for store selection and data.

## 🎨 **UI/UX Features**

### **Multi-Store Webhook Interface**
- **Store Configuration Form**: Add webhook settings for each store
- **Individual Store Management**: Enable/disable webhooks per store
- **Bulk Action Buttons**: Register all stores, cleanup all stores
- **Status Badges**: Complete, Partial, None indicators
- **Error Reporting**: Detailed error logs per store

### **Store Visualization**
- **Color-Coded Stores**: Each store has a unique color
- **Visual Indicators**: Store colors throughout the interface
- **Smooth Transitions**: Animated store switching
- **Responsive Design**: Adapts to all screen sizes

### **User Experience**
- **Intuitive Navigation**: Clear store selection and switching
- **Real-time Updates**: Live data synchronization
- **Error Handling**: Graceful error states and recovery
- **Loading States**: Smooth loading indicators

## 🔒 **Security & Performance**

### **Security Features**
- **Type Safety**: Complete TypeScript coverage
- **Data Validation**: Input validation throughout
- **Error Boundaries**: Graceful error handling
- **Secure API**: Shopify API integration with validation
- **Webhook Verification**: HMAC-SHA256 signature verification
- **Store-Specific Credentials**: Individual API access per store

### **Performance Optimizations**
- **Efficient Filtering**: Store-specific data operations
- **Context Optimization**: Minimal re-renders
- **Lazy Loading**: On-demand data loading
- **Caching**: Optimized data caching strategies
- **Bulk Operations**: Efficient multi-store webhook management

## 📊 **Analytics & Reporting**

### **Store Analytics**
- **Order Metrics**: Total, pending, assigned, completed orders
- **Performance Tracking**: Completion times and rates
- **Florist Statistics**: Individual performance metrics
- **Store Comparison**: Cross-store performance analysis

### **Webhook Analytics**
- **Webhook Status**: Real-time webhook completion status
- **Store Coverage**: Webhook registration status per store
- **Error Tracking**: Detailed webhook error reporting
- **Performance Metrics**: Webhook operation efficiency

### **Data Visualization**
- **Charts & Graphs**: Visual data representation
- **Real-time Updates**: Live metric updates
- **Mobile Dashboards**: Responsive analytics display
- **Export Capabilities**: Data export functionality

## 🚀 **Roadmap**

### **Phase 2: Enhanced UI/UX** (Next)
- Advanced store management interface
- Enhanced mobile experience
- Improved analytics visualization
- Store-specific theming

### **Phase 3: Advanced Features** (Planned)
- Multi-store order management
- Advanced webhook management
- Real-time notifications
- Advanced reporting

### **Phase 4: Enterprise Features** (Future)
- Multi-tenant architecture
- Advanced security features
- API integrations
- Enterprise analytics

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 **Support**

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the changelog for updates

---

**Built with ❤️ for florist businesses** 