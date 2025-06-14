import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { StoreProvider } from './contexts/StoreContext';
import type { User } from './types';
import { getAuthState, initializeStorage, refreshMockData } from './utils/storage';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize localStorage with mock data
    initializeStorage();
    
    // Force refresh with latest mock data (including 50 Windflower orders)
    refreshMockData();
    
    // Check if user is already logged in
    const authState = getAuthState();
    if (authState.isAuthenticated && authState.user) {
      setUser(authState.user);
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <StoreProvider defaultStoreId="store-1">
      <Dashboard user={user} onLogout={handleLogout} />
      <Toaster />
    </StoreProvider>
  );
}

export default App;