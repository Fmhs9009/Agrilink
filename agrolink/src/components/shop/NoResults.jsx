import React from 'react';
import { FaSearch } from 'react-icons/fa';

const NoResults = ({ resetFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <FaSearch className="text-gray-400 text-5xl mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        No Contracts Found
      </h3>
      <p className="text-gray-500 mb-4 max-w-md">
        We couldn't find any contracts matching your current filters. Try adjusting your search criteria or explore other options.
      </p>
      <button
        onClick={resetFilters}
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default NoResults; 