import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaArrowLeft, FaHandshake, FaExclamationTriangle, FaUserTie, 
  FaCalendarAlt, FaLeaf, FaMoneyBillWave, FaClipboardList, 
  FaMapMarkerAlt, FaTruck, FaCheck, FaTimes, FaExchangeAlt, 
  FaClock, FaSpinner, FaFileContract, FaSeedling, FaPhone,
  FaEnvelope, FaWeightHanging, FaBoxOpen
} from 'react-icons/fa';
import { contractAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const ContractDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.loginData);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Fetch contract details on mount
  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);
  
  // Get contract details
  const fetchContractDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await contractAPI.getContractById(id);
      
      if (response.success && response.contract) {
        console.log("Contract details:", response.contract);
        setContract(response.contract);
      } else if (response.data) {
        // Handle alternative response format
        setContract(response.data);
      } else {
        throw new Error(response.message || "Failed to load contract details");
      }
    } catch (err) {
      console.error("Error fetching contract details:", err);
      setError(err.message || "Failed to load contract details");
      toast.error("Failed to load contract details");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle accepting a contract
  const handleAcceptContract = async () => {
    if (!contract || !contract._id) return;
    
    setActionLoading(true);
    try {
      const response = await contractAPI.updateContractStatus(contract._id, {
        status: 'active',
        statusNote: 'Accepted by farmer'
      });
      
      if (response.success) {
        toast.success("Contract accepted successfully");
        fetchContractDetails(); // Refresh contract data
      } else {
        throw new Error(response.message || "Failed to accept contract");
      }
    } catch (err) {
      console.error("Error accepting contract:", err);
      toast.error(err.message || "Failed to accept contract");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle rejecting a contract
  const handleRejectContract = async () => {
    if (!contract || !contract._id) return;
    
    setActionLoading(true);
    try {
      const response = await contractAPI.updateContractStatus(contract._id, {
        status: 'cancelled',
        statusNote: 'Rejected by farmer'
      });
      
      if (response.success) {
        toast.success("Contract rejected");
        fetchContractDetails(); // Refresh contract data
      } else {
        throw new Error(response.message || "Failed to reject contract");
      }
    } catch (err) {
      console.error("Error rejecting contract:", err);
      toast.error(err.message || "Failed to reject contract");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Get status badge with icon and color
  const getStatusBadge = (status) => {
    const statusConfig = {
      requested: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaClock className="mr-1.5" /> },
      negotiating: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaExchangeAlt className="mr-1.5" /> },
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: <FaHandshake className="mr-1.5" /> },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaCheck className="mr-1.5" /> },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimes className="mr-1.5" /> },
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaSpinner className="mr-1.5" /> };
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Check if the user can accept/reject this contract
  const canRespond = () => {
    if (!contract || !user) return false;
    
    // Only farmers can respond to requested contracts
    return (
      user.role === 'farmer' &&
      contract.status === 'requested' &&
      contract.farmer?._id === user._id
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white shadow-md rounded-lg p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <FaExclamationTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Contract</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={fetchContractDetails}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
          >
            <FaSpinner className="mr-2" />
            Try Again
          </button>
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <FaArrowLeft className="mr-2" />
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }
  
  // No contract found
  if (!contract) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white shadow-md rounded-lg p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <FaFileContract className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Contract Not Found</h3>
        <p className="text-gray-500 mb-6">We couldn't find the contract you're looking for.</p>
        <button
          onClick={() => navigate('/contracts')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <FaArrowLeft className="mr-2" />
          Back to Contracts
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/contracts')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaFileContract className="mr-3 text-green-600" />
          Contract Details
        </h1>
        <div className="ml-auto">
          {getStatusBadge(contract.status)}
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Contract Header */}
        <div className="bg-green-50 px-6 py-4 border-b border-green-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">{contract.crop?.name || 'Unnamed Contract'}</h2>
            <p className="text-lg font-bold text-green-600">₹{formatCurrency(contract.totalAmount || 0)}</p>
          </div>
          <p className="text-sm text-gray-600 mt-1">Contract #{contract._id}</p>
        </div>
        
        {/* Content in grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaClipboardList className="mr-2 text-gray-500" />
                Contract Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Contract Status</p>
                  <p className="font-medium">{getStatusBadge(contract.status)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Created Date</p>
                  <p className="font-medium flex items-center">
                    <FaCalendarAlt className="mr-1.5 text-gray-400" />
                    {formatDate(contract.createdAt)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium flex items-center">
                    <FaSeedling className="mr-1.5 text-gray-400" />
                    {contract.crop?.name || 'Unknown Product'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium flex items-center">
                    <FaWeightHanging className="mr-1.5 text-gray-400" />
                    {contract.quantity || 0} {contract.unit || 'units'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Price per Unit</p>
                  <p className="font-medium flex items-center">
                    <FaMoneyBillWave className="mr-1.5 text-gray-400" />
                    ₹{formatCurrency((contract.totalAmount || 0) / (contract.quantity || 1))} / {contract.unit || 'unit'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">₹{formatCurrency(contract.totalAmount || 0)}</p>
                </div>
              </div>
              
              {contract.contractNotes && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-1">Contract Notes</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700">{contract.contractNotes}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaUserTie className="mr-2 text-gray-500" />
                Parties Information
              </h3>
              
              <div className="space-y-6">
                {/* Farmer Details */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Farmer</h4>
                  <div className="space-y-2">
                    <p className="text-sm flex items-center">
                      <FaUserTie className="mr-1.5 text-gray-400" />
                      {contract.farmer?.name || 'Unknown Farmer'}
                    </p>
                    {contract.farmer?.email && (
                      <p className="text-sm flex items-center">
                        <FaEnvelope className="mr-1.5 text-gray-400" />
                        {contract.farmer.email}
                      </p>
                    )}
                    {contract.farmer?.contactNumber && (
                      <p className="text-sm flex items-center">
                        <FaPhone className="mr-1.5 text-gray-400" />
                        {contract.farmer.contactNumber}
                      </p>
                    )}
                    {contract.farmer?.FarmLocation && (
                      <p className="text-sm flex items-start">
                        <FaMapMarkerAlt className="mr-1.5 mt-1 text-gray-400" />
                        <span>{contract.farmer.FarmLocation}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Buyer Details */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Buyer</h4>
                  <div className="space-y-2">
                    <p className="text-sm flex items-center">
                      <FaUserTie className="mr-1.5 text-gray-400" />
                      {contract.buyer?.name || 'Unknown Buyer'}
                    </p>
                    {contract.buyer?.email && (
                      <p className="text-sm flex items-center">
                        <FaEnvelope className="mr-1.5 text-gray-400" />
                        {contract.buyer.email}
                      </p>
                    )}
                    {contract.buyer?.contactNumber && (
                      <p className="text-sm flex items-center">
                        <FaPhone className="mr-1.5 text-gray-400" />
                        {contract.buyer.contactNumber}
                      </p>
                    )}
                    {contract.deliveryAddress && (
                      <p className="text-sm flex items-start">
                        <FaTruck className="mr-1.5 mt-1 text-gray-400" />
                        <span>Delivery to: {contract.deliveryAddress}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status Timeline */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Contract Progress</h4>
                <div className="space-y-4">
                  <div className="relative flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      ['requested', 'negotiating', 'active', 'completed'].includes(contract.status) 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <FaClipboardList />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Requested</p>
                      <p className="text-xs text-gray-500">
                        {contract.status === 'requested' ? 'Current stage' : 'Completed'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      ['active', 'completed'].includes(contract.status) 
                        ? 'bg-green-100 text-green-600' 
                        : contract.status === 'negotiating'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      <FaHandshake />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Active</p>
                      <p className="text-xs text-gray-500">
                        {contract.status === 'active' ? 'Current stage' : 
                         contract.status === 'completed' ? 'Completed' : 
                         'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      contract.status === 'completed' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <FaBoxOpen />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Completed</p>
                      <p className="text-xs text-gray-500">
                        {contract.status === 'completed' ? 'Contract fulfilled' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        {canRespond() && (
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={handleRejectContract}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Processing...' : 'Reject Contract'}
            </button>
            <button
              onClick={handleAcceptContract}
              disabled={actionLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Processing...' : 'Accept Contract'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDetailsView; 