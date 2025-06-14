import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Trash2, Plus, Settings, Eye, EyeOff, ArrowUp, ArrowDown, 
  Package, Tag, Clock, MapPin, User, Store as StoreIcon,
  Copy, RefreshCw, Save, Loader2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { OrderDataMapping, OrderCardProperty, ShopifyOrderField, Store } from '../types';
import { getStores } from '../utils/storage';
import { useMobileView } from './Dashboard';

// Store-specific mapping configuration interface
export interface StoreOrderMappingConfig {
  storeId: string;
  storeName: string;
  
  // Order ID mapping
  orderIdSource: 'order_name' | 'order_id' | 'line_item_id' | 'custom_field';
  orderIdCustomField?: string;
  
  // Product Name mapping
  productNameSource: 'line_item_title' | 'product_title' | 'product_handle' | 'custom_field';
  productNameCustomField?: string;
  
  // Product Variant mapping
  productVariantSource: 'line_item_variant_title' | 'variant_title' | 'sku' | 'custom_field';
  productVariantCustomField?: string;
  
  // Date mapping
  dateSource: 'tags' | 'created_at' | 'processed_at' | 'custom_field';
  dateTagPattern: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  dateCustomField?: string;
  
  // Timeslot mapping
  timeslotSource: 'tags' | 'line_item_properties' | 'order_note' | 'custom_field';
  timeslotTagPattern: string;
  timeslotFormat: 'HH:MM-HH:MM' | 'HH:MM AM/PM-HH:MM AM/PM' | 'HAM/PM-HAM/PM';
  timeslotCustomField?: string;
  
  // Delivery Type mapping
  deliveryTypeSource: 'tags' | 'line_item_properties' | 'order_note' | 'custom_field';
  deliveryTypeKeywords: {
    delivery: string[];
    collection: string[];
    express: string[];
  };
  deliveryTypeCustomField?: string;
  
  // Add-Ons mapping
  addOnsSource: 'line_item_properties' | 'order_note' | 'custom_field' | 'both';
  addOnsExcludeProperties: string[];
  addOnsCustomField?: string;
  
  // Remarks mapping
  remarksSource: 'line_item_properties' | 'order_note' | 'custom_field' | 'both';
  remarksPropertyName: string;
  remarksKeywords: string[];
  remarksCustomField?: string;
  
  // Customer info mapping
  customerNameFormat: 'first_last' | 'last_first' | 'full_name';
  includeCustomerPhone: boolean;
  includeCustomerEmail: boolean;
  
  // Additional Order properties
  includeTotalPrice: boolean;
  includeCurrency: boolean;
  includeFulfillmentStatus: boolean;
  includeFinancialStatus: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Define all Order Card properties that can be mapped
const ORDER_CARD_PROPERTIES: OrderCardProperty[] = [
  { key: 'productName', label: 'Product Name', type: 'text', required: true, displayOrder: 1 },
  { key: 'productVariant', label: 'Product Variant', type: 'text', required: false, displayOrder: 2 },
  { key: 'customerName', label: 'Customer Name', type: 'text', required: true, displayOrder: 3 },
  { key: 'customerEmail', label: 'Customer Email', type: 'text', required: false, displayOrder: 4 },
  { key: 'customerPhone', label: 'Customer Phone', type: 'text', required: false, displayOrder: 5 },
  { key: 'date', label: 'Delivery Date', type: 'date', required: true, displayOrder: 6 },
  { key: 'timeslot', label: 'Time Slot', type: 'text', required: true, displayOrder: 7 },
  { key: 'deliveryType', label: 'Delivery Type', type: 'badge', required: false, displayOrder: 8 },
  { key: 'totalPrice', label: 'Total Price', type: 'currency', required: false, displayOrder: 9 },
  { key: 'currency', label: 'Currency', type: 'text', required: false, displayOrder: 10 },
  { key: 'status', label: 'Order Status', type: 'status', required: true, displayOrder: 11 },
  { key: 'difficultyLabel', label: 'Difficulty Level', type: 'badge', required: true, displayOrder: 12 },
  { key: 'productTypeLabel', label: 'Product Type', type: 'badge', required: true, displayOrder: 13 },
  { key: 'remarks', label: 'Special Instructions', type: 'text', required: false, displayOrder: 14 },
  { key: 'productCustomizations', label: 'Product Customizations', type: 'text', required: false, displayOrder: 15 },
  { key: 'fulfillmentStatus', label: 'Fulfillment Status', type: 'status', required: false, displayOrder: 16 },
  { key: 'financialStatus', label: 'Financial Status', type: 'status', required: false, displayOrder: 17 },
  { key: 'assignedFloristId', label: 'Assigned Florist', type: 'text', required: false, displayOrder: 18 },
  { key: 'storeId', label: 'Store', type: 'text', required: true, displayOrder: 19 },
  { key: 'shopifyId', label: 'Shopify Order ID', type: 'text', required: false, displayOrder: 20 }
];

// Define all available Shopify order fields that can be mapped from
const SHOPIFY_ORDER_FIELDS: ShopifyOrderField[] = [
  // Order fields
  {
    id: 'order_id',
    category: 'order',
    field: 'id',
    label: 'Order ID',
    type: 'number',
    description: 'Unique Shopify order identifier',
    example: '12345'
  },
  {
    id: 'order_name',
    category: 'order',
    field: 'name',
    label: 'Order Name',
    type: 'string',
    description: 'Order number (e.g., #1001)',
    example: '#1001'
  },
  {
    id: 'order_email',
    category: 'order',
    field: 'email',
    label: 'Order Email',
    type: 'string',
    description: 'Customer email from order',
    example: 'customer@example.com'
  },
  {
    id: 'order_phone',
    category: 'order',
    field: 'phone',
    label: 'Order Phone',
    type: 'string',
    description: 'Customer phone from order',
    example: '+1234567890'
  },
  {
    id: 'order_created_at',
    category: 'order',
    field: 'created_at',
    label: 'Order Created Date',
    type: 'date',
    description: 'When the order was created',
    example: '2024-01-15T10:00:00Z'
  },
  {
    id: 'order_updated_at',
    category: 'order',
    field: 'updated_at',
    label: 'Order Updated Date',
    type: 'date',
    description: 'When the order was last updated',
    example: '2024-01-15T10:30:00Z'
  },
  {
    id: 'order_processed_at',
    category: 'order',
    field: 'processed_at',
    label: 'Order Processed Date',
    type: 'date',
    description: 'When the order was processed',
    example: '2024-01-15T10:15:00Z'
  },
  {
    id: 'order_fulfillment_status',
    category: 'order',
    field: 'fulfillment_status',
    label: 'Fulfillment Status',
    type: 'string',
    description: 'Order fulfillment status',
    example: 'fulfilled'
  },
  {
    id: 'order_financial_status',
    category: 'order',
    field: 'financial_status',
    label: 'Financial Status',
    type: 'string',
    description: 'Order payment status',
    example: 'paid'
  },
  {
    id: 'order_total_price',
    category: 'order',
    field: 'total_price',
    label: 'Total Price',
    type: 'string',
    description: 'Total order amount',
    example: '95.00'
  },
  {
    id: 'order_subtotal_price',
    category: 'order',
    field: 'subtotal_price',
    label: 'Subtotal Price',
    type: 'string',
    description: 'Order subtotal amount',
    example: '85.00'
  },
  {
    id: 'order_total_tax',
    category: 'order',
    field: 'total_tax',
    label: 'Total Tax',
    type: 'string',
    description: 'Total tax amount',
    example: '10.00'
  },
  {
    id: 'order_currency',
    category: 'order',
    field: 'currency',
    label: 'Currency',
    type: 'string',
    description: 'Order currency code',
    example: 'CAD'
  },
  {
    id: 'order_note',
    category: 'order',
    field: 'note',
    label: 'Order Note',
    type: 'string',
    description: 'Customer note on the order',
    example: 'Please deliver between 2-4 PM'
  },
  {
    id: 'order_tags',
    category: 'order',
    field: 'tags',
    label: 'Order Tags',
    type: 'string',
    description: 'Comma-separated order tags',
    example: '15/01/2024, 14:00-16:00, delivery'
  },

  // Customer fields
  {
    id: 'customer_id',
    category: 'customer',
    field: 'id',
    label: 'Customer ID',
    type: 'number',
    description: 'Unique customer identifier',
    example: '67890'
  },
  {
    id: 'customer_first_name',
    category: 'customer',
    field: 'first_name',
    label: 'Customer First Name',
    type: 'string',
    description: 'Customer first name',
    example: 'Jane'
  },
  {
    id: 'customer_last_name',
    category: 'customer',
    field: 'last_name',
    label: 'Customer Last Name',
    type: 'string',
    description: 'Customer last name',
    example: 'Doe'
  },
  {
    id: 'customer_email',
    category: 'customer',
    field: 'email',
    label: 'Customer Email',
    type: 'string',
    description: 'Customer email address',
    example: 'jane.doe@example.com'
  },

  // Line Items fields
  {
    id: 'line_items_title',
    category: 'line_items',
    field: 'title',
    label: 'Product Title (First Item)',
    type: 'string',
    description: 'Title of the first line item',
    example: 'Beautiful Rose Bouquet'
  },
  {
    id: 'line_items_variant_title',
    category: 'line_items',
    field: 'variant_title',
    label: 'Product Variant (First Item)',
    type: 'string',
    description: 'Variant title of the first line item',
    example: 'Large'
  },
  {
    id: 'line_items_quantity',
    category: 'line_items',
    field: 'quantity',
    label: 'Quantity (First Item)',
    type: 'number',
    description: 'Quantity of the first line item',
    example: '1'
  },
  {
    id: 'line_items_price',
    category: 'line_items',
    field: 'price',
    label: 'Price (First Item)',
    type: 'string',
    description: 'Price of the first line item',
    example: '75.00'
  },
  {
    id: 'line_items_sku',
    category: 'line_items',
    field: 'sku',
    label: 'SKU (First Item)',
    type: 'string',
    description: 'SKU of the first line item',
    example: 'ROSE-BOUQUET-001'
  },

  // Shipping Address fields
  {
    id: 'shipping_address_address1',
    category: 'shipping_address',
    field: 'address1',
    label: 'Shipping Address Line 1',
    type: 'string',
    description: 'First line of shipping address',
    example: '123 Main St'
  },
  {
    id: 'shipping_address_address2',
    category: 'shipping_address',
    field: 'address2',
    label: 'Shipping Address Line 2',
    type: 'string',
    description: 'Second line of shipping address',
    example: 'Apt 4B'
  },
  {
    id: 'shipping_address_city',
    category: 'shipping_address',
    field: 'city',
    label: 'Shipping City',
    type: 'string',
    description: 'Shipping address city',
    example: 'Toronto'
  },
  {
    id: 'shipping_address_province',
    category: 'shipping_address',
    field: 'province',
    label: 'Shipping Province/State',
    type: 'string',
    description: 'Shipping address province or state',
    example: 'ON'
  },
  {
    id: 'shipping_address_country',
    category: 'shipping_address',
    field: 'country',
    label: 'Shipping Country',
    type: 'string',
    description: 'Shipping address country',
    example: 'Canada'
  },
  {
    id: 'shipping_address_zip',
    category: 'shipping_address',
    field: 'zip',
    label: 'Shipping Postal Code',
    type: 'string',
    description: 'Shipping address postal code',
    example: 'M1M 1M1'
  },

  // Tags (parsed)
  {
    id: 'tags_date',
    category: 'tags',
    field: 'date',
    label: 'Date from Tags',
    type: 'string',
    description: 'Delivery date extracted from order tags',
    example: '15/01/2024'
  },
  {
    id: 'tags_timeslot',
    category: 'tags',
    field: 'timeslot',
    label: 'Timeslot from Tags',
    type: 'string',
    description: 'Delivery timeslot extracted from order tags',
    example: '14:00-16:00'
  },
  {
    id: 'tags_delivery_type',
    category: 'tags',
    field: 'delivery_type',
    label: 'Delivery Type from Tags',
    type: 'string',
    description: 'Delivery method extracted from order tags',
    example: 'delivery'
  },

  // Line Item Properties
  {
    id: 'properties_special_instructions',
    category: 'properties',
    field: 'Special Instructions',
    label: 'Special Instructions Property',
    type: 'string',
    description: 'Special instructions from line item properties',
    example: 'Please use red roses only'
  },
  {
    id: 'properties_delivery_time',
    category: 'properties',
    field: 'Delivery Time',
    label: 'Delivery Time Property',
    type: 'string',
    description: 'Delivery time from line item properties',
    example: '2:00 PM - 4:00 PM'
  }
];

// Helper function to create default store mapping config
const createDefaultMappingConfig = (store: Store): StoreOrderMappingConfig => ({
  storeId: store.id,
  storeName: store.name,
  
  // Order ID mapping
  orderIdSource: 'order_name',
  
  // Product Name mapping
  productNameSource: 'line_item_title',
  
  // Product Variant mapping
  productVariantSource: 'line_item_variant_title',
  
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
  
  // Add-Ons mapping
  addOnsSource: 'line_item_properties',
  addOnsExcludeProperties: ['Delivery Time', 'Special Instructions', 'delivery', 'time', 'instruction', 'note', 'special'],
  
  // Remarks mapping
  remarksSource: 'line_item_properties',
  remarksPropertyName: 'Special Instructions',
  remarksKeywords: ['instruction', 'note', 'special', 'request', 'preference'],
  
  // Customer info mapping
  customerNameFormat: 'first_last',
  includeCustomerPhone: true,
  includeCustomerEmail: true,
  
  // Additional Order properties
  includeTotalPrice: true,
  includeCurrency: true,
  includeFulfillmentStatus: true,
  includeFinancialStatus: true,
  
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export function OrderDataMapping() {
  // Advanced mapping state
  const [mappings, setMappings] = useState<OrderDataMapping[]>([]);
  const [isAddingMapping, setIsAddingMapping] = useState(false);
  const [newMapping, setNewMapping] = useState<Partial<OrderDataMapping>>({
    name: '',
    description: '',
    transformationType: 'none',
    fallbackValue: '',
    isActive: true,
    priority: 1
  });

  // Store-specific mapping state
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [mappingConfigs, setMappingConfigs] = useState<{ [storeId: string]: StoreOrderMappingConfig }>({});
  const [currentConfig, setCurrentConfig] = useState<StoreOrderMappingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'advanced' | 'store-specific'>('advanced');
  
  // Get mobile view context
  const { isMobileView } = useMobileView();

  // Load mappings from localStorage
  useEffect(() => {
    const savedMappings = localStorage.getItem('order-data-mappings');
    if (savedMappings) {
      try {
        const parsed = JSON.parse(savedMappings);
        setMappings(parsed);
      } catch (error) {
        console.error('Error loading order data mappings:', error);
      }
    } else {
      // Initialize with default mappings
      initializeDefaultMappings();
    }
  }, []);

  // Load stores and store-specific configurations
  useEffect(() => {
    loadStoresAndConfigs();
  }, []);

  // Update current config when store selection changes
  useEffect(() => {
    if (selectedStoreId && mappingConfigs[selectedStoreId]) {
      setCurrentConfig(mappingConfigs[selectedStoreId]);
    } else if (selectedStoreId) {
      // Create default config for new store
      const store = stores.find(s => s.id === selectedStoreId);
      if (store) {
        const defaultConfig = createDefaultMappingConfig(store);
        setCurrentConfig(defaultConfig);
      }
    } else {
      setCurrentConfig(null);
    }
  }, [selectedStoreId, mappingConfigs, stores]);

  // Save mappings to localStorage
  const saveMappings = (updatedMappings: OrderDataMapping[]) => {
    setMappings(updatedMappings);
    localStorage.setItem('order-data-mappings', JSON.stringify(updatedMappings));
  };

  // Initialize default mappings for essential Order Card properties
  const initializeDefaultMappings = () => {
    const defaultMappings: OrderDataMapping[] = [
      {
        id: '1',
        name: 'Product Name Mapping',
        description: 'Maps the main product name from first line item',
        orderCardProperty: ORDER_CARD_PROPERTIES.find(p => p.key === 'productName')!,
        shopifySource: { category: 'line_items', field: 'title' },
        transformationType: 'none',
        fallbackValue: 'Unknown Product',
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Customer Name Mapping',
        description: 'Combines customer first and last name',
        orderCardProperty: ORDER_CARD_PROPERTIES.find(p => p.key === 'customerName')!,
        shopifySource: { category: 'customer', field: 'first_name' },
        transformationType: 'custom_logic',
        transformationConfig: { customLogic: 'customer.first_name + " " + customer.last_name' },
        fallbackValue: 'Unknown Customer',
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Delivery Date Mapping',
        description: 'Extracts delivery date from order tags',
        orderCardProperty: ORDER_CARD_PROPERTIES.find(p => p.key === 'date')!,
        shopifySource: { category: 'tags', field: 'date' },
        transformationType: 'date_format',
        transformationConfig: { dateFormat: 'DD/MM/YYYY' },
        fallbackValue: 'Today',
        isActive: true,
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        name: 'Time Slot Mapping',
        description: 'Extracts delivery timeslot from order tags',
        orderCardProperty: ORDER_CARD_PROPERTIES.find(p => p.key === 'timeslot')!,
        shopifySource: { category: 'tags', field: 'timeslot' },
        transformationType: 'none',
        fallbackValue: '10:00 AM - 2:00 PM',
        isActive: true,
        priority: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        name: 'Total Price Mapping',
        description: 'Maps the total order price',
        orderCardProperty: ORDER_CARD_PROPERTIES.find(p => p.key === 'totalPrice')!,
        shopifySource: { category: 'order', field: 'total_price' },
        transformationType: 'currency_format',
        transformationConfig: { currencySymbol: '$' },
        fallbackValue: '$0.00',
        isActive: true,
        priority: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    saveMappings(defaultMappings);
  };

  // Store-specific mapping functions
  const loadStoresAndConfigs = async () => {
    setIsLoading(true);
    try {
      // Load stores
      const loadedStores = getStores();
      setStores(loadedStores);
      
      // Load mapping configurations
      const savedConfigs = localStorage.getItem('store-order-mapping-configs');
      if (savedConfigs) {
        const parsedConfigs = JSON.parse(savedConfigs);
        setMappingConfigs(parsedConfigs);
      }
      
      // Auto-select first store if available
      if (loadedStores.length > 0 && !selectedStoreId) {
        setSelectedStoreId(loadedStores[0].id);
      }
    } catch (error) {
      console.error('Error loading stores and mapping configs:', error);
      toast.error('Failed to load store configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMappingConfig = async () => {
    if (!currentConfig) return;
    
    setIsSaving(true);
    try {
      const updatedConfig = {
        ...currentConfig,
        updatedAt: new Date().toISOString()
      };
      
      const updatedConfigs = {
        ...mappingConfigs,
        [selectedStoreId]: updatedConfig
      };
      
      setMappingConfigs(updatedConfigs);
      setCurrentConfig(updatedConfig);
      localStorage.setItem('store-order-mapping-configs', JSON.stringify(updatedConfigs));
      
      toast.success(`Mapping configuration saved for ${currentConfig.storeName}`);
    } catch (error) {
      console.error('Error saving mapping config:', error);
      toast.error('Failed to save mapping configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!selectedStoreId) return;
    
    const store = stores.find(s => s.id === selectedStoreId);
    if (store) {
      const defaultConfig = createDefaultMappingConfig(store);
      setCurrentConfig(defaultConfig);
      toast.info(`Reset to default configuration for ${store.name}`);
    }
  };

  const copyFromStore = (sourceStoreId: string) => {
    if (!selectedStoreId || !mappingConfigs[sourceStoreId]) return;
    
    const sourceConfig = mappingConfigs[sourceStoreId];
    const targetStore = stores.find(s => s.id === selectedStoreId);
    
    if (targetStore) {
      const copiedConfig: StoreOrderMappingConfig = {
        ...sourceConfig,
        storeId: selectedStoreId,
        storeName: targetStore.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCurrentConfig(copiedConfig);
      toast.success(`Copied configuration from ${sourceConfig.storeName} to ${targetStore.name}`);
    }
  };

  const updateMappingConfig = (key: keyof StoreOrderMappingConfig, value: any) => {
    if (!currentConfig) return;
    
    setCurrentConfig(prev => prev ? {
      ...prev,
      [key]: value
    } : null);
  };

  const updateDeliveryTypeKeywords = (type: 'delivery' | 'collection' | 'express', keywords: string) => {
    if (!currentConfig) return;
    
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    setCurrentConfig(prev => prev ? {
      ...prev,
      deliveryTypeKeywords: {
        ...prev.deliveryTypeKeywords,
        [type]: keywordArray
      }
    } : null);
  };

  const handleAddMapping = () => {
    if (!newMapping.name || !newMapping.orderCardProperty || !newMapping.shopifySource) {
      return;
    }

    const mapping: OrderDataMapping = {
      id: Date.now().toString(),
      name: newMapping.name,
      description: newMapping.description || '',
      orderCardProperty: newMapping.orderCardProperty!,
      shopifySource: newMapping.shopifySource!,
      transformationType: newMapping.transformationType || 'none',
      transformationConfig: newMapping.transformationConfig,
      fallbackValue: newMapping.fallbackValue || '',
      isActive: newMapping.isActive ?? true,
      priority: newMapping.priority || mappings.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    saveMappings([...mappings, mapping]);
    setNewMapping({
      name: '',
      description: '',
      transformationType: 'none',
      fallbackValue: '',
      isActive: true,
      priority: 1
    });
    setIsAddingMapping(false);
  };

  const handleDeleteMapping = (id: string) => {
    saveMappings(mappings.filter(m => m.id !== id));
  };

  const handleToggleMapping = (id: string) => {
    saveMappings(mappings.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive, updatedAt: new Date() } : m
    ));
  };

  const handleMoveMappingUp = (id: string) => {
    const index = mappings.findIndex(m => m.id === id);
    if (index > 0) {
      const newMappings = [...mappings];
      [newMappings[index], newMappings[index - 1]] = [newMappings[index - 1], newMappings[index]];
      // Update priorities
      newMappings.forEach((mapping, idx) => {
        mapping.priority = idx + 1;
        mapping.updatedAt = new Date();
      });
      saveMappings(newMappings);
    }
  };

  const handleMoveMappingDown = (id: string) => {
    const index = mappings.findIndex(m => m.id === id);
    if (index < mappings.length - 1) {
      const newMappings = [...mappings];
      [newMappings[index], newMappings[index + 1]] = [newMappings[index + 1], newMappings[index]];
      // Update priorities
      newMappings.forEach((mapping, idx) => {
        mapping.priority = idx + 1;
        mapping.updatedAt = new Date();
      });
      saveMappings(newMappings);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold text-gray-900 ${isMobileView ? 'text-xl' : 'text-2xl'}`}>
            Order Data Mapping
          </h1>
          <p className="text-gray-600 mt-1">
            Configure comprehensive Shopify order data mapping to Order Card properties
          </p>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'advanced' | 'store-specific')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="advanced">Advanced Field Mapping</TabsTrigger>
          <TabsTrigger value="store-specific">Store-Specific Configuration</TabsTrigger>
        </TabsList>

        {/* Advanced Field Mapping Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Order Data Mapping
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Create detailed mappings with transformations and custom logic
                  </p>
                </div>
                <Dialog open={isAddingMapping} onOpenChange={setIsAddingMapping}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Mapping
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Order Data Mapping</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="mappingName">Mapping Name</Label>
                        <Input
                          id="mappingName"
                          value={newMapping.name || ''}
                          onChange={(e) => setNewMapping({ ...newMapping, name: e.target.value })}
                          placeholder="e.g., Customer Name Mapping"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mappingDescription">Description</Label>
                        <Input
                          id="mappingDescription"
                          value={newMapping.description || ''}
                          onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                          placeholder="Describe what this mapping does"
                        />
                      </div>

                      <div>
                        <Label htmlFor="orderCardProperty">Order Card Property</Label>
                        <Select
                          value={newMapping.orderCardProperty?.key || ''}
                          onValueChange={(value) => {
                            const property = ORDER_CARD_PROPERTIES.find(p => p.key === value);
                            setNewMapping({ ...newMapping, orderCardProperty: property });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Order Card property to map to" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_CARD_PROPERTIES.map(property => (
                              <SelectItem key={property.key} value={property.key}>
                                {property.label} ({property.type})
                                {property.required && <span className="text-red-500 ml-1">*</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="shopifySource">Shopify Data Source</Label>
                        <Select
                          value={newMapping.shopifySource ? `${newMapping.shopifySource.category}_${newMapping.shopifySource.field}` : ''}
                          onValueChange={(value) => {
                            const field = SHOPIFY_ORDER_FIELDS.find(f => `${f.category}_${f.field}` === value);
                            if (field) {
                              setNewMapping({ 
                                ...newMapping, 
                                shopifySource: { 
                                  category: field.category as any, 
                                  field: field.field 
                                } 
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Shopify field to map from" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(
                              SHOPIFY_ORDER_FIELDS.reduce((acc, field) => {
                                if (!acc[field.category]) acc[field.category] = [];
                                acc[field.category].push(field);
                                return acc;
                              }, {} as Record<string, ShopifyOrderField[]>)
                            ).map(([category, fields]) => (
                              <div key={category}>
                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                                  {category.replace('_', ' ')}
                                </div>
                                {fields.map(field => (
                                  <SelectItem key={field.id} value={`${field.category}_${field.field}`}>
                                    {field.label} ({field.type})
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="transformationType">Transformation Type</Label>
                        <Select
                          value={newMapping.transformationType || 'none'}
                          onValueChange={(value) => setNewMapping({ ...newMapping, transformationType: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Transformation</SelectItem>
                            <SelectItem value="date_format">Date Formatting</SelectItem>
                            <SelectItem value="currency_format">Currency Formatting</SelectItem>
                            <SelectItem value="text_transform">Text Transform</SelectItem>
                            <SelectItem value="custom_logic">Custom Logic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="fallbackValue">Fallback Value</Label>
                        <Input
                          id="fallbackValue"
                          value={newMapping.fallbackValue || ''}
                          onChange={(e) => setNewMapping({ ...newMapping, fallbackValue: e.target.value })}
                          placeholder="Value to use if mapping fails"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddingMapping(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMapping}>
                          Add Mapping
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No order data mappings configured yet.</p>
                    <p className="text-sm">Click "Add Mapping" to get started.</p>
                  </div>
                ) : (
                  mappings
                    .sort((a, b) => a.priority - b.priority)
                    .map((mapping, index) => (
                      <Card key={mapping.id} className={`${mapping.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{mapping.name}</h3>
                                <Badge variant={mapping.isActive ? 'default' : 'secondary'}>
                                  {mapping.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline">
                                  Priority {mapping.priority}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{mapping.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Order Card Property:</span>
                                  <div className="mt-1">
                                    <Badge variant="outline">
                                      {mapping.orderCardProperty.label}
                                    </Badge>
                                    <span className="text-gray-500 ml-2">
                                      ({mapping.orderCardProperty.type})
                                    </span>
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-gray-700">Shopify Source:</span>
                                  <div className="mt-1">
                                    <Badge variant="outline">
                                      {mapping.shopifySource.category}.{mapping.shopifySource.field}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-gray-700">Transformation:</span>
                                  <div className="mt-1">
                                    <Badge variant="outline">
                                      {mapping.transformationType?.replace('_', ' ') || 'none'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {mapping.fallbackValue && (
                                <div className="mt-2 text-sm">
                                  <span className="font-medium text-gray-700">Fallback:</span>
                                  <span className="ml-2 text-gray-600">"{mapping.fallbackValue}"</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveMappingUp(mapping.id)}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveMappingDown(mapping.id)}
                                disabled={index === mappings.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleMapping(mapping.id)}
                              >
                                {mapping.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMapping(mapping.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Shopify Fields Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Available Shopify Order Fields</CardTitle>
              <p className="text-sm text-gray-600">
                Reference of all Shopify order fields that can be mapped to Order Card properties
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  SHOPIFY_ORDER_FIELDS.reduce((acc, field) => {
                    if (!acc[field.category]) acc[field.category] = [];
                    acc[field.category].push(field);
                    return acc;
                  }, {} as Record<string, ShopifyOrderField[]>)
                ).map(([category, fields]) => (
                  <Card key={category} className="border-gray-200">
                    <CardHeader className="pb-2">
                      <h3 className="font-medium text-sm uppercase text-gray-700">
                        {category.replace('_', ' ')}
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {fields.map(field => (
                          <div key={field.id} className="text-sm">
                            <div className="font-medium">{field.label}</div>
                            <div className="text-gray-600 text-xs">
                              {field.description}
                            </div>
                            {field.example && (
                              <div className="text-gray-500 text-xs italic">
                                Example: {field.example}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store-Specific Configuration Tab */}
        <TabsContent value="store-specific" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading store configurations...</span>
              </CardContent>
            </Card>
          ) : stores.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Stores Found</h3>
                <p className="text-gray-500 mb-4">
                  You need to add stores before configuring store-specific order data mapping.
                </p>
                <p className="text-sm text-gray-400">
                  Go to Settings → Store Management to add your first store.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Store Selection Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Store-Specific Order Data Mapping</h3>
                  <p className="text-sm text-gray-600">
                    Configure how order data from each store maps to your Order Cards
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetToDefaults}
                    disabled={!currentConfig || isLoading}
                    className={isMobileView ? 'h-8 text-xs' : ''}
                  >
                    <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''} ${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    Reset
                  </Button>
                  <Button
                    onClick={saveMappingConfig}
                    disabled={!currentConfig || isSaving}
                    className={isMobileView ? 'h-8 text-xs' : ''}
                  >
                    <Save className={`mr-2 ${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* Store Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StoreIcon className="h-5 w-5 text-gray-500" />
                    Select Store to Configure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                    <div>
                      <Label htmlFor="storeSelect">Store</Label>
                      <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a store to configure" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: store.color }}
                                />
                                {store.name}
                                {mappingConfigs[store.id] && (
                                  <Badge variant="secondary" className="ml-2">Configured</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedStoreId && Object.keys(mappingConfigs).length > 1 && (
                      <div>
                        <Label htmlFor="copyFrom">Copy Configuration From</Label>
                        <Select onValueChange={copyFromStore}>
                          <SelectTrigger>
                            <SelectValue placeholder="Copy from another store" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(mappingConfigs)
                              .filter(config => config.storeId !== selectedStoreId)
                              .map((config) => (
                                <SelectItem key={config.storeId} value={config.storeId}>
                                  <div className="flex items-center gap-2">
                                    <Copy className="h-3 w-3" />
                                    {config.storeName}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Form */}
              {currentConfig && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: stores.find(s => s.id === selectedStoreId)?.color }}
                      />
                      {currentConfig.storeName} - Order Data Mapping
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Configure how Shopify order data maps to Order Card fields for this store
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    
                    {/* Order ID Mapping */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">Order ID Mapping</h3>
                      </div>
                      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                        <div>
                          <Label htmlFor="orderIdSource">Order ID Source</Label>
                          <Select
                            value={currentConfig.orderIdSource}
                            onValueChange={(value: 'order_name' | 'order_id' | 'line_item_id' | 'custom_field') => 
                              updateMappingConfig('orderIdSource', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="order_name">Order Name (#1001)</SelectItem>
                              <SelectItem value="order_id">Order ID</SelectItem>
                              <SelectItem value="line_item_id">Line Item ID</SelectItem>
                              <SelectItem value="custom_field">Custom Field</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {currentConfig.orderIdSource === 'custom_field' && (
                          <div>
                            <Label htmlFor="orderIdCustomField">Custom Field Name</Label>
                            <Input
                              id="orderIdCustomField"
                              value={currentConfig.orderIdCustomField || ''}
                              onChange={(e) => updateMappingConfig('orderIdCustomField', e.target.value)}
                              placeholder="Enter custom field name"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Product Name Mapping */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">Product Name Mapping</h3>
                      </div>
                      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                        <div>
                          <Label htmlFor="productNameSource">Product Name Source</Label>
                          <Select
                            value={currentConfig.productNameSource}
                            onValueChange={(value: 'line_item_title' | 'product_title' | 'product_handle' | 'custom_field') => 
                              updateMappingConfig('productNameSource', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="line_item_title">Line Item Title</SelectItem>
                              <SelectItem value="product_title">Product Title</SelectItem>
                              <SelectItem value="product_handle">Product Handle</SelectItem>
                              <SelectItem value="custom_field">Custom Field</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {currentConfig.productNameSource === 'custom_field' && (
                          <div>
                            <Label htmlFor="productNameCustomField">Custom Field Name</Label>
                            <Input
                              id="productNameCustomField"
                              value={currentConfig.productNameCustomField || ''}
                              onChange={(e) => updateMappingConfig('productNameCustomField', e.target.value)}
                              placeholder="Enter custom field name"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Date Mapping */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">Date Mapping</h3>
                      </div>
                      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                        <div>
                          <Label htmlFor="dateSource">Date Source</Label>
                          <Select
                            value={currentConfig.dateSource}
                            onValueChange={(value: 'tags' | 'created_at' | 'processed_at' | 'custom_field') => 
                              updateMappingConfig('dateSource', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tags">Order Tags</SelectItem>
                              <SelectItem value="created_at">Created Date</SelectItem>
                              <SelectItem value="processed_at">Processed Date</SelectItem>
                              <SelectItem value="custom_field">Custom Field</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="dateFormat">Date Format</Label>
                          <Select
                            value={currentConfig.dateFormat}
                            onValueChange={(value: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') => 
                              updateMappingConfig('dateFormat', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {currentConfig.dateSource === 'tags' && (
                        <div>
                          <Label htmlFor="dateTagPattern">Date Tag Pattern (Regex)</Label>
                          <Input
                            id="dateTagPattern"
                            value={currentConfig.dateTagPattern}
                            onChange={(e) => updateMappingConfig('dateTagPattern', e.target.value)}
                            placeholder="(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})"
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Delivery Type Mapping */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">Delivery Type Mapping</h3>
                      </div>
                      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                        <div>
                          <Label htmlFor="deliveryTypeSource">Delivery Type Source</Label>
                          <Select
                            value={currentConfig.deliveryTypeSource}
                            onValueChange={(value: 'tags' | 'line_item_properties' | 'order_note' | 'custom_field') => 
                              updateMappingConfig('deliveryTypeSource', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tags">Order Tags</SelectItem>
                              <SelectItem value="line_item_properties">Line Item Properties</SelectItem>
                              <SelectItem value="order_note">Order Note</SelectItem>
                              <SelectItem value="custom_field">Custom Field</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {currentConfig.deliveryTypeSource === 'custom_field' && (
                          <div>
                            <Label htmlFor="deliveryTypeCustomField">Custom Field Name</Label>
                            <Input
                              id="deliveryTypeCustomField"
                              value={currentConfig.deliveryTypeCustomField || ''}
                              onChange={(e) => updateMappingConfig('deliveryTypeCustomField', e.target.value)}
                              placeholder="Enter custom field name"
                            />
                          </div>
                        )}
                      </div>
                      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
                        <div>
                          <Label htmlFor="deliveryKeywords">Delivery Keywords</Label>
                          <Input
                            id="deliveryKeywords"
                            value={currentConfig.deliveryTypeKeywords.delivery.join(', ')}
                            onChange={(e) => updateDeliveryTypeKeywords('delivery', e.target.value)}
                            placeholder="delivery, deliver"
                          />
                        </div>
                        <div>
                          <Label htmlFor="collectionKeywords">Collection Keywords</Label>
                          <Input
                            id="collectionKeywords"
                            value={currentConfig.deliveryTypeKeywords.collection.join(', ')}
                            onChange={(e) => updateDeliveryTypeKeywords('collection', e.target.value)}
                            placeholder="collection, pickup, collect"
                          />
                        </div>
                        <div>
                          <Label htmlFor="expressKeywords">Express Keywords</Label>
                          <Input
                            id="expressKeywords"
                            value={currentConfig.deliveryTypeKeywords.express.join(', ')}
                            onChange={(e) => updateDeliveryTypeKeywords('express', e.target.value)}
                            placeholder="express, urgent, rush"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Customer Info Mapping */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">Customer Info Mapping</h3>
                      </div>
                      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
                        <div>
                          <Label htmlFor="customerNameFormat">Name Format</Label>
                          <Select
                            value={currentConfig.customerNameFormat}
                            onValueChange={(value: 'first_last' | 'last_first' | 'full_name') => 
                              updateMappingConfig('customerNameFormat', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="first_last">First Last</SelectItem>
                              <SelectItem value="last_first">Last, First</SelectItem>
                              <SelectItem value="full_name">Full Name</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeCustomerPhone"
                            checked={currentConfig.includeCustomerPhone}
                            onCheckedChange={(checked) => updateMappingConfig('includeCustomerPhone', checked)}
                          />
                          <Label htmlFor="includeCustomerPhone">Include Phone</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeCustomerEmail"
                            checked={currentConfig.includeCustomerEmail}
                            onCheckedChange={(checked) => updateMappingConfig('includeCustomerEmail', checked)}
                          />
                          <Label htmlFor="includeCustomerEmail">Include Email</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Additional Order Properties */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">Additional Order Properties</h3>
                      </div>
                      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeTotalPrice"
                            checked={currentConfig.includeTotalPrice}
                            onCheckedChange={(checked) => updateMappingConfig('includeTotalPrice', checked)}
                          />
                          <Label htmlFor="includeTotalPrice">Include Total Price</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeCurrency"
                            checked={currentConfig.includeCurrency}
                            onCheckedChange={(checked) => updateMappingConfig('includeCurrency', checked)}
                          />
                          <Label htmlFor="includeCurrency">Include Currency</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeFulfillmentStatus"
                            checked={currentConfig.includeFulfillmentStatus}
                            onCheckedChange={(checked) => updateMappingConfig('includeFulfillmentStatus', checked)}
                          />
                          <Label htmlFor="includeFulfillmentStatus">Include Fulfillment Status</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeFinancialStatus"
                            checked={currentConfig.includeFinancialStatus}
                            onCheckedChange={(checked) => updateMappingConfig('includeFinancialStatus', checked)}
                          />
                          <Label htmlFor="includeFinancialStatus">Include Financial Status</Label>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 