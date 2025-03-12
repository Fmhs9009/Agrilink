import React from 'react';
import { FaFilter, FaSort, FaLeaf, FaCalendarAlt, FaStar, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const FilterSection = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  filters,
  handleFilterChange,
  priceRange,
  setPriceRange,
  sortOption,
  setSortOption,
  resetFilters,
  products
}) => {
  const growthStages = [
    { value: 'all', label: 'All Stages' },
    { value: 'seed', label: 'Seed Stage' },
    { value: 'seedling', label: 'Seedling Stage' },
    { value: 'vegetative', label: 'Vegetative Stage' },
    { value: 'flowering', label: 'Flowering Stage' },
    { value: 'fruiting', label: 'Fruiting Stage' },
    { value: 'mature', label: 'Mature Stage' },
    { value: 'harvested', label: 'Harvested' }
  ];

  const harvestWindows = [
    { value: 'all', label: 'All Time Frames' },
    { value: '30', label: 'Within 30 Days' },
    { value: '60', label: 'Within 60 Days' },
    { value: '90', label: 'Within 90 Days' },
    { value: '180', label: 'Within 6 Months' },
    { value: '365', label: 'Within 1 Year' }
  ];

  const farmingPractices = [
    { value: 'all', label: 'All Practices' },
    { value: 'Traditional', label: 'Traditional' },
    { value: 'Organic', label: 'Organic' },
    { value: 'Natural', label: 'Natural' },
    { value: 'Permaculture', label: 'Permaculture' },
    { value: 'Biodynamic', label: 'Biodynamic' },
    { value: 'Hydroponic', label: 'Hydroponic' },
    { value: 'Aquaponic', label: 'Aquaponic' }
  ];

  const certifications = [
    { value: 'all', label: 'All Certifications' },
    { value: 'Organic', label: 'Organic Certified' },
    { value: 'GAP', label: 'Good Agricultural Practices' },
    { value: 'PGS', label: 'Participatory Guarantee Systems' },
    { value: 'NPOP', label: 'National Programme for Organic Production' },
    { value: 'Global GAP', label: 'Global GAP' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FaFilter className="mr-2" /> Contract Filters
        </h3>
        <button 
          onClick={resetFilters}
          className="text-sm text-green-600 hover:text-green-800"
        >
          Reset All
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Crop Category</h4>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {(categories || []).map(category => (
            <option key={category} value={category}>
              {category === 'All' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Growth Stage Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Growth Stage</h4>
        <select
          value={filters.growthStage}
          onChange={(e) => handleFilterChange('growthStage', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {growthStages.map(stage => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>

      {/* Harvest Window Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Expected Harvest</h4>
        <select
          value={filters.harvestWindow}
          onChange={(e) => handleFilterChange('harvestWindow', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {harvestWindows.map(window => (
            <option key={window.value} value={window.value}>
              {window.label}
            </option>
          ))}
        </select>
      </div>

      {/* Farming Practice Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Farming Practice</h4>
        <select
          value={filters.farmingPractice}
          onChange={(e) => handleFilterChange('farmingPractice', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {farmingPractices.map(practice => (
            <option key={practice.value} value={practice.value}>
              {practice.label}
            </option>
          ))}
        </select>
      </div>

      {/* Certification Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Certification</h4>
        <select
          value={filters.certification}
          onChange={(e) => handleFilterChange('certification', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {certifications.map(cert => (
            <option key={cert.value} value={cert.value}>
              {cert.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Price Range (per {(products || []).length > 0 ? products[0]?.unit || 'unit' : 'unit'})</h4>
        <div className="flex items-center justify-between mb-2">
          <span>₹{priceRange.min}</span>
          <span>₹{priceRange.max}</span>
        </div>
        <input
          type="range"
          min="0"
          max="5000"
          value={priceRange.max}
          onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Organic Filter */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.organic}
            onChange={(e) => handleFilterChange('organic', e.target.checked)}
            className="rounded text-green-600 focus:ring-green-500 h-5 w-5"
          />
          <span className="flex items-center">
            <FaLeaf className="text-green-500 mr-1" /> Organic Only
          </span>
        </label>
      </div>

      {/* Sort Options */}
      <div>
        <h4 className="font-medium mb-2 flex items-center">
          <FaSort className="mr-2" /> Sort By
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={sortOption === 'newest'}
              onChange={() => setSortOption('newest')}
              className="text-green-600 focus:ring-green-500"
            />
            <span>Newest Listings</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={sortOption === 'harvest-date'}
              onChange={() => setSortOption('harvest-date')}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="flex items-center">
              Harvest Date <FaCalendarAlt className="ml-1 text-gray-500" size={12} />
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={sortOption === 'price-asc'}
              onChange={() => setSortOption('price-asc')}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="flex items-center">
              Price <FaArrowUp className="ml-1 text-gray-500" size={12} />
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={sortOption === 'price-desc'}
              onChange={() => setSortOption('price-desc')}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="flex items-center">
              Price <FaArrowDown className="ml-1 text-gray-500" size={12} />
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="sort"
              checked={sortOption === 'rating'}
              onChange={() => setSortOption('rating')}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="flex items-center">
              Farmer Rating <FaStar className="ml-1 text-yellow-400" size={12} />
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default FilterSection; 