import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Tag, 
  Clock, 
  MapPin, 
  FileText, 
  User, 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Copy,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { Store } from '../types';
import { getStores } from '../utils/storage';
import { useMobileView } from './Dashboard';

// Store-specific mapping configuration interface
export interface StoreOrderMappingConfig {
  storeId: string;
  storeName: string; // For display purposes
  
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
  
  // Add-Ons mapping (Product Customizations)
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

export function StoreOrderMapping() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [mappingConfigs, setMappingConfigs] = useState<{ [storeId: string]: StoreOrderMappingConfig }>({});
  const [currentConfig, setCurrentConfig] = useState<StoreOrderMappingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get mobile view context
  const { isMobileView } = useMobileView();

  useEffect(() => {
    loadStoresAndConfigs();
  }, []);

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

  const updateExcludeProperties = (properties: string) => {
    if (!currentConfig) return;
    
    const propertiesArray = properties.split(',').map(p => p.trim()).filter(p => p.length > 0);
    updateMappingConfig('addOnsExcludeProperties', propertiesArray);
  };

  const updateRemarksKeywords = (keywords: string) => {
    if (!currentConfig) return;
    
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    updateMappingConfig('remarksKeywords', keywordArray);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading store configurations...</span>
        </CardContent>
      </Card>
    );
  }

  if (stores.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Stores Found</h3>
          <p className="text-gray-500 mb-4">
            You need to add stores before configuring order data mapping.
          </p>
          <p className="text-sm text-gray-400">
            Go to Store Management section above to add your first store.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
            <Package className="h-5 w-5 text-gray-500" />
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

            {/* Product Variant Mapping */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Product Variant Mapping</h3>
              </div>
              <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                <div>
                  <Label htmlFor="productVariantSource">Product Variant Source</Label>
                  <Select
                    value={currentConfig.productVariantSource}
                    onValueChange={(value: 'line_item_variant_title' | 'variant_title' | 'sku' | 'custom_field') => 
                      updateMappingConfig('productVariantSource', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line_item_variant_title">Line Item Variant Title</SelectItem>
                      <SelectItem value="variant_title">Variant Title</SelectItem>
                      <SelectItem value="sku">SKU</SelectItem>
                      <SelectItem value="custom_field">Custom Field</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {currentConfig.productVariantSource === 'custom_field' && (
                  <div>
                    <Label htmlFor="productVariantCustomField">Custom Field Name</Label>
                    <Input
                      id="productVariantCustomField"
                      value={currentConfig.productVariantCustomField || ''}
                      onChange={(e) => updateMappingConfig('productVariantCustomField', e.target.value)}
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
              {currentConfig.dateSource === 'custom_field' && (
                <div>
                  <Label htmlFor="dateCustomField">Custom Field Name</Label>
                  <Input
                    id="dateCustomField"
                    value={currentConfig.dateCustomField || ''}
                    onChange={(e) => updateMappingConfig('dateCustomField', e.target.value)}
                    placeholder="Enter custom field name"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Timeslot Mapping */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Timeslot Mapping</h3>
              </div>
              <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                <div>
                  <Label htmlFor="timeslotSource">Timeslot Source</Label>
                  <Select
                    value={currentConfig.timeslotSource}
                    onValueChange={(value: 'tags' | 'line_item_properties' | 'order_note' | 'custom_field') => 
                      updateMappingConfig('timeslotSource', value)
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
                <div>
                  <Label htmlFor="timeslotFormat">Timeslot Format</Label>
                  <Select
                    value={currentConfig.timeslotFormat}
                    onValueChange={(value: 'HH:MM-HH:MM' | 'HH:MM AM/PM-HH:MM AM/PM' | 'HAM/PM-HAM/PM') => 
                      updateMappingConfig('timeslotFormat', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HH:MM-HH:MM">24H (14:00-16:00)</SelectItem>
                      <SelectItem value="HH:MM AM/PM-HH:MM AM/PM">12H (2:00 PM-4:00 PM)</SelectItem>
                      <SelectItem value="HAM/PM-HAM/PM">Short (2PM-4PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {currentConfig.timeslotSource === 'tags' && (
                <div>
                  <Label htmlFor="timeslotTagPattern">Timeslot Tag Pattern (Regex)</Label>
                  <Input
                    id="timeslotTagPattern"
                    value={currentConfig.timeslotTagPattern}
                    onChange={(e) => updateMappingConfig('timeslotTagPattern', e.target.value)}
                    placeholder="(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})"
                  />
                </div>
              )}
              {currentConfig.timeslotSource === 'custom_field' && (
                <div>
                  <Label htmlFor="timeslotCustomField">Custom Field Name</Label>
                  <Input
                    id="timeslotCustomField"
                    value={currentConfig.timeslotCustomField || ''}
                    onChange={(e) => updateMappingConfig('timeslotCustomField', e.target.value)}
                    placeholder="Enter custom field name"
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

            {/* Add-Ons Mapping */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Add-Ons Mapping (Product Customizations)</h3>
              </div>
              <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                <div>
                  <Label htmlFor="addOnsSource">Add-Ons Source</Label>
                  <Select
                    value={currentConfig.addOnsSource}
                    onValueChange={(value: 'line_item_properties' | 'order_note' | 'custom_field' | 'both') => 
                      updateMappingConfig('addOnsSource', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line_item_properties">Line Item Properties</SelectItem>
                      <SelectItem value="order_note">Order Note</SelectItem>
                      <SelectItem value="custom_field">Custom Field</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {currentConfig.addOnsSource === 'custom_field' && (
                  <div>
                    <Label htmlFor="addOnsCustomField">Custom Field Name</Label>
                    <Input
                      id="addOnsCustomField"
                      value={currentConfig.addOnsCustomField || ''}
                      onChange={(e) => updateMappingConfig('addOnsCustomField', e.target.value)}
                      placeholder="Enter custom field name"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="addOnsExcludeProperties">Exclude Properties (comma-separated)</Label>
                <Input
                  id="addOnsExcludeProperties"
                  value={currentConfig.addOnsExcludeProperties.join(', ')}
                  onChange={(e) => updateExcludeProperties(e.target.value)}
                  placeholder="Delivery Time, Special Instructions, delivery, time"
                />
              </div>
            </div>

            <Separator />

            {/* Remarks Mapping */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Remarks Mapping</h3>
              </div>
              <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                <div>
                  <Label htmlFor="remarksSource">Remarks Source</Label>
                  <Select
                    value={currentConfig.remarksSource}
                    onValueChange={(value: 'line_item_properties' | 'order_note' | 'custom_field' | 'both') => 
                      updateMappingConfig('remarksSource', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line_item_properties">Line Item Properties</SelectItem>
                      <SelectItem value="order_note">Order Note</SelectItem>
                      <SelectItem value="custom_field">Custom Field</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {currentConfig.remarksSource === 'custom_field' && (
                  <div>
                    <Label htmlFor="remarksCustomField">Custom Field Name</Label>
                    <Input
                      id="remarksCustomField"
                      value={currentConfig.remarksCustomField || ''}
                      onChange={(e) => updateMappingConfig('remarksCustomField', e.target.value)}
                      placeholder="Enter custom field name"
                    />
                  </div>
                )}
              </div>
              <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
                <div>
                  <Label htmlFor="remarksPropertyName">Property Name</Label>
                  <Input
                    id="remarksPropertyName"
                    value={currentConfig.remarksPropertyName}
                    onChange={(e) => updateMappingConfig('remarksPropertyName', e.target.value)}
                    placeholder="Special Instructions"
                  />
                </div>
                <div>
                  <Label htmlFor="remarksKeywords">Remarks Keywords (comma-separated)</Label>
                  <Input
                    id="remarksKeywords"
                    value={currentConfig.remarksKeywords.join(', ')}
                    onChange={(e) => updateRemarksKeywords(e.target.value)}
                    placeholder="instruction, note, special, request, preference"
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
                      <SelectItem value="last_first">Last First</SelectItem>
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
                <SettingsIcon className="h-4 w-4 text-gray-500" />
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
    </div>
  );
} 