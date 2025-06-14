import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Loader2,
  Settings,
  Store,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../contexts/StoreContext';
import { 
  multiStoreWebhookManager, 
  type StoreWebhookConfig
} from '../utils/multiStoreWebhooks';

export function MultiStoreWebhookManager() {
  const { allStores } = useStore();
  const [storeConfigs, setStoreConfigs] = useState<StoreWebhookConfig[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<{
    storeId: string;
    storeName: string;
    totalWebhooks: number;
    requiredTopics: string[];
    missingTopics: string[];
    status: 'complete' | 'partial' | 'none';
  }[]>([]);
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [storeWebhookDetails, setStoreWebhookDetails] = useState<{
    [storeId: string]: {
      webhooks: any[];
      loading: boolean;
      error?: string;
    }
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [newConfig, setNewConfig] = useState<Partial<StoreWebhookConfig>>({
    accessToken: '',
    shopDomain: '',
    apiVersion: '2024-10',
    webhookSecret: '',
    enabled: true,
    autoSync: true,
    syncInterval: 60 // 1 minute default
  });

  // Load store configurations on component mount
  useEffect(() => {
    console.log('🔄 MultiStoreWebhookManager: Initial load');
    loadStoreConfigs();
    loadWebhookStatus();
  }, []);

  // Clean up orphaned webhook configurations when stores change
  useEffect(() => {
    if (allStores.length > 0) {
      console.log('🔄 MultiStoreWebhookManager: Store list changed, checking for orphaned configs');
      console.log('Current stores:', allStores.map(s => s.name));
      cleanupOrphanedConfigs();
      loadStoreConfigs(); // Reload after cleanup
    }
  }, [allStores]);

  const loadStoreConfigs = () => {
    const configs = multiStoreWebhookManager.getAllStoreConfigs();
    console.log('📊 Loading webhook configs:', configs.map(c => ({ name: c.storeName, id: c.storeId })));
    setStoreConfigs(configs);
  };

  const cleanupOrphanedConfigs = () => {
    const configs = multiStoreWebhookManager.getAllStoreConfigs();
    const validStoreIds = allStores.map(store => store.id);
    
    console.log('🧹 Cleanup check - Valid store IDs:', validStoreIds);
    console.log('🧹 Cleanup check - Current configs:', configs.map(c => ({ name: c.storeName, id: c.storeId })));
    
    // Find configurations for stores that no longer exist
    const orphanedConfigs = configs.filter(config => !validStoreIds.includes(config.storeId));
    
    if (orphanedConfigs.length > 0) {
      console.log(`🧹 Cleaning up ${orphanedConfigs.length} orphaned webhook configurations`);
      orphanedConfigs.forEach(config => {
        multiStoreWebhookManager.removeStoreConfig(config.storeId);
        console.log(`🧹 Removed orphaned webhook config for: ${config.storeName} (${config.storeId})`);
      });
    } else {
      console.log('✅ No orphaned webhook configurations found');
    }
  };

  const loadWebhookStatus = async () => {
    try {
      const status = await multiStoreWebhookManager.getWebhookStatusForAllStores();
      setWebhookStatus(status);
    } catch (error) {
      console.error('Error loading webhook status:', error);
    }
  };

  const toggleStoreExpansion = async (storeId: string) => {
    const newExpanded = new Set(expandedStores);
    
    if (expandedStores.has(storeId)) {
      newExpanded.delete(storeId);
    } else {
      newExpanded.add(storeId);
      // Load webhook details if not already loaded
      if (!storeWebhookDetails[storeId]) {
        await loadWebhookDetails(storeId);
      }
    }
    
    setExpandedStores(newExpanded);
  };

  const loadWebhookDetails = async (storeId: string) => {
    const config = storeConfigs.find(c => c.storeId === storeId);
    if (!config) return;

    setStoreWebhookDetails(prev => ({
      ...prev,
      [storeId]: { webhooks: [], loading: true }
    }));

    try {
      const webhooks = await multiStoreWebhookManager.getExistingWebhooks(config);
      setStoreWebhookDetails(prev => ({
        ...prev,
        [storeId]: { webhooks, loading: false }
      }));
    } catch (error) {
      console.error(`Error loading webhook details for ${config.storeName}:`, error);
      setStoreWebhookDetails(prev => ({
        ...prev,
        [storeId]: { 
          webhooks: [], 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load webhooks'
        }
      }));
    }
  };

  const formatWebhookTopic = (topic: string): string => {
    return topic.split('/').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  const getWebhookStatusIcon = () => {
    // You can add logic here to determine webhook health
    // For now, we'll assume all fetched webhooks are active
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const availableStores = allStores.filter(store => !storeConfigs.find(config => config.storeId === store.id));
  
  console.log('🏪 Available stores for webhook config:', availableStores.map(s => s.name));

  const handleAddStoreConfig = () => {
    if (!selectedStore || !newConfig.accessToken || !newConfig.shopDomain) {
      toast.error('Please fill in all required fields');
      return;
    }

    const store = allStores.find(s => s.id === selectedStore);
    if (!store) {
      toast.error('Selected store not found');
      return;
    }

    const config: StoreWebhookConfig = {
      storeId: selectedStore,
      storeName: store.name,
      accessToken: newConfig.accessToken!,
      shopDomain: newConfig.shopDomain!,
      apiVersion: newConfig.apiVersion || '2024-10',
      webhookSecret: newConfig.webhookSecret,
      enabled: newConfig.enabled ?? true,
      autoSync: newConfig.autoSync ?? true,
      syncInterval: newConfig.syncInterval ?? 60
    };

    multiStoreWebhookManager.addStoreConfig(config);
    loadStoreConfigs();
    
    // Reset form
    setSelectedStore('');
    setNewConfig({
      accessToken: '',
      shopDomain: '',
      apiVersion: '2024-10',
      webhookSecret: '',
      enabled: true,
      autoSync: true,
      syncInterval: 60
    });

    toast.success(`Webhook configuration added for ${store.name}`);
  };

  const handleRemoveStoreConfig = (storeId: string) => {
    const config = storeConfigs.find(c => c.storeId === storeId);
    if (config) {
      multiStoreWebhookManager.removeStoreConfig(storeId);
      loadStoreConfigs();
      toast.success(`Webhook configuration removed for ${config.storeName}`);
    }
  };

  const handleToggleStoreConfig = (storeId: string, enabled: boolean) => {
    const config = storeConfigs.find(c => c.storeId === storeId);
    if (config) {
      const updatedConfig = { ...config, enabled };
      multiStoreWebhookManager.addStoreConfig(updatedConfig);
      loadStoreConfigs();
      toast.success(`${config.storeName} webhooks ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const handleRegisterWebhooksForStore = async (storeId: string) => {
    setIsLoading(true);
    try {
      const config = storeConfigs.find(c => c.storeId === storeId);
      if (!config) {
        toast.error('Store configuration not found');
        return;
      }

      const result = await multiStoreWebhookManager.autoRegisterWebhooksForStore(config);
      
      if (result.success) {
        const totalWebhooks = result.registered.length + result.existing.length;
        toast.success(`Webhooks registered for ${config.storeName}: ${totalWebhooks} total (${result.registered.length} new, ${result.existing.length} existing)`);
      } else {
        toast.error(`Webhook registration failed for ${config.storeName} with ${result.errors.length} errors`);
      }

      loadWebhookStatus();
    } catch (error) {
      console.error('Error registering webhooks:', error);
      toast.error('Failed to register webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterWebhooksForAllStores = async () => {
    setIsLoading(true);
    try {
      const results = await multiStoreWebhookManager.autoRegisterWebhooksForAllStores();
      
      const successful = results.filter(r => r.success).length;
      const total = results.length;
      
      if (successful === total) {
        toast.success(`Webhooks registered for all ${total} stores`);
      } else {
        toast.error(`Webhooks registered for ${successful}/${total} stores`);
      }

      loadWebhookStatus();
    } catch (error) {
      console.error('Error registering webhooks for all stores:', error);
      toast.error('Failed to register webhooks for all stores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupWebhooksForAllStores = async () => {
    setIsLoading(true);
    try {
      const results = await multiStoreWebhookManager.cleanupOldWebhooksForAllStores();
      
      const totalDeleted = results.reduce((sum, r) => sum + r.deleted.length, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
      
      if (totalErrors === 0) {
        toast.success(`Cleaned up ${totalDeleted} old webhooks from all stores`);
      } else {
        toast.error(`Cleanup completed with ${totalErrors} errors`);
      }

      loadWebhookStatus();
    } catch (error) {
      console.error('Error cleaning up webhooks:', error);
      toast.error('Failed to cleanup webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnectivity = async () => {
    setIsLoading(true);
    try {
      const isAccessible = await multiStoreWebhookManager.testWebhookConnectivity();
      
      if (isAccessible) {
        toast.success('Webhook endpoint is accessible');
      } else {
        toast.error('Webhook endpoint is not accessible');
      }
    } catch (error) {
      console.error('Error testing webhook connectivity:', error);
      toast.error('Failed to test webhook connectivity');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: 'complete' | 'partial' | 'none') => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'none':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">None</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Multi-Store Webhook Management</h2>
          <p className="text-gray-600">Manage webhooks for all your Shopify stores</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTestConnectivity}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Test Connectivity
          </Button>
          <Button
            onClick={handleRegisterWebhooksForAllStores}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
            Register All Stores
          </Button>
          <Button
            onClick={handleCleanupWebhooksForAllStores}
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Cleanup All
          </Button>
        </div>
      </div>

      {/* Add New Store Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Store Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store">Store</Label>
              <Select 
                value={selectedStore} 
                onValueChange={setSelectedStore}
                disabled={availableStores.length === 0}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      availableStores.length === 0 
                        ? "No stores available to configure" 
                        : "Select a store"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableStores
                    .filter(store => store.id && store.id.trim() !== '')
                    .map(store => (
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
                  {availableStores.length === 0 && (
                    <SelectItem value="no-stores-available" disabled>
                      All stores already configured
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableStores.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Add stores in Store Management first, or all available stores are already configured.
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="shopDomain">Shop Domain</Label>
              <Input
                id="shopDomain"
                placeholder="my-store.myshopify.com"
                value={newConfig.shopDomain}
                onChange={(e) => setNewConfig({ ...newConfig, shopDomain: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter Shopify access token"
                value={newConfig.accessToken}
                onChange={(e) => setNewConfig({ ...newConfig, accessToken: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="apiVersion">API Version</Label>
              <Select 
                value={newConfig.apiVersion} 
                onValueChange={(value) => setNewConfig({ ...newConfig, apiVersion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-10">2024-10</SelectItem>
                  <SelectItem value="2024-07">2024-07</SelectItem>
                  <SelectItem value="2024-04">2024-04</SelectItem>
                  <SelectItem value="2024-01">2024-01</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
              <Input
                id="webhookSecret"
                type="password"
                placeholder="Enter webhook secret"
                value={newConfig.webhookSecret}
                onChange={(e) => setNewConfig({ ...newConfig, webhookSecret: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={newConfig.enabled}
                onCheckedChange={(checked) => setNewConfig({ ...newConfig, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable webhooks for this store</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="autoSync"
                checked={newConfig.autoSync}
                onCheckedChange={(checked) => setNewConfig({ ...newConfig, autoSync: checked })}
              />
              <Label htmlFor="autoSync">Enable auto-sync for this store</Label>
            </div>
            
            {newConfig.autoSync && (
              <div>
                <Label htmlFor="syncInterval">Sync Interval</Label>
                <Select 
                  value={newConfig.syncInterval?.toString() || '60'} 
                  onValueChange={(value) => setNewConfig({ ...newConfig, syncInterval: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds (Very Fast)</SelectItem>
                    <SelectItem value="30">30 seconds (Fast)</SelectItem>
                    <SelectItem value="60">1 minute (Recommended)</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  How often to sync orders from this store
                </p>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleAddStoreConfig} 
            className="w-full"
            disabled={availableStores.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Store Configuration
          </Button>
          {availableStores.length === 0 && (
            <p className="text-xs text-center text-gray-500 mt-2">
              All available stores have been configured for webhooks. Add new stores in Store Management to configure additional webhook endpoints.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Store Configurations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Store Configurations</h3>
        
        {storeConfigs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No store configurations added yet.</p>
              <p className="text-sm">Add a store configuration above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          storeConfigs.map(config => {
            const status = webhookStatus.find(s => s.storeId === config.storeId);
            const store = allStores.find(s => s.id === config.storeId);
            const isExpanded = expandedStores.has(config.storeId);
            const webhookDetails = storeWebhookDetails[config.storeId];
            
            return (
              <Card key={config.storeId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: store?.color || '#gray' }}
                      />
                      <div>
                        <h4 className="font-medium">{config.storeName}</h4>
                        <p className="text-sm text-gray-500">{config.shopDomain}</p>
                        {config.autoSync && (
                          <p className="text-xs text-blue-600">
                            Auto-sync: {config.syncInterval < 60 
                              ? `${config.syncInterval}s` 
                              : config.syncInterval < 3600 
                                ? `${Math.round(config.syncInterval / 60)}m`
                                : `${Math.round(config.syncInterval / 3600)}h`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {status && getStatusBadge(status.status)}
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(checked) => handleToggleStoreConfig(config.storeId, checked)}
                        />
                        <span className="text-sm text-gray-600">
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      
                      <Button
                        onClick={() => toggleStoreExpansion(config.storeId)}
                        variant="outline"
                        size="sm"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Webhooks
                      </Button>
                      
                      <Button
                        onClick={() => handleRegisterWebhooksForStore(config.storeId)}
                        disabled={isLoading || !config.enabled}
                        size="sm"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
                        Register
                      </Button>
                      
                      <Button
                        onClick={() => handleRemoveStoreConfig(config.storeId)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {status && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span>Webhooks: {status.totalWebhooks}/{status.requiredTopics.length}</span>
                        <span>Missing: {status.missingTopics.length}</span>
                      </div>
                      
                      {status.missingTopics.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Missing topics:</p>
                          <div className="flex flex-wrap gap-1">
                            {status.missingTopics.map(topic => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable Webhook Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Active Webhooks</h5>
                        <Button
                          onClick={() => loadWebhookDetails(config.storeId)}
                          variant="outline"
                          size="sm"
                          disabled={webhookDetails?.loading}
                        >
                          {webhookDetails?.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Refresh
                        </Button>
                      </div>

                      {webhookDetails?.loading && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-gray-500">Loading webhooks...</span>
                        </div>
                      )}

                      {webhookDetails?.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-700">Error loading webhooks</span>
                          </div>
                          <p className="text-xs text-red-600 mt-1">{webhookDetails.error}</p>
                        </div>
                      )}

                      {webhookDetails?.webhooks && webhookDetails.webhooks.length === 0 && !webhookDetails.loading && !webhookDetails.error && (
                        <div className="text-center py-8 text-gray-500">
                          <Webhook className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No webhooks configured</p>
                          <p className="text-xs">Click "Register" to create webhooks</p>
                        </div>
                      )}

                      {webhookDetails?.webhooks && webhookDetails.webhooks.length > 0 && (
                        <div className="space-y-3">
                          {webhookDetails.webhooks.map((webhook, index) => (
                            <div key={webhook.id || index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getWebhookStatusIcon()}
                                    <span className="font-medium text-sm">
                                      {formatWebhookTopic(webhook.topic)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {webhook.format || 'json'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <div className="flex items-center gap-1">
                                      <ExternalLink className="h-3 w-3" />
                                      <span className="font-mono break-all">{webhook.address}</span>
                                    </div>
                                    
                                    {webhook.created_at && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Created: {formatDate(webhook.created_at)}</span>
                                      </div>
                                    )}
                                    
                                    {webhook.updated_at && webhook.updated_at !== webhook.created_at && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Updated: {formatDate(webhook.updated_at)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-2">
                                  <Badge 
                                    variant={webhook.id ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    ID: {webhook.id || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="text-xs text-gray-500 text-center pt-2">
                            Total: {webhookDetails.webhooks.length} webhook{webhookDetails.webhooks.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Add Store Configuration:</strong> Configure webhook settings for each store</p>
          <p>• <strong>Register Webhooks:</strong> Create webhooks for orders and products</p>
          <p>• <strong>Cleanup:</strong> Remove old webhooks pointing to different URLs</p>
          <p>• <strong>Test Connectivity:</strong> Verify webhook endpoint is accessible</p>
          <p className="text-amber-600 font-medium">Note: Webhooks will be registered for your current deployment URL</p>
        </CardContent>
      </Card>
    </div>
  );
} 