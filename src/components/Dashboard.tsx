import { useState, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, BarChart3, Package, Smartphone, Monitor, Settings } from 'lucide-react';
import StoreIndicator from './StoreIndicator';
import type { User } from '../types';
import { AuthService } from '../utils/authService';
import { NavLink, useLocation } from 'react-router-dom';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

// Mobile View Context
interface MobileViewContextType {
  isMobileView: boolean;
  toggleMobileView: () => void;
}

const MobileViewContext = createContext<MobileViewContextType>({
  isMobileView: false,
  toggleMobileView: () => {},
});

export const useMobileView = () => useContext(MobileViewContext);

export function Dashboard({ user, onLogout, children }: DashboardProps) {
  const [isMobileView, setIsMobileView] = useState(false);
  const location = useLocation();

  const toggleMobileView = () => {
    setIsMobileView(!isMobileView);
  };

  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };

  // Get current page title based on location
  const getCurrentPageTitle = () => {
    switch (location.pathname) {
      case '/orders':
        return 'Orders';
      case '/analytics':
        return 'Analytics';
      case '/products':
        return 'Products';
      case '/settings':
        return 'Settings';
      default:
        return 'Order To-Do';
    }
  };

  return (
    <MobileViewContext.Provider value={{ isMobileView, toggleMobileView }}>
      <div className={`min-h-screen bg-gray-50 ${isMobileView ? 'max-w-[393px] mx-auto border-x-4 border-gray-400 shadow-2xl' : ''}`}>
        <header className="bg-white shadow-sm border-b">
          <div className={`mx-auto ${isMobileView ? 'px-1' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
            <div className={`flex justify-between items-center h-16 ${isMobileView ? 'gap-1.5' : ''}`}>
              <div className="flex items-center min-w-0 flex-shrink-0">
                <h1 className={`font-semibold text-gray-900 ${isMobileView ? 'text-xs truncate max-w-[100px]' : 'text-xl'}`}>
                  {isMobileView ? getCurrentPageTitle() : 'Order To-Do'}
                </h1>
                <span className={`px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full ${isMobileView ? 'ml-1 flex-shrink-0 text-[10px]' : 'ml-4 text-xs'}`}>
                  {user.role}
                </span>
                {isMobileView && (
                  <>
                    <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-800 text-[10px] rounded-full flex-shrink-0">
                      📱
                    </span>
                    <div className="ml-2">
                      <StoreIndicator />
                    </div>
                  </>
                )}
              </div>
              
              {/* Store Selector - only show on desktop */}
              {!isMobileView && (
                <div className="flex items-center">
                  {/* Store selector moved to OrdersView */}
                </div>
              )}
              
              <div className={`flex items-center ${isMobileView ? 'space-x-1 flex-shrink-0' : 'space-x-4'}`}>
                {!isMobileView && (
                  <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                )}
                
                {/* Mobile View Toggle */}
                <Button
                  variant={isMobileView ? "default" : "outline"}
                  size="sm"
                  onClick={toggleMobileView}
                  className={`${isMobileView ? 'bg-orange-600 hover:bg-orange-700 text-[10px] px-1 h-5 min-w-0' : ''}`}
                  title={isMobileView ? "Switch to Desktop View" : "Switch to Mobile View"}
                >
                  {isMobileView ? (
                    <Monitor className="h-2.5 w-2.5" />
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout} 
                  className={isMobileView ? 'text-[10px] px-1 h-5 min-w-0' : ''}
                >
                  <LogOut className={`${isMobileView ? 'h-2.5 w-2.5' : 'h-4 w-4 mr-2'}`} />
                  {isMobileView ? '' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Menu */}
        <nav className={`bg-white border-b ${isMobileView ? 'px-2 py-2' : 'px-4 sm:px-6 lg:px-8 py-3'}`}>
          <div className={`mx-auto ${isMobileView ? '' : 'max-w-7xl'}`}>
            <div className={`flex ${isMobileView ? 'flex-wrap gap-1' : 'gap-6'}`}>
              <NavLink 
                to="/orders" 
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                  ${isMobileView ? 'text-xs flex-1 justify-center' : 'text-sm'}
                `}
              >
                <Calendar className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                Orders
              </NavLink>
              
              <NavLink 
                to="/analytics" 
                className={({ isActive }) => `
                  flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                  ${isMobileView ? 'text-xs flex-1 justify-center' : 'text-sm'}
                `}
              >
                <BarChart3 className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                Analytics
              </NavLink>
              
              {user.role === 'admin' && (
                <NavLink 
                  to="/products" 
                  className={({ isActive }) => `
                    flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${isMobileView ? 'text-xs flex-1 justify-center' : 'text-sm'}
                  `}
                >
                  <Package className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  Products
                </NavLink>
              )}
              
              {user.role === 'admin' && (
                <NavLink 
                  to="/settings" 
                  className={({ isActive }) => `
                    flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${isMobileView ? 'text-xs flex-1 justify-center' : 'text-sm'}
                  `}
                >
                  <Settings className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  Settings
                </NavLink>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className={`mx-auto ${isMobileView ? 'px-3 py-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}>
          {children}
        </main>
      </div>
    </MobileViewContext.Provider>
  );
}