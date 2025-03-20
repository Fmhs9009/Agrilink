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
  FaEdit
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { contractAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ROLES } from '../../config/constants';

const ContractRespondPage = () => {
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
  }, [id, isAuthenticated, user]);
  
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
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contract Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Information */}
            <div>
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
                    Requested by: {contract.buyer.name}
                  </p>
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
            <div>
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
          {/* Accept Tab */}
          {activeTab === 'accept' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Accept Contract</h2>
              <p className="text-gray-500 mb-6">
                By accepting this contract, you agree to the terms and conditions specified above.
              </p>
              
              <div className="mb-6">
                <label htmlFor="acceptRemarks" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Remarks (optional)
                </label>
                <textarea
                  id="acceptRemarks"
                  name="acceptRemarks"
                  rows="3"
                  value={remarks}
                  onChange={handleRemarksChange}
                  placeholder="Add any additional notes or comments..."
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                ></textarea>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>The buyer will be notified that you've accepted their contract request.</li>
                  <li>You'll be able to communicate with the buyer to coordinate delivery details.</li>
                  <li>You are committing to provide the specified quantity of {contract.crop.name} by the agreed delivery date.</li>
                  <li>Payment will be processed according to the agreed payment terms.</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/contracts/${id}`)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAcceptContract}
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          
          {/* Reject Tab */}
          {activeTab === 'reject' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Reject Contract</h2>
              <p className="text-gray-500 mb-6">
                If you cannot fulfill this contract request, please provide a reason for rejection.
              </p>
              
              <div className="mb-6">
                <label htmlFor="rejectRemarks" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rejectRemarks"
                  name="rejectRemarks"
                  rows="3"
                  value={remarks}
                  onChange={handleRemarksChange}
                  placeholder="Please explain why you're rejecting this contract request..."
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  required
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">
                  Providing a clear reason helps the buyer understand your decision.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/contracts/${id}`)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectContract}
                  disabled={submitting || !remarks.trim()}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          
          {/* Negotiate Tab */}
          {activeTab === 'negotiate' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Negotiate Terms</h2>
              <p className="text-gray-500 mb-6">
                If you'd like to propose different terms for this contract, you can submit a counter offer.
              </p>
              
              <form onSubmit={handleNegotiateContract}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity ({contract.unit})
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        value={counterOffer.quantity}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Enter quantity"
                        min="1"
                        required
                      />
                    </div>
                    {contract.quantity !== counterOffer.quantity && (
                      <p className="mt-1 text-xs text-purple-600 flex items-center">
                        <FaExchangeAlt className="mr-1" />
                        Original: {contract.quantity} {contract.unit}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                      Price per {contract.unit} (₹)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        name="pricePerUnit"
                        id="pricePerUnit"
                        value={counterOffer.pricePerUnit}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Enter price per unit"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    {contract.pricePerUnit !== counterOffer.pricePerUnit && (
                      <p className="mt-1 text-xs text-purple-600 flex items-center">
                        <FaExchangeAlt className="mr-1" />
                        Original: ₹{formatCurrency(contract.pricePerUnit)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="date"
                        name="deliveryDate"
                        id="deliveryDate"
                        value={counterOffer.deliveryDate}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                    {contract.deliveryDate && contract.deliveryDate !== counterOffer.deliveryDate && (
                      <p className="mt-1 text-xs text-purple-600 flex items-center">
                        <FaExchangeAlt className="mr-1" />
                        Original: {formatDate(contract.deliveryDate)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <select
                        name="paymentTerms"
                        id="paymentTerms"
                        value={counterOffer.paymentTerms}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      >
                        <option value="">Select payment terms</option>
                        <option value="advance">Advance Payment</option>
                        <option value="partial">Partial Advance</option>
                        <option value="delivery">Payment on Delivery</option>
                        <option value="credit30">30 Days Credit</option>
                        <option value="credit60">60 Days Credit</option>
                      </select>
                    </div>
                    {contract.paymentTerms && contract.paymentTerms !== counterOffer.paymentTerms && (
                      <p className="mt-1 text-xs text-purple-600 flex items-center">
                        <FaExchangeAlt className="mr-1" />
                        Original: {contract.paymentTerms}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="negotiateRemarks" className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation for Counter Offer <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows="3"
                    value={counterOffer.remarks}
                    onChange={handleInputChange}
                    placeholder="Please explain your counter offer and why you're proposing these changes..."
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  ></textarea>
                  <p className="mt-1 text-xs text-gray-500">
                    Providing a clear explanation helps the buyer understand your proposed changes.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h3>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    <li>The buyer will be notified of your counter offer.</li>
                    <li>They can accept, reject, or propose another counter offer.</li>
                    <li>You'll be notified when they respond to your counter offer.</li>
                    <li>The contract will remain in "negotiation" status until both parties agree or one party rejects.</li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}`)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !counterOffer.remarks.trim()}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ContractRespondPage; 