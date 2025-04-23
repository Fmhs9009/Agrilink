import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FaFilter, FaSearch, FaSort, FaFileContract, FaExclamationTriangle, 
  FaChartLine, FaMoneyBillWave, FaHandshake, FaBalanceScale,
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaCheckCircle, 
  FaTimes, FaSpinner, FaHourglassHalf, FaUserTie, FaLeaf,
  FaSyncAlt, FaArrowRight
} from 'react-icons/fa';
import { contractAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const ContractsManager = () => {
  // Redux state
  const user = useSelector((state) => state.auth.loginData);
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {
      active: 0,
      requested: 0,
      negotiating: 0,
      completed: 0,
      cancelled: 0
    },
    totalValue: 0,
    averageValue: 0
  });
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const navigate = useNavigate();
  
  // Fetch contracts on component mount
  useEffect(() => {
    fetchUserContracts();
  }, [user]);
  
  // Apply filters whenever filter conditions or contracts change
  useEffect(() => {
    if (contracts.length > 0) {
      applyFilters();
    }
  }, [contracts, searchQuery, statusFilter, sortBy, sortOrder]);
  
  // Fetch contracts for the current user
  const fetchUserContracts = async () => {
    if (!user || !user._id) {
      setLoading(false);
      setError("You must be logged in to view contracts");
      return;
    }
    
    setLoading(true);
    try {
      let contractsData = [];
      
      // Different API endpoints based on user role
      if (user.role === 'farmer') {
        console.log("Fetching contracts for farmer:", user._id);
        const response = await contractAPI.getByFarmer(user._id);
        contractsData = response.contracts || response.data || [];
      } else {
        console.log("Fetching contracts for buyer:", user._id);
        const response = await contractAPI.getByBuyer(user._id);
        contractsData = response.contracts || response.data || [];
      }
      
      console.log("Fetched contracts:", contractsData);
      
      if (!Array.isArray(contractsData)) {
        console.error("Invalid contracts data format:", contractsData);
        contractsData = [];
      }
      
      setContracts(contractsData);
      setFilteredContracts(contractsData);
      
      // Calculate contract statistics
      calculateStats(contractsData);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError("Failed to load your contracts. Please try again.");
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate statistics from contract data
  const calculateStats = (contractsData) => {
    if (!contractsData || !Array.isArray(contractsData) || contractsData.length === 0) {
      setStats({
        total: 0,
        byStatus: {
          active: 0,
          requested: 0,
          negotiating: 0,
          completed: 0,
          cancelled: 0
        },
        totalValue: 0,
        averageValue: 0
      });
      return;
    }
    
    // Count contracts by status
    const byStatus = {
      active: 0,
      requested: 0,
      negotiating: 0,
      completed: 0,
      cancelled: 0
    };
    
    contractsData.forEach(contract => {
      if (contract.status && byStatus[contract.status] !== undefined) {
        byStatus[contract.status]++;
      }
    });
    
    // Calculate total value and average value
    const nonCancelled = contractsData.filter(c => c.status !== 'cancelled');
    const totalValue = nonCancelled.reduce((sum, c) => sum + (parseFloat(c.totalAmount) || 0), 0);
    const averageValue = nonCancelled.length > 0 ? totalValue / nonCancelled.length : 0;
    
    setStats({
      total: contractsData.length,
      byStatus,
      totalValue,
      averageValue
    });
  };
  
  // Apply filters to contracts
  const applyFilters = () => {
    // Start with all contracts
    let result = [...contracts];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(contract => contract.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(contract => {
        // Search in multiple fields
        return (
          (contract.crop?.name || '').toLowerCase().includes(query) ||
          (contract.farmer?.name || '').toLowerCase().includes(query) ||
          (contract.status || '').toLowerCase().includes(query)
        );
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let compareResult = 0;
      
      switch (sortBy) {
        case 'date':
          compareResult = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          break;
        case 'price':
          compareResult = (parseFloat(b.totalAmount) || 0) - (parseFloat(a.totalAmount) || 0);
          break;
        case 'status':
          compareResult = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          compareResult = 0;
      }
      
      // Apply sort order
      return sortOrder === 'asc' ? -compareResult : compareResult;
    });
    
    setFilteredContracts(result);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  // Handle sort field change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };
  
  // Status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      requested: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaHourglassHalf className="mr-1.5" /> },
      negotiating: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaBalanceScale className="mr-1.5" /> },
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: <FaHandshake className="mr-1.5" /> },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaCheckCircle className="mr-1.5" /> },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimes className="mr-1.5" /> },
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaSpinner className="mr-1.5" /> };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Navigate to contract details
  const viewContractDetails = (id) => {
    navigate(`/contracts/${id}`);
  };
  
  // Show loading state
  if (loading && contracts.length === 0) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your contracts...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && contracts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white shadow-md rounded-lg p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <FaExclamationTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Contracts</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={fetchUserContracts}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <FaSyncAlt className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <FaHandshake className="text-green-600 mr-3 h-7 w-7" />
          <h1 className="text-2xl font-bold text-gray-900">Your Contracts</h1>
        </div>
        <button
          onClick={fetchUserContracts}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          <FaSyncAlt className="mr-1.5" />
          Refresh
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Contracts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <FaFileContract className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Active Contracts</p>
              <p className="text-2xl font-bold text-blue-600">{stats.byStatus.active}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <FaHandshake className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-amber-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-amber-600">₹{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-full">
              <FaMoneyBillWave className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-4 border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Avg. Contract Value</p>
              <p className="text-2xl font-bold text-purple-600">₹{formatCurrency(stats.averageValue)}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <FaChartLine className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:gap-4">
          {/* Search */}
          <div className="flex-grow">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search contracts..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
                />
              </div>
            </form>
          </div>
          
          {/* Status Filter */}
          <div className="md:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
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
          <div className="md:w-64 flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSort className="text-gray-400" />
              </div>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
            <button
              onClick={toggleSortOrder}
              className="ml-2 p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 focus:outline-none"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
            </button>
          </div>
        </div>
        
        {/* Active filters display */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="ml-1.5 text-blue-600 hover:text-blue-800">
                  <FaTimes className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <button onClick={() => setStatusFilter('all')} className="ml-1.5 text-green-600 hover:text-green-800">
                  <FaTimes className="h-3 w-3" />
                </button>
              </span>
            )}
            
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 ml-2 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      
      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FaFileContract className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts Found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? "No contracts match your current search criteria."
              : "You don't have any contracts yet."}
          </p>
          {searchQuery || statusFilter !== 'all' ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              Browse Products
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map(contract => (
            <div
              key={contract._id}
              className="bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 hover:border-green-500"
              onClick={() => viewContractDetails(contract._id)}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  {/* Contract Info */}
                  <div className="flex items-start space-x-4">
                    {/* Status Badge */}
                    <div className="flex-shrink-0 mt-1">
                      {getStatusBadge(contract.status)}
                    </div>
                    
                    {/* Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {contract.crop?.name || 'Unnamed Contract'}
                      </h3>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaUserTie className="mr-1.5 text-gray-400" />
                          <span>Farmer: {contract.farmer?.name || 'Unknown'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <FaCalendarAlt className="mr-1.5 text-gray-400" />
                          <span>Created: {formatDate(contract.createdAt) || 'Unknown date'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">₹{formatCurrency(contract.totalAmount || 0)}</p>
                      <p className="text-sm text-gray-600">{contract.quantity || 0} {contract.unit || 'units'}</p>
                    </div>
                    
                    <button
                      className="mt-2 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewContractDetails(contract._id);
                      }}
                    >
                      View Details <FaArrowRight className="ml-1.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="bg-gray-50 px-5 py-2">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Contract Progress</span>
                  <span>
                    {contract.status === 'completed' ? '100%' :
                     contract.status === 'active' ? '50%' :
                     contract.status === 'negotiating' ? '25%' :
                     contract.status === 'requested' ? '10%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      contract.status === 'completed' ? 'bg-blue-600' :
                      contract.status === 'active' ? 'bg-green-600' :
                      contract.status === 'negotiating' ? 'bg-purple-600' :
                      contract.status === 'requested' ? 'bg-amber-600' : 'bg-red-600'
                    }`}
                    style={{
                      width: contract.status === 'completed' ? '100%' :
                             contract.status === 'active' ? '50%' :
                             contract.status === 'negotiating' ? '25%' :
                             contract.status === 'requested' ? '10%' : '0%'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractsManager; 