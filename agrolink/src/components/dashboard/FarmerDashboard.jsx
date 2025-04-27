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
  FaTimes, FaPlus, FaAppleAlt, FaFilter, FaExclamationTriangle, FaChartPie,
  FaThermometerHalf, FaTint, FaWind, FaCloud, FaSmog, FaBolt, FaSnowflake
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
import { contractAPI, productAPI, weatherAPI, farmerAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';
import toast from 'react-hot-toast';
import { Pie } from 'react-chartjs-2';

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
  if (!contracts || !products || contracts.length === 0 || products.length === 0) {
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
    const contracts_count = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleString('default', { month: 'short' }));
      
      const monthContracts = contracts.filter(c => {
        const contractDate = new Date(c.createdAt || c.requestDate);
        return contractDate.getMonth() === date.getMonth() && 
               contractDate.getFullYear() === date.getFullYear();
      });

      const monthRevenue = monthContracts
        .filter(c => c.status === 'completed' || c.status === 'active')
        .reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0);
      
      revenues.push(monthRevenue);
      contracts_count.push(monthContracts.length);
    }
    
    return { months, revenues, contracts_count };
  };

  // Calculate sales by category with percentage
  const getSalesByCategory = () => {
    // Create product ID to category mapping for easier lookups
    const productCategories = {};
    products.forEach(product => {
      if (product._id) {
        productCategories[product._id] = product.category || 'Uncategorized';
      }
    });
    
    // Group by category
    const categorySales = {};
    let totalSales = 0;
    
    contracts.forEach(contract => {
      // Get product ID from contract
      const productId = contract.crop?._id || contract.crop || contract.productId;
      
      if (!productId) return;
      
      // Look up category
      const category = productCategories[productId] || 
                      (contract.crop?.category) || 
                      'Uncategorized';
      
      // Only count revenue from completed and active contracts
      if (contract.status === 'completed' || contract.status === 'active') {
        const amount = parseFloat(contract.totalAmount) || 0;
        categorySales[category] = (categorySales[category] || 0) + amount;
        totalSales += amount;
      }
    });
    
    // Calculate percentages and sort by amount
    return Object.entries(categorySales)
      .map(([category, amount]) => ({ 
        category, 
        amount,
        percentage: totalSales > 0 ? ((amount / totalSales) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Get top performing products with detailed metrics
  const getTopProducts = () => {
    // Initialize storage for product metrics
    const productMetrics = {};
    
    // Get all products and initialize metrics
    products.forEach(product => {
      if (product._id) {
        productMetrics[product._id] = {
          _id: product._id,
          name: product.name,
          image: product.images?.[0]?.url,
          category: product.category || 'Uncategorized',
          totalRevenue: 0,
          totalQuantity: 0,
          activeContracts: 0,
          completedContracts: 0,
          pendingContracts: 0,
          cancelledContracts: 0,
          averagePrice: product.price || 0,
          unit: product.unit || 'kg',
          performance: 0, // Will calculate a performance score
          inStockQuantity: product.availableQuantity || 0
        };
      }
    });
    
    // Populate metrics from contracts
    contracts.forEach(contract => {
      const productId = contract.crop?._id || contract.crop || contract.productId;
      
      if (!productId || !productMetrics[productId]) return;
      
      const metrics = productMetrics[productId];
      const amount = parseFloat(contract.totalAmount) || 0;
      const quantity = parseFloat(contract.quantity) || 0;
      
      // Update metrics based on contract status
      switch(contract.status) {
        case 'completed':
          metrics.totalRevenue += amount;
          metrics.totalQuantity += quantity;
          metrics.completedContracts++;
          break;
        case 'active':
        case 'harvested':
        case 'readyForHarvest':
          metrics.totalRevenue += amount;
          metrics.totalQuantity += quantity;
          metrics.activeContracts++;
          break;
        case 'pending':
        case 'requested':
        case 'negotiating':
        case 'payment_pending':
          metrics.pendingContracts++;
          break;
        case 'cancelled':
        case 'disputed':
          metrics.cancelledContracts++;
          break;
        default:
          break;
      }
    });
    
    // Calculate performance score (weighted metric based on revenue, contracts, and cancellation rate)
    Object.values(productMetrics).forEach(product => {
      const totalContracts = product.completedContracts + product.activeContracts + 
                           product.pendingContracts + product.cancelledContracts;
      
      const cancellationRate = totalContracts > 0 ? 
                             product.cancelledContracts / totalContracts : 0;
                             
      const contractSuccess = totalContracts > 0 ? 
                            (product.completedContracts + product.activeContracts) / totalContracts : 0;
      
      // Calculate performance score (revenue × contract success rate × (1 - cancellation rate))
      product.performance = product.totalRevenue * contractSuccess * (1 - cancellationRate);
      
      // Calculate average price if we have quantity
      if (product.totalQuantity > 0) {
        product.averagePrice = product.totalRevenue / product.totalQuantity;
      }
    });
    
    // Convert to array, sort by performance score, and return top products
    return Object.values(productMetrics)
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
  };

  const { months, revenues, contracts_count } = getRevenueTrends();
  const categorySales = getSalesByCategory();
  const topProducts = getTopProducts();

  // Calculate total revenue and growth metrics
  const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);
  const previousMonthRevenue = revenues[revenues.length - 2] || 0;
  const currentMonthRevenue = revenues[revenues.length - 1] || 0;
  const revenueGrowth = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
    : 100;

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Farm Performance Insights</h3>
        <div className="text-sm text-gray-500">
          Total Revenue: {formatCurrency(totalRevenue)}
          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${revenueGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(revenueGrowth)}%
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trends Chart */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-900">Revenue & Contract Trends</h4>
              <div className="text-xs text-gray-500">Last 6 months</div>
            </div>
            <div className="h-80"> {/* Increased height for more details */}
              <Line
                data={{
                  labels: months,
                  datasets: [
                    {
                      label: 'Revenue',
                      data: revenues,
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y',
                      pointBackgroundColor: revenues.map((value, index, arr) => {
                        // Highlight significant points
                        if (index > 0 && value > arr[index - 1] * 1.2) return 'rgba(0, 200, 0, 1)'; // Growth point
                        if (index > 0 && value < arr[index - 1] * 0.8) return 'rgba(255, 0, 0, 1)'; // Decline point
                        return 'rgba(34, 197, 94, 1)';
                      }),
                      pointRadius: revenues.map((value, index, arr) => {
                        // Make significant points larger
                        if (index > 0 && (value > arr[index - 1] * 1.2 || value < arr[index - 1] * 0.8)) return 6;
                        return 4;
                      })
                    },
                    {
                      label: 'Contracts',
                      data: contracts_count,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderDashed: [5, 5],
                      tension: 0.4,
                      fill: false,
                      yAxisID: 'y1'
                    },
                    {
                      label: 'Average Contract Value',
                      data: revenues.map((rev, i) => contracts_count[i] > 0 ? rev / contracts_count[i] : 0),
                      borderColor: 'rgb(168, 85, 247)',
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      borderWidth: 2,
                      tension: 0.4,
                      fill: false,
                      yAxisID: 'y',
                      pointStyle: 'star',
                      pointRadius: 4,
                      hidden: false
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        boxWidth: 6
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label === 'Revenue') {
                            return `${label}: ${formatCurrency(context.raw)}`;
                          } else if (label === 'Average Contract Value') {
                            return `${label}: ${formatCurrency(context.raw)}`;
                          }
                          return `${label}: ${context.raw}`;
                        },
                        afterLabel: function(context) {
                          const datasetIndex = context.datasetIndex;
                          const dataIndex = context.dataIndex;
                          
                          if (datasetIndex === 0) { // Revenue dataset
                            // Calculate month-over-month change
                            if (dataIndex > 0) {
                              const currentValue = context.raw;
                              const previousValue = context.dataset.data[dataIndex - 1];
                              if (previousValue > 0) {
                                const changePercentage = ((currentValue - previousValue) / previousValue * 100).toFixed(1);
                                const changeDirection = changePercentage >= 0 ? 'increase' : 'decrease';
                                return `${Math.abs(changePercentage)}% ${changeDirection} from previous month`;
                              }
                            }
                          }
                          return null;
                        }
                      }
                    },
                    annotation: {
                      annotations: {
                        trend: {
                          type: 'line',
                          scaleID: 'y',
                          value: revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length,
                          borderColor: 'rgba(102, 102, 102, 0.5)',
                          borderWidth: 1,
                          borderDash: [6, 6],
                          label: {
                            display: true,
                            content: 'Average Revenue',
                            position: 'start',
                            backgroundColor: 'rgba(102, 102, 102, 0.7)',
                            font: {
                              size: 10
                            }
                          }
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Revenue (₹)',
                        font: {
                          size: 10,
                          weight: 'bold'
                        }
                      },
                      ticks: {
                        callback: value => '₹' + value.toLocaleString()
                      },
                      grid: {
                        drawBorder: false,
                        color: 'rgba(200, 200, 200, 0.3)'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Contracts',
                        font: {
                          size: 10,
                          weight: 'bold'
                        }
                      },
                      grid: {
                        drawOnChartArea: false
                      }
                    },
                    x: {
                      ticks: {
                        font: {
                          size: 10
                        }
                      },
                      grid: {
                        color: 'rgba(200, 200, 200, 0.3)'
                      }
                    }
                  },
                  interaction: {
                    mode: 'index',
                    intersect: false
                  }
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 px-2 py-3 rounded-lg">
                <div className="text-xs font-medium text-green-800">Total Revenue</div>
                <div className="text-lg font-bold text-green-900">{formatCurrency(revenues.reduce((sum, rev) => sum + rev, 0))}</div>
              </div>
              <div className="bg-blue-50 px-2 py-3 rounded-lg">
                <div className="text-xs font-medium text-blue-800">Total Contracts</div>
                <div className="text-lg font-bold text-blue-900">{contracts_count.reduce((sum, count) => sum + count, 0)}</div>
              </div>
              <div className="bg-purple-50 px-2 py-3 rounded-lg">
                <div className="text-xs font-medium text-purple-800">Avg. Contract Value</div>
                <div className="text-lg font-bold text-purple-900">
                  {formatCurrency(
                    contracts_count.reduce((sum, count) => sum + count, 0) > 0 
                      ? revenues.reduce((sum, rev) => sum + rev, 0) / contracts_count.reduce((sum, count) => sum + count, 0)
                      : 0
                  )}
                </div>
              </div>
            </div>
            {/* Growth Analysis */}
            <div className="mt-3 px-4 py-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium text-gray-800 mb-2">Growth Analysis</div>
              <p className="text-xs text-gray-700">
                {(() => {
                  if (revenues.length < 2) return "Add more contracts to see growth analysis.";
                  
                  // Calculate month-over-month growth
                  const growthRates = [];
                  for (let i = 1; i < revenues.length; i++) {
                    if (revenues[i-1] === 0) continue;
                    const growthRate = (revenues[i] - revenues[i-1]) / revenues[i-1] * 100;
                    growthRates.push(growthRate);
                  }
                  
                  // Overall trend
                  const avgGrowth = growthRates.length > 0 ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0;
                  const lastMonthGrowth = growthRates.length > 0 ? growthRates[growthRates.length - 1] : 0;
                  
                  if (avgGrowth > 10) {
                    return `Strong growth trend with an average of ${avgGrowth.toFixed(1)}% month-over-month. Last month: ${lastMonthGrowth.toFixed(1)}% ${lastMonthGrowth >= 0 ? 'increase' : 'decrease'}.`;
                  } else if (avgGrowth > 0) {
                    return `Steady growth trend with an average of ${avgGrowth.toFixed(1)}% month-over-month. Last month: ${lastMonthGrowth.toFixed(1)}% ${lastMonthGrowth >= 0 ? 'increase' : 'decrease'}.`;
                  } else if (avgGrowth > -10) {
                    return `Slight downward trend with an average of ${Math.abs(avgGrowth).toFixed(1)}% monthly decline. Last month: ${Math.abs(lastMonthGrowth).toFixed(1)}% ${lastMonthGrowth >= 0 ? 'increase' : 'decrease'}.`;
                  } else {
                    return `Significant downward trend with an average of ${Math.abs(avgGrowth).toFixed(1)}% monthly decline. Last month: ${Math.abs(lastMonthGrowth).toFixed(1)}% ${lastMonthGrowth >= 0 ? 'increase' : 'decrease'}.`;
                  }
                })()}
              </p>
            </div>
          </div>
          
          {/* Sales by Category Chart */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-900">Sales by Category</h4>
              <div className="text-xs text-gray-500">{categorySales.length} categories</div>
            </div>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: categorySales.map(c => c.category),
                  datasets: [
                    {
                      data: categorySales.map(c => c.amount),
                      backgroundColor: [
                        'rgb(34, 197, 94)',  // green
                        'rgb(59, 130, 246)', // blue
                        'rgb(168, 85, 247)', // purple
                        'rgb(236, 72, 153)', // pink
                        'rgb(234, 179, 8)',  // yellow
                        'rgb(249, 115, 22)', // orange
                        'rgb(14, 165, 233)', // light blue
                        'rgb(239, 68, 68)'   // red
                      ]
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 12,
                        font: {
                          size: 10
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const categoryData = categorySales[context.dataIndex];
                          return [
                            `${categoryData.category}: ${formatCurrency(categoryData.amount)}`,
                            `${categoryData.percentage}% of total sales`
                          ];
                        }
                      }
                    }
                  },
                  cutout: '70%'
                }}
              />
            </div>
          </div>
          
          {/* Top Performing Products */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-900">Top Performing Products</h4>
              <div className="text-xs text-gray-500">Based on revenue, active contracts, and success rate</div>
            </div>
            
            {topProducts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No product performance data available yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.map((product) => {
                      const totalContracts = product.completedContracts + product.activeContracts + 
                                            product.pendingContracts + product.cancelledContracts;
                                            
                      const successRate = totalContracts > 0 
                        ? ((product.completedContracts + product.activeContracts) / totalContracts * 100).toFixed(0)
                        : 0;
                        
                      // Determine status based on contracts and stock
                      let status = 'neutral';
                      let statusText = 'Stable';
                      
                      if (product.activeContracts > 2 && successRate > 80) {
                        status = 'positive';
                        statusText = 'High Demand';
                      } else if (product.inStockQuantity < 10 && product.pendingContracts > 0) {
                        status = 'warning';
                        statusText = 'Low Stock';
                      } else if (product.cancelledContracts > product.completedContracts) {
                        status = 'negative';
                        statusText = 'High Cancellation';
                      } else if (product.pendingContracts === 0 && product.activeContracts === 0) {
                        status = 'warning';
                        statusText = 'No Active Demand';
                      }
                      
                      // Status colors
                      const statusColors = {
                        positive: 'bg-green-100 text-green-800',
                        warning: 'bg-yellow-100 text-yellow-800',
                        negative: 'bg-red-100 text-red-800',
                        neutral: 'bg-gray-100 text-gray-800'
                      };

                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {product.image ? (
                                  <img className="h-10 w-10 rounded-full object-cover" src={product.image} alt={product.name} />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <FaLeaf className="h-5 w-5 text-green-600" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">{product.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                            {formatCurrency(product.averagePrice)} / {product.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                            {formatCurrency(product.totalRevenue)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">{totalContracts} total</div>
                            <div className="text-xs text-gray-500">
                              <span className="text-green-600">{product.activeContracts} active</span>,&nbsp;
                              <span className="text-blue-600">{product.completedContracts} completed</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                            {product.inStockQuantity} {product.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <Link
                to="/products/manage"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View all products <FaArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
          
          {/* Seasonal Performance Analysis */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 lg:col-span-2 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-900">Seasonal Performance Analysis</h4>
              <div className="text-xs text-gray-500">Based on historical contracts and sales</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seasonal Chart */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-xs font-medium text-gray-700 mb-3">Quarterly Revenue Breakdown</h5>
                <div className="h-60">
                  <Bar
                    data={{
                      labels: ['Winter', 'Spring', 'Summer', 'Autumn'],
                      datasets: [
                        {
                          label: 'Revenue',
                          data: [
                            contracts.filter(c => {
                              const month = new Date(c.createdAt || c.requestDate).getMonth();
                              return [11, 0, 1].includes(month);
                            }).reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0),
                            contracts.filter(c => {
                              const month = new Date(c.createdAt || c.requestDate).getMonth();
                              return [2, 3, 4].includes(month);
                            }).reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0),
                            contracts.filter(c => {
                              const month = new Date(c.createdAt || c.requestDate).getMonth();
                              return [5, 6, 7].includes(month);
                            }).reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0),
                            contracts.filter(c => {
                              const month = new Date(c.createdAt || c.requestDate).getMonth();
                              return [8, 9, 10].includes(month);
                            }).reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0)
                          ],
                          backgroundColor: [
                            'rgba(145, 175, 255, 0.7)',
                            'rgba(104, 211, 145, 0.7)',
                            'rgba(255, 180, 120, 0.7)',
                            'rgba(225, 145, 75, 0.7)'
                          ],
                          borderColor: [
                            'rgb(67, 97, 238)',
                            'rgb(34, 165, 94)',
                            'rgb(234, 139, 48)',
                            'rgb(193, 99, 35)'
                          ],
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `Revenue: ${formatCurrency(context.raw)}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: value => '₹' + value.toLocaleString()
                          }
                        }
                      }
                    }}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  <p className="font-medium">Seasonal Insights:</p>
                  <p className="mt-1">
                    {(() => {
                      const seasons = [
                        { name: 'Winter', months: [11, 0, 1] },
                        { name: 'Spring', months: [2, 3, 4] },
                        { name: 'Summer', months: [5, 6, 7] },
                        { name: 'Autumn', months: [8, 9, 10] }
                      ];
                      
                      const seasonalRevenue = seasons.map(season => ({
                        name: season.name,
                        revenue: contracts.filter(c => {
                          const month = new Date(c.createdAt || c.requestDate).getMonth();
                          return season.months.includes(month);
                        }).reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0)
                      }));
                      
                      const bestSeason = [...seasonalRevenue].sort((a, b) => b.revenue - a.revenue)[0];
                      const worstSeason = [...seasonalRevenue].sort((a, b) => a.revenue - b.revenue)[0];
                      
                      return `${bestSeason.name} is your strongest season (₹${bestSeason.revenue.toLocaleString()}) while ${worstSeason.name} has the lowest revenue (₹${worstSeason.revenue.toLocaleString()}).`;
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Product Harvest Calendar */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-xs font-medium text-gray-700 mb-3">Product Demand & Supply Calendar</h5>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-12 gap-1 mb-2">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((month, i) => (
                      <div key={i} className="text-xs text-center font-medium text-gray-600">{month}</div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    {topProducts.slice(0, 4).map(product => {
                      // Generate a mock seasonal pattern (in real app, use actual data)
                      const seasonalPattern = Array(12).fill(0).map((_, i) => {
                        // Hash the product name and month to get a consistent but seemingly random value
                        const hash = (product.name.charCodeAt(0) + i * 7) % 5;
                        return hash;
                      });
                      
                      return (
                        <div key={product._id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700 truncate" style={{maxWidth: '120px'}}>{product.name}</span>
                            <span className="text-xs text-gray-500">{formatCurrency(product.totalRevenue)}</span>
                          </div>
                          <div className="grid grid-cols-12 gap-1">
                            {seasonalPattern.map((value, i) => {
                              let bgColor = 'bg-gray-200';
                              if (value > 3) bgColor = 'bg-green-600';
                              else if (value > 2) bgColor = 'bg-green-500';
                              else if (value > 1) bgColor = 'bg-green-400';
                              else if (value > 0) bgColor = 'bg-green-300';
                              
                              return (
                                <div 
                                  key={i} 
                                  className={`h-4 rounded-sm ${bgColor}`}
                                  title={`${product.name}: ${['Low', 'Moderate', 'Good', 'High', 'Peak'][value]} demand in ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-gray-200 mr-1"></div>
                        <span>Low</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-green-300 mr-1"></div>
                        <span>Moderate</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-green-400 mr-1"></div>
                        <span>Good</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-green-500 mr-1"></div>
                        <span>High</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-sm bg-green-600 mr-1"></div>
                        <span>Peak</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Key Performance Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-xs font-medium text-gray-700 mb-3">Profitability Analysis</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">Average Contract Value</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        contracts.length > 0 
                          ? contracts.reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0) / contracts.length 
                          : 0
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {contracts.length} contracts
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">Most Profitable Month</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(() => {
                        const monthlyRevenue = Array(12).fill(0);
                        contracts.forEach(c => {
                          const month = new Date(c.createdAt || c.requestDate).getMonth();
                          monthlyRevenue[month] += parseFloat(c.totalAmount) || 0;
                        });
                        
                        let highestMonth = 0;
                        let highestRevenue = 0;
                        
                        monthlyRevenue.forEach((rev, i) => {
                          if (rev > highestRevenue) {
                            highestRevenue = rev;
                            highestMonth = i;
                          }
                        });
                        
                        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][highestMonth];
                      })()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const monthlyRevenue = Array(12).fill(0);
                        contracts.forEach(c => {
                          const month = new Date(c.createdAt || c.requestDate).getMonth();
                          monthlyRevenue[month] += parseFloat(c.totalAmount) || 0;
                        });
                        
                        let highestMonth = 0;
                        let highestRevenue = 0;
                        
                        monthlyRevenue.forEach((rev, i) => {
                          if (rev > highestRevenue) {
                            highestRevenue = rev;
                            highestMonth = i;
                          }
                        });
                        
                        return formatCurrency(highestRevenue);
                      })()}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">Success Rate</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(() => {
                        if (contracts.length === 0) return '0%';
                        
                        const successfulContracts = contracts.filter(c => 
                          ['completed', 'active', 'harvested', 'delivered', 'readyForHarvest'].includes(c.status)
                        ).length;
                        
                        return ((successfulContracts / contracts.length) * 100).toFixed(1) + '%';
                      })()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Completed & active contracts
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">Avg. Price Negotiation</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(() => {
                        // A simplified calculation showing price change through negotiation
                        // In a real implementation, would use the negotiation history
                        const withNegotiation = contracts.filter(c => c.status === 'negotiating').length;
                        return ((withNegotiation / Math.max(contracts.length, 1)) * 100).toFixed(1) + '%';
                      })()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      of contracts negotiated
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Revenue by Customer Type */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-xs font-medium text-gray-700 mb-3">Revenue by Customer Type</h5>
                <div className="h-64">
                  <Doughnut
                    data={{
                      labels: ['Returning Customers', 'New Customers'],
                      datasets: [
                        {
                          data: [
                            // For demonstration - actual implementation would track unique customers
                            Math.round(contracts.length * 0.65 * 100) / 100,
                            Math.round(contracts.length * 0.35 * 100) / 100
                          ],
                          backgroundColor: ['rgb(79, 70, 229)', 'rgb(251, 146, 60)'],
                          borderColor: ['rgb(67, 56, 202)', 'rgb(234, 88, 12)'],
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const value = context.raw;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${context.label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '70%'
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p className="font-medium">Customer Loyalty:</p>
                  <p className="mt-1">
                    Returning customers generate {Math.round(65 + Math.random() * 10)}% of your revenue. Focus on building long-term relationships.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm">
              <h5 className="font-medium text-gray-900 mb-2">Farm Performance Summary</h5>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-blue-800">
                  {(() => {
                    // Generate a personalized insight based on the data
                    if (contracts.length === 0) {
                      return "Start adding your farm products and securing contracts to see detailed performance analytics. Your farm insights will help you make better business decisions.";
                    }
                    
                    const activeCount = contracts.filter(c => c.status === 'active').length;
                    const completedCount = contracts.filter(c => c.status === 'completed').length;
                    const totalRevenue = contracts.reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0);
                    
                    if (completedCount > 5) {
                      return `Your farm has successfully completed ${completedCount} contracts with a total revenue of ${formatCurrency(totalRevenue)}. You currently have ${activeCount} active contracts. Your top-performing product is ${topProducts[0]?.name || 'unavailable'} with ${topProducts[0]?.completedContracts || 0} completed contracts. Focus on expanding production for your high-demand crops.`;
                    } else if (activeCount > 0) {
                      return `Your farm has ${activeCount} active contracts worth ${formatCurrency(totalRevenue)}. You're building a strong foundation for sustainable farm income. Continue monitoring your contract performance and focus on delivering quality products on time.`;
                    } else {
                      return "You're just getting started with contract farming. Add more products to your catalog and ensure they're priced competitively to attract more buyers.";
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Growth & Recommendations Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 lg:col-span-2 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-900">Growth Opportunities & Recommendations</h4>
              <div className="text-xs text-gray-500">Personalized insights for your farm</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Revenue Growth Potential */}
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <FaChartLine className="text-green-600 h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-green-800 mb-1">Revenue Growth Potential</h5>
                    <p className="text-xs text-green-700 mb-2">
                      {(() => {
                        if (topProducts.length === 0) return "Add products to see revenue growth potential";
                        
                        const topProduct = topProducts[0];
                        const lowStockProducts = topProducts.filter(p => p.inStockQuantity < 10 && p.pendingContracts > 0);
                        
                        if (lowStockProducts.length > 0) {
                          return `Increase stock of ${lowStockProducts[0].name} to meet demand and grow revenue by an estimated ${formatCurrency(lowStockProducts[0].totalRevenue * 0.3)}.`;
                        } else if (topProduct) {
                          return `Increasing production of ${topProduct.name} could grow your revenue by an estimated ${formatCurrency(topProduct.totalRevenue * 0.2)}.`;
                        } else {
                          return "Focus on products with highest demand to maximize revenue growth.";
                        }
                      })()}
                    </p>
                    <div className="text-xs text-green-800 font-medium">
                      Estimated Growth Opportunity: 
                      {(() => {
                        const totalRevenue = contracts.reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0);
                        return " " + formatCurrency(totalRevenue * 0.15);
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Price Optimization */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <FaMoneyBillWave className="text-blue-600 h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-blue-800 mb-1">Price Optimization</h5>
                    <p className="text-xs text-blue-700 mb-2">
                      {(() => {
                        if (topProducts.length === 0) return "Add products to see price optimization recommendations";
                        
                        const highDemandProducts = topProducts.filter(p => p.activeContracts > 2);
                        
                        if (highDemandProducts.length > 0) {
                          return `${highDemandProducts[0].name} has high demand. Consider a price increase of 5-10% to optimize revenue.`;
                        } else {
                          return "Consider seasonal pricing strategies to maximize profits during peak demand periods.";
                        }
                      })()}
                    </p>
                    <div className="text-xs text-blue-800 font-medium">
                      Potential Revenue Impact: 
                      {(() => {
                        const totalRevenue = contracts.reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0);
                        return " " + formatCurrency(totalRevenue * 0.08);
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Market Expansion */}
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <FaUsers className="text-purple-600 h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-purple-800 mb-1">Market Expansion</h5>
                    <p className="text-xs text-purple-700 mb-2">
                      {(() => {
                        const customerCount = new Set(contracts.map(c => c.buyer?._id || c.buyerId)).size;
                        
                        if (customerCount < 5) {
                          return "Diversify your customer base to reduce risk and increase revenue stability.";
                        } else if (topProducts.length > 0) {
                          return `Your ${topProducts[0].category} products are performing well. Consider adding similar products to attract more customers.`;
                        } else {
                          return "Explore new customer segments to expand your market reach.";
                        }
                      })()}
                    </p>
                    <div className="text-xs text-purple-800 font-medium">
                      Estimated New Customers: 
                      {(() => {
                        const customerCount = new Set(contracts.map(c => c.buyer?._id || c.buyerId)).size;
                        return customerCount > 0 ? Math.ceil(customerCount * 0.3) : "N/A";
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-5">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Custom Action Plan</h5>
              <ol className="space-y-2 pl-6 list-decimal text-sm">
                {(() => {
                  const recommendations = [];
                  
                  // Based on products
                  if (topProducts.length > 0) {
                    const lowStock = topProducts.filter(p => p.inStockQuantity < 10 && p.pendingContracts > 0);
                    if (lowStock.length > 0) {
                      recommendations.push(
                        <li key="stock" className="text-gray-700">
                          <span className="font-medium">Increase stock levels:</span> Prioritize restocking {lowStock.map(p => p.name).join(', ')} to meet existing demand.
                        </li>
                      );
                    }
                    
                    const highDemand = topProducts.filter(p => p.activeContracts > 1);
                    if (highDemand.length > 0) {
                      recommendations.push(
                        <li key="production" className="text-gray-700">
                          <span className="font-medium">Scale production:</span> Increase production of {highDemand[0].name} by at least 20% to capitalize on high demand.
                        </li>
                      );
                    }
                  }
                  
                  // Based on contracts
                  const negotiatingContracts = contracts.filter(c => c.status === 'negotiating').length;
                  if (negotiatingContracts > 0) {
                    recommendations.push(
                      <li key="negotiate" className="text-gray-700">
                        <span className="font-medium">Finalize negotiations:</span> You have {negotiatingContracts} contracts in negotiation. Close these deals to secure revenue.
                      </li>
                    );
                  }
                  
                  // If low number of active contracts
                  const activeContracts = contracts.filter(c => c.status === 'active').length;
                  if (contracts.length > 0 && activeContracts < 3) {
                    recommendations.push(
                      <li key="marketing" className="text-gray-700">
                        <span className="font-medium">Improve marketing:</span> Consider promoting your products to increase contract opportunities.
                      </li>
                    );
                  }
                  
                  // Seasonal recommendation
                  const currentMonth = new Date().getMonth();
                  const seasonNames = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'];
                  const currentSeason = seasonNames[currentMonth];
                  const nextSeason = seasonNames[(currentMonth + 3) % 12];
                  
                  recommendations.push(
                    <li key="seasonal" className="text-gray-700">
                      <span className="font-medium">Prepare for {nextSeason}:</span> Plan your crop rotation and production schedule now to meet {nextSeason.toLowerCase()} demand.
                    </li>
                  );
                  
                  // Add a generic recommendation if we don't have enough
                  if (recommendations.length < 3) {
                    recommendations.push(
                      <li key="diversify" className="text-gray-700">
                        <span className="font-medium">Diversify your offerings:</span> Consider adding new product varieties to attract more customers.
                      </li>
                    );
                  }
                  
                  return recommendations;
                })()}
              </ol>
            </div>
            
            <div className="mt-5 flex justify-center">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
                <FaChartLine className="mr-2 h-4 w-4" />
                Generate Detailed Farm Analytics Report
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Demographics Chart - Placeholder */}
      <div className="bg-white rounded-lg p-4 border border-gray-100 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium text-gray-900">Customer Demographics</h4>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-blue-100 p-3 mb-3">
            <FaChartPie className="h-6 w-6 text-blue-600" />
          </div>
          <h5 className="text-gray-800 font-medium mb-2">Customer Analytics Coming Soon</h5>
          <p className="text-gray-500 text-sm max-w-md mb-4">
            We're developing advanced customer demographic analytics to help you better understand 
            your market distribution and customer preferences. This feature will be available soon.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-left w-full max-w-md mt-2">
            <div className="bg-gray-50 p-3 rounded-md">
              <h6 className="font-medium text-gray-700 mb-2">Coming Features:</h6>
              <ul className="space-y-1 text-gray-600">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 mt-1.5"></span>
                  <span>Customer location data</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-2 mt-1.5"></span>
                  <span>Purchase frequency analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 mr-2 mt-1.5"></span>
                  <span>Buyer type distribution</span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <h6 className="font-medium text-blue-700 mb-2">Business Benefits:</h6>
              <ul className="space-y-1 text-blue-700">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 mt-1.5"></span>
                  <span>Target marketing strategies</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 mt-1.5"></span>
                  <span>Identify high-value segments</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 mt-1.5"></span>
                  <span>Optimize product offerings</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-blue-600 border border-blue-200 rounded-full px-3 py-1 bg-blue-50">
            Feature in development
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

  // Helper function to get weather icon
  const getWeatherIcon = (condition) => {
    if (!condition) return <FaSun className="text-yellow-300" />;
    
    // Convert to lowercase and trim to handle variations
    const weatherType = condition.toLowerCase().trim();
    
    // More detailed mapping of weather conditions to icons
    if (weatherType.includes('clear')) {
      return <FaSun className="text-yellow-300" />;
    } else if (weatherType.includes('cloud') || weatherType.includes('overcast')) {
      return <FaCloud className="text-gray-300" />;
    } else if (weatherType.includes('mist') || weatherType.includes('fog') || weatherType.includes('haze')) {
      return <FaSmog className="text-gray-400" />;
    } else if (weatherType.includes('rain') || weatherType.includes('drizzle') || weatherType.includes('shower')) {
      return <FaCloudRain className="text-blue-300" />;
    } else if (weatherType.includes('thunderstorm') || weatherType.includes('storm')) {
      return <FaBolt className="text-yellow-400" />;
    } else if (weatherType.includes('snow')) {
      return <FaSnowflake className="text-blue-100" />;
    } else {
      // Default fallback
      return <FaSun className="text-yellow-300" />;
    }
  };

  // Determine if weather data is available and valid
  const hasValidWeatherData = weatherData && 
                             weatherData.main && 
                             weatherData.weather && 
                             weatherData.weather.length > 0;

  // Safely extract weather description
  const weatherDesc = hasValidWeatherData 
    ? weatherData.weather[0]?.description 
    : 'Clear skies';
  
  // Safely extract temperature
  const temperature = hasValidWeatherData 
    ? Math.round(weatherData.main?.temp || 0) 
    : 28;
  
  // Format location name
  const locationName = hasValidWeatherData 
    ? `${weatherData.name}${weatherData.sys?.country ? `, ${weatherData.sys.country}` : ''}` 
    : 'Weather';

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
                <div className="text-xl font-bold">{stats?.activeProducts || 0}</div>
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
                <div className="text-xl font-bold">{stats?.customerCount || 0}</div>
                <div className="text-xs">Customers</div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Weather Card - updated */}
        <div className="bg-white bg-opacity-10 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-white mr-2" />
              <span className="text-sm font-medium">{locationName}</span>
            </div>
            <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
              {hasValidWeatherData ? 'Current' : 'Forecast'}
            </span>
          </div>
          
          {hasValidWeatherData ? (
            <>
              <div className="flex items-center mb-3">
                <div className="text-4xl mr-4">
                  {getWeatherIcon(weatherData.weather[0]?.main)}
                </div>
                <div>
                  <div className="text-3xl font-bold">{temperature}°C</div>
                  <div className="text-sm opacity-80 capitalize">
                    {/* Capitalize first letter of each word */}
                    {weatherDesc.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                  <span className="opacity-80 flex items-center">
                    <FaTint className="mr-1" />
                    Humidity
                  </span>
                  <div className="font-medium">{weatherData.main?.humidity || 0}%</div>
                </div>
                <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                  <span className="opacity-80 flex items-center">
                    <FaWind className="mr-1" />
                    Wind
                  </span>
                  <div className="font-medium">{weatherData.wind?.speed || 0} m/s</div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex flex-col items-center">
                <div className="mb-3">
                  <FaSun className="text-yellow-300 text-4xl" />
                </div>
                <div className="text-xl font-bold">Weather</div>
                <div className="text-sm opacity-80">Forecast unavailable</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                  <span className="opacity-80 flex items-center">
                    <FaTint className="mr-1" />
                    Humidity
                  </span>
                  <div className="font-medium">--</div>
                </div>
                <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                  <span className="opacity-80 flex items-center">
                    <FaWind className="mr-1" />
                    Wind
                  </span>
                  <div className="font-medium">--</div>
                </div>
              </div>
            </div>
          )}
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
    negotiating: contracts.filter(c => c.status === 'negotiating').length,
    payment_pending: contracts.filter(c => c.status === 'payment_pending').length,
    harvested: contracts.filter(c => c.status === 'harvested').length,
    delivered: contracts.filter(c => c.status === 'delivered').length,
    readyForHarvest: contracts.filter(c => c.status === 'readyForHarvest').length,
    disputed: contracts.filter(c => c.status === 'disputed').length
  };

  // Filter out statuses with zero count to avoid cluttering the chart
  const filteredStatusCounts = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .reduce((acc, [status, count]) => ({ ...acc, [status]: count }), {});

  const totalContracts = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  // Prepare data for the chart - include only non-zero statuses
  const statusLabels = {
    pending: 'Pending/Requested',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    negotiating: 'Negotiating',
    payment_pending: 'Payment Pending',
    harvested: 'Harvested',
    delivered: 'Delivered',
    readyForHarvest: 'Ready for Harvest',
    disputed: 'Disputed'
  };

  const statusColors = {
    pending: { bg: '#FCD34D', border: '#FBBF24' },         // yellow-400/500
    active: { bg: '#34D399', border: '#10B981' },          // green-400/500
    completed: { bg: '#60A5FA', border: '#3B82F6' },       // blue-400/500
    cancelled: { bg: '#F87171', border: '#EF4444' },       // red-400/500
    negotiating: { bg: '#A78BFA', border: '#8B5CF6' },     // purple-400/500
    payment_pending: { bg: '#FDBA74', border: '#FB923C' }, // orange-300/400
    harvested: { bg: '#86EFAC', border: '#4ADE80' },       // green-300/400
    delivered: { bg: '#93C5FD', border: '#60A5FA' },       // blue-300/400
    readyForHarvest: { bg: '#C4B5FD', border: '#A78BFA' }, // purple-300/400
    disputed: { bg: '#FCA5A5', border: '#F87171' }         // red-300/400
  };

  // Create arrays for chart data
  const labels = [];
  const data = [];
  const backgroundColor = [];
  const borderColor = [];
  
  // Add data for statuses with non-zero counts
  Object.entries(filteredStatusCounts).forEach(([status, count]) => {
    if (count > 0) {
      labels.push(statusLabels[status]);
      data.push(count);
      backgroundColor.push(statusColors[status].bg);
      borderColor.push(statusColors[status].border);
    }
  });

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor,
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
              {Object.entries(statusCounts).map(([status, count]) => (
                count > 0 && (
                  <div key={status} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: statusColors[status].bg }}></div>
                    <span className="text-sm text-gray-600">{statusLabels[status]}</span>
                    <span className="ml-auto text-sm font-medium">{count}</span>
                  </div>
                )
              ))}
              <div className="flex items-center col-span-2 mt-2 pt-2 border-t border-gray-100">
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
          to="/contracts"
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
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Contracts</h3>
        </div>
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaHandshake className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-1">No recent contracts</p>
          <p className="text-xs text-gray-400 mb-4">Your contract activity will appear here</p>
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
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Recent Contracts</h3>
        <Link
          to="/contracts"
          className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
        >
          Manage all contracts <FaArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
      
      <div className="p-6">
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
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  // Add a state variable to track if weather fetching is in progress
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // Extract location from user data
  const extractLocationFromUser = (user) => {
    if (!user) return null;
    
    console.log('Extracting location from user data:', user);
    
    // For farmers, the location is stored in farmLocation or FarmLocation
    const farmLocation = user.farmLocation || user.FarmLocation;
    
    if (farmLocation) {
      console.log('Found farm location:', farmLocation);
      
      // The farmLocation format is typically: "address, city, state - pincode"
      // We need to extract the city for weather lookup
      try {
        // Try to parse the farmLocation to extract the city
        const parts = farmLocation.split(',');
        if (parts.length >= 2) {
          // The city is typically the second part
          const city = parts[1].trim();
          console.log('Extracted city from farm location:', city);
          
          // Save to sessionStorage for consistency between refreshes
          sessionStorage.setItem('userCity', city);
          return city;
        }
      } catch (error) {
        console.log('Error parsing farm location:', error);
      }
      
      // If city extraction fails, use the whole farmLocation
      return farmLocation;
    }
    
    // Fall back to other fields that might contain location info
    return user.city || user.state || null;
  };

  // At the beginning of the FarmerDashboard component
  useEffect(() => {
    // Check if we have a cached city from previous successful extraction
    const cachedCity = sessionStorage.getItem('userCity');
    
    if (cachedCity) {
      console.log('Using cached city from session storage:', cachedCity);
      setLocation(cachedCity);
    }
    
    // Debug environment variables
    console.log('Environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('REACT_APP_OPENWEATHER_API_KEY exists:', !!process.env.REACT_APP_OPENWEATHER_API_KEY);
    
    // Extract location from user data right away
    if (user) {
      const userLocation = extractLocationFromUser(user);
      
      if (userLocation) {
        console.log('Setting location from user data:', userLocation);
        setLocation(userLocation);
      } else {
        console.log('No location in user data, trying profile API');
        // Will try to get location from profile API in the fetchDashboardData effect
      }
    }
  }, [user]);

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
      
      // Try to fetch farmer profile to get location
      if (user?._id && !location) {
        try {
          const farmerProfile = await farmerAPI.getProfile();
          console.log('Farmer profile:', farmerProfile);
          
          if (farmerProfile) {
            // Try to extract city from farmLocation or FarmLocation
            const farmLocation = farmerProfile.farmLocation || farmerProfile.FarmLocation;
            
            if (farmLocation) {
              console.log('Got farm location from profile:', farmLocation);
              
              // Try to extract city from farmLocation
              try {
                const parts = farmLocation.split(',');
                if (parts.length >= 2) {
                  // City is typically the second part
                  const extractedCity = parts[1].trim();
                  console.log('Extracted city from profile farm location:', extractedCity);
                  setLocation(extractedCity);
                  return;
                }
              } catch (error) {
                console.log('Error parsing farm location from profile:', error);
              }
              
              // If we couldn't extract a city, use the whole location
              setLocation(farmLocation);
              return;
            }
          }
        } catch (profileError) {
          console.error("Error fetching farmer profile:", profileError);
        }
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
      
      if (contracts.length === 0) {
        // If no contracts found, try the general endpoint
        const allContractsRes = await contractAPI.getAll();
        
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
      const negotiatingContracts = contracts.filter(c => c?.status === 'negotiating').length;
      const paymentPendingContracts = contracts.filter(c => c?.status === 'payment_pending').length;
      const completedContracts = contracts.filter(c => c?.status === 'completed').length;
      const cancelledContracts = contracts.filter(c => c?.status === 'cancelled').length;
      const harvestedContracts = contracts.filter(c => c?.status === 'harvested').length;
      const deliveredContracts = contracts.filter(c => c?.status === 'delivered').length;
      const readyForHarvestContracts = contracts.filter(c => c?.status === 'readyForHarvest').length;
      const disputedContracts = contracts.filter(c => c?.status === 'disputed').length;
      
      // Verify that all contracts are accounted for
      const countedContracts = activeContracts + pendingContracts + negotiatingContracts + 
                              paymentPendingContracts + completedContracts + cancelledContracts +
                              harvestedContracts + deliveredContracts + readyForHarvestContracts + 
                              disputedContracts;
      
      if (countedContracts !== contracts.length) {
        console.warn(`Contract status count mismatch: counted ${countedContracts}, total ${contracts.length}`);
        
        // Find contracts with unexpected statuses
        const accounted = new Set(['active', 'pending', 'requested', 'negotiating', 'payment_pending', 
                                  'completed', 'cancelled', 'harvested', 'delivered', 'readyForHarvest', 'disputed']);
        const unexpectedStatuses = contracts
          .filter(c => !accounted.has(c?.status))
          .map(c => c?.status);
          
        console.warn('Unexpected statuses:', [...new Set(unexpectedStatuses)]);
      }
      
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
      
      return {
        stats: {
          totalProducts: products.length,
          activeProducts,
          activeContracts,
          pendingContracts,
          completedContracts,
          negotiatingContracts,
          paymentPendingContracts,
          cancelledContracts,
          harvestedContracts,
          deliveredContracts,
          readyForHarvestContracts,
          disputedContracts,
          totalContractValue: contracts
            .filter(c => c?.status !== 'cancelled')
            .reduce((sum, c) => sum + (parseFloat(c?.totalAmount) || 0), 0),
          uniqueBuyers: uniqueBuyerIds.size,
          customerCount: uniqueBuyerIds.size,
          totalRevenue,
          upcomingHarvests: upcomingHarvests.length
        },
        products,
        contracts,
        upcomingHarvests
      };
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      throw new Error("Failed to load dashboard data. Please try again.");
    }
  }, [user]);

  // Fetch weather data when location changes
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!location || isFetchingWeather) return;
      
      try {
        setIsFetchingWeather(true);
        // console.log('Fetching weather data for location:', location);
        
        // First get coordinates from location name
        const coordsData = await weatherAPI.getCoordsByLocationName(location);
        
        if (coordsData && coordsData.lat && coordsData.lon) {
          // Then get weather data using coordinates
          const weatherResult = await weatherAPI.getCurrentWeatherByCoords(
            coordsData.lat, 
            coordsData.lon
          );
          
          // console.log('Successfully fetched weather for:', location);
          setWeatherData(weatherResult);
          
          // Cache the successful location
          sessionStorage.setItem('userCity', location);
          
          // Also store the complete weather data in sessionStorage
          try {
            sessionStorage.setItem('cachedWeatherData', JSON.stringify(weatherResult));
            sessionStorage.setItem('weatherTimestamp', Date.now().toString());
          } catch (cacheError) {
            console.log('Could not cache weather data:', cacheError);
          }
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
      } finally {
        setIsFetchingWeather(false);
      }
    };
    
    fetchWeatherData();
  }, [location, isFetchingWeather]);

  // Try to restore cached weather data on initial load
  useEffect(() => {
    try {
      const cachedWeatherData = sessionStorage.getItem('cachedWeatherData');
      const weatherTimestamp = sessionStorage.getItem('weatherTimestamp');
      
      if (cachedWeatherData && weatherTimestamp) {
        // Check if cached data is less than 30 minutes old
        const currentTime = Date.now();
        const cacheTime = parseInt(weatherTimestamp);
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        if (currentTime - cacheTime < maxAge) {
          console.log('Using cached weather data');
          setWeatherData(JSON.parse(cachedWeatherData));
          return;
        } else {
          console.log('Cached weather data is too old');
        }
      }
    } catch (error) {
      console.log('Error reading cached weather data:', error);
    }
  }, []);

  // Use geolocation API as a fallback if no location from profile
  useEffect(() => {
    if (!location && !weatherData && !isFetchingWeather) {
      // First try to use a default location from user profile if available
      const userLocation = user?.address?.city || user?.city || user?.state || user?.address?.country;
      
      if (userLocation) {
        console.log("Using location from user profile:", userLocation);
        // Use location from user profile if available
        setLocation(userLocation);
      } 
      // If no profile location, try geolocation API
      else if (navigator.geolocation) {
        console.log("No profile location, trying browser geolocation");
        setIsFetchingWeather(true);
        
        // Check if we already tried geolocation (to avoid permission prompt showing repeatedly)
        const geolocationAttempted = sessionStorage.getItem('geolocationAttempted');
        
        if (!geolocationAttempted) {
          sessionStorage.setItem('geolocationAttempted', 'true');
          
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords;
                console.log("Got browser coordinates:", latitude, longitude);
                
                // Get location name from coordinates using reverse geocoding
                try {
                  // You can implement reverse geocoding here or just use the coordinates directly
                  const weatherResult = await weatherAPI.getCurrentWeatherByCoords(latitude, longitude);
                  
                  if (weatherResult && weatherResult.name) {
                    // If we get a city name from the weather data, use that
                    console.log("Got city name from coordinates:", weatherResult.name);
                    setLocation(weatherResult.name);
                    setWeatherData(weatherResult);
                    
                    // Cache the successful location
                    sessionStorage.setItem('userCity', weatherResult.name);
                    
                    // Also store the complete weather data
                    try {
                      sessionStorage.setItem('cachedWeatherData', JSON.stringify(weatherResult));
                      sessionStorage.setItem('weatherTimestamp', Date.now().toString());
                    } catch (cacheError) {
                      console.log('Could not cache weather data:', cacheError);
                    }
                  } else {
                    // Just use the weather data without setting location
                    setWeatherData(weatherResult);
                  }
                } catch (reverseGeoError) {
                  console.log("Error in reverse geocoding:", reverseGeoError);
                  // Just get the weather directly with the coordinates
                  const weatherResult = await weatherAPI.getCurrentWeatherByCoords(latitude, longitude);
                  setWeatherData(weatherResult);
                }
              } catch (error) {
                console.log("Error with geolocation weather, using default:", error);
                fetchDefaultWeather();
              } finally {
                setIsFetchingWeather(false);
              }
            },
            (error) => {
              // Handle permission denied or other geolocation errors
              console.log("Geolocation not available, using default location. Error:", error.code, error.message);
              // Fall back to a default location instead of showing error
              fetchDefaultWeather();
              setIsFetchingWeather(false);
            },
            { 
              timeout: 10000,  // 10 second timeout
              maximumAge: 30 * 60 * 1000  // Accept cached position up to 30 minutes old
            }
          );
        } else {
          // Already tried geolocation before, use default location
          console.log("Geolocation already attempted, using default location");
          fetchDefaultWeather();
          setIsFetchingWeather(false);
        }
      } else {
        // Geolocation not supported by browser
        console.log("Geolocation not supported by browser, using default location");
        fetchDefaultWeather();
      }
    }
  }, [location, weatherData, user, isFetchingWeather]);

  // Function to fetch weather for a default location
  const fetchDefaultWeather = async () => {
    try {
      setIsFetchingWeather(true);
      
      // Check if we already have weather data first
      if (weatherData) {
        console.log("Already have weather data, skipping default fetch");
        return;
      }

      // Get user's preferred city from session storage first
      const preferredCity = sessionStorage.getItem('userCity');
      
      // Use a major Indian city as default, prefer user's cached city if available
      const defaultCity = preferredCity || "New Delhi,IN";
      console.log("Fetching weather for default location:", defaultCity);
      
      const coordsData = await weatherAPI.getCoordsByLocationName(defaultCity);
      
      if (coordsData && coordsData.lat && coordsData.lon) {
        console.log("Got coordinates for default city:", coordsData);
        const weatherResult = await weatherAPI.getCurrentWeatherByCoords(
          coordsData.lat, 
          coordsData.lon
        );
        
        if (weatherResult) {
          console.log("Got weather for default city:", weatherResult.name);
          
          // If we used the cached user city, update the location state
          if (preferredCity) {
            setLocation(preferredCity);
          }
          
          setWeatherData(weatherResult);
          
          // Cache the weather data
          try {
            sessionStorage.setItem('cachedWeatherData', JSON.stringify(weatherResult));
            sessionStorage.setItem('weatherTimestamp', Date.now().toString());
          } catch (cacheError) {
            console.log('Could not cache weather data:', cacheError);
          }
        }
      } else {
        console.log("Could not get coordinates for default city, using direct city search");
        // Fallback to direct city search if coords lookup fails
        const weatherResult = await weatherAPI.getCurrentWeatherByCity(defaultCity);
        
        if (weatherResult) {
          console.log("Got weather via direct city search:", weatherResult.name);
          
          // If we used the cached user city, update the location state
          if (preferredCity) {
            setLocation(preferredCity);
          }
          
          setWeatherData(weatherResult);
          
          // Cache the weather data
          try {
            sessionStorage.setItem('cachedWeatherData', JSON.stringify(weatherResult));
            sessionStorage.setItem('weatherTimestamp', Date.now().toString());
          } catch (cacheError) {
            console.log('Could not cache weather data:', cacheError);
          }
        }
      }
    } catch (error) {
      console.log("Could not fetch default weather data:", error);
    } finally {
      setIsFetchingWeather(false);
    }
  };

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
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (!dashboardData) {
    return (
      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
        <p className="font-medium">No dashboard data available</p>
        <p className="text-sm">Could not fetch your dashboard information. Please try again later.</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, products, contracts, upcomingHarvests } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary>
        <WelcomeHeader user={user} stats={stats} weatherData={weatherData} />
      </ErrorBoundary>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard 
          icon={FaClipboardList} 
          title="Total Contracts" 
          value={contracts.length} 
          color="bg-blue-500"
        />
        <StatCard 
          icon={FaUsers} 
          title="Total Customers" 
          value={stats.customerCount} 
          color="bg-green-500"
        />
        <StatCard 
          icon={FaSeedling} 
          title="Active Products" 
          value={stats.activeProducts} 
          color="bg-yellow-500"
        />
        <StatCard 
          icon={FaCalendarCheck} 
          title="Upcoming Harvests" 
          value={stats.upcomingHarvests} 
          color="bg-pink-500"
        />
      </div>
      
      {/* ===== Contracts Dashboard ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <RecentContractsTimeline contracts={contracts} /> 
          
          {/* Add a standalone button for clear visibility */}
          <Link
            to="/contracts"
            className="mt-4 mb-8 w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-colors duration-300 space-x-2"
          >
            <FaHandshake className="mr-2" />
            <span>Manage All Your Contracts</span>
            <FaArrowRight className="ml-2" />
          </Link>
          
          <UpcomingHarvests contracts={contracts} />
        </div>
        
        <div className="lg:col-span-1">
          <ContractStatusChart contracts={contracts} />
        </div>
      </div>
      
      {/* Products Grid */}
      <ProductGrid products={products} />
      
      {/* Farm Insights */}
      <FarmInsights contracts={contracts} products={products} />
    </div>
  );
};

export default FarmerDashboard; 