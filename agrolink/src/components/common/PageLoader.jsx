import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Full-page loading component
 * @param {Object} props Component props
 * @param {string} [props.message='Loading...'] Message to display
 * @returns {React.ReactNode} PageLoader component
 */
const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner message={message} />
    </div>
  );
};

export default PageLoader; 