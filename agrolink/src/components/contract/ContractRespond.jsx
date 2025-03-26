import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  FaFileContract
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { contractAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ROLES } from '../../config/constants';

const ContractRespond = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Get action from URL params (accept, reject, negotiate)
  const actionParam = searchParams.get('action');
  
  // State variables
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(actionParam === 'reject' ? 'reject' : actionParam === 'negotiate' ? 'negotiate' : 'accept');
  const [remarks, setRemarks] = useState('');
  
  // Counter offer form state
  const [counterOffer, setCounterOffer] = useState({
    quantity: '',
    pricePerUnit: '',
    deliveryDate: '',
    paymentTerms: '',
    remarks: ''
  });
  
  // Fetch contract details
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Only farmers can respond to contracts
    if (user.accountType !== ROLES.FARMER) {
      toast.error('Only farmers can respond to contract requests');
      navigate('/contracts');
      return;
    }
    
    fetchContractDetails();
  }, [id, isAuthenticated, user, navigate]);
  
  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contractAPI.getContractById(id);
      
      if (response.success) {
        const contractData = response.contract;
        
        // Check if contract is in pending status
        if (contractData.status !== 'pending') {
          toast.error('This contract is no longer pending and cannot be responded to');
          navigate(`/contracts/${id}`);
          return;
        }
        
        // Check if user is the farmer for this contract
        if (contractData.farmer._id !== user.id) {
          toast.error('You are not authorized to respond to this contract');
          navigate('/contracts');
          return;
        }
        
        setContract(contractData);
        
        // Initialize counter offer form with contract values
        setCounterOffer({
          quantity: contractData.quantity,
          pricePerUnit: contractData.pricePerUnit,
          deliveryDate: contractData.deliveryDate ? new Date(contractData.deliveryDate).toISOString().split('T')[0] : '',
          paymentTerms: contractData.paymentTerms || '',
          remarks: ''
        });
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
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCounterOffer({
      ...counterOffer,
      [name]: value
    });
  };
  
  // Handle remarks input change
  const handleRemarksChange = (e) => {
    setRemarks(e.target.value);
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle negotiate contract
  const handleNegotiateContract = async (e) => {
    e.preventDefault();
    
    if (!counterOffer.remarks.trim()) {
      toast.error('Please provide an explanation for your counter offer');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const negotiationData = {
        status: 'negotiation',
        counterOffer: {
          quantity: parseFloat(counterOffer.quantity),
          pricePerUnit: parseFloat(counterOffer.pricePerUnit),
          deliveryDate: counterOffer.deliveryDate,
          paymentTerms: counterOffer.paymentTerms,
          remarks: counterOffer.remarks
        }
      };
      
      const response = await contractAPI.updateContractStatus(id, negotiationData);
      
      if (response.success) {
        toast.success('Counter offer submitted successfully');
        navigate(`/contracts/${id}`);
      } else {
        throw new Error(response.message || 'Failed to submit counter offer');
      }
    } catch (error) {
      console.error('Error submitting counter offer:', error);
      toast.error(error.message || 'An error occurred while submitting your counter offer');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle accept contract
  const handleAcceptContract = async () => {
    try {
      setSubmitting(true);
      
      const response = await contractAPI.updateContractStatus(id, {
        status: 'accepted',
        remarks: remarks
      });
      
      if (response.success) {
        toast.success('Contract accepted successfully!');
        navigate(`/contracts/${id}`);
      } else {
        throw new Error(response.message || 'Failed to accept contract');
      }
    } catch (error) {
      console.error('Error accepting contract:', error);
      toast.error(error.message || 'An error occurred while accepting the contract');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle reject contract
  const handleRejectContract = async () => {
    if (!remarks.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await contractAPI.updateContractStatus(id, {
        status: 'rejected',
        remarks: remarks
      });
      
      if (response.success) {
        toast.success('Contract rejected successfully');
        navigate(`/contracts/${id}`);
      } else {
        throw new Error(response.message || 'Failed to reject contract');
      }
    } catch (error) {
      console.error('Error rejecting contract:', error);
      toast.error(error.message || 'An error occurred while rejecting the contract');
    } finally {
      setSubmitting(false);
    }
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
              onClick={() => navigate(`/contracts/${id}`)}
              className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 mb-2"
            >
              <FaArrowLeft className="mr-1" />
              Back to Contract Details
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaHandshake className="mr-2 text-green-600" />
              Respond to Contract Request
            </h1>
            <p className="text-gray-600 mt-1">
              Contract ID: {contract._id}
            </p>
          </div>
        </div>
      </div>
      
      {/* Contract Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Buyer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaUser className="mr-2 text-blue-500" />
            Buyer Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <FaUser className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Name:</p>
                <p className="text-sm font-medium text-gray-900">{contract.buyer.name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <FaEnvelope className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email:</p>
                <p className="text-sm font-medium text-gray-900">{contract.buyer.email}</p>
              </div>
            </div>
            <div className="flex items-start">
              <FaPhone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Phone:</p>
                <p className="text-sm font-medium text-gray-900">{contract.buyer.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <FaMapMarkerAlt className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Location:</p>
                <p className="text-sm font-medium text-gray-900">
                  {contract.buyer.city ? `${contract.buyer.city}, ${contract.buyer.state}` : 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaShoppingBasket className="mr-2 text-green-500" />
            Product Information
          </h2>
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 h-16 w-16 rounded-md bg-gray-200 overflow-hidden mr-4">
              {contract.crop.images && contract.crop.images.length > 0 ? (
                <img
                  src={contract.crop.images[0].url || contract.crop.images[0]}
                  alt={contract.crop.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200">
                  <FaShoppingBasket className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">{contract.crop.name}</h3>
              <p className="text-xs text-gray-500">{contract.crop.category}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Quantity:</span>
              <span className="text-sm font-medium text-gray-900">{contract.quantity} {contract.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Price per Unit:</span>
              <span className="text-sm font-medium text-gray-900">₹{formatCurrency(contract.pricePerUnit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Amount:</span>
              <span className="text-sm font-medium text-green-600">₹{formatCurrency(contract.totalAmount)}</span>
            </div>
          </div>
        </div>
        
        {/* Contract Terms */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaFileContract className="mr-2 text-purple-500" />
            Contract Terms
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <FaCalendarAlt className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Request Date:</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(contract.createdAt)}</p>
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
      
      {/* Response Options */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('accept')}
              className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'accept'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaCheck className="inline-block mr-2" />
              Accept
            </button>
            <button
              onClick={() => handleTabChange('reject')}
              className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'reject'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaTimes className="inline-block mr-2" />
              Reject
            </button>
            <button
              onClick={() => handleTabChange('negotiate')}
              className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'negotiate'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaExchangeAlt className="inline-block mr-2" />
              Negotiate
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'accept' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Accept Contract</h3>
              <p className="text-gray-600 mb-4">
                By accepting this contract, you agree to fulfill the order according to the terms specified above.
              </p>
              
              <div className="mb-4">
                <label htmlFor="accept-remarks" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Remarks (Optional)
                </label>
                <textarea
                  id="accept-remarks"
                  rows={3}
                  className="shadow-sm block w-full focus:ring-green-500 focus:border-green-500 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Any comments or additional information..."
                  value={remarks}
                  onChange={handleRemarksChange}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleAcceptContract}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Accept Contract
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'reject' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Contract</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this contract request. This will help the buyer understand your decision.
              </p>
              
              <div className="mb-4">
                <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  className="shadow-sm block w-full focus:ring-red-500 focus:border-red-500 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Please explain why you are rejecting this contract..."
                  value={remarks}
                  onChange={handleRemarksChange}
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleRejectContract}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaTimes className="mr-2" />
                      Reject Contract
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'negotiate' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Negotiate Terms</h3>
              <p className="text-gray-600 mb-4">
                Propose different terms for this contract. The buyer will have the option to accept, reject, or
                continue negotiating.
              </p>
              
              <form onSubmit={handleNegotiateContract}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      className="shadow-sm block w-full focus:ring-purple-500 focus:border-purple-500 sm:text-sm border border-gray-300 rounded-md"
                      value={counterOffer.quantity}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Unit (₹)
                    </label>
                    <input
                      type="number"
                      id="pricePerUnit"
                      name="pricePerUnit"
                      className="shadow-sm block w-full focus:ring-purple-500 focus:border-purple-500 sm:text-sm border border-gray-300 rounded-md"
                      value={counterOffer.pricePerUnit}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      id="deliveryDate"
                      name="deliveryDate"
                      className="shadow-sm block w-full focus:ring-purple-500 focus:border-purple-500 sm:text-sm border border-gray-300 rounded-md"
                      value={counterOffer.deliveryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <select
                      id="paymentTerms"
                      name="paymentTerms"
                      className="shadow-sm block w-full focus:ring-purple-500 focus:border-purple-500 sm:text-sm border border-gray-300 rounded-md"
                      value={counterOffer.paymentTerms}
                      onChange={handleInputChange}
                    >
                      <option value="">Select payment terms</option>
                      <option value="standard">Standard (50% advance, 50% on delivery)</option>
                      <option value="milestone">Milestone (20% advance, 50% at midpoint, 30% on delivery)</option>
                      <option value="delivery">On Delivery (100% on delivery)</option>
                      <option value="advance">Full Advance (100% upfront)</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation for Counter Offer <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows={3}
                    className="shadow-sm block w-full focus:ring-purple-500 focus:border-purple-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Explain your counter offer and proposed changes..."
                    value={counterOffer.remarks}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaExchangeAlt className="mr-2" />
                        Submit Counter Offer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractRespond; 