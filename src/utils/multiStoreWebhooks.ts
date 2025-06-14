// Webhook topic types
export type WebhookTopic = 
  | 'orders/create'
  | 'orders/updated' 
  | 'orders/cancelled'
  | 'products/create'
  | 'products/update'
  | 'products/delete'
  | 'customers/create'
  | 'customers/updated';

// Store-specific webhook configuration
export interface StoreWebhookConfig {
  storeId: string;
  storeName: string;
  accessToken: string;
  shopDomain: string;
  apiVersion: string;
  webhookSecret?: string;
  enabled: boolean;
  // Auto-sync settings
  autoSync: boolean;
  syncInterval: number; // in seconds
}

// Webhook registration interface
interface WebhookRegistration {
  id: number;
  address: string;
  topic: WebhookTopic;
  created_at: string;
  updated_at: string;
  format: string;
  fields: string[];
}

// Webhook registration response
interface WebhookRegistrationResponse {
  webhook: WebhookRegistration;
}

// Webhook list response
interface WebhookListResponse {
  webhooks: WebhookRegistration[];
}

// Multi-store webhook result
export interface MultiStoreWebhookResult {
  storeId: string;
  storeName: string;
  registered: WebhookRegistration[];
  existing: WebhookRegistration[];
  errors: string[];
  success: boolean;
}

export class MultiStoreWebhookManager {
  private storeConfigs: Map<string, StoreWebhookConfig> = new Map();

  constructor() {
    this.loadStoreConfigs();
  }

  // Load store configurations from localStorage
  private loadStoreConfigs(): void {
    try {
      const savedConfigs = localStorage.getItem('multi-store-webhook-configs');
      if (savedConfigs) {
        const configs = JSON.parse(savedConfigs);
        this.storeConfigs = new Map(Object.entries(configs));
      }
    } catch (error) {
      console.error('Error loading store webhook configs:', error);
    }
  }

  // Save store configurations to localStorage
  private saveStoreConfigs(): void {
    try {
      const configs = Object.fromEntries(this.storeConfigs);
      localStorage.setItem('multi-store-webhook-configs', JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving store webhook configs:', error);
    }
  }

  // Add or update store configuration
  addStoreConfig(config: StoreWebhookConfig): void {
    this.storeConfigs.set(config.storeId, config);
    this.saveStoreConfigs();
  }

  // Remove store configuration
  removeStoreConfig(storeId: string): void {
    this.storeConfigs.delete(storeId);
    this.saveStoreConfigs();
  }

  // Get store configuration
  getStoreConfig(storeId: string): StoreWebhookConfig | undefined {
    return this.storeConfigs.get(storeId);
  }

  // Get all store configurations
  getAllStoreConfigs(): StoreWebhookConfig[] {
    return Array.from(this.storeConfigs.values());
  }

  // Get enabled store configurations
  getEnabledStoreConfigs(): StoreWebhookConfig[] {
    return Array.from(this.storeConfigs.values()).filter(config => config.enabled);
  }

  // Get the webhook endpoint URL for the current deployment
  private getWebhookEndpointUrl(): string {
    const isProduction = window.location.hostname !== 'localhost';
    
    if (isProduction) {
      return `${window.location.origin}/api/webhooks/shopify`;
    } else {
      return `http://localhost:4321/api/webhooks/shopify`;
    }
  }

  // Make API call to Shopify for a specific store
  private async makeApiCall(config: StoreWebhookConfig, url: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      const response = await fetch('/api/shopify/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          accessToken: config.accessToken,
          method,
          body
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.errors) {
          if (typeof responseData.errors === 'string') {
            errorMessage = responseData.errors;
          } else if (typeof responseData.errors === 'object') {
            const errorDetails = Object.entries(responseData.errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            errorMessage = errorDetails || errorMessage;
          }
        }
        
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error(`Error making Shopify API call for ${config.storeName}:`, error);
      throw error;
    }
  }

  // Get existing webhooks for a store
  async getExistingWebhooks(config: StoreWebhookConfig): Promise<WebhookRegistration[]> {
    try {
      const webhookBaseUrl = `https://${config.shopDomain}/admin/api/${config.apiVersion}`;
      const url = `${webhookBaseUrl}/webhooks.json`;
      const response: WebhookListResponse = await this.makeApiCall(config, url);
      return response.webhooks;
    } catch (error) {
      console.error(`Error fetching existing webhooks for ${config.storeName}:`, error);
      return [];
    }
  }

  // Check if webhook already exists for a specific topic and address
  async webhookExists(config: StoreWebhookConfig, topic: WebhookTopic, address: string): Promise<boolean> {
    try {
      const existingWebhooks = await this.getExistingWebhooks(config);
      return existingWebhooks.some(webhook => 
        webhook.topic === topic && webhook.address === address
      );
    } catch (error) {
      console.error(`Error checking webhook existence for ${config.storeName}:`, error);
      return false;
    }
  }

  // Register a new webhook for a store
  async registerWebhook(config: StoreWebhookConfig, topic: WebhookTopic): Promise<WebhookRegistration> {
    try {
      const webhookUrl = this.getWebhookEndpointUrl();
      
      // Check if webhook already exists
      const exists = await this.webhookExists(config, topic, webhookUrl);
      if (exists) {
        console.log(`ℹ️ Webhook for ${topic} already exists in ${config.storeName}`);
        const existingWebhooks = await this.getExistingWebhooks(config);
        const existingWebhook = existingWebhooks.find(w => w.topic === topic && w.address === webhookUrl);
        if (existingWebhook) {
          return existingWebhook;
        }
      }

      const webhookBaseUrl = `https://${config.shopDomain}/admin/api/${config.apiVersion}`;
      const url = `${webhookBaseUrl}/webhooks.json`;
      
      const webhookData = {
        webhook: {
          topic,
          address: webhookUrl,
          format: 'json'
        }
      };

      console.log(`🔄 Registering webhook for ${topic} in ${config.storeName} to ${webhookUrl}`);
      const response: WebhookRegistrationResponse = await this.makeApiCall(config, url, 'POST', webhookData);
      console.log(`✅ Webhook registered for ${topic} in ${config.storeName}:`, response.webhook.id);
      return response.webhook;
    } catch (error) {
      console.error(`❌ Error registering webhook for ${topic} in ${config.storeName}:`, error);
      
      let enhancedError = error instanceof Error ? error.message : 'Unknown error';
      
      if (enhancedError.includes('422')) {
        enhancedError = `Webhook registration failed (422): This usually means the webhook already exists or there's a permission issue. Topic: ${topic}`;
      } else if (enhancedError.includes('403')) {
        enhancedError = `Permission denied (403): Make sure your app has the required permissions for ${topic}`;
      } else if (enhancedError.includes('429')) {
        enhancedError = `Rate limit exceeded (429): Please wait before trying again`;
      }
      
      throw new Error(enhancedError);
    }
  }

  // Delete a webhook for a store
  async deleteWebhook(config: StoreWebhookConfig, webhookId: number): Promise<void> {
    try {
      const webhookBaseUrl = `https://${config.shopDomain}/admin/api/${config.apiVersion}`;
      const url = `${webhookBaseUrl}/webhooks/${webhookId}.json`;
      await this.makeApiCall(config, url, 'DELETE');
      console.log(`✅ Webhook deleted from ${config.storeName}: ${webhookId}`);
    } catch (error) {
      console.error(`❌ Error deleting webhook ${webhookId} from ${config.storeName}:`, error);
      throw error;
    }
  }

  // Get required webhook topics for the app
  getRequiredWebhookTopics(): WebhookTopic[] {
    return [
      'orders/create',
      'orders/updated',
      'orders/cancelled',
      'products/create',
      'products/update',
      'products/delete'
    ];
  }

  // Get optional webhook topics for the app
  getOptionalWebhookTopics(): WebhookTopic[] {
    return [
      'customers/create',
      'customers/updated'
    ];
  }

  // Auto-register webhooks for a specific store
  async autoRegisterWebhooksForStore(config: StoreWebhookConfig): Promise<MultiStoreWebhookResult> {
    const result: MultiStoreWebhookResult = {
      storeId: config.storeId,
      storeName: config.storeName,
      registered: [],
      existing: [],
      errors: [],
      success: true
    };

    try {
      const topics = this.getRequiredWebhookTopics();

      for (const topic of topics) {
        try {
          const webhook = await this.registerWebhook(config, topic);
          
          // Check if this was a new registration or existing
          const existingWebhooks = await this.getExistingWebhooks(config);
          const isNew = !existingWebhooks.some(w => w.id === webhook.id && w.created_at !== webhook.created_at);
          
          if (isNew) {
            result.registered.push(webhook);
          } else {
            result.existing.push(webhook);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`${topic}: ${errorMessage}`);
          result.success = false;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`General error: ${errorMessage}`);
      result.success = false;
    }

    return result;
  }

  // Auto-register webhooks for all enabled stores
  async autoRegisterWebhooksForAllStores(): Promise<MultiStoreWebhookResult[]> {
    const enabledConfigs = this.getEnabledStoreConfigs();
    const results: MultiStoreWebhookResult[] = [];

    for (const config of enabledConfigs) {
      const result = await this.autoRegisterWebhooksForStore(config);
      results.push(result);
    }

    return results;
  }

  // Cleanup old webhooks for a specific store
  async cleanupOldWebhooksForStore(config: StoreWebhookConfig): Promise<{
    deleted: number[];
    errors: string[];
  }> {
    const result = {
      deleted: [] as number[],
      errors: [] as string[]
    };

    try {
      const existingWebhooks = await this.getExistingWebhooks(config);
      const webhookUrl = this.getWebhookEndpointUrl();

      for (const webhook of existingWebhooks) {
        // Delete webhooks that don't point to our current endpoint
        if (webhook.address !== webhookUrl) {
          try {
            await this.deleteWebhook(config, webhook.id);
            result.deleted.push(webhook.id);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Failed to delete webhook ${webhook.id}: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`General cleanup error: ${errorMessage}`);
    }

    return result;
  }

  // Cleanup old webhooks for all enabled stores
  async cleanupOldWebhooksForAllStores(): Promise<{
    storeId: string;
    storeName: string;
    deleted: number[];
    errors: string[];
  }[]> {
    const enabledConfigs = this.getEnabledStoreConfigs();
    const results = [];

    for (const config of enabledConfigs) {
      const result = await this.cleanupOldWebhooksForStore(config);
      results.push({
        storeId: config.storeId,
        storeName: config.storeName,
        ...result
      });
    }

    return results;
  }

  // Test webhook connectivity
  async testWebhookConnectivity(): Promise<boolean> {
    try {
      const webhookUrl = this.getWebhookEndpointUrl();
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing webhook connectivity:', error);
      return false;
    }
  }

  // Get webhook status for all stores
  async getWebhookStatusForAllStores(): Promise<{
    storeId: string;
    storeName: string;
    totalWebhooks: number;
    requiredTopics: WebhookTopic[];
    missingTopics: WebhookTopic[];
    status: 'complete' | 'partial' | 'none';
  }[]> {
    const enabledConfigs = this.getEnabledStoreConfigs();
    const results = [];

    for (const config of enabledConfigs) {
      try {
        const existingWebhooks = await this.getExistingWebhooks(config);
        const requiredTopics = this.getRequiredWebhookTopics();
        const webhookUrl = this.getWebhookEndpointUrl();
        
        const storeWebhooks = existingWebhooks.filter(w => w.address === webhookUrl);
        const registeredTopics = storeWebhooks.map(w => w.topic);
        const missingTopics = requiredTopics.filter(topic => !registeredTopics.includes(topic));
        
        let status: 'complete' | 'partial' | 'none' = 'none';
        if (missingTopics.length === 0) {
          status = 'complete';
        } else if (storeWebhooks.length > 0) {
          status = 'partial';
        }

        results.push({
          storeId: config.storeId,
          storeName: config.storeName,
          totalWebhooks: storeWebhooks.length,
          requiredTopics,
          missingTopics,
          status
        });
      } catch (error) {
        console.error(`Error getting webhook status for ${config.storeName}:`, error);
        results.push({
          storeId: config.storeId,
          storeName: config.storeName,
          totalWebhooks: 0,
          requiredTopics: this.getRequiredWebhookTopics(),
          missingTopics: this.getRequiredWebhookTopics(),
          status: 'none' as const
        });
      }
    }

    return results;
  }
}

// Create singleton instance
export const multiStoreWebhookManager = new MultiStoreWebhookManager(); 