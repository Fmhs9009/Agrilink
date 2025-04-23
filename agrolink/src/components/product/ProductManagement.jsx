import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaSeedling, 
  FaSort, FaSortUp, FaSortDown, FaArrowUp, FaTag, FaRupeeSign,
  FaBoxOpen, FaLayerGroup, FaEllipsisV, FaChartLine
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';

const ProductManagement = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.loginData);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Categories for filtering with colors
  const categories = [
    { name: 'Grains', color: 'bg-amber-500' },
    { name: 'Vegetables', color: 'bg-green-500' },
    { name: 'Fruits', color: 'bg-red-500' },
    { name: 'Dairy', color: 'bg-blue-400' },
    { name: 'Spices', color: 'bg-orange-600' },
    { name: 'Herbs', color: 'bg-emerald-500' },
    { name: 'Oilseeds', color: 'bg-yellow-500' },
    { name: 'Cash Crops', color: 'bg-purple-500' },
    { name: 'Organic', color: 'bg-lime-600' }
  ];
  
  // Get category color
  const getCategoryColor = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || 'bg-gray-500';
  };
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log("Fetching products for user:", user);
        
        // Get the current user's ID to fetch only their products
        const userId = user?._id;
        
        let response;
        if (user?.role === 'admin') {
          // Admin can see all products
          console.log("Fetching all products for admin");
          response = await productAPI.getAll();
        } else {
          // Farmers see only their products
          console.log("Fetching products for farmer with ID:", userId);
          response = userId ? await productAPI.getByFarmer(userId) : { data: [] };
        }
        
        console.log("API response:", response);
        
        // Ensure data is in the expected format
        let productsData = Array.isArray(response.data) ? response.data : 
                         (response.data?.products || []);
        
        console.log("Setting products:", productsData);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
        toast.error('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [user]);
  
  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setLoading(true);
      await productAPI.delete(productToDelete._id);
      
      // Update local state
      setProducts(products.filter(p => p._id !== productToDelete._id));
      toast.success('Product deleted successfully');
      
      // Close modal
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };
  
  // Confirm delete
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="ml-1 text-green-600" /> : 
      <FaSortDown className="ml-1 text-green-600" />;
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };
  
  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Handle sorting
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name?.localeCompare(b.name || '') || 0;
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'stock':
          comparison = (a.availableQuantity || 0) - (b.availableQuantity || 0);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  
  // Get summary statistics
  const getStatistics = () => {
    const totalProducts = filteredProducts.length;
    const totalValue = filteredProducts.reduce((sum, product) => 
      sum + (product.price || 0) * (product.availableQuantity || 0), 0);
    const lowStockCount = filteredProducts.filter(p => (p.availableQuantity || 0) < 50).length;
    
    return { totalProducts, totalValue, lowStockCount };
  };
  
  const stats = getStatistics();
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
        <p className="font-medium">Error loading products</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FaBoxOpen className="mr-3 text-green-600" />
                  Product Management
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Manage your farm products and inventory
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </button>
                <Link
                  to="/products/add"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md shadow-sm text-sm font-medium text-white transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
                >
                  <FaPlus className="mr-2" />
                  Add New Product
                </Link>
              </div>
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 transition-transform hover:scale-105">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FaLayerGroup className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 transition-transform hover:scale-105">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaRupeeSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500 transition-transform hover:scale-105">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <FaChartLine className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaFilter className="text-gray-400" />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-all"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaArrowUp className={`transform transition-transform duration-200 ${
                      sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'
                    } text-gray-400`} />
                  </div>
                </div>
                
                <div className="relative flex-1 min-w-[200px]">
                  <select
                    value={sortField}
                    onChange={(e) => handleSort(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-all"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price">Sort by Price</option>
                    <option value="stock">Sort by Stock</option>
                    <option value="category">Sort by Category</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaSort className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active filters */}
            {(searchTerm || categoryFilter !== 'all') && (
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <span className="text-sm text-gray-500">Active filters:</span>
                
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Search: {searchTerm}
                  </span>
                )}
                
                {categoryFilter !== 'all' && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getCategoryColor(categoryFilter)}`}>
                    {categoryFilter}
                  </span>
                )}
                
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                  }}
                  className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          
          {/* Products Display */}
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <LoadingSpinner message="Loading your products..." />
            </div>
          ) : (
            <>
              {filteredProducts.length > 0 ? (
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                  {filteredProducts.map((product) => (
                    <div 
                      key={product._id} 
                      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all ${
                        viewMode === 'grid' ? '' : 'flex'
                      }`}
                    >
                      {/* Product Card */}
                      <div className={`${viewMode === 'grid' ? '' : 'w-1/4 min-w-[120px]'}`}>
                        {product.images && product.images.length > 0 ? (
                          <div className="w-full h-48 overflow-hidden">
                            <img 
                              src={product.images[0].url} 
                              alt={product.name} 
                              className="w-full h-full object-cover transform hover:scale-110 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <FaSeedling className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className={`p-6 ${viewMode === 'grid' ? '' : 'flex-1'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium text-white ${getCategoryColor(product.category)}`}>
                              {product.category || 'Uncategorized'}
                            </span>
                            <h3 className="mt-2 text-xl font-semibold text-gray-900">{product.name}</h3>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.availableQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        
                        <p className="mt-2 text-gray-500 text-sm line-clamp-2">
                          {product.description || 'No description available'}
                        </p>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-gray-900">₹{formatCurrency(product.price)}</p>
                            <p className="text-sm text-gray-500">
                              {product.availableQuantity} {product.unit || 'kg'} available
                            </p>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Link 
                              to={`/products/edit/${product._id}`}
                              className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                              title="Edit product"
                            >
                              <FaEdit />
                            </Link>
                            <button 
                              onClick={() => confirmDelete(product)}
                              className="p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                              title="Delete product"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <FaSeedling className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                  <p className="mt-2 text-gray-500 max-w-md mx-auto">
                    {searchTerm || categoryFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria to find what you\'re looking for.' 
                      : 'Get started by adding your first product to your inventory.'}
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/products/add"
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 transform transition-transform hover:scale-105"
                    >
                      <FaPlus className="mr-2" />
                      Add Your First Product
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12">
                    <FaTrash className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-xl leading-6 font-semibold text-gray-900">
                      Delete Product
                    </h3>
                    <div className="mt-2">
                      <p className="text-gray-500">
                        Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default ProductManagement; 