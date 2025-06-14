import type { Product, ProductVariant, ProductImage, ProductMetafield, Store, Order } from '../types';

// Shopify mapping configuration interface
interface ShopifyMappingConfig {
  // API Configuration
  api: {
    accessToken: string;
    shopDomain: string;
    apiVersion: string;
    webhookSecret?: string;
    autoSync: boolean;
    syncInterval: number;
  };
  
  // Date mapping
  dateSource: 'tags' | 'created_at' | 'custom_field';
  dateTagPattern: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  
  // Timeslot mapping
  timeslotSource: 'tags' | 'line_item_properties' | 'order_note';
  timeslotTagPattern: string;
  timeslotFormat: 'HH:MM-HH:MM' | 'HH:MM AM/PM-HH:MM AM/PM' | 'HAM/PM-HAM/PM';
  
  // Delivery type mapping
  deliveryTypeSource: 'tags' | 'line_item_properties' | 'order_note';
  deliveryTypeKeywords: {
    delivery: string[];
    collection: string[];
    express: string[];
  };
  
  // Instructions mapping
  instructionsSource: 'line_item_properties' | 'order_note' | 'both';
  instructionsPropertyName: string;
  instructionsKeywords: string[];
  
  // Customizations mapping
  customizationsSource: 'line_item_properties' | 'order_note' | 'both';
  excludeProperties: string[];
  
  // Customer info mapping
  customerNameFormat: 'first_last' | 'last_first' | 'full_name';
  includeCustomerPhone: boolean;
  includeCustomerEmail: boolean;
}

// Utility function to migrate old configuration format to new format
function migrateConfig(oldConfig: any): ShopifyMappingConfig {
  // If the config already has the api property, return it as is
  if (oldConfig.api) {
    return oldConfig;
  }

  // Migrate old config to new format
  return {
    // API Configuration (new)
    api: {
      accessToken: '',
      shopDomain: '',
      apiVersion: '2024-01',
      webhookSecret: '',
      autoSync: true,
      syncInterval: 60
    },
    
    // Date mapping
    dateSource: oldConfig.dateSource || 'tags',
    dateTagPattern: oldConfig.dateTagPattern || '(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})',
    dateFormat: oldConfig.dateFormat || 'DD/MM/YYYY',
    
    // Timeslot mapping
    timeslotSource: oldConfig.timeslotSource || 'tags',
    timeslotTagPattern: oldConfig.timeslotTagPattern || '(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})',
    timeslotFormat: oldConfig.timeslotFormat || 'HH:MM-HH:MM',
    
    // Delivery type mapping
    deliveryTypeSource: oldConfig.deliveryTypeSource || 'tags',
    deliveryTypeKeywords: oldConfig.deliveryTypeKeywords || {
      delivery: ['delivery', 'deliver'],
      collection: ['collection', 'pickup', 'collect'],
      express: ['express', 'urgent', 'rush']
    },
    
    // Instructions mapping
    instructionsSource: oldConfig.instructionsSource || 'line_item_properties',
    instructionsPropertyName: oldConfig.instructionsPropertyName || 'Special Instructions',
    instructionsKeywords: oldConfig.instructionsKeywords || ['instruction', 'note', 'special', 'request', 'preference'],
    
    // Customizations mapping
    customizationsSource: oldConfig.customizationsSource || 'line_item_properties',
    excludeProperties: oldConfig.excludeProperties || ['Delivery Time', 'Special Instructions', 'delivery', 'time', 'instruction', 'note', 'special'],
    
    // Customer info mapping
    customerNameFormat: oldConfig.customerNameFormat || 'first_last',
    includeCustomerPhone: oldConfig.includeCustomerPhone !== undefined ? oldConfig.includeCustomerPhone : true,
    includeCustomerEmail: oldConfig.includeCustomerEmail !== undefined ? oldConfig.includeCustomerEmail : true
  };
}

// Utility function to load mapping configuration
export function loadMappingConfig(): ShopifyMappingConfig {
  try {
    const savedConfig = localStorage.getItem('shopify-mapping-config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      const migratedConfig = migrateConfig(parsedConfig);
      
      // Save the migrated config back to localStorage
      if (migratedConfig !== parsedConfig) {
        localStorage.setItem('shopify-mapping-config', JSON.stringify(migratedConfig));
      }
      
      return migratedConfig;
    }
  } catch (error) {
    console.error('Error loading mapping config:', error);
  }
  
  // Return default configuration
  return {
    // API Configuration
    api: {
      accessToken: '',
      shopDomain: '',
      apiVersion: '2024-01',
      webhookSecret: '',
      autoSync: true,
      syncInterval: 60
    },
    
    // Date mapping
    dateSource: 'tags',
    dateTagPattern: '(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})',
    dateFormat: 'DD/MM/YYYY',
    
    // Timeslot mapping
    timeslotSource: 'tags',
    timeslotTagPattern: '(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})',
    timeslotFormat: 'HH:MM-HH:MM',
    
    // Delivery type mapping
    deliveryTypeSource: 'tags',
    deliveryTypeKeywords: {
      delivery: ['delivery', 'deliver'],
      collection: ['collection', 'pickup', 'collect'],
      express: ['express', 'urgent', 'rush']
    },
    
    // Instructions mapping
    instructionsSource: 'line_item_properties',
    instructionsPropertyName: 'Special Instructions',
    instructionsKeywords: ['instruction', 'note', 'special', 'request', 'preference'],
    
    // Customizations mapping
    customizationsSource: 'line_item_properties',
    excludeProperties: ['Delivery Time', 'Special Instructions', 'delivery', 'time', 'instruction', 'note', 'special'],
    
    // Customer info mapping
    customerNameFormat: 'first_last',
    includeCustomerPhone: true,
    includeCustomerEmail: true
  };
}

// Shopify API configuration
interface ShopifyConfig {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
}

// Shopify API response types
interface ShopifyProductResponse {
  product: {
    id: number;
    title: string;
    handle: string;
    body_html: string;
    product_type: string;
    vendor: string;
    tags: string;
    status: string;
    published_at: string;
    created_at: string;
    updated_at: string;
    variants: ShopifyVariantResponse[];
    images: ShopifyImageResponse[];
    metafields: ShopifyMetafieldResponse[];
  };
}

interface ShopifyProductsResponse {
  products: ShopifyProductResponse['product'][];
}

interface ShopifyVariantResponse {
  id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
  requires_shipping: boolean;
  taxable: boolean;
  barcode: string;
}

interface ShopifyImageResponse {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface ShopifyMetafieldResponse {
  id: number;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

// Shopify order response types
interface ShopifyOrderResponse {
  order: {
    id: number;
    name: string; // Order name (e.g., "#1001")
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
    processed_at: string;
    fulfillment_status: string;
    financial_status: string;
    total_price: string;
    subtotal_price: string;
    total_tax: string;
    currency: string;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    line_items: ShopifyLineItemResponse[];
    shipping_address?: {
      address1: string;
      address2: string;
      city: string;
      province: string;
      country: string;
      zip: string;
    };
    note: string;
    tags: string;
  };
}

interface ShopifyLineItemResponse {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  variant_title: string;
  quantity: number;
  sku: string;
  price: string;
  total_discount: string;
  fulfillment_status: string;
  properties: Array<{
    name: string;
    value: string;
  }>;
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrderResponse['order'][];
}

// Shopify API service class
export class ShopifyApiService {
  private config: ShopifyConfig;

  constructor(store: Store, accessToken: string, apiVersion: string = '2024-01') {
    this.config = {
      storeDomain: store.domain,
      accessToken,
      apiVersion
    };
  }

  private getBaseUrl(): string {
    return `https://${this.config.storeDomain}/admin/api/${this.config.apiVersion}`;
  }

  // Make API call through backend proxy
  private async makeApiCall(url: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      const response = await fetch('/api/shopify/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          accessToken: this.config.accessToken,
          method,
          body
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error making Shopify API call:', error);
      throw error;
    }
  }

  // Fetch all products from Shopify
  async fetchProducts(limit: number = 250): Promise<Product[]> {
    try {
      const url = `${this.getBaseUrl()}/products.json?limit=${limit}`;
      const data: ShopifyProductsResponse = await this.makeApiCall(url);
      return data.products.map(product => this.mapShopifyProductToLocal(product));
    } catch (error) {
      console.error('Error fetching products from Shopify:', error);
      throw error;
    }
  }

  // Fetch a single product by Shopify ID
  async fetchProduct(shopifyId: string): Promise<Product | null> {
    try {
      const url = `${this.getBaseUrl()}/products/${shopifyId}.json`;
      const data: ShopifyProductResponse = await this.makeApiCall(url);
      return this.mapShopifyProductToLocal(data.product);
    } catch (error) {
      console.error('Error fetching product from Shopify:', error);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Update product metafields for florist-specific data
  async updateProductMetafields(
    shopifyId: string, 
    metafields: Array<{ namespace: string; key: string; value: string; type: string }>
  ): Promise<void> {
    try {
      const url = `${this.getBaseUrl()}/products/${shopifyId}/metafields.json`;
      
      for (const metafield of metafields) {
        await this.makeApiCall(url, 'POST', { metafield });
      }
    } catch (error) {
      console.error('Error updating product metafields:', error);
      throw error;
    }
  }

  // Map Shopify product response to local Product interface
  private mapShopifyProductToLocal(shopifyProduct: ShopifyProductResponse['product']): Product {
    const firstVariant = shopifyProduct.variants[0];

    return {
      id: `shopify-${shopifyProduct.id}`,
      name: shopifyProduct.title,
      variant: firstVariant?.title || '',
      difficultyLabel: 'Medium', // Default difficulty
      productTypeLabel: 'Bouquet', // Default product type
      storeId: '', // Will be set by the calling function
      shopifyId: shopifyProduct.id.toString(),
      handle: shopifyProduct.handle,
      description: shopifyProduct.body_html,
      productType: shopifyProduct.product_type,
      vendor: shopifyProduct.vendor,
      status: shopifyProduct.status as 'active' | 'archived' | 'draft',
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(tag => tag.trim()) : [],
      publishedAt: shopifyProduct.published_at,
      createdAt: shopifyProduct.created_at,
      updatedAt: shopifyProduct.updated_at,
      variants: shopifyProduct.variants.map(this.mapShopifyVariantToLocal),
      images: shopifyProduct.images.map(this.mapShopifyImageToLocal),
      metafields: shopifyProduct.metafields.map(this.mapShopifyMetafieldToLocal),
    };
  }

  // Map Shopify variant response to local ProductVariant interface
  private mapShopifyVariantToLocal(shopifyVariant: ShopifyVariantResponse): ProductVariant {
    return {
      id: shopifyVariant.id.toString(),
      title: shopifyVariant.title,
      sku: shopifyVariant.sku,
      price: shopifyVariant.price,
      compareAtPrice: shopifyVariant.compare_at_price,
      inventoryQuantity: shopifyVariant.inventory_quantity,
      weight: shopifyVariant.weight,
      weightUnit: shopifyVariant.weight_unit,
      requiresShipping: shopifyVariant.requires_shipping,
      taxable: shopifyVariant.taxable,
      barcode: shopifyVariant.barcode,
    };
  }

  // Map Shopify image response to local ProductImage interface
  private mapShopifyImageToLocal(shopifyImage: ShopifyImageResponse): ProductImage {
    return {
      id: shopifyImage.id.toString(),
      src: shopifyImage.src,
      alt: shopifyImage.alt,
      width: shopifyImage.width,
      height: shopifyImage.height,
    };
  }

  // Map Shopify metafield response to local ProductMetafield interface
  private mapShopifyMetafieldToLocal(shopifyMetafield: ShopifyMetafieldResponse): ProductMetafield {
    return {
      id: shopifyMetafield.id.toString(),
      namespace: shopifyMetafield.namespace,
      key: shopifyMetafield.key,
      value: shopifyMetafield.value,
      type: shopifyMetafield.type,
    };
  }

  // Extract delivery information from order tags
  private extractDeliveryInfoFromTags(orderTags: string[]): {
    date?: string;
    timeslot?: string;
    deliveryType?: 'delivery' | 'collection' | 'express';
  } {
    const config = loadMappingConfig();
    
    let date: string | undefined;
    let timeslot: string | undefined;
    let deliveryType: 'delivery' | 'collection' | 'express' | undefined;

    for (const tag of orderTags) {
      const trimmedTag = tag.trim().toLowerCase();
      
      // Extract date
      if (config.dateSource === 'tags') {
        const dateMatch = tag.match(new RegExp(config.dateTagPattern));
        if (dateMatch) {
          date = this.formatDate(dateMatch[0]);
        }
      }
      
      // Extract timeslot
      if (config.timeslotSource === 'tags') {
        const timeMatch = tag.match(new RegExp(config.timeslotTagPattern));
        if (timeMatch) {
          timeslot = this.formatTimeslot(timeMatch[0], config.timeslotFormat);
        }
      }
      
      // Extract delivery type
      if (config.deliveryTypeSource === 'tags') {
        if (config.deliveryTypeKeywords.delivery.some(keyword => trimmedTag.includes(keyword))) {
          deliveryType = 'delivery';
        } else if (config.deliveryTypeKeywords.collection.some(keyword => trimmedTag.includes(keyword))) {
          deliveryType = 'collection';
        } else if (config.deliveryTypeKeywords.express.some(keyword => trimmedTag.includes(keyword))) {
          deliveryType = 'express';
        }
      }
    }

    return { date, timeslot, deliveryType };
  }

  // Format date based on configuration
  private formatDate(dateString: string): string {
    // Simple date formatting - in production, use a proper date library
    const parts = dateString.split(/[/\-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  }

  // Format timeslot based on configuration
  private formatTimeslot(timeString: string, format: string): string {
    if (format === 'HH:MM-HH:MM') {
      // Convert 24-hour format to 12-hour format
      return this.convertTo12HourFormat(timeString);
    }
    return timeString;
  }

  // Convert 24-hour format to 12-hour format
  private convertTo12HourFormat(timeString: string): string {
    const [startTime, endTime] = timeString.split('-');
    
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  // Fetch orders from Shopify
  async fetchOrders(limit: number = 250, status: string = 'open'): Promise<Order[]> {
    try {
      const url = `${this.getBaseUrl()}/orders.json?limit=${limit}&status=${status}`;
      const data: ShopifyOrdersResponse = await this.makeApiCall(url);
      return data.orders.map(order => this.mapShopifyOrderToLocal(order));
    } catch (error) {
      console.error('Error fetching orders from Shopify:', error);
      throw error;
    }
  }

  // Fetch a single order by Shopify ID
  async fetchOrder(shopifyId: string): Promise<Order | null> {
    try {
      const url = `${this.getBaseUrl()}/orders/${shopifyId}.json`;
      const data: ShopifyOrderResponse = await this.makeApiCall(url);
      return this.mapShopifyOrderToLocal(data.order);
    } catch (error) {
      console.error('Error fetching order from Shopify:', error);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Map Shopify order response to local Order interface
  private mapShopifyOrderToLocal(shopifyOrder: ShopifyOrderResponse['order']): Order {
    // Get the first line item (assuming single product orders for florist business)
    const lineItem = shopifyOrder.line_items[0];
    
    // Load mapping configuration
    const config = loadMappingConfig();
    
    // Extract order tags
    const orderTags = shopifyOrder.tags ? shopifyOrder.tags.split(',').map(tag => tag.trim()) : [];
    
    // Extract delivery information based on configuration
    const deliveryInfo = this.extractDeliveryInfoFromTags(orderTags);
    
    // Extract special instructions based on configuration
    const remarks = this.extractInstructions(lineItem, shopifyOrder.note, config);
    
    // Extract customizations based on configuration
    const customizations = this.extractCustomizations(lineItem, config);

    // Create order ID from Shopify order name
    const orderId = shopifyOrder.name.replace('#', '');

    // Format customer name based on configuration
    const customerName = this.formatCustomerName(shopifyOrder.customer, config);

    return {
      id: orderId,
      shopifyId: shopifyOrder.id.toString(),
      productId: `shopify-${lineItem.product_id}`,
      productName: lineItem.title,
      productVariant: lineItem.variant_title || '',
      timeslot: deliveryInfo.timeslot || '10:00 AM - 02:00 PM',
      difficultyLabel: 'Medium', // Will be updated from product sync
      productTypeLabel: 'Bouquet', // Will be updated from product sync
      remarks,
      productCustomizations: customizations,
      assignedFloristId: undefined, // Will be assigned by florist
      assignedAt: undefined,
      completedAt: undefined,
      status: 'pending',
      date: deliveryInfo.date || new Date(shopifyOrder.created_at).toISOString().split('T')[0],
      storeId: '', // Will be set by the calling function
      customerEmail: config.includeCustomerEmail ? shopifyOrder.email : undefined,
      customerPhone: config.includeCustomerPhone ? shopifyOrder.phone : undefined,
      customerName,
      totalPrice: shopifyOrder.total_price,
      currency: shopifyOrder.currency,
      fulfillmentStatus: shopifyOrder.fulfillment_status,
      financialStatus: shopifyOrder.financial_status,
      createdAt: shopifyOrder.created_at,
      updatedAt: shopifyOrder.updated_at,
      deliveryType: deliveryInfo.deliveryType || 'delivery', // New field for delivery type
    };
  }

  // Extract special instructions from order note
  private extractInstructions(lineItem: ShopifyLineItemResponse, note: string, config: ShopifyMappingConfig): string {
    if (!note) return '';
    
    // Load instructions from line item properties
    const lineItemInstructions = lineItem.properties?.find(prop => 
      config.instructionsPropertyName.toLowerCase() === prop.name.toLowerCase()
    );
    
    // Load instructions from order note
    const orderInstructions = this.extractInstructionsFromNote(note);
    
    // Combine instructions
    const instructions = [
      lineItemInstructions?.value,
      orderInstructions
    ].filter(Boolean).join(', ');

    return instructions;
  }

  // Extract special instructions from order note
  private extractInstructionsFromNote(note: string): string | null {
    if (!note) return null;
    
    // Look for instruction-related keywords
    const instructionKeywords = ['instruction', 'note', 'special', 'request', 'preference'];
    const lines = note.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (instructionKeywords.some(keyword => lowerLine.includes(keyword))) {
        return line.trim();
      }
    }
    
    return null;
  }

  // Extract customizations from line item properties
  private extractCustomizations(lineItem: ShopifyLineItemResponse, config: ShopifyMappingConfig): string {
    if (!lineItem.properties) return '';
    
    const customizationProperties = lineItem.properties.filter(prop => 
      !config.excludeProperties.includes(prop.name.toLowerCase())
    );
    
    return customizationProperties
      .map(prop => `${prop.name}: ${prop.value}`)
      .join(', ');
  }

  // Format customer name based on configuration
  private formatCustomerName(customer: { first_name: string; last_name: string }, config: ShopifyMappingConfig): string {
    switch (config.customerNameFormat) {
      case 'first_last':
        return `${customer.first_name} ${customer.last_name}`;
      case 'last_first':
        return `${customer.last_name}, ${customer.first_name}`;
      case 'full_name':
        return `${customer.first_name} ${customer.last_name}`;
      default:
        return `${customer.first_name} ${customer.last_name}`;
    }
  }
}

// Utility function to create Shopify API service for a store
export function createShopifyApiService(store: Store, accessToken: string, apiVersion?: string): ShopifyApiService {
  return new ShopifyApiService(store, accessToken, apiVersion);
}

// Utility function to sync products from Shopify to local storage
export async function syncProductsFromShopify(
  store: Store, 
  accessToken: string,
  apiVersion?: string
): Promise<Product[]> {
  const apiService = createShopifyApiService(store, accessToken, apiVersion);
  const products = await apiService.fetchProducts();
  
  // Add store ID to each product
  const productsWithStoreId = products.map(product => ({
    ...product,
    storeId: store.id
  }));

  return productsWithStoreId;
}

// Utility function to sync orders from Shopify to local storage
export async function syncOrdersFromShopify(
  store: Store, 
  accessToken: string,
  date?: string,
  apiVersion?: string
): Promise<Order[]> {
  const apiService = createShopifyApiService(store, accessToken, apiVersion);
  const orders = await apiService.fetchOrders();
  
  // Filter by date if specified
  const filteredOrders = date 
    ? orders.filter(order => order.date === date)
    : orders;
  
  // Add store ID to each order
  const ordersWithStoreId = filteredOrders.map(order => ({
    ...order,
    storeId: store.id
  }));

  return ordersWithStoreId;
} 