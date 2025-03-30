import React from 'react';
import { Link } from 'react-router-dom';
import { FaFilter, FaExclamationTriangle, FaSeedling, FaLeaf, FaTint, FaCalendarAlt } from 'react-icons/fa';

const NoResults = ({ resetFilters }) => {
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 md:p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">
          <FaExclamationTriangle size={24} />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">No Contracts Found</h2>
      <p className="text-gray-600 mb-6 max-w-lg mx-auto">
        We couldn't find any contracts matching your current search criteria. Try adjusting your filters or searching with different terms.
      </p>
      
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={resetFilters}
          className="inline-flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <FaFilter />
          Reset All Filters
        </button>
        
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <FaSeedling />
          Browse All Contracts
        </Link>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 md:p-6 text-left">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
          <span className="bg-blue-200 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-blue-700">
            <FaExclamationTriangle size={12} />
          </span>
          Tips for finding contracts
        </h3>
        
        <ul className="space-y-3 text-sm text-blue-800">
          <li className="flex gap-2">
            <FaSeedling className="flex-shrink-0 mt-1 text-blue-600" />
            <span>
              <strong>Try changing the growth stage filter</strong> - If you're looking for mature crops, consider selecting "vegetative" or "fruiting" stages instead of "harvested" to see upcoming opportunities.
            </span>
          </li>
          <li className="flex gap-2">
            <FaCalendarAlt className="flex-shrink-0 mt-1 text-blue-600" />
            <span>
              <strong>Adjust harvest window</strong> - Consider choosing a broader harvest date range if you're flexible with timing.
            </span>
          </li>
          <li className="flex gap-2">
            <FaLeaf className="flex-shrink-0 mt-1 text-blue-600" />
            <span>
              <strong>Farming practices</strong> - If specific farming practices (Organic, Natural, etc.) are limiting your results, try broadening your criteria.
            </span>
          </li>
          <li className="flex gap-2">
            <FaTint className="flex-shrink-0 mt-1 text-blue-600" />
            <span>
              <strong>Water source and certification</strong> - These specific filters might be limiting your results. Try removing them to see more options.
            </span>
          </li>
          <li className="flex gap-2">
            <FaFilter className="flex-shrink-0 mt-1 text-blue-600" />
            <span>
              <strong>Use more general search terms</strong> - Try searching by category (like "Grains" or "Vegetables") rather than specific crop names.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NoResults; 