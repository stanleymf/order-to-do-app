import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { ChevronDown } from 'lucide-react';

const StoreSelector: React.FC = () => {
  const { currentStore, allStores, setCurrentStoreById, isLoading } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg">
        <div className="w-4 h-4 bg-red-400 rounded-full"></div>
        <span className="text-sm font-medium">No store selected</span>
      </div>
    );
  }

  const handleStoreChange = (storeId: string) => {
    setCurrentStoreById(storeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <div 
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: currentStore.color }}
        />
        <span className="text-sm font-medium text-gray-900">
          {currentStore.name}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {allStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreChange(store.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  store.id === currentStore.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: store.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{store.name}</div>
                  <div className="text-xs text-gray-500">{store.domain}</div>
                </div>
                {store.id === currentStore.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default StoreSelector;