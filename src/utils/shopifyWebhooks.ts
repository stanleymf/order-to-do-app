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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
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

  // Register a new webhook
  async registerWebhook(topic: WebhookTopic): Promise<WebhookRegistration> {
    try {
      const webhookUrl = this.getWebhookEndpointUrl();
      const url = `${this.webhookBaseUrl}/webhooks.json`;
      
      const webhookData = {
        webhook: {
          topic,
          address: webhookUrl,
          format: 'json'
        }
      };

      const response: WebhookRegistrationResponse = await this.makeApiCall(url, 'POST', webhookData);
      console.log(`✅ Webhook registered for ${topic}:`, response.webhook.id);
      return response.webhook;
    } catch (error) {
      console.error(`❌ Error registering webhook for ${topic}:`, error);
      throw error;
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

  // Get required webhook topics for the app
  getRequiredWebhookTopics(): WebhookTopic[] {
    return [
      'orders/create',
      'orders/updated',
      'orders/cancelled',
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
      
      // Check which webhooks already exist for our endpoint
      const existingTopics = existingWebhooks
        .filter(webhook => webhook.address === webhookUrl)
        .map(webhook => webhook.topic);

      console.log('📋 Existing webhooks for this endpoint:', existingTopics);

      // Get required topics
      const requiredTopics = this.getRequiredWebhookTopics();
      
      // Register missing webhooks
      for (const topic of requiredTopics) {
        if (!existingTopics.includes(topic)) {
          try {
            const webhook = await this.registerWebhook(topic);
            result.registered.push(webhook);
          } catch (error) {
            result.errors.push(`Failed to register ${topic}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          const existingWebhook = existingWebhooks.find(w => w.topic === topic && w.address === webhookUrl);
          if (existingWebhook) {
            result.existing.push(existingWebhook);
          }
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