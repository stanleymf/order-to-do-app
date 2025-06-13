import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, MapPin, Clock, Package, User, FileText, Tag, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { type User as UserType } from '../types';
import { useMobileView } from './Dashboard';

interface ShopifyMappingConfig {
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

interface SettingsProps {
  currentUser: UserType;
}

const defaultMappingConfig: ShopifyMappingConfig = {
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

export function Settings({ currentUser }: SettingsProps) {
  const [mappingConfig, setMappingConfig] = useState<ShopifyMappingConfig>(defaultMappingConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
        setMappingConfig(JSON.parse(savedConfig));
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

  const updateInstructionsKeywords = (keywords: string) => {
    setMappingConfig(prev => ({
      ...prev,
      instructionsKeywords: keywords.split(',').map(k => k.trim()).filter(k => k)
    }));
  };

  const updateExcludeProperties = (properties: string) => {
    setMappingConfig(prev => ({
      ...prev,
      excludeProperties: properties.split(',').map(p => p.trim()).filter(p => p)
    }));
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

      {/* Shopify Order Mapping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-lg' : ''}`}>
            <Package className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Shopify Order Mapping Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Mapping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Date Mapping</h3>
            </div>
            <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
              <div>
                <Label htmlFor="dateSource">Date Source</Label>
                <Select
                  value={mappingConfig.dateSource}
                  onValueChange={(value: 'tags' | 'created_at' | 'custom_field') => 
                    updateMappingConfig('dateSource', value)
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
              </div>
              <div>
                <Label htmlFor="dateTagPattern">Date Pattern (Regex)</Label>
                <Input
                  id="dateTagPattern"
                  value={mappingConfig.dateTagPattern}
                  onChange={(e) => updateMappingConfig('dateTagPattern', e.target.value)}
                  placeholder="(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})"
                />
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
            </div>
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
                  onValueChange={(value: 'tags' | 'line_item_properties' | 'order_note') => 
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeslotTagPattern">Timeslot Pattern (Regex)</Label>
                <Input
                  id="timeslotTagPattern"
                  value={mappingConfig.timeslotTagPattern}
                  onChange={(e) => updateMappingConfig('timeslotTagPattern', e.target.value)}
                  placeholder="(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})"
                />
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
                    <SelectItem value="HH:MM-HH:MM">HH:MM-HH:MM</SelectItem>
                    <SelectItem value="HH:MM AM/PM-HH:MM AM/PM">HH:MM AM/PM-HH:MM AM/PM</SelectItem>
                    <SelectItem value="HAM/PM-HAM/PM">HAM/PM-HAM/PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Type Mapping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Delivery Type Mapping</h3>
            </div>
            <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
              <div>
                <Label htmlFor="deliveryTypeSource">Delivery Type Source</Label>
                <Select
                  value={mappingConfig.deliveryTypeSource}
                  onValueChange={(value: 'tags' | 'line_item_properties' | 'order_note') => 
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
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
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
          </div>

          <Separator />

          {/* Instructions Mapping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Instructions Mapping</h3>
            </div>
            <div className={`grid ${isMobileView ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
              <div>
                <Label htmlFor="instructionsSource">Instructions Source</Label>
                <Select
                  value={mappingConfig.instructionsSource}
                  onValueChange={(value: 'line_item_properties' | 'order_note' | 'both') => 
                    updateMappingConfig('instructionsSource', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line_item_properties">Line Item Properties</SelectItem>
                    <SelectItem value="order_note">Order Note</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="instructionsPropertyName">Property Name</Label>
                <Input
                  id="instructionsPropertyName"
                  value={mappingConfig.instructionsPropertyName}
                  onChange={(e) => updateMappingConfig('instructionsPropertyName', e.target.value)}
                  placeholder="Special Instructions"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="instructionsKeywords">Instruction Keywords (comma-separated)</Label>
              <Input
                id="instructionsKeywords"
                value={mappingConfig.instructionsKeywords.join(', ')}
                onChange={(e) => updateInstructionsKeywords(e.target.value)}
                placeholder="instruction, note, special, request, preference"
              />
            </div>
          </div>

          <Separator />

          {/* Customizations Mapping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Customizations Mapping</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customizationsSource">Customizations Source</Label>
                <Select
                  value={mappingConfig.customizationsSource}
                  onValueChange={(value: 'line_item_properties' | 'order_note' | 'both') => 
                    updateMappingConfig('customizationsSource', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line_item_properties">Line Item Properties</SelectItem>
                    <SelectItem value="order_note">Order Note</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="excludeProperties">Exclude Properties (comma-separated)</Label>
                <Input
                  id="excludeProperties"
                  value={mappingConfig.excludeProperties.join(', ')}
                  onChange={(e) => updateExcludeProperties(e.target.value)}
                  placeholder="Delivery Time, Special Instructions, delivery, time"
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
        </CardContent>
      </Card>
    </div>
  );
} 