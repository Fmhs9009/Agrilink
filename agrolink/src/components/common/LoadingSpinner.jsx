import React from 'react';
import { THEME_COLORS } from '../../config/constants';

/**
 * Loading spinner component
 * @param {Object} props Component props
 * @param {string} [props.message='Loading...'] Message to display
 * @param {string} [props.size='md'] Size of the spinner (sm, md, lg)
 * @param {string} [props.color] Color of the spinner
 * @param {string} [props.type='spinner'] Type of loader (spinner, skeleton-card, skeleton-grid)
 * @param {number} [props.count=4] Number of skeleton items to display
 * @returns {React.ReactNode} LoadingSpinner component
 */
const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'md', 
  color = THEME_COLORS.primary,
  type = 'spinner',
  count = 4
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  // Render skeleton card
  const renderSkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/3] bg-gray-200"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="flex gap-2 my-3">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full my-4"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-full mt-4"></div>
      </div>
    </div>
  );

  // Render skeleton grid
  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeletonCard()}</div>
      ))}
    </div>
  );

  if (type === 'skeleton-card') {
    return renderSkeletonCard();
  }

  if (type === 'skeleton-grid') {
    return renderSkeletonGrid();
  }

  // Default spinner
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill={color}
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      {message && <p className="mt-3 text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner; 