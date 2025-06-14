import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage functions for server-side use
function loadStores() {
  try {
    const data = readFileSync(join(__dirname, 'data', 'stores.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Could not load stores:', error.message);
    return [];
  }
}

function loadWebhookConfig() {
  try {
    const data = readFileSync(join(__dirname, 'data', 'webhook-config.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Could not load webhook config:', error.message);
    return { stores: [] };
  }
}

// User account storage functions
function ensureDataDirectory() {
  const dataDir = join(__dirname, 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

function loadUsers() {
  try {
    ensureDataDirectory();
    const data = readFileSync(join(__dirname, 'data', 'users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Could not load users:', error.message);
    return [];
  }
}

function saveUsers(users) {
  try {
    ensureDataDirectory();
    writeFileSync(join(__dirname, 'data', 'users.json'), JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Could not save users:', error.message);
    return false;
  }
}

function loadUserData(userId) {
  try {
    ensureDataDirectory();
    const data = readFileSync(join(__dirname, 'data', `user-${userId}.json`), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Could not load user data for ${userId}:`, error.message);
    return {
      orders: [],
      products: [],
      stores: [],
      preferences: {},
      shopifyConfigs: {}
    };
  }
}

function saveUserData(userId, userData) {
  try {
    ensureDataDirectory();
    writeFileSync(join(__dirname, 'data', `user-${userId}.json`), JSON.stringify(userData, null, 2));
    return true;
  } catch (error) {
    console.error(`Could not save user data for ${userId}:`, error.message);
    return false;
  }
}

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

const app = express();
const PORT = process.env.PORT || 4321;

console.log(`🚀 Starting server on port ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔐 Webhook secret configured: ${process.env.SHOPIFY_WEBHOOK_SECRET ? 'YES' : 'NO (using default)'}`);

// Basic middleware
app.use(express.json());

// CORS middleware for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Initialize default admin user if no users exist
function initializeDefaultUsers() {
  const users = loadUsers();
  if (users.length === 0) {
    console.log('🔧 No users found, creating default admin user...');
    const defaultAdmin = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@floralshop.com',
      role: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    const defaultFlorist = {
      id: 'florist-1',
      name: 'Maya Florist',
      email: 'maya@floralshop.com',
      role: 'florist',
      passwordHash: bcrypt.hashSync('password', 10),
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    saveUsers([defaultAdmin, defaultFlorist]);
    console.log('✅ Default users created');
    console.log('📧 Admin: admin@floralshop.com / admin123');
    console.log('📧 Florist: maya@floralshop.com / password');
  }
}

// Initialize default users on startup
initializeDefaultUsers();

// User Account Management Endpoints

// Register new user (admin only)
app.post('/api/auth/register', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can register new users' });
    }

    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'florist'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or florist' });
    }

    const users = loadUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = {
      id: `${role}-${Date.now()}`,
      name,
      email,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.push(newUser);
    
    if (saveUsers(users)) {
      // Initialize empty user data
      saveUserData(newUser.id, {
        orders: [],
        products: [],
        stores: [],
        preferences: {},
        shopifyConfigs: {}
      });

      res.json({ 
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
          isActive: newUser.isActive
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to save user' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = loadUsers();
    const user = users.find(u => u.email === email && u.isActive);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const users = loadUsers();
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required to change password' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Update other fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if new email is already taken
      if (users.find(u => u.email === email && u.id !== user.id)) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    user.updatedAt = new Date().toISOString();

    if (saveUsers(users)) {
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = loadUsers();
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      isActive: u.isActive
    }));

    res.json(safeUsers);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Deactivate user (admin only)
app.put('/api/users/:userId/deactivate', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    users[userIndex].isActive = false;
    users[userIndex].updatedAt = new Date().toISOString();

    if (saveUsers(users)) {
      res.json({ message: 'User deactivated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  } catch (error) {
    console.error('User deactivation error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// User Data Management Endpoints

// Get user's data (orders, stores, etc.)
app.get('/api/user/data', authenticateToken, (req, res) => {
  try {
    const userData = loadUserData(req.user.id);
    res.json(userData);
  } catch (error) {
    console.error('User data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Save user's data
app.post('/api/user/data', authenticateToken, (req, res) => {
  try {
    const userData = req.body;
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'User data saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save user data' });
    }
  } catch (error) {
    console.error('User data save error:', error);
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// Save specific user data section
app.post('/api/user/data/:section', authenticateToken, (req, res) => {
  try {
    const { section } = req.params;
    const sectionData = req.body;
    
    const userData = loadUserData(req.user.id);
    userData[section] = sectionData;
    userData.lastUpdated = new Date().toISOString();
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: `${section} data saved successfully` });
    } else {
      res.status(500).json({ error: `Failed to save ${section} data` });
    }
  } catch (error) {
    console.error(`User ${req.params.section} data save error:`, error);
    res.status(500).json({ error: `Failed to save ${req.params.section} data` });
  }
});

// ===== COMPREHENSIVE CONFIGURATION STORAGE ENDPOINTS =====

// Global Shopify Mapping Configuration Endpoints
app.get('/api/config/shopify-mapping', authenticateToken, (req, res) => {
  try {
    const userData = loadUserData(req.user.id);
    const config = userData.shopifyMappingConfig || {
      // Default global baseline configuration
      api: {
        accessToken: '',
        shopDomain: '',
        apiVersion: '2024-01',
        webhookSecret: '',
        autoSync: true,
        syncInterval: 60
      },
      dateSource: 'tags',
      dateTagPattern: '(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{2,4})',
      dateFormat: 'DD/MM/YYYY',
      timeslotSource: 'tags',
      timeslotTagPattern: '(\\d{1,2}):(\\d{2})-(\\d{1,2}):(\\d{2})',
      timeslotFormat: 'HH:MM-HH:MM',
      deliveryTypeSource: 'tags',
      deliveryTypeKeywords: {
        delivery: ['delivery', 'deliver'],
        collection: ['collection', 'pickup', 'collect'],
        express: ['express', 'urgent', 'rush']
      },
      instructionsSource: 'line_item_properties',
      instructionsPropertyName: 'Special Instructions',
      instructionsKeywords: ['instruction', 'note', 'special', 'request', 'preference'],
      customizationsSource: 'line_item_properties',
      excludeProperties: ['Delivery Time', 'Special Instructions', 'delivery', 'time', 'instruction', 'note', 'special'],
      customerNameFormat: 'first_last',
      includeCustomerPhone: true,
      includeCustomerEmail: true
    };
    
    res.json(config);
  } catch (error) {
    console.error('Shopify mapping config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Shopify mapping configuration' });
  }
});

app.post('/api/config/shopify-mapping', authenticateToken, (req, res) => {
  try {
    const config = req.body;
    const userData = loadUserData(req.user.id);
    
    userData.shopifyMappingConfig = {
      ...config,
      lastUpdated: new Date().toISOString()
    };
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'Shopify mapping configuration saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save Shopify mapping configuration' });
    }
  } catch (error) {
    console.error('Shopify mapping config save error:', error);
    res.status(500).json({ error: 'Failed to save Shopify mapping configuration' });
  }
});

// Store-Specific Order Mapping Configuration Endpoints
app.get('/api/config/store-order-mappings', authenticateToken, (req, res) => {
  try {
    const userData = loadUserData(req.user.id);
    const configs = userData.storeOrderMappingConfigs || {};
    res.json(configs);
  } catch (error) {
    console.error('Store order mapping configs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch store order mapping configurations' });
  }
});

app.post('/api/config/store-order-mappings', authenticateToken, (req, res) => {
  try {
    const configs = req.body;
    const userData = loadUserData(req.user.id);
    
    userData.storeOrderMappingConfigs = {
      ...configs,
      lastUpdated: new Date().toISOString()
    };
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'Store order mapping configurations saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save store order mapping configurations' });
    }
  } catch (error) {
    console.error('Store order mapping configs save error:', error);
    res.status(500).json({ error: 'Failed to save store order mapping configurations' });
  }
});

// Individual Store Configuration Endpoints
app.get('/api/config/store-order-mappings/:storeId', authenticateToken, (req, res) => {
  try {
    const { storeId } = req.params;
    const userData = loadUserData(req.user.id);
    const configs = userData.storeOrderMappingConfigs || {};
    const storeConfig = configs[storeId];
    
    if (storeConfig) {
      res.json(storeConfig);
    } else {
      res.status(404).json({ error: 'Store configuration not found' });
    }
  } catch (error) {
    console.error('Store config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch store configuration' });
  }
});

app.post('/api/config/store-order-mappings/:storeId', authenticateToken, (req, res) => {
  try {
    const { storeId } = req.params;
    const storeConfig = req.body;
    const userData = loadUserData(req.user.id);
    
    if (!userData.storeOrderMappingConfigs) {
      userData.storeOrderMappingConfigs = {};
    }
    
    userData.storeOrderMappingConfigs[storeId] = {
      ...storeConfig,
      storeId,
      lastUpdated: new Date().toISOString()
    };
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'Store configuration saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save store configuration' });
    }
  } catch (error) {
    console.error('Store config save error:', error);
    res.status(500).json({ error: 'Failed to save store configuration' });
  }
});

// Store Management Endpoints
app.get('/api/stores', authenticateToken, (req, res) => {
  try {
    const userData = loadUserData(req.user.id);
    const stores = userData.stores || [];
    res.json(stores);
  } catch (error) {
    console.error('Stores fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

app.post('/api/stores', authenticateToken, (req, res) => {
  try {
    const store = req.body;
    const userData = loadUserData(req.user.id);
    
    if (!userData.stores) {
      userData.stores = [];
    }
    
    // Add timestamps and ID if not provided
    const newStore = {
      ...store,
      id: store.id || `store-${Date.now()}`,
      createdAt: store.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    userData.stores.push(newStore);
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'Store created successfully', store: newStore });
    } else {
      res.status(500).json({ error: 'Failed to create store' });
    }
  } catch (error) {
    console.error('Store creation error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

app.put('/api/stores/:storeId', authenticateToken, (req, res) => {
  try {
    const { storeId } = req.params;
    const storeUpdates = req.body;
    const userData = loadUserData(req.user.id);
    
    if (!userData.stores) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const storeIndex = userData.stores.findIndex(s => s.id === storeId);
    if (storeIndex === -1) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    userData.stores[storeIndex] = {
      ...userData.stores[storeIndex],
      ...storeUpdates,
      id: storeId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'Store updated successfully', store: userData.stores[storeIndex] });
    } else {
      res.status(500).json({ error: 'Failed to update store' });
    }
  } catch (error) {
    console.error('Store update error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

app.delete('/api/stores/:storeId', authenticateToken, (req, res) => {
  try {
    const { storeId } = req.params;
    const userData = loadUserData(req.user.id);
    
    if (!userData.stores) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const storeIndex = userData.stores.findIndex(s => s.id === storeId);
    if (storeIndex === -1) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    userData.stores.splice(storeIndex, 1);
    
    // Also remove store-specific configurations
    if (userData.storeOrderMappingConfigs && userData.storeOrderMappingConfigs[storeId]) {
      delete userData.storeOrderMappingConfigs[storeId];
    }
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'Store deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete store' });
    }
  } catch (error) {
    console.error('Store deletion error:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

// Orders Management Endpoints
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const { storeId, date, status } = req.query;
    const userData = loadUserData(req.user.id);
    let orders = userData.orders || [];
    
    // Filter by store if specified
    if (storeId) {
      orders = orders.filter(order => order.storeId === storeId);
    }
    
    // Filter by date if specified
    if (date) {
      orders = orders.filter(order => order.date === date);
    }
    
    // Filter by status if specified
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const orders = req.body;
    const userData = loadUserData(req.user.id);
    
    if (!userData.orders) {
      userData.orders = [];
    }
    
    // Handle both single order and array of orders
    const ordersToAdd = Array.isArray(orders) ? orders : [orders];
    
    ordersToAdd.forEach(order => {
      // Add timestamps if not provided
      const newOrder = {
        ...order,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Check if order already exists (by shopifyId or id)
      const existingIndex = userData.orders.findIndex(o => 
        (o.shopifyId && o.shopifyId === newOrder.shopifyId) || 
        (o.id && o.id === newOrder.id)
      );
      
      if (existingIndex !== -1) {
        // Update existing order
        userData.orders[existingIndex] = newOrder;
      } else {
        // Add new order
        userData.orders.push(newOrder);
      }
    });
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ 
        message: `${ordersToAdd.length} order(s) saved successfully`,
        count: ordersToAdd.length
      });
    } else {
      res.status(500).json({ error: 'Failed to save orders' });
    }
  } catch (error) {
    console.error('Orders save error:', error);
    res.status(500).json({ error: 'Failed to save orders' });
  }
});

// Products Management Endpoints
app.get('/api/products', authenticateToken, (req, res) => {
  try {
    const { storeId } = req.query;
    const userData = loadUserData(req.user.id);
    let products = userData.products || [];
    
    // Filter by store if specified
    if (storeId) {
      products = products.filter(product => product.storeId === storeId);
    }
    
    res.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', authenticateToken, (req, res) => {
  try {
    const products = req.body;
    const userData = loadUserData(req.user.id);
    
    if (!userData.products) {
      userData.products = [];
    }
    
    // Handle both single product and array of products
    const productsToAdd = Array.isArray(products) ? products : [products];
    
    productsToAdd.forEach(product => {
      // Add timestamps if not provided
      const newProduct = {
        ...product,
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Check if product already exists (by shopifyId or id)
      const existingIndex = userData.products.findIndex(p => 
        (p.shopifyId && p.shopifyId === newProduct.shopifyId) || 
        (p.id && p.id === newProduct.id)
      );
      
      if (existingIndex !== -1) {
        // Update existing product
        userData.products[existingIndex] = newProduct;
      } else {
        // Add new product
        userData.products.push(newProduct);
      }
    });
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ 
        message: `${productsToAdd.length} product(s) saved successfully`,
        count: productsToAdd.length
      });
    } else {
      res.status(500).json({ error: 'Failed to save products' });
    }
  } catch (error) {
    console.error('Products save error:', error);
    res.status(500).json({ error: 'Failed to save products' });
  }
});

// User Preferences Endpoints
app.get('/api/preferences', authenticateToken, (req, res) => {
  try {
    const userData = loadUserData(req.user.id);
    const preferences = userData.preferences || {
      theme: 'light',
      notifications: true,
      autoSync: true,
      defaultView: 'dashboard',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    };
    
    res.json(preferences);
  } catch (error) {
    console.error('Preferences fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.post('/api/preferences', authenticateToken, (req, res) => {
  try {
    const preferences = req.body;
    const userData = loadUserData(req.user.id);
    
    userData.preferences = {
      ...userData.preferences,
      ...preferences,
      lastUpdated: new Date().toISOString()
    };
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ message: 'Preferences saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save preferences' });
    }
  } catch (error) {
    console.error('Preferences save error:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Session Management Endpoints
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  try {
    // Generate new token with extended expiry
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        role: req.user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Data Export/Import Endpoints
app.get('/api/export/all', authenticateToken, (req, res) => {
  try {
    const userData = loadUserData(req.user.id);
    
    // Create comprehensive export
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0-alpha.39',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      },
      data: {
        stores: userData.stores || [],
        orders: userData.orders || [],
        products: userData.products || [],
        preferences: userData.preferences || {},
        shopifyMappingConfig: userData.shopifyMappingConfig || {},
        storeOrderMappingConfigs: userData.storeOrderMappingConfigs || {}
      }
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.post('/api/import/all', authenticateToken, (req, res) => {
  try {
    const importData = req.body;
    
    if (!importData.data) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }
    
    const userData = loadUserData(req.user.id);
    
    // Merge imported data with existing data
    userData.stores = importData.data.stores || userData.stores || [];
    userData.orders = importData.data.orders || userData.orders || [];
    userData.products = importData.data.products || userData.products || [];
    userData.preferences = { ...userData.preferences, ...importData.data.preferences };
    userData.shopifyMappingConfig = importData.data.shopifyMappingConfig || userData.shopifyMappingConfig;
    userData.storeOrderMappingConfigs = importData.data.storeOrderMappingConfigs || userData.storeOrderMappingConfigs;
    userData.lastUpdated = new Date().toISOString();
    userData.importedAt = new Date().toISOString();
    
    if (saveUserData(req.user.id, userData)) {
      res.json({ 
        message: 'Data imported successfully',
        imported: {
          stores: userData.stores.length,
          orders: userData.orders.length,
          products: userData.products.length
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to import data' });
    }
  } catch (error) {
    console.error('Data import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// ===== END CONFIGURATION STORAGE ENDPOINTS =====

// Health check endpoint for Railway monitoring  
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-alpha.40',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Railway specific healthcheck (simple text response)
app.get('/healthz', (req, res) => {
  res.json({ 
    status: 'ok', 
          version: '2.0.0-alpha.40' 
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    webhook: {
      endpoint: '/api/webhooks/shopify',
      secretConfigured: !!process.env.SHOPIFY_WEBHOOK_SECRET
    },
    version: '2.0.0-alpha.40'
  });
});

// Middleware to get raw body for webhook verification (specific route only)
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

// Shopify webhook endpoint
app.post('/api/webhooks/shopify', (req, res) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    console.log(`📦 Webhook received: ${topic} from ${shopDomain}`);
    
    // Get webhook secret from environment or use default
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || 'default-webhook-secret';
    
    // Use Buffer for HMAC calculation, and parse body only after verification
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
        break;
        
      case 'orders/updated':
        console.log('🔄 Order updated:', webhookData.id);
        break;
        
      case 'orders/cancelled':
        console.log('❌ Order cancelled:', webhookData.id);
        break;
        
      case 'products/create':
        console.log('🆕 New product created:', webhookData.id);
        break;
        
      case 'products/update':
        console.log('🔄 Product updated:', webhookData.id);
        break;
        
      case 'products/delete':
        console.log('🗑️ Product deleted:', webhookData.id);
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

// Test endpoint to examine order structure
app.get('/api/test/order-structure', async (req, res) => {
  try {
    console.log('🔍 Testing order structure from Windflower Florist 2...');
    
    // Hardcoded values for testing - replace with your actual values
    const shopDomain = 'windflowerflorist.myshopify.com';
    const accessToken = req.query.token; // Pass token as query parameter for testing
    
    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token required',
        message: 'Please provide access token as query parameter: ?token=YOUR_TOKEN'
      });
    }
    
    // Make direct API call to get a single order
    const apiUrl = `https://${shopDomain}/admin/api/2024-01/orders.json?limit=1&status=any`;
    
    console.log(`📡 Fetching from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Shopify API Error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Shopify API Error',
        status: response.status,
        message: errorText
      });
    }
    
    const data = await response.json();
    console.log('✅ Raw Shopify Response received');
    
    if (!data.orders || data.orders.length === 0) {
      return res.json({
        message: 'No orders found',
        totalOrders: 0,
        rawResponse: data
      });
    }
    
    const firstOrder = data.orders[0];
    
    // Extract key fields for analysis
    const orderAnalysis = {
      orderId: firstOrder.id,
      orderName: firstOrder.name,
      createdAt: firstOrder.created_at,
      tags: firstOrder.tags,
      tagsArray: firstOrder.tags ? firstOrder.tags.split(',').map(tag => tag.trim()) : [],
      note: firstOrder.note,
      lineItems: firstOrder.line_items.map(item => ({
        id: item.id,
        title: item.title,
        variant_title: item.variant_title,
        properties: item.properties
      })),
      customer: {
        first_name: firstOrder.customer?.first_name,
        last_name: firstOrder.customer?.last_name,
        email: firstOrder.customer?.email
      },
      totalPrice: firstOrder.total_price,
      currency: firstOrder.currency,
      fulfillmentStatus: firstOrder.fulfillment_status,
      financialStatus: firstOrder.financial_status
    };
    
    res.json({
      message: 'Order structure analysis',
      store: {
        domain: shopDomain
      },
      orderAnalysis,
      // Include full order for complete analysis (be careful with sensitive data)
      fullOrderSample: {
        ...firstOrder,
        // Remove sensitive customer data for safety
        customer: {
          first_name: firstOrder.customer?.first_name,
          last_name: firstOrder.customer?.last_name
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in test endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Serve static files from dist directory with error handling
try {
  app.use(express.static(join(__dirname, 'dist'), {
    fallthrough: true,
    maxAge: '1d'
  }));
} catch (error) {
  console.warn('⚠️  Could not serve static files from dist directory:', error.message);
}

// SPA catch-all - serve React app for all non-API routes
app.use((req, res) => {
  // Handle API routes not found
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  
  // Serve React app for all other routes
  try {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
  } catch (error) {
    console.error('❌ Error serving index.html:', error);
    res.status(500).json({ 
      error: 'Application not available',
      message: 'Please ensure the application is properly built'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port: ${PORT}`);
  console.log(`🔗 Webhook endpoint: ${process.env.NODE_ENV === 'production' ? 'https://[your-domain]' : 'http://localhost:' + PORT}/api/webhooks/shopify`);
  console.log(`💚 Health check endpoints:`);
  console.log(`   - /health (detailed)`);
  console.log(`   - /healthz (simple)`);
  console.log(`🌐 App available at: ${process.env.NODE_ENV === 'production' ? 'https://[your-domain]' : 'http://localhost:' + PORT}/`);
}).on('error', (error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
}); 