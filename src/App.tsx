import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { OrdersView } from './components/OrdersView';
import { Analytics } from './components/Analytics';
import { ProductManagement } from './components/ProductManagement';
import { Settings } from './components/Settings';
import { Toaster } from './components/ui/sonner';
import { StoreProvider } from './contexts/StoreContext';
import type { User } from './types';
import { getAuthState, initializeStorage } from './utils/storage';

// Protected Route Component
function ProtectedRoute({ children, user, requiredRole }: { 
  children: React.ReactNode; 
  user: User | null; 
  requiredRole?: 'admin' | 'florist';
}) {
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/orders" replace />;
  }
  
  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children, user }: { children: React.ReactNode; user: User | null }) {
  if (user) {
    return <Navigate to="/orders" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize localStorage with mock data ONLY if no data exists
    // This preserves user data on refresh
    initializeStorage();
    
    // Check if user is already logged in
    const authState = getAuthState();
    if (authState.isAuthenticated && authState.user) {
      setUser(authState.user);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreProvider defaultStoreId="store-1">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute user={user}>
              <Login onLogin={handleLogin} />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes - Wrapped in Dashboard Layout */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute user={user}>
              <Dashboard user={user!} onLogout={handleLogout}>
                <Routes>
                  {/* Default redirect to orders */}
                  <Route path="/" element={<Navigate to="/orders" replace />} />
                  
                  {/* Main application routes */}
                  <Route path="/orders" element={<OrdersView currentUser={user!} />} />
                  <Route path="/analytics" element={<Analytics />} />
                  
                  {/* Admin-only routes */}
                  <Route 
                    path="/products" 
                    element={
                      <ProtectedRoute user={user} requiredRole="admin">
                        <ProductManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute user={user} requiredRole="admin">
                        <Settings currentUser={user!} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Catch-all redirect to orders */}
                  <Route path="*" element={<Navigate to="/orders" replace />} />
                </Routes>
              </Dashboard>
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Toaster />
    </StoreProvider>
  );
}

export default App;