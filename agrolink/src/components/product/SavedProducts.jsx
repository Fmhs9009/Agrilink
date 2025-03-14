import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, productAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import Loader from '../layout/Loader';
import toast from 'react-hot-toast';
import { FaHeart, FaShoppingCart, FaLeaf, FaMapMarkerAlt, FaSearch, FaFilter } from 'react-icons/fa';

const SavedProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name_asc');

  useEffect(() => {
    fetchSavedProducts();
    fetchCategories();
  }, []);

  const fetchSavedProducts = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getSavedProducts();
      
      if (response.success) {
        setProducts(response.products || []);
      } else {
        setError('Failed to fetch saved products');
        toast.error('Failed to fetch saved products');
      }
    } catch (error) {
      console.error('Error fetching saved products:', error);
      setError('Error fetching saved products');
      toast.error('Error fetching saved products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getProductCategories();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleRemoveProduct = async (productId) => {
    try {
      const response = await userAPI.removeFromSavedProducts(productId);
      
      if (response.success) {
        setProducts(products.filter(product => product._id !== productId));
        toast.success('Product removed from saved items');
      } else {
        toast.error('Failed to remove product');
      }
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Error removing product');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled client-side since we already have all saved products
  };

  const handleCategoryChange = (category) => {
    setFilterCategory(category);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
  };

  const getFilteredProducts = () => {
    let filtered = [...products];
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => product.category === filterCategory);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'date_added_desc':
          return new Date(b.savedAt || b.createdAt) - new Date(a.savedAt || a.createdAt);
        case 'date_added_asc':
          return new Date(a.savedAt || a.createdAt) - new Date(b.savedAt || b.createdAt);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  };

  if (loading) {
    return <Loader />;
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Saved Products</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search saved products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Search
            </button>
          </form>
          
          <div className="relative inline-block text-left">
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative inline-block text-left">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="date_added_desc">Recently Saved</option>
              <option value="date_added_asc">Oldest Saved</option>
            </select>
          </div>
        </div>
      </div>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <FaHeart className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Saved Products</h2>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterCategory !== 'all' 
              ? "No products match your search criteria. Try adjusting your filters."
              : "You haven't saved any products yet."}
          </p>
          <Link
            to="/shop"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0].url} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaLeaf className="text-gray-400 text-4xl" />
                  </div>
                )}
                <button
                  onClick={() => handleRemoveProduct(product._id)}
                  className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                  title="Remove from saved"
                >
                  <FaHeart className="text-red-500" />
                </button>
                {product.organic && (
                  <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Organic
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 truncate">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <FaMapMarkerAlt className="mr-1" />
                  <span className="truncate">{product.farmer?.location || 'Location not available'}</span>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <span className="font-bold text-gray-700">₹{formatCurrency(product.price)}</span>
                    <span className="text-gray-500 text-sm ml-1">/ {product.unit}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{product.availableQuantity} {product.unit} available</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    to={`/product/${product._id}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded-md transition-colors duration-300 flex items-center justify-center"
                  >
                    View Details
                  </Link>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors duration-300"
                    title="Add to Cart"
                  >
                    <FaShoppingCart />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProductsPage; 