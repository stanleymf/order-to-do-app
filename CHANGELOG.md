# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0-alpha.39] - 2024-12-19

### 🎯 **MAJOR RESTRUCTURE: Store-Specific Order Data Mapping System**

**RESTRUCTURED**: Complete overhaul of Order Data Mapping component to focus exclusively on store-specific order mapping with comprehensive Shopify field integration.

#### ✨ **Key Transformation**
- **Simplified Focus**: Removed complex advanced field mapping, focused purely on store-specific order mapping
- **Zapier-Style Interface**: Implemented **Shopify Field → Formatting Method → Order Card Component** workflow
- **Fixed Order Card Components**: 15 predefined Order Card components that require Shopify order data
- **Comprehensive Shopify Fields**: 30+ available Shopify fields organized by categories
- **Advanced Formatting Methods**: 11 powerful data transformation methods

#### 🏗️ **New Architecture**

##### **Fixed Order Card Components (15 Components)**
- **Currently Shown**: Order ID, Product Name, Product Variant, Timeslot, Delivery Type, Special Instructions, Product Customizations
- **Available**: Customer Name, Customer Email, Customer Phone, Delivery Date, Total Price, Currency, Fulfillment Status, Financial Status

##### **Shopify Fields (30+ Fields)**
- **Order Info**: ID, name, tags, prices, status, notes, created/updated dates
- **Customer Info**: Name, email, phone details
- **Line Items**: Product titles, variants, quantities, prices, SKUs
- **Shipping Address**: Complete address information
- **Line Item Properties**: Custom delivery dates, times, instructions, card messages

##### **Formatting Methods (11 Methods)**
- **Direct Copy**: Use field value as-is
- **Extract with Regex**: Extract patterns using regex (e.g., `/2024-\\d{2}-\\d{2}/`)
- **Split & Extract**: Split by delimiter and extract specific part
- **Date Format**: Format dates (MM/DD/YYYY, DD/MM/YYYY, etc.)
- **Currency Format**: Add currency symbols ($, €, £)
- **Text Transform**: Change case (uppercase, lowercase, capitalize, title)
- **Concatenate Fields**: Combine multiple fields with expressions
- **Conditional Logic**: If/then logic based on conditions
- **Mathematical Operations**: Perform calculations
- **Lookup Table**: Map values using JSON lookup tables
- **Filter Array Items**: Filter and extract from arrays

#### 🎨 **Enhanced User Interface**
- **Visual Flow Design**: Clear **Shopify Field → Formatting → Order Card Component** visualization
- **Store Selection**: Dropdown with color-coded store indicators
- **Configuration Management**: Copy between stores, reset, save functionality
- **Priority Management**: Numbered priority system with active/inactive toggles
- **Dynamic Configuration**: Formatting methods show relevant configuration fields
- **Reference Guide**: Complete Order Card components reference with current status

#### 🔧 **Technical Implementation**
- **TypeScript Interfaces**: `StoreFieldMapping`, `StoreOrderMappingConfig`
- **Local Storage**: Separate storage key `store-order-mapping-configs`
- **State Management**: Comprehensive React state management for configurations
- **Error Handling**: Robust error handling with toast notifications
- **Mobile Responsive**: Optimized for all screen sizes

#### 📊 **Configuration Features**
- **Per-Store Configurations**: Each store maintains individual mapping rules
- **Fallback Values**: Optional fallback values when mapping fails
- **Active/Inactive Mappings**: Toggle mappings on/off without deletion
- **Configuration Copying**: Copy successful configurations between stores
- **Bulk Operations**: Reset all mappings or save all changes at once

#### 🎯 **Business Impact**
- **Simplified Workflow**: Focused approach eliminates complexity
- **Store-Specific Accuracy**: Each store can have tailored order display rules
- **Reduced User Confusion**: Clear mapping ensures correct information display
- **Scalable Solution**: Easy to configure new stores with proven mapping patterns
- **Maintenance Friendly**: Simple interface reduces configuration errors

#### 🚀 **Example Mapping Flows**
```
tags → Extract Regex: /2024-\d{2}-\d{2}/ → Delivery Date
customer.first_name + " " + customer.last_name → Concatenate → Customer Name
tags contains "express" ? "Express" : "Standard" → Conditional → Delivery Type
line_items[0].properties[special_instructions] → Direct Copy → Special Instructions
```

#### 🔄 **Migration from Previous Version**
- **Removed**: Complex advanced field mapping interface
- **Simplified**: Single-purpose store-specific mapping focus
- **Enhanced**: More comprehensive Shopify field access
- **Improved**: Better user experience with visual flow design

---

## [2.0.0-alpha.38] - 2024-12-19

### 🎯 **MAJOR ENHANCEMENT: Unified Order Data Mapping System**

**MERGED**: Store-Specific Order Mapping from Settings with Order Data Mapping page to create a comprehensive, unified mapping system with access to 30+ Shopify fields.

#### ✨ **Key Improvements**
- **Unified Interface**: Combined two separate mapping systems into one comprehensive solution
- **Enhanced Field Access**: Expanded from limited store-specific fields to 30+ Shopify order fields
- **Tabbed Organization**: Clean separation between Advanced Field Mapping and Store-Specific Configuration
- **Improved User Experience**: Single location for all order data mapping needs
- **Mobile Responsive**: Optimized layout for all device sizes

#### 🔧 **Technical Implementation**
- **Enhanced OrderDataMapping Component**: 
  - Added tabbed interface with two main sections
  - Integrated StoreOrderMappingConfig interface and helper functions
  - Implemented comprehensive state management for both mapping approaches
  - Added store selection and configuration management
- **Settings Component Updates**:
  - Removed redundant StoreOrderMapping component
  - Added informational card directing users to unified mapping page
  - Updated page description to reflect changes
- **Separate Storage Systems**: 
  - `order-data-mappings` for advanced field mappings
  - `store-order-mapping-configs` for store-specific configurations

#### 📊 **Advanced Field Mapping Tab**
- **25+ Order Card Properties**: Complete mapping for all order display properties
- **30+ Shopify Fields**: Organized by categories (order, customer, line_items, shipping_address, tags, properties)
- **Advanced Transformations**: Date formatting, currency formatting, text transforms, custom logic
- **Priority Management**: Drag-and-drop functionality with visual priority indicators
- **Fallback Values**: Configurable fallback values for failed mappings

#### 🏪 **Store-Specific Configuration Tab**
- **Store Management**: Selection, configuration copying, reset/save functionality
- **Order ID Mapping**: Configurable field selection and formatting
- **Product Name Mapping**: Main product and variant handling
- **Date/Timeslot Mapping**: Regex pattern matching for delivery scheduling
- **Delivery Type Mapping**: Keyword-based delivery type detection
- **Customer Info Formatting**: Flexible customer information display options
- **Additional Properties**: Toggle-based order property inclusion

#### 🎨 **UI/UX Enhancements**
- **Tabbed Interface**: Clean separation of functionality with intuitive navigation
- **Conditional Layouts**: Mobile-responsive design with optimized spacing
- **Visual Indicators**: Status badges, priority numbers, and transformation type displays
- **Interactive Controls**: Enhanced drag-and-drop, toggle switches, and form controls
- **Comprehensive Documentation**: Built-in field reference and mapping guidance

#### 🔒 **Security & Access Control**
- **Admin-Only Access**: Restricted to admin users for configuration security
- **Route Protection**: Proper authentication checks for mapping access
- **Data Validation**: Comprehensive input validation and error handling

#### 🚀 **Performance & Scalability**
- **Optimized State Management**: Efficient handling of complex mapping configurations
- **Local Storage Optimization**: Separate storage keys for different mapping types
- **Scalable Architecture**: Support for multiple stores with individual configurations
- **Type Safety**: Complete TypeScript interfaces for all mapping structures

#### 🐛 **Bug Fixes**
- **TypeScript Compilation**: Resolved all compilation errors for clean deployment
- **Unused Imports**: Removed FileText and other unused imports
- **Function Cleanup**: Removed unused updateExcludeProperties and updateRemarksKeywords functions
- **Build Process**: Ensured successful `npm run check` execution

#### 📈 **Impact**
- **Unified Experience**: Single comprehensive interface for all order mapping needs
- **Enhanced Flexibility**: Access to significantly more Shopify fields for mapping
- **Improved Efficiency**: Streamlined workflow for order data configuration
- **Better Organization**: Clear separation of advanced and store-specific mapping approaches
- **Future-Proof Architecture**: Scalable foundation for additional mapping features

---

## [2.0.0-alpha.37] - 2024-12-19

### 🐛 **Critical Bug Fix: TypeScript Compilation Errors**

**FIXED**: TypeScript build errors preventing Railway deployment

#### 🚨 Issues Resolved
- **Unused Import**: Removed unused `React` import in OrderDataMapping component
- **Unused Type**: Removed unused `ShopifyOrderSource` type import
- **Unused Variables**: Removed unused `editingMapping` and `setEditingMapping` state variables
- **Build Failure**: Fixed TypeScript compilation errors causing deployment failures

#### 🔧 Technical Fixes
- **OrderDataMapping.tsx**: 
  - Changed `import React, { useState, useEffect }` to `import { useState, useEffect }`
  - Removed `ShopifyOrderSource` from type imports (not used in component)
  - Removed unused `editingMapping` state variables (reserved for future editing functionality)
- **Version Updates**: Updated to v2.0.0-alpha.37 across all files

#### 🚀 Deployment Status
- **TypeScript Compilation**: ✅ All errors resolved
- **Railway Deployment**: 🔄 Ready for successful deployment
- **Functionality**: ✅ Order Data Mapping system fully functional

---

## [2.0.0-alpha.36] - 2024-12-19

### 🎯 **Major Feature: Order Data Mapping System**

**REVERTED** from problematic alpha.35 smart detection features and implemented a comprehensive Order Data Mapping system as requested.

#### ✨ **New Features**
- **Order Data Mapping Interface**: Complete system for mapping Shopify order properties to Order Card display properties
- **Visual Mapping Configuration**: Drag-and-drop priority management with active/inactive toggles
- **Comprehensive Shopify Field Reference**: 25+ available Shopify order fields organized by category:
  - Order fields (ID, name, email, phone, dates, status, pricing, currency, notes, tags)
  - Customer fields (ID, first name, last name, email)
  - Line Items fields (title, variant, quantity, price, SKU)
  - Shipping Address fields (address lines, city, province, country, postal code)
  - Parsed Tags fields (date, timeslot, delivery type)
  - Line Item Properties (special instructions, delivery time)
- **Transformation Types**: Support for date formatting, currency formatting, text transforms, and custom logic
- **Fallback Values**: Configurable fallback values when mapping fails
- **Default Mappings**: Pre-configured essential mappings for immediate use
- **Admin-Only Access**: Restricted to admin users for security

#### 🔧 **Technical Implementation**
- **New TypeScript Interfaces**: `OrderDataMapping`, `OrderCardProperty`, `ShopifyOrderSource`, `ShopifyOrderField`
- **Navigation Integration**: Added "Order Data Mapping" to admin navigation with Database icon
- **Route Protection**: Admin-only route at `/order-data-mapping`
- **Local Storage Persistence**: Mappings saved to `order-data-mappings` localStorage key
- **Priority Management**: Drag-and-drop reordering with automatic priority updates

#### 🎨 **UI/UX Enhancements**
- **Modern Card-Based Interface**: Clean, organized mapping display
- **Color-Coded Status**: Green borders for active mappings, gray for inactive
- **Badge System**: Visual indicators for mapping status, priority, and transformation types
- **Responsive Design**: Mobile-friendly layout with proper spacing
- **Interactive Controls**: Toggle active/inactive, move up/down, delete mappings
- **Comprehensive Reference**: Built-in documentation of all available Shopify fields

#### 📋 **Order Card Properties Supported**
- Product Name, Product Variant, Customer Name, Customer Email, Customer Phone
- Delivery Date, Time Slot, Delivery Type, Total Price, Currency
- Order Status, Difficulty Level, Product Type, Special Instructions
- Product Customizations, Fulfillment Status, Financial Status
- Assigned Florist, Store, Shopify Order ID

#### 🔄 **Version Updates**
- Updated to version 2.0.0-alpha.36 across all files
- Reverted from problematic alpha.35 smart detection features
- Maintained stable alpha.34 base with new mapping system

#### 🚀 **Deployment Ready**
- Server running successfully on port 4321
- All TypeScript compilation issues resolved
- Navigation and routing properly configured
- Ready for Railway deployment

---

## [2.0.0-alpha.34] - 2024-12-19

### 🐛 Critical Bug Fix: SelectItem Validation

**FIXED**: White screen error caused by empty SelectItem values

#### 🚨 Problem Resolved
- **White Screen Crashes**: Fixed "A <Select.Item /> must have a value prop that is not an empty string" error
- **Production Stability**: Restored stable production environment at https://order-to-do-production.up.railway.app/
- **Settings Page**: Fixed settings page white screen issue

#### 🔧 Technical Fixes
- **MultiStoreWebhookManager.tsx**: 
  - Changed `<SelectItem value="" disabled>` to `<SelectItem value="no-stores-available" disabled>`
  - Added validation filter for availableStores to ensure no empty IDs
- **OrdersView.tsx**: Added validation filter for stores dropdown
- **ProductManagement.tsx**: Added validation filter for stores dropdown  
- **OrderCard.tsx**: Added validation filters for both florist assignment dropdowns

#### 🛡️ Data Validation
- **Store IDs**: All store selection dropdowns now filter out stores with empty or undefined IDs
- **Florist IDs**: All florist assignment dropdowns now filter out florists with empty or undefined IDs
- **Defensive Programming**: Added `.filter(item => item.id && item.id.trim() !== '')` to all dynamic SelectItem mappings

#### 🔄 Deployment Status
- **Local Testing**: ✅ Verified fix works locally
- **Production Ready**: ✅ Ready for Railway deployment
- **Backward Compatible**: ✅ No breaking changes to existing functionality

---

## [2.0.0-alpha.33-restored] - 2024-12-19

### 🔄 REVERT: Rollback to Stable Version

**REVERTED**: Rolled back from alpha.34 and alpha.35 to stable alpha.33 version

#### 🚨 Issues Resolved
- **White Screen Errors**: Fixed production white screen issues on settings page
- **SelectItem Validation**: Removed problematic SelectItem validation that caused crashes
- **Add-On Categorization**: Temporarily removed Advanced Add-On Categorization System
- **Production Stability**: Restored stable production environment

#### 🔄 Changes Reverted
- **alpha.35**: SelectItem validation filters (caused additional issues)
- **alpha.34**: Advanced Add-On Categorization System (introduced white screen problems)
- **Restored**: Stable alpha.33 with working core functionality

#### 📊 Production Status
- **URL**: https://order-to-do-production.up.railway.app/
- **Status**: Stable and functional
- **Authentication**: Server-side user accounts working
- **Core Features**: Order management, florist assignment, product management all functional

#### 🎯 Next Steps
- Investigate root cause of SelectItem validation issues
- Implement proper fix for empty value handling
- Re-implement Advanced Add-On Categorization System with proper testing
- Ensure thorough testing before future deployments

---

## [2.0.0-alpha.33] - 2024-12-28

### 🔐 MAJOR: Server-Side User Account Management System

**BREAKING CHANGE**: Complete authentication system overhaul with server-side user accounts

#### ✨ New Features
- **Server-Side Authentication**: JWT-based authentication with bcrypt password hashing
- **User Registration**: Admin-only user registration with role-based permissions
- **Profile Management**: Users can update their name, email, and password
- **User Administration**: Admins can view all users and deactivate accounts
- **Persistent Authentication**: Login state persists across browsers and devices
- **Secure Password Storage**: Passwords are hashed with bcrypt (salt rounds: 10)
- **Token-Based Sessions**: JWT tokens with 7-day expiration
- **Role-Based Access Control**: Admin and florist roles with appropriate permissions

#### 🔧 Technical Implementation
- **New Dependencies**: Added `bcrypt@^5.1.1` and `jsonwebtoken@^9.0.2`
- **Server Endpoints**: 
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration (admin only)
  - `GET /api/auth/profile` - Get user profile
  - `PUT /api/auth/profile` - Update user profile
  - `GET /api/users` - Get all users (admin only)
  - `PUT /api/users/:userId/deactivate` - Deactivate user (admin only)
  - `GET /api/user/data` - Get user's data
  - `POST /api/user/data` - Save user's data
  - `POST /api/user/data/:section` - Save specific data section

#### 🗃️ Data Storage
- **User Accounts**: Stored in `data/users.json` on server
- **User Data**: Individual files `data/user-{userId}.json` for each user's data
- **Default Users**: Auto-created on first server start
  - Admin: `admin@floralshop.com` / `admin123`
  - Florist: `maya@floralshop.com` / `password`

#### 🎨 UI Components
- **UserManagement Component**: Complete user management interface with tabs
  - All Users: View and manage all registered users
  - Register User: Admin-only user registration form
  - My Profile: User profile update with password change
- **Enhanced Login**: Updated with server-side authentication
- **Settings Integration**: User management added to admin settings

#### 🔒 Security Features
- **Password Requirements**: Minimum 6 characters
- **Token Validation**: Automatic token refresh and validation
- **CORS Support**: Development CORS headers for local testing
- **Input Validation**: Comprehensive form validation and error handling
- **Session Management**: Automatic logout on token expiration

#### 🐛 Credential Storage Issue Resolution
**FIXED**: Shopify credentials no longer disappear between browser windows
- **Root Cause**: Previously stored in browser localStorage (isolated per session)
- **Solution**: Server-side data persistence with user accounts
- **Benefit**: Credentials now persist across all devices and browsers

#### 📱 User Experience
- **Persistent Login**: Stay logged in across browser sessions
- **Cross-Device Sync**: Access your data from any device
- **Role-Based UI**: Different interfaces for admin vs florist users
- **Real-Time Feedback**: Toast notifications for all user actions
- **Password Visibility**: Toggle password visibility in forms
- **Form Validation**: Real-time validation with helpful error messages

#### 🔄 Migration Notes
- **Backward Compatibility**: Existing localStorage data preserved during transition
- **Automatic Setup**: Default users created automatically on server start
- **Data Migration**: Future versions will include data migration tools

### 🔧 Technical Details
- **Authentication Flow**: Login → JWT Token → Server Validation → Protected Routes
- **Data Architecture**: User-specific data files with centralized user management
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Development Support**: CORS enabled for local development
- **Production Ready**: Environment-based configuration with secure defaults

---

## [2.0.0-alpha.32] - 2024-12-28

### 🐛 Bug Fixes
- **FIXED: Timezone Date Picker Issue**: Selecting "14 June 2025" now correctly shows orders for that date
- **Root Cause**: `toISOString()` was converting local dates to UTC, causing day offset in different timezones
- **Solution**: Created `formatDateLocal()` function using `getFullYear()`, `getMonth()`, `getDate()` for timezone-safe formatting
- **Scope**: Fixed in OrdersView component date selection and ShopifyApiService order mapping
- **Impact**: Date picker now works correctly regardless of user's timezone

### 🔧 Technical Changes
- **New Utility Function**: `formatDateLocal(date: Date): string` for consistent local date formatting
- **Updated Components**: OrdersView date filtering logic updated
- **Updated Services**: ShopifyApiService fallback date mapping updated
- **Code Cleanup**: Eliminated all instances of `toISOString().split('T')[0]` pattern

---

## [2.0.0-alpha.31] - 2024-12-28

### 🐛 Bug Fixes
- **FIXED: Configuration Safety Error**: `TypeError: Cannot read properties of undefined (reading 'includes')`
- **Root Cause**: Configuration objects could be incomplete, causing array method errors
- **Solution**: Added comprehensive safety checks for all configuration arrays and properties
- **Affected Methods**: `extractCustomizations`, `extractDeliveryInfoFromTags`, and related configuration access

### 🔧 Technical Improvements
- **Enhanced Safety Checks**: Added fallback empty arrays for all configuration properties
- **Robust Error Handling**: Configuration validation with graceful degradation
- **Code Reliability**: Eliminated potential undefined property access throughout configuration system

---

## [2.0.0-alpha.30] - 2024-12-28

### 🐛 Critical Bug Fixes
- **FIXED: JavaScript Context Binding Issues**: `TypeError: Cannot read properties of undefined (reading 'extractDeliveryInfoFromTags')`
- **Root Cause**: Context binding issues in ShopifyApiService class when methods used as callbacks
- **Solution**: Added explicit method binding in constructor for all private methods
- **Enhanced Safety**: Added comprehensive safety checks with Array.isArray() validation and try-catch blocks

### 🔧 Technical Improvements
- **Method Binding**: All private methods now properly bound in constructor
- **Array Validation**: Added Array.isArray() checks before array operations
- **Error Handling**: Try-catch blocks around regex operations and property access
- **Configuration Safety**: Property existence checks before accessing configuration values

---

## [2.0.0-alpha.29] - 2024-12-28

### 🐛 Bug Fixes
- **FIXED: Context Binding Error**: `TypeError: Cannot read properties of undefined (reading 'extractDeliveryInfoFromTags')`
- **Root Cause**: Arrow function context binding issue in ShopifyApiService
- **Solution**: Added explicit method binding in constructor for proper context preservation

### 🔧 Technical Changes
- **Constructor Binding**: Added `this.mapShopifyOrderToLocal = this.mapShopifyOrderToLocal.bind(this);`
- **Method Context**: Ensured all private methods maintain proper `this` context when used as callbacks

---

## [2.0.0-alpha.28] - 2024-12-28

### 🐛 Bug Fixes
- **FIXED: Order Mapping Error**: `TypeError: Cannot read properties of undefined (reading 'extractDeliveryInfoFromTags')`
- **Root Cause**: Context binding issue when using `this.mapShopifyOrderToLocal` as callback in array map
- **Solution**: Changed to arrow function format for proper context binding

### 🔧 Technical Changes
- **Method Binding**: Updated `data.orders.map(this.mapShopifyOrderToLocal)` to use arrow function
- **Context Preservation**: Ensured `this` context is properly maintained in callback functions

---

## [2.0.0-alpha.27] - 2024-12-28

### ✨ Enhanced Multi-Store Order Sync System

#### 🔄 New Features
- **Dedicated Windflower Florist 2 Sync**: Added specific "Sync Windflower Florist 2 Orders" button with green theme
- **Universal Store Sync**: "Sync All Configured Stores" button for syncing all stores at once
- **Automatic Store Detection**: System automatically detects and creates stores based on domain/name matching
- **Enhanced Error Handling**: Specific guidance for different HTTP error codes (401, 403, 404, 429)

#### 🎨 UI Improvements
- **Color-Coded Buttons**: Green theme for Windflower Florist 2, blue for general sync
- **Real-Time Feedback**: Toast notifications for all sync operations
- **Error Guidance**: Helpful error messages with specific troubleshooting steps
- **Loading States**: Visual feedback during sync operations

#### 🔧 Technical Enhancements
- **Store Auto-Creation**: Automatically creates store entries if they don't exist
- **Domain Matching**: Intelligent matching of store domains (windflowerflorist.myshopify.com)
- **Error Classification**: Different handling for authentication, permission, and rate limit errors
- **Sync Status Tracking**: Detailed logging of sync operations and results

#### 🐛 Bug Fixes
- **Store Configuration**: Fixed issues with store-specific API configurations
- **Order Attribution**: Improved order-to-store mapping accuracy
- **Sync Reliability**: Enhanced error recovery and retry logic

---

## [2.0.0-alpha.26] - 2024-12-28

### 🚀 MAJOR: Complete URL Routing System Implementation

**BREAKING CHANGE**: Replaced tab-based navigation with proper React Router URL routing

#### ✨ New Features
- **React Router Integration**: Full React Router v7.6.2 implementation with proper URL routing
- **Protected Routes**: Role-based route protection with automatic redirects
- **Browser Navigation**: Full browser back/forward button support
- **URL-Based Navigation**: Direct URL access to specific pages (/orders, /analytics, /products, /settings)
- **Mobile-Responsive Design**: Optimized navigation for both desktop and mobile views

#### 🎨 UI/UX Improvements
- **NavLink Navigation**: Active state highlighting with visual feedback
- **Breadcrumb-Style Navigation**: Clear indication of current page
- **Mobile Navigation**: Compact navigation optimized for mobile screens
- **Responsive Design**: Adaptive layout based on screen size

#### 🔧 Technical Implementation
- **Route Structure**: 
  - `/login` - Public login page
  - `/orders` - Main orders view (default)
  - `/analytics` - Analytics dashboard
  - `/products` - Product management (admin only)
  - `/settings` - Settings panel (admin only)
- **Route Protection**: Automatic redirects based on authentication and role
- **Layout Wrapper**: Dashboard component wraps all protected routes
- **State Management**: Proper state preservation across route changes

#### 🐛 Bug Fixes
- **Navigation State**: Fixed navigation state persistence across page refreshes
- **Route Guards**: Proper authentication and authorization checks
- **Mobile View**: Fixed mobile navigation layout issues
- **URL Synchronization**: Ensured URL always reflects current application state

#### 🔄 Migration Notes
- **Breaking Change**: Old tab-based navigation completely replaced
- **URL Structure**: New URL structure requires users to bookmark new URLs
- **State Preservation**: All existing data and functionality preserved

---

## [2.0.0-alpha.25] - 2024-12-27

### 🔄 Data Persistence & Store Management Enhancements

#### ✨ New Features
- **Enhanced Data Persistence**: Improved localStorage management with version tracking
- **Store-Specific Order Mapping**: Configure how orders are mapped for each store
- **Multi-Store Webhook Management**: Advanced webhook configuration for multiple stores
- **Data Backup & Restore**: Complete backup and restore functionality
- **Store Color Coding**: Visual store identification with custom colors

#### 🔧 Technical Improvements
- **Data Version Control**: Automatic data migration system
- **Storage Safety**: Enhanced error handling for localStorage operations
- **Configuration Management**: Centralized configuration for store-specific settings
- **Webhook Validation**: Improved webhook registration and validation

#### 🎨 UI Enhancements
- **Store Indicators**: Visual store identification throughout the interface
- **Settings Organization**: Improved settings page layout and organization
- **Mobile Optimization**: Better mobile experience for settings and configuration

---

## [2.0.0-alpha.24] - 2024-12-27

### 🔄 Order Sync & Store Integration

#### ✨ New Features
- **Multi-Store Order Sync**: Sync orders from multiple Shopify stores
- **Store-Specific Configuration**: Individual API configurations per store
- **Enhanced Order Attribution**: Better tracking of which store orders come from
- **Webhook Management**: Improved webhook setup and management

#### 🐛 Bug Fixes
- **Order Duplication**: Fixed issues with duplicate orders during sync
- **Store Assignment**: Improved accuracy of order-to-store assignment
- **API Rate Limiting**: Better handling of Shopify API rate limits

---

## [2.0.0-alpha.23] - 2024-12-27

### 🎨 UI/UX Improvements

#### ✨ New Features
- **Mobile View Toggle**: Switch between desktop and mobile layouts
- **Responsive Design**: Improved mobile experience across all components
- **Visual Feedback**: Enhanced loading states and user feedback

#### 🔧 Technical Improvements
- **Component Optimization**: Improved component performance and rendering
- **State Management**: Better state management across components
- **Error Handling**: Enhanced error handling and user messaging

---

## [2.0.0-alpha.22] - 2024-12-27

### 🔄 Shopify Integration Enhancements

#### ✨ New Features
- **Advanced Order Mapping**: Improved order data extraction from Shopify
- **Custom Field Support**: Support for custom fields and metafields
- **Enhanced Product Sync**: Better product synchronization with Shopify

#### 🐛 Bug Fixes
- **Data Mapping**: Fixed issues with order and product data mapping
- **Sync Reliability**: Improved reliability of data synchronization
- **Error Recovery**: Better error recovery during sync operations

---

## [2.0.0-alpha.21] - 2024-12-26

### 🎯 Order Management Improvements

#### ✨ New Features
- **Advanced Filtering**: Enhanced order filtering capabilities
- **Bulk Operations**: Support for bulk order operations
- **Status Tracking**: Improved order status tracking and updates

#### 🔧 Technical Improvements
- **Performance**: Optimized order loading and rendering performance
- **Data Consistency**: Improved data consistency across components
- **Caching**: Better caching strategies for order data

---

## [2.0.0-alpha.20] - 2024-12-26

### 🔄 Foundation & Architecture

#### ✨ New Features
- **Core Architecture**: Established core application architecture
- **Component System**: Comprehensive component library
- **Data Layer**: Robust data management layer
- **Authentication**: Basic authentication system

#### 🎨 UI Framework
- **Design System**: Consistent design system implementation
- **Responsive Layout**: Mobile-first responsive design
- **Component Library**: Reusable UI component library

#### 🔧 Technical Foundation
- **TypeScript**: Full TypeScript implementation
- **Build System**: Optimized build and deployment pipeline
- **Development Tools**: Comprehensive development tooling

---

*For earlier versions and detailed technical documentation, please refer to the git commit history.*