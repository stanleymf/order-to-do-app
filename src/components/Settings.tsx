import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, MapPin, Clock, Package, User, FileText, Tag, Save, RefreshCw, Calendar, Key, Webhook, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type User as UserType } from '../types';
import { useMobileView } from './Dashboard';
import { webhookManager } from '../utils/shopifyWebhooks';

interface ShopifyAPIConfig {
  accessToken: string;
  shopDomain: string;
  apiVersion: string;
  webhookSecret?: string;
  autoSync: boolean;
  syncInterval: number; // in minutes
}

interface ShopifyMappingConfig {
  // API Configuration
  api: ShopifyAPIConfig;
  
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
}

interface SettingsProps {
  currentUser: UserType;
}

const defaultMappingConfig: ShopifyMappingConfig = {
  // API Configuration
  api: {
    accessToken: '',
    shopDomain: '',
    apiVersion: '2024-10',
    webhookSecret: '',
    autoSync: true,
    syncInterval: 60 // 1 minute default
  },
  
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
  includeFinancialStatus: true
};

export function Settings({ currentUser }: SettingsProps) {
  const [mappingConfig, setMappingConfig] = useState<ShopifyMappingConfig>(defaultMappingConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{
    registered: any[];
    existing: any[];
    errors: string[];
  } | null>(null);
  
  // Get mobile view context
  const { isMobileView } = useMobileView();

  // Check if user is admin
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    loadMappingConfig();
  }, []);

  const loadMappingConfig = async () => {
    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem('shopify-mapping-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Ensure the api property exists
        if (!parsedConfig.api) {
          parsedConfig.api = {
            accessToken: '',
            shopDomain: '',
            apiVersion: '2024-01',
            webhookSecret: '',
            autoSync: true,
            syncInterval: 60
          };
          // Save the updated config
          localStorage.setItem('shopify-mapping-config', JSON.stringify(parsedConfig));
        }
        
        setMappingConfig(parsedConfig);
      }
    } catch (error) {
      console.error('Error loading mapping config:', error);
      toast.error('Failed to load mapping configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMappingConfig = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('shopify-mapping-config', JSON.stringify(mappingConfig));
      toast.success('Mapping configuration saved successfully');
    } catch (error) {
      console.error('Error saving mapping config:', error);
      toast.error('Failed to save mapping configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setMappingConfig(defaultMappingConfig);
    toast.info('Reset to default configuration');
  };

  const updateMappingConfig = (key: keyof ShopifyMappingConfig, value: any) => {
    setMappingConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateDeliveryTypeKeywords = (type: 'delivery' | 'collection' | 'express', keywords: string) => {
    setMappingConfig(prev => ({
      ...prev,
      deliveryTypeKeywords: {
        ...prev.deliveryTypeKeywords,
        [type]: keywords.split(',').map(k => k.trim()).filter(k => k)
      }
    }));
  };

  const updateExcludeProperties = (properties: string) => {
    setMappingConfig(prev => ({
      ...prev,
      addOnsExcludeProperties: properties.split(',').map(p => p.trim()).filter(p => p)
    }));
  };

  const updateRemarksKeywords = (keywords: string) => {
    setMappingConfig(prev => ({
      ...prev,
      remarksKeywords: keywords.split(',').map(k => k.trim()).filter(k => k)
    }));
  };

  // Webhook management functions
  const handleAutoRegisterWebhooks = async () => {
    if (!mappingConfig.api.accessToken || !mappingConfig.api.shopDomain) {
      toast.error('Please configure your Shopify API settings first');
      return;
    }

    setIsWebhookLoading(true);
    try {
      const result = await webhookManager.autoRegisterWebhooks();
      setWebhookStatus(result);
      
      if (result.errors.length > 0) {
        // Show detailed error information
        const errorMessage = result.errors.length === 1 
          ? result.errors[0]
          : `Webhook registration completed with ${result.errors.length} errors. Check details below.`;
        toast.error(errorMessage);
      } else {
        const totalWebhooks = result.registered.length + result.existing.length;
        toast.success(`Successfully managed ${totalWebhooks} webhooks (${result.registered.length} new, ${result.existing.length} existing)`);
      }
    } catch (error) {
      console.error('Error registering webhooks:', error);
      toast.error('Failed to register webhooks');
    } finally {
      setIsWebhookLoading(false);
    }
  };

  const handleCleanupWebhooks = async () => {
    setIsWebhookLoading(true);
    try {
      const result = await webhookManager.cleanupOldWebhooks();
      
      if (result.errors.length > 0) {
        toast.error(`Webhook cleanup completed with ${result.errors.length} errors`);
      } else {
        toast.success(`Successfully cleaned up ${result.deleted.length} old webhooks`);
      }
    } catch (error) {
      console.error('Error cleaning up webhooks:', error);
      toast.error('Failed to cleanup webhooks');
    } finally {
      setIsWebhookLoading(false);
    }
  };

  const handleTestWebhookConnectivity = async () => {
    setIsWebhookLoading(true);
    try {
      const isAccessible = await webhookManager.testWebhookConnectivity();
      
      if (isAccessible) {
        toast.success('Webhook endpoint is accessible');
      } else {
        toast.error('Webhook endpoint is not accessible');
      }
    } catch (error) {
      console.error('Error testing webhook connectivity:', error);
      toast.error('Failed to test webhook connectivity');
    } finally {
      setIsWebhookLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="text-center py-12">
            <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You need admin privileges to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold text-gray-900 ${isMobileView ? 'text-xl' : 'text-2xl'}`}>
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure app settings and Shopify order mapping</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={isLoading}
            className={isMobileView ? 'h-8 text-xs' : ''}
          >
            <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''} ${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
            Reset
          </Button>
          <Button
            onClick={saveMappingConfig}
            disabled={isSaving}
            className={isMobileView ? 'h-8 text-xs' : ''}
          >
            <Save className={`mr-2 ${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Shopify API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-lg' : ''}`}>
            <Key className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Shopify API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              value={mappingConfig.api.accessToken}
              onChange={(e) => updateMappingConfig('api', { ...mappingConfig.api, accessToken: e.target.value })}
              placeholder="Enter your Shopify access token"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Your private access token for Shopify API authentication
            </p>
          </div>

          {/* Shop Domain */}
          <div className="space-y-2">
            <Label htmlFor="shopDomain">Shop Domain</Label>
            <Input
              id="shopDomain"
              value={mappingConfig.api.shopDomain}
              onChange={(e) => updateMappingConfig('api', { ...mappingConfig.api, shopDomain: e.target.value })}
              placeholder="your-shop.myshopify.com"
            />
            <p className="text-xs text-gray-500">
              Your Shopify store domain (e.g., my-store.myshopify.com)
            </p>
          </div>

          {/* API Version */}
          <div className="space-y-2">
            <Label htmlFor="apiVersion">API Version</Label>
            <Select
              value={mappingConfig.api.apiVersion}
              onValueChange={(value) => updateMappingConfig('api', { ...mappingConfig.api, apiVersion: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select API version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-10">2024-10 (Latest)</SelectItem>
                <SelectItem value="2024-07">2024-07</SelectItem>
                <SelectItem value="2024-04">2024-04</SelectItem>
                <SelectItem value="2024-01">2024-01</SelectItem>
                <SelectItem value="2023-10">2023-10</SelectItem>
                <SelectItem value="2023-07">2023-07</SelectItem>
                <SelectItem value="2023-04">2023-04</SelectItem>
                <SelectItem value="2023-01">2023-01</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Shopify API version to use for requests
            </p>
          </div>

          {/* Webhook Secret (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
            <Input
              id="webhookSecret"
              type="password"
              value={mappingConfig.api.webhookSecret || ''}
              onChange={(e) => updateMappingConfig('api', { ...mappingConfig.api, webhookSecret: e.target.value })}
              placeholder="Enter webhook secret for verification"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Secret key for webhook verification (optional)
            </p>
          </div>

          <Separator />

          {/* Auto Sync Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoSync">Auto Sync Orders</Label>
                <p className="text-xs text-gray-500">
                  Automatically sync orders from Shopify at regular intervals
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={mappingConfig.api.autoSync}
                onCheckedChange={(checked) => updateMappingConfig('api', { ...mappingConfig.api, autoSync: checked })}
              />
            </div>

            {mappingConfig.api.autoSync && (
              <div className="space-y-2">
                <Label htmlFor="syncInterval">Sync Interval</Label>
                <Select
                  value={mappingConfig.api.syncInterval.toString()}
                  onValueChange={(value) => updateMappingConfig('api', { ...mappingConfig.api, syncInterval: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds (Very Fast)</SelectItem>
                    <SelectItem value="30">30 seconds (Fast)</SelectItem>
                    <SelectItem value="60">1 minute (Recommended)</SelectItem>
                    <SelectItem value="300">5 minutes (Default)</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• <strong>10-30 seconds:</strong> Near real-time updates (uses ~2-6 API calls per minute)</p>
                  <p>• <strong>1-5 minutes:</strong> Balanced performance (recommended for most businesses)</p>
                  <p>• <strong>10+ minutes:</strong> Conservative approach (minimal API usage)</p>
                  <p className="text-amber-600 font-medium">Note: Shopify allows 2 requests/second (120/minute) - choose based on your order volume</p>
                </div>
              </div>
            )}
          </div>

          {/* Webhook Management Section */}
          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Webhook Management</h3>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleAutoRegisterWebhooks}
                disabled={isWebhookLoading || !mappingConfig.api.accessToken}
                variant="outline"
                className="w-full"
              >
                {isWebhookLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Webhook className="mr-2 h-4 w-4" />
                )}
                Auto-Register Webhooks
              </Button>

              <Button
                onClick={handleCleanupWebhooks}
                disabled={isWebhookLoading || !mappingConfig.api.accessToken}
                variant="outline"
                className="w-full"
              >
                {isWebhookLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Cleanup Old Webhooks
              </Button>

              <Button
                onClick={handleTestWebhookConnectivity}
                disabled={isWebhookLoading}
                variant="outline"
                className="w-full"
              >
                {isWebhookLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Test Webhook Connectivity
              </Button>
            </div>

            {/* Webhook Status Display */}
            {webhookStatus && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Webhook Status:</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Registered: {webhookStatus.registered.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-blue-600" />
                    <span>Existing: {webhookStatus.existing.length}</span>
                  </div>
                  {webhookStatus.errors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span>Errors: {webhookStatus.errors.length}</span>
                    </div>
                  )}
                </div>
                
                {webhookStatus.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-600">View Errors</summary>
                    <ul className="mt-1 text-xs text-red-600 space-y-1">
                      {webhookStatus.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>• <strong>Auto-Register:</strong> Creates webhooks for orders and products</p>
              <p>• <strong>Cleanup:</strong> Removes old webhooks pointing to different URLs</p>
              <p>• <strong>Test:</strong> Verifies webhook endpoint is accessible</p>
              <p className="text-amber-600 font-medium">Note: Webhooks will be registered for your current deployment URL</p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Shopify Order Mapping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-lg' : ''}`}>
            <Package className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Shopify Order Data Mapping
          </CardTitle>
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
                  value={mappingConfig.orderIdSource}
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
              {mappingConfig.orderIdSource === 'custom_field' && (
                <div>
                  <Label htmlFor="orderIdCustomField">Custom Field Name</Label>
                  <Input
                    id="orderIdCustomField"
                    value={mappingConfig.orderIdCustomField || ''}
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
                  value={mappingConfig.productNameSource}
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
              {mappingConfig.productNameSource === 'custom_field' && (
                <div>
                  <Label htmlFor="productNameCustomField">Custom Field Name</Label>
                  <Input
                    id="productNameCustomField"
                    value={mappingConfig.productNameCustomField || ''}
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
              <Package className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Product Variant Mapping</h3>
            </div>
            <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
              <div>
                <Label htmlFor="productVariantSource">Product Variant Source</Label>
                <Select
                  value={mappingConfig.productVariantSource}
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
              {mappingConfig.productVariantSource === 'custom_field' && (
                <div>
                  <Label htmlFor="productVariantCustomField">Custom Field Name</Label>
                  <Input
                    id="productVariantCustomField"
                    value={mappingConfig.productVariantCustomField || ''}
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
              <Calendar className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Date Mapping</h3>
            </div>
            <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
              <div>
                <Label htmlFor="dateSource">Date Source</Label>
                <Select
                  value={mappingConfig.dateSource}
                  onValueChange={(value: 'tags' | 'created_at' | 'processed_at' | 'custom_field') => 
                    updateMappingConfig('dateSource', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tags">Order Tags</SelectItem>
                    <SelectItem value="created_at">Order Created Date</SelectItem>
                    <SelectItem value="processed_at">Order Processed Date</SelectItem>
                    <SelectItem value="custom_field">Custom Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={mappingConfig.dateFormat}
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
              {mappingConfig.dateSource === 'custom_field' && (
                <div>
                  <Label htmlFor="dateCustomField">Custom Field Name</Label>
                  <Input
                    id="dateCustomField"
                    value={mappingConfig.dateCustomField || ''}
                    onChange={(e) => updateMappingConfig('dateCustomField', e.target.value)}
                    placeholder="Enter custom field name"
                  />
                </div>
              )}
            </div>
            {mappingConfig.dateSource === 'tags' && (
              <div>
                <Label htmlFor="dateTagPattern">Date Tag Pattern (regex)</Label>
                <Input
                  id="dateTagPattern"
                  value={mappingConfig.dateTagPattern}
                  onChange={(e) => updateMappingConfig('dateTagPattern', e.target.value)}
                  placeholder="(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})"
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
            <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
              <div>
                <Label htmlFor="timeslotSource">Timeslot Source</Label>
                <Select
                  value={mappingConfig.timeslotSource}
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
                  value={mappingConfig.timeslotFormat}
                  onValueChange={(value: 'HH:MM-HH:MM' | 'HH:MM AM/PM-HH:MM AM/PM' | 'HAM/PM-HAM/PM') => 
                    updateMappingConfig('timeslotFormat', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HH:MM-HH:MM">24-Hour (09:00-11:00)</SelectItem>
                    <SelectItem value="HH:MM AM/PM-HH:MM AM/PM">12-Hour (9:00 AM - 11:00 AM)</SelectItem>
                    <SelectItem value="HAM/PM-HAM/PM">Short (9AM - 11AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mappingConfig.timeslotSource === 'custom_field' && (
                <div>
                  <Label htmlFor="timeslotCustomField">Custom Field Name</Label>
                  <Input
                    id="timeslotCustomField"
                    value={mappingConfig.timeslotCustomField || ''}
                    onChange={(e) => updateMappingConfig('timeslotCustomField', e.target.value)}
                    placeholder="Enter custom field name"
                  />
                </div>
              )}
            </div>
            {mappingConfig.timeslotSource === 'tags' && (
              <div>
                <Label htmlFor="timeslotTagPattern">Timeslot Tag Pattern (regex)</Label>
                <Input
                  id="timeslotTagPattern"
                  value={mappingConfig.timeslotTagPattern}
                  onChange={(e) => updateMappingConfig('timeslotTagPattern', e.target.value)}
                  placeholder="(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})"
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
                  value={mappingConfig.deliveryTypeSource}
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
              {mappingConfig.deliveryTypeSource === 'custom_field' && (
                <div>
                  <Label htmlFor="deliveryTypeCustomField">Custom Field Name</Label>
                  <Input
                    id="deliveryTypeCustomField"
                    value={mappingConfig.deliveryTypeCustomField || ''}
                    onChange={(e) => updateMappingConfig('deliveryTypeCustomField', e.target.value)}
                    placeholder="Enter custom field name"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Delivery Type Keywords (comma-separated)</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="deliveryKeywords" className="text-xs text-gray-600">Delivery</Label>
                  <Input
                    id="deliveryKeywords"
                    value={mappingConfig.deliveryTypeKeywords.delivery.join(', ')}
                    onChange={(e) => updateDeliveryTypeKeywords('delivery', e.target.value)}
                    placeholder="delivery, deliver"
                  />
                </div>
                <div>
                  <Label htmlFor="collectionKeywords" className="text-xs text-gray-600">Collection</Label>
                  <Input
                    id="collectionKeywords"
                    value={mappingConfig.deliveryTypeKeywords.collection.join(', ')}
                    onChange={(e) => updateDeliveryTypeKeywords('collection', e.target.value)}
                    placeholder="collection, pickup, collect"
                  />
                </div>
                <div>
                  <Label htmlFor="expressKeywords" className="text-xs text-gray-600">Express</Label>
                  <Input
                    id="expressKeywords"
                    value={mappingConfig.deliveryTypeKeywords.express.join(', ')}
                    onChange={(e) => updateDeliveryTypeKeywords('express', e.target.value)}
                    placeholder="express, urgent, rush"
                  />
                </div>
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
                  value={mappingConfig.addOnsSource}
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
              {mappingConfig.addOnsSource === 'custom_field' && (
                <div>
                  <Label htmlFor="addOnsCustomField">Custom Field Name</Label>
                  <Input
                    id="addOnsCustomField"
                    value={mappingConfig.addOnsCustomField || ''}
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
                value={mappingConfig.addOnsExcludeProperties.join(', ')}
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
                  value={mappingConfig.remarksSource}
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
              {mappingConfig.remarksSource === 'custom_field' && (
                <div>
                  <Label htmlFor="remarksCustomField">Custom Field Name</Label>
                  <Input
                    id="remarksCustomField"
                    value={mappingConfig.remarksCustomField || ''}
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
                  value={mappingConfig.remarksPropertyName}
                  onChange={(e) => updateMappingConfig('remarksPropertyName', e.target.value)}
                  placeholder="Special Instructions"
                />
              </div>
              <div>
                <Label htmlFor="remarksKeywords">Remarks Keywords (comma-separated)</Label>
                <Input
                  id="remarksKeywords"
                  value={mappingConfig.remarksKeywords.join(', ')}
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
                  value={mappingConfig.customerNameFormat}
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
                  checked={mappingConfig.includeCustomerPhone}
                  onCheckedChange={(checked) => updateMappingConfig('includeCustomerPhone', checked)}
                />
                <Label htmlFor="includeCustomerPhone">Include Phone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeCustomerEmail"
                  checked={mappingConfig.includeCustomerEmail}
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
                  checked={mappingConfig.includeTotalPrice}
                  onCheckedChange={(checked) => updateMappingConfig('includeTotalPrice', checked)}
                />
                <Label htmlFor="includeTotalPrice">Include Total Price</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeCurrency"
                  checked={mappingConfig.includeCurrency}
                  onCheckedChange={(checked) => updateMappingConfig('includeCurrency', checked)}
                />
                <Label htmlFor="includeCurrency">Include Currency</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeFulfillmentStatus"
                  checked={mappingConfig.includeFulfillmentStatus}
                  onCheckedChange={(checked) => updateMappingConfig('includeFulfillmentStatus', checked)}
                />
                <Label htmlFor="includeFulfillmentStatus">Include Fulfillment Status</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeFinancialStatus"
                  checked={mappingConfig.includeFinancialStatus}
                  onCheckedChange={(checked) => updateMappingConfig('includeFinancialStatus', checked)}
                />
                <Label htmlFor="includeFinancialStatus">Include Financial Status</Label>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
} 