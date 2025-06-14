import { useState, createContext, useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, BarChart3, Package, Smartphone, Monitor, Settings } from 'lucide-react';
import { OrdersView } from './OrdersView';
import { Analytics } from './Analytics';
import { ProductManagement } from './ProductManagement';
import { Settings as SettingsComponent } from './Settings';
import StoreSelector from './StoreSelector';
import StoreIndicator from './StoreIndicator';
import type { User } from '../types';
import { logout } from '../utils/storage';
import { NavLink } from 'react-router-dom';

interface DashboardProps {
  user: User;
  onLogout: () => void;
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

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('orders');
  const [isMobileView, setIsMobileView] = useState(false);

  const toggleMobileView = () => {
    setIsMobileView(!isMobileView);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <MobileViewContext.Provider value={{ isMobileView, toggleMobileView }}>
      <div className={`min-h-screen bg-gray-50 ${isMobileView ? 'max-w-[393px] mx-auto border-x-4 border-gray-400 shadow-2xl' : ''}`}>
        <header className="bg-white shadow-sm border-b">
          <div className={`mx-auto ${isMobileView ? 'px-1' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
            <div className={`flex justify-between items-center h-16 ${isMobileView ? 'gap-1.5' : ''}`}>
              <div className="flex items-center min-w-0 flex-shrink-0">
                <h1 className={`font-semibold text-gray-900 ${isMobileView ? 'text-xs truncate max-w-[100px]' : 'text-xl'}`}>
                  {isMobileView ? 'Order To-Do' : 'Order To-Do'}
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
                  <StoreSelector />
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

        <main className={`mx-auto py-4 ${isMobileView ? 'px-3' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className={`${isMobileView ? 'space-y-4' : 'space-y-6'}`}>
            <TabsList className={`grid w-full ${isMobileView ? 'grid-cols-2 h-10' : 'grid-cols-4'}`}>
              <TabsTrigger value="orders" className={`flex items-center gap-2 ${isMobileView ? 'text-xs px-2' : ''}`}>
                <Calendar className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                Orders
              </TabsTrigger>
              <TabsTrigger value="analytics" className={`flex items-center gap-2 ${isMobileView ? 'text-xs px-2' : ''}`}>
                <BarChart3 className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                Analytics
              </TabsTrigger>
              {user.role === 'admin' && (
                <TabsTrigger value="products" className={`flex items-center gap-2 ${isMobileView ? 'text-xs px-2' : ''}`}>
                  <Package className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  Products
                </TabsTrigger>
              )}
              {user.role === 'admin' && (
                <TabsTrigger value="settings" className={`flex items-center gap-2 ${isMobileView ? 'text-xs px-2' : ''}`}>
                  <Settings className={`${isMobileView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="orders">
              <OrdersView currentUser={user} />
            </TabsContent>

            <TabsContent value="analytics">
              <Analytics />
            </TabsContent>

            {user.role === 'admin' && (
              <TabsContent value="products">
                <ProductManagement />
              </TabsContent>
            )}

            {user.role === 'admin' && (
              <TabsContent value="settings">
                <SettingsComponent currentUser={user} />
              </TabsContent>
            )}
          </Tabs>

          {/* Navigation Menu */}
          <nav className={`flex ${isMobileView ? 'flex-wrap gap-4 mt-4 px-4' : 'gap-8'}`}>
            <NavLink 
              to="/orders" 
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-lg
                ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}
                ${isMobileView ? 'text-sm w-full' : ''}
              `}
            >
              <Calendar className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Orders
            </NavLink>
            <NavLink 
              to="/analytics" 
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-lg
                ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}
                ${isMobileView ? 'text-sm w-full' : ''}
              `}
            >
              <BarChart3 className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Analytics
            </NavLink>
            {user.role === 'admin' && (
              <NavLink 
                to="/products" 
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}
                  ${isMobileView ? 'text-sm w-full' : ''}
                `}
              >
                <Package className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
                Products
              </NavLink>
            )}
            {user.role === 'admin' && (
              <NavLink 
                to="/settings" 
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}
                  ${isMobileView ? 'text-sm w-full' : ''}
                `}
              >
                <Settings className={`${isMobileView ? 'h-4 w-4' : 'h-5 w-5'}`} />
                Settings
              </NavLink>
            )}
          </nav>
        </main>
      </div>
    </MobileViewContext.Provider>
  );
}