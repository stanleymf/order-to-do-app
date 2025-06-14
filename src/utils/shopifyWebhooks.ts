import { loadMappingConfig } from './shopifyApi';

// Webhook topic types
export type WebhookTopic = 
  | 'orders/create'
  | 'orders/updated' 
  | 'orders/cancelled'
  | 'products/create'
  | 'products/updated'
  | 'customers/create'
  | 'customers/updated';

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

// Shopify error response
interface ShopifyErrorResponse {
  errors?: string | Record<string, any>;
  error?: string;
}

export class ShopifyWebhookManager {
  private accessToken: string;
  private shopDomain: string;
  private apiVersion: string;
  private webhookBaseUrl: string;

  constructor() {
    const config = loadMappingConfig();
    this.accessToken = config.api.accessToken;
    this.shopDomain = config.api.shopDomain;
    this.apiVersion = config.api.apiVersion;
    this.webhookBaseUrl = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  // Get the webhook endpoint URL for the current deployment
  private getWebhookEndpointUrl(): string {
    // For Railway deployment, use the Railway URL
    // For local development, use localhost
    const isProduction = window.location.hostname !== 'localhost';
    
    if (isProduction) {
      // Use the current domain (Railway URL)
      return `${window.location.origin}/api/webhooks/shopify`;
    } else {
      // Local development
      return `http://localhost:4321/api/webhooks/shopify`;
    }
  }

  // Make API call to Shopify
  private async makeApiCall(url: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      const response = await fetch('/api/shopify/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          accessToken: this.accessToken,
          method,
          body
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Enhanced error handling for Shopify API errors
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.errors) {
          if (typeof responseData.errors === 'string') {
            errorMessage = responseData.errors;
          } else if (typeof responseData.errors === 'object') {
            // Handle Shopify's error object format
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
      console.error('Error making Shopify API call:', error);
      throw error;
    }
  }

  // Get existing webhooks
  async getExistingWebhooks(): Promise<WebhookRegistration[]> {
    try {
      const url = `${this.webhookBaseUrl}/webhooks.json`;
      const response: WebhookListResponse = await this.makeApiCall(url);
      return response.webhooks;
    } catch (error) {
      console.error('Error fetching existing webhooks:', error);
      return [];
    }
  }

  // Check if webhook already exists for a specific topic and address
  async webhookExists(topic: WebhookTopic, address: string): Promise<boolean> {
    try {
      const existingWebhooks = await this.getExistingWebhooks();
      return existingWebhooks.some(webhook => 
        webhook.topic === topic && webhook.address === address
      );
    } catch (error) {
      console.error('Error checking webhook existence:', error);
      return false;
    }
  }

  // Register a new webhook
  async registerWebhook(topic: WebhookTopic): Promise<WebhookRegistration> {
    try {
      const webhookUrl = this.getWebhookEndpointUrl();
      
      // Check if webhook already exists
      const exists = await this.webhookExists(topic, webhookUrl);
      if (exists) {
        console.log(`ℹ️ Webhook for ${topic} already exists`);
        // Return existing webhook info
        const existingWebhooks = await this.getExistingWebhooks();
        const existingWebhook = existingWebhooks.find(w => w.topic === topic && w.address === webhookUrl);
        if (existingWebhook) {
          return existingWebhook;
        }
      }

      const url = `${this.webhookBaseUrl}/webhooks.json`;
      
      const webhookData = {
        webhook: {
          topic,
          address: webhookUrl,
          format: 'json'
        }
      };

      console.log(`🔄 Registering webhook for ${topic} to ${webhookUrl}`);
      const response: WebhookRegistrationResponse = await this.makeApiCall(url, 'POST', webhookData);
      console.log(`✅ Webhook registered for ${topic}:`, response.webhook.id);
      return response.webhook;
    } catch (error) {
      console.error(`❌ Error registering webhook for ${topic}:`, error);
      
      // Enhanced error message for common issues
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

  // Delete a webhook
  async deleteWebhook(webhookId: number): Promise<void> {
    try {
      const url = `${this.webhookBaseUrl}/webhooks/${webhookId}.json`;
      await this.makeApiCall(url, 'DELETE');
      console.log(`✅ Webhook deleted: ${webhookId}`);
    } catch (error) {
      console.error(`❌ Error deleting webhook ${webhookId}:`, error);
      throw error;
    }
  }

  // Get required webhook topics for the app (prioritized)
  getRequiredWebhookTopics(): WebhookTopic[] {
    return [
      'orders/create',
      'orders/updated',
      'orders/cancelled'
      // Note: Product webhooks are optional and may require additional permissions
    ];
  }

  // Get optional webhook topics
  getOptionalWebhookTopics(): WebhookTopic[] {
    return [
      'products/create',
      'products/updated'
    ];
  }

  // Auto-register all required webhooks
  async autoRegisterWebhooks(): Promise<{
    registered: WebhookRegistration[];
    existing: WebhookRegistration[];
    errors: string[];
  }> {
    const result = {
      registered: [] as WebhookRegistration[],
      existing: [] as WebhookRegistration[],
      errors: [] as string[]
    };

    try {
      console.log('🔄 Starting webhook auto-registration...');
      
      // Get existing webhooks
      const existingWebhooks = await this.getExistingWebhooks();
      const webhookUrl = this.getWebhookEndpointUrl();
      
      console.log('📋 Existing webhooks:', existingWebhooks.map(w => `${w.topic} -> ${w.address}`));

      // Get required topics (prioritized)
      const requiredTopics = this.getRequiredWebhookTopics();
      const optionalTopics = this.getOptionalWebhookTopics();
      
      // Register required webhooks first
      for (const topic of requiredTopics) {
        try {
          const exists = await this.webhookExists(topic, webhookUrl);
          if (exists) {
            const existingWebhook = existingWebhooks.find(w => w.topic === topic && w.address === webhookUrl);
            if (existingWebhook) {
              result.existing.push(existingWebhook);
              console.log(`✅ Webhook already exists for ${topic}`);
            }
          } else {
            const webhook = await this.registerWebhook(topic);
            result.registered.push(webhook);
          }
        } catch (error) {
          const errorMsg = `Failed to register ${topic}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Try to register optional webhooks (don't fail if they don't work)
      for (const topic of optionalTopics) {
        try {
          const exists = await this.webhookExists(topic, webhookUrl);
          if (exists) {
            const existingWebhook = existingWebhooks.find(w => w.topic === topic && w.address === webhookUrl);
            if (existingWebhook) {
              result.existing.push(existingWebhook);
              console.log(`✅ Optional webhook already exists for ${topic}`);
            }
          } else {
            const webhook = await this.registerWebhook(topic);
            result.registered.push(webhook);
            console.log(`✅ Optional webhook registered for ${topic}`);
          }
        } catch (error) {
          console.warn(`⚠️ Optional webhook ${topic} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Don't add optional webhook errors to the main error list
        }
      }

      console.log(`✅ Webhook registration complete:`, {
        registered: result.registered.length,
        existing: result.existing.length,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      console.error('❌ Error during webhook auto-registration:', error);
      result.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Clean up old webhooks (remove webhooks not pointing to current endpoint)
  async cleanupOldWebhooks(): Promise<{
    deleted: number[];
    errors: string[];
  }> {
    const result = {
      deleted: [] as number[],
      errors: [] as string[]
    };

    try {
      console.log('🧹 Starting webhook cleanup...');
      
      const existingWebhooks = await this.getExistingWebhooks();
      const webhookUrl = this.getWebhookEndpointUrl();
      
      // Find webhooks that don't match our current endpoint
      const oldWebhooks = existingWebhooks.filter(webhook => webhook.address !== webhookUrl);
      
      console.log(`Found ${oldWebhooks.length} old webhooks to clean up`);

      for (const webhook of oldWebhooks) {
        try {
          await this.deleteWebhook(webhook.id);
          result.deleted.push(webhook.id);
        } catch (error) {
          result.errors.push(`Failed to delete webhook ${webhook.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`✅ Webhook cleanup complete: ${result.deleted.length} deleted, ${result.errors.length} errors`);
      return result;
    } catch (error) {
      console.error('❌ Error during webhook cleanup:', error);
      result.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Test webhook connectivity
  async testWebhookConnectivity(): Promise<boolean> {
    try {
      const webhookUrl = this.getWebhookEndpointUrl();
      console.log('🧪 Testing webhook connectivity to:', webhookUrl);
      
      // Make a simple request to the webhook endpoint
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Topic': 'test',
          'X-Shopify-Hmac-Sha256': 'test-signature'
        },
        body: JSON.stringify({ test: true })
      });

      // We expect a 401 (unauthorized) because we're not sending a real signature
      // But if we get a 404, it means the endpoint doesn't exist
      if (response.status === 404) {
        console.error('❌ Webhook endpoint not found');
        return false;
      }

      console.log('✅ Webhook endpoint is accessible');
      return true;
    } catch (error) {
      console.error('❌ Webhook connectivity test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const webhookManager = new ShopifyWebhookManager(); 