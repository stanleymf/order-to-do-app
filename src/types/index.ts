export interface User {
  id: string;
  name: string;
  role: 'admin' | 'florist';
  email: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface Store {
  id: string;
  name: string;
  domain: string;
  color: string; // For visual identification
}

export interface ProductLabel {
  id: string;
  name: string;
  color: string; // For visual styling
  category: 'difficulty' | 'productType'; // Category of the label
  priority: number; // Custom priority for sorting (lower numbers = higher priority)
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  variant: string;
  difficultyLabel: string; // Difficulty level: Easy, Medium, Hard, Very Hard
  productTypeLabel: string; // Product type: Vase, Bouquet, etc.
  storeId: string;
  
  // Shopify-specific fields
  shopifyId?: string; // Shopify's product ID
  handle?: string; // Product handle/URL slug
  description?: string; // Product description
  productType?: string; // Shopify's product type
  vendor?: string; // Product vendor
  tags?: string[]; // Product tags
  status?: 'active' | 'archived' | 'draft'; // Product status
  publishedAt?: string; // Publication date
  createdAt?: string; // Creation date
  updatedAt?: string; // Last update date
  
  // Shopify variant fields
  variants?: ProductVariant[];
  
  // Shopify images
  images?: ProductImage[];
  
  // Shopify metafields for custom data
  metafields?: ProductMetafield[];
  
  // Custom florist-specific metadata
  floristMetadata?: {
    difficultyLevel?: string;
    estimatedTime?: number; // in minutes
    specialInstructions?: string;
    seasonalAvailability?: string[];
    materials?: string[];
  };
}

export interface ProductVariant {
  id: string;
  shopifyId?: string;
  title: string;
  sku?: string;
  price?: string;
  compareAtPrice?: string;
  inventoryQuantity?: number;
  weight?: number;
  weightUnit?: string;
  requiresShipping?: boolean;
  taxable?: boolean;
  barcode?: string;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  shopifyId?: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductMetafield {
  id: string;
  shopifyId?: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productVariant: string;
  timeslot: string;
  difficultyLabel: string; // Difficulty level inherited from product
  productTypeLabel: string; // Product type inherited from product
  remarks: string;
  productCustomizations?: string; // Admin customizations/instructions for the product
  assignedFloristId?: string;
  assignedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'assigned' | 'completed';
  date: string; // YYYY-MM-DD format
  storeId: string;
  deliveryType?: 'delivery' | 'collection' | 'express'; // Delivery method from Shopify tags
  
  // Shopify-specific fields
  shopifyId?: string; // Shopify's order ID
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  totalPrice?: string;
  currency?: string;
  fulfillmentStatus?: string;
  financialStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FloristStats {
  floristId: string;
  floristName: string;
  completedOrders: number;
  averageCompletionTime: number; // in minutes
  storeBreakdown?: { [storeId: string]: { orders: number; avgTime: number } };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type TimeFrame = 'daily' | 'weekly' | 'monthly';

export interface OrderDataMapping {
  id: string;
  name: string;
  description: string;
  orderCardProperty: OrderCardProperty;
  shopifySource: ShopifyOrderSource;
  transformationType?: 'none' | 'date_format' | 'currency_format' | 'text_transform' | 'custom_logic';
  transformationConfig?: {
    dateFormat?: string;
    currencySymbol?: string;
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
    customLogic?: string;
  };
  fallbackValue?: string;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCardProperty {
  key: string;
  label: string;
  type: 'text' | 'date' | 'currency' | 'status' | 'badge' | 'custom';
  required: boolean;
  displayOrder: number;
}

export interface ShopifyOrderSource {
  category: 'order' | 'customer' | 'line_items' | 'shipping_address' | 'billing_address' | 'tags' | 'properties';
  field: string;
  subField?: string;
  arrayIndex?: number;
  propertyName?: string;
}

export interface ShopifyOrderField {
  id: string;
  category: string;
  field: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  description: string;
  example?: string;
  subFields?: ShopifyOrderField[];
}