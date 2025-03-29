import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFilter, FaSearch, FaSort, FaFileContract, FaExclamationTriangle } from 'react-icons/fa';
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
  
  // Fetch contracts when filter values change
  useEffect(() => {
    if (!user || !user._id) {
      setLoading(false);
      setError("You must be logged in to view contracts");
      return;
    }
    
    fetchContracts();
    fetchContractStats();
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
  
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await contractAPI.getAll();
      
      if (response.success) {
        const contractsData = response.contracts || [];
        setContracts(contractsData);
        
        // Calculate stats excluding cancelled contracts
        const nonCancelledContracts = contractsData.filter(c => c.status !== 'cancelled');
        const activeContracts = contractsData.filter(c => c.status === 'active');
        
        const totalValue = nonCancelledContracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
        const averageValue = nonCancelledContracts.length > 0 
          ? totalValue / nonCancelledContracts.length 
          : 0;
        
        setStats({
          total: contractsData.length,
          byStatus: {
            active: activeContracts.length,
            pending: contractsData.filter(c => c.status === 'pending').length,
            completed: contractsData.filter(c => c.status === 'completed').length,
            cancelled: contractsData.filter(c => c.status === 'cancelled').length
          },
          totalValue,
          averageValue
        });
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchContractStats = async () => {
    try {
      const response = await contractAPI.getContractStats();
      if (response.success) {
        setStats(response.stats);
      } else {
        console.warn("Failed to load contract stats");
        setStats(null);
      }
    } catch (err) {
      console.warn("Error fetching contract stats:", err);
      setStats(null);
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
  
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when search changes
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && contracts.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <FaExclamationTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Contracts</h3>
        <p className="text-gray-500 mb-6">
          {error === "You must be logged in to view contracts" 
            ? "You need to sign in to view your contracts." 
            : `${error}. Please try again or contact support if the problem persists.`}
        </p>
        <div className="space-x-4">
          <button
            onClick={fetchContracts}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            Try Again
          </button>
          {error === "You must be logged in to view contracts" && (
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname + location.search } })}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {title && <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>}
      
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Contracts</p>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <p className="text-sm text-gray-500">Active Contracts</p>
            <p className="text-2xl font-bold text-green-600">{stats.byStatus?.active || 0}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Invested</p>
            <p className="text-2xl font-bold text-blue-600">₹{formatCurrency(stats.totalValue || 0)}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <p className="text-sm text-gray-500">Avg. Contract Value</p>
            <p className="text-2xl font-bold">₹{formatCurrency(stats.averageValue || 0)}</p>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      {showFilters && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-grow">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contracts..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </form>
            </div>
            
            {/* Status Filter */}
            <div className="md:w-48">
              <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <div className="px-3 py-2 bg-gray-50 text-gray-500 border-r border-gray-300">
                  <FaFilter />
                </div>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-0 focus:ring-0 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            {/* Sort Options */}
            <div className="md:w-48">
              <label htmlFor="sort-by" className="sr-only">Sort by</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <div className="px-3 py-2 bg-gray-50 text-gray-500 border-r border-gray-300">
                  <FaSort />
                </div>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-0 focus:ring-0 focus:outline-none"
                >
                  <option value="date">Date</option>
                  <option value="price">Price</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contracts List */}
      {contracts.length === 0 ? (
        <EmptyState
          title="No Contracts Found"
          message={
            searchQuery || statusFilter !== 'all' 
              ? "No contracts match your current search criteria. Try adjusting your filters." 
              : user?.role === 'farmer'
                ? "You don't have any contracts yet. Once buyers make offers on your products, they'll appear here."
                : "You don't have any contracts yet. Browse available products to make offers to farmers."
          }
          icon={<FaFileContract className="text-gray-400 w-12 h-12 mx-auto" />}
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
                  setSearchQuery('');
                  setStatusFilter('all');
                  return false; // Prevent default navigation
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ContractSummaryList
            title=""
            initialContracts={contracts}
            showFilters={false}
            limit={limit * 2} // Allow more contracts to be shown in this view
            showViewAll={false}
          />
          
          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractsList; 