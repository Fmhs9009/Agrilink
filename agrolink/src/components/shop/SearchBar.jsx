import React from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-8">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for crops, farming practices, or locations..."
          className="w-full px-4 py-3 pl-12 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
    </form>
  );
};

export default SearchBar; 