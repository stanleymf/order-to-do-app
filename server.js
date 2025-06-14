import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4321;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to get raw body for webhook verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Simple rate limiting for Shopify API calls
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // Conservative limit

function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  rateLimitMap.set(identifier, validRequests);
  
  // Check if we're within limits
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  return true;
}

// Webhook verification function
function verifyWebhook(data, signature, secret) {
  if (!secret) {
    console.warn('No webhook secret configured, skipping verification');
    return true;
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(data, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Healthcheck endpoint for Railway
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Shopify webhook endpoint
app.post('/api/webhooks/shopify', (req, res) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    console.log(`📦 Webhook received: ${topic} from ${shopDomain}`);
    
    // Get webhook secret from environment or use default
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || 'default-webhook-secret';
    
    // Fix: Use Buffer for HMAC calculation, and parse body only after verification
    const rawBody = req.body;
    if (!verifyWebhook(rawBody, signature, webhookSecret)) {
      console.error('❌ Webhook verification failed');
      return res.status(401).json({ error: 'Webhook verification failed' });
    }
    
    // Parse the webhook data (rawBody is a Buffer)
    const webhookData = JSON.parse(rawBody.toString('utf8'));
    
    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
        console.log('🆕 New order created:', webhookData.id);
        // Here you would trigger order sync or update local data
        break;
        
      case 'orders/updated':
        console.log('🔄 Order updated:', webhookData.id);
        // Here you would trigger order sync or update local data
        break;
        
      case 'orders/cancelled':
        console.log('❌ Order cancelled:', webhookData.id);
        // Here you would handle order cancellation
        break;
        
      case 'products/create':
        console.log('🆕 New product created:', webhookData.id);
        // Here you would trigger product sync
        break;
        
      case 'products/updated':
        console.log('🔄 Product updated:', webhookData.id);
        // Here you would trigger product sync
        break;
        
      default:
        console.log('📋 Unhandled webhook topic:', topic);
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'success', message: 'Webhook received' });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Shopify API proxy endpoint
app.post('/api/shopify/proxy', async (req, res) => {
  try {
    const { url, accessToken, method = 'GET', body } = req.body;
    
    if (!url || !accessToken) {
      return res.status(400).json({ error: 'Missing required parameters: url and accessToken' });
    }

    // Extract shop domain for rate limiting
    const shopDomain = url.match(/https:\/\/([^.]+\.myshopify\.com)/)?.[1] || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(shopDomain)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded', 
        details: 'Too many requests to Shopify API. Please wait before trying again.',
        retryAfter: 60
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    };

    const fetchOptions = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      // Handle Shopify's rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        return res.status(429).json({
          error: 'Shopify rate limit exceeded',
          details: 'Shopify API rate limit reached. Please wait before trying again.',
          retryAfter: parseInt(retryAfter)
        });
      }
      
      return res.status(response.status).json({
        error: `Shopify API error: ${response.status} ${response.statusText}`,
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Shopify proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Use a simple middleware to handle all other routes for SPA
app.use((req, res, next) => {
  // Skip if it's the healthcheck, API routes, or static files
  if (req.path === '/healthz' || req.path.startsWith('/api/') || req.path.startsWith('/assets/') || req.path === '/') {
    return next();
  }
  
  // For all other routes, serve index.html
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Order To-Do App running on port ${PORT}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
  console.log(`📦 Webhook endpoint: http://localhost:${PORT}/api/webhooks/shopify`);
}); 