import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFilter, FaSearch, FaSort, FaHandshake, FaCalendarAlt, FaLeaf, FaArrowRight, FaCheck, FaTimes, FaExchangeAlt, FaClipboardCheck } from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ContractSummaryList = ({ 
  title = "Contracts", 
  userRole, 
  initialContracts = [], 
  limit = 5, 
  showViewAll = true,
  showFilters = true 
}) => {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    setContracts(initialContracts);
    setFilteredContracts(initialContracts);
  }, [initialContracts]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, sortBy, sortOrder, contracts]);

  const applyFilters = () => {
    let result = [...contracts];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(contract => contract.status === statusFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(contract => 
        (contract.crop?.name.toLowerCase().includes(term)) ||
        (contract.farmer?.name.toLowerCase().includes(term)) ||
        (contract.status.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'price':
          compareValue = (a.totalAmount || 0) - (b.totalAmount || 0);
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    setFilteredContracts(result);
  };

  // Status color mapper
  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'negotiating': return 'bg-purple-100 text-purple-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Status icon mapper
  const getStatusIcon = (status) => {
    switch (status) {
      case 'requested': return <FaClipboardCheck />;
      case 'negotiating': return <FaExchangeAlt />;
      case 'active': return <FaHandshake />;
      case 'completed': return <FaCheck />;
      case 'cancelled': return <FaTimes />;
      default: return <FaClipboardCheck />;
    }
  };

  // Display only the limited number of contracts
  const displayedContracts = filteredContracts.slice(0, limit);

  return (
    <div>
      {title && <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>}
      
      {showFilters && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            {/* Search box */}
            <div className="flex-grow">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by crop, farmer, or status..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            {/* Status filter */}
            <div>
              <label htmlFor="status-filter" className="sr-only">Status</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <div className="px-3 py-2 bg-gray-50 text-gray-500 border-r border-gray-300">
                  <FaFilter />
                </div>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
            
            {/* Sort by */}
            <div>
              <label htmlFor="sort-by" className="sr-only">Sort by</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <div className="px-3 py-2 bg-gray-50 text-gray-500 border-r border-gray-300">
                  <FaSort />
                </div>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-0 focus:ring-0 focus:outline-none"
                >
                  <option value="date">Date</option>
                  <option value="price">Price</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  {sortOrder === 'asc' ? <FaSort /> : <FaSort />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {displayedContracts.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FaHandshake className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? "No contracts match your current search criteria." 
              : userRole === 'farmer'
                ? "You don't have any active contracts yet. Start by receiving offers from buyers."
                : "You don't have any contracts yet. Browse products to make offers to farmers."
            }
          </p>
          {searchTerm || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              Clear Filters
            </button>
          ) : (
            userRole !== 'farmer' && (
              <Link 
                to="/products" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                <FaLeaf className="mr-2" />
                Browse Products
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedContracts.map((contract) => (
            <Link key={contract._id} to={`/contracts/${contract._id}`} className="block">
              <div className="border border-gray-200 hover:border-green-500 rounded-lg p-4 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 ${getStatusColor(contract.status)} rounded-lg`}>
                      {getStatusIcon(contract.status)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{contract.crop?.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FaLeaf className="mr-1" />
                        <span>Farmer: {contract.farmer?.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FaCalendarAlt className="mr-1" />
                        <span>{formatDate(contract.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </span>
                    <p className="text-lg font-bold text-green-600 mt-1">₹{formatCurrency(contract.totalAmount)}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {showViewAll && filteredContracts.length > limit && (
        <div className="text-center mt-4">
          <Link 
            to="/contracts" 
            className="text-green-600 hover:text-green-800 font-medium inline-flex items-center"
          >
            View All <FaArrowRight className="ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ContractSummaryList; 