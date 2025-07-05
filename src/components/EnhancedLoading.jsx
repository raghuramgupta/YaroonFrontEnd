import React from 'react';
import { FaHome, FaSearch, FaSpinner } from 'react-icons/fa';

const EnhancedLoading = () => {
  // Generate array for skeleton items
  const skeletonItems = Array(6).fill(0);

  return (
    <div className="loading-container min-h-[300px] flex flex-col items-center justify-center gap-6 p-4">
      {/* Spinner with pulse animation */}
      <div className="relative">
        <FaHome className="text-4xl text-indigo-600" />
        <FaSpinner className="absolute -top-1 -right-1 text-indigo-400 text-lg animate-spin" />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full animate-progress"
          style={{
            animation: 'progress 2s ease-in-out infinite alternate'
          }}
        />
      </div>

      {/* Loading text with pulse animation */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 flex items-center justify-center gap-2 animate-pulse">
          <FaSearch className="inline" /> Finding your perfect property...
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Searching through thousands of listings
        </p>
      </div>

      {/* Skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-6">
        {skeletonItems.map((_, index) => (
          <div 
            key={index}
            className="bg-gray-100 rounded-lg h-48 animate-pulse"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default EnhancedLoading;