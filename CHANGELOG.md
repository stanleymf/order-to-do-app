# Changelog

All notable changes to the Order To-Do App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - Store, Product, Order, and User types with storeId fields
  - FloristStats with store-specific breakdowns
  - Complete type safety throughout the application

- **Context-Based State Management**:
  - Global store selection state
  - Automatic data filtering by current store
  - Efficient re-rendering with context optimization
  - Error boundaries for failed store operations

#### **📊 Analytics & Reporting**
- **Store-Specific Analytics**: Updated Analytics component to use store context
  - Current store filtering for all metrics
  - Store comparison views for all stores
  - Performance metrics by store
  - Florist performance breakdown by store

- **Data Visualization**:
  - Store-specific color coding
  - Visual store indicators in all views
  - Responsive analytics dashboard
  - Mobile-optimized analytics display

#### **🔄 Data Flow & Performance**
- **Efficient Data Filtering**: Store-specific operations at the service layer
- **Minimal Re-renders**: Context optimization for better performance
- **Lazy Loading**: Store-specific data loaded on demand
- **Error Handling**: Graceful fallbacks for missing stores

#### **📱 Mobile Experience**
- **Compact Store Indicator**: Mobile-optimized store display
- **Responsive Design**: All components adapt to screen size
- **Touch-Friendly**: Optimized for mobile interaction
- **Performance**: Efficient mobile rendering

#### **🔒 Security & Validation**
- **Data Validation**: Store ID validation throughout the app
- **Error Boundaries**: Graceful error handling
- **Type Safety**: Complete TypeScript coverage
- **Backward Compatibility**: Existing functionality preserved

#### **🚀 Ready for Phase 2**
- **Foundation Complete**: All data structures support multi-store
- **UI Framework**: Store selection and display ready
- **Context System**: Global state management implemented
- **Analytics Ready**: Store-specific reporting framework

---

## [2.0.0-alpha.1] - 2025-06-13

### 🚀 **Major Upgrade Planning: Multi-Store Architecture**

#### **Planning & Design**
- **Multi-Store Architecture**: Complete redesign for handling multiple Shopify stores
- **Store Management System**: Individual store configurations and isolation
- **Enhanced Order Management**: Multi-store order handling with unified interface
- **Scalable Webhook Management**: Per-store webhook registration and monitoring

#### **Architecture Changes**
- **Store Configuration**: Each store has its own API credentials and settings
- **Order Structure**: Enhanced with storeId and storeName for proper isolation
- **Settings Evolution**: Split into Store Management and Global Settings
- **Webhook Management**: Multi-store webhook registration and monitoring

#### **UI/UX Enhancements**
- **Store Management Interface**: Add, edit, remove stores with individual configurations
- **Enhanced Order Tab**: Store tabs, unified view, and store-specific actions
- **Store Indicators**: Color-coded store identification throughout the app
- **Bulk Operations**: Sync all stores, manage all webhooks from single interface

#### **Technical Foundation**
- **Type Definitions**: Updated for multi-store data structures
- **Migration Strategy**: Backward compatibility with existing single-store setup
- **Performance Optimization**: Store-specific operations and caching
- **Security Enhancement**: Store-specific API credentials and webhook secrets

#### **Implementation Plan**
- **Phase 1**: Data structure migration and type updates
- **Phase 2**: Store management interface development
- **Phase 3**: Enhanced order management with multi-store support
- **Phase 4**: Advanced webhook management for multiple stores

#### **Benefits**
- **Scalability**: Handle unlimited Shopify stores
- **Flexibility**: Different configurations per store
- **Efficiency**: Unified management interface
- **Growth**: Easy addition of new stores
- **Isolation**: Store-specific data and settings
- **Performance**: Optimized per-store operations

---

**Note**: This is an alpha release for planning and design. The full multi-store implementation will be developed in subsequent versions.

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

## [1.0.35] - 2025-06-13

### Changed
- **Header Title**: Updated top-left header title from "Dashboard"/"Florist Dashboard" to "Order To-Do"
  - **Consistent Branding**: Both mobile and desktop views now display "Order To-Do"
  - **Brand Identity**: Aligns with the application's purpose and branding
  - **User Experience**: Clearer identification of the application in the header

### Enhanced
- **Visual Consistency**: Header title now matches the application's name and purpose
- **Professional Appearance**: More cohesive branding throughout the application

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

### Changed
- **Real-Time Order Fetching**: Replaced manual sync buttons with automatic order fetching
  - **Auto-Fetch on Load**: Orders are automatically fetched when the component loads
  - **Auto-Refresh**: Orders are refreshed every 5 minutes automatically
  - **Date-Based Fetching**: Orders are re-fetched when the selected date changes
  - **Background Sync**: All stores are synced in the background without user intervention
  - **Error Handling**: Individual store failures don't prevent other stores from syncing

### Removed
- **Manual Sync Buttons**: Removed individual store sync buttons from the UI
- **Manual Sync State**: Removed `isSyncingOrders` state management
- **Manual Sync Function**: Removed `handleShopifyOrderSync` function

### Added
- **Loading Indicator**: Added "Auto-syncing..." indicator in the header during fetch operations
- **Toast Notifications**: Success/error notifications for auto-sync operations
- **Automatic Updates**: Orders are automatically updated in the UI after successful sync

### Enhanced
- **User Experience**: No manual intervention required for order synchronization
- **Real-Time Data**: Orders are always up-to-date with the latest Shopify data
- **Seamless Operation**: Users can focus on order management without worrying about data sync

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
  - Hover effects for better user interaction feedback
  - Maintains existing dropdown status filter functionality

### Enhanced
- **Improved User Experience**: 
  - More intuitive filtering workflow
  - Quick access to status-based filtering
  - Visual state indication for active filters
  - Smooth transitions and hover effects

## [1.0.12] - 2025-06-13

### Changed
- **Simplified Batch Assign UI**: Moved batch assign button to a more logical position
  - Removed batch mode toggle from header area
  - Positioned batch assign button below stats overview and before order cards
  - More intuitive placement that follows natural workflow
  - Cleaner header area without additional controls 

## [1.0.11] - 2025-06-13

### Added
- **Batch Assign Functionality**: Restored batch assignment features that were accidentally removed during TypeScript cleanup
  - Batch mode toggle button in the header
  - Batch mode controls panel with selection management
  - "Select All" and "Clear" selection buttons
  - "Assign to Me" and "Unassign All" batch operations
  - Toast notifications for batch operations
  - Checkbox selection in order cards when batch mode is active
- **Enhanced User Experience**: 
  - Visual feedback for batch mode with blue-themed control panel
  - Disabled state for batch action buttons when no orders are selected
  - Mobile-responsive batch mode controls

### Fixed
- Restored missing batch assign functions: `toggleBatchMode`, `selectAllOrders`, `clearSelection`, `batchAssignToMe`, `batchUnassign`
- Fixed missing `assignOrder` import in OrdersView component
- Ensured proper state management for batch mode and order selection 

## [1.0.10] - 2025-06-13

### Added
- **Toast Notifications**: Added popup notifications for order assignments and completions
  - Users now receive popup notifications when:
    - Assigning an order to themselves
    - Assigning/unassigning orders (admin)
    - Completing or uncompleting orders
  - Notifications include order ID, product name, and timeslot details

### Fixed
- Fixed TypeScript build errors by removing unused imports and variables
- Ensured version history is updated with every change

## [1.0.9] - 2025-06-13

### Fixed
- Fixed: Order card no longer collapses when typing in the product customizations textarea in desktop view (robust event forwarding and logic)
- Ensured version history is updated with every change

## [1.0.8] - 2025-06-13

### Fixed
- Fixed: Order card no longer collapses when typing in the product customizations textarea in desktop view
- Versioning is now updated with every change

## [1.0.7] - 2025-06-13

### Fixed
- Further improved mobile responsiveness for iPhone 15:
  - Reduced header elements size and spacing
  - Optimized filtering controls layout and text size
  - Adjusted stat cards padding and icon sizes
  - Fixed calendar popup sizing on mobile
  - Improved overall spacing and touch targets

## [1.0.6] - 2025-06-13

### Fixed
- Improved mobile responsiveness for iPhone and other mobile devices:
  - Fixed squeezed header content and optimized layout
  - Prevented stat cards from being cut off
  - Fixed filtering controls going off-screen
  - Adjusted text and component sizes for better mobile visibility

## [1.0.5] - 2025-06-13

### Fixed
- **Fixed Filtering Dropdowns Overflow**
  - Wrapped filtering controls in a Card component for better visual containment
  - Added proper mobile constraints to prevent dropdowns from extending outside viewport
  - Improved mobile layout with consistent padding and spacing
  - Enhanced visual separation between filtering controls and other content

### Enhanced
- **Better Visual Organization**
  - Filtering controls now have a clear visual boundary
  - Improved mobile user experience with contained dropdowns
  - Better spacing and layout consistency
  - Enhanced accessibility with proper container structure

## [1.0.4] - 2025-01-13

### Fixed
- **Fixed Header Menu Layout**
  - Logout container no longer goes off screen on mobile
  - Adjusted flex layout with proper flex-shrink properties
  - Reduced button sizes and spacing for mobile
  - Added truncation for long text elements

- **Fixed Filtering Dropdowns**
  - Filtering dropdowns now stack vertically on mobile
  - Added full width to dropdown containers
  - Improved spacing and layout for mobile screens
  - Prevented dropdowns from extending off screen

- **Fixed Breakdown Numbers (Stats Cards)**
  - Stats cards now display in 2x2 grid on mobile instead of 4 columns
  - Reduced padding and icon sizes for mobile
  - Added text truncation to prevent overflow
  - Improved responsive layout for better mobile viewing

### Enhanced
- **Better Mobile Responsiveness**
  - All UI elements now properly contained within mobile viewport
  - Improved touch targets and spacing
  - Better text sizing and readability on mobile
  - Consistent mobile-first design approach

## [1.0.3] - 2025-01-13

### Enhanced
- **OrderCards Now Collapsed by Default**
  - All OrderCards now start in collapsed state for better mobile experience
  - Users can click to expand when they need to see full details
  - Reduces initial visual clutter and improves page load performance
  - Maintains ultra-compact view showing only product title, variant, and checkbox

- **Better Initial User Experience**
  - Clean, uncluttered order list on first load
  - Faster scanning through multiple orders
  - Progressive disclosure of information as needed
  - Consistent behavior across all order cards

## [1.0.2] - 2025-01-13

### Enhanced
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

### Fixed
- Fixed TypeScript compilation errors
- Improved responsive design for collapsed state

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