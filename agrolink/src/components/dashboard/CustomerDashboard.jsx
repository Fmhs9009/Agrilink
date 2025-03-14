import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaShoppingBasket, 
  FaFileContract, 
  FaHistory, 
  FaHeart, 
  FaChartLine, 
  FaCalendarAlt,
  FaLeaf,
  FaMapMarkerAlt,
  FaSearch
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loader from '../layout/Loader';
import toast from 'react-hot-toast';
import { productAPI, orderAPI, contractAPI } from '../../services/api';

// Dashboard stat card component
const StatCard = ({ icon, title, value, bgColor }) => (
  <div className={`${bgColor} rounded-lg shadow-md p-4 flex items-center`}>
    <div className="mr-4 text-white text-2xl">
      {icon}
    </div>
    <div>
      <h3 className="text-white text-sm font-medium">{title}</h3>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  </div>
);

// Recent orders component
const RecentOrders = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
          <Link to="/orders" className="text-green-600 hover:text-green-800 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="bg-gray-50 rounded-md p-8 text-center">
          <FaShoppingBasket className="mx-auto text-gray-400 text-4xl mb-3" />
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <Link 
            to="/shop" 
            className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
        <Link to="/orders" className="text-green-600 hover:text-green-800 text-sm font-medium">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order._id.substring(0, 8)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {order.items.length}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                  ₹{formatCurrency(order.totalAmount)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <Link 
                    to={`/orders/${order._id}`}
                    className="text-green-600 hover:text-green-900"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Active contracts component
const ActiveContracts = ({ contracts }) => {
  if (!contracts || contracts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Active Contracts</h2>
          <Link to="/contracts" className="text-green-600 hover:text-green-800 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="bg-gray-50 rounded-md p-8 text-center">
          <FaFileContract className="mx-auto text-gray-400 text-4xl mb-3" />
          <p className="text-gray-500">You don't have any active contracts.</p>
          <Link 
            to="/shop" 
            className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Active Contracts</h2>
        <Link to="/contracts" className="text-green-600 hover:text-green-800 text-sm font-medium">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contracts.slice(0, 4).map((contract) => (
          <div key={contract._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 truncate">{contract.product.name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                ${contract.status === 'active' ? 'bg-green-100 text-green-800' : 
                  contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'}`}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <FaLeaf className="mr-1" />
              <span>Farmer: {contract.farmer.name}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <FaCalendarAlt className="mr-1" />
              <span>Duration: {contract.duration} days</span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-900 font-medium">₹{formatCurrency(contract.totalValue)}</span>
              <Link 
                to={`/contracts/${contract._id}`}
                className="text-green-600 hover:text-green-900 text-sm"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Saved products component
const SavedProducts = ({ savedProducts, onRemove }) => {
  if (!savedProducts || savedProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Saved Products</h2>
          <Link to="/saved-products" className="text-green-600 hover:text-green-800 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="bg-gray-50 rounded-md p-8 text-center">
          <FaHeart className="mx-auto text-gray-400 text-4xl mb-3" />
          <p className="text-gray-500">You haven't saved any products yet.</p>
          <Link 
            to="/shop" 
            className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Discover Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Saved Products</h2>
        <Link to="/saved-products" className="text-green-600 hover:text-green-800 text-sm font-medium">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {savedProducts.slice(0, 4).map((product) => (
          <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0].url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FaLeaf className="text-gray-400 text-2xl" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-900 font-medium">₹{formatCurrency(product.price)}</span>
                <button 
                  onClick={() => onRemove(product._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaHeart />
                </button>
              </div>
              <Link 
                to={`/product/${product._id}`}
                className="mt-2 block text-center bg-green-600 text-white text-sm py-1 px-2 rounded hover:bg-green-700 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recommended products component
const RecommendedProducts = ({ products }) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Recommended For You</h2>
        <Link to="/shop" className="text-green-600 hover:text-green-800 text-sm font-medium">
          View More
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0].url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FaLeaf className="text-gray-400 text-2xl" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <FaMapMarkerAlt className="mr-1" />
                <span className="truncate">{product.farmer?.location || 'Location not available'}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-900 font-medium">₹{formatCurrency(product.price)}</span>
                <span className="text-xs text-gray-500">{product.unit}</span>
              </div>
              <Link 
                to={`/product/${product._id}`}
                className="mt-2 block text-center bg-green-600 text-white text-sm py-1 px-2 rounded hover:bg-green-700 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Search and filter section
const SearchSection = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for products, farmers, or categories..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Search
        </button>
      </form>
    </div>
  );
};

// Main customer dashboard component
const CustomerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeContracts: 0,
    savedProducts: 0,
    totalSpent: 0
  });
  const [orders, setOrders] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch orders
        const ordersResponse = await orderAPI.getAll();
        if (ordersResponse.success) {
          setOrders(ordersResponse.orders || []);
          
          // Calculate total spent
          const totalSpent = ordersResponse.orders.reduce((total, order) => {
            return total + (order.totalAmount || 0);
          }, 0);
          
          setStats(prev => ({
            ...prev,
            totalOrders: ordersResponse.orders.length,
            totalSpent
          }));
        }
        
        // Fetch contracts
        const contractsResponse = await contractAPI.getByBuyer(user._id);
        if (contractsResponse.success) {
          setContracts(contractsResponse.contracts || []);
          
          setStats(prev => ({
            ...prev,
            activeContracts: contractsResponse.contracts.filter(c => c.status === 'active').length
          }));
        }
        
        // Fetch saved products (this would be from a wishlist or favorites API)
        // For now, we'll use mock data
        const mockSavedProducts = [];
        setSavedProducts(mockSavedProducts);
        setStats(prev => ({
          ...prev,
          savedProducts: mockSavedProducts.length
        }));
        
        // Fetch recommended products
        const productsResponse = await productAPI.getAll();
        if (productsResponse.success) {
          setRecommendedProducts(productsResponse.products || []);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user && user._id) {
      fetchDashboardData();
    }
  }, [user]);

  const handleRemoveSavedProduct = (productId) => {
    // This would call an API to remove the product from saved/wishlist
    setSavedProducts(savedProducts.filter(p => p._id !== productId));
    toast.success('Product removed from saved items');
  };

  const handleSearch = (searchTerm) => {
    // This would navigate to search results page or filter the current view
    console.log('Searching for:', searchTerm);
    toast.success(`Searching for "${searchTerm}"`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={<FaShoppingBasket />} 
          title="Total Orders" 
          value={stats.totalOrders} 
          bgColor="bg-blue-600"
        />
        <StatCard 
          icon={<FaFileContract />} 
          title="Active Contracts" 
          value={stats.activeContracts} 
          bgColor="bg-green-600"
        />
        <StatCard 
          icon={<FaHeart />} 
          title="Saved Products" 
          value={stats.savedProducts} 
          bgColor="bg-purple-600"
        />
        <StatCard 
          icon={<FaChartLine />} 
          title="Total Spent" 
          value={`₹${formatCurrency(stats.totalSpent)}`} 
          bgColor="bg-orange-600"
        />
      </div>
      
      {/* Search Section */}
      <SearchSection onSearch={handleSearch} />
      
      {/* Recent Orders */}
      <RecentOrders orders={orders} />
      
      {/* Active Contracts */}
      <ActiveContracts contracts={contracts} />
      
      {/* Saved Products */}
      <SavedProducts 
        savedProducts={savedProducts} 
        onRemove={handleRemoveSavedProduct} 
      />
      
      {/* Recommended Products */}
      <RecommendedProducts products={recommendedProducts.slice(0, 4)} />
    </div>
  );
};

export default CustomerDashboard; 