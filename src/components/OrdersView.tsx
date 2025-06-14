import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Package, CheckCircle, Clock, UserCheck, CheckSquare, UserIcon, RefreshCw, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { OrderCard } from './OrderCard';
import { useMobileView } from './Dashboard';
import type { User, Order, Store } from '../types';
import { 
  getOrdersByDateStoreAndLabels, 
  getStores, 
  getFlorists, 
  getProductLabels,
  updateFloristStats,
  assignOrder,
  syncOrdersFromShopifyToStorage
} from '../utils/storage';
import { MultiStoreWebhookManager } from '../utils/multiStoreWebhooks';
import { toast } from 'sonner';

interface OrdersViewProps {
  currentUser: User;
}

// Helper function to format date in local timezone (YYYY-MM-DD)
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function OrdersView({ currentUser }: OrdersViewProps) {

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return formatDateLocal(today);
  });
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedDifficultyLabel] = useState<string>('all');
  const [selectedProductTypeLabel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [florists, setFlorists] = useState<User[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [multiStoreWebhookManager] = useState(() => new MultiStoreWebhookManager());
  
  // Get mobile view context
  const { isMobileView } = useMobileView();

  // Auto-fetch orders on component mount and date change
  useEffect(() => {
    fetchOrdersForAllStores();
  }, [selectedDate]);

  // Auto-refresh orders every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrdersForAllStores();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedDate]);

  // New multi-store order sync function
  const fetchOrdersForSpecificStore = async (storeId: string, storeName: string) => {
    setIsLoadingOrders(true);
    try {
      // Get store configuration from multi-store webhook manager
      const storeConfig = multiStoreWebhookManager.getStoreConfig(storeId);
      
      if (!storeConfig) {
        toast.error(`Store configuration not found`, {
          description: `No API configuration found for ${storeName}. Please configure it in Settings → Store API & Webhook Configuration.`
        });
        return;
      }

      if (!storeConfig.enabled) {
        toast.error(`Store API disabled`, {
          description: `API configuration is disabled for ${storeName}. Please enable it in Settings.`
        });
        return;
      }

      if (!storeConfig.accessToken || !storeConfig.shopDomain) {
        toast.error(`Incomplete store configuration`, {
          description: `Missing access token or shop domain for ${storeName}. Please check Settings → Store API & Webhook Configuration.`
        });
        return;
      }

      // Find the store object
      const stores = getStores();
      const store = stores.find(s => s.id === storeId || s.name === storeName);
      
      if (!store) {
        toast.error(`Store not found`, {
          description: `Could not find store "${storeName}" in the system. Please add it in Settings → Store Management.`
        });
        return;
      }

      console.log(`🔄 Syncing orders for ${storeName} (${storeConfig.shopDomain})`);
      
      // Sync orders using the store configuration
      const syncedOrders = await syncOrdersFromShopifyToStorage(
        store, 
        storeConfig.accessToken, 
        selectedDate,
        storeConfig.apiVersion
      );

      if (syncedOrders.length > 0) {
        toast.success(`Successfully synced ${syncedOrders.length} orders from ${storeName}`, {
          description: `Orders for ${selectedDate} have been updated`
        });
        console.log(`✅ Synced ${syncedOrders.length} orders from ${storeName}:`, syncedOrders);
      } else {
        toast.info(`No new orders found for ${storeName}`, {
          description: `No orders found for ${selectedDate}. Try a different date or check if there are orders in your Shopify store.`
        });
      }
      
      handleOrderUpdate();
    } catch (error) {
      console.error(`Error syncing orders from ${storeName}:`, error);
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide more specific error guidance
      if (errorMessage.includes('401')) {
        errorMessage = `Authentication failed for ${storeName}. Please check your access token in Store API & Webhook Configuration.`;
      } else if (errorMessage.includes('403')) {
        errorMessage = `Permission denied for ${storeName}. Make sure your app has the required permissions (read_orders).`;
      } else if (errorMessage.includes('404')) {
        errorMessage = `Store not found: ${storeName}. Please verify the shop domain is correct.`;
      } else if (errorMessage.includes('429')) {
        errorMessage = `Rate limit exceeded for ${storeName}. Please wait a moment and try again.`;
      }
      
      toast.error(`Failed to sync orders from ${storeName}`, {
        description: errorMessage
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Enhanced multi-store sync function
  const fetchOrdersForAllStores = async () => {
    setIsLoadingOrders(true);
    try {
      const enabledStoreConfigs = multiStoreWebhookManager.getEnabledStoreConfigs();
      const allStores = getStores();
      let allSyncedOrders: Order[] = [];

      if (enabledStoreConfigs.length === 0) {
        toast.error('No stores configured', {
          description: 'Please configure at least one store in Settings → Store API & Webhook Configuration'
        });
        return;
      }

      for (const storeConfig of enabledStoreConfigs) {
        try {
          // Find the corresponding store object
          const store = allStores.find(s => s.id === storeConfig.storeId);
          if (!store) {
            console.warn(`Store not found for config: ${storeConfig.storeName}`);
            continue;
          }

          const syncedOrders = await syncOrdersFromShopifyToStorage(
            store, 
            storeConfig.accessToken, 
            selectedDate,
            storeConfig.apiVersion
          );
          allSyncedOrders = [...allSyncedOrders, ...syncedOrders];
          
          console.log(`✅ Synced ${syncedOrders.length} orders from ${storeConfig.storeName}`);
        } catch (error) {
          console.error(`Error syncing orders from ${storeConfig.storeName}:`, error);
          toast.error(`Failed to sync ${storeConfig.storeName}`, {
            description: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue with other stores even if one fails
        }
      }

      if (allSyncedOrders.length > 0) {
        toast.success(`Successfully synced ${allSyncedOrders.length} orders from ${enabledStoreConfigs.length} stores`, {
          description: `Orders for ${selectedDate} have been updated`
        });
      } else {
        toast.info(`No new orders found`, {
          description: `No orders found for ${selectedDate} across all configured stores`
        });
      }
      
      handleOrderUpdate();
    } catch (error) {
      console.error('Error syncing orders from all stores:', error);
      toast.error('Error syncing orders', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Function to manually sync Windflower Florist 2
  const syncWindflowerFlorist2 = () => {
    // Try to find the store by name first
    const stores = getStores();
    let windflowerStore = stores.find(store => 
      store.name.toLowerCase().includes('windflower florist 2') ||
      store.domain === 'windflowerflorist.myshopify.com'
    );
    
    // If store doesn't exist, check if we have a configuration for it
    if (!windflowerStore) {
      const storeConfigs = multiStoreWebhookManager.getAllStoreConfigs();
      const windflowerConfig = storeConfigs.find(config => 
        config.storeName.toLowerCase().includes('windflower florist 2') ||
        config.shopDomain === 'windflowerflorist.myshopify.com'
      );
      
      if (windflowerConfig) {
        // Create the store object if we have a configuration
        windflowerStore = {
          id: windflowerConfig.storeId,
          name: windflowerConfig.storeName,
          domain: windflowerConfig.shopDomain,
          color: '#10B981' // Default green color for Windflower Florist
        };
        
        // Add the store to the stores list
        const updatedStores = [...stores, windflowerStore];
        localStorage.setItem('florist-dashboard-stores', JSON.stringify(updatedStores));
        
        toast.info(`Added ${windflowerStore.name} to store list`, {
          description: 'Store has been automatically added and is ready for syncing'
        });
      }
    }
    
    if (windflowerStore) {
      fetchOrdersForSpecificStore(windflowerStore.id, windflowerStore.name);
    } else {
      toast.error('Windflower Florist 2 not found', {
        description: 'Please ensure the store is configured in Settings → Store API & Webhook Configuration with the domain "windflowerflorist.myshopify.com"'
      });
    }
  };

  // Sorting function with hierarchical order
  const sortOrders = (orders: Order[]) => {
    const labels = getProductLabels();
    
    return orders.sort((a, b) => {
      // 1. Assigned florist (current user's assignments first)
      const floristA = getFloristPriority(a.assignedFloristId);
      const floristB = getFloristPriority(b.assignedFloristId);
      if (floristA !== floristB) {
        return floristA - floristB;
      }
      
      // 2. Timeslot (earlier times first)
      const timeA = parseTimeSlot(a.timeslot);
      const timeB = parseTimeSlot(b.timeslot);
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      
      // 3. Product titles (alphabetical, same titles grouped)
      const productComparison = a.productName.localeCompare(b.productName);
      if (productComparison !== 0) {
        return productComparison;
      }
      
      // 4. Difficulty (based on product labelling and current filtering)
      const difficultyA = getDifficultyPriority(a.difficultyLabel, labels);
      const difficultyB = getDifficultyPriority(b.difficultyLabel, labels);
      if (difficultyA !== difficultyB) {
        return difficultyA - difficultyB;
      }
      
      // 5. Product type (based on product labelling and current filtering)
      const productTypeA = getProductTypePriority(a.productTypeLabel, labels);
      const productTypeB = getProductTypePriority(b.productTypeLabel, labels);
      return productTypeA - productTypeB;
    });
  };

  // Helper function to parse timeslot into comparable number
  const parseTimeSlot = (timeslot: string): number => {
    try {
      // Extract start time from timeslot (e.g., "9:00 AM - 11:00 AM" -> "9:00 AM")
      const startTime = timeslot.split(' - ')[0];
      const [time, period] = startTime.split(' ');
      const [hours, minutes] = time.split(':').map(num => parseInt(num));
      
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      
      return hour24 * 60 + minutes; // Convert to minutes for comparison
    } catch {
      return 9999; // Put invalid times at the end
    }
  };

  // Helper function to get difficulty priority
  const getDifficultyPriority = (difficultyLabel: string, labels: any[]): number => {
    const difficultyLabels = labels.filter(label => label.category === 'difficulty');
    const label = difficultyLabels.find(label => label.name === difficultyLabel);
    return label ? label.priority : 9999; // Unknown difficulties go to end
  };

  // Helper function to get product type priority
  const getProductTypePriority = (productTypeLabel: string, labels: any[]): number => {
    const productTypeLabels = labels.filter(label => label.category === 'productType');
    const label = productTypeLabels.find(label => label.name === productTypeLabel);
    return label ? label.priority : 9999; // Unknown types go to end
  };

  // Helper function to get florist assignment priority (current user first)
  const getFloristPriority = (assignedFloristId?: string): number => {
    if (!assignedFloristId) {
      return 2; // Unassigned orders come after current user's orders but before other florists'
    }
    if (assignedFloristId === currentUser.id) {
      return 1; // Current user's orders come first
    }
    return 3; // Other florists' orders come last
  };

  const loadData = useCallback(() => {
    const storeId = selectedStore === 'all' ? undefined : selectedStore;
    const difficultyLabel = selectedDifficultyLabel === 'all' ? undefined : selectedDifficultyLabel;
    const productTypeLabel = selectedProductTypeLabel === 'all' ? undefined : selectedProductTypeLabel;
    let filteredOrders = getOrdersByDateStoreAndLabels(selectedDate, storeId, difficultyLabel, productTypeLabel);
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === selectedStatus);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredOrders = filteredOrders.filter(order => 
        order.productName.toLowerCase().includes(query) ||
        order.productVariant.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        (order.remarks && order.remarks.toLowerCase().includes(query)) ||
        (order.productCustomizations && order.productCustomizations.toLowerCase().includes(query)) ||
        order.difficultyLabel.toLowerCase().includes(query) ||
        order.productTypeLabel.toLowerCase().includes(query) ||
        order.timeslot.toLowerCase().includes(query)
      );
    }
    
    // Apply hierarchical sorting
    filteredOrders = sortOrders(filteredOrders);
    
    setOrders(filteredOrders);
    setStores(getStores());
    setFlorists(getFlorists());
  }, [selectedDate, selectedStore, selectedDifficultyLabel, selectedProductTypeLabel, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOrderUpdate = () => {
    loadData();
    updateFloristStats();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCalendarDate(date);
      setSelectedDate(formatDateLocal(date));
    }
  };

  // Batch selection handlers
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedOrderIds(new Set());
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const selectAllOrders = () => {
    const allOrderIds = new Set(orders.map(order => order.id));
    setSelectedOrderIds(allOrderIds);
  };

  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  const batchAssignToMe = () => {
    selectedOrderIds.forEach(orderId => {
      assignOrder(orderId, currentUser.id);
    });
    setSelectedOrderIds(new Set());
    handleOrderUpdate();
    toast.success(`Successfully assigned ${selectedOrderIds.size} orders to you!`, {
      description: `Orders have been assigned and are ready for processing`
    });
  };

  const batchUnassign = () => {
    selectedOrderIds.forEach(orderId => {
      assignOrder(orderId, 'unassigned');
    });
    setSelectedOrderIds(new Set());
    handleOrderUpdate();
    toast.info(`Successfully unassigned ${selectedOrderIds.size} orders`, {
      description: `Orders are now available for assignment`
    });
  };

  // Calculate order statistics
  const getOrderStats = (storeOrders: Order[]) => {
    const pending = storeOrders.filter(order => order.status === 'pending').length;
    const assigned = storeOrders.filter(order => order.status === 'assigned').length;
    const completed = storeOrders.filter(order => order.status === 'completed').length;
    const total = storeOrders.length;
    
    return { pending, assigned, completed, total };
  };

  // Get unfiltered orders for stats display (so users can see total counts)
  const getUnfilteredOrders = () => {
    const storeId = selectedStore === 'all' ? undefined : selectedStore;
    const difficultyLabel = selectedDifficultyLabel === 'all' ? undefined : selectedDifficultyLabel;
    const productTypeLabel = selectedProductTypeLabel === 'all' ? undefined : selectedProductTypeLabel;
    return getOrdersByDateStoreAndLabels(selectedDate, storeId, difficultyLabel, productTypeLabel);
  };

  const unfilteredOrders = getUnfilteredOrders();

  // Filter orders based on date, search query, and selected status
  const filteredOrders = useCallback(() => {
    const dateStr = calendarDate ? formatDateLocal(calendarDate) : selectedDate;
    return orders.filter(order => {
      // Date filter
      const orderDate = order.date;
      if (orderDate !== dateStr) return false;
      
      // Store filter - NEW: Filter by selected store
      if (selectedStore !== 'all' && order.storeId !== selectedStore) return false;
      
      // Status filter
      if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          order.id,
          order.productName,
          order.productVariant,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          order.remarks,
          order.productCustomizations,
          order.timeslot,
          order.deliveryType
        ].filter(field => field !== undefined && field !== null);
        
        return searchableFields.some(field => 
          field.toString().toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [orders, calendarDate, selectedDate, selectedStatus, searchQuery, selectedStore]);

  // Group filtered orders by store
  const ordersByStore = useCallback(() => {
    const filtered = filteredOrders();
    const grouped: Record<string, { store: Store; orders: Order[]; stats: any }> = {};

    filtered.forEach(order => {
      const store = stores.find(s => s.id === order.storeId);
      if (store) {
        if (!grouped[store.id]) {
          grouped[store.id] = {
            store,
            orders: [],
            stats: { pending: 0, assigned: 0, completed: 0, total: 0 }
          };
        }
        grouped[store.id].orders.push(order);
      }
    });

    // Calculate stats for each store
    Object.values(grouped).forEach(group => {
      group.stats = getOrderStats(group.orders);
    });

    return grouped;
  }, [filteredOrders, stores]);

  const totalStats = getOrderStats(unfilteredOrders);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-4">
          {/* Title and Description */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-semibold ${isMobileView ? 'text-xl mb-1' : 'text-2xl mb-2'}`}>
                Orders Dashboard
              </h1>
              {isLoadingOrders && (
                <div className="flex items-center gap-1 text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Auto-syncing...</span>
                </div>
              )}
            </div>
            <p className={`text-gray-600 ${isMobileView ? 'text-sm' : 'text-base'}`}>
              Manage daily flower orders across all stores
            </p>
          </div>

          {/* Manual Sync Controls */}
          <div className={`flex ${isMobileView ? 'flex-col gap-2' : 'items-center gap-4'}`}>
            <Button
              onClick={syncWindflowerFlorist2}
              disabled={isLoadingOrders}
              variant="outline"
              className={`${isMobileView ? 'w-full h-9 text-sm' : 'h-10'} border-green-200 hover:bg-green-50 hover:border-green-300`}
            >
              {isLoadingOrders ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Windflower Florist 2 Orders
            </Button>
            
            <Button
              onClick={fetchOrdersForAllStores}
              disabled={isLoadingOrders}
              variant="outline"
              className={`${isMobileView ? 'w-full h-9 text-sm' : 'h-10'} border-blue-200 hover:bg-blue-50 hover:border-blue-300`}
            >
              {isLoadingOrders ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync All Configured Stores
            </Button>
            
            <div className={`text-sm text-gray-500 ${isMobileView ? 'text-center' : ''}`}>
              Last synced: {selectedDate} • Click to fetch latest orders from Shopify
            </div>
          </div>

          {/* Filters Section */}
          <div className={`
            flex flex-col space-y-4 
            ${isMobileView ? 'px-2' : ''}
          `}>
            {/* Filter Controls */}
            <div className={`
              ${isMobileView ? 'flex flex-col space-y-3 w-full' : 'flex items-center gap-4'}
            `}>
              {/* Date Selector */}
              <div className={`${isMobileView ? 'w-full relative z-30' : ''}`}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`
                        justify-start text-left font-normal
                        ${isMobileView ? 'w-full h-9 text-sm' : 'w-[280px]'}
                        ${!calendarDate && "text-muted-foreground"}
                      `}
                    >
                      <CalendarDays className={`${isMobileView ? 'h-4 w-4 mr-2' : 'h-5 w-5 mr-2'}`} />
                      {calendarDate ? format(calendarDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className={`p-0 ${isMobileView ? 'w-[calc(100vw-2rem)]' : 'w-auto'}`}
                    align={isMobileView ? "start" : "center"}
                    side={isMobileView ? "bottom" : "right"}
                    sideOffset={5}
                  >
                    <Calendar
                      mode="single"
                      selected={calendarDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      className={isMobileView ? '[&_.rdp-caption]:text-sm [&_.rdp-cell]:text-sm' : ''}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Store Selector */}
              <div className={`${isMobileView ? 'w-full relative z-20' : ''}`}>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger className={`${isMobileView ? 'w-full h-9 text-sm' : 'w-[200px]'}`}>
                    <SelectValue placeholder="Filter by store" />
                  </SelectTrigger>
                  <SelectContent 
                    className={`${isMobileView ? 'w-[calc(100vw-2rem)]' : ''}`}
                    position={isMobileView ? "popper" : "item-aligned"}
                    side="bottom"
                    align="start"
                    alignOffset={0}
                    sideOffset={5}
                  >
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores
                      .filter(store => store.id && store.id.trim() !== '')
                      .map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: store.color }}
                            />
                            {store.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className={`${isMobileView ? 'w-full relative z-10' : ''}`}>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className={`${isMobileView ? 'w-full h-9 text-sm' : 'w-[200px]'}`}>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent 
                    className={`${isMobileView ? 'w-[calc(100vw-2rem)]' : ''}`}
                    position={isMobileView ? "popper" : "item-aligned"}
                    side="bottom"
                    align="start"
                    alignOffset={0}
                    sideOffset={5}
                  >
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className={`${isMobileView ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-orange-500`} />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="assigned">
                      <div className="flex items-center gap-2">
                        <div className={`${isMobileView ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-blue-500`} />
                        Assigned
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <div className={`${isMobileView ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full bg-green-500`} />
                        Completed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={`grid ${isMobileView ? 'grid-cols-1 gap-2 px-1' : 'grid-cols-4 gap-6'}`}>
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === 'all' ? 'ring-2 ring-gray-500 bg-gray-50' : ''
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'all' ? 'all' : 'all')}
        >
          <CardContent className={`flex items-center ${isMobileView ? 'py-2 px-3' : 'py-6'}`}>
            <div className={`${isMobileView ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-gray-100 flex items-center justify-center mr-3`}>
              <Package className={`${isMobileView ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-gray-600`} />
            </div>
            <div>
              <div className={`font-bold text-gray-600 ${isMobileView ? 'text-lg' : 'text-2xl'}`}>{totalStats.total}</div>
              <p className={`text-gray-600 ${isMobileView ? 'text-xs' : 'text-sm'}`}>All Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === 'pending' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
        >
          <CardContent className={`flex items-center ${isMobileView ? 'py-2 px-3' : 'py-6'}`}>
            <div className={`${isMobileView ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-orange-100 flex items-center justify-center mr-3`}>
              <Clock className={`${isMobileView ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-orange-600`} />
            </div>
            <div>
              <div className={`font-bold text-orange-600 ${isMobileView ? 'text-lg' : 'text-2xl'}`}>{totalStats.pending}</div>
              <p className={`text-gray-600 ${isMobileView ? 'text-xs' : 'text-sm'}`}>Pending Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === 'assigned' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'assigned' ? 'all' : 'assigned')}
        >
          <CardContent className={`flex items-center ${isMobileView ? 'py-2 px-3' : 'py-6'}`}>
            <div className={`${isMobileView ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-blue-100 flex items-center justify-center mr-3`}>
              <UserCheck className={`${isMobileView ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-blue-600`} />
            </div>
            <div>
              <div className={`font-bold text-blue-600 ${isMobileView ? 'text-lg' : 'text-2xl'}`}>{totalStats.assigned}</div>
              <p className={`text-gray-600 ${isMobileView ? 'text-xs' : 'text-sm'}`}>Assigned Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedStatus === 'completed' ? 'ring-2 ring-green-500 bg-green-50' : ''
          }`}
          onClick={() => setSelectedStatus(selectedStatus === 'completed' ? 'all' : 'completed')}
        >
          <CardContent className={`flex items-center ${isMobileView ? 'py-2 px-3' : 'py-6'}`}>
            <div className={`${isMobileView ? 'w-7 h-7' : 'w-12 h-12'} rounded-full bg-green-100 flex items-center justify-center mr-3`}>
              <CheckCircle className={`${isMobileView ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-green-600`} />
            </div>
            <div>
              <div className={`font-bold text-green-600 ${isMobileView ? 'text-lg' : 'text-2xl'}`}>{totalStats.completed}</div>
              <p className={`text-gray-600 ${isMobileView ? 'text-xs' : 'text-sm'}`}>Completed Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className={`mb-4 ${isMobileView ? 'px-1' : ''}`}>
        <Card>
          <CardContent className={`${isMobileView ? 'py-3 px-3' : 'py-4'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <Input
                type="text"
                placeholder="Search orders by ID, product name, customer, timeslot, delivery type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-10 ${isMobileView ? 'text-sm' : ''}`}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto ${isMobileView ? 'w-6 h-6' : 'w-8 h-8'}`}
                >
                  <X className={`text-gray-400 ${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              )}
            </div>
            {searchQuery && (
              <div className={`mt-2 text-sm text-gray-600 ${isMobileView ? 'text-xs' : ''}`}>
                Found {filteredOrders().length} order{filteredOrders().length !== 1 ? 's' : ''} matching "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Assign Button */}
      <div className={`flex ${isMobileView ? 'justify-center px-1' : 'justify-end'}`}>
        <Button
          variant={isBatchMode ? "default" : "outline"}
          onClick={toggleBatchMode}
          className={`${isMobileView ? 'w-full h-10 text-sm' : 'h-10 px-6'} ${
            isBatchMode ? 'bg-blue-600 hover:bg-blue-700' : ''
          }`}
        >
          <CheckSquare className={`${isMobileView ? 'h-4 w-4' : 'h-4 w-4'} mr-2`} />
          {isBatchMode ? 'Exit Batch Mode' : 'Batch Assign Orders'}
        </Button>
      </div>

      {/* Batch Mode Controls */}
      {isBatchMode && (
        <div className={`mb-4 ${isMobileView ? 'px-1' : ''}`}>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className={`${isMobileView ? 'py-3 px-3' : 'py-4'}`}>
              <div className={`flex ${isMobileView ? 'flex-col gap-2' : 'items-center justify-between gap-4'}`}>
                <div className={`flex ${isMobileView ? 'flex-wrap gap-2' : 'items-center gap-4'}`}>
                  <div className="flex items-center gap-2">
                    <CheckSquare className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
                    <span className={`font-medium text-blue-900 ${isMobileView ? 'text-sm' : ''}`}>
                      Batch Mode Active
                    </span>
                    <Badge variant="secondary" className={`${isMobileView ? 'text-xs' : ''}`}>
                      {selectedOrderIds.size} selected
                    </Badge>
                  </div>
                  
                  <div className={`flex ${isMobileView ? 'flex-wrap gap-1' : 'gap-2'}`}>
                    <Button
                      size={isMobileView ? "sm" : "default"}
                      variant="outline"
                      onClick={selectAllOrders}
                      className={`${isMobileView ? 'h-7 text-xs px-2' : 'h-8'}`}
                    >
                      Select All
                    </Button>
                    <Button
                      size={isMobileView ? "sm" : "default"}
                      variant="outline"
                      onClick={clearSelection}
                      className={`${isMobileView ? 'h-7 text-xs px-2' : 'h-8'}`}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className={`flex ${isMobileView ? 'flex-wrap gap-1' : 'gap-2'}`}>
                  <Button
                    size={isMobileView ? "sm" : "default"}
                    onClick={batchAssignToMe}
                    disabled={selectedOrderIds.size === 0}
                    className={`${isMobileView ? 'h-7 text-xs px-2' : 'h-8'} bg-green-600 hover:bg-green-700`}
                  >
                    <UserIcon className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                    Assign to Me
                  </Button>
                  <Button
                    size={isMobileView ? "sm" : "default"}
                    variant="outline"
                    onClick={batchUnassign}
                    disabled={selectedOrderIds.size === 0}
                    className={`${isMobileView ? 'h-7 text-xs px-2' : 'h-8'}`}
                  >
                    Unassign All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Multi-Store View */}
      {selectedStore === 'all' ? (
        <div className="space-y-8">
          {Object.values(ordersByStore()).map(({ store, orders: storeOrders, stats }) => (
            <Card key={store.id} className={`${isMobileView ? 'mb-3' : 'mb-4'}`}>
              <CardHeader className={`${isMobileView ? 'pb-2 px-3' : 'pb-4'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`${isMobileView ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`} 
                      style={{ backgroundColor: store.color }}
                    />
                    <h3 className={`font-medium ${isMobileView ? 'text-sm' : 'text-base'}`}>
                      {store.name}
                    </h3>
                    <Badge variant="outline" className={`${isMobileView ? 'text-xs px-1.5' : ''}`}>
                      {storeOrders.length} orders
                    </Badge>
                  </div>
                </div>

                <div className={`flex ${isMobileView ? 'gap-2 flex-wrap mt-1' : 'gap-4 mt-2'} ${isMobileView ? 'text-xs' : 'text-sm'}`}>
                  <div className="flex items-center gap-1">
                    <div className={`${isMobileView ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-orange-500`} />
                    <span className="text-orange-600 font-medium">{stats.pending} Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`${isMobileView ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-blue-500`} />
                    <span className="text-blue-600 font-medium">{stats.assigned} Assigned</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`${isMobileView ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-green-500`} />
                    <span className="text-green-600 font-medium">{stats.completed} Completed</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className={`${isMobileView ? 'pt-1 px-3' : 'pt-0'}`}>
                {storeOrders.length > 0 ? (
                  <div className={`${isMobileView ? 'space-y-2' : 'space-y-3'}`}>
                    {storeOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        currentUser={currentUser}
                        florists={florists}
                        onOrderUpdate={handleOrderUpdate}
                        isBatchMode={isBatchMode}
                        isSelected={selectedOrderIds.has(order.id)}
                        onToggleSelection={toggleOrderSelection}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={`text-center text-gray-500 ${isMobileView ? 'py-6 text-sm' : 'py-8'}`}>
                    No orders for this store on {format(calendarDate || new Date(), 'PPP')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {Object.keys(ordersByStore()).length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">No orders scheduled for {format(calendarDate || new Date(), 'PPP')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Single Store View */
        <Card className={`${isMobileView ? 'mb-3' : 'mb-4'}`}>
          <CardHeader className={`${isMobileView ? 'pb-2 px-3' : 'pb-4'}`}>
            <div className={`flex ${isMobileView ? 'flex-col gap-2' : 'items-center justify-between'}`}>
              <div className={`flex ${isMobileView ? 'items-center gap-2' : 'items-center gap-4'}`}>
                {(() => {
                  const currentSelectedStore = stores.find(s => s.id === selectedStore);
                  return (
                    <>
                      <div 
                        className={`${isMobileView ? 'w-3 h-3' : 'w-4 h-4'} rounded-full`} 
                        style={{ backgroundColor: currentSelectedStore?.color || '#gray' }}
                      />
                      <CardTitle className={`${isMobileView ? 'text-base' : ''}`}>
                        {currentSelectedStore?.name || 'Unknown Store'}
                      </CardTitle>
                    </>
                  );
                })()}
                <Badge variant="secondary" className={`${isMobileView ? 'text-xs' : ''}`}>
                  {filteredOrders().length} orders
                </Badge>
              </div>
              
              <div className={`flex ${isMobileView ? 'flex-wrap gap-1' : 'gap-2'}`}>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className={`${isMobileView ? 'h-7 text-xs w-24' : 'h-8 w-32'}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className={`${isMobileView ? 'pt-1' : ''}`}>
            {filteredOrders().length > 0 ? (
              <div className={`${isMobileView ? 'space-y-2' : 'space-y-3'}`}>
                {filteredOrders().map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    currentUser={currentUser}
                    florists={florists}
                    onOrderUpdate={handleOrderUpdate}
                    isBatchMode={isBatchMode}
                    isSelected={selectedOrderIds.has(order.id)}
                    onToggleSelection={toggleOrderSelection}
                  />
                ))}
              </div>
            ) : (
              <div className={`text-center text-gray-500 ${isMobileView ? 'py-6 text-sm' : 'py-8'}`}>
                {searchQuery ? `No orders matching "${searchQuery}" for this store on ${format(calendarDate || new Date(), 'PPP')}` : `No orders for this store on ${format(calendarDate || new Date(), 'PPP')}`}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}