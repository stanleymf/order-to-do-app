# 🛍️ Shopify Order Sync Testing Guide

## 📋 Overview

This guide explains how to test the Shopify order sync functionality and how orders from Shopify map to individual order cards in the Florist Order Management App.

## 🔧 Setup Requirements

### 1. **Shopify Store Access**
- **Admin Access**: You need admin access to your Shopify store
- **API Access**: Private app or custom app with order read permissions
- **Access Token**: API access token for authentication

### 2. **Required Shopify Permissions**
```
- `read_orders` - Read order information
- `read_products` - Read product information (for mapping)
- `read_customers` - Read customer information
```

### 3. **Store Configuration**
Update your store configuration in the app:
```typescript
// In your store configuration
{
  id: 'your-store-id',
  name: 'Your Store Name',
  domain: 'your-store.myshopify.com', // Your Shopify domain
  color: '#FF6B6B'
}
```

## 🎯 How Order Data Maps to Order Cards

### **Shopify Order → Order Card Mapping**

| **Shopify Field** | **Order Card Field** | **Extraction Method** |
|-------------------|----------------------|----------------------|
| `order.name` | `Order ID` | `#1001` → `1001` |
| `line_items[0].title` | `Product Name` | Direct mapping |
| `line_items[0].variant_title` | `Product Variant` | Direct mapping |
| `order.tags` | `Timeslot` | Tag: `"9:00 AM - 2:00 PM"` |
| `order.tags` | `Date` | Tag: `"06/13/2025"` or `"13/06/25"` |
| `order.tags` | `Delivery Type` | Tag: `"delivery"`, `"collection"`, `"express"` |
| `line_items[0].properties` | `Remarks` | Property: "Special Instructions" |
| `order.note` | `Remarks` | Keywords: instruction, note, special |
| `line_items[0].properties` | `Customizations` | Other properties |
| `order.customer` | `Customer Info` | Name, email, phone |

### **Smart Data Extraction from Tags**

#### **Date Extraction from Tags:**
- **Format**: `"13/06/2025"` → `"2025-06-13"` (DD/MM/YYYY)
- **Alternative**: `"13/06/25"` → `"2025-06-13"` (DD/MM/YY)
- **Alternative**: `"13-06-2025"` → `"2025-06-13"` (DD-MM-YYYY)
- **Note**: All dates are interpreted as DD/MM/YYYY format regardless of input format

#### **Timeslot Extraction from Tags:**
- **Primary Format**: `"09:00-11:00"` → `"9:00 AM - 11:00 AM"` (HH:MM-HH:MM)
- **Alternative**: `"9:00 AM - 2:00 PM"` → `"9:00 AM - 2:00 PM"` (with AM/PM)
- **Alternative**: `"9AM - 2PM"` → `"9 AM - 2 PM"` (short format)
- **Note**: 24-hour format (HH:MM-HH:MM) is automatically converted to 12-hour format with AM/PM

#### **Delivery Type Extraction from Tags:**
- **Delivery**: `"delivery"`, `"deliver"` → `"Delivery"`
- **Collection**: `"collection"`, `"pickup"`, `"collect"` → `"Collection"`
- **Express**: `"express"`, `"urgent"`, `"rush"` → `"Express"`

#### **Instructions Extraction Priority:**
1. **Line Item Property**: `"Special Instructions": "Handle with care"`
2. **Order Note**: Lines containing keywords (instruction, note, special, request)
3. **Default**: Empty string

#### **Customizations Extraction:**
- All line item properties except delivery time and instructions
- Format: `"Color: Red, Size: Large"`

## 🧪 Testing Steps

### **Step 1: Create Test Orders in Shopify**

#### **Test Order 1: Basic Order**
```json
{
  "order": {
    "name": "#1001",
    "tags": "delivery, 13/06/2025, 09:00-11:00",
    "line_items": [{
      "title": "Rose Bouquet",
      "variant_title": "Red Roses",
      "properties": [
        {"name": "Special Instructions", "value": "Handle with extra care"}
      ]
    }],
    "note": "Customer prefers morning delivery",
    "customer": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  }
}
```

#### **Test Order 2: Complex Order**
```json
{
  "order": {
    "name": "#1002",
    "tags": "delivery, 13/06/2025, 14:00-18:00",
    "line_items": [{
      "title": "Mixed Flower Arrangement",
      "variant_title": "Premium Collection",
      "properties": [
        {"name": "Color Preference", "value": "Pink and White"},
        {"name": "Vase Style", "value": "Modern Glass"}
      ]
    }],
    "note": "Special request: Include care instructions\nFragile items - handle carefully",
    "customer": {
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com"
    }
  }
}
```

#### **Test Order 3: Express Order**
```json
{
  "order": {
    "name": "#1003",
    "tags": "express, 13/06/2025, 18:00-20:00",
    "line_items": [{
      "title": "Sunflower Bundle",
      "variant_title": "Summer Collection"
    }],
    "note": "Special instructions: Keep in cool place",
    "customer": {
      "first_name": "Mike",
      "last_name": "Johnson",
      "email": "mike@example.com"
    }
  }
}
```

#### **Test Order 4: Collection Order**
```json
{
  "order": {
    "name": "#1004",
    "tags": "collection, 14/06/2025, 10:00-12:00",
    "line_items": [{
      "title": "Tulip Arrangement",
      "variant_title": "Spring Collection"
    }],
    "note": "Customer will collect in person",
    "customer": {
      "first_name": "Sarah",
      "last_name": "Wilson",
      "email": "sarah@example.com"
    }
  }
}
```

### **Step 2: Configure Access Token**

#### **Option A: Private App (Recommended for Testing)**
1. Go to Shopify Admin → Apps → Manage private apps
2. Create a new private app
3. Enable required permissions:
   - `read_orders`
   - `read_products`
   - `read_customers`
4. Copy the API access token

#### **Option B: Custom App**
1. Create a custom app in Shopify Partner Dashboard
2. Configure OAuth scopes
3. Generate access token

### **Step 3: Update Access Token in Code**

```typescript
// In src/components/OrdersView.tsx
const handleShopifyOrderSync = async (store: Store) => {
  // Replace with your actual access token
  const accessToken = 'your-actual-shopify-access-token';
  // ... rest of the function
};
```

### **Step 4: Test Order Sync**

1. **Navigate to Orders Dashboard**
2. **Click "Sync [Store Name] Orders"**
3. **Verify Results**:
   - Orders appear in the dashboard
   - Timeslots are correctly extracted
   - Instructions are properly mapped
   - Customer information is included

## 🔍 Expected Results

### **Order Card Display**
- **Order ID**: `1001`, `1002`, `1003`, `1004`
- **Product Name**: `Rose Bouquet`, `Mixed Flower Arrangement`, `Sunflower Bundle`, `Tulip Arrangement`
- **Timeslot**: `9:00 AM - 11:00 AM`, `2:00 PM - 6:00 PM`, `6:00 PM - 8:00 PM`, `10:00 AM - 12:00 PM`
- **Delivery Type**: `Delivery` (green), `Delivery` (green), `Express` (red), `Collection` (blue)
- **Remarks**: `Handle with extra care`, `Special request: Include care instructions`, `Keep in cool place`, `Customer will collect in person`
- **Customizations**: `Color: Pink and White, Vase Style: Modern Glass` (for Order 2)

### **Sorting Behavior**
Orders will be sorted according to the 5-level hierarchy:
1. **Florist Assignment**: All unassigned (pending)
2. **Timeslot**: Earlier times first
3. **Product Name**: Alphabetical order
4. **Difficulty**: Based on product labels (default: Medium)
5. **Product Type**: Based on product labels (default: Bouquet)

## 🚨 Troubleshooting

### **Common Issues**

#### **1. "Shopify API error: 401 Unauthorized"**
- **Solution**: Check your access token is correct and has proper permissions

#### **2. "No orders found"**
- **Solution**: 
  - Verify orders exist in Shopify for the selected date
  - Check order status (only "open" orders are fetched by default)
  - Ensure store domain is correct

#### **3. "Timeslot not extracted"**
- **Solution**: 
  - Use order tag: `"09:00-11:00"` (HH:MM-HH:MM format)
  - Or alternative format: `"9:00 AM - 2:00 PM"` (with AM/PM)
  - Or alternative format: `"9AM - 2PM"` (short format)
  - **Note**: 24-hour format is automatically converted to 12-hour format with AM/PM

#### **4. "Date not extracted"**
- **Solution**: 
  - Use order tag: `"13/06/2025"` (DD/MM/YYYY format)
  - Or alternative format: `"13/06/25"` (DD/MM/YY format)
  - Or alternative format: `"13-06-2025"` (DD-MM-YYYY format)
  - **Important**: All dates are interpreted as DD/MM/YYYY format

#### **5. "Delivery type not showing"**
- **Solution**:
  - Use order tag: `"delivery"`, `"collection"`, or `"express"`
  - Or alternative keywords: `"pickup"`, `"urgent"`, `"rush"`

#### **6. "Instructions not showing"**
- **Solution**:
  - Use line item property: `"Special Instructions": "Your instructions"`
  - Or include keywords in order note: `"Special request: ..."`

### **Debug Mode**
Enable console logging to see extraction details:
```typescript
// In browser console
localStorage.setItem('debug-shopify-sync', 'true');
```

## 📊 Data Flow Summary

```
Shopify Order → API Fetch → Data Mapping → Local Storage → Order Cards
     ↓              ↓           ↓            ↓            ↓
  Raw Data    →  Parsed    →  Mapped    →  Stored    →  Displayed
  (JSON)      →  (Objects) →  (Order)   →  (Local)   →  (UI)
```

## 🎯 Next Steps

1. **Test with Real Orders**: Create actual orders in your Shopify store
2. **Customize Extraction**: Modify regex patterns for your specific needs
3. **Add Webhooks**: Set up real-time order updates
4. **Enhance Mapping**: Add more sophisticated data extraction rules

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Shopify API permissions
3. Test with simple orders first
4. Review the data mapping logic in `src/utils/shopifyApi.ts` 