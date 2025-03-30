import React, { useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-5">
      <div className={`relative transition-all duration-300 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for crops, farming practices, or locations..."
          className={`w-full px-4 py-3 pl-12 pr-10 text-white bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 placeholder-white/70`}
        />
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70" />
        
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>
      
      {searchQuery && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center text-white/90 text-sm">
            <span className="mr-2">Searching for:</span>
            <span className="bg-white/20 rounded-full px-3 py-1 flex items-center gap-1">
              "{searchQuery}" <button onClick={handleClear} className="ml-1 hover:text-white"><FaTimes size={12} /></button>
            </span>
          </span>
        </div>
      )}
    </form>
  );
};

export default SearchBar; 