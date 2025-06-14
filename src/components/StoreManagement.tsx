import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Store as StoreIcon,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import type { Store } from '../types';
import { getStores, saveStores } from '../utils/storage';
import { useStore } from '../contexts/StoreContext';
import { multiStoreWebhookManager } from '../utils/multiStoreWebhooks';

// Color options for stores
const STORE_COLORS = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Rose', value: '#F43F5E' }
];

export function StoreManagement() {
  const { refreshStores } = useStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    color: STORE_COLORS[0].value
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = () => {
    const loadedStores = getStores();
    setStores(loadedStores);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      color: STORE_COLORS[0].value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Store name is required');
      return false;
    }
    if (!formData.domain.trim()) {
      toast.error('Store domain is required');
      return false;
    }
    
    // Validate Shopify domain format - more flexible validation
    const trimmedDomain = formData.domain.trim().toLowerCase();
    
    // Check for typical Shopify domain pattern: storename.myshopify.com
    const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.myshopify\.com$|^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    
    // Check for custom domain pattern: example.com
    const customDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$|^[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
    
    if (!shopifyDomainRegex.test(trimmedDomain) && !customDomainRegex.test(trimmedDomain)) {
      toast.error('Please enter a valid Shopify domain (e.g., your-store.myshopify.com) or custom domain (e.g., yourstore.com)');
      return false;
    }

    return true;
  };

  const handleAddStore = () => {
    if (!validateForm()) return;

    const newStore: Store = {
      id: `store-${Date.now()}`, // Simple ID generation
      name: formData.name.trim(),
      domain: formData.domain.trim(),
      color: formData.color
    };

    const updatedStores = [...stores, newStore];
    setStores(updatedStores);
    saveStores(updatedStores);
    
    // Refresh the global store context
    refreshStores();
    
    toast.success(`Store "${newStore.name}" created successfully`);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      domain: store.domain,
      color: store.color
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStore = () => {
    if (!validateForm() || !editingStore) return;

    const updatedStore: Store = {
      ...editingStore,
      name: formData.name.trim(),
      domain: formData.domain.trim(),
      color: formData.color
    };

    const updatedStores = stores.map(store => 
      store.id === editingStore.id ? updatedStore : store
    );
    
    setStores(updatedStores);
    saveStores(updatedStores);
    
    // Refresh the global store context
    refreshStores();
    
    toast.success(`Store "${updatedStore.name}" updated successfully`);
    resetForm();
    setIsEditDialogOpen(false);
    setEditingStore(null);
  };

  const handleDeleteStore = async (store: Store) => {
    if (window.confirm(`Are you sure you want to delete "${store.name}"? This will remove all associated data and webhook configurations.`)) {
      try {
        // Remove webhook configuration for this store if it exists
        const webhookConfig = multiStoreWebhookManager.getStoreConfig(store.id);
        if (webhookConfig) {
          multiStoreWebhookManager.removeStoreConfig(store.id);
          console.log(`🧹 Removed webhook configuration for deleted store: ${store.name}`);
        }

        // Remove the store from local state and storage
        const updatedStores = stores.filter(s => s.id !== store.id);
        setStores(updatedStores);
        saveStores(updatedStores);
        
        // Refresh the global store context
        refreshStores();
        
        toast.success(`Store "${store.name}" deleted successfully`);
      } catch (error) {
        console.error('Error during store deletion:', error);
        toast.error('Failed to delete store completely. Please try again.');
      }
    }
  };

  const openShopifyAdmin = (store: Store) => {
    window.open(`https://${store.domain}/admin`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Stores</h3>
          <p className="text-sm text-gray-600">
            Manage your Shopify stores. Create stores here before configuring API integration.
          </p>
        </div>
        
        {/* Add Store Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Store</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Store Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Windflower Florist"
                />
              </div>
              
              <div>
                <Label htmlFor="domain">Shopify Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  placeholder="e.g., your-store.myshopify.com"
                />
              </div>
              
              <div>
                <Label htmlFor="color">Store Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STORE_COLORS.map(colorOption => (
                    <button
                      key={colorOption.value}
                      onClick={() => setFormData({...formData, color: colorOption.value})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === colorOption.value 
                          ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-800' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: colorOption.value }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddStore} className="flex-1">
                  Create Store
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stores List */}
      {stores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <StoreIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores yet</h3>
            <p className="mb-4">Create your first store to get started with multi-store management.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(store => (
            <Card key={store.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: store.color }}
                    />
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Domain</p>
                    <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                      {store.domain}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openShopifyAdmin(store)}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditStore(store)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteStore(store)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Store Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Store Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-domain">Shopify Domain</Label>
              <Input
                id="edit-domain"
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-color">Store Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STORE_COLORS.map(colorOption => (
                  <button
                    key={colorOption.value}
                    onClick={() => setFormData({...formData, color: colorOption.value})}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === colorOption.value 
                        ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-800' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateStore} className="flex-1">
                Update Store
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                  setEditingStore(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 