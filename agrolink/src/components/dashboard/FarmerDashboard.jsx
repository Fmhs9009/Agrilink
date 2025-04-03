import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaUsers, FaShoppingCart, FaWarehouse, FaMoneyBillWave, 
  FaCalendarCheck, FaHandshake, FaSeedling, FaClipboardList, FaTractor, 
  FaChartBar, FaMapMarkerAlt, FaLeaf, FaEdit, FaEye, FaTrash, FaClock,
  FaCheckCircle, FaUser, FaExchangeAlt, FaSun, FaCloudRain, FaSearch,
  FaArrowRight, FaArrowUp, FaArrowDown, FaEllipsisV, FaInfoCircle,
  FaTimes, FaPlus, FaAppleAlt, FaFilter, FaExclamationTriangle, FaChartPie
} from 'react-icons/fa';
import { 
  Chart as ChartJS, 
  ArcElement, 
  LineElement, 
  BarElement, 
  PointElement, 
  CategoryScale, 
  LinearScale, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { useApi } from '../../hooks/useApi';
import { contractAPI, productAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays < 7) {
    return `${diffDays} days`;
  } else {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  }
};

const getContractCompletion = (contract) => {
  const startDate = new Date(contract.createdAt);
  const endDate = new Date(contract.expectedHarvestDate || contract.estimatedDeliveryDate);
  const today = new Date();
  
  if (today > endDate) return 100;
  
  const totalTime = endDate - startDate;
  const timeElapsed = today - startDate;
  
  if (totalTime <= 0) return 100;
  
  return Math.min(100, Math.round((timeElapsed / totalTime) * 100));
};

const getStatusBadge = (status) => {
  const badges = {
    active: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium',
    pending: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium',
    requested: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium',
    completed: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium',
    cancelled: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium',
    negotiating: 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium'
  };
  return badges[status] || badges.pending;
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow duration-300">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  </div>
);

// ProductGrid component displaying products in a card-based layout
const ProductGrid = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <motion.div 
        className="mt-8 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">My Products</h3>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaSeedling className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No products found</p>
          <p className="text-xs text-gray-400 mb-4">Add your first product to start receiving contract offers</p>
          <Link 
            to="/products/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <FaSeedling className="mr-2" />
            Add New Product
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="mt-8 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">My Products</h3>
        <Link
          to="/products/manage"
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Manage all products
        </Link>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <motion.div 
              key={product._id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <div className="relative">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0].url} 
                    alt={product.name} 
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <FaSeedling className="text-gray-400 text-4xl" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  {product.availableQuantity > 0 ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      In Stock
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-1">{product.name}</h4>
                <p className="text-sm text-gray-500 mb-3">
                  {product.category || 'Uncategorized'} • {formatCurrency(product.price || 0)} per {product.unit || 'kg'}
                </p>
                
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{product.availableQuantity || 0}</span> {product.unit || 'kg'} available
                  </div>
                  
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    product.organic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {product.organic ? 'Organic' : 'Standard'}
                  </div>
                </div>
                
                <div className="flex justify-between space-x-2">
                  <Link 
                    to={`/products/edit/${product._id}`}
                    className="inline-flex items-center justify-center flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FaEdit className="mr-1.5 h-4 w-4" /> Edit
                  </Link>
                  <Link 
                    to={`/products/${product._id}`}
                    className="inline-flex items-center justify-center flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <FaEye className="mr-1.5 h-4 w-4" /> View
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Add New Product Card */}
          <motion.div 
            className="bg-gray-50 border border-dashed border-gray-300 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors flex items-center justify-center"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <Link 
              to="/products/add"
              className="p-6 flex flex-col items-center justify-center text-center h-full w-full"
            >
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <FaPlus className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-1">Add New Product</h4>
              <p className="text-sm text-gray-500">
                Add a new product to your inventory
              </p>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// FarmInsights component to display analytics and insights
const FarmInsights = ({ contracts, products }) => {
  if (!contracts || !products) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Farm Insights</h3>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaChartBar className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No insights available</p>
          <p className="text-xs text-gray-400">Start by adding products and accepting contracts to see insights</p>
        </div>
      </motion.div>
    );
  }

  // Calculate revenue trends for the last 6 months
  const getRevenueTrends = () => {
    const months = [];
    const revenues = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleString('default', { month: 'short' }));
      
      const monthRevenue = contracts
        .filter(c => {
          const contractDate = new Date(c.createdAt);
          return contractDate.getMonth() === date.getMonth() && 
                 contractDate.getFullYear() === date.getFullYear() &&
                 c.status === 'completed';
        })
        .reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0);
      
      revenues.push(monthRevenue);
    }
    
    return { months, revenues };
  };

  // Calculate sales by category
  const getSalesByCategory = () => {
    const categorySales = {};
    
    contracts
      .filter(c => c.status === 'completed')
      .forEach(contract => {
        const category = contract.product?.category || 'Uncategorized';
        categorySales[category] = (categorySales[category] || 0) + (parseFloat(contract.totalAmount) || 0);
      });
    
    return Object.entries(categorySales)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Get top performing products
  const getTopProducts = () => {
    const productSales = {};
    
    contracts
      .filter(c => c.status === 'completed')
      .forEach(contract => {
        const productName = contract.product?.name || 
                          (contract.productId ? 'Product ' + contract.productId : 'Unknown Product');
        productSales[productName] = (productSales[productName] || 0) + (parseFloat(contract.totalAmount) || 0);
      });
    
    return Object.entries(productSales)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const { months, revenues } = getRevenueTrends();
  const categorySales = getSalesByCategory();
  const topProducts = getTopProducts();

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Farm Insights</h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trends Chart */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Revenue Trends</h4>
            <div className="h-64">
              <Line
                data={{
                  labels: months,
                  datasets: [
                    {
                      label: 'Monthly Revenue',
                      data: revenues,
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      tension: 0.4,
                      fill: true
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: value => formatCurrency(value)
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* Sales by Category Chart */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Sales by Category</h4>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: categorySales.map(c => c.category),
                  datasets: [
                    {
                      data: categorySales.map(c => c.amount),
                      backgroundColor: [
                        'rgb(34, 197, 94)',
                        'rgb(59, 130, 246)',
                        'rgb(168, 85, 247)',
                        'rgb(236, 72, 153)',
                        'rgb(234, 179, 8)'
                      ]
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right'
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* Top Performing Products */}
          <div className="bg-white rounded-lg p-4 lg:col-span-2">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Top Performing Products</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <FaLeaf className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency(product.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// WelcomeHeader component for farmer dashboard
const WelcomeHeader = ({ user, stats, weatherData }) => {
  // Calculate the time of day for personalized greeting
  const hour = new Date().getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12 && hour < 17) timeGreeting = "Good Afternoon";
  if (hour >= 17) timeGreeting = "Good Evening";

  // Calculate the next harvest date
  const upcomingHarvests = stats?.upcomingHarvests || [];
  const nextHarvest = upcomingHarvests.length > 0 
    ? new Date(upcomingHarvests[0].expectedHarvestDate) 
    : null;

  // Get weather data (fallback to default if not available)
  const weather = weatherData || {
    location: 'Your Farm',
    currentTemp: 28,
    condition: 'Partly Cloudy',
    humidity: 65, 
    windSpeed: 12
  };

  // Helper function to get weather icon
  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <FaSun className="text-yellow-500" />;
      case 'rainy':
      case 'rain':
        return <FaCloudRain className="text-blue-500" />;
      default:
        return <FaCloudRain className="text-gray-500" />;
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-xl p-6 mb-6 text-white"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col lg:flex-row justify-between">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-3xl font-bold mb-1">{timeGreeting}, {user?.name?.split(' ')[0] || 'Farmer'}!</h1>
          <p className="text-blue-100 mb-4">Your Farm Management Dashboard</p>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <motion.div 
              className="relative bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="mr-3 p-2 bg-white bg-opacity-30 rounded-full">
                <FaSeedling className="text-white text-xl" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.activeProducts || 0}</div>
                <div className="text-xs">Active Crops</div>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="mr-3 p-2 bg-white bg-opacity-30 rounded-full">
                <FaCalendarCheck className="text-white text-xl" />
              </div>
              <div>
                <div className="text-xl font-bold">{nextHarvest ? formatShortDate(nextHarvest) : 'N/A'}</div>
                <div className="text-xs">Next Harvest</div>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative bg-white bg-opacity-20 p-4 rounded-lg backdrop-blur-sm flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="mr-3 p-2 bg-white bg-opacity-30 rounded-full">
                <FaUsers className="text-white text-xl" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.customerCount || 0}</div>
                <div className="text-xs">Customers</div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-white mr-2" />
              <span className="text-sm">{weather.location}</span>
            </div>
            <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">Today</span>
          </div>
          
          <div className="flex items-center mb-3">
            <div className="text-4xl mr-4">
              {getWeatherIcon(weather.condition)}
            </div>
            <div>
              <div className="text-3xl font-bold">{weather.currentTemp}°C</div>
              <div className="text-sm opacity-80">{weather.condition}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white bg-opacity-10 p-2 rounded-lg">
              <span className="opacity-80">Humidity</span>
              <div className="font-medium">{weather.humidity}%</div>
            </div>
            <div className="bg-white bg-opacity-10 p-2 rounded-lg">
              <span className="opacity-80">Wind</span>
              <div className="font-medium">{weather.windSpeed} km/h</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-5">
        <Link 
          to="/products/add" 
          className="inline-flex items-center px-4 py-2 border border-white bg-white bg-opacity-10 hover:bg-opacity-20 rounded-md font-medium text-white transition-all"
        >
          <FaSeedling className="mr-2" />
          Add New Product
        </Link>
        <Link 
          to="/contracts/manage" 
          className="inline-flex items-center px-4 py-2 border border-white border-opacity-50 rounded-md font-medium text-white hover:bg-white hover:bg-opacity-10 transition-all"
        >
          <FaHandshake className="mr-2" />
          Manage Contracts
        </Link>
      </div>
    </motion.div>
  );
};

// ContractStatusChart component to display contract status distribution
const ContractStatusChart = ({ contracts }) => {
  if (!contracts || contracts.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6 h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Contract Status</h3>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaChartPie className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No contract data available</p>
          <p className="text-xs text-gray-400">Contract status will appear here</p>
        </div>
      </motion.div>
    );
  }

  // Calculate status counts
  const statusCounts = {
    pending: contracts.filter(c => c.status === 'pending' || c.status === 'requested').length,
    active: contracts.filter(c => c.status === 'active').length,
    completed: contracts.filter(c => c.status === 'completed').length,
    cancelled: contracts.filter(c => c.status === 'cancelled').length,
    negotiating: contracts.filter(c => c.status === 'negotiating').length
  };

  const totalContracts = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  // Prepare data for the chart
  const chartData = {
    labels: ['Pending', 'Active', 'Completed', 'Cancelled', 'Negotiating'],
    datasets: [
      {
        data: [
          statusCounts.pending,
          statusCounts.active,
          statusCounts.completed,
          statusCounts.cancelled,
          statusCounts.negotiating
        ],
        backgroundColor: [
          '#FCD34D', // yellow-400
          '#34D399', // green-400
          '#60A5FA', // blue-400
          '#F87171', // red-400
          '#A78BFA'  // purple-400
        ],
        borderColor: [
          '#FBBF24', // yellow-500
          '#10B981', // green-500
          '#3B82F6', // blue-500
          '#EF4444', // red-500
          '#8B5CF6'  // purple-500
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = totalContracts > 0 ? Math.round((value / totalContracts) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%'
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Contract Status</h3>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[200px] h-[200px] mb-4">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
          
          <div className="w-full mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                <span className="text-sm text-gray-600">Pending</span>
                <span className="ml-auto text-sm font-medium">{statusCounts.pending}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                <span className="text-sm text-gray-600">Active</span>
                <span className="ml-auto text-sm font-medium">{statusCounts.active}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span className="text-sm text-gray-600">Completed</span>
                <span className="ml-auto text-sm font-medium">{statusCounts.completed}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
                <span className="ml-auto text-sm font-medium">{statusCounts.cancelled}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                <span className="text-sm text-gray-600">Negotiating</span>
                <span className="ml-auto text-sm font-medium">{statusCounts.negotiating}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <span className="text-sm font-medium text-gray-800">Total</span>
                <span className="ml-auto text-sm font-medium">{totalContracts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Link
          to="/contracts/manage"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center md:justify-start"
        >
          View all contracts
          <FaArrowRight className="ml-1 text-xs" />
        </Link>
      </div>
    </motion.div>
  );
};

// RecentContractsTimeline component to show recent contract activity
const RecentContractsTimeline = ({ contracts }) => {
  if (!contracts || contracts.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6 h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Contract Activity</h3>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaHandshake className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No recent contract activity</p>
          <p className="text-xs text-gray-400 mb-4">New contract activity will appear here</p>
        </div>
      </motion.div>
    );
  }

  // Sort contracts by last updated date
  const sortedContracts = [...contracts]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'border-green-500';
      case 'pending': case 'requested': return 'border-yellow-500';
      case 'completed': return 'border-blue-500';
      case 'cancelled': return 'border-red-500';
      case 'negotiating': return 'border-purple-500';
      case 'readyForHarvest': return 'border-orange-500';
      case 'harvested': return 'border-teal-500';
      case 'delivered': return 'border-indigo-500';
      case 'disputed': return 'border-pink-500';
      default: return 'border-gray-500';
    }
  };

  // Helper function to get status icon and icon color
  const getStatusIconDetails = (status) => {
    switch (status) {
      case 'active': 
        return { icon: <FaHandshake />, bgColor: 'bg-green-100', iconColor: 'text-green-600' };
      case 'pending': case 'requested': 
        return { icon: <FaClipboardList />, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' };
      case 'completed': 
        return { icon: <FaCheckCircle />, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' };
      case 'cancelled': 
        return { icon: <FaTimes />, bgColor: 'bg-red-100', iconColor: 'text-red-600' };
      case 'negotiating': 
        return { icon: <FaExchangeAlt />, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' };
      case 'readyForHarvest':
        return { icon: <FaSeedling />, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' };
      case 'harvested':
        return { icon: <FaLeaf />, bgColor: 'bg-teal-100', iconColor: 'text-teal-600' };
      case 'delivered':
        return { icon: <FaShoppingCart />, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' };
      case 'disputed':
        return { icon: <FaExclamationTriangle />, bgColor: 'bg-pink-100', iconColor: 'text-pink-600' };
      default: 
        return { icon: <FaClipboardList />, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' };
    }
  };

  // Helper function to get activity message
  const getActivityMessage = (contract) => {
    const statusForDisplay = contract.status === 'requested' ? 'pending' : contract.status;
    
    switch (statusForDisplay) {
      case 'active': return 'Contract activated';
      case 'pending': return 'New contract offer received';
      case 'completed': return 'Contract completed';
      case 'cancelled': return 'Contract cancelled';
      case 'negotiating': return 'Contract under negotiation';
      case 'readyForHarvest': return 'Crop ready for harvest';
      case 'harvested': return 'Crop harvested';
      case 'delivered': return 'Crop delivered';
      case 'disputed': return 'Contract disputed';
      default: return 'Contract updated';
    }
  };
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Contract Activity</h3>
      </div>

      <div className="p-4">
        <div className="flow-root">
          <ul className="-mb-8">
            {sortedContracts.map((contract, contractIdx) => {
              // Extract product and buyer names
              const productName = contract.product?.name || contract.crop?.name || 
                                (contract.productId ? 'Product ' + contract.productId : 'Unknown Product');
              
              const buyerName = contract.buyer?.email || 
                               (contract.buyerId ? 'Buyer ' + contract.buyerId : 'Unknown Buyer');
              
              // Convert status for display (requested -> pending)
              const displayStatus = contract.status === 'requested' ? 'pending' : contract.status;
              
              // Get status styling
              const borderColor = getStatusColor(contract.status);
              const { icon, bgColor, iconColor } = getStatusIconDetails(contract.status);
              const activityMessage = getActivityMessage(contract);

              // Format contract details
              const quantity = contract.quantity || 0;
              const unit = contract.unit || 'kg';
              const pricePerUnit = contract.pricePerUnit || 0;
              const totalAmount = contract.totalAmount || (quantity * pricePerUnit) || 0;
              
              // Format dates
              const createdDate = formatDate(contract.createdAt || contract.requestDate);
              const expectedHarvestDate = contract.expectedHarvestDate ? formatDate(contract.expectedHarvestDate) : 'Not specified';
              const deliveryDate = contract.deliveryDate ? formatDate(contract.deliveryDate) : 'Not specified';
              
              return (
                <li key={contract._id}>
                  <div className="relative pb-8">
                    {contractIdx !== sortedContracts.length - 1 ? (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className={`relative px-1`}>
                        <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center ring-8 ring-white`}>
                          <span className={`${iconColor}`}>{icon}</span>
                        </div>
                      </div>
                      <div className={`min-w-0 flex-1 border-l-4 ${borderColor} pl-4 py-2 rounded-r bg-gray-50`}>
                        <div>
                          <div className="text-sm">
                            <Link 
                              to={`/contracts/${contract._id}`} 
                              className="font-medium text-gray-900 hover:underline"
                            >
                              {activityMessage}
                            </Link>
                          </div>
                          <p className="mt-1 text-sm text-gray-700">
                            <span className="font-medium">{productName}</span> with {buyerName}
                          </p>
                        </div>
                        
                        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-gray-500">
                            <span className="font-medium">Quantity:</span> {quantity} {unit}
                          </div>
                          <div className="text-gray-500">
                            <span className="font-medium">Price:</span> {formatCurrency(pricePerUnit)} per {unit}
                          </div>
                          <div className="text-gray-500">
                            <span className="font-medium">Expected Harvest:</span> {expectedHarvestDate}
                          </div>
                          <div className="text-gray-500">
                            <span className="font-medium">Delivery Date:</span> {deliveryDate}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={getStatusBadge(displayStatus)}>
                              {displayStatus}
                            </span>
                            <span className="font-medium text-sm text-gray-700">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {createdDate}
                          </span>
                        </div>
                        
                        {(contract.status === 'pending' || contract.status === 'requested') && (
                          <div className="mt-2 flex items-center space-x-2">
                            <button 
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                toast.promise(
                                  contractAPI.updateStatus(contract._id, 'active'),
                                  {
                                    loading: 'Accepting contract...',
                                    success: 'Contract accepted!',
                                    error: 'Failed to accept contract',
                                  }
                                );
                              }}
                            >
                              Accept Offer
                            </button>
                            <button 
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              onClick={() => {
                                toast.promise(
                                  contractAPI.updateStatus(contract._id, 'cancelled'),
                                  {
                                    loading: 'Rejecting contract...',
                                    success: 'Contract rejected',
                                    error: 'Failed to reject contract',
                                  }
                                );
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Link
          to="/contracts/manage"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center md:justify-start"
        >
          View all contract activity
          <FaArrowRight className="ml-1 text-xs" />
        </Link>
      </div>
    </motion.div>
  );
};

// UpcomingHarvests component to display upcoming harvests
const UpcomingHarvests = ({ contracts }) => {
  if (!contracts || contracts.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Upcoming Harvests</h3>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaCalendarCheck className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No upcoming harvests</p>
          <p className="text-xs text-gray-400">Active contracts will show their harvest dates here</p>
        </div>
      </motion.div>
    );
  }

  // Filter and sort upcoming harvests
  const upcomingHarvests = contracts
    .filter(c => 
      c.status === 'active' && 
      c.expectedHarvestDate && 
      new Date(c.expectedHarvestDate) > new Date()
    )
    .sort((a, b) => new Date(a.expectedHarvestDate) - new Date(b.expectedHarvestDate))
    .slice(0, 5);

  if (upcomingHarvests.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Upcoming Harvests</h3>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaCalendarCheck className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No upcoming harvests</p>
          <p className="text-xs text-gray-400">Active contracts will show their harvest dates here</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Upcoming Harvests</h3>
        <Link
          to="/contracts/manage?status=active"
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          View all active contracts
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100">
        {upcomingHarvests.map((contract, index) => {
          const harvestDate = new Date(contract.expectedHarvestDate);
          const daysUntilHarvest = Math.ceil((harvestDate - new Date()) / (1000 * 60 * 60 * 24));
          
          // Get product name
          const productName = contract.product?.name || contract.crop?.name || 
                            (contract.productId ? 'Product ' + contract.productId : 'Unknown Product');
          
          // Get buyer name
          const buyerName = contract.buyer?.name || 
                           (contract.buyerId ? 'Buyer ' + contract.buyerId : 'Unknown Buyer');
          
          // Calculate progress
          const progress = getContractCompletion(contract);
          
          return (
            <div key={contract._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaLeaf className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{productName}</h4>
                      <p className="text-xs text-gray-500">Contract with {buyerName}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Harvest Date: {formatDate(contract.expectedHarvestDate)}</span>
                      <span>{daysUntilHarvest} days remaining</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <Link
                    to={`/contracts/${contract._id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <Link
          to="/contracts/manage?status=active"
          className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center justify-center md:justify-start"
        >
          View all active contracts
          <FaArrowRight className="ml-1 text-xs" />
        </Link>
      </div>
    </motion.div>
  );
};

const FarmerDashboard = () => {
  const user = useSelector((state) => state.auth.loginData);

  const { data: dashboardData, loading, error, refetch } = useApi(async () => {
    try {
      let productsRes;
      
      // Get products based on user role
      if (user?.role === 'admin') {
        console.log("Dashboard: Fetching all products for admin");
        productsRes = await productAPI.getAll();
      } else {
        // Farmers see only their products
        console.log("Dashboard: Fetching products for farmer with ID:", user?._id);
        productsRes = user?._id ? await productAPI.getByFarmer(user._id) : { data: [] };
      }
      
      // Try to fetch contracts from farmer's endpoint first
      console.log("Dashboard: Fetching farmer contracts for ID:", user?._id);
      const contractsRes = await contractAPI.getByFarmer(user?._id);
      console.log("Farmer contracts API response:", contractsRes);

      // Ensure data is in the expected format for products
      const products = Array.isArray(productsRes.data) ? productsRes.data : 
                      (productsRes.data?.products || []);
      
      // Handle different possible contract response formats
      let contracts = [];
      
      if (Array.isArray(contractsRes)) {
        // If response is already an array
        contracts = contractsRes;
      } else if (contractsRes.contracts && Array.isArray(contractsRes.contracts)) {
        // If contracts property exists at root level
        contracts = contractsRes.contracts;
      } else if (contractsRes.data && Array.isArray(contractsRes.data)) {
        // If data property is an array
        contracts = contractsRes.data;
      } else if (contractsRes.data && contractsRes.data.contracts && Array.isArray(contractsRes.data.contracts)) {
        // If contracts is nested under data
        contracts = contractsRes.data.contracts;
      }
      
      // console.log("Dashboard processed contracts:", contracts);
      
      if (contracts.length === 0) {
        // console.log("No contracts found for farmer, trying general endpoint as fallback");
        // If no contracts found, try the general endpoint
        const allContractsRes = await contractAPI.getAll();
        // console.log("All contracts response:", allContractsRes);
        
        // Extract contracts from the general response
        if (Array.isArray(allContractsRes)) {
          contracts = allContractsRes;
        } else if (allContractsRes.contracts && Array.isArray(allContractsRes.contracts)) {
          contracts = allContractsRes.contracts;
        } else if (allContractsRes.data && Array.isArray(allContractsRes.data)) {
          contracts = allContractsRes.data;
        } else if (allContractsRes.data && allContractsRes.data.contracts && Array.isArray(allContractsRes.data.contracts)) {
          contracts = allContractsRes.data.contracts;
        }
        
        // Filter for this farmer's contracts if we found any
        if (contracts.length > 0 && user?._id) {
          console.log("Filtering general contracts for this farmer");
          // Filter by farmerId or farmer._id depending on the data structure
          contracts = contracts.filter(c => 
            (c.farmerId === user._id) || 
            (c.farmer && (c.farmer._id === user._id || c.farmer === user._id))
          );
        }
      }
      
      // Now safely use array methods with better error handling
      const activeContracts = contracts.filter(c => c?.status === 'active').length;
      const pendingContracts = contracts.filter(c => c?.status === 'pending' || c?.status === 'requested').length;
      const completedContracts = contracts.filter(c => c?.status === 'completed').length;
      
      const totalRevenue = contracts
        .filter(c => c?.status === 'completed')
        .reduce((sum, c) => sum + (parseFloat(c?.totalAmount) || 0), 0);
      
      // Find unique buyers (customers)
      const uniqueBuyerIds = new Set();
      contracts.forEach(contract => {
        if (contract.buyerId) uniqueBuyerIds.add(contract.buyerId);
        else if (contract.buyer && contract.buyer._id) uniqueBuyerIds.add(contract.buyer._id);
      });
      
      // Find upcoming harvests
      const upcomingHarvests = contracts
        .filter(c => 
          c.status === 'active' && 
          c.expectedHarvestDate && 
          new Date(c.expectedHarvestDate) > new Date()
        )
        .sort((a, b) => new Date(a.expectedHarvestDate) - new Date(b.expectedHarvestDate));
      
      // Active products count (those with stock)
      const activeProducts = products.filter(p => p.availableQuantity > 0).length;
      
      // Mock weather data - would be replaced with actual API call in production
      const weatherData = {
        location: 'Your Farm',
        currentTemp: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        highTemp: 32,
        lowTemp: 24,
        forecast: [
          { day: 'Today', temp: 28, condition: 'Partly Cloudy' },
          { day: 'Tomorrow', temp: 30, condition: 'Sunny' },
          { day: 'Wednesday', temp: 29, condition: 'Rainy' },
          { day: 'Thursday', temp: 28, condition: 'Rainy' },
          { day: 'Friday', temp: 31, condition: 'Sunny' }
        ]
      };

      return {
        stats: {
          totalProducts: products.length,
          activeProducts,
          activeContracts,
          pendingContracts,
          totalRevenue,
          completedContracts,
          customerCount: uniqueBuyerIds.size,
          upcomingHarvests
        },
        weatherData,
        contracts,
        products,
        upcomingHarvests
      };
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      throw new Error("Failed to load dashboard data. Please try again.");
    }
  }, [user]);

  // Accept contract handler
  const handleAcceptContract = async (contractId) => {
    try {
      await toast.promise(
        contractAPI.updateStatus(contractId, 'active'),
        {
          loading: 'Accepting contract...',
          success: 'Contract accepted!',
          error: 'Failed to accept contract'
        }
      );
      refetch(); // Refresh dashboard data
    } catch (error) {
      console.error("Error accepting contract:", error);
    }
  };

  // Reject contract handler
  const handleRejectContract = async (contractId) => {
    try {
      await toast.promise(
        contractAPI.updateStatus(contractId, 'cancelled'),
        {
          loading: 'Rejecting contract...',
          success: 'Contract rejected',
          error: 'Failed to reject contract'
        }
      );
      refetch(); // Refresh dashboard data
    } catch (error) {
      console.error("Error rejecting contract:", error);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm">{error.message || error}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading your farm dashboard..." />;
  }
  
  // Check if this is a new user with no data
  const isNewUser = !dashboardData?.products?.length && !dashboardData?.contracts?.length;

  return (
    <ErrorBoundary>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Welcome banner for new users */}
          {isNewUser && (
            <motion.div 
              className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaInfoCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Welcome to AgroLink!</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Get started by adding your farm products to make them available for contract farming.
                      Once you add products, customers can request contracts with you.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link
                      to="/products/add"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FaSeedling className="mr-2 -ml-1 h-4 w-4" /> Add Your First Product
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Welcome Header with Weather */}
          <WelcomeHeader 
            user={user} 
            stats={dashboardData?.stats || {}} 
            weatherData={dashboardData?.weatherData} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Contract Status Chart */}
            <div className="lg:col-span-1 flex flex-col">
              <ContractStatusChart contracts={dashboardData?.contracts || []} />
            </div>
            
            {/* Recent Contract Activity */}
            <div className="lg:col-span-2 flex flex-col">
              <RecentContractsTimeline contracts={dashboardData?.contracts || []} />
            </div>
          </div>
          
          {/* Upcoming Harvests */}
          <UpcomingHarvests contracts={dashboardData?.contracts || []} />
          
          {/* Products Grid */}
          <ProductGrid products={dashboardData?.products || []} />
          
          {/* Farm Insights */}
          <FarmInsights contracts={dashboardData?.contracts || []} products={dashboardData?.products || []} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default FarmerDashboard; 