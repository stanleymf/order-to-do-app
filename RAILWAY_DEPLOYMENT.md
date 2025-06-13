# 🚂 Railway Deployment Guide - Order To-Do App

## 📋 **Overview**
This guide will help you deploy the Order To-Do App to Railway for beta testing and production use.

## 🚀 **Quick Deploy to Railway**

### **Option 1: Deploy from GitHub (Recommended)**

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the configuration

### **Option 2: Deploy from Local Directory**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize and Deploy**
   ```bash
   railway init
   railway up
   ```

## ⚙️ **Configuration**

### **Environment Variables**
Set these in your Railway project dashboard:

```env
# Node.js Configuration
NODE_ENV=production
PORT=4321

# Shopify API Configuration (Optional for beta testing)
SHOPIFY_STORE_1_DOMAIN=your-store-1.myshopify.com
SHOPIFY_STORE_1_ACCESS_TOKEN=your-access-token-1
SHOPIFY_STORE_2_DOMAIN=your-store-2.myshopify.com
SHOPIFY_STORE_2_ACCESS_TOKEN=your-access-token-2
```

### **Railway Configuration**
The `railway.json` file is already configured with:
- **Builder**: NIXPACKS (automatic Node.js detection)
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Health Check**: Root path (`/`)
- **Restart Policy**: On failure with 10 retries

## 🏗️ **Build Process**

### **What Happens During Deployment**

1. **Dependency Installation**
   ```bash
   pnpm install --frozen-lockfile
   ```

2. **TypeScript Compilation**
   ```bash
   tsc
   ```

3. **Vite Build**
   ```bash
   vite build
   ```
   - Creates optimized production build in `dist/`
   - Generates static assets
   - Optimizes bundle splitting

4. **Express Server Start**
   ```bash
   node server.js
   ```
   - Serves static files from `dist/`
   - Handles SPA routing
   - Listens on Railway's assigned port

## 🔧 **Customization Options**

### **Using Docker (Alternative)**
If you prefer Docker deployment:

1. **Railway will automatically detect the Dockerfile**
2. **Multi-stage build process**:
   - Build stage: Installs dependencies and builds the app
   - Production stage: Lightweight image with only production files

### **Custom Build Commands**
You can modify `railway.json` for custom build steps:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build && pnpm test"
  }
}
```

## 📊 **Monitoring & Logs**

### **Railway Dashboard**
- **Deployments**: View build logs and deployment status
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Environment**: Manage environment variables

### **Health Checks**
- **Path**: `/` (root)
- **Timeout**: 100 seconds
- **Expected**: 200 OK response

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   ```bash
   # Check build logs in Railway dashboard
   # Common causes:
   # - Missing dependencies
   # - TypeScript errors
   # - Environment variable issues
   ```

2. **Port Issues**
   ```bash
   # Railway automatically sets PORT environment variable
   # The app listens on 0.0.0.0:$PORT
   ```

3. **Static File Serving**
   ```bash
   # Express server serves files from dist/
   # Ensure build completed successfully
   ```

### **Debug Commands**
```bash
# Local testing
pnpm build
pnpm start

# Check Railway logs
railway logs

# SSH into Railway instance
railway shell
```

## 🔄 **Continuous Deployment**

### **Automatic Deploys**
- **GitHub Integration**: Automatic deploys on push to main branch
- **Preview Deploys**: Automatic deploys on pull requests
- **Manual Deploys**: Trigger from Railway dashboard

### **Deployment Settings**
```json
{
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 📈 **Performance Optimization**

### **Build Optimizations**
- **Code Splitting**: Vendor and UI libraries separated
- **Tree Shaking**: Unused code removed
- **Minification**: Production-ready bundles
- **Caching**: Static assets cached

### **Runtime Optimizations**
- **Express Static**: Efficient static file serving
- **SPA Routing**: Client-side routing handled
- **Compression**: Gzip compression enabled

## 🔐 **Security Considerations**

### **Environment Variables**
- **Never commit secrets** to version control
- **Use Railway's environment variable management**
- **Rotate access tokens** regularly

### **Production Best Practices**
- **HTTPS**: Railway provides automatic SSL
- **Headers**: Security headers configured
- **CORS**: Configured for production domains

## 📞 **Support**

### **Railway Support**
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: [Railway Discord](https://discord.gg/railway)
- **GitHub**: [Railway GitHub](https://github.com/railwayapp)

### **App-Specific Issues**
- Check the main `DEPLOYMENT_README.md` for app-specific guidance
- Review `ORDER_TODO_APP_MODULES.md` for feature documentation

---

## 🎯 **Next Steps After Deployment**

1. **Test the deployed application**
2. **Configure Shopify API keys** (if needed)
3. **Set up custom domain** (optional)
4. **Monitor performance** and logs
5. **Share the beta testing URL** with your team

---

**Deployment Ready**: ✅  
**Railway Compatible**: ✅  
**Production Ready**: ✅ 