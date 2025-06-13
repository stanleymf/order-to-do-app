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

## [1.0.12] - 2025-06-13 