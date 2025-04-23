import React, { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../services/api';
import FilterSection from './FilterSection';
import ProductCard from '../common/ProductCard';
import SearchBar from './SearchBar';
import NoResults from './NoResults';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { FaFilter, FaTimes, FaSeedling, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { INDIAN_STATES, PRODUCT_CATEGORIES } from '../../config/constants';

// Mock data for fallback when API fails
const MOCK_PRODUCTS = [
  {
    _id: 'mock1',
    name: 'Organic Rice',
    description: 'Premium quality organic rice grown without pesticides',
    price: 120,
    unit: 'kg',
    category: 'Grains',
    stock: 100,
    isOrganic: true,
    isFeatured: true,
    images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
    farmer: {
      _id: '1',
      name: 'Ramesh Kumar',
      location: 'Punjab'
    },
    createdAt: new Date().toISOString(),
    averageRating: 4.5,
    totalReviews: 12
  },
  {
    _id: 'mock2',
    name: 'Premium Wheat',
    description: 'High-quality wheat for all your baking needs',
    price: 80,
    unit: 'kg',
    category: 'Grains',
    stock: 150,
    isOrganic: false,
    isFeatured: true,
    images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
    farmer: {
      _id: '2',
      name: 'Suresh Patel',
      location: 'Gujarat'
    },
    createdAt: new Date().toISOString(),
    averageRating: 4.2,
    totalReviews: 8
  },
  {
    _id: 'mock3',
    name: 'Fresh Tomatoes',
    description: 'Juicy and ripe tomatoes freshly harvested',
    price: 60,
    unit: 'kg',
    category: 'Vegetables',
    stock: 80,
    isOrganic: true,
    isFeatured: false,
    images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
    farmer: {
      _id: '3',
      name: 'Anita Sharma',
      location: 'Maharashtra'
    },
    createdAt: new Date().toISOString(),
    averageRating: 4.8,
    totalReviews: 15
  },
  {
    _id: 'mock4',
    name: 'Organic Potatoes',
    description: 'Farm-fresh organic potatoes',
    price: 40,
    unit: 'kg',
    category: 'Vegetables',
    stock: 200,
    isOrganic: true,
    isFeatured: false,
    images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
    farmer: {
      _id: '3',
      name: 'Anita Sharma',
      location: 'Maharashtra'
    },
    createdAt: new Date().toISOString(),
    averageRating: 4.0,
    totalReviews: 10
  },
  {
    _id: 'mock5',
    name: 'Basmati Rice',
    description: 'Premium long-grain aromatic rice',
    price: 150,
    unit: 'kg',
    category: 'Grains',
    stock: 120,
    isOrganic: false,
    isFeatured: true,
    images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
    farmer: {
      _id: '1',
      name: 'Ramesh Kumar',
      location: 'Punjab'
    },
    createdAt: new Date().toISOString(),
    averageRating: 4.7,
    totalReviews: 20
  },
  {
    _id: 'mock6',
    name: 'Organic Apples',
    description: 'Sweet and juicy organic apples',
    price: 180,
    unit: 'kg',
    category: 'Fruits',
    stock: 75,
    isOrganic: true,
    isFeatured: true,
    images: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
    farmer: {
      _id: '4',
      name: 'Vikram Singh',
      location: 'Himachal Pradesh'
    },
    createdAt: new Date().toISOString(),
    averageRating: 4.9,
    totalReviews: 18
  }
];

// Mock categories for fallback
const MOCK_CATEGORIES = ['All', 'Grains', 'Vegetables', 'Fruits', 'Dairy', 'Spices'];

const Shop = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [filters, setFilters] = useState({
    currentGrowthStage: 'all',
    harvestWindow: 'all',
    farmingPractice: 'all',
    waterSource: 'all',
    certification: 'all',
    state: 'all',
    sortBy: 'newest',
    organic: false,
    pesticidesUsed: null, // null = any, false = no pesticides only
    openToCustomGrowing: null, // null = any, true = only open to custom growing
    minQuantity: 0,
    maxQuantity: 1000
  });

  // Mobile filter visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch products and categories on initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch categories first
        try {
          const categoriesResponse = await categoryAPI.getAll();
          if (categoriesResponse.success && categoriesResponse.categories) {
            setCategories(['All', ...categoriesResponse.categories]);
          } else {
            setCategories(['All', ...MOCK_CATEGORIES]);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
          setCategories(['All', ...MOCK_CATEGORIES]);
        }
      } catch (error) {
        console.error('Error in initial data loading:', error);
        setCategories(['All', ...MOCK_CATEGORIES]);
      }
    };
    
    fetchInitialData();
  }, []);

  // Apply filters and fetch products when filters change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setIsLoading(true);
      
      try {
        // Build filter parameters for API call
        const filterParams = {};
        
        // Add search query if exists
        if (searchQuery) {
          filterParams.search = searchQuery;
        }
        
        // Add category if not 'All'
        if (selectedCategory !== 'All') {
          filterParams.category = selectedCategory;
        }
        
        // Add minimum quantity if set
        if (filters.minQuantity > 0) {
          filterParams.minQuantity = filters.minQuantity;
        }
        
        // Add sort option
        if (sortOption !== 'newest') {
          const sortMap = {
            'price-asc': 'price_asc',
            'price-desc': 'price_desc', 
            'harvest-date': 'harvest_date',
            'quantity-desc': 'quantity_desc'
          };
          filterParams.sort = sortMap[sortOption] || 'newest';
        }
        
        // Add other filters
        if (filters.organic) {
          filterParams.organic = true;
        }
        
        if (filters.currentGrowthStage !== 'all') {
          filterParams.currentGrowthStage = filters.currentGrowthStage;
        }
        
        if (filters.farmingPractice !== 'all') {
          filterParams.farmingPractices = filters.farmingPractice;
        }
        
        if (filters.waterSource !== 'all') {
          filterParams.waterSource = filters.waterSource;
        }
        
        if (filters.certification !== 'all') {
          filterParams.certification = filters.certification;
        }
        
        if (filters.pesticidesUsed === false) {
          filterParams.pesticidesUsed = false;
        }
        
        if (filters.openToCustomGrowing === true) {
          filterParams.openToCustomGrowing = true;
        }
        
        if (filters.harvestWindow !== 'all') {
          filterParams.harvestWindow = filters.harvestWindow;
        }
        
        // Add state filter if not 'all'
        if (filters.state !== 'all') {
          filterParams.state = filters.state;
        }
        
        console.log("Applying filters:", filterParams);
        
        // Fetch products with filters
        const productsResponse = await productAPI.getAll(filterParams);
        
        if (productsResponse.success) {
          setProducts(productsResponse.products || []);
          setError(null);
          setUseMockData(false);
        } else {
          console.error('Failed to fetch products from API, using mock data');
          setProducts(MOCK_PRODUCTS);
          setUseMockData(true);
        }
      } catch (error) {
        console.error('Error fetching filtered products:', error);
        setError(error.message || 'Failed to connect to server');
        setProducts(MOCK_PRODUCTS);
        setUseMockData(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilteredProducts();
  }, [searchQuery, selectedCategory, filters, sortOption]);

  // Filter handlers
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortOption('newest');
    setFilters({
      currentGrowthStage: 'all',
      harvestWindow: 'all',
      farmingPractice: 'all',
      waterSource: 'all',
      certification: 'all',
      state: 'all',
      sortBy: 'newest',
      organic: false,
      pesticidesUsed: null,
      openToCustomGrowing: null,
      minQuantity: 0,
      maxQuantity: 1000
    });
  };

  // Calculate if a product's harvest date is within the specified window
  const isHarvestWithinWindow = (harvestDateStr, windowDays) => {
    if (windowDays === 'all') return true;
    
    const harvestDate = new Date(harvestDateStr);
    const now = new Date();
    const differenceInDays = Math.ceil((harvestDate - now) / (1000 * 60 * 60 * 24));
    
    return differenceInDays >= 0 && differenceInDays <= parseInt(windowDays);
  };

  // Extract state from FarmLocation
  const extractStateFromLocation = (location) => {
    if (!location) return '';
    
    // Convert location to lowercase for case-insensitive matching
    const locationLower = location.toLowerCase();
    
    // Try to match a state from the location string
    for (const state of INDIAN_STATES) {
      // Check for exact state name in the location string (case insensitive)
      if (locationLower.includes(state.toLowerCase())) {
        return state;
      }
    }
    
    // If no direct match is found, try more sophisticated matching
    // Look for common patterns in Indian addresses where state might appear
    
    // Pattern: Location usually ends with "state - pincode"
    const stateWithPincodeRegex = /,\s*([^,]+)\s*-\s*\d{6}/i;
    const stateWithPincodeMatch = location.match(stateWithPincodeRegex);
    
    if (stateWithPincodeMatch && stateWithPincodeMatch[1]) {
      const potentialState = stateWithPincodeMatch[1].trim();
      
      // Check if this potential state matches any of our known states
      const matchedState = INDIAN_STATES.find(state => 
        potentialState.toLowerCase() === state.toLowerCase() ||
        state.toLowerCase().includes(potentialState.toLowerCase()) ||
        potentialState.toLowerCase().includes(state.toLowerCase())
      );
      
      if (matchedState) return matchedState;
    }
    
    // Pattern: Location often contains "city, state" near the end
    const cityStateRegex = /,\s*[^,]+,\s*([^,\-]+)/i;
    const cityStateMatch = location.match(cityStateRegex);
    
    if (cityStateMatch && cityStateMatch[1]) {
      const potentialState = cityStateMatch[1].trim();
      
      // Check if this potential state matches any of our known states
      const matchedState = INDIAN_STATES.find(state => 
        potentialState.toLowerCase() === state.toLowerCase() ||
        state.toLowerCase().includes(potentialState.toLowerCase()) ||
        potentialState.toLowerCase().includes(state.toLowerCase())
      );
      
      if (matchedState) return matchedState;
    }
    
    return '';
  };

  // For display and debugging purposes
  const getProductsStateDistribution = () => {
    const stateCount = {};
    
    products.forEach(product => {
      const farmerLocation = product.farmer?.FarmLocation || 
                           product.farmLocation?.district || 
                           product.farmLocation?.state || '';
      
      const state = extractStateFromLocation(farmerLocation);
      if (state) {
        stateCount[state] = (stateCount[state] || 0) + 1;
      } else {
        stateCount['Unknown'] = (stateCount['Unknown'] || 0) + 1;
      }
    });
    
    console.log('State distribution:', stateCount);
    return stateCount;
  };

  // Call this function when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      getProductsStateDistribution();
    }
  }, [products]);

  // Filter products based on all criteria
  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
    
    // Minimum Quantity filter
    if (product.availableQuantity < filters.minQuantity) return false;
    
    // Organic filter
    if (filters.organic && !(product.isOrganic || product.organic)) return false;

    // Growth stage filter (if not "all")
    if (filters.currentGrowthStage !== 'all' && product.currentGrowthStage !== filters.currentGrowthStage) return false;
    
    // Harvest window filter
    if (filters.harvestWindow !== 'all' && !isHarvestWithinWindow(product.estimatedHarvestDate, filters.harvestWindow)) return false;
    
    // Farming practice filter
    if (filters.farmingPractice !== 'all' && !product.farmingPractices?.includes(filters.farmingPractice)) return false;
    
    // Water source filter
    if (filters.waterSource !== 'all' && product.waterSource !== filters.waterSource) return false;
    
    // Certification filter
    if (filters.certification !== 'all' && product.certification !== filters.certification) return false;
    
    // Pesticides filter
    if (filters.pesticidesUsed === false && product.pesticidesUsed !== false) return false;
    
    // Custom growing filter
    if (filters.openToCustomGrowing === true && product.openToCustomGrowing !== true) return false;
    
    // State filter
    if (filters.state !== 'all') {
      // Get location from all possible sources in the product data
      const farmerLocation = product.farmer?.FarmLocation || 
                          product.farmLocation || 
                          product.location || 
                          (product.farmer ? product.farmer.location : '') || 
                          '';
      
      // Extract state from location
      const productState = extractStateFromLocation(farmerLocation);
      
      // If no state match is found or state doesn't match the filter, exclude product
      if (!productState || productState !== filters.state) {
        return false;
      }
    }
    
    // Search query filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      
      // Get farmer details, handling both populated objects and reference IDs
      // Based on User schema which has Name and FarmLocation fields
      const farmerName = product.farmer?.Name || '';
      const farmerLocation = product.farmer?.FarmLocation || 
                             product.farmLocation?.district || 
                             product.farmLocation?.state || '';
                             
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        farmerName.toLowerCase().includes(searchLower) ||
        farmerLocation.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0);
      case 'harvest-date':
        return new Date(a.estimatedHarvestDate || 0) - new Date(b.estimatedHarvestDate || 0);
      case 'quantity-desc':
        return (b.availableQuantity || 0) - (a.availableQuantity || 0);
      case 'newest':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (filters.organic) count++;
    if (filters.currentGrowthStage !== 'all') count++;
    if (filters.harvestWindow !== 'all') count++;
    if (filters.farmingPractice !== 'all') count++;
    if (filters.waterSource !== 'all') count++;
    if (filters.certification !== 'all') count++;
    if (filters.state !== 'all') count++;
    if (filters.pesticidesUsed === false) count++;
    if (filters.openToCustomGrowing === true) count++;
    if (sortOption !== 'newest') count++;
    if (filters.minQuantity > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Fix filters display in the active filters section
  const displayStateFilter = () => {
    if (filters.state !== 'all') {
      return (
        <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          State: {filters.state}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-900 text-white">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Find the Perfect Farming Contracts
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-6">
              Connect with farmers and buyers to grow better, together
            </p>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        </div>
        <div className="h-5 bg-gray-50" style={{ clipPath: 'ellipse(70% 100% at 50% 0%)' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {useMockData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Using demo data for preview. Connect to a backend API for real data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filter Button */}
        <div className="mb-4 md:hidden">
          <button
            onClick={toggleMobileFilters}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FaFilter className="text-green-600" />
            {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            {activeFilterCount > 0 && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-2">
                {activeFilterCount}
              </span>
            )}
            {showMobileFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div 
            className={`md:w-1/4 transition-all duration-300 ${
              showMobileFilters ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 md:max-h-full md:opacity-100 overflow-hidden'
            }`}
          >
            <div className="sticky top-20">
              <FilterSection
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                filters={filters}
                handleFilterChange={handleFilterChange}
                sortOption={sortOption}
                setSortOption={setSortOption}
                resetFilters={resetFilters}
                products={products}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:w-3/4">
            {isLoading ? (
              <div className="w-full">
                <LoadingSpinner type="skeleton-grid" count={6} message={null} />
              </div>
            ) : sortedProducts.length > 0 ? (
              <>
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between">
                  <p className="text-gray-600 mb-2 sm:mb-0">
                    Showing <span className="font-medium">{sortedProducts.length}</span> of <span className="font-medium">{products.length}</span> contracts
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeFilterCount > 0 && (
                      <>
                        <span className="text-sm text-gray-500">Active filters:</span>
                        {selectedCategory !== 'All' && (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {selectedCategory}
                          </span>
                        )}
                        {filters.organic && (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Organic
                          </span>
                        )}
                        {filters.currentGrowthStage !== 'all' && (
                          <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {filters.currentGrowthStage.replace('_', ' ')}
                          </span>
                        )}
                        {filters.harvestWindow !== 'all' && (
                          <span className="inline-flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Harvest: {filters.harvestWindow} days
                          </span>
                        )}
                        {filters.farmingPractice !== 'all' && (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {filters.farmingPractice}
                          </span>
                        )}
                        {filters.state !== 'all' && (
                          <span className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            State: {filters.state}
                          </span>
                        )}
                        {filters.pesticidesUsed === false && (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            No Pesticides
                          </span>
                        )}
                        {sortOption !== 'newest' && (
                          <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {sortOption === 'price-asc' ? 'Price ↑' : 
                             sortOption === 'price-desc' ? 'Price ↓' : 
                             sortOption === 'harvest-date' ? 'Harvest Soon' :
                             sortOption === 'quantity-desc' ? 'Most Quantity' : 
                             sortOption}
                          </span>
                        )}
                        {(filters.minQuantity > 0) && (
                          <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Min Qty: {filters.minQuantity}
                          </span>
                        )}
                        <button 
                          onClick={resetFilters}
                          className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                        >
                          <FaTimes className="mr-1" /> Clear all
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <NoResults resetFilters={resetFilters} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop; 