# Railway Environment Setup for Multi-Store Webhooks

## 🔧 Required Environment Variables

### Essential Variables

| Variable Name | Purpose | Required | Default | Security Level |
|---------------|---------|----------|---------|----------------|
| `SHOPIFY_WEBHOOK_SECRET` | Webhook signature verification | **YES** | `default-webhook-secret` | **HIGH - Should be sealed** |

### Optional Performance Variables

| Variable Name | Purpose | Recommended Value | Description |
|---------------|---------|-------------------|-------------|
| `NODE_ENV` | Environment mode | `production` | Optimizes Node.js performance |
| `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` | Health check timeout | `30` | Railway health check timeout |
| `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS` | Zero-downtime deployment | `10` | Overlap time during deployments |

### Railway-Provided Variables (Automatic)
These are automatically provided by Railway and don't need manual configuration:

| Variable Name | Purpose | Provided By |
|---------------|---------|-------------|
| `PORT` | Server port | Railway |
| `RAILWAY_PUBLIC_DOMAIN` | Public webhook URL | Railway |
| `RAILWAY_PRIVATE_DOMAIN` | Private service domain | Railway |

## 🛠️ Setup Instructions

### Step 1: Configure SHOPIFY_WEBHOOK_SECRET

1. **Go to your Railway project dashboard**
2. **Navigate to your service → Variables tab**
3. **Add a new variable:**
   - **Name:** `SHOPIFY_WEBHOOK_SECRET`
   - **Value:** A secure random string (recommend 32+ characters)
   - **Security:** Consider sealing this variable for production

#### Generate a secure webhook secret:
```bash
# Option 1: Using openssl
openssl rand -hex 32

# Option 2: Using node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online generator
# Use https://passwordsgenerator.net/ (64 character alphanumeric)
```

### Step 2: Configure Optional Performance Variables

For production optimization, add these variables:

```env
NODE_ENV=production
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=30
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=10
```

### Step 3: Verify Environment Variables

After setting up the variables:

1. **Deploy your service** (Railway auto-deploys on variable changes)
2. **Check the deployment logs** for confirmation:
   ```
   ✅ Server running on port: [PORT]
   🔗 Webhook endpoint: https://[YOUR-DOMAIN]/api/webhooks/shopify
   💚 Health check: https://[YOUR-DOMAIN]/health
   ```

### Step 4: Test Webhook Connectivity

The app includes multiple monitoring endpoints:

1. **Health Check:** `https://[your-domain]/health`
2. **API Status:** `https://[your-domain]/api/status`
3. **Built-in Test:** Use "Test Connectivity" in webhook management

## 🔒 Security Best Practices

### Seal Sensitive Variables
For production environments, seal the webhook secret:

1. **Go to Variables tab**
2. **Click the 3-dot menu** next to `SHOPIFY_WEBHOOK_SECRET`
3. **Select "Seal"**
4. **Confirm sealing** (cannot be undone)

### Environment Separation
Consider using different webhook secrets for different environments:

- **Production:** Sealed variable with strong secret
- **Staging:** Regular variable for testing
- **Development:** Local environment variable

## 📋 Complete Railway Variable Setup

### Production Configuration
```env
# Required
SHOPIFY_WEBHOOK_SECRET=[your-secure-32-char-secret]

# Performance Optimization
NODE_ENV=production
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=30
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=10
```

### Development Configuration
```env
# Required
SHOPIFY_WEBHOOK_SECRET=dev-webhook-secret-for-testing

# Development
NODE_ENV=development
```

## 📋 Verification Checklist

- [ ] `SHOPIFY_WEBHOOK_SECRET` set with secure value (32+ chars)
- [ ] `NODE_ENV=production` for production deployments
- [ ] Variable sealed for production security
- [ ] Service deployed successfully
- [ ] Health check endpoint accessible at `/health`
- [ ] API status endpoint accessible at `/api/status`
- [ ] Webhook endpoint accessible at `/api/webhooks/shopify`
- [ ] Test connectivity passes
- [ ] Railway domain format: `https://[service-name]-[project-name].up.railway.app`

## 🔍 Troubleshooting

### Common Issues

**1. Webhook verification failures**
```
❌ Webhook verification failed
```
- **Solution:** Ensure `SHOPIFY_WEBHOOK_SECRET` matches Shopify app configuration

**2. 404 errors on webhook endpoint**
```
❌ Webhook endpoint not found
```
- **Solution:** Verify Railway deployment is successful and server.js is running

**3. Environment variable not found**
```
No webhook secret configured, skipping verification
```
- **Solution:** Set `SHOPIFY_WEBHOOK_SECRET` in Railway Variables tab

**4. Health check failures**
```
Railway health check timeout
```
- **Solution:** Increase `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` or fix startup issues

### Debug Steps

1. **Check Railway deployment logs:**
   ```
   railway logs
   ```

2. **Verify environment variables:**
   ```
   railway run env | grep SHOPIFY
   ```

3. **Test health check:**
   ```bash
   curl https://[your-domain].up.railway.app/health
   ```

4. **Test API status:**
   ```bash
   curl https://[your-domain].up.railway.app/api/status
   ```

5. **Test webhook endpoint manually:**
   ```bash
   curl -X POST https://[your-domain].up.railway.app/api/webhooks/shopify \
     -H "Content-Type: application/json" \
     -H "X-Shopify-Topic: test" \
     -H "X-Shopify-Hmac-Sha256: test" \
     -d '{"test": true}'
   ```

## 🚀 Multi-Store Configuration

For multi-store setups, each store can have its own webhook secret configured in the UI. The global `SHOPIFY_WEBHOOK_SECRET` serves as the verification key for all incoming webhooks.

### Store-Specific Secrets
- Configure individual webhook secrets per store in the Multi-Store Webhook Management UI
- These are stored in localStorage and used for API calls
- The global secret is used for webhook verification

## 🎯 Railway Deployment Best Practices

### 1. Use Sealed Variables for Production
```
SHOPIFY_WEBHOOK_SECRET → Sealed
```

### 2. Set Performance Variables
```
NODE_ENV=production
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=30
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=10
```

### 3. Monitor Your Deployment
- Check health endpoint: `/health`
- Monitor Railway logs for webhook activity
- Verify webhook registration success in app logs

### 4. Test Before Going Live
- Use Railway's staging environment
- Test webhook registration with test stores
- Verify all multi-store configurations

## 📚 Additional Resources

- [Railway Variables Documentation](https://docs.railway.app/guides/variables)
- [Railway Webhook Documentation](https://docs.railway.app/guides/webhooks)
- [Railway Health Checks](https://docs.railway.app/guides/healthchecks)
- [Shopify Webhook Security](https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook)

---

## 🎯 Next Steps

1. Set up the `SHOPIFY_WEBHOOK_SECRET` environment variable
2. Configure optional performance variables for production
3. Deploy and verify all endpoints are accessible
4. Configure individual store webhook settings in the app
5. Test webhook registration with your Shopify stores
6. Monitor webhook activity through Railway logs 