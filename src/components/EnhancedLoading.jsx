import React from 'react';
import { FaHome, FaSearch, FaSpinner, FaChartLine } from 'react-icons/fa';

const EnhancedLoading = () => {
  // Generate array for skeleton items
  const skeletonItems = Array(6).fill(0);

  return (
    <div 
      className="loading-container min-h-[400px] flex flex-col items-center justify-center gap-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      {/* Animated logo with spinner */}
      <div className="relative group">
        <div className="absolute -inset-1.5 bg-indigo-100/50 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md">
          <FaHome className="text-3xl text-indigo-600" />
          <FaSpinner className="absolute -bottom-2 -right-2 text-indigo-500 text-xl animate-spin backdrop-blur-sm" />
        </div>
      </div>

      {/* Progress bar with animation */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Searching...</span>
          <span className="flex items-center gap-1">
            <FaChartLine className="animate-bounce" /> 
            <span>24%</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full animate-progress-stripes"
            style={{
              width: '24%',
              backgroundSize: '200% 100%',
              animation: 'progress-stripes 2s linear infinite',
            }}
          />
        </div>
      </div>

      {/* Loading text with better animation */}
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-3">
          <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>Finding</span>
          <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>your</span>
          <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>perfect</span>
          <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>property</span>
        </h2>
        <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
          <FaSearch className="inline animate-ping" style={{ animationDuration: '2s' }} /> 
          Searching through thousands of listings in your area
        </p>
      </div>

      {/* Improved skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full mt-8">
        {skeletonItems.map((_, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
            aria-hidden="true"
          >
            <div 
              className="h-40 bg-gradient-to-r from-gray-100 to-gray-200 animate-shimmer"
              style={{
                animationDelay: `${index * 0.1}s`,
                backgroundSize: '200% 100%',
              }}
            />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded-full w-1/2"></div>
              <div className="flex gap-2 pt-2">
                <div className="h-3 bg-gray-100 rounded-full w-1/4"></div>
                <div className="h-3 bg-gray-100 rounded-full w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add some custom animation styles */}
      <style jsx>{`
        @keyframes progress-stripes {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default EnhancedLoading;