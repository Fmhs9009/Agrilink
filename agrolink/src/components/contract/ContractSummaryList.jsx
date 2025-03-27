import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaLeaf, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaSearch, 
  FaFilter,
  FaSort,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCheck,
  FaExchangeAlt,
  FaHandshake,
  FaClipboardCheck,
  FaTractor,
  FaUser,
  FaClock,
  FaInfoCircle,
  FaArrowRight
} from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loader from '../layout/Loader';
import toast from 'react-hot-toast';
import { contractAPI } from '../../services/api';

const ContractSummaryList = ({ 
  title = "Contracts", 
  initialContracts = [], 
  limit = 5,
  showFilters = true,
  showViewAll = true,
  userRole = 'buyer'
}) => {
  const [contracts, setContracts] = useState(initialContracts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  useEffect(() => {
    if (initialContracts.length === 0) {
      fetchContracts();
    }
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = userRole === 'farmer' 
        ? await contractAPI.getByFarmer()
        : await contractAPI.getByBuyer();
      
      if (response.success) {
        setContracts(response.contracts || []);
      } else {
        setError('Failed to fetch contracts');
        toast.error('Failed to load contracts');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch contracts');
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negotiating': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

  const filteredContracts = contracts
    .filter(contract => {
      const matchesSearch = contract.crop?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contract.farmer?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'amount') {
        return sortOrder === 'desc'
          ? b.totalAmount - a.totalAmount
          : a.totalAmount - b.totalAmount;
      }
      return 0;
    })
    .slice(0, limit);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaFilter className="mr-2" />
              Filters
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="requested">Requested</option>
                <option value="negotiating">Negotiating</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => {
          const statusClass = getStatusColor(contract.status);
          const statusIcon = getStatusIcon(contract.status);
          
          return (
            <Link 
              key={contract._id} 
              to={`/contracts/${contract._id}`}
              className="block group"
            >
              <div className="border border-gray-200 hover:border-green-500 rounded-lg p-4 transition-all hover:shadow-md">
                <div className="flex items-start">
                  {/* Product Image */}
                  <div className="relative w-28 h-28 flex-shrink-0 mr-4">
                    {contract.crop?.images && contract.crop.images.length > 0 ? (
                      <img 
                        src={contract.crop.images[0].url} 
                        alt={contract.crop.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://source.unsplash.com/300x300/?${contract.crop.name},farm,agriculture`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <FaLeaf className="text-green-500 text-3xl" />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 ${statusClass} px-2 py-1 rounded-full text-xs font-medium flex items-center`}>
                      {statusIcon}
                      <span className="ml-1">{contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span>
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 text-lg">{contract.crop?.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <FaUser className="mr-1" />
                          <span>{contract.farmer?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-bold text-lg">₹{formatCurrency(contract.totalAmount)}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {contract.quantity} {contract.unit}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          <FaCalendarAlt className="inline mr-1" />
                          Created: {formatDate(contract.createdAt)}
                        </div>
                        {contract.expectedHarvestDate && (
                          <div className="text-sm text-gray-600">
                            <FaTractor className="inline mr-1" />
                            Harvest: {formatDate(contract.expectedHarvestDate)}
                          </div>
                        )}
                        {contract.farmer?.location && (
                          <div className="text-sm text-gray-600">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {contract.farmer.location}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-green-600 font-medium group-hover:text-green-700">
                        View Details →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredContracts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <FaInfoCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No contracts found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setShowFiltersPanel(false);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* View All Link */}
      {showViewAll && filteredContracts.length > 0 && (
        <div className="mt-6 text-center">
          <Link 
            to="/contracts" 
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            View All Contracts
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ContractSummaryList; 