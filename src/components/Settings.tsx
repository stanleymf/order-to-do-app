import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings as SettingsIcon, Webhook, CheckCircle, Loader2, Store, Database, ChevronDown, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { type User as UserType } from '../types';
import { useMobileView } from './Dashboard';
import { webhookManager } from '../utils/shopifyWebhooks';
import { MultiStoreWebhookManager } from './MultiStoreWebhookManager';
import { StoreManagement } from './StoreManagement';
import { DataPersistenceManager } from './DataPersistenceManager';
import { StoreOrderMapping } from './StoreOrderMapping';
import { UserManagement } from './UserManagement';

interface SettingsProps {
  currentUser: UserType;
}

export function Settings({ currentUser }: SettingsProps) {
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{
    registered: any[];
    existing: any[];
    errors: string[];
  } | null>(null);
  const [isDataPersistenceExpanded, setIsDataPersistenceExpanded] = useState(false);
  
  // Get mobile view context
  const { isMobileView } = useMobileView();

  // Check if user is admin
  const isAdmin = currentUser.role === 'admin';

  const handleAutoRegisterWebhooks = async () => {
    setIsWebhookLoading(true);
    try {
      const result = await webhookManager.autoRegisterWebhooks();
      setWebhookStatus(result);
      
      if (result.registered.length > 0) {
        toast.success(`Successfully registered ${result.registered.length} webhooks`);
      }
      
      if (result.errors.length > 0) {
        toast.error(`Failed to register ${result.errors.length} webhooks`);
      }
    } catch (error) {
      console.error('Error auto-registering webhooks:', error);
      toast.error('Failed to auto-register webhooks');
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
          <p className="text-gray-600 mt-1">Configure app settings, user accounts, and store-specific order mapping</p>
        </div>
      </div>

      {/* User Management Section */}
      {isAdmin && (
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              User Account Management
          </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Manage user accounts, registration, and permissions
            </p>
          </CardHeader>
          <CardContent>
            <UserManagement currentUser={currentUser} />
          </CardContent>
        </Card>
      )}

      {/* Store Management Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-500" />
              Store Management
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Add, edit, and manage your stores
            </p>
          </CardHeader>
          <CardContent>
            <StoreManagement />
        </CardContent>
      </Card>
      )}

      {/* Multi-Store API Configuration Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-gray-500" />
              Store API & Webhook Configuration
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure Shopify API credentials and webhook settings for each store
            </p>
          </CardHeader>
          <CardContent>
            <MultiStoreWebhookManager />
          </CardContent>
        </Card>
      )}

      {/* Store-Specific Order Data Mapping */}
      <StoreOrderMapping />

      {/* Legacy Single-Store Webhook Management Section */}
      {!isAdmin && (
      <Card>
        <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isMobileView ? 'text-lg' : ''}`}>
              <Webhook className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Single-Store Webhook Management
          </CardTitle>
        </CardHeader>
          <CardContent>
          <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This is the legacy single-store webhook management. 
                  Admin users have access to advanced multi-store webhook management.
                </p>
            </div>
            
              <div className="flex gap-2">
              <Button
                onClick={handleAutoRegisterWebhooks}
                  disabled={isWebhookLoading}
                  className="flex-1"
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
                  disabled={isWebhookLoading}
                variant="outline"
                  className="flex-1"
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
              >
                {isWebhookLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                  Test Connectivity
              </Button>
            </div>

            {webhookStatus && (
                <div className="mt-4 space-y-2">
                  {webhookStatus.registered.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800 font-medium">
                        ✅ Registered {webhookStatus.registered.length} webhooks
                      </p>
                  </div>
                  )}
                  
                  {webhookStatus.existing.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-medium">
                        ℹ️ Found {webhookStatus.existing.length} existing webhooks
                      </p>
                    </div>
                  )}
                
                {webhookStatus.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">
                        ❌ {webhookStatus.errors.length} errors occurred
                      </p>
                      <ul className="mt-2 text-xs text-red-700">
                      {webhookStatus.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
              </div>
            )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Persistence Management Section */}
      <Collapsible 
        open={isDataPersistenceExpanded} 
        onOpenChange={setIsDataPersistenceExpanded}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-gray-500" />
                  Data Persistence Management
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDataPersistenceExpanded ? 'rotate-180' : ''}`} />
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 text-left">
                Backup, restore, and manage your application data
              </p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <DataPersistenceManager />
        </CardContent>
          </CollapsibleContent>
      </Card>
      </Collapsible>
    </div>
  );
} 