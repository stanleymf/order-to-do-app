import React from 'react';
import { useStore } from '../contexts/StoreContext';

const StoreIndicator: React.FC = () => {
  const { currentStore, isLoading } = useStore();

  if (isLoading || !currentStore) {
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-[10px] animate-pulse">
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-200 rounded text-[10px]">
      <div 
        className="w-2 h-2 rounded-full border border-white shadow-sm"
        style={{ backgroundColor: currentStore.color }}
      />
      <span className="text-gray-700 font-medium truncate max-w-[80px]">
        {currentStore.name}
      </span>
    </div>
  );
};

export default StoreIndicator; 