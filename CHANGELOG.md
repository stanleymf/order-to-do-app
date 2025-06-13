# Changelog

All notable changes to the Order To-Do App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-13

### 🎯 Enhanced Collapse/Expand Functionality

#### ✨ Improvements
- **Ultra-Compact Collapsed View**
  - When collapsed, OrderCard now shows only essential information:
    - Product title (truncated if needed)
    - Product variant (if available)
    - Checkbox (in batch mode)
    - Click hint text
  - Significantly reduces card height for better mobile viewing
  - Maintains all functionality in expanded view

- **Better Mobile Experience**
  - Collapsed cards take up minimal vertical space
  - Easier to scan through multiple orders quickly
  - Clear visual indication of collapsed vs expanded state
  - Consistent behavior across mobile and desktop layouts

#### 🐛 Bug Fixes
- Fixed TypeScript compilation errors
- Improved responsive design for collapsed state

---

## [1.0.0] - 2025-01-13

### 🎉 Initial Release - Order To-Do App V1.0.0

#### ✨ Features
- **Complete Florist Order Management System**
  - User authentication (Login/Logout)
  - Dashboard with navigation
  - Orders management with search, filtering, and batch operations
  - Product management with Shopify integration
  - Analytics and reporting
  - Store selector for multi-store support

- **Advanced Order Management**
  - Search and filter orders by multiple fields
  - Batch assignment functionality for bulk operations
  - Hierarchical sorting (assigned florist, timeslot, product, difficulty, type)
  - Order status tracking and completion
  - Customizations and remarks editing
  - Mobile-responsive design

- **Product Management with Shopify Integration**
  - Shopify REST Admin API integration
  - Product synchronization
  - Metafield management
  - Shopify product details display
  - Direct Shopify admin links
  - Store filtering

- **Enhanced User Experience**
  - Product image preview with eye icon
  - Collapsible OrderCard for mobile optimization
  - Click-to-expand/collapse functionality
  - Visual feedback and hover effects
  - Responsive design for mobile and desktop

#### 🚀 Deployment
- Railway deployment with Docker
- Express server for production
- Automatic GitHub integration
- Health check endpoints
- Production-ready configuration

#### 🛠️ Technical Stack
- React 18 + TypeScript
- Vite for build tooling
- Radix UI components
- Tailwind CSS for styling
- Express.js server
- Railway hosting platform

---

## Version Management

### How to use version management:

```bash
# Check current version
node scripts/version.js current

# Increment patch version (1.0.0 → 1.0.1)
node scripts/version.js patch

# Increment minor version (1.0.0 → 1.1.0)
node scripts/version.js minor

# Increment major version (1.0.0 → 2.0.0)
node scripts/version.js major

# Set specific version
node scripts/version.js set 1.5.0
```

### Version Guidelines:
- **Patch** (1.0.0 → 1.0.1): Bug fixes, minor improvements
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes, major features 