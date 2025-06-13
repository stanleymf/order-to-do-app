import type { Product, ProductVariant, ProductImage, ProductMetafield, Store, Order } from '../types';

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
  position: number;
  created_at: string;
  updated_at: string;
}

interface ShopifyImageResponse {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
  position: number;
  created_at: string;
  updated_at: string;
}

interface ShopifyMetafieldResponse {
  id: number;
  namespace: string;
  key: string;
  value: string;
  type: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ShopifyProductsResponse {
  products: ShopifyProductResponse['product'][];
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

  constructor(store: Store, accessToken: string) {
    this.config = {
      storeDomain: store.domain,
      accessToken,
      apiVersion: '2024-01' // Latest stable version
    };
  }

  private getBaseUrl(): string {
    return `https://${this.config.storeDomain}/admin/api/${this.config.apiVersion}`;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.config.accessToken,
    };
  }

  // Fetch all products from Shopify
  async fetchProducts(limit: number = 250): Promise<Product[]> {
    try {
      const url = `${this.getBaseUrl()}/products.json?limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data: ShopifyProductsResponse = await response.json();
      return data.products.map(this.mapShopifyProductToLocal);
    } catch (error) {
      console.error('Error fetching products from Shopify:', error);
      throw error;
    }
  }

  // Fetch a single product by Shopify ID
  async fetchProduct(shopifyId: string): Promise<Product | null> {
    try {
      const url = `${this.getBaseUrl()}/products/${shopifyId}.json`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data: ShopifyProductResponse = await response.json();
      return this.mapShopifyProductToLocal(data.product);
    } catch (error) {
      console.error('Error fetching product from Shopify:', error);
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
        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ metafield }),
        });

        if (!response.ok) {
          throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error updating product metafields:', error);
      throw error;
    }
  }

  // Update product tags
  async updateProductTags(shopifyId: string, tags: string[]): Promise<void> {
    try {
      const url = `${this.getBaseUrl()}/products/${shopifyId}.json`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          product: {
            id: shopifyId,
            tags: tags.join(', ')
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating product tags:', error);
      throw error;
    }
  }

  // Map Shopify product response to local Product interface
  private mapShopifyProductToLocal(shopifyProduct: ShopifyProductResponse['product']): Product {
    // Extract florist-specific metadata from metafields
    const floristMetadata = this.extractFloristMetadata(shopifyProduct.metafields);
    
    // Extract difficulty and product type from tags or metafields
    const tags = shopifyProduct.tags ? shopifyProduct.tags.split(',').map(tag => tag.trim()) : [];
    const difficultyLabel = this.extractDifficultyFromTags(tags) || 'Medium';
    const productTypeLabel = this.extractProductTypeFromTags(tags) || 'Bouquet';

    return {
      id: `shopify-${shopifyProduct.id}`,
      shopifyId: shopifyProduct.id.toString(),
      name: shopifyProduct.title,
      variant: shopifyProduct.variants?.[0]?.title || '',
      difficultyLabel,
      productTypeLabel,
      storeId: '', // Will be set by the calling function
      handle: shopifyProduct.handle,
      description: shopifyProduct.body_html,
      productType: shopifyProduct.product_type,
      vendor: shopifyProduct.vendor,
      tags,
      status: shopifyProduct.status as 'active' | 'archived' | 'draft',
      publishedAt: shopifyProduct.published_at,
      createdAt: shopifyProduct.created_at,
      updatedAt: shopifyProduct.updated_at,
      variants: shopifyProduct.variants?.map(this.mapShopifyVariantToLocal),
      images: shopifyProduct.images?.map(this.mapShopifyImageToLocal),
      metafields: shopifyProduct.metafields?.map(this.mapShopifyMetafieldToLocal),
      floristMetadata,
    };
  }

  // Map Shopify variant response to local ProductVariant interface
  private mapShopifyVariantToLocal(shopifyVariant: ShopifyVariantResponse): ProductVariant {
    return {
      id: `shopify-variant-${shopifyVariant.id}`,
      shopifyId: shopifyVariant.id.toString(),
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
      position: shopifyVariant.position,
      createdAt: shopifyVariant.created_at,
      updatedAt: shopifyVariant.updated_at,
    };
  }

  // Map Shopify image response to local ProductImage interface
  private mapShopifyImageToLocal(shopifyImage: ShopifyImageResponse): ProductImage {
    return {
      id: `shopify-image-${shopifyImage.id}`,
      shopifyId: shopifyImage.id.toString(),
      src: shopifyImage.src,
      alt: shopifyImage.alt,
      width: shopifyImage.width,
      height: shopifyImage.height,
      position: shopifyImage.position,
      createdAt: shopifyImage.created_at,
      updatedAt: shopifyImage.updated_at,
    };
  }

  // Map Shopify metafield response to local ProductMetafield interface
  private mapShopifyMetafieldToLocal(shopifyMetafield: ShopifyMetafieldResponse): ProductMetafield {
    return {
      id: `shopify-metafield-${shopifyMetafield.id}`,
      shopifyId: shopifyMetafield.id.toString(),
      namespace: shopifyMetafield.namespace,
      key: shopifyMetafield.key,
      value: shopifyMetafield.value,
      type: shopifyMetafield.type,
      description: shopifyMetafield.description,
      createdAt: shopifyMetafield.created_at,
      updatedAt: shopifyMetafield.updated_at,
    };
  }

  // Extract florist-specific metadata from metafields
  private extractFloristMetadata(metafields: ShopifyMetafieldResponse[]): Product['floristMetadata'] {
    const metadata: Product['floristMetadata'] = {};

    for (const metafield of metafields) {
      if (metafield.namespace === 'florist') {
        switch (metafield.key) {
          case 'difficulty_level':
            metadata.difficultyLevel = metafield.value;
            break;
          case 'estimated_time':
            metadata.estimatedTime = parseInt(metafield.value) || 0;
            break;
          case 'special_instructions':
            metadata.specialInstructions = metafield.value;
            break;
          case 'seasonal_availability':
            metadata.seasonalAvailability = metafield.value.split(',').map(s => s.trim());
            break;
          case 'materials':
            metadata.materials = metafield.value.split(',').map(s => s.trim());
            break;
        }
      }
    }

    return metadata;
  }

  // Extract difficulty from tags
  private extractDifficultyFromTags(tags: string[]): string | null {
    const difficultyTags = tags.filter(tag => 
      ['easy', 'medium', 'hard', 'very hard'].includes(tag.toLowerCase())
    );
    return difficultyTags.length > 0 ? difficultyTags[0] : null;
  }

  // Extract product type from tags
  private extractProductTypeFromTags(tags: string[]): string | null {
    const productTypeTags = tags.filter(tag => 
      ['bouquet', 'vase', 'arrangement', 'wreath', 'bundle'].includes(tag.toLowerCase())
    );
    return productTypeTags.length > 0 ? productTypeTags[0] : null;
  }

  // Fetch orders from Shopify
  async fetchOrders(limit: number = 250, status: string = 'open'): Promise<Order[]> {
    try {
      const url = `${this.getBaseUrl()}/orders.json?limit=${limit}&status=${status}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data: ShopifyOrdersResponse = await response.json();
      return data.orders.map(this.mapShopifyOrderToLocal);
    } catch (error) {
      console.error('Error fetching orders from Shopify:', error);
      throw error;
    }
  }

  // Fetch a single order by Shopify ID
  async fetchOrder(shopifyId: string): Promise<Order | null> {
    try {
      const url = `${this.getBaseUrl()}/orders/${shopifyId}.json`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data: ShopifyOrderResponse = await response.json();
      return this.mapShopifyOrderToLocal(data.order);
    } catch (error) {
      console.error('Error fetching order from Shopify:', error);
      throw error;
    }
  }

  // Map Shopify order response to local Order interface
  private mapShopifyOrderToLocal(shopifyOrder: ShopifyOrderResponse['order']): Order {
    // Get the first line item (assuming single product orders for florist business)
    const lineItem = shopifyOrder.line_items[0];
    
    // Extract order tags
    const orderTags = shopifyOrder.tags ? shopifyOrder.tags.split(',').map(tag => tag.trim()) : [];
    
    // Extract delivery information from order tags
    const deliveryInfo = this.extractDeliveryInfoFromTags(orderTags);
    
    // Extract special instructions from order note or line item properties
    const specialInstructionsProperty = lineItem.properties?.find(prop => 
      prop.name.toLowerCase().includes('instruction') || 
      prop.name.toLowerCase().includes('note') ||
      prop.name.toLowerCase().includes('special')
    );
    
    const remarks = specialInstructionsProperty?.value || 
                   this.extractInstructionsFromNote(shopifyOrder.note) || '';

    // Create order ID from Shopify order name
    const orderId = shopifyOrder.name.replace('#', '');

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
      productCustomizations: this.extractCustomizationsFromProperties(lineItem.properties),
      assignedFloristId: undefined, // Will be assigned by florist
      assignedAt: undefined,
      completedAt: undefined,
      status: 'pending',
      date: deliveryInfo.date || new Date(shopifyOrder.created_at).toISOString().split('T')[0],
      storeId: '', // Will be set by the calling function
      customerEmail: shopifyOrder.email,
      customerPhone: shopifyOrder.phone,
      customerName: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`,
      totalPrice: shopifyOrder.total_price,
      currency: shopifyOrder.currency,
      fulfillmentStatus: shopifyOrder.fulfillment_status,
      financialStatus: shopifyOrder.financial_status,
      createdAt: shopifyOrder.created_at,
      updatedAt: shopifyOrder.updated_at,
      deliveryType: deliveryInfo.deliveryType || 'delivery', // New field for delivery type
    };
  }

  // Extract delivery information from order tags
  private extractDeliveryInfoFromTags(tags: string[]): {
    date?: string;
    timeslot?: string;
    deliveryType?: 'delivery' | 'collection' | 'express';
  } {
    const result: {
      date?: string;
      timeslot?: string;
      deliveryType?: 'delivery' | 'collection' | 'express';
    } = {};

    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      
      // Extract delivery type
      if (lowerTag.includes('delivery') || lowerTag.includes('deliver')) {
        result.deliveryType = 'delivery';
      } else if (lowerTag.includes('collection') || lowerTag.includes('pickup') || lowerTag.includes('collect')) {
        result.deliveryType = 'collection';
      } else if (lowerTag.includes('express') || lowerTag.includes('urgent') || lowerTag.includes('rush')) {
        result.deliveryType = 'express';
      }
      
      // Extract date (always read as DD/MM/YYYY format)
      const dateMatch = tag.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        // Always treat as DD/MM/YYYY format
        result.date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Extract timeslot (HH:MM-HH:MM format from order tags)
      const timeMatch = tag.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const [, startHour, startMin, endHour, endMin] = timeMatch;
        // Convert to 12-hour format with AM/PM
        const startTime = this.convertTo12HourFormat(parseInt(startHour), parseInt(startMin));
        const endTime = this.convertTo12HourFormat(parseInt(endHour), parseInt(endMin));
        result.timeslot = `${startTime} - ${endTime}`;
      }
      
      // Fallback: Extract timeslot (various formats)
      const timeMatchWithAMPM = tag.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatchWithAMPM) {
        const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatchWithAMPM;
        result.timeslot = `${startHour}:${startMin} ${startPeriod.toUpperCase()} - ${endHour}:${endMin} ${endPeriod.toUpperCase()}`;
      }
      
      // Alternative time formats
      const timeRangeMatch = tag.match(/(\d{1,2})(AM|PM)\s*-\s*(\d{1,2})(AM|PM)/i);
      if (timeRangeMatch) {
        const [, startTime, startPeriod, endTime, endPeriod] = timeRangeMatch;
        result.timeslot = `${startTime} ${startPeriod.toUpperCase()} - ${endTime} ${endPeriod.toUpperCase()}`;
      }
    }

    return result;
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
  private extractCustomizationsFromProperties(properties: ShopifyLineItemResponse['properties']): string {
    if (!properties) return '';
    
    const customizationProperties = properties.filter(prop => 
      !prop.name.toLowerCase().includes('delivery') &&
      !prop.name.toLowerCase().includes('time') &&
      !prop.name.toLowerCase().includes('instruction') &&
      !prop.name.toLowerCase().includes('note') &&
      !prop.name.toLowerCase().includes('special')
    );
    
    return customizationProperties
      .map(prop => `${prop.name}: ${prop.value}`)
      .join(', ');
  }

  // Convert 24-hour format to 12-hour format with AM/PM
  private convertTo12HourFormat(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const twelveHour = hour % 12 || 12;
    return `${twelveHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }
}

// Utility function to create Shopify API service for a store
export function createShopifyApiService(store: Store, accessToken: string): ShopifyApiService {
  return new ShopifyApiService(store, accessToken);
}

// Utility function to sync products from Shopify to local storage
export async function syncProductsFromShopify(
  store: Store, 
  accessToken: string
): Promise<Product[]> {
  const apiService = createShopifyApiService(store, accessToken);
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
  date?: string
): Promise<Order[]> {
  const apiService = createShopifyApiService(store, accessToken);
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