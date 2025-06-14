import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Database, Store, ArrowRight, Plus, Trash2, Copy, RotateCcw, Save, AlertCircle, Settings, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getStores } from '../utils/storage';
import { type Store as StoreType } from '../types';
import { loadMappingConfig, saveMappingConfig } from '../utils/shopifyApi';

// Fixed Order Card Components that require Shopify order data
const ORDER_CARD_COMPONENTS = [
  { 
    key: 'orderId', 
    label: 'Order ID', 
    type: 'text', 
    description: 'Unique identifier displayed on the order card (e.g., #12345)',
    currentlyShown: true
  },
  { 
    key: 'productName', 
    label: 'Product Name', 
    type: 'text', 
    description: 'Main product title shown prominently on the card',
    currentlyShown: true
  },
  { 
    key: 'productVariant', 
    label: 'Product Variant', 
    type: 'text', 
    description: 'Product variant/option shown in italics below product name',
    currentlyShown: true
  },
  { 
    key: 'customerName', 
    label: 'Customer Name', 
    type: 'text', 
    description: 'Customer full name (currently not shown but available)',
    currentlyShown: false
  },
  { 
    key: 'customerEmail', 
    label: 'Customer Email', 
    type: 'text', 
    description: 'Customer email address (currently not shown but available)',
    currentlyShown: false
  },
  { 
    key: 'customerPhone', 
    label: 'Customer Phone', 
    type: 'text', 
    description: 'Customer phone number (currently not shown but available)',
    currentlyShown: false
  },
  { 
    key: 'timeslot', 
    label: 'Timeslot', 
    type: 'text', 
    description: 'Delivery/pickup time slot shown as badge (e.g., "2:00 PM - 4:00 PM")',
    currentlyShown: true
  },
  { 
    key: 'deliveryDate', 
    label: 'Delivery Date', 
    type: 'date', 
    description: 'Delivery/pickup date (currently derived from timeslot)',
    currentlyShown: false
  },
  { 
    key: 'deliveryType', 
    label: 'Delivery Type', 
    type: 'badge', 
    description: 'Type of delivery with color-coded badge (Express=Red, Collection=Blue, Delivery=Green)',
    currentlyShown: true
  },
  { 
    key: 'totalPrice', 
    label: 'Total Price', 
    type: 'currency', 
    description: 'Order total amount (currently not shown but available)',
    currentlyShown: false
  },
  { 
    key: 'currency', 
    label: 'Currency', 
    type: 'text', 
    description: 'Currency code (currently not shown but available)',
    currentlyShown: false
  },
  { 
    key: 'specialInstructions', 
    label: 'Special Instructions', 
    type: 'text', 
    description: 'Order-specific notes and instructions shown in remarks section',
    currentlyShown: true
  },
  { 
    key: 'productCustomizations', 
    label: 'Product Customizations', 
    type: 'text', 
    description: 'Product customization details shown in blue box',
    currentlyShown: true
  },
  { 
    key: 'fulfillmentStatus', 
    label: 'Fulfillment Status', 
    type: 'status', 
    description: 'Shopify fulfillment status (currently not shown but available)',
    currentlyShown: false
  },
  { 
    key: 'financialStatus', 
    label: 'Financial Status', 
    type: 'status', 
    description: 'Shopify financial status (currently not shown but available)',
    currentlyShown: false
  }
];

// Available Shopify Fields organized by category
const SHOPIFY_FIELDS = {
  'Order Info': [
    { key: 'id', label: 'Order ID', example: '12345', description: 'Shopify internal order ID' },
    { key: 'name', label: 'Order Name', example: '#1001', description: 'Order number with # prefix' },
    { key: 'order_number', label: 'Order Number', example: '1001', description: 'Order number without prefix' },
    { key: 'email', label: 'Order Email', example: 'customer@example.com', description: 'Customer email from order' },
    { key: 'phone', label: 'Order Phone', example: '+1234567890', description: 'Customer phone from order' },
    { key: 'created_at', label: 'Created At', example: '2024-01-15T10:30:00Z', description: 'When order was created' },
    { key: 'updated_at', label: 'Updated At', example: '2024-01-15T11:00:00Z', description: 'When order was last updated' },
    { key: 'processed_at', label: 'Processed At', example: '2024-01-15T10:35:00Z', description: 'When order was processed' },
    { key: 'total_price', label: 'Total Price', example: '99.99', description: 'Order total amount' },
    { key: 'subtotal_price', label: 'Subtotal Price', example: '89.99', description: 'Order subtotal' },
    { key: 'total_tax', label: 'Total Tax', example: '10.00', description: 'Total tax amount' },
    { key: 'currency', label: 'Currency', example: 'USD', description: 'Currency code' },
    { key: 'financial_status', label: 'Financial Status', example: 'paid', description: 'Payment status' },
    { key: 'fulfillment_status', label: 'Fulfillment Status', example: 'fulfilled', description: 'Fulfillment status' },
    { key: 'tags', label: 'Order Tags', example: 'express,gift,2024-01-20,2pm-4pm', description: 'Comma-separated tags' },
    { key: 'note', label: 'Order Note', example: 'Handle with care', description: 'Order notes' }
  ],
  'Customer Info': [
    { key: 'customer.id', label: 'Customer ID', example: '67890', description: 'Shopify customer ID' },
    { key: 'customer.first_name', label: 'Customer First Name', example: 'John', description: 'Customer first name' },
    { key: 'customer.last_name', label: 'Customer Last Name', example: 'Doe', description: 'Customer last name' },
    { key: 'customer.email', label: 'Customer Email', example: 'john@example.com', description: 'Customer email' },
    { key: 'customer.phone', label: 'Customer Phone', example: '+1234567890', description: 'Customer phone' }
  ],
  'Line Items': [
    { key: 'line_items[0].title', label: 'First Item Title', example: 'Rose Bouquet', description: 'Title of first line item' },
    { key: 'line_items[0].variant_title', label: 'First Item Variant', example: 'Red Roses', description: 'Variant of first line item' },
    { key: 'line_items[0].quantity', label: 'First Item Quantity', example: '1', description: 'Quantity of first item' },
    { key: 'line_items[0].price', label: 'First Item Price', example: '49.99', description: 'Price of first item' },
    { key: 'line_items[0].sku', label: 'First Item SKU', example: 'ROSE-RED-001', description: 'SKU of first item' },
    { key: 'line_items[*].title', label: 'All Item Titles', example: 'Rose Bouquet, Vase', description: 'All line item titles' },
    { key: 'line_items[*].quantity', label: 'All Item Quantities', example: '1, 1', description: 'All line item quantities' }
  ],
  'Shipping Address': [
    { key: 'shipping_address.first_name', label: 'Shipping First Name', example: 'Jane', description: 'Shipping address first name' },
    { key: 'shipping_address.last_name', label: 'Shipping Last Name', example: 'Smith', description: 'Shipping address last name' },
    { key: 'shipping_address.address1', label: 'Shipping Address 1', example: '123 Main St', description: 'Primary shipping address' },
    { key: 'shipping_address.address2', label: 'Shipping Address 2', example: 'Apt 4B', description: 'Secondary shipping address' },
    { key: 'shipping_address.city', label: 'Shipping City', example: 'New York', description: 'Shipping city' },
    { key: 'shipping_address.province', label: 'Shipping Province', example: 'NY', description: 'Shipping state/province' },
    { key: 'shipping_address.country', label: 'Shipping Country', example: 'United States', description: 'Shipping country' },
    { key: 'shipping_address.zip', label: 'Shipping Zip', example: '10001', description: 'Shipping postal code' },
    { key: 'shipping_address.phone', label: 'Shipping Phone', example: '+1234567890', description: 'Shipping phone number' }
  ],
  'Line Item Properties': [
    { key: 'line_items[0].properties[delivery_date]', label: 'Delivery Date Property', example: '2024-01-20', description: 'Custom delivery date property' },
    { key: 'line_items[0].properties[delivery_time]', label: 'Delivery Time Property', example: '2:00 PM - 4:00 PM', description: 'Custom delivery time property' },
    { key: 'line_items[0].properties[special_instructions]', label: 'Special Instructions Property', example: 'Ring doorbell twice', description: 'Custom instructions property' },
    { key: 'line_items[0].properties[card_message]', label: 'Card Message Property', example: 'Happy Birthday!', description: 'Custom card message property' },
    { key: 'line_items[0].properties[recipient_name]', label: 'Recipient Name Property', example: 'Sarah Johnson', description: 'Custom recipient name property' }
  ]
};

// Formatting Methods available for transforming Shopify data
const FORMATTING_METHODS = [
  { 
    key: 'direct', 
    label: 'Direct Copy', 
    description: 'Use the field value as-is', 
    example: 'customer.first_name → John',
    configFields: []
  },
  { 
    key: 'extract_regex', 
    label: 'Extract with Regex', 
    description: 'Extract part of the field using regex pattern', 
    example: 'tags → /2024-\\d{2}-\\d{2}/ → 2024-01-20',
    configFields: ['regexPattern']
  },
  { 
    key: 'split_extract', 
    label: 'Split & Extract', 
    description: 'Split by delimiter and extract specific part', 
    example: 'tags → split(",")[2] → 2024-01-20',
    configFields: ['splitDelimiter', 'extractIndex']
  },
  { 
    key: 'date_format', 
    label: 'Date Format', 
    description: 'Format date/time fields', 
    example: 'created_at → MM/DD/YYYY → 01/15/2024',
    configFields: ['dateFormat']
  },
  { 
    key: 'currency_format', 
    label: 'Currency Format', 
    description: 'Format currency with symbol', 
    example: 'total_price → $99.99',
    configFields: ['currencySymbol']
  },
  { 
    key: 'text_transform', 
    label: 'Text Transform', 
    description: 'Transform text case', 
    example: 'customer.first_name → UPPERCASE → JOHN',
    configFields: ['textTransform']
  },
  { 
    key: 'concatenate', 
    label: 'Concatenate Fields', 
    description: 'Combine multiple fields', 
    example: 'first_name + " " + last_name → John Doe',
    configFields: ['concatenateExpression']
  },
  { 
    key: 'conditional', 
    label: 'Conditional Logic', 
    description: 'Use if/then logic based on conditions', 
    example: 'tags contains "express" ? "Express" : "Standard"',
    configFields: ['conditionalLogic']
  },
  { 
    key: 'mathematical', 
    label: 'Mathematical Operation', 
    description: 'Perform calculations', 
    example: 'quantity * price → 99.99',
    configFields: ['mathematicalExpression']
  },
  { 
    key: 'lookup_table', 
    label: 'Lookup Table', 
    description: 'Map values using lookup table', 
    example: 'financial_status → {"paid":"Completed", "pending":"Pending"}',
    configFields: ['lookupTable']
  },
  { 
    key: 'filter_array', 
    label: 'Filter Array Items', 
    description: 'Filter and extract from arrays', 
    example: 'line_items where quantity > 1',
    configFields: ['filterCondition']
  }
];

// Store-specific field mapping interface
interface StoreFieldMapping {
  id: string;
  orderCardComponent: string;
  shopifyField: string;
  formattingMethod: string;
  formattingConfig: {
    regexPattern?: string;
    splitDelimiter?: string;
    extractIndex?: number;
    dateFormat?: string;
    currencySymbol?: string;
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'title';
    concatenateExpression?: string;
    conditionalLogic?: string;
    mathematicalExpression?: string;
    lookupTable?: { [key: string]: string };
    filterCondition?: string;
  };
  fallbackValue?: string;
  isActive: boolean;
  priority: number;
}

interface StoreOrderMappingConfig {
  storeId: string;
  storeName: string;
  fieldMappings: StoreFieldMapping[];
  createdAt: Date;
  updatedAt: Date;
}

export function OrderDataMapping() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [configs, setConfigs] = useState<{ [storeId: string]: StoreOrderMappingConfig }>({});
  const [currentConfig, setCurrentConfig] = useState<StoreOrderMappingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date sync settings state
  const [dateSyncConfig, setDateSyncConfig] = useState(() => loadMappingConfig());

  // Load stores and configurations on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storesData = getStores();
        setStores(storesData);
        
        // Load existing configurations from localStorage
        const savedConfigs = localStorage.getItem('store-order-mapping-configs');
        if (savedConfigs) {
          const parsedConfigs = JSON.parse(savedConfigs);
          setConfigs(parsedConfigs);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load stores');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update current config when store selection changes
  useEffect(() => {
    if (selectedStoreId && configs[selectedStoreId]) {
      setCurrentConfig(configs[selectedStoreId]);
    } else if (selectedStoreId) {
      // Create new config for selected store
      const selectedStore = stores.find(s => s.id === selectedStoreId);
      if (selectedStore) {
        const newConfig: StoreOrderMappingConfig = {
          storeId: selectedStoreId,
          storeName: selectedStore.name,
          fieldMappings: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCurrentConfig(newConfig);
      }
    } else {
      setCurrentConfig(null);
    }
  }, [selectedStoreId, configs, stores]);

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
  };

  const addFieldMapping = () => {
    if (!currentConfig) return;

    const newMapping: StoreFieldMapping = {
      id: `mapping_${Date.now()}`,
      orderCardComponent: '',
      shopifyField: '',
      formattingMethod: 'direct',
      formattingConfig: {},
      fallbackValue: '',
      isActive: true,
      priority: currentConfig.fieldMappings.length + 1
    };

    const updatedConfig = {
      ...currentConfig,
      fieldMappings: [...currentConfig.fieldMappings, newMapping],
      updatedAt: new Date()
    };

    setCurrentConfig(updatedConfig);
  };

  const updateFieldMapping = (mappingId: string, updates: Partial<StoreFieldMapping>) => {
    if (!currentConfig) return;

    const updatedMappings = currentConfig.fieldMappings.map(mapping =>
      mapping.id === mappingId ? { ...mapping, ...updates } : mapping
    );

    const updatedConfig = {
      ...currentConfig,
      fieldMappings: updatedMappings,
      updatedAt: new Date()
    };

    setCurrentConfig(updatedConfig);
  };

  const deleteFieldMapping = (mappingId: string) => {
    if (!currentConfig) return;

    const updatedMappings = currentConfig.fieldMappings.filter(mapping => mapping.id !== mappingId);
    
    const updatedConfig = {
      ...currentConfig,
      fieldMappings: updatedMappings,
      updatedAt: new Date()
    };

    setCurrentConfig(updatedConfig);
  };

  const saveConfiguration = () => {
    if (!currentConfig) return;

    const updatedConfigs = {
      ...configs,
      [currentConfig.storeId]: currentConfig
    };

    setConfigs(updatedConfigs);
    localStorage.setItem('store-order-mapping-configs', JSON.stringify(updatedConfigs));
    
    toast.success(`Configuration saved for ${currentConfig.storeName}`);
  };

  const resetConfiguration = () => {
    if (!currentConfig) return;

    const resetConfig = {
      ...currentConfig,
      fieldMappings: [],
      updatedAt: new Date()
    };

    setCurrentConfig(resetConfig);
    toast.info(`Configuration reset for ${currentConfig.storeName}`);
  };

  const copyFromStore = (sourceStoreId: string) => {
    if (!currentConfig || !configs[sourceStoreId]) return;

    const sourceConfig = configs[sourceStoreId];
    const copiedMappings = sourceConfig.fieldMappings.map(mapping => ({
      ...mapping,
      id: `mapping_${Date.now()}_${Math.random()}`
    }));

    const updatedConfig = {
      ...currentConfig,
      fieldMappings: copiedMappings,
      updatedAt: new Date()
    };

    setCurrentConfig(updatedConfig);
    toast.success(`Configuration copied from ${sourceConfig.storeName}`);
  };

  // Date sync configuration handlers
  const updateDateSyncConfig = (updates: Partial<typeof dateSyncConfig>) => {
    const updatedConfig = { ...dateSyncConfig, ...updates };
    setDateSyncConfig(updatedConfig);
  };

  const saveDateSyncConfig = () => {
    try {
      saveMappingConfig(dateSyncConfig);
      toast.success('Date sync settings saved successfully');
    } catch (error) {
      toast.error('Failed to save date sync settings');
    }
  };

  const resetDateSyncConfig = () => {
    const defaultConfig = loadMappingConfig();
    setDateSyncConfig(defaultConfig);
    toast.info('Date sync settings reset to defaults');
  };

  // Helper function to render formatting configuration fields
  const renderFormattingConfig = (mapping: StoreFieldMapping) => {
    const method = FORMATTING_METHODS.find(m => m.key === mapping.formattingMethod);
    if (!method || method.configFields.length === 0) return null;

    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
        <h5 className="font-medium text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {method.label} Configuration
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {method.configFields.map(field => {
            switch (field) {
              case 'regexPattern':
                return (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">Regex Pattern</Label>
                    <Input
                      placeholder="e.g., /2024-\\d{2}-\\d{2}/"
                      value={mapping.formattingConfig.regexPattern || ''}
                      onChange={(e) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, regexPattern: e.target.value }
                      })}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">Regular expression to extract data</p>
                  </div>
                );

              case 'splitDelimiter':
                return (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">Split Delimiter</Label>
                    <Input
                      placeholder="e.g., , or | or ;"
                      value={mapping.formattingConfig.splitDelimiter || ''}
                      onChange={(e) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, splitDelimiter: e.target.value }
                      })}
                    />
                    <p className="text-xs text-gray-500">Character to split the text by</p>
                  </div>
                );

              case 'extractIndex':
                return (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">Extract Index</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={mapping.formattingConfig.extractIndex || 0}
                      onChange={(e) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, extractIndex: parseInt(e.target.value) || 0 }
                      })}
                    />
                    <p className="text-xs text-gray-500">Index of the part to extract (0-based)</p>
                  </div>
                );

              case 'dateFormat':
                return (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">Date Format</Label>
                    <Select
                      value={mapping.formattingConfig.dateFormat || 'MM/DD/YYYY'}
                      onValueChange={(value) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, dateFormat: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                        <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Output date format</p>
                  </div>
                );

              case 'currencySymbol':
                return (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">Currency Symbol</Label>
                    <Select
                      value={mapping.formattingConfig.currencySymbol || '$'}
                      onValueChange={(value) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, currencySymbol: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$">$ (USD)</SelectItem>
                        <SelectItem value="€">€ (EUR)</SelectItem>
                        <SelectItem value="£">£ (GBP)</SelectItem>
                        <SelectItem value="¥">¥ (JPY)</SelectItem>
                        <SelectItem value="₹">₹ (INR)</SelectItem>
                        <SelectItem value="C$">C$ (CAD)</SelectItem>
                        <SelectItem value="A$">A$ (AUD)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Currency symbol to display</p>
                  </div>
                );

              case 'textTransform':
                return (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">Text Transform</Label>
                    <Select
                      value={mapping.formattingConfig.textTransform || 'capitalize'}
                      onValueChange={(value: 'uppercase' | 'lowercase' | 'capitalize' | 'title') => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, textTransform: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uppercase">UPPERCASE</SelectItem>
                        <SelectItem value="lowercase">lowercase</SelectItem>
                        <SelectItem value="capitalize">Capitalize</SelectItem>
                        <SelectItem value="title">Title Case</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">How to transform the text case</p>
                  </div>
                );

              case 'concatenateExpression':
                return (
                  <div key={field} className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Concatenate Expression</Label>
                    <Input
                      placeholder='e.g., first_name + " " + last_name'
                      value={mapping.formattingConfig.concatenateExpression || ''}
                      onChange={(e) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, concatenateExpression: e.target.value }
                      })}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">Expression to combine fields (use + to join)</p>
                  </div>
                );

              case 'conditionalLogic':
                return (
                  <div key={field} className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Conditional Logic</Label>
                    <Input
                      placeholder='e.g., tags contains "express" ? "Express" : "Standard"'
                      value={mapping.formattingConfig.conditionalLogic || ''}
                      onChange={(e) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, conditionalLogic: e.target.value }
                      })}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">If/then logic using ? : syntax</p>
                  </div>
                );

              case 'mathematicalExpression':
                return (
                  <div key={field} className="space-y-2">
                    <Label className="text-sm">Mathematical Operation</Label>
                    <Select
                      value={mapping.formattingConfig.mathematicalExpression || '+'}
                      onValueChange={(value) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, mathematicalExpression: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+">Addition (+)</SelectItem>
                        <SelectItem value="-">Subtraction (-)</SelectItem>
                        <SelectItem value="*">Multiplication (×)</SelectItem>
                        <SelectItem value="/">Division (÷)</SelectItem>
                        <SelectItem value="%">Modulo (%)</SelectItem>
                        <SelectItem value="**">Power (^)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Mathematical operation to perform</p>
                  </div>
                );

              case 'lookupTable':
                return (
                  <div key={field} className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Lookup Table (JSON)</Label>
                    <Input
                      placeholder='{"paid":"Completed", "pending":"Pending", "refunded":"Refunded"}'
                      value={JSON.stringify(mapping.formattingConfig.lookupTable || {})}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value || '{}');
                          updateFieldMapping(mapping.id, {
                            formattingConfig: { ...mapping.formattingConfig, lookupTable: parsed }
                          });
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">JSON object mapping input values to output values</p>
                  </div>
                );

              case 'filterCondition':
                return (
                  <div key={field} className="space-y-2 md:col-span-2">
                    <Label className="text-sm">Filter Condition</Label>
                    <Input
                      placeholder="e.g., quantity > 1 or title contains 'special'"
                      value={mapping.formattingConfig.filterCondition || ''}
                      onChange={(e) => updateFieldMapping(mapping.id, {
                        formattingConfig: { ...mapping.formattingConfig, filterCondition: e.target.value }
                      })}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">Condition to filter array items</p>
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>

        {/* Example for current method */}
        <div className="bg-white border rounded p-3">
          <p className="text-xs font-medium text-gray-700 mb-1">Example:</p>
          <p className="text-xs text-gray-600 font-mono">{method.example}</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Data Mapping</h1>
          <p className="text-gray-600">Configure how Shopify order data maps to Order Card components for each store</p>
        </div>
      </div>

      {/* Store Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="store-select">Select Store to Configure</Label>
              <Select value={selectedStoreId} onValueChange={handleStoreSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a store..." />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: store.color }}
                        />
                        {store.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStoreId && (
              <div className="flex gap-2">
                <Select onValueChange={copyFromStore}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Copy from store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores
                      .filter(store => store.id !== selectedStoreId && configs[store.id])
                      .map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          <div className="flex items-center gap-2">
                            <Copy className="h-3 w-3" />
                            {store.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={resetConfiguration}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <Button onClick={saveConfiguration}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical Configuration Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Database className="h-5 w-5" />
            Hierarchical Configuration System
          </CardTitle>
          <p className="text-sm text-blue-700">
            Understanding how global baseline and store-specific configurations work together
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Global Baseline Configuration
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Serves as the default for <strong>all stores</strong></p>
                <p>• Configured in the Date Sync Settings below</p>
                <p>• Used when no store-specific override exists</p>
                <p>• Always active as the fallback configuration</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Store-Specific Overrides
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Override <strong>specific Order Card components</strong> only</p>
                <p>• Configured in the Field Mappings section</p>
                <p>• Takes precedence over global baseline</p>
                <p>• Other components still use global configuration</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Example Configuration Flow:</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Global:</strong> Date from Order Tags (DD/MM/YYYY), Timeslot from Order Tags</p>
              <p><strong>Store A Override:</strong> Timeslot from Line Item Properties</p>
              <p><strong>Result for Store A:</strong> Date from Order Tags (global) + Timeslot from Line Item Properties (override)</p>
              <p><strong>Result for Store B:</strong> Date from Order Tags (global) + Timeslot from Order Tags (global)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Global Baseline Configuration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure the default settings used by all stores (unless overridden by store-specific mappings)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Current Settings Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Current Configuration</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Date Source:</span>
                <span className="ml-2 text-blue-700 capitalize">{dateSyncConfig.dateSource}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Date Format:</span>
                <span className="ml-2 text-blue-700">{dateSyncConfig.dateFormat}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Pattern:</span>
                <span className="ml-2 text-blue-700 font-mono text-xs">{dateSyncConfig.dateTagPattern}</span>
              </div>
            </div>
          </div>

          {/* Date Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Date Source */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Source</Label>
              <Select
                value={dateSyncConfig.dateSource}
                onValueChange={(value: 'tags' | 'created_at' | 'custom_field') => 
                  updateDateSyncConfig({ dateSource: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tags">Order Tags</SelectItem>
                  <SelectItem value="created_at">Order Created Date</SelectItem>
                  <SelectItem value="custom_field">Custom Field</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Where to look for delivery date information in Shopify orders
              </p>
            </div>

            {/* Date Format */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Format</Label>
              <Select
                value={dateSyncConfig.dateFormat}
                onValueChange={(value: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') => 
                  updateDateSyncConfig({ dateFormat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Day/Month/Year)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (Month/Day/Year)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (Year-Month-Day)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                How dates are formatted in your Shopify order tags
              </p>
            </div>

            {/* Date Pattern (only show if source is tags) */}
            {dateSyncConfig.dateSource === 'tags' && (
              <div className="space-y-3 md:col-span-2">
                <Label className="text-sm font-medium">Date Extraction Pattern (Regex)</Label>
                <Input
                  value={dateSyncConfig.dateTagPattern}
                  onChange={(e) => updateDateSyncConfig({ dateTagPattern: e.target.value })}
                  placeholder="(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})"
                  className="font-mono text-sm"
                />
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Regex pattern to extract dates from order tags</p>
                  <p><strong>Current pattern matches:</strong> 13/06/2025, 13-06-2025, 13/06/25</p>
                  <p><strong>Example tags:</strong> "delivery, 13/06/2025, 2pm-4pm" → extracts "13/06/2025"</p>
                </div>
              </div>
            )}

          </div>

          {/* Timeslot Configuration */}
          <Separator />
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeslot Settings
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Timeslot Source */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Timeslot Source</Label>
                <Select
                  value={dateSyncConfig.timeslotSource}
                  onValueChange={(value: 'tags' | 'line_item_properties' | 'order_note') => 
                    updateDateSyncConfig({ timeslotSource: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tags">Order Tags</SelectItem>
                    <SelectItem value="line_item_properties">Line Item Properties</SelectItem>
                    <SelectItem value="order_note">Order Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timeslot Format */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Timeslot Format</Label>
                <Select
                  value={dateSyncConfig.timeslotFormat}
                  onValueChange={(value: 'HH:MM-HH:MM' | 'HH:MM AM/PM-HH:MM AM/PM' | 'HAM/PM-HAM/PM') => 
                    updateDateSyncConfig({ timeslotFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HH:MM-HH:MM">24-hour (09:00-11:00)</SelectItem>
                    <SelectItem value="HH:MM AM/PM-HH:MM AM/PM">12-hour (9:00 AM - 11:00 AM)</SelectItem>
                    <SelectItem value="HAM/PM-HAM/PM">Short (9AM - 11AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timeslot Pattern (only show if source is tags) */}
              {dateSyncConfig.timeslotSource === 'tags' && (
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-sm font-medium">Timeslot Extraction Pattern (Regex)</Label>
                  <Input
                    value={dateSyncConfig.timeslotTagPattern}
                    onChange={(e) => updateDateSyncConfig({ timeslotTagPattern: e.target.value })}
                    placeholder="(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})"
                    className="font-mono text-sm"
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Regex pattern to extract timeslots from order tags</p>
                    <p><strong>Current pattern matches:</strong> 09:00-11:00, 2:00-4:00</p>
                    <p><strong>Example tags:</strong> "delivery, 13/06/2025, 09:00-11:00" → extracts "09:00-11:00"</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={saveDateSyncConfig} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Date Settings
            </Button>
            <Button variant="outline" onClick={resetDateSyncConfig}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          {/* Example Section */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h5 className="font-medium mb-3">Example Usage</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Shopify Tag</Badge>
                <ArrowRight className="h-3 w-3" />
                <code className="bg-white px-2 py-1 rounded text-xs">delivery, 13/06/2025, 09:00-11:00</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Extracted Date</Badge>
                <ArrowRight className="h-3 w-3" />
                <span className="text-green-600 font-medium">June 13, 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Extracted Timeslot</Badge>
                <ArrowRight className="h-3 w-3" />
                <span className="text-blue-600 font-medium">9:00 AM - 11:00 AM</span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Order Card Components Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Order Card Components Reference
          </CardTitle>
          <p className="text-sm text-gray-600">
            These are the components that can be displayed on Order Cards and require Shopify order data
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ORDER_CARD_COMPONENTS.map(component => (
              <div key={component.key} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{component.label}</h4>
                  <Badge variant={component.currentlyShown ? "default" : "secondary"}>
                    {component.currentlyShown ? "Currently Shown" : "Available"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{component.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Field Mappings Configuration */}
      {currentConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: stores.find(s => s.id === selectedStoreId)?.color }}
              />
              {currentConfig.storeName} - Field Mappings
            </CardTitle>
            <p className="text-sm text-gray-600">
              Map Shopify order fields to Order Card components using various formatting methods
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Add New Mapping Button */}
            <Button onClick={addFieldMapping} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Field Mapping
            </Button>

            {/* Field Mappings List */}
            <div className="space-y-4">
              {currentConfig.fieldMappings.map((mapping) => (
                <Card key={mapping.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      
                      {/* Mapping Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{mapping.priority}</Badge>
                          <Switch
                            checked={mapping.isActive}
                            onCheckedChange={(checked) => updateFieldMapping(mapping.id, { isActive: checked })}
                          />
                          <span className="text-sm text-gray-600">
                            {mapping.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFieldMapping(mapping.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Mapping Flow: Shopify Field → Formatting → Order Card Component */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        
                        {/* Shopify Field Selection */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Shopify Field</Label>
                          <Select
                            value={mapping.shopifyField}
                            onValueChange={(value) => updateFieldMapping(mapping.id, { shopifyField: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SHOPIFY_FIELDS).map(([category, fields]) => (
                                <div key={category}>
                                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                    {category}
                                  </div>
                                  {fields.map(field => (
                                    <SelectItem key={field.key} value={field.key}>
                                      <div>
                                        <div className="font-medium">{field.label}</div>
                                        <div className="text-xs text-gray-500">{field.example}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>

                        {/* Formatting Method */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Formatting Method</Label>
                          <Select
                            value={mapping.formattingMethod}
                            onValueChange={(value) => updateFieldMapping(mapping.id, { formattingMethod: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method..." />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMATTING_METHODS.map(method => (
                                <SelectItem key={method.key} value={method.key}>
                                  <div>
                                    <div className="font-medium">{method.label}</div>
                                    <div className="text-xs text-gray-500">{method.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>

                        {/* Order Card Component Selection */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Order Card Component</Label>
                          <Select
                            value={mapping.orderCardComponent}
                            onValueChange={(value) => updateFieldMapping(mapping.id, { orderCardComponent: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select component..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_CARD_COMPONENTS.map(component => (
                                <SelectItem key={component.key} value={component.key}>
                                  <div>
                                    <div className="font-medium">{component.label}</div>
                                    <div className="text-xs text-gray-500">{component.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Dynamic Formatting Configuration */}
                      {renderFormattingConfig(mapping)}

                      {/* Fallback Value */}
                      <div className="space-y-2">
                        <Label className="text-sm">Fallback Value (optional)</Label>
                        <Input
                          placeholder="Value to use if mapping fails..."
                          value={mapping.fallbackValue || ''}
                          onChange={(e) => updateFieldMapping(mapping.id, { fallbackValue: e.target.value })}
                        />
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))}

              {currentConfig.fieldMappings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No field mappings configured yet.</p>
                  <p className="text-sm">Click "Add Field Mapping" to get started.</p>
                </div>
              )}
            </div>

            {/* Save Button */}
            {currentConfig.fieldMappings.length > 0 && (
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={saveConfiguration} size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium">Select Shopify Field</h3>
              <p className="text-sm text-gray-600">Choose which Shopify order field contains your data</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium">Apply Formatting</h3>
              <p className="text-sm text-gray-600">Transform the data using various formatting methods</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium">Map to Component</h3>
              <p className="text-sm text-gray-600">Display the formatted data in the Order Card component</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Example Mapping Flow:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">tags</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="outline">Extract Regex: /2024-\d{2}-\d{2}/</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="outline">Delivery Date</Badge>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                This extracts a date like "2024-01-20" from order tags and displays it as the delivery date on the order card.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 