import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaFilter, FaSearch, FaSort, FaFileContract, FaExclamationTriangle, 
  FaChartLine, FaMoneyBillWave, FaHandshake, FaBalanceScale,
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaCheckCircle, 
  FaTimes, FaSpinner, FaHourglassHalf, FaUserTie, FaLeaf, FaArrowRight
} from 'react-icons/fa';
import ContractSummaryList from './ContractSummaryList';
import { contractAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Pagination from '../common/Pagination';
import toast from 'react-hot-toast';

const ContractsList = ({ title = "All Contracts", limit = 10, showFilters = true, showPagination = true }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Filter and pagination state
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query parameters on component mount and when location changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status');
    const sort = queryParams.get('sort');
    const order = queryParams.get('order');
    const page = queryParams.get('page');
    const search = queryParams.get('search');
    
    if (status) setStatusFilter(status);
    if (sort) setSortBy(sort);
    if (order) setSortOrder(order);
    if (page) setCurrentPage(parseInt(page, 10));
    if (search) setSearchQuery(search);
  }, [location]);
  
  // Debounce search input for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        setCurrentPage(1); // Reset to first page when search changes
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  // Initialize searchInput from URL on component mount
  useEffect(() => {
    if (searchQuery) {
      setSearchInput(searchQuery);
    }
  }, []);
  
  // Fetch contracts when filter values change
  useEffect(() => {
    if (!user || !user._id) {
      setLoading(false);
      setError("You must be logged in to view contracts");
      return;
    }
    
    fetchContracts();
    fetchAllContractsForStats();
  }, [user, statusFilter, sortBy, sortOrder, currentPage, searchQuery]);
  
  // Update URL when filter values change
  useEffect(() => {
    const queryParams = new URLSearchParams();
    
    if (statusFilter !== 'all') queryParams.set('status', statusFilter);
    if (sortBy !== 'date') queryParams.set('sort', sortBy);
    if (sortOrder !== 'desc') queryParams.set('order', sortOrder);
    if (currentPage !== 1) queryParams.set('page', currentPage.toString());
    if (searchQuery) queryParams.set('search', searchQuery);
    
    const queryString = queryParams.toString();
    const newUrl = `${location.pathname}${queryString ? `?${queryString}` : ''}`;
    
    // Use replace instead of push to avoid creating many history entries
    navigate(newUrl, { replace: true });
  }, [statusFilter, sortBy, sortOrder, currentPage, searchQuery, navigate, location.pathname]);
  
  // Convert frontend sort values to backend format
  const mapSortToBackend = useCallback((sortType, order) => {
    if (sortType === 'date') {
      return order === 'asc' ? 'oldest' : 'newest';
    } else if (sortType === 'price') {
      return order === 'asc' ? 'amount-low' : 'amount-high';
    } else if (sortType === 'status') {
      // For status, we send the raw value and let backend handle it
      return sortType;
    } else {
      return order === 'asc' ? 'oldest' : 'newest';
    }
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Use the mapping function to get backend sort values
      const backendSortBy = mapSortToBackend(sortBy, sortOrder);
      
      // Prepare filters for API call
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: limit,
        sortBy: backendSortBy
      };
      
      // Only add search param if it's not empty to avoid unnecessary filtering
      if (searchQuery && searchQuery.trim() !== '') {
        filters.search = searchQuery.trim();
      }
      
      // Call API with filters
      console.log("Fetching contracts with filters:", filters);
      const response = await contractAPI.getByBuyer(filters);
      console.log("Contracts response:", response);
      
      if (response.success) {
        const contractsData = response.contracts || [];
        setContracts(contractsData);
        
        // Set total pages for pagination
        if (response.totalPages) {
          setTotalPages(response.totalPages);
        } else if (response.total) {
          // Backend returns 'total' rather than 'totalContracts'
          setTotalPages(Math.ceil(response.total / limit));
        }
        
        // Calculate stats excluding cancelled contracts
        const nonCancelledContracts = contractsData.filter(c => c.status !== 'cancelled');
        const activeContracts = contractsData.filter(c => c.status === 'active');
        const pendingContracts = contractsData.filter(c => c.status === 'pending' || c.status === 'requested');
        const negotiatingContracts = contractsData.filter(c => c.status === 'negotiating');
        const paymentPendingContracts = contractsData.filter(c => c.status === 'payment_pending');
        const completedContracts = contractsData.filter(c => c.status === 'completed');
        const cancelledContracts = contractsData.filter(c => c.status === 'cancelled');
        
        // Verify that all contracts are accounted for
        const countedContracts = activeContracts.length + pendingContracts.length + 
                                negotiatingContracts.length + paymentPendingContracts.length + 
                                completedContracts.length + cancelledContracts.length;
        
        // Check if there are any contracts with unexpected status values
        if (countedContracts !== contractsData.length) {
          console.warn(`Contract status count mismatch: counted ${countedContracts}, total ${contractsData.length}`);
          // Find contracts with unexpected statuses
          const unexpectedStatuses = contractsData
            .filter(c => !['active', 'pending', 'requested', 'negotiating', 'payment_pending', 'completed', 'cancelled'].includes(c.status))
            .map(c => c.status);
          console.warn('Unexpected statuses:', [...new Set(unexpectedStatuses)]);
        }
        
        const totalValue = nonCancelledContracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
        const averageValue = nonCancelledContracts.length > 0 
          ? totalValue / nonCancelledContracts.length 
          : 0;
        
        setStats({
          total: response.total || contractsData.length,
          byStatus: {
            active: activeContracts.length,
            pending: pendingContracts.length,
            negotiating: negotiatingContracts.length,
            payment_pending: paymentPendingContracts.length,
            completed: completedContracts.length,
            cancelled: cancelledContracts.length
          },
          totalValue,
          averageValue
        });
        
        // If search returned no results, show feedback
        if (searchQuery && contractsData.length === 0) {
          console.log("Search returned no results for:", searchQuery);
        }
      } else {
        setError(response.message || 'Failed to load contracts');
        toast.error(response.message || 'Failed to load contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Failed to load contracts');
      toast.error('Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all contracts for statistics calculation
  const fetchAllContractsForStats = async () => {
    try {
      const response = await contractAPI.getAllUserContracts();
      if (response.success) {
        const allContractsData = response.contracts || [];
        
        // Calculate stats from all contracts
        const nonCancelledContracts = allContractsData.filter(c => c.status !== 'cancelled');
        const activeContracts = allContractsData.filter(c => c.status === 'active');
        const pendingContracts = allContractsData.filter(c => c.status === 'pending' || c.status === 'requested');
        const negotiatingContracts = allContractsData.filter(c => c.status === 'negotiating');
        const paymentPendingContracts = allContractsData.filter(c => c.status === 'payment_pending');
        const completedContracts = allContractsData.filter(c => c.status === 'completed');
        const cancelledContracts = allContractsData.filter(c => c.status === 'cancelled');
        
        // Verify that all contracts are accounted for
        const countedContracts = activeContracts.length + pendingContracts.length + 
                                 negotiatingContracts.length + paymentPendingContracts.length + 
                                 completedContracts.length + cancelledContracts.length;
        
        // Check if there are any contracts with unexpected status values
        if (countedContracts !== allContractsData.length) {
          console.warn(`Contract status count mismatch: counted ${countedContracts}, total ${allContractsData.length}`);
          // Find contracts with unexpected statuses
          const unexpectedStatuses = allContractsData
            .filter(c => !['active', 'pending', 'requested', 'negotiating', 'payment_pending', 'completed', 'cancelled'].includes(c.status))
            .map(c => c.status);
          console.warn('Unexpected statuses:', [...new Set(unexpectedStatuses)]);
        }
        
        const totalValue = nonCancelledContracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
        const averageValue = nonCancelledContracts.length > 0 
          ? totalValue / nonCancelledContracts.length 
          : 0;
        
        setStats({
          total: allContractsData.length,
          byStatus: {
            active: activeContracts.length,
            pending: pendingContracts.length,
            negotiating: negotiatingContracts.length,
            payment_pending: paymentPendingContracts.length,
            completed: completedContracts.length,
            cancelled: cancelledContracts.length
          },
          totalValue,
          averageValue
        });
      }
    } catch (error) {
      console.error('Error fetching all contracts for stats:', error);
    }
  };
  
  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      // If clicking on the same sort option, toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to descending when changing sort field
    }
    setCurrentPage(1); // Reset to first page when sort changes
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      requested: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaHourglassHalf className="mr-1.5" /> },
      negotiating: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaBalanceScale className="mr-1.5" /> },
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: <FaHandshake className="mr-1.5" /> },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaCheckCircle className="mr-1.5" /> },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimes className="mr-1.5" /> },
      payment_pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FaMoneyBillWave className="mr-1.5" /> },
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaSpinner className="mr-1.5" /> };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status === 'payment_pending' ? 'Payment Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your contracts...</p>
        </div>
      </div>
    );
  }

  if (error && contracts.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <FaExclamationTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Contracts</h3>
        <p className="text-gray-600 mb-6 text-lg">
          {error === "You must be logged in to view contracts" 
            ? "You need to sign in to view your contracts." 
            : `${error}. Please try again or contact support if the problem persists.`}
        </p>
        <div className="space-x-4">
          <button
            onClick={fetchContracts}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-all hover:shadow-lg"
          >
            Try Again
          </button>
          {error === "You must be logged in to view contracts" && (
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname + location.search } })}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {title && (
        <div className="flex items-center mb-8">
          <FaHandshake className="text-green-600 mr-3 text-3xl" />
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        </div>
      )}
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-green-500 transition-transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Total Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaFileContract className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-indigo-500 transition-transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Active Contracts</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.byStatus?.active || 0}</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <FaHandshake className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-amber-500 transition-transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Total Invested</p>
                <p className="text-2xl font-bold text-amber-600">₹{formatCurrency(stats.totalValue || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <FaMoneyBillWave className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-blue-500 transition-transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Avg. Value</p>
                <p className="text-2xl font-bold text-blue-600">₹{formatCurrency(stats.averageValue || 0)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaChartLine className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      {showFilters && (
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-grow">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    placeholder="Search by product name..."
                    className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-12 flex items-center pr-2"
                    >
                      <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <FaArrowRight className="h-5 w-5 text-green-500 hover:text-green-700" />
                  </button>
                </div>
              </form>
            </div>
            
            {/* Status Filter */}
            <div className="md:w-64">
              <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaFilter className={`${statusFilter !== 'all' ? 'text-green-500' : 'text-gray-400'}`} />
                </div>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`block w-full pl-12 pr-10 py-3 border ${statusFilter !== 'all' ? 'border-green-300 bg-green-50' : 'border-gray-300'} rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-colors`}
                >
                  <option value="all">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="payment_pending">Payment Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <FaArrowDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            {/* Sort Options */}
            <div className="md:w-64">
              <label htmlFor="sort-by" className="sr-only">Sort by</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSort className={`${sortBy !== 'date' || sortOrder !== 'desc' ? 'text-green-500' : 'text-gray-400'}`} />
                </div>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className={`block w-full pl-12 pr-10 py-3 border ${sortBy !== 'date' || sortOrder !== 'desc' ? 'border-green-300 bg-green-50' : 'border-gray-300'} rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 appearance-none bg-white transition-colors`}
                >
                  <option value="date">Date {sortBy === 'date' && (sortOrder === 'desc' ? '(Latest)' : '(Oldest)')}</option>
                  <option value="price">Price {sortBy === 'price' && (sortOrder === 'desc' ? '(Highest)' : '(Lowest)')}</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-auto"
                >
                  {sortOrder === 'asc' ? 
                    <FaArrowUp className="w-4 h-4 text-green-600" /> : 
                    <FaArrowDown className="w-4 h-4 text-green-600" />
                  }
                </button>
              </div>
            </div>
          </div>
          
          {/* Active filters display */}
          {(searchQuery || statusFilter !== 'all' || sortBy !== 'date' || sortOrder !== 'desc') && (
            <div className="mt-4 flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <FaSearch className="mr-2 text-xs" />
                  Product: {searchQuery}
                  <button 
                    onClick={handleClearSearch}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <FaFilter className="mr-2 text-xs" />
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {(sortBy !== 'date' || sortOrder !== 'desc') && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <FaSort className="mr-2 text-xs" />
                  Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  <button 
                    onClick={() => {
                      setSortBy('date');
                      setSortOrder('desc');
                    }}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              <button 
                onClick={handleClearAllFilters}
                className="text-sm text-gray-500 underline hover:text-gray-700 ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <EmptyState
            title={
              searchQuery || statusFilter !== 'all' 
                ? "No Matching Contracts Found" 
                : "No Contracts Found"
            }
            message={
              searchQuery && statusFilter !== 'all'
                ? `No contracts found with product "${searchQuery}" and status "${statusFilter}". Try adjusting your filters.`
                : searchQuery 
                  ? `No contracts found with product "${searchQuery}". Try a different product name.`
                  : statusFilter !== 'all'
                    ? `No contracts with status "${statusFilter}" found. Try a different status filter.`
                    : user?.role === 'farmer'
                      ? "You don't have any contracts yet. Once buyers make offers on your products, they'll appear here."
                      : "You don't have any contracts yet. Browse available products to make offers to farmers."
            }
            icon={<FaFileContract className="text-gray-400 w-16 h-16 mx-auto" />}
            actionText={
              searchQuery || statusFilter !== 'all' 
                ? "Clear Filters" 
                : user?.role === 'farmer' 
                  ? "Manage Products" 
                  : "Browse Products"
            }
            actionLink={
              searchQuery || statusFilter !== 'all' 
                ? "#" 
                : user?.role === 'farmer' 
                  ? "/dashboard/products" 
                  : "/products"
            }
            onActionClick={
              (searchQuery || statusFilter !== 'all') 
                ? () => {
                    handleClearAllFilters();
                    return false; // Prevent default navigation
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom contract cards instead of using ContractSummaryList */}
          {contracts.map(contract => (
            <div 
              key={contract._id}
              onClick={() => navigate(`/contracts/${contract._id}`)}
              className="bg-white shadow-md hover:shadow-lg rounded-xl overflow-hidden transition-all cursor-pointer border border-gray-100 hover:border-green-500"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  {/* Left column - Contract info */}
                  <div className="flex items-start space-x-4">
                    {/* Status badge */}
                    <div className="flex-shrink-0 mt-1">
                      {getStatusBadge(contract.status)}
                    </div>
                    
                    {/* Contract details */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{contract.crop?.name}</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaUserTie className="mr-2 text-gray-400" />
                          <span>Farmer: {contract.farmer?.name}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <FaLeaf className="mr-2 text-gray-400" />
                          <span>Product: {contract.crop?.name}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          <span>Created: {formatDate(contract.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right column - Price and details */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{formatCurrency(contract.totalAmount)}</p>
                      <p className="text-sm text-gray-500">{contract.quantity} {contract.unit}</p>
                    </div>
                    
                    <button
                      className="mt-4 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/contracts/${contract._id}`);
                      }}
                    >
                      View Details
                      <svg 
                        className="ml-2 w-5 h-5" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Contract progress bar */}
              <div className="bg-gray-50 px-6 py-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Contract Progress</span>
                  <span className="font-medium">
                    {contract.status === 'completed' ? '100%' : 
                     contract.status === 'active' ? '50%' :
                     contract.status === 'payment_pending' ? '35%' :
                     contract.status === 'negotiating' ? '25%' :
                     contract.status === 'requested' ? '10%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      contract.status === 'completed' ? 'bg-blue-600' : 
                      contract.status === 'active' ? 'bg-green-600' :
                      contract.status === 'payment_pending' ? 'bg-yellow-600' :
                      contract.status === 'negotiating' ? 'bg-purple-600' :
                      contract.status === 'requested' ? 'bg-amber-600' : 'bg-red-600'
                    }`}
                    style={{ 
                      width: contract.status === 'completed' ? '100%' : 
                             contract.status === 'active' ? '50%' :
                             contract.status === 'payment_pending' ? '35%' :
                             contract.status === 'negotiating' ? '25%' :
                             contract.status === 'requested' ? '10%' : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  // Update the page and scroll to top
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <div className="text-center text-sm text-gray-500 mt-2">
                Showing page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractsList; 