import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaHandshake, 
  FaFilter, 
  FaSort, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaChartLine, 
  FaClipboardList, 
  FaExchangeAlt, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaArrowRight, 
  FaEye
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { contractAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ROLES } from '../../config/constants';

const ContractsPage = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // State variables
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'newest',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch contracts
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchContracts();
    fetchContractStats();
  }, [isAuthenticated, filters.status, filters.sortBy, filters.page, filters.limit]);
  
  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      const response = await contractAPI.getContracts(queryParams.toString());
      
      if (response.success) {
        setContracts(response.contracts);
        setTotalPages(response.totalPages || 1);
      } else {
        throw new Error(response.message || 'Failed to fetch contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError(error.message || 'An error occurred while fetching contracts');
      toast.error('Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchContractStats = async () => {
    try {
      const response = await contractAPI.getContractStats();
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching contract stats:', error);
    }
  };
  
  const handleStatusChange = (status) => {
    setFilters({
      ...filters,
      status,
      page: 1 // Reset to first page when changing filters
    });
    setActiveTab(status || 'all');
  };
  
  const handleSortChange = (e) => {
    setFilters({
      ...filters,
      sortBy: e.target.value,
      page: 1
    });
  };
  
  const handlePageChange = (page) => {
    setFilters({
      ...filters,
      page
    });
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    // This would typically involve API call with search parameter
    console.log('Searching for:', searchQuery);
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'negotiating':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaSpinner className="mr-1" />;
      case 'accepted':
        return <FaCheck className="mr-1" />;
      case 'rejected':
        return <FaTimes className="mr-1" />;
      case 'completed':
        return <FaHandshake className="mr-1" />;
      case 'cancelled':
        return <FaExclamationTriangle className="mr-1" />;
      case 'negotiating':
        return <FaExchangeAlt className="mr-1" />;
      default:
        return null;
    }
  };
  
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaHandshake className="mr-2 text-green-600" />
            My Contracts
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your farming contracts and agreements
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaHandshake className="mr-2" />
            Browse Products for Contracts
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <FaSpinner className="text-yellow-600 h-5 w-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.accepted}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <FaCheck className="text-green-600 h-5 w-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Negotiating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.negotiating}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <FaExchangeAlt className="text-purple-600 h-5 w-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <FaMoneyBillWave className="text-blue-600 h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex space-x-1 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              <button
                onClick={() => handleStatusChange('')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  activeTab === 'all' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusChange('pending')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  activeTab === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleStatusChange('accepted')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  activeTab === 'accepted' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Accepted
              </button>
              <button
                onClick={() => handleStatusChange('negotiating')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  activeTab === 'negotiating' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Negotiating
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  activeTab === 'completed' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  activeTab === 'rejected' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
            </div>
            
            <div className="flex items-center space-x-2 mt-3 md:mt-0">
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={handleSortChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount (High to Low)</option>
                  <option value="amount-low">Amount (Low to High)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FaSort className="h-4 w-4" />
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaFilter className="mr-2" />
                Filters
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    id="dateRange"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Time</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="last3months">Last 3 Months</option>
                    <option value="last6months">Last 6 Months</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Category
                  </label>
                  <select
                    id="productType"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Categories</option>
                    <option value="fruits">Fruits</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="grains">Grains</option>
                    <option value="dairy">Dairy</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="text"
                      id="search"
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search by product or farmer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Contracts List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner message="Loading contracts..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Contracts</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchContracts}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Try Again
              </button>
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState
              icon={<FaHandshake className="h-12 w-12 text-gray-400" />}
              title="No contracts found"
              description={`You don't have any ${filters.status ? filters.status : ''} contracts yet.`}
              action={
                <button
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Browse Products
                </button>
              }
            />
          ) : (
            <div className="min-w-full divide-y divide-gray-200">
              <div className="bg-gray-50">
                <div className="grid grid-cols-12 gap-2 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Product</div>
                  <div className="col-span-2">{user.accountType === ROLES.FARMER ? 'Buyer' : 'Farmer'}</div>
                  <div className="col-span-1">Quantity</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>
              
              <div className="bg-white divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <div key={contract._id} className="grid grid-cols-12 gap-2 px-6 py-4 hover:bg-gray-50">
                    <div className="col-span-3">
                      <div className="flex items-center">
                        {contract.crop.images && contract.crop.images.length > 0 ? (
                          <img
                            src={contract.crop.images[0].url || contract.crop.images[0]}
                            alt={contract.crop.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <FaHandshake className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{contract.crop.name}</div>
                          <div className="text-xs text-gray-500">{contract.crop.category}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="font-medium text-gray-900">
                        {user.accountType === ROLES.FARMER ? contract.buyer.name : contract.farmer.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.accountType === ROLES.FARMER ? contract.buyer.email : contract.farmer.email}
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <div className="font-medium text-gray-900">{contract.quantity}</div>
                      <div className="text-xs text-gray-500">{contract.unit}</div>
                    </div>
                    
                    <div className="col-span-1">
                      <div className="font-medium text-green-600">₹{formatCurrency(contract.totalAmount)}</div>
                      <div className="text-xs text-gray-500">₹{formatCurrency(contract.pricePerUnit)}/{contract.unit}</div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="font-medium text-gray-900">{formatDate(contract.createdAt)}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <FaCalendarAlt className="mr-1 h-3 w-3" />
                        {contract.deliveryDate ? formatDate(contract.deliveryDate) : 'Not set'}
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        {formatStatus(contract.status)}
                      </span>
                    </div>
                    
                    <div className="col-span-2 text-right space-x-2">
                      <Link
                        to={`/contracts/${contract._id}`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FaEye className="mr-1" />
                        View
                      </Link>
                      
                      {contract.status === 'pending' && user.accountType === ROLES.FARMER && (
                        <button
                          onClick={() => navigate(`/contracts/${contract._id}/respond`)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <FaArrowRight className="mr-1" />
                          Respond
                        </button>
                      )}
                      
                      {contract.status === 'negotiating' && (
                        <button
                          onClick={() => navigate(`/contracts/${contract._id}/negotiate`)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <FaExchangeAlt className="mr-1" />
                          Negotiate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && !error && contracts.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractsPage; 