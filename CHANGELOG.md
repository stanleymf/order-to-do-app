# Changelog

All notable changes to the Order To-Do App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-alpha.13] - 2024-12-19

### 🚨 Critical Railway Healthcheck Fix
- **Server Configuration**: Fixed Railway deployment healthcheck failures
  - Added root route handler (`/`) for Railway healthcheck compatibility  
  - Added multiple healthcheck endpoints: `/`, `/health`, `/healthz`
  - Improved error handling and server startup resilience
  - Fixed middleware order and static file serving

### 🔧 Railway Configuration
- **Railway Config**: Added `railway.toml` with proper deployment settings
  - Custom healthcheck path configuration
  - Increased healthcheck timeout to 300 seconds
  - Explicit port and protocol configuration
  - Production environment defaults

### 🛠️ Server Improvements
- **Error Handling**: Enhanced server error handling and logging
  - Graceful handling of missing dist directory
  - Better error responses for API endpoints
  - Server startup error detection and exit
  - Production-ready error middleware

## [2.0.0-alpha.12] - 2024-12-19

### 🚀 Railway Deployment Optimization
- **Environment Setup**: Created comprehensive Railway environment variable setup guide
  - Required variables: `SHOPIFY_WEBHOOK_SECRET` for webhook verification
  - Optional performance variables: `NODE_ENV`, `RAILWAY_HEALTHCHECK_TIMEOUT_SEC`, `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS`
  - Detailed security best practices and variable sealing guidance

### 🔧 Server Improvements
- **Health Monitoring**: Added multiple monitoring endpoints
  - `/health` - Railway health check endpoint with detailed status
  - `/api/status` - API status with webhook configuration info
  - Enhanced startup logging with environment and configuration status
- **Performance**: Improved server configuration for Railway deployment
  - Better error handling and zero-downtime deployment support
  - Optimized for production environments

### 📚 Documentation
- **Railway Setup Guide**: Complete RAILWAY_ENVIRONMENT_SETUP.md with:
  - Step-by-step variable configuration
  - Security best practices and variable sealing
  - Troubleshooting guide with common issues and solutions
  - Multi-store configuration guidance
  - Performance optimization recommendations

## [2.0.0-alpha.11] - 2024-12-19

### 🐛 Critical Bug Fix
- **Data Service**: Fixed critical bug where DataService.getStores() was returning static mock data instead of actual localStorage data
  - This was the root cause of deleted stores still appearing in webhook management
  - StoreContext now properly receives updated store data from localStorage
  - All store-dependent components now reflect real-time store changes
  - Added debug logging to help track store updates and cleanup processes

### 🔧 Technical Details
- Updated DataService.getStores() to use getStoredStores() from storage utility
- Maintains fallback to mock data if no stored data exists (for first-time users)
- Enhanced debugging capabilities across StoreContext and MultiStoreWebhookManager

## [2.0.0-alpha.10] - 2024-12-19

### 🐛 Bug Fixes
- **Store Management**: Fixed critical bug where deleted stores were still appearing in webhook management dropdown
  - Added `refreshStores()` function to StoreContext for real-time updates
  - StoreManagement now refreshes global context when stores are added/updated/deleted
  - MultiStoreWebhookManager automatically cleans up orphaned webhook configurations
  - Improved store deletion to properly clean associated webhook configs
  - Enhanced confirmation dialog to mention webhook configuration removal

### 🔧 Technical Improvements
- StoreContext now properly handles store updates with automatic refresh mechanism
- Added cleanup logic for orphaned webhook configurations when stores are removed
- Improved error handling in store deletion process

## [2.0.0-alpha.9] - 2025-06-13

### 🔧 **Enhanced Multi-Store Webhook Management**

#### **Fixed**
- **Dynamic Store Dropdown**: Fixed Multi-Store webhook management Store dropdown to only show available stores
  - **Smart Filtering**: Dropdown now only displays stores that haven't been configured yet
  - **Prevents Duplicates**: Eliminates ability to create duplicate webhook configurations for the same store
  - **Better UX**: Disabled state when no stores are available to configure

#### **Enhanced User Experience**
- **Dynamic Placeholder**: Changes message based on store availability
- **Helper Text**: Provides guidance when no stores are available
- **Disabled Form Elements**: Form automatically disables when no unconfigured stores exist
- **Clear Guidance**: Directs users to Store Management when all stores are configured

#### **Technical Improvements**
- **Filtered Store List**: `availableStores` computed property filters out already configured stores
- **State Management**: Better handling of form state when no stores are available
- **User Feedback**: Comprehensive messaging for different states (empty, configured, unavailable)

---

## [2.0.0-alpha.8] - 2025-06-13

### 🚀 **Product Management Integration - Smart Multi-Store Sync**

#### **Major Integration Features**
- **Smart Store Configuration Detection**: Product sync now uses the new multi-store API configurations
- **Configuration Status Display**: Visual indicators showing which stores are ready for sync
- **Guided User Experience**: Clear guidance for configuring stores before syncing products
- **Per-Store API Integration**: Each store uses its own configured API credentials for product sync

#### **Enhanced Product Sync System**
- **Store-Specific API Calls**: Uses individual store API configurations from `MultiStoreWebhookManager`
- **Configuration Validation**: Checks for complete API setup before allowing sync
- **Better Error Handling**: Specific error messages for authentication, permissions, and domain issues
- **Status-Based UI**: Different UI states based on store configuration status (ready/disabled/incomplete/missing)

#### **Improved User Interface**
- **Configuration Status Badges**: 
  - ✅ **Ready** - Store configured and ready for sync
  - ⚠️ **Disabled** - Configuration exists but disabled
  - ⚠️ **Incomplete** - Missing API credentials
  - ❌ **Not Configured** - No configuration found
- **Smart Sync Buttons**: Only enabled for properly configured stores
- **Configuration Guidance**: Help panel with steps to configure stores
- **Visual Store Indicators**: Color-coded store identification

#### **Technical Improvements**
- **Decoupled from Legacy Config**: Removed dependency on old `shopify-mapping-config` localStorage
- **Multi-Store Architecture**: Full integration with the new store management system
- **Type Safety**: Complete TypeScript coverage for store configurations
- **Enhanced Error Messages**: User-friendly error descriptions with configuration guidance

#### **User Workflow Integration**
- **Phase 1**: Create stores in Store Management
- **Phase 2**: Configure API credentials per store
- **Phase 3**: Sync products with validated configurations
- **Seamless Flow**: Clear progression from store creation to product sync

#### **Developer Experience**
- **Clean Architecture**: Proper separation between store management and product sync
- **Maintainable Code**: Modular functions for configuration checking and status display
- **Consistent Patterns**: Follows established patterns from other multi-store components
- **Error Handling**: Comprehensive error handling with user-friendly messages

---

## [2.0.0-alpha.7] - 2025-06-13

### 🐛 **Fixed Domain Validation Issue**

#### **Bug Fixes**
- **Shopify Domain Validation**: Fixed overly restrictive domain validation that was rejecting valid Shopify domains
  - **Issue**: Previous regex pattern `{1,61}` was too restrictive for typical Shopify domains
  - **Solution**: Implemented proper Shopify domain validation patterns
  - **Supports**: Both `store-name.myshopify.com` and custom domains like `example.com`
  - **Improved**: More flexible validation while maintaining security

#### **Enhanced Validation**
- **Shopify-Specific Patterns**: Proper validation for `.myshopify.com` domains
- **Custom Domain Support**: Validation for custom domains  
- **Case Insensitive**: Domain validation now handles mixed case input
- **Better Error Messages**: More descriptive validation error messages

#### **Technical Improvements**
- **Regex Optimization**: More efficient and accurate domain pattern matching
- **Edge Case Handling**: Better support for short store names and hyphens
- **User Experience**: Reduced false negatives in domain validation

---

## [2.0.0-alpha.6] - 2025-06-13

### 🚀 **Proper Multi-Store Architecture - Store Management Foundation**

#### **New Features**
- **Store Management Interface**: Complete store creation and management system
  - **Create Stores**: Add new stores with name, domain, and color
  - **Edit Stores**: Modify existing store details
  - **Delete Stores**: Remove stores and associated data
  - **Visual Store Cards**: Clean UI with store color indicators
  - **Domain Validation**: Proper domain format validation
  - **Shopify Admin Links**: Direct links to store admin panels

#### **Architectural Improvements**
- **Two-Phase Configuration**: Proper separation of concerns
  - **Phase 1**: Store Management (create/edit stores)
  - **Phase 2**: API Configuration (configure Shopify integration)
- **Logical Workflow**: Users now create stores before configuring API integration
- **Better UX**: Clear separation between store management and technical configuration
- **Scalable Design**: Easy to add new stores without hardcoded limitations

#### **Enhanced Settings Organization**
- **Store Management Section**: Dedicated interface for store CRUD operations
- **API Configuration Section**: Focused on technical Shopify integration
- **Clear User Guidance**: Proper onboarding flow for multi-store setup
- **Persistent Storage**: Stores saved to localStorage for persistence

#### **UI/UX Improvements**
- **Color-Coded Stores**: Visual distinction with customizable store colors
- **Professional Dialogs**: Clean add/edit interfaces with proper validation
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Proper feedback during operations

#### **Technical Enhancements**
- **Store Type Safety**: Full TypeScript support for store operations
- **Validation System**: Comprehensive form validation and error handling
- **Storage Integration**: Seamless integration with existing storage system
- **Icon System**: Consistent iconography throughout the interface

#### **Developer Experience**
- **Modular Components**: Clean separation of Store Management functionality
- **Reusable Patterns**: Consistent patterns for future feature additions
- **Type Safety**: Full TypeScript coverage for all store operations
- **Error Handling**: Comprehensive error states and user feedback

---

## [2.0.0-alpha.5] - 2025-06-13

### 🚀 **Enhanced Store Selection & Filtering UX**

#### **Improved User Interface**
- **Store Selector Repositioning**: Moved store dropdown from header to beside date picker
- **Logical Filter Grouping**: All filtering controls now grouped together (date, store, status)
- **Better Visual Hierarchy**: Store selection positioned with other filter controls for intuitive workflow

#### **Enhanced Filtering Functionality**
- **All Stores View**: New "All Stores" option shows orders from all stores simultaneously
- **Store-Specific Filtering**: Select individual stores to view only their orders
- **Multi-Store Display**: When "All Stores" selected, orders grouped by store with individual stats
- **Single Store Display**: When specific store selected, clean single-store view with store branding

#### **Improved Multi-Store Experience**
- **Store Visual Indicators**: Color-coded store indicators in dropdowns and displays
- **Per-Store Statistics**: Individual store stats (pending, assigned, completed) in multi-store view
- **Store Branding**: Store colors and names prominently displayed
- **Unified Interface**: Seamless switching between all stores and individual store views

#### **Technical Improvements**
- **Enhanced Filtering Logic**: Optimized order filtering to support both single and multi-store views
- **State Management**: Proper store selection state management independent of global store context
- **Performance**: Efficient filtering and grouping for large order sets
- **Responsive Design**: Mobile-optimized store selector and multi-store display

#### **User Experience Benefits**
- **Intuitive Workflow**: Filter controls logically grouped beside date picker
- **Flexible Viewing**: Easy switching between all stores and individual store focus
- **Better Organization**: Clear visual separation of orders by store
- **Consistent Design**: Store selector styling matches other filter controls

---

## [2.0.0-alpha.4] - 2025-06-13

### 🚀 **Streamlined Configuration - Eliminated Redundancy**

#### **Removed**
- **Redundant Shopify API Configuration Card**: Eliminated the separate global API configuration
- **Duplicate Configuration Steps**: Removed extra configuration layer that duplicated store-specific settings

#### **Enhanced**
- **Consolidated Store Configuration**: All store settings now in one place
  - **API Credentials**: Access token, shop domain, API version per store
  - **Webhook Settings**: Webhook secret and webhook management per store
  - **Auto-Sync Settings**: Auto-sync toggle and sync interval per store
  - **Store Management**: Enable/disable webhooks per store

#### **Improved User Experience**
- **Single Configuration Point**: Configure all store settings in one unified interface
- **No Redundant Steps**: Eliminated duplicate API credential entry
- **Store-Specific Controls**: Each store has its own complete configuration
- **Cleaner Settings Interface**: Simplified admin settings with clear organization

#### **Technical Improvements**
- **Enhanced StoreWebhookConfig**: Added autoSync and syncInterval fields
- **Consolidated Data Structure**: Single source of truth for store configurations
- **Improved Type Safety**: Complete TypeScript coverage for consolidated config
- **Better Admin Experience**: Streamlined admin workflow with fewer steps

#### **Benefits**
- **Reduced Complexity**: Eliminated confusing configuration redundancy
- **Better Workflow**: Single form for complete store setup
- **Scalability**: Easier to add new stores with all settings in one place
- **Consistency**: Uniform configuration approach across all stores
- **Maintenance**: Simplified codebase with less configuration duplication

---

## [2.0.0-alpha.3] - 2025-06-13

### 🚀 **Multi-Store Webhook Management System**

#### **New Features**
- **Multi-Store Webhook Manager**: Complete webhook management system for multiple stores
- **Store-Specific Configurations**: Individual webhook settings per store
- **Bulk Operations**: Register/cleanup webhooks for all stores simultaneously
- **Status Monitoring**: Real-time webhook status with visual indicators
- **Admin Controls**: Multi-store webhook management for admin users only
- **Persistent Storage**: Store webhook configurations saved in localStorage

#### **Technical Implementation**
- **MultiStoreWebhookManager Class**: Store-specific webhook operations
- **StoreWebhookConfig Interface**: Individual store webhook configurations
- **Bulk Webhook Operations**: Efficient multi-store webhook management
- **Status Dashboard**: Visual webhook completion indicators
- **Legacy Support**: Original single-store webhook system maintained

#### **UI/UX Enhancements**
- **Multi-Store Webhook Interface**: Dedicated admin section in Settings
- **Store Configuration Form**: Add webhook settings for each store
- **Individual Store Management**: Enable/disable webhooks per store
- **Bulk Action Buttons**: Register all stores, cleanup all stores
- **Status Badges**: Complete, Partial, None indicators
- **Error Reporting**: Detailed error logs per store

#### **Security & Reliability**
- **Store-Specific Credentials**: Individual API access per store
- **Webhook Verification**: HMAC-SHA256 signature verification
- **Rate Limiting**: Prevents API abuse across multiple stores
- **Error Handling**: Comprehensive error reporting and recovery
- **Persistent Configs**: Settings survive browser restarts

#### **Developer Experience**
- **Type Safety**: Complete TypeScript coverage for multi-store webhooks
- **Modular Architecture**: Clean separation of concerns
- **Extensible Design**: Easy to add new webhook topics
- **Testing Support**: Comprehensive error handling and logging

---

## [2.0.0-alpha.2] - 2025-06-13

### 🚀 **Phase 1: Multi-Store Data Structure Migration - COMPLETE**

#### **🎯 Core Implementation**
- **Data Service Layer**: Created comprehensive `DataService` class for centralized data access
  - Store-specific filtering and operations
  - Analytics and reporting methods
  - Search and validation functionality
  - Backward compatibility with existing data structure

- **Store Context Management**: Implemented React context for global store state
  - `StoreProvider` component for app-wide store selection
  - `useStore` and `useStoreData` hooks for easy access
  - Automatic store loading and error handling
  - Default store selection (Windflower Florist)

#### **🎨 User Interface Enhancements**
- **Store Selection UI**:
  - **Desktop**: `StoreSelector` component with dropdown interface
  - **Mobile**: `StoreIndicator` component for compact display
  - Visual store identification with colored dots
  - Smooth transitions and responsive design
  - Store domain display in dropdown

- **Dashboard Integration**:
  - Store selector integrated into main header
  - Mobile store indicator in compact format
  - Responsive design for all screen sizes
  - Visual store branding throughout the app

#### **🔧 Technical Architecture**
- **Enhanced Type Definitions**: All types already support multi-store structure
- **Comprehensive Store Management**: Complete CRUD operations for stores
- **Data Filtering**: Store-specific filtering across all components
- **Performance Optimization**: Efficient data access patterns
- **Backwards Compatibility**: Existing single-store functionality preserved

#### **📊 Analytics & Reporting**
- **Store-Specific Analytics**: Individual store performance metrics
- **Cross-Store Comparisons**: Compare performance across multiple stores
- **Aggregated Reporting**: Combined stats when viewing all stores
- **Flexible Data Views**: Switch between individual and combined store views

---

## [1.0.37] - 2025-06-13

### Fixed
- **Webhook Verification**: Fixed bug in webhook signature verification logic
  - Now uses the raw request body (Buffer) for HMAC calculation
  - Prevents server error: The "data" argument must be of type string or Buffer
  - Ensures Shopify webhook signature verification is secure and reliable

## [1.0.36] - 2025-06-13

### Added
- **Auto Webhook Registration**: Complete webhook management system with Shopify API
  - **Webhook Manager Class**: `ShopifyWebhookManager` for automated webhook operations
  - **Auto-Registration**: Automatically registers required webhooks via Shopify API
  - **Smart URL Detection**: Automatically detects Railway vs local development URLs
  - **Webhook Cleanup**: Remove old webhooks pointing to different endpoints
  - **Connectivity Testing**: Test webhook endpoint accessibility
  - **Status Monitoring**: Real-time webhook registration status and error reporting

### Enhanced
- **Settings Interface**: New webhook management section in Settings
  - **Auto-Register Button**: One-click webhook registration for all required topics
  - **Cleanup Button**: Remove outdated webhooks automatically
  - **Test Button**: Verify webhook endpoint connectivity
  - **Status Display**: Show registered, existing, and error counts
  - **Error Details**: Expandable error details for troubleshooting

### Technical Improvements
- **Server Webhook Endpoint**: Added `/api/webhooks/shopify` endpoint to server.js
  - **Signature Verification**: HMAC-SHA256 webhook signature verification
  - **Topic Handling**: Support for orders/create, orders/updated, orders/cancelled, products/create, products/updated
  - **Security**: Webhook secret verification for production deployments
  - **Logging**: Comprehensive webhook activity logging

### Webhook Topics Supported
- **Orders**: `orders/create`, `orders/updated`, `orders/cancelled`
- **Products**: `products/create`, `products/updated`
- **Format**: JSON with HMAC-SHA256 verification
- **Auto-Detection**: Railway deployment URL vs localhost for development

### Security Features
- **Webhook Secret**: Environment variable `SHOPIFY_WEBHOOK_SECRET` for verification
- **Signature Validation**: Cryptographic verification of webhook authenticity
- **Error Handling**: Graceful handling of invalid webhook signatures
- **Rate Limiting**: Existing rate limiting applied to webhook operations

## [1.0.35] - 2024-06-14

### Enhanced
- **Faster Auto-Sync**: Added support for sync intervals as low as 10 seconds for near real-time order updates
- **Rate Limiting Protection**: Added backend rate limiting to prevent hitting Shopify's API limits (2 requests/second)
- **Smart Sync Options**: Updated Settings with detailed sync interval options and rate limit guidance

### Added
- **Sync Interval Options**: 
  - 10 seconds (Very Fast) - ~2 API calls/minute
  - 30 seconds (Fast) - ~4 API calls/minute  
  - 1 minute (Recommended) - ~2 API calls/minute
  - 5+ minutes (Conservative) - Minimal API usage
- **Rate Limit Handling**: Backend proxy now handles Shopify's 429 rate limit responses with proper retry guidance
- **Shop Domain Rate Limiting**: Per-shop rate limiting to prevent overwhelming individual stores

### Technical
- **Default Sync**: Changed default from 5 minutes to 1 minute for better responsiveness
- **Error Handling**: Improved error messages for rate limit scenarios
- **Performance**: Conservative rate limiting (100 requests/minute) to stay well under Shopify's 120/minute limit

## [1.0.34] - 2024-06-14

### Fixed
- **Configuration Migration**: Fixed "Cannot read properties of undefined (reading 'accessToken')" error by adding migration logic for existing configurations that don't have the `api` property.
- **Settings Component**: Added safety checks to ensure the `api` property is properly initialized when loading existing configurations.

### Technical
- **Migration Function**: Added `migrateConfig` function to handle old configuration formats
- **Backward Compatibility**: Existing configurations are automatically migrated to the new format with API settings
- **Error Prevention**: Added safety checks in both Settings component and Shopify API service

## [1.0.33] - 2024-06-14

### Fixed
- **Deployment Issue**: Fixed Railway deployment failure by removing `node-fetch` dependency and using Node 18's built-in `fetch` instead, resolving ES module compatibility issues.

### Technical
- **Dependencies**: Removed `node-fetch` v3.x from package.json (ES module compatibility issue)
- **Server**: Updated server.js to use Node 18's native fetch API
- **Deployment**: Railway deployment should now succeed

## [1.0.32] - 2024-06-14

### Fixed
- **CORS Issue**: Fixed CORS errors when syncing orders/products from Shopify by routing all Shopify API requests through a backend proxy endpoint (`/api/shopify/proxy`).
- **API Configuration**: Frontend now uses the API settings (access token, domain, version) from the Settings page for all Shopify API calls. No more hardcoded tokens.
- **TypeScript/Linter**: Fixed all TypeScript and linter errors related to product mapping and API service.

### Added
- **Backend Proxy**: Added a backend Express proxy endpoint to securely relay Shopify API requests and avoid CORS issues.
- **Robust Error Handling**: Improved error handling and user feedback for missing or invalid API configuration.

### Deployment
- Ready for deployment to Railway with all fixes and improvements.

## [1.0.30] - 2025-06-13

### Added
- **Shopify API Configuration Card**: New dedicated card in Settings for API configuration
  - **Access Token Field**: Secure password input for Shopify access token
  - **Shop Domain Field**: Input for Shopify store domain (e.g., my-store.myshopify.com)
  - **API Version Selection**: Dropdown with latest Shopify API versions (2024-10 to 2023-01)
  - **Webhook Secret Field**: Optional password input for webhook verification
  - **Auto Sync Toggle**: Enable/disable automatic order synchronization
  - **Sync Interval Selection**: Configurable sync intervals (1 minute to 1 hour)
  - **Default Configuration**: Auto sync enabled with 5-minute interval by default

### Enhanced
- **Settings Interface**: Expanded configuration interface with API settings
  - **TypeScript Interface**: Added ShopifyAPIConfig interface for type safety
  - **Configuration Persistence**: API settings saved to localStorage with other settings
  - **Mobile Responsive**: API configuration card adapts to mobile and desktop layouts
  - **Security Features**: Password fields for sensitive API credentials
  - **User Guidance**: Helpful descriptions for each configuration field

### Technical
- **Configuration Structure**: API settings integrated into existing mapping configuration
- **State Management**: Proper state handling for API configuration changes
- **Validation**: Input validation and error handling for API fields
- **Integration Ready**: API configuration ready for integration with Shopify API service

## [1.0.29] - 2025-06-13

### Fixed
- **Delivery Type Display**: Fixed missing Type container in order cards
  - **Mock Data Enhancement**: Added deliveryType fields to all mock orders
  - **Variety of Types**: Added delivery, collection, and express types to different orders
  - **Visual Confirmation**: Type container now properly displays in order cards
  - **Color Coding**: Green (delivery), Blue (collection), Red (express) badges visible

### Enhanced
- **Test Data**: Improved mock data to better demonstrate delivery type functionality
  - Windflower Florist orders now cycle through delivery, collection, and express types
  - Bloom & Co and Garden Dreams orders have varied delivery types
  - Better representation of real-world order scenarios

### Technical
- **Data Consistency**: All mock orders now include deliveryType field
- **Visual Testing**: Type container can now be properly tested and verified
- **Real-world Simulation**: Mock data better reflects actual Shopify order structure

## [1.0.28] - 2025-06-13

### Added
- **Order Search Bar**: Added comprehensive search functionality above the batch assign button
  - **Search Fields**: Search through order ID, product name, product variant, customer name, customer email, customer phone, remarks, product customizations, timeslot, and delivery type
  - **Real-time Filtering**: Orders are filtered instantly as you type
  - **Clear Button**: X button to quickly clear the search query
  - **Search Results Counter**: Shows number of orders matching the search query
  - **Responsive Design**: Mobile-friendly search bar with appropriate sizing

### Enhanced
- **Order Filtering**: Improved order filtering system with search integration
  - **Combined Filters**: Search works together with existing store and status filters
  - **Smart Search**: Case-insensitive search across multiple order fields
  - **Visual Feedback**: Clear indication when no orders match search criteria
  - **Performance**: Optimized filtering with useCallback for better performance

### Improved
- **User Experience**: 
  - More efficient order discovery and management
  - Quick access to specific orders without scrolling
  - Better workflow for finding orders by various criteria
  - Enhanced mobile experience with responsive search bar

### Technical
- **Search Logic**: Comprehensive search across all relevant order fields
- **State Management**: Proper state handling for search query
- **Component Integration**: Seamless integration with existing filtering system
- **Mobile Responsiveness**: Adaptive design for different screen sizes

## [1.0.27] - 2025-06-13

### Fixed
- **Delivery Type Display**: Fixed missing Type container in order cards
  - **Mock Data Enhancement**: Added deliveryType fields to all mock orders
  - **Variety of Types**: Added delivery, collection, and express types to different orders
  - **Visual Confirmation**: Type container now properly displays in order cards
  - **Color Coding**: Green (delivery), Blue (collection), Red (express) badges visible

### Enhanced
- **Test Data**: Improved mock data to better demonstrate delivery type functionality
  - Windflower Florist orders now cycle through delivery, collection, and express types
  - Bloom & Co and Garden Dreams orders have varied delivery types
  - Better representation of real-world order scenarios

### Technical
- **Data Consistency**: All mock orders now include deliveryType field
- **Visual Testing**: Type container can now be properly tested and verified
- **Real-world Simulation**: Mock data better reflects actual Shopify order structure

## [1.0.26] - 2025-06-13

### Enhanced
- **Delivery Type Container**: Added dedicated Delivery Type container in order cards
  - **Consistent Layout**: Delivery Type now has its own dedicated container matching Timeslot and Assignment containers
  - **Visual Integration**: Properly integrated into both mobile and desktop layouts
  - **Responsive Grid**: Grid layout adapts from 2 columns to 3 columns when delivery type is present
  - **Color Coding**: Maintains color-coded badges (green=delivery, blue=collection, red=express)
  - **Settings Integration**: Tied to Delivery Type Mapping configuration in Settings

### Improved
- **Order Card Layout**: More organized and consistent container structure
  - All essential information (Timeslot, Type, Florist) now have dedicated containers
  - Better visual hierarchy and spacing
  - Improved mobile and desktop responsiveness
  - Cleaner separation of information types

### Technical
- **Layout Logic**: Dynamic grid column adjustment based on delivery type presence
- **Component Structure**: Enhanced OrderCard component with better container organization
- **Visual Consistency**: Unified styling across all information containers

## [1.0.25] - 2025-06-13

### Fixed
- **Mobile Menu Duplication**: Fixed duplicate Products and Settings tabs in mobile view
  - Removed redundant mobile admin tabs section that created a second row
  - Admin tabs now properly display in a single row with 2-column grid layout
  - Eliminated visual duplication and improved mobile navigation consistency

### Changed
- **Browser Tab Title**: Updated from "React Starter" to "Order To-Do"
  - More descriptive and brand-appropriate title for the application
  - Better user experience with clear application identification

### Added
- **Flower Favicon**: Added custom flower-themed favicon
  - Pink flower design with golden center and green stem
  - Replaces default Vite favicon with brand-appropriate icon
  - SVG format for crisp display at all sizes

### Enhanced
- **Brand Identity**: Improved visual branding with custom favicon and title
- **Mobile UX**: Cleaner mobile navigation without duplicate elements
- **Professional Appearance**: More polished and professional application presentation

## [1.0.24] - 2025-06-13

### Added
- **Optimized Mobile Order Cards**: Enhanced mobile order card display with better space utilization
  - **Tabbed Layout**: Switch between "Details" and "Items" tabs for better organization
  - **Collapsed View**: Order items are now in a dedicated tab, reducing vertical space
  - **Improved Layout**: Product info, customer details, and timeslot better organized
  - **Responsive Design**: Optimized for mobile screens with cleaner visual hierarchy

### Enhanced
- **Mobile User Experience**: Streamlined mobile interface with less scrolling
- **Better Information Architecture**: Logical separation of order details and items
- **Visual Clarity**: Cleaner layout with better use of available screen space

## [1.0.23] - 2025-06-13

### Fixed
- **Settings Menu Integration**: Integrated Settings tab into the main navigation menu container
  - Settings tab now appears in the same TabsList as Orders, Analytics, and Products
  - Updated desktop grid layout from 3 columns to 4 columns to accommodate all tabs
  - Settings tab properly integrated into the navigation menu for both desktop and mobile
  - Consistent styling and responsive design across all navigation elements
  - Admin-only access maintained for Settings tab

### Enhanced
- **Navigation Consistency**: All admin tabs (Products, Settings) now follow the same layout pattern
- **Mobile Responsiveness**: Settings tab properly adapted for mobile view with appropriate sizing
- **User Experience**: More intuitive navigation with all related tabs grouped together

## [1.0.22] - 2025-06-13

### Fixed
- **TypeScript Compilation Errors**: Fixed all TypeScript build errors
  - Removed unused import `syncOrdersFromShopify` from OrdersView component
  - Removed unused imports `Badge` and `Textarea` from Settings component
  - Fixed duplicate `User` identifier by renaming to `UserType`
  - Removed unused `config` parameter from `extractDeliveryInfoFromTags` method
  - Removed unused `note` parameter from `extractCustomizations` method
  - All TypeScript compilation now passes successfully

### Technical
- **Build Process**: Ensured clean TypeScript compilation
- **Code Quality**: Removed unused imports and parameters
- **Type Safety**: Fixed type identifier conflicts

## [1.0.21] - 2025-06-13

### Added
- **Admin Settings Menu**: New settings interface for admin users
  - **Access Control**: Admin-only access with role-based permissions
  - **Settings Tab**: Added to Dashboard navigation for admin users
  - **Mobile Support**: Responsive design for mobile and desktop views
  - **Configuration Persistence**: Settings saved to localStorage

### Enhanced
- **Shopify Order Mapping Configuration**: Comprehensive mapping customization
  - **Date Mapping**: Configure date source, pattern, and format
    - Sources: Order tags, created date, custom field
    - Patterns: Custom regex patterns for date extraction
    - Formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  - **Timeslot Mapping**: Configure timeslot source and format
    - Sources: Order tags, line item properties, order note
    - Patterns: Custom regex patterns for time extraction
    - Formats: HH:MM-HH:MM, HH:MM AM/PM-HH:MM AM/PM, HAM/PM-HAM/PM
  - **Delivery Type Mapping**: Configure delivery type detection
    - Sources: Order tags, line item properties, order note
    - Keywords: Customizable keywords for delivery, collection, express
  - **Instructions Mapping**: Configure special instructions extraction
    - Sources: Line item properties, order note, both
    - Property names: Customizable property name for instructions
    - Keywords: Customizable keywords for instruction detection
  - **Customizations Mapping**: Configure product customizations
    - Sources: Line item properties, order note, both
    - Exclude properties: Customizable list of properties to exclude
  - **Customer Info Mapping**: Configure customer data extraction
    - Name format: First Last, Last First, Full Name
    - Include options: Phone number, email address

### Technical Implementation
- **Configuration Interface**: TypeScript interface for mapping configuration
- **Dynamic Loading**: Real-time configuration loading in Shopify API
- **Fallback Support**: Default configuration when no custom settings exist
- **Validation**: Input validation and error handling
- **Toast Notifications**: Success/error feedback for configuration changes

### UI/UX Features
- **Intuitive Interface**: Organized sections with clear labels and icons
- **Real-time Updates**: Configuration changes apply immediately
- **Reset Functionality**: Reset to default configuration
- **Save/Load**: Persistent configuration storage
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## [1.0.20] - 2025-06-13

### Enhanced
- **Timeslot Format Support**: Added primary support for HH:MM-HH:MM format from Shopify order tags
  - **Primary Format**: `"09:00-11:00"` → `"9:00 AM - 11:00 AM"` (24-hour to 12-hour conversion)
  - **Automatic Conversion**: 24-hour format automatically converted to 12-hour format with AM/PM
  - **Fallback Support**: Still supports existing AM/PM formats as alternatives
  - **Time Conversion**: Added `convertTo12HourFormat` utility function

### Updated
- **Testing Guide**: Updated with HH:MM-HH:MM format examples
  - All test orders now use 24-hour format: `"09:00-11:00"`, `"14:00-18:00"`, `"18:00-20:00"`
  - Added conversion examples showing 24-hour to 12-hour transformation
  - Updated troubleshooting section with format guidance
- **Test Orders**: Updated to use HH:MM-HH:MM format
  - `"09:00-11:00"` instead of `"9:00 AM - 11:00 AM"`
  - `"14:00-18:00"` instead of `"2:00 PM - 6:00 PM"`
  - `"18:00-20:00"` instead of `"6:00 PM - 8:00 PM"`

### Technical Improvements
- **Time Parsing**: Enhanced regex pattern for HH:MM-HH:MM format
- **Format Conversion**: Added utility function for 24-hour to 12-hour conversion
- **Backward Compatibility**: Maintains support for existing AM/PM formats

## [1.0.19] - 2025-06-13

### Fixed
- **Date Format Standardization**: Clarified that all dates are read as DD/MM/YYYY format
  - **Consistent Interpretation**: All date inputs are treated as DD/MM/YYYY regardless of input format
  - **Updated Documentation**: Testing guide now clearly specifies DD/MM/YYYY format
  - **Test Examples**: Updated all test orders to use DD/MM/YYYY format
  - **Troubleshooting**: Added clear guidance on date format requirements

### Updated
- **Testing Guide**: Clarified date extraction requirements
  - All examples now use DD/MM/YYYY format
  - Added note about consistent DD/MM/YYYY interpretation
  - Updated troubleshooting section with format clarification
- **Test Orders**: Updated to use correct DD/MM/YYYY format
  - `"13/06/2025"` instead of `"06/13/2025"`
  - `"14/06/2025"` instead of `"06/14/2025"`

## [1.0.18] - 2025-06-13

### Enhanced
- **Tag-Based Smart Extraction**: Improved order data extraction from Shopify order tags
  - **Date Extraction**: Extract delivery dates from order tags (06/13/2025, 13/06/25, 6-13-2025)
  - **Timeslot Extraction**: Extract delivery times from order tags (9:00 AM - 2:00 PM, 9AM - 2PM)
  - **Delivery Type Extraction**: Extract delivery method from order tags (delivery, collection, express)
  - **Visual Indicators**: Color-coded delivery type badges (green=delivery, blue=collection, red=express)
  - **Mobile Support**: Delivery type display in mobile card layout

### Added
- **Delivery Type Field**: New `deliveryType` field in Order interface
  - Supports: `'delivery' | 'collection' | 'express'`
  - Automatic detection from order tags
  - Visual display in order cards with color coding

### Updated
- **Order Card UI**: Enhanced with delivery type display
  - Desktop: Badge-style delivery type indicator
  - Mobile: Compact delivery type card
  - Color coding: Green (delivery), Blue (collection), Red (express)
- **Testing Guide**: Updated with tag-based extraction examples
  - New test orders using order tags
  - Comprehensive troubleshooting for tag extraction
  - Multiple date and time format examples

### Technical Improvements
- **Extraction Logic**: Replaced note/property parsing with tag-based extraction
- **Date Parsing**: Support for multiple date formats (MM/DD/YYYY, DD/MM/YY, M-D-YYYY)
- **Time Parsing**: Support for multiple time formats (HH:MM AM/PM, HAM/PM)
- **Delivery Type Detection**: Intelligent keyword matching for delivery methods

## [1.0.17] - 2025-06-13

### Added
- **Shopify Order Sync**: Complete order synchronization from Shopify stores
  - **Order Fetching**: Fetch orders from Shopify REST Admin API
  - **Data Mapping**: Map Shopify orders to local Order interface
  - **Smart Extraction**: Extract delivery times, instructions, and customizations
  - **Order Properties**: Parse line item properties for delivery slots and special requests
  - **Note Parsing**: Intelligent parsing of order notes for timeslots and instructions
  - **Customer Data**: Include customer email, phone, name, and order details
  - **Sync Buttons**: Individual sync buttons for each store in OrdersView
  - **Real-time Updates**: Toast notifications for sync success/failure
  - **Date Filtering**: Sync orders for specific dates
  - **Conflict Resolution**: Preserve florist assignments when updating existing orders

### Enhanced
- **Order Interface**: Extended with Shopify-specific fields
  - `shopifyId`: Shopify order ID for tracking
  - `customerEmail`, `customerPhone`, `customerName`: Customer information
  - `totalPrice`, `currency`: Financial details
  - `fulfillmentStatus`, `financialStatus`: Order status tracking
  - `createdAt`, `updatedAt`: Timestamp tracking

### Technical Implementation
- **API Integration**: Shopify REST Admin API v2024-01
- **Error Handling**: Comprehensive error handling and user feedback
- **Data Preservation**: Maintains florist assignments during sync
- **Responsive Design**: Mobile-friendly sync interface
- **Loading States**: Visual feedback during sync operations

## [1.0.16] - 2025-06-13

### Added
- **All Orders Stats Card**: Added missing "All Orders" card as the first card in stats breakdown
  - **Total Orders Display**: Shows total count of all orders (pending + assigned + completed)
  - **Clickable Filter**: Click to show all orders (resets any status filter)
  - **Visual Consistency**: Gray theme with Package icon to match other stats cards
  - **Responsive Design**: Adapts to mobile view with proper spacing and sizing
  - **Grid Layout**: Updated from 3-column to 4-column grid on desktop
  - **Active State**: Gray ring and background when "All Orders" filter is active

### Enhanced
- **Complete Stats Overview**: Now shows all four order statuses (All, Pending, Assigned, Completed)
- **Better User Experience**: Users can quickly see total order count and reset filters
- **Consistent Interaction**: All stats cards now have click-to-filter functionality

## [1.0.15] - 2025-06-13

### Verified
- **Average Time Completion Logic**: Confirmed that the completion time calculation system is fully intact and working correctly
  - **`calculateCompletionRate()` function** in `src/utils/storage.ts` is present and functional
  - **Batch processing accounting**: Groups orders by date to calculate daily work sessions
  - **Time calculation logic**: 
    - Finds earliest assignment time and latest completion time for each day
    - Calculates total work time from first assignment to last completion
    - Accounts for multiple orders completed in the same work session
    - Returns average minutes per order across all completed orders
  - **`updateFloristStats()` function** properly calls completion rate calculation
  - **Analytics integration**: Completion times displayed in Analytics dashboard
  - **Store breakdown**: Individual store completion times calculated separately
  - **Performance badges**: "Efficient" badge for florists with ≤40 minute average times

### Analytics Features Confirmed
- **Real-time stats calculation**: Updates when orders are completed
- **Store-specific breakdowns**: Individual store performance metrics
- **Performance indicators**: Top performer, fastest florist badges
- **Time formatting**: Proper display in hours and minutes format
- **Mobile responsive**: Analytics dashboard works on all devices

## [1.0.14] - 2025-06-13

### Verified
- **Hierarchical Sorting Logic**: Confirmed that the 5-level priority sorting system is fully intact and working correctly
  - **Level 1**: Assigned florist priority (current user first, unassigned second, others third)
  - **Level 2**: Timeslot priority (earlier times first, parsed from "9:00 AM - 11:00 AM" format)
  - **Level 3**: Product name priority (alphabetical sorting, same names grouped)
  - **Level 4**: Difficulty priority (based on configured ProductLabel priorities)
  - **Level 5**: Product type priority (based on configured ProductLabel priorities)
  - All helper functions (`getFloristPriority`, `parseTimeSlot`, `getDifficultyPriority`, `getProductTypePriority`) are present
  - Sorting is applied consistently in both single-store and multi-store views
  - Documentation in ORDER_TODO_APP_MODULES.md matches implementation

### Documentation
- **Sorting Logic Reference**: Complete 5-level hierarchical sorting system documented in ORDER_TODO_APP_MODULES.md
  - Clear explanation of each priority level
  - Implementation details for time parsing and label priorities
  - Business logic rationale for florist assignment ordering

## [1.0.13] - 2025-06-13

### Added
- **Clickable Stats Cards**: Stats overview cards are now interactive
  - Click on "Pending Orders" card to filter by pending status
  - Click on "Assigned Orders" card to filter by assigned status  
  - Click on "Completed Orders" card to filter by completed status
  - Click again on the same card to clear the filter (show all orders)
  - Visual feedback with colored ring and background when selected

### Enhanced
- **User Experience**: More intuitive filtering with visual feedback
- **Quick Filtering**: Single-click access to status-based filtering
- **Visual Consistency**: Uniform styling across all stats cards

## [1.0.12] - 2025-06-13

### Fixed
- **Order Completion Timestamps**: Fixed bug where completion timestamps weren't being recorded properly
  - `completedAt` field now correctly saved when orders are marked as completed
  - Timestamps properly stored in localStorage with order data
  - Analytics calculations now have accurate completion time data
  - Fixed issue where completion stats showed incorrect times

### Enhanced
- **Analytics Accuracy**: Completion time calculations now use proper timestamp data
- **Data Integrity**: Ensures all completion actions are properly recorded
- **Time Tracking**: Reliable tracking of order completion times for analytics

## [1.0.11] - 2025-06-13

### Fixed
- **Product Label Priorities**: Fixed bug where product labels weren't showing priorities from configuration
  - Product labels now properly use configured priorities from ProductLabel mapping
  - Difficulty and type priorities correctly applied to order sorting
  - Labels display correct priority values in order cards
  - Configuration changes now properly update displayed priorities

### Enhanced
- **Label Display**: More accurate priority display in product labels
- **Sorting Accuracy**: Hierarchical sorting now uses correct priority values
- **Configuration Integration**: Better integration between label config and display

## [1.0.10] - 2025-06-13

### Fixed
- **Order Assignment**: Fixed bug where batch assignment wasn't working correctly
  - Batch assignment now properly updates all selected orders
  - Fixed issue where some orders weren't being assigned to selected florist
  - Assignment timestamps now correctly recorded
  - Florist assignment status properly reflected in order display

### Enhanced
- **Batch Operations**: More reliable bulk assignment operations
- **User Feedback**: Better error handling and success notifications
- **Data Consistency**: Ensures all assignments are properly saved

## [1.0.9] - 2025-06-13

### Fixed
- **Mobile Navigation**: Fixed mobile navigation menu not displaying correctly
- **Responsive Design**: Improved responsive design for mobile devices

## [1.0.8] - 2025-06-13

### Fixed
- **Order Status Updates**: Fixed bug where order status changes weren't being saved
- **Data Persistence**: Improved data persistence for order modifications

## [1.0.7] - 2025-06-13

### Fixed
- **Date Picker**: Fixed date picker not updating order display correctly
- **Filtering**: Improved order filtering by date

## [1.0.6] - 2025-06-13

### Fixed
- **Order Display**: Fixed order cards not displaying product information correctly
- **UI Layout**: Improved order card layout and styling

## [1.0.5] - 2025-06-13

### Fixed
- **Authentication**: Fixed user authentication flow
- **Login State**: Improved login state management

## [1.0.4] - 2025-01-13

### Fixed
- **TypeScript Compilation**: Fixed TypeScript compilation errors
- **Build Process**: Improved build process reliability

## [1.0.3] - 2025-01-13

### Fixed
- **Order Management**: Fixed order assignment and completion tracking
- **Analytics Calculations**: Improved analytics data accuracy

## [1.0.2] - 2025-01-13

### Fixed
- **Component Rendering**: Fixed component rendering issues
- **Responsive Design**: Improved responsive design for collapsed state

## [1.0.1] - 2025-01-13

### Added
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

### Technical
- **Deployment**: Railway deployment with Docker
- **Server**: Express server for production
- **Integration**: Automatic GitHub integration
- **Monitoring**: Health check endpoints
- **Configuration**: Production-ready configuration

- **Tech Stack**: React 18 + TypeScript, Vite, Radix UI, Tailwind CSS, Express.js, Railway

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