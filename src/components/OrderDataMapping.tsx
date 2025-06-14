import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Database, Store, ArrowRight, Plus, Trash2, Copy, RotateCcw, Save, AlertCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { getStores } from '../utils/storage';
import { type Store as StoreType } from '../types';

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