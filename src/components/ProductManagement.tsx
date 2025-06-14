import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Tag, Search, X, RefreshCw, ExternalLink, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useMobileView } from './Dashboard';
import type { Product, ProductLabel, Store } from '../types';
import { 
  getProducts, 
  getProductLabels, 
  getStores,
  addProductLabel, 
  deleteProductLabel, 
  updateProductDifficultyLabel,
  updateProductTypeLabel 
} from '../utils/storage';
import { syncProductsFromShopify } from '../utils/shopifyApi';
import { multiStoreWebhookManager, type StoreWebhookConfig } from '../utils/multiStoreWebhooks';

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [labels, setLabels] = useState<ProductLabel[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeConfigs, setStoreConfigs] = useState<StoreWebhookConfig[]>([]);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
  const [newLabelCategory, setNewLabelCategory] = useState<'difficulty' | 'productType'>('difficulty');
  const [newLabelPriority, setNewLabelPriority] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<{ [storeId: string]: boolean }>({});
  const [selectedStore, setSelectedStore] = useState<string>('all');
  
  // Get mobile view context
  const { isMobileView } = useMobileView();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProducts());
    setLabels(getProductLabels());
    setStores(getStores());
    setStoreConfigs(multiStoreWebhookManager.getAllStoreConfigs());
  };

  const handleAddLabel = () => {
    if (newLabelName.trim()) {
      addProductLabel(newLabelName.trim(), newLabelColor, newLabelCategory, newLabelPriority);
      setNewLabelName('');
      setNewLabelColor('#3b82f6');
      setNewLabelCategory('difficulty');
      setNewLabelPriority(1);
      setIsAddingLabel(false);
      loadData();
    }
  };

  const handleDeleteLabel = (labelId: string) => {
    if (confirm('Are you sure you want to delete this label? Products using this label will be updated to use the default label.')) {
      deleteProductLabel(labelId);
      loadData();
    }
  };

  const handleUpdateProductDifficultyLabel = (productId: string, newLabel: string) => {
    updateProductDifficultyLabel(productId, newLabel);
    loadData();
  };

  const handleUpdateProductTypeLabel = (productId: string, newLabel: string) => {
    updateProductTypeLabel(productId, newLabel);
    loadData();
  };

  const getLabelByName = (name: string) => {
    return labels.find(label => label.name === name);
  };

  const getStoreById = (storeId: string) => {
    return stores.find(store => store.id === storeId);
  };

  // Handle Shopify sync for a specific store
  const handleShopifySync = async (store: Store) => {
    setIsSyncing(prev => ({ ...prev, [store.id]: true }));
    
    try {
      // Get API configuration for this store
      const storeConfig = multiStoreWebhookManager.getStoreConfig(store.id);
      
      if (!storeConfig) {
        alert(`No API configuration found for ${store.name}. Please configure the store's API settings in Settings → Store API & Webhook Configuration.`);
        return;
      }

      if (!storeConfig.enabled) {
        alert(`API configuration is disabled for ${store.name}. Please enable it in Settings → Store API & Webhook Configuration.`);
        return;
      }

      if (!storeConfig.accessToken || !storeConfig.shopDomain) {
        alert(`Incomplete API configuration for ${store.name}. Please check the access token and shop domain in Settings → Store API & Webhook Configuration.`);
        return;
      }
      
      const syncedProducts = await syncProductsFromShopify(
        store, 
        storeConfig.accessToken, 
        storeConfig.apiVersion || '2024-10'
      );
      
      // Update local storage with synced products
      const existingProducts = getProducts();
      const updatedProducts = [
        ...existingProducts.filter(p => p.storeId !== store.id),
        ...syncedProducts
      ];
      
      // Save to localStorage
      localStorage.setItem('florist-dashboard-products', JSON.stringify(updatedProducts));
      
      loadData();
      alert(`Successfully synced ${syncedProducts.length} products from ${store.name}`);
    } catch (error) {
      console.error('Error syncing products:', error);
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide more specific error guidance
      if (errorMessage.includes('401')) {
        errorMessage = `Authentication failed for ${store.name}. Please check your access token in Store API & Webhook Configuration.`;
      } else if (errorMessage.includes('403')) {
        errorMessage = `Permission denied for ${store.name}. Make sure your app has the required permissions.`;
      } else if (errorMessage.includes('404')) {
        errorMessage = `Store not found: ${store.name}. Please verify the shop domain is correct.`;
      }
      
      alert(`Error syncing products from ${store.name}: ${errorMessage}`);
    } finally {
      setIsSyncing(prev => ({ ...prev, [store.id]: false }));
    }
  };

  // Helper function to check if store is ready for sync
  const isStoreReadyForSync = (store: Store): boolean => {
    const config = storeConfigs.find(c => c.storeId === store.id);
    return !!(config && config.enabled && config.accessToken && config.shopDomain);
  };

  // Helper function to get store configuration status
  const getStoreConfigStatus = (store: Store): 'ready' | 'disabled' | 'incomplete' | 'missing' => {
    const config = storeConfigs.find(c => c.storeId === store.id);
    
    if (!config) return 'missing';
    if (!config.enabled) return 'disabled';
    if (!config.accessToken || !config.shopDomain) return 'incomplete';
    return 'ready';
  };

  // Filter products based on search query and selected store
  const filteredProducts = products.filter(product => {
    // Store filter
    if (selectedStore !== 'all' && product.storeId !== selectedStore) {
      return false;
    }
    
    // Search filter
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.variant && product.variant.toLowerCase().includes(query)) ||
      product.difficultyLabel.toLowerCase().includes(query) ||
      product.productTypeLabel.toLowerCase().includes(query) ||
      (product.shopifyId && product.shopifyId.includes(query)) ||
      (product.handle && product.handle.toLowerCase().includes(query))
    );
  });

  // Group filtered products by store
  const productsByStore = filteredProducts.reduce((acc, product) => {
    if (!acc[product.storeId]) {
      acc[product.storeId] = [];
    }
    acc[product.storeId].push(product);
    return acc;
  }, {} as { [storeId: string]: Product[] });

  const clearSearch = () => {
    setSearchQuery('');
  };

  const openShopifyProduct = (product: Product) => {
    if (product.shopifyId && product.handle) {
      const store = getStoreById(product.storeId);
      if (store) {
        const shopifyUrl = `https://${store.domain}/admin/products/${product.shopifyId}`;
        window.open(shopifyUrl, '_blank');
      }
    }
  };

  return (
    <div className={`${isMobileView ? 'space-y-4 p-3' : 'space-y-6'}`}>
      {/* Labels Management Section */}
      <Card>
        <CardHeader className={`${isMobileView ? 'pb-2' : ''}`}>
          <div className={`flex justify-between ${isMobileView ? 'flex-col gap-2' : 'items-center'}`}>
            <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-base' : ''}`}>
              <Tag className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
              {isMobileView ? 'Labels' : 'Product Labels'}
            </CardTitle>
            <Dialog open={isAddingLabel} onOpenChange={setIsAddingLabel}>
              <DialogTrigger asChild>
                <Button size="sm" className={`${isMobileView ? 'w-full' : ''}`}>
                  <Plus className={`${isMobileView ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                  Add Label
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product Label</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="labelName">Label Name</Label>
                    <Input
                      id="labelName"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="e.g., Very Hard"
                    />
                  </div>
                  <div>
                    <Label htmlFor="labelCategory">Category</Label>
                    <Select value={newLabelCategory} onValueChange={(value: 'difficulty' | 'productType') => setNewLabelCategory(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="difficulty">Difficulty</SelectItem>
                        <SelectItem value="productType">Product Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="labelColor">Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="labelColor"
                        type="color"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <Input
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="labelPriority">Priority (lower numbers = higher priority)</Label>
                    <Input
                      id="labelPriority"
                      type="number"
                      min="1"
                      value={newLabelPriority}
                      onChange={(e) => setNewLabelPriority(parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingLabel(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddLabel}>
                      Add Label
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className={`${isMobileView ? 'pt-2' : ''}`}>
          <div className={`${isMobileView ? 'space-y-3' : 'space-y-4'}`}>
            {/* Difficulty Labels */}
            <div>
              <h4 className={`font-medium text-gray-700 ${isMobileView ? 'text-xs mb-1' : 'text-sm mb-2'}`}>Difficulty Labels</h4>
              <div className={`flex flex-wrap ${isMobileView ? 'gap-1' : 'gap-2'}`}>
                {labels.filter(label => label.category === 'difficulty').sort((a, b) => a.priority - b.priority).map(label => (
                  <div key={label.id} className="flex items-center gap-1">
                    <Badge 
                      style={{ backgroundColor: label.color, color: 'white' }}
                      className={`text-white ${isMobileView ? 'text-xs px-2 py-1' : ''}`}
                    >
                      {label.name} ({label.priority})
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLabel(label.id)}
                      className={`p-0 hover:bg-red-100 ${isMobileView ? 'h-5 w-5' : 'h-6 w-6'}`}
                    >
                      <Trash2 className={`text-red-500 ${isMobileView ? 'h-2 w-2' : 'h-3 w-3'}`} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Type Labels */}
            <div>
              <h4 className={`font-medium text-gray-700 ${isMobileView ? 'text-xs mb-1' : 'text-sm mb-2'}`}>Product Type Labels</h4>
              <div className={`flex flex-wrap ${isMobileView ? 'gap-1' : 'gap-2'}`}>
                {labels.filter(label => label.category === 'productType').sort((a, b) => a.priority - b.priority).map(label => (
                  <div key={label.id} className="flex items-center gap-1">
                    <Badge 
                      style={{ backgroundColor: label.color, color: 'white' }}
                      className={`text-white ${isMobileView ? 'text-xs px-2 py-1' : ''}`}
                    >
                      {label.name} ({label.priority})
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLabel(label.id)}
                      className={`p-0 hover:bg-red-100 ${isMobileView ? 'h-5 w-5' : 'h-6 w-6'}`}
                    >
                      <Trash2 className={`text-red-500 ${isMobileView ? 'h-2 w-2' : 'h-3 w-3'}`} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Selector and Sync Controls */}
      <Card>
        <CardHeader className={`${isMobileView ? 'pb-2' : ''}`}>
          <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-base' : ''}`}>
            <Settings className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
            {isMobileView ? 'Store & Sync' : 'Store Management & Product Sync'}
          </CardTitle>
          <p className={`text-gray-600 mt-1 ${isMobileView ? 'text-xs' : 'text-sm'}`}>
            Sync products from stores with API configuration. Configure stores in Settings first.
          </p>
        </CardHeader>
        <CardContent className={`${isMobileView ? 'pt-2' : ''}`}>
          <div className="space-y-4">
            {/* Store Selector */}
            <div>
              <Label htmlFor="store-select" className={`${isMobileView ? 'text-xs' : 'text-sm'}`}>
                Filter by Store
              </Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className={`${isMobileView ? 'mt-1' : 'mt-2'}`}>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores
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
                </SelectContent>
              </Select>
            </div>

            {/* Store Configuration Status & Sync Controls */}
            <div className="space-y-3">
              <h4 className={`font-medium text-gray-700 ${isMobileView ? 'text-sm' : ''}`}>
                Store Configuration & Sync
              </h4>
              
              {stores.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className={`${isMobileView ? 'text-sm' : ''}`}>
                    No stores found. Create stores in Settings → Store Management first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stores.map(store => {
                    const status = getStoreConfigStatus(store);
                    const isReady = isStoreReadyForSync(store);
                    
                    return (
                      <div key={store.id} className={`flex items-center justify-between p-3 border rounded-lg ${isMobileView ? 'flex-col gap-2' : ''}`}>
                        <div className={`flex items-center gap-3 ${isMobileView ? 'w-full' : 'flex-1'}`}>
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: store.color }}
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${isMobileView ? 'text-sm' : ''}`}>
                              {store.name}
                            </div>
                            <div className={`text-gray-600 ${isMobileView ? 'text-xs' : 'text-sm'}`}>
                              {store.domain}
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {status === 'ready' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                            {status === 'disabled' && (
                              <Badge variant="secondary">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Disabled
                              </Badge>
                            )}
                            {status === 'incomplete' && (
                              <Badge variant="outline" className="border-orange-200 text-orange-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Incomplete
                              </Badge>
                            )}
                            {status === 'missing' && (
                              <Badge variant="outline" className="border-red-200 text-red-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Not Configured
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Sync Button */}
                        <div className={`${isMobileView ? 'w-full' : ''}`}>
                          {isReady ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShopifySync(store)}
                              disabled={isSyncing[store.id]}
                              className={`${isMobileView ? 'w-full' : ''}`}
                            >
                              <RefreshCw className={`mr-2 ${isSyncing[store.id] ? 'animate-spin' : ''} h-4 w-4`} />
                              {isSyncing[store.id] ? 'Syncing...' : 'Sync Products'}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className={`${isMobileView ? 'w-full' : ''}`}
                              title={
                                status === 'missing' 
                                  ? 'Configure API settings in Settings → Store API & Webhook Configuration'
                                  : status === 'disabled'
                                  ? 'Enable store configuration in Settings'
                                  : 'Complete API configuration in Settings'
                              }
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Configure First
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Configuration Guidance */}
              {stores.some(store => !isStoreReadyForSync(store)) && (
                <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${isMobileView ? 'text-sm' : ''}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">Configuration Required</p>
                      <p className="text-blue-700 mt-1">
                        Some stores need API configuration before they can sync products. 
                        Go to <strong>Settings → Store API & Webhook Configuration</strong> to set up:
                      </p>
                      <ul className="text-blue-700 mt-2 ml-4 list-disc space-y-1">
                        <li>Shopify Access Token</li>
                        <li>Shop Domain</li>
                        <li>API Version</li>
                        <li>Enable the configuration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card>
        <CardHeader className={`${isMobileView ? 'pb-2' : ''}`}>
          <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-base' : ''}`}>
            <Search className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
            {isMobileView ? 'Search Products' : 'Search Products'}
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobileView ? 'pt-2' : ''}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
            <Input
              type="text"
              placeholder="Search by product name, variant, difficulty, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-10 ${isMobileView ? 'text-sm' : ''}`}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto ${isMobileView ? 'w-6 h-6' : 'w-8 h-8'}`}
              >
                <X className={`text-gray-400 ${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
            )}
          </div>
          {searchQuery && (
            <div className={`mt-2 text-sm text-gray-600 ${isMobileView ? 'text-xs' : ''}`}>
              Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products by Store */}
      {Object.entries(productsByStore).map(([storeId, storeProducts]) => {
        const store = getStoreById(storeId);
        return (
          <Card key={storeId}>
            <CardHeader className={`${isMobileView ? 'pb-2' : ''}`}>
              <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-base' : ''}`}>
                <div 
                  className={`${isMobileView ? 'w-3 h-3' : 'w-4 h-4'} rounded-full`} 
                  style={{ backgroundColor: store?.color || '#gray' }}
                />
                {store?.name || 'Unknown Store'}
                <span className={`font-normal text-gray-500 ${isMobileView ? 'text-xs' : 'text-sm'}`}>
                  ({storeProducts.length} products)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className={`${isMobileView ? 'pt-2' : ''}`}>
              <div className={`${isMobileView ? 'space-y-2' : 'space-y-3'}`}>
                {storeProducts.map(product => {
                  const currentDifficultyLabel = getLabelByName(product.difficultyLabel);
                  const currentProductTypeLabel = getLabelByName(product.productTypeLabel);
                  return (
                    <div key={product.id} className={`border rounded-lg ${isMobileView ? 'p-2 space-y-2' : 'flex items-center justify-between p-3'}`}>
                      <div className={`${isMobileView ? '' : 'flex-1'}`}>
                        <div className={`font-medium ${isMobileView ? 'text-sm' : ''}`}>
                          {product.name}
                          {product.shopifyId && (
                            <span className="ml-2 text-xs text-gray-500 font-mono">
                              #{product.shopifyId}
                            </span>
                          )}
                        </div>
                        {product.variant && (
                          <div className={`text-gray-600 ${isMobileView ? 'text-xs' : 'text-sm'}`}>{product.variant}</div>
                        )}
                        {product.handle && (
                          <div className={`text-blue-600 ${isMobileView ? 'text-xs' : 'text-sm'}`}>
                            /products/{product.handle}
                          </div>
                        )}
                        {product.status && (
                          <Badge 
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                            className={`mt-1 ${isMobileView ? 'text-xs' : ''}`}
                          >
                            {product.status}
                          </Badge>
                        )}
                      </div>
                      <div className={`${isMobileView ? 'space-y-2' : 'flex items-center gap-3'}`}>
                        {/* Shopify Link Button */}
                        {product.shopifyId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openShopifyProduct(product)}
                            className={`p-2 ${isMobileView ? 'h-8 w-8' : 'h-8 w-8'}`}
                            title="Open in Shopify Admin"
                          >
                            <ExternalLink className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          </Button>
                        )}

                        {/* Difficulty Label */}
                        <div className={`flex items-center ${isMobileView ? 'gap-1' : 'gap-2'}`}>
                          <span className={`text-gray-500 ${isMobileView ? 'text-xs' : 'text-sm'}`}>Difficulty:</span>
                          <Select
                            value={product.difficultyLabel}
                            onValueChange={(value) => handleUpdateProductDifficultyLabel(product.id, value)}
                          >
                            <SelectTrigger className={`${isMobileView ? 'w-24' : 'w-32'}`}>
                              <SelectValue>
                                {currentDifficultyLabel && (
                                  <Badge 
                                    style={{ backgroundColor: currentDifficultyLabel.color, color: 'white' }}
                                    className={`text-white ${isMobileView ? 'text-[10px] px-1 py-0' : 'text-xs'}`}
                                  >
                                    {currentDifficultyLabel.name}
                                  </Badge>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {labels.filter(label => label.category === 'difficulty').sort((a, b) => a.priority - b.priority).map(label => (
                                <SelectItem key={label.id} value={label.name}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: label.color }}
                                    />
                                    {label.name} (Priority: {label.priority})
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Product Type Label */}
                        <div className={`flex items-center ${isMobileView ? 'gap-1' : 'gap-2'}`}>
                          <span className={`text-gray-500 ${isMobileView ? 'text-xs' : 'text-sm'}`}>Type:</span>
                          <Select
                            value={product.productTypeLabel}
                            onValueChange={(value) => handleUpdateProductTypeLabel(product.id, value)}
                          >
                            <SelectTrigger className={`${isMobileView ? 'w-24' : 'w-32'}`}>
                              <SelectValue>
                                {currentProductTypeLabel && (
                                  <Badge 
                                    style={{ backgroundColor: currentProductTypeLabel.color, color: 'white' }}
                                    className={`text-white ${isMobileView ? 'text-[10px] px-1 py-0' : 'text-xs'}`}
                                  >
                                    {currentProductTypeLabel.name}
                                  </Badge>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {labels.filter(label => label.category === 'productType').sort((a, b) => a.priority - b.priority).map(label => (
                                <SelectItem key={label.id} value={label.name}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: label.color }}
                                    />
                                    {label.name} (Priority: {label.priority})
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}