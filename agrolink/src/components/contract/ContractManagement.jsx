import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaHandshake, FaSearch, FaFilter, FaEye, FaCheck, FaTimes, FaSort, FaSortUp, FaSortDown, FaFileContract, FaDownload, FaFileSignature } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { contractAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';

const ContractManagement = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.loginData);
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [actionType, setActionType] = useState(null);
  
  // Fetch contracts
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const response = await contractAPI.getAll();
        
        // Ensure data is in the expected format
        const contractsData = Array.isArray(response.data) ? response.data : 
                            (response.data?.contracts || []);
        
        // Filter contracts by the current user if needed
        const userContracts = user?.role === 'admin' 
          ? contractsData 
          : contractsData.filter(contract => 
              contract.farmer?._id === user?._id || 
              contract.buyer?._id === user?._id
            );
        
        setContracts(userContracts);
        setError(null);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setError('Failed to load contracts. Please try again.');
        toast.error('Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContracts();
  }, [user]);
  
  // Handle contract actions (accept, reject, complete)
  const handleContractAction = async () => {
    if (!selectedContract || !actionType) return;
    
    try {
      setLoading(true);
      let response;
      
      switch (actionType) {
        case 'accept':
          response = await contractAPI.accept(selectedContract._id);
          break;
        case 'reject':
          response = await contractAPI.reject(selectedContract._id);
          break;
        case 'complete':
          response = await contractAPI.complete(selectedContract._id);
          break;
        default:
          throw new Error('Invalid action type');
      }
      
      if (response.data?.success) {
        // Update local state
        const updatedContracts = contracts.map(c => 
          c._id === selectedContract._id 
            ? { ...c, status: actionType === 'accept' ? 'active' : actionType === 'reject' ? 'cancelled' : 'completed' } 
            : c
        );
        
        setContracts(updatedContracts);
        
        // Show success message
        const actionMessages = {
          accept: 'Contract accepted successfully',
          reject: 'Contract rejected',
          complete: 'Contract marked as completed'
        };
        
        toast.success(actionMessages[actionType]);
      } else {
        toast.error(response.data?.message || 'Action failed');
      }
    } catch (err) {
      console.error(`Error ${actionType}ing contract:`, err);
      toast.error(`Failed to ${actionType} contract`);
    } finally {
      setLoading(false);
      setShowActionModal(false);
      setSelectedContract(null);
      setActionType(null);
    }
  };
  
  // Confirm action
  const confirmAction = (contract, action) => {
    setSelectedContract(contract);
    setActionType(action);
    setShowActionModal(true);
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
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium',
      pending: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium',
      completed: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium',
      cancelled: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
    };
    return badges[status] || badges.pending;
  };
  
  // Filter and sort contracts
  const filteredContracts = contracts
    .filter(contract => {
      // Search filter
      const matchesSearch = 
        contract.contractId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Handle sorting
      let comparison = 0;
      
      switch (sortField) {
        case 'contractId':
          comparison = a.contractId?.localeCompare(b.contractId || '');
          break;
        case 'product':
          comparison = a.product?.name?.localeCompare(b.product?.name || '');
          break;
        case 'buyer':
          comparison = a.buyer?.name?.localeCompare(b.buyer?.name || '');
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'status':
          comparison = a.status?.localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p className="font-medium">Error loading contracts</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contract Management</h1>
              <p className="text-gray-600 mt-1">
                Manage your farming contracts and agreements
              </p>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search contracts..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaFilter className="text-gray-400" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contracts Table */}
          {loading ? (
            <LoadingSpinner message="Loading contracts..." />
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {filteredContracts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('contractId')}
                        >
                          <div className="flex items-center">
                            Contract ID {getSortIcon('contractId')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('product')}
                        >
                          <div className="flex items-center">
                            Product {getSortIcon('product')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('buyer')}
                        >
                          <div className="flex items-center">
                            Buyer {getSortIcon('buyer')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center">
                            Status {getSortIcon('status')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center">
                            Amount {getSortIcon('amount')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center">
                            Date {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredContracts.map((contract) => (
                        <tr key={contract._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {contract.contractId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contract.product?.name || 'Unknown Product'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contract.buyer?.name || 'Unknown Buyer'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(contract.status)}>
                              {contract.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₹{formatCurrency(contract.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(contract.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link 
                              to={`/contracts/${contract._id}`}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              <FaEye className="inline mr-1" />
                              View
                            </Link>
                            
                            {contract.status === 'pending' && user?.role === 'farmer' && (
                              <>
                                <button 
                                  onClick={() => confirmAction(contract, 'accept')}
                                  className="text-green-600 hover:text-green-800 mr-3"
                                >
                                  <FaCheck className="inline mr-1" />
                                  Accept
                                </button>
                                <button 
                                  onClick={() => confirmAction(contract, 'reject')}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FaTimes className="inline mr-1" />
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {contract.status === 'active' && (
                              <button 
                                onClick={() => confirmAction(contract, 'complete')}
                                className="text-green-600 hover:text-green-800 mr-3"
                              >
                                <FaFileSignature className="inline mr-1" />
                                Complete
                              </button>
                            )}
                            
                            {contract.status === 'completed' && (
                              <button 
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaDownload className="inline mr-1" />
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FaHandshake className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'Add products to your inventory to receive contract offers'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Action Confirmation Modal */}
      {showActionModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    {actionType === 'accept' && <FaCheck className="h-5 w-5 text-green-600" />}
                    {actionType === 'reject' && <FaTimes className="h-5 w-5 text-red-600" />}
                    {actionType === 'complete' && <FaFileSignature className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {actionType === 'accept' && 'Accept Contract'}
                      {actionType === 'reject' && 'Reject Contract'}
                      {actionType === 'complete' && 'Complete Contract'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {actionType === 'accept' && 'Are you sure you want to accept this contract? This will create a binding agreement between you and the buyer.'}
                        {actionType === 'reject' && 'Are you sure you want to reject this contract? This action cannot be undone.'}
                        {actionType === 'complete' && 'Are you sure you want to mark this contract as completed? This indicates that all terms have been fulfilled.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleContractAction}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${
                    actionType === 'reject' 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                >
                  {actionType === 'accept' && 'Accept'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'complete' && 'Complete'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedContract(null);
                    setActionType(null);
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

export default ContractManagement; 