import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaHandshake, 
  FaArrowLeft, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaCheck, 
  FaTimes, 
  FaExchangeAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaShoppingBasket,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaEdit,
  FaPrint,
  FaFileDownload,
  FaComments
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { contractAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ROLES } from '../../config/constants';

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // State variables
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch contract details
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchContractDetails();
  }, [id, isAuthenticated]);
  
  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contractAPI.getContractById(id);
      
      if (response.success) {
        setContract(response.contract);
      } else {
        throw new Error(response.message || 'Failed to fetch contract details');
      }
    } catch (error) {
      console.error('Error fetching contract details:', error);
      setError(error.message || 'An error occurred while fetching contract details');
      toast.error('Failed to load contract details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions
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
  
  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner message="Loading contract details..." />
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Contract</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={fetchContractDetails}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/contracts')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Back to Contracts
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render if contract not found
  if (!contract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Not Found</h3>
          <p className="text-gray-500 mb-4">The contract you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaArrowLeft className="mr-2" />
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <button
              onClick={() => navigate('/contracts')}
              className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 mb-2"
            >
              <FaArrowLeft className="mr-1" />
              Back to Contracts
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaHandshake className="mr-2 text-green-600" />
              Contract Details
            </h1>
            <p className="text-gray-600 mt-1">
              Contract ID: {contract._id}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {contract.status === 'pending' && user.accountType === ROLES.FARMER && (
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/contracts/${contract._id}/respond`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaCheck className="mr-2" />
                  Respond to Request
                </button>
              </div>
            )}
            
            {contract.status === 'negotiating' && (
              <button
                onClick={() => navigate(`/contracts/${contract._id}/negotiate`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <FaExchangeAlt className="mr-2" />
                Negotiate Terms
              </button>
            )}
            
            {contract.status === 'accepted' && (
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaPrint className="mr-2" />
                Print Contract
              </button>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(contract.status)}`}>
            {getStatusIcon(contract.status)}
            {formatStatus(contract.status)}
          </span>
          
          <span className="ml-4 text-sm text-gray-500">
            Created on {formatDate(contract.createdAt)}
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contract Details */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contract Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Product Information</h3>
                  <div className="flex items-start mb-4">
                    {contract.crop.images && contract.crop.images.length > 0 ? (
                      <img
                        src={contract.crop.images[0].url || contract.crop.images[0]}
                        alt={contract.crop.name}
                        className="h-16 w-16 rounded-md object-cover mr-3"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                        <FaShoppingBasket className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-medium text-gray-900">{contract.crop.name}</h4>
                      <p className="text-sm text-gray-500">{contract.crop.category}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Price: ₹{formatCurrency(contract.pricePerUnit)}/{contract.unit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <span className="text-sm font-medium text-gray-900">{contract.quantity} {contract.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Amount:</span>
                      <span className="text-sm font-medium text-green-600">₹{formatCurrency(contract.totalAmount)}</span>
                    </div>
                    {contract.crop.description && (
                      <div className="mt-3">
                        <span className="text-sm text-gray-500">Description:</span>
                        <p className="text-sm text-gray-700 mt-1">{contract.crop.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Contract Terms */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contract Terms</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Expected Harvest Date:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {contract.expectedHarvestDate ? formatDate(contract.expectedHarvestDate) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Date:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {contract.deliveryDate ? formatDate(contract.deliveryDate) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaExchangeAlt className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Frequency:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {contract.deliveryFrequency ? contract.deliveryFrequency.charAt(0).toUpperCase() + contract.deliveryFrequency.slice(1) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaMoneyBillWave className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Payment Terms:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {contract.paymentTerms ? contract.paymentTerms : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Requirements */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Requirements</h3>
                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Quality Requirements:</h4>
                    <p className="text-sm text-gray-700">
                      {contract.qualityRequirements || 'No specific quality requirements provided.'}
                    </p>
                  </div>
                  
                  {contract.specialRequirements && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Special Requirements:</h4>
                      <p className="text-sm text-gray-700">
                        {contract.specialRequirements}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Status History */}
          {contract.statusHistory && contract.statusHistory.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contract History</h2>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {contract.statusHistory.map((statusUpdate, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== contract.statusHistory.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ${getStatusBadgeClass(statusUpdate.status)}`}>
                                {getStatusIcon(statusUpdate.status)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  Status changed to <span className="font-medium">{formatStatus(statusUpdate.status)}</span>
                                  {statusUpdate.remarks && (
                                    <span className="text-gray-500"> - {statusUpdate.remarks}</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(statusUpdate.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Counter Offers */}
          {contract.counterOffers && contract.counterOffers.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Negotiation History</h2>
                <div className="space-y-6">
                  {contract.counterOffers.map((offer, index) => (
                    <div key={index} className="bg-gray-50 rounded-md p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Counter Offer #{index + 1}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            From: {offer.offerType === 'farmer' ? 'Farmer' : 'Buyer'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(offer.timestamp)}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Quantity:</p>
                          <p className="text-sm font-medium text-gray-900">{offer.quantity} {contract.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Price per Unit:</p>
                          <p className="text-sm font-medium text-gray-900">₹{formatCurrency(offer.pricePerUnit)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Amount:</p>
                          <p className="text-sm font-medium text-green-600">₹{formatCurrency(offer.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Delivery Date:</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(offer.deliveryDate)}</p>
                        </div>
                      </div>
                      
                      {offer.remarks && (
                        <div>
                          <p className="text-xs text-gray-500">Remarks:</p>
                          <p className="text-sm text-gray-700 mt-1">{offer.remarks}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column - Parties Information */}
        <div className="lg:col-span-1">
          {/* Farmer Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Farmer Information</h2>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FaUser className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">{contract.farmer.name}</h3>
                  {contract.farmer.farmName && (
                    <p className="text-sm text-gray-500">{contract.farmer.farmName}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {contract.farmer.location && (
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location:</p>
                      <p className="text-sm font-medium text-gray-900">{contract.farmer.location}</p>
                    </div>
                  </div>
                )}
                
                {contract.farmer.experience && (
                  <div className="flex items-start">
                    <FaCalendarAlt className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Experience:</p>
                      <p className="text-sm font-medium text-gray-900">{contract.farmer.experience} years</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <FaEnvelope className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email:</p>
                    <a href={`mailto:${contract.farmer.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {contract.farmer.email}
                    </a>
                  </div>
                </div>
                
                {contract.farmer.phone && (
                  <div className="flex items-start">
                    <FaPhone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone:</p>
                      <a href={`tel:${contract.farmer.phone}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {contract.farmer.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Buyer Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Buyer Information</h2>
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <FaUser className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">{contract.buyer.name}</h3>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <FaEnvelope className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email:</p>
                    <a href={`mailto:${contract.buyer.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {contract.buyer.email}
                    </a>
                  </div>
                </div>
                
                {contract.buyer.phone && (
                  <div className="flex items-start">
                    <FaPhone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone:</p>
                      <a href={`tel:${contract.buyer.phone}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {contract.buyer.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {contract.status === 'pending' && user.accountType === ROLES.FARMER && (
                  <>
                    <button
                      onClick={() => navigate(`/contracts/${contract._id}/respond`)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaCheck className="mr-2" />
                      Accept Contract
                    </button>
                    
                    <button
                      onClick={() => navigate(`/contracts/${contract._id}/respond?action=reject`)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTimes className="mr-2" />
                      Reject Contract
                    </button>
                    
                    <button
                      onClick={() => navigate(`/contracts/${contract._id}/negotiate`)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <FaExchangeAlt className="mr-2" />
                      Negotiate Terms
                    </button>
                  </>
                )}
                
                {contract.status === 'negotiating' && (
                  <button
                    onClick={() => navigate(`/contracts/${contract._id}/negotiate`)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <FaExchangeAlt className="mr-2" />
                    Continue Negotiation
                  </button>
                )}
                
                {contract.status === 'accepted' && (
                  <>
                    <button
                      onClick={() => window.print()}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaPrint className="mr-2" />
                      Print Contract
                    </button>
                    
                    <button
                      onClick={() => navigate(`/contracts/${contract._id}/download`)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaFileDownload className="mr-2" />
                      Download PDF
                    </button>
                  </>
                )}
                
                <Link
                  to={`/products/${contract.crop._id}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaShoppingBasket className="mr-2" />
                  View Product
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailPage; 