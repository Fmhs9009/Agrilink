import React, { useState } from 'react';
import { FaFilter, FaSeedling, FaChevronDown, FaChevronUp, FaLeaf, FaTint, FaCertificate, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { INDIAN_STATES } from '../../config/constants';

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
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    growthStage: true,
    harvestDate: false,
    farmingPractice: false,
    waterSource: false,
    certification: false,
    quantity: false,
    state: false,
    sort: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get unique product categories from schema
  const productCategories = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Pulses",
    "Oilseeds",
    "Spices",
    "Herbs",
    "Other"
  ];

  // Get max quantity from products
  const getMaxQuantity = () => {
    if (!products || products.length === 0) return 1000;
    
    let max = 0;
    products.forEach(product => {
      if (product.availableQuantity && product.availableQuantity > max) {
        max = product.availableQuantity;
      }
    });
    
    return max > 0 ? Math.ceil(max / 100) * 100 : 1000; // Round up to nearest hundred
  };

  // FilterSectionHeader component for consistent styling
  const FilterSectionHeader = ({ title, expanded, toggleFn, icon }) => (
    <div 
      className="flex justify-between items-center cursor-pointer py-2 px-1 rounded hover:bg-gray-50"
      onClick={toggleFn}
    >
      <div className="flex items-center">
        {icon}
        <h3 className="font-medium text-gray-700 ml-2">{title}</h3>
      </div>
      {expanded ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
    </div>
  );

  // Get available quantity range
  const maxQuantity = getMaxQuantity();

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FaFilter className="mr-2 text-green-600" />
          Filters
        </h2>
        <button 
          onClick={resetFilters} 
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        {/* Category Filter */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="Category" 
            expanded={expandedSections.category} 
            toggleFn={() => toggleSection('category')} 
            icon={<FaSeedling className="text-green-600" />}
          />
          
          {expandedSections.category && (
            <div className="mt-2 space-y-1 pl-2">
              <div className="flex flex-wrap gap-2 mt-2">
                <button 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategory === 'All' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory('All')}
                >
                  All
                </button>
                
                {productCategories.map(category => (
                  <button 
                    key={category}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCategory === category 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Growth Stage */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="Growth Stage" 
            expanded={expandedSections.growthStage} 
            toggleFn={() => toggleSection('growthStage')} 
            icon={<FaSeedling className="text-green-600" />}
          />
          
          {expandedSections.growthStage && (
            <div className="mt-2 space-y-1 pl-2">
              <div className="flex flex-col gap-1">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="growthStage"
                    checked={filters.currentGrowthStage === 'all'}
                    onChange={() => handleFilterChange('currentGrowthStage', 'all')}
                  />
                  <span className="ml-2 text-gray-700">All stages</span>
                </label>
                
                {["seed", "seedling", "vegetative", "flowering", "fruiting", "mature", "harvested"].map(stage => (
                  <label key={stage} className="inline-flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      className="form-radio text-green-600 h-4 w-4" 
                      name="growthStage"
                      checked={filters.currentGrowthStage === stage}
                      onChange={() => handleFilterChange('currentGrowthStage', stage)}
                    />
                    <span className="ml-2 text-gray-700 capitalize">{stage}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Harvest Window */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="Expected Harvest" 
            expanded={expandedSections.harvestDate} 
            toggleFn={() => toggleSection('harvestDate')} 
            icon={<FaClock className="text-amber-600" />}
          />
          
          {expandedSections.harvestDate && (
            <div className="mt-2 space-y-1 pl-2">
              <div className="flex flex-col gap-1">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="harvestWindow" 
                    checked={filters.harvestWindow === 'all'}
                    onChange={() => handleFilterChange('harvestWindow', 'all')}
                  />
                  <span className="ml-2 text-gray-700">Any time</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="harvestWindow" 
                    checked={filters.harvestWindow === '15'}
                    onChange={() => handleFilterChange('harvestWindow', '15')}
                  />
                  <span className="ml-2 text-gray-700">Within 15 days</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="harvestWindow" 
                    checked={filters.harvestWindow === '30'}
                    onChange={() => handleFilterChange('harvestWindow', '30')}
                  />
                  <span className="ml-2 text-gray-700">Within 30 days</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="harvestWindow" 
                    checked={filters.harvestWindow === '90'}
                    onChange={() => handleFilterChange('harvestWindow', '90')}
                  />
                  <span className="ml-2 text-gray-700">Within 3 months</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="harvestWindow" 
                    checked={filters.harvestWindow === '180'}
                    onChange={() => handleFilterChange('harvestWindow', '180')}
                  />
                  <span className="ml-2 text-gray-700">Within 6 months</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Farming Practices */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="Farming Practices" 
            expanded={expandedSections.farmingPractice} 
            toggleFn={() => toggleSection('farmingPractice')} 
            icon={<FaLeaf className="text-green-600" />}
          />
          
          {expandedSections.farmingPractice && (
            <div className="mt-2 space-y-1 pl-2">
              <div className="flex flex-col gap-1">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="farmingPractice" 
                    checked={filters.farmingPractice === 'all'}
                    onChange={() => handleFilterChange('farmingPractice', 'all')}
                  />
                  <span className="ml-2 text-gray-700">All practices</span>
                </label>
                
                {["Traditional", "Organic", "Natural", "Permaculture", "Biodynamic", "Hydroponic", "Aquaponic", "Conventional"].map(practice => (
                  <label key={practice} className="inline-flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      className="form-radio text-green-600 h-4 w-4" 
                      name="farmingPractice" 
                      checked={filters.farmingPractice === practice}
                      onChange={() => handleFilterChange('farmingPractice', practice)}
                    />
                    <span className="ml-2 text-gray-700">{practice}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Water Source */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="Water Source" 
            expanded={expandedSections.waterSource} 
            toggleFn={() => toggleSection('waterSource')} 
            icon={<FaTint className="text-blue-600" />}
          />
          
          {expandedSections.waterSource && (
            <div className="mt-2 space-y-1 pl-2">
              <div className="flex flex-col gap-1">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="waterSource" 
                    checked={filters.waterSource === 'all'}
                    onChange={() => handleFilterChange('waterSource', 'all')}
                  />
                  <span className="ml-2 text-gray-700">All sources</span>
                </label>
                
                {["Rainfed", "Canal", "Well", "Borewell", "River", "Pond", "Other"].map(source => (
                  <label key={source} className="inline-flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      className="form-radio text-green-600 h-4 w-4" 
                      name="waterSource" 
                      checked={filters.waterSource === source}
                      onChange={() => handleFilterChange('waterSource', source)}
                    />
                    <span className="ml-2 text-gray-700">{source}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Certification */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="Certification" 
            expanded={expandedSections.certification} 
            toggleFn={() => toggleSection('certification')} 
            icon={<FaCertificate className="text-yellow-600" />}
          />
          
          {expandedSections.certification && (
            <div className="mt-2 space-y-1 pl-2">
              <div className="flex flex-col gap-1">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="certification" 
                    checked={filters.certification === 'all'}
                    onChange={() => handleFilterChange('certification', 'all')}
                  />
                  <span className="ml-2 text-gray-700">All certifications</span>
                </label>
                
                {["Organic", "GAP", "PGS", "NPOP", "Global GAP", "Other"].map(cert => (
                  <label key={cert} className="inline-flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      className="form-radio text-green-600 h-4 w-4" 
                      name="certification" 
                      checked={filters.certification === cert}
                      onChange={() => handleFilterChange('certification', cert)}
                    />
                    <span className="ml-2 text-gray-700">{cert}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Available Quantity Range - SIMPLIFIED */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="Minimum Available Quantity" 
            expanded={expandedSections.quantity} 
            toggleFn={() => toggleSection('quantity')} 
            icon={<FaSeedling className="text-purple-600" />}
          />
          
          {expandedSections.quantity && (
            <div className="mt-4 px-2">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 text-sm">0 {filters.minQuantity > 0 && `(Min: ${filters.minQuantity})`}</span>
                  <span className="text-gray-700 text-sm">{maxQuantity}+</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={maxQuantity}
                  value={filters.minQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleFilterChange('minQuantity', value);
                    // Ensure maxQuantity is always at least minQuantity
                    if (value > filters.maxQuantity) {
                      handleFilterChange('maxQuantity', maxQuantity);
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                
                <div className="mt-3 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Products with at least <span className="text-green-600">{filters.minQuantity}</span> {filters.minQuantity === 1 ? 'unit' : 'units'} available
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* State Filter - New Section */}
        <div className="border-b pb-4">
          <FilterSectionHeader 
            title="State" 
            expanded={expandedSections.state} 
            toggleFn={() => toggleSection('state')} 
            icon={<FaMapMarkerAlt className="text-red-600" />}
          />
          
          {expandedSections.state && (
            <div className="mt-2 pl-2">
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All states</option>
                {[...INDIAN_STATES].sort().map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Special Filters */}
        <div className="border-b pb-4">
          <h3 className="font-medium text-gray-700 mb-2">Special Filters</h3>
          
          <div className="space-y-3 pl-2">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox text-green-600 h-4 w-4"
                checked={filters.organic}
                onChange={(e) => handleFilterChange('organic', e.target.checked)}
              />
              <span className="ml-2 text-gray-700">Organic only</span>
            </label>
            
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox text-green-600 h-4 w-4"
                checked={filters.pesticidesUsed === false}
                onChange={(e) => handleFilterChange('pesticidesUsed', e.target.checked ? false : null)}
              />
              <span className="ml-2 text-gray-700">No pesticides used</span>
            </label>
            
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="form-checkbox text-green-600 h-4 w-4"
                checked={filters.openToCustomGrowing === true}
                onChange={(e) => handleFilterChange('openToCustomGrowing', e.target.checked ? true : null)}
              />
              <span className="ml-2 text-gray-700">Custom growing available</span>
            </label>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <FilterSectionHeader 
            title="Sort By" 
            expanded={expandedSections.sort} 
            toggleFn={() => toggleSection('sort')} 
            icon={<FaFilter className="text-gray-600" />}
          />
          
          {expandedSections.sort && (
            <div className="mt-2 space-y-1 pl-2">
              <div className="flex flex-col gap-1">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="sortOption" 
                    checked={sortOption === 'newest'}
                    onChange={() => setSortOption('newest')}
                  />
                  <span className="ml-2 text-gray-700">Newest first</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="sortOption" 
                    checked={sortOption === 'price-asc'}
                    onChange={() => setSortOption('price-asc')}
                  />
                  <span className="ml-2 text-gray-700">Price: Low to high</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="sortOption" 
                    checked={sortOption === 'price-desc'}
                    onChange={() => setSortOption('price-desc')}
                  />
                  <span className="ml-2 text-gray-700">Price: High to low</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="sortOption" 
                    checked={sortOption === 'quantity-desc'}
                    onChange={() => setSortOption('quantity-desc')}
                  />
                  <span className="ml-2 text-gray-700">Quantity: Most available</span>
                </label>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio text-green-600 h-4 w-4" 
                    name="sortOption" 
                    checked={sortOption === 'harvest-date'}
                    onChange={() => setSortOption('harvest-date')}
                  />
                  <span className="ml-2 text-gray-700">Harvest: Soonest first</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection; 