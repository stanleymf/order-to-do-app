# Changelog

All notable changes to the Order To-Do App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-06-13

### Fixed
- Further improved mobile responsiveness for iPhone 15:
  - Reduced header elements size and spacing
  - Optimized filtering controls layout and text size
  - Adjusted stat cards padding and icon sizes
  - Fixed calendar popup sizing on mobile
  - Improved overall spacing and touch targets

## [1.0.5] - 2025-06-13

### Fixed
- Improved mobile responsiveness for iPhone and other mobile devices:
  - Fixed squeezed header content and optimized layout
  - Prevented stat cards from being cut off
  - Fixed filtering controls going off-screen
  - Adjusted text and component sizes for better mobile visibility

## [1.0.4] - 2025-01-13

### 🎯 Enhanced Filtering Dropdown Container

#### 🐛 Bug Fixes
- **Fixed Filtering Dropdowns Overflow**
  - Wrapped filtering controls in a Card component for better visual containment
  - Added proper mobile constraints to prevent dropdowns from extending outside viewport
  - Improved mobile layout with consistent padding and spacing
  - Enhanced visual separation between filtering controls and other content

#### ✨ Improvements
- **Better Visual Organization**
  - Filtering controls now have a clear visual boundary
  - Improved mobile user experience with contained dropdowns
  - Better spacing and layout consistency
  - Enhanced accessibility with proper container structure

---

## [1.0.3] - 2025-01-13

### 🎯 Mobile Formatting Fixes

#### 🐛 Bug Fixes
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

#### ✨ Improvements
- **Better Mobile Responsiveness**
  - All UI elements now properly contained within mobile viewport
  - Improved touch targets and spacing
  - Better text sizing and readability on mobile
  - Consistent mobile-first design approach

---

## [1.0.2] - 2025-01-13

### 🎯 Default Collapsed State

#### ✨ Improvements
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

---

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

## [1.0.7] - 2025-06-13

### 🐛 Bug Fixes
- Fixed: Order card no longer collapses when typing in the product customizations textarea in desktop view.
- Versioning is now updated with every change.

## [1.0.8] - 2025-06-13

### 🐛 Bug Fixes
- Fixed: Order card no longer collapses when typing in the product customizations textarea in desktop view (robust event forwarding and logic).
- Ensured version history is updated with every change.

## [1.0.9] - 2025-06-13

### ✨ New Features
- Added toast notifications for order assignments and completions
- Users now receive popup notifications when:
  - Assigning an order to themselves
  - Assigning/unassigning orders (admin)
  - Completing or uncompleting orders
- Notifications include order ID, product name, and timeslot details

### 🐛 Bug Fixes
- Fixed TypeScript build errors by removing unused imports and variables
- Ensured version history is updated with every change

## [1.0.10] - 2025-06-13

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

## [1.0.11] - 2025-06-13

### Changed
- **Simplified Batch Assign UI**: Moved batch assign button to a more logical position
  - Removed batch mode toggle from header area
  - Positioned batch assign button below stats overview and before order cards
  - More intuitive placement that follows natural workflow
  - Cleaner header area without additional controls 

## [1.0.12] - 2025-06-13

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

## [1.0.13] - 2025-06-13

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

## [1.0.14] - 2025-06-13

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

## [1.0.15] - 2025-06-13

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

## [1.0.16] - 2025-06-13

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

## [1.0.17] - 2025-06-13

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

## [1.0.16] - 2025-06-13 