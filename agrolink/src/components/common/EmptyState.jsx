import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ title, message, icon, actionText, actionLink, onActionClick }) => {
  const handleActionClick = (e) => {
    if (onActionClick) {
      const shouldContinue = onActionClick();
      if (shouldContinue === false) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          onClick={handleActionClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState; 