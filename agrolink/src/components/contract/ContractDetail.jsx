import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchContractRequests, 
  cancelContractRequest,
  addContractRequest 
} from '../../reducer/Slice/contractRequestsSlice';
import { 
  FaHandshake, FaCalendarAlt, FaMoneyBillWave, FaTractor, FaFileContract, 
  FaCheck, FaTimes, FaClock, FaUser, FaMapMarkerAlt, FaSeedling, FaLeaf, 
  FaClipboardList, FaDownload, FaPrint, FaExclamationTriangle, FaHistory, FaArrowRight,
  FaUserTie
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { api } from '../../services/api';

const ContractDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contractRequests, loading, error } = useSelector(state => state.contractRequests);
  const { user } = useSelector(state => state.auth);
  const [contract, setContract] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Determine if current user is farmer or buyer
  const isFarmer = contract ? (contract.farmer._id === user._id || contract.farmer === user._id) : false;
  const userRole = isFarmer ? 'farmer' : 'buyer';
  const otherRole = isFarmer ? 'buyer' : 'farmer';

  // Return personalized text based on user role
  const personalizedText = {
    roleLabel: isFarmer ? 'Farmer (You)' : 'Buyer (You)',
    otherPartyLabel: isFarmer ? 'Buyer' : 'Farmer',
    yourTermsTitle: isFarmer ? "Your Original Terms" : "Your Proposed Terms",
    otherTermsTitle: isFarmer ? "Buyer's Proposed Terms" : "Farmer's Original Terms",
    declineButtonText: isFarmer ? "Decline Request" : "Cancel Request",
    negotiateButtonText: isFarmer ? "Negotiate with Buyer" : "Negotiate with Farmer",
    cancelConfirmText: isFarmer ? "Are you sure you want to decline this contract request?" : "Are you sure you want to cancel this contract request?"
  };

  // Custom function to determine if there's a difference between farmer and buyer terms
  const getTermDifference = (farmerValue, buyerValue) => {
    if (farmerValue === undefined || buyerValue === undefined) return null;
    
    // Convert to numbers if possible for accurate comparison
    const numFarmer = !isNaN(parseFloat(farmerValue)) ? parseFloat(farmerValue) : farmerValue;
    const numBuyer = !isNaN(parseFloat(buyerValue)) ? parseFloat(buyerValue) : buyerValue;
    
    if (numFarmer === numBuyer) return null;
    
    // For numeric values, calculate the difference
    if (typeof numFarmer === 'number' && typeof numBuyer === 'number') {
      const diff = numBuyer - numFarmer;
      const percentDiff = (diff / numFarmer) * 100;
      
      return {
        type: diff > 0 ? 'increase' : 'decrease',
        diff: Math.abs(diff),
        percent: Math.abs(percentDiff).toFixed(1)
      };
    }
    
    // For non-numeric values, just return that they're different
    return { type: 'different' };
  };

  // Fetch a single contract by ID if not found in Redux store
  const fetchContractById = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching contract with ID:", id);
      
      // First attempt: try /contracts/:id endpoint
      try {
        const response = await api.get(`/contracts/${id}`);
        console.log("API response for /contracts/:id:", response);
        
        if (response.data && response.data.contract) {
          console.log("Setting contract from response.data.contract");
          setContract(response.data.contract);
          return;
        } else if (response.data && response.data.success) {
          console.log("Setting contract from response.data");
          setContract(response.data);
          return;
        }
      } catch (firstError) {
        console.warn("First contract fetch attempt failed:", firstError.message);
      }
      
      // Second attempt: try /contracts/:id/details endpoint
      try {
        console.log("Trying alternate endpoint /contracts/:id/details");
        const detailsResponse = await api.get(`/contracts/${id}/details`);
        console.log("API response for /contracts/:id/details:", detailsResponse);
        
        if (detailsResponse.data && detailsResponse.data.contract) {
          console.log("Setting contract from detailsResponse.data.contract");
          setContract(detailsResponse.data.contract);
          return;
        } else if (detailsResponse.data) {
          console.log("Setting contract from detailsResponse.data");
          setContract(detailsResponse.data);
          return;
        }
      } catch (secondError) {
        console.warn("Second contract fetch attempt failed:", secondError.message);
      }
      
      // Third attempt: try adding contract to redux manually by dispatching addContractRequest
      try {
        console.log("Attempting to fetch from server directly and add to Redux");
        const manualResponse = await api.get(`/contracts/${id}`);
        if (manualResponse.data) {
          const contractData = manualResponse.data.contract || manualResponse.data;
          console.log("Dispatching addContractRequest with data", contractData);
          // Use the imported action creator
          dispatch(addContractRequest(contractData));
          setContract(contractData);
          return;
        }
      } catch (thirdError) {
        console.error("All contract fetch attempts failed");
        toast.error(`Error fetching contract: ${thirdError.message}`);
      }
      
    } catch (error) {
      console.error("API error:", error);
      toast.error(`Error fetching contract: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [id, dispatch]);

  // First attempt - check if contract is in Redux store
  useEffect(() => {
    if (id) {
      // If contracts are already in the Redux store
      if (contractRequests.length > 0) {
        console.log("Searching for contract in Redux store with ID:", id);
        const foundContract = contractRequests.find(c => c._id === id);
        if (foundContract) {
          console.log("Contract found in Redux store:", foundContract);
          setContract(foundContract);
        } else {
          console.log("Contract not found in Redux store, fetching directly...");
          fetchContractById();
        }
      } else {
        // No contracts in Redux store, fetch all contracts first
        if (!loading && !error) {
          console.log("No contracts in Redux store, dispatching fetchContractRequests");
          dispatch(fetchContractRequests());
        }
      }
    } else {
      console.error("Contract ID is missing");
    }
  }, [id, dispatch, contractRequests.length, loading, error, fetchContractById]);

  // Second attempt - when contracts are loaded from API
  useEffect(() => {
    if (contractRequests.length > 0 && id && !contract) {
      console.log("Contracts now loaded in Redux, searching again for ID:", id);
      const foundContract = contractRequests.find(c => c._id === id);
      if (foundContract) {
        console.log("Contract found after redux update:", foundContract);
        setContract(foundContract);
      } else {
        console.log("Contract still not found in Redux, fetching directly...");
        fetchContractById();
      }
    }
  }, [contractRequests, id, contract, fetchContractById]);

  // Fetch crop details when contract is loaded
  useEffect(() => {
    const fetchCropDetails = async () => {
      if (contract && contract.crop && contract.crop._id) {
        try {
          setIsLoading(true);
          console.log("Fetching crop details for ID:", contract.crop._id);
          const response = await api.get(`/products/product/${contract.crop._id}`);
          
          if (response.data && response.data.product) {
            console.log("Got crop details:", response.data.product);
            setCropDetails(response.data.product);
          } else if (response.data) {
            console.log("Got crop details from response data:", response.data);
            setCropDetails(response.data);
          }
        } catch (error) {
          console.error("Error fetching crop details:", error);
          toast.error(`Failed to load crop details: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCropDetails();
  }, [contract]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800" role="status">
            <FaCheck className="mr-1" aria-hidden="true" /> Approved
          </span>
        );
      case 'rejected':
      case 'declined':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800" role="status">
            <FaTimes className="mr-1" aria-hidden="true" /> Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800" role="status">
            <FaClock className="mr-1" aria-hidden="true" /> Pending
          </span>
        );
      case 'requested':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800" role="status">
            <FaClock className="mr-1" aria-hidden="true" /> Awaiting Approval
          </span>
        );
      case 'negotiating':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800" role="status">
            <FaHandshake className="mr-1" aria-hidden="true" /> Under Negotiation
          </span>
        );
      case 'completed':
      case 'fulfilled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800" role="status">
            <FaCheck className="mr-1" aria-hidden="true" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800" role="status">
            <FaTimes className="mr-1" aria-hidden="true" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800" role="status">
            {status}
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await api.download(`/contracts/${id}/pdf`, `contract-${id}.pdf`);
      toast.success('Contract PDF downloaded successfully');
    } catch (error) {
      toast.error(`Failed to download PDF: ${error.message}`);
    }
  };

  const handleCancelContract = async () => {
    if (window.confirm(personalizedText.cancelConfirmText)) {
      try {
        setCancelLoading(true);
        console.log("Initiating contract cancellation for ID:", id);
        
        // Try to cancel using the Redux action
        const result = await dispatch(cancelContractRequest(id)).unwrap();
        console.log("Cancel contract result:", result);
        
        toast.success('Contract request cancelled successfully');
        
        // First update the local contract state to reflect cancellation
        if (contract) {
          setContract({
            ...contract,
            status: 'cancelled'
          });
        }
        
        // Navigate after a short delay to ensure toast is visible
        setTimeout(() => {
          navigate('/contracts');
        }, 1500);
      } catch (error) {
        console.error("Cancel contract error:", error);
        toast.error(`Failed to cancel contract: ${error.message || 'Unknown error'}`);
        
        // Alternative manual approach if Redux action fails
        try {
          console.log("Trying manual approach to cancel contract");
          const manualResponse = await api.put(`/contracts/${id}/status`, { 
            status: 'cancelled',
            notes: 'Cancelled by user'
          });
          
          if (manualResponse.data && manualResponse.data.success) {
            toast.success('Contract cancelled using alternative method');
            
            // Update local contract state
            if (contract) {
              setContract({
                ...contract,
                status: 'cancelled'
              });
            }
            
            // Navigate after a delay
            setTimeout(() => {
              navigate('/contracts');
            }, 1500);
          } else {
            setCancelLoading(false);
          }
        } catch (manualError) {
          console.error("Manual cancel also failed:", manualError);
          setCancelLoading(false);
        }
      }
    }
  };

  // Add this function to help recover from errors
  const handleRetryAll = () => {
    // Clear error state
    dispatch({ type: 'contractRequests/clearError' });
    
    // Reset local state
    setContract(null);
    setIsLoading(true);
    
    // Fetch contracts again
    dispatch(fetchContractRequests())
      .unwrap()
      .then(() => {
        console.log("Successfully refreshed contracts");
        // Now try to fetch this specific contract
        fetchContractById();
      })
      .catch(err => {
        console.error("Failed to refresh contracts:", err);
        // Try direct fetch as fallback
        fetchContractById();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (loading || isLoading) {
    return <LoadingSpinner message="Loading contract details..." />;
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md" role="alert">
        <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Contract</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={handleRetryAll}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry Loading
          </button>
          <button
            onClick={fetchContractById}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Direct Fetch
          </button>
          <Link 
            to="/contracts" 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Contract Requests
          </Link>
        </div>
      </div>
    );
  }
  
  // console.log("Final contract state:", contract);
  
  if (!contract) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md" role="alert">
        <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Contract Not Found</h2>
        <p className="text-gray-600 mb-4">The contract you're looking for doesn't exist or you don't have permission to view it.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={handleRetryAll}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry All
          </button>
          <button 
            onClick={fetchContractById}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
          <Link 
            to="/contracts" 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Contract Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto" role="main" aria-labelledby="contract-title">
      <div className="flex justify-between items-start mb-6 print:mb-8">
        <h1 id="contract-title" className="text-2xl font-bold text-gray-800 flex items-center">
          <FaHandshake className="mr-2 text-green-600" aria-hidden="true" /> Contract Request Details
        </h1>
        <div className="flex space-x-2 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            aria-label="Print contract"
          >
            <FaPrint className="mr-1" aria-hidden="true" /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            aria-label="Download contract as PDF"
          >
            <FaDownload className="mr-1" aria-hidden="true" /> Download PDF
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-4 mb-6 print:border-b-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-xl mb-1">{cropDetails?.name || contract.product?.name || contract.crop?.name || 'Crop Contract'}</h2>
            <p className="text-gray-600">Contract ID: {contract._id}</p>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge(contract.status)}
            <p className="text-sm text-gray-500 mt-1">
              Requested on {contract.createdAt 
                ? (() => {
                    try {
                      return new Date(contract.createdAt).toLocaleDateString();
                    } catch (e) {
                      return contract.createdAt || 'unknown date';
                    }
                  })()
                : 'unknown date'}
            </p>
          </div>
        </div>
      </div>

      {/* Proposal Comparison Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Farmer's Terms */}
        <div className="border rounded-lg overflow-hidden shadow-sm relative">
          <div className={`${isFarmer ? 'bg-green-100' : 'bg-green-50'} p-4 border-b border-green-100`}>
            <h3 className="font-semibold text-lg flex items-center">
              <FaTractor className="mr-2 text-green-600" /> 
              {isFarmer ? "Your Terms (Farmer)" : "Farmer's Terms"}
            </h3>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {isFarmer ? "You" : "Original"}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start">
              <FaMoneyBillWave className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Price Per Unit</p>
                {isLoading && !cropDetails ? (
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-bold text-green-600">
                      ₹{cropDetails?.price || contract.crop?.price || 'N/A'}
                    </p>
                    {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.type === 'decrease' && (
                      <p className="text-xs mt-1 text-red-500 font-medium">
                        {isFarmer ? "Buyer proposed" : "You proposed"} {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit).percent}% lower price
                      </p>
                    )}
                    {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.type === 'increase' && (
                      <p className="text-xs mt-1 text-green-500 font-medium">
                        {isFarmer ? "Buyer proposed" : "You proposed"} {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit).percent}% higher price
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <FaCalendarAlt className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Expected Harvest Date</p>
                {isLoading && !cropDetails ? (
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p>{cropDetails?.estimatedHarvestDate || contract.expectedHarvestDate 
                    ? (() => {
                        try {
                          return new Date(cropDetails?.estimatedHarvestDate || contract.expectedHarvestDate).toLocaleDateString();
                        } catch (e) {
                          return cropDetails?.estimatedHarvestDate || contract.expectedHarvestDate || 'Not specified';
                        }
                      })()
                    : 'Not specified'}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <FaClipboardList className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Available Quantity</p>
                {isLoading && !cropDetails ? (
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p>{cropDetails?.availableQuantity || contract.crop?.availableQuantity || 'N/A'} {cropDetails?.unit || contract.unit || contract.crop?.unit || 'units'}</p>
                )}
                {(cropDetails?.availableQuantity || contract.crop?.availableQuantity) && contract.quantity && contract.quantity > (cropDetails?.availableQuantity || contract.crop?.availableQuantity) && (
                  <p className="text-xs mt-1 text-amber-600 font-medium">
                    {isFarmer ? "Buyer" : "You"} requested more than available
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <FaLeaf className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Quality</p>
                {isLoading && !cropDetails ? (
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p>{cropDetails?.quality || contract.crop?.quality || 'Standard quality'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Buyer's Terms */}
        <div className="border rounded-lg overflow-hidden shadow-sm border-blue-100 relative">
          <div className={`${!isFarmer ? 'bg-blue-100' : 'bg-blue-50'} p-4 border-b border-blue-100`}>
            <h3 className="font-semibold text-lg flex items-center">
              <FaUser className="mr-2 text-blue-600" /> 
              {isFarmer ? "Buyer's Terms" : "Your Terms (Buyer)"}
            </h3>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {isFarmer ? "Proposal" : "You"}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start">
              <FaMoneyBillWave className="text-blue-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Price Per Unit</p>
                <div className={`text-xl font-bold ${getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.type === 'decrease' ? 'text-red-600' : 'text-blue-600'}`}>
                  ₹{contract.pricePerUnit || 'N/A'}
                </div>
                {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit) && (
                  <div className="flex items-center mt-1">
                    <div className={`h-0.5 w-5 ${getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.type === 'decrease' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className={`text-xs ml-1 ${getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.type === 'decrease' ? 'text-red-500' : 'text-green-500'}`}>
                      {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.type === 'decrease' ? '↓' : '↑'} 
                      ₹{getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.diff.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <FaCalendarAlt className="text-blue-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Requested Delivery Date</p>
                <p>{contract.deliveryDate 
                  ? (() => {
                      try {
                        return new Date(contract.deliveryDate).toLocaleDateString();
                      } catch (e) {
                        return contract.deliveryDate || 'Not specified';
                      }
                    })()
                  : 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaClipboardList className="text-blue-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Requested Quantity</p>
                <p className={cropDetails?.availableQuantity && contract.quantity > cropDetails.availableQuantity ? 'text-amber-600 font-semibold' : ''}>
                  {contract.quantity || 'N/A'} {contract.unit || 'units'}
                </p>
                {cropDetails?.availableQuantity && contract.quantity && (
                  <div className="flex items-center mt-1">
                    <div className={`h-0.5 w-5 ${contract.quantity <= cropDetails.availableQuantity ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span className={`text-xs ml-1 ${contract.quantity <= cropDetails.availableQuantity ? 'text-green-500' : 'text-amber-500'}`}>
                      {cropDetails.availableQuantity > 0 ? 
                        Math.round((contract.quantity / cropDetails.availableQuantity) * 100) : 0}% of available
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-start">
              <FaLeaf className="text-blue-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Quality Requirements</p>
                <p>{contract.qualityRequirements || 'Standard quality'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Total Value and Summary */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Contract Value</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{contract.totalAmount?.toLocaleString() || (contract.quantity * contract.pricePerUnit).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {contract.quantity} {contract.unit || 'units'} × ₹{contract.pricePerUnit}/unit
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 text-sm">Contract Timeline</p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500">Created</span>
                <span className="text-sm font-medium">
                  {contract.createdAt 
                    ? (() => {
                        try {
                          return new Date(contract.createdAt).toLocaleDateString();
                        } catch (e) {
                          return 'N/A';
                        }
                      })()
                    : 'N/A'}
                </span>
              </div>
              <div className="h-0.5 w-5 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500">Delivery</span>
                <span className="text-sm font-medium">
                  {contract.deliveryDate 
                    ? (() => {
                        try {
                          return new Date(contract.deliveryDate).toLocaleDateString();
                        } catch (e) {
                          return 'N/A';
                        }
                      })()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Contract Status</p>
            <div className="flex flex-col items-center">
              {getStatusBadge(contract.status)}
              <div className="mt-2">
                {contract.status === 'requested' && !getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit) && (
                  <span className="text-xs text-gray-600">Awaiting farmer's approval without changes</span>
                )}
                {contract.status === 'requested' && getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit) && (
                  <span className="text-xs text-gray-600">Awaiting farmer's approval with price changes</span>
                )}
                {contract.status === 'negotiating' && (
                  <span className="text-xs text-gray-600">
                    Parties still negotiating contract terms
                    {contract.negotiationHistory?.length > 0 && (
                      <> ({contract.negotiationHistory.length} {contract.negotiationHistory.length === 1 ? 'round' : 'rounds'} so far)</>
                    )}
                  </span>
                )}
                {contract.status === 'accepted' && (
                  <span className="text-xs text-gray-600">
                    Contract terms accepted
                    {contract.negotiationHistory?.length > 0 && (
                      <> after {contract.negotiationHistory.length} {contract.negotiationHistory.length === 1 ? 'round' : 'rounds'} of negotiation</>
                    )}
                  </span>
                )}
                {contract.status === 'cancelled' && (
                  <span className="text-xs text-gray-600">
                    Contract has been cancelled
                    {contract.cancelNotes && <> ({contract.cancelNotes})</>}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Details Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Payment & Delivery Details */}
        <section aria-labelledby="payment-details-heading">
          <h3 id="payment-details-heading" className="text-lg font-semibold mb-4 flex items-center">
            <FaMoneyBillWave className="mr-2 text-green-600" aria-hidden="true" /> Payment & Delivery
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <FaMoneyBillWave className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Payment Terms</p>
                {typeof contract.paymentTerms === 'string' ? (
                  <p>{contract.paymentTerms}</p>
                ) : (
                  <div className="text-sm space-y-1">
                    {contract.paymentTerms?.advancePercentage > 0 && (
                      <p>Advance: {contract.paymentTerms.advancePercentage}%</p>
                    )}
                    {contract.paymentTerms?.midtermPercentage > 0 && (
                      <p>Midterm: {contract.paymentTerms.midtermPercentage}%</p>
                    )}
                    {contract.paymentTerms?.finalPercentage > 0 && (
                      <p>Final: {contract.paymentTerms.finalPercentage}%</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FaCalendarAlt className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Delivery Date</p>
                <p>
                  {contract.deliveryDate 
                    ? (() => {
                        try {
                          return new Date(contract.deliveryDate).toLocaleDateString();
                        } catch (e) {
                          return contract.deliveryDate || 'Not specified';
                        }
                      })()
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Parties Information */}
        <section aria-labelledby="parties-heading">
          <h3 id="parties-heading" className="text-lg font-semibold mb-4 flex items-center">
            <FaUser className="mr-2 text-green-600" aria-hidden="true" /> Contract Parties
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <FaUser className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Farmer</p>
                <p>{contract.farmer?.name || contract.farmer?.email || 'Local Farmer'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <FaUser className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Buyer</p>
                <p>{contract.buyer?.name || contract.buyer?.email || 'Anonymous Buyer'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <FaSeedling className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Crop</p>
                {isLoading && !cropDetails ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-20 w-20 bg-gray-200 rounded"></div>
                    <span className="text-xs text-gray-400">Loading crop details...</span>
                  </div>
                ) : (
                  <>
                    <p>{cropDetails?.name || contract.crop?.name || 'Agricultural product'}</p>
                    {cropDetails?.images && cropDetails.images.length > 0 && (
                      <img 
                        src={cropDetails.images[0].url || cropDetails.images[0]} 
                        alt={cropDetails.name || 'Crop'} 
                        className="mt-2 w-20 h-20 object-cover rounded-md border border-gray-200"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Special Requirements */}
      {contract.specialRequirements && (
        <section aria-labelledby="requirements-heading" className="mb-8">
          <h3 id="requirements-heading" className="text-lg font-semibold mb-2">Special Requirements</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-line">{contract.specialRequirements}</p>
          </div>
        </section>
      )}

      {/* Contract Timeline */}
      <section aria-labelledby="timeline-heading" className="mb-8">
        <h3 id="timeline-heading" className="text-lg font-semibold mb-4">Contract Timeline</h3>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true"></div>
          
          <div className="relative pl-12 pb-8">
            <div className="absolute left-0 rounded-full bg-green-500 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
              <FaHandshake />
            </div>
            <div>
              <p className="font-medium">Contract Requested</p>
              <p className="text-sm text-gray-600">
                {contract.requestDate || contract.createdAt 
                  ? (() => {
                      try {
                        return new Date(contract.requestDate || contract.createdAt).toLocaleString();
                      } catch (e) {
                        return (contract.requestDate || contract.createdAt) || 'Date not available';
                      }
                    })()
                  : 'Date not available'}
              </p>
              {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit) && (
                <p className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded inline-block">
                  <span className="font-medium">With initial {isFarmer ? "buyer" : "your"} proposal:</span> Price changed from 
                  <span className="font-medium"> ₹{cropDetails?.price || contract.crop?.price}</span> to 
                  <span className="font-medium"> ₹{contract.pricePerUnit}</span>
                  {contract.quantity && cropDetails?.availableQuantity && contract.quantity !== cropDetails.availableQuantity && (
                    <>, Quantity requested: <span className="font-medium">{contract.quantity}</span> of <span className="font-medium">{cropDetails.availableQuantity}</span> available</>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Negotiation history timeline item */}
          {contract.negotiationHistory && contract.negotiationHistory.length > 0 && (
            <div className="relative pl-12 pb-8">
              <div className="absolute left-0 rounded-full bg-blue-500 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                <FaHistory />
              </div>
              <div>
                <p className="font-medium">Negotiation Process</p>
                <p className="text-sm text-gray-600">
                  {contract.negotiationHistory.length} {contract.negotiationHistory.length === 1 ? 'round' : 'rounds'} of negotiation
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Last updated: {(() => {
                    const lastNegotiation = contract.negotiationHistory[contract.negotiationHistory.length - 1];
                    if (lastNegotiation && lastNegotiation.proposedAt) {
                      try {
                        return new Date(lastNegotiation.proposedAt).toLocaleString();
                      } catch (e) {
                        return 'Date not available';
                      }
                    }
                    return 'Date not available';
                  })()}
                </p>

                {/* Show who made the last proposal */}
                {(() => {
                  const lastNegotiation = contract.negotiationHistory[contract.negotiationHistory.length - 1];
                  if (lastNegotiation) {
                    const proposedById = typeof lastNegotiation.proposedBy === 'object' ? 
                      lastNegotiation.proposedBy?._id : lastNegotiation.proposedBy?.toString();
                    const farmerId = typeof contract.farmer === 'object' ? 
                      contract.farmer._id : contract.farmer?.toString();
                    const proposedByFarmer = proposedById === farmerId;
                    
                    return (
                      <p className="mt-1 text-xs bg-gray-50 p-2 rounded">
                        Last proposal by: <span className="font-medium">
                          {proposedByFarmer ? 
                            (isFarmer ? 'You (Farmer)' : 'Farmer') : 
                            (isFarmer ? 'Buyer' : 'You (Buyer)')}
                        </span>
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* Cancelled contract */}
          {contract.status === 'cancelled' && (
            <div className="relative pl-12 pb-8">
              <div className="absolute left-0 rounded-full bg-gray-500 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                <FaTimes />
              </div>
              <div>
                <p className="font-medium">Contract Cancelled</p>
                <p className="text-sm text-gray-600">
                  {contract.cancelDate || contract.updatedAt
                    ? (() => {
                        try {
                          return new Date(contract.cancelDate || contract.updatedAt).toLocaleString();
                        } catch (e) {
                          return 'Date not available';
                        }
                      })()
                    : 'Date not available'}
                </p>
                {contract.cancelNotes && (
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    Note: {contract.cancelNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Under negotiation */}
          {(contract.status === 'negotiating') && (
            <div className="relative pl-12 pb-8">
              <div className="absolute left-0 rounded-full bg-yellow-500 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                <FaHandshake />
              </div>
              <div>
                <p className="font-medium">Currently Under Negotiation</p>
                
                {(() => {
                  // Determine who made the last proposal to show who we're awaiting response from
                  if (contract.negotiationHistory && contract.negotiationHistory.length > 0) {
                    const lastEntry = contract.negotiationHistory[contract.negotiationHistory.length - 1];
                    const proposedById = typeof lastEntry.proposedBy === 'object' ? 
                      lastEntry.proposedBy?._id : lastEntry.proposedBy?.toString();
                    const farmerId = typeof contract.farmer === 'object' ? 
                      contract.farmer._id : contract.farmer?.toString();
                    const lastProposalByFarmer = proposedById === farmerId;
                    
                    // If farmer made last proposal, we're waiting for buyer response (and vice versa)
                    const waitingForFarmerResponse = !lastProposalByFarmer;
                    
                    return (
                      <p className="text-sm text-gray-600">
                        Awaiting response from {waitingForFarmerResponse ? 
                          (isFarmer ? 'you (Farmer)' : 'Farmer') : 
                          (isFarmer ? 'Buyer' : 'you (Buyer)')}
                      </p>
                    );
                  }
                  return (
                    <p className="text-sm text-gray-600">
                      Awaiting response from {isFarmer ? 'you (Farmer)' : 'Farmer'}
                    </p>
                  );
                })()}
                
                <button
                  onClick={() => navigate(`/chat/${contract._id}`)}
                  className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <FaHandshake className="mr-1" /> {personalizedText.negotiateButtonText}
                </button>
              </div>
            </div>
          )}

          {/* Contract approved/rejected */}
          {contract.status !== 'pending' && contract.status !== 'requested' && contract.status !== 'cancelled' && contract.status !== 'negotiating' && (
            <div className="relative pl-12 pb-8">
              <div className="absolute left-0 rounded-full bg-blue-500 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                {contract.status === 'approved' || contract.status === 'accepted' ? <FaCheck /> : <FaTimes />}
              </div>
              <div>
                <p className="font-medium">
                  {contract.status === 'approved' || contract.status === 'accepted' ? 'Contract Approved' : 'Contract Rejected'}
                </p>
                <p className="text-sm text-gray-600">
                  {contract.statusUpdateDate || contract.updatedAt
                    ? (() => {
                        try {
                          return new Date(contract.statusUpdateDate || contract.updatedAt).toLocaleString();
                        } catch (e) {
                          return 'Date not available';
                        }
                      })()
                    : 'Date not available'}
                </p>
                <p className="mt-1 text-xs text-green-600 bg-green-50 p-2 rounded">
                  <span className="font-medium">Final terms:</span> Price: ₹{contract.pricePerUnit}, 
                  Quantity: {contract.quantity} {contract.unit || 'units'}, 
                  Delivery: {(() => {
                    try {
                      return new Date(contract.deliveryDate).toLocaleDateString();
                    } catch (e) {
                      return 'Not specified';
                    }
                  })()}
                </p>
                {contract.farmerNotes && (
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    Farmer's note: {contract.farmerNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contract completed */}
          {(contract.status === 'completed' || contract.status === 'fulfilled') && (
            <div className="relative pl-12">
              <div className="absolute left-0 rounded-full bg-green-600 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                <FaCheck />
              </div>
              <div>
                <p className="font-medium">Contract Completed</p>
                <p className="text-sm text-gray-600">
                  {contract.completionDate 
                    ? (() => {
                        try {
                          return new Date(contract.completionDate).toLocaleString();
                        } catch (e) {
                          return 'Date not available';
                        }
                      })()
                    : 'Date not available'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Negotiation History */}
      {contract.negotiationHistory && contract.negotiationHistory.length > 0 && (
        <section aria-labelledby="negotiation-heading" className="rounded-lg bg-white p-6 shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 id="negotiation-heading" className="text-xl font-semibold">Negotiation History</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FaHistory className="text-blue-500" />
              <span>{contract.negotiationHistory.length} {contract.negotiationHistory.length === 1 ? 'round' : 'rounds'} of negotiation</span>
            </div>
          </div>
          
          <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <span className="font-medium block text-sm text-blue-700">Total Rounds</span>
                <span className="text-lg font-bold">{contract.negotiationHistory.length}</span>
              </div>
              
              <div className="text-center">
                <span className="font-medium block text-sm text-green-700">Farmer Proposals</span>
                <span className="text-lg font-bold">{
                  contract.negotiationHistory.filter(entry => {
                    const proposedById = typeof entry.proposedBy === 'object' ? 
                      entry.proposedBy?._id : entry.proposedBy?.toString();
                    const farmerId = typeof contract.farmer === 'object' ? 
                      contract.farmer._id : contract.farmer?.toString();
                    return proposedById === farmerId;
                  }).length
                }</span>
              </div>
              
              <div className="text-center">
                <span className="font-medium block text-sm text-orange-700">Buyer Proposals</span>
                <span className="text-lg font-bold">{
                  contract.negotiationHistory.filter(entry => {
                    const proposedById = typeof entry.proposedBy === 'object' ? 
                      entry.proposedBy?._id : entry.proposedBy?.toString();
                    const farmerId = typeof contract.farmer === 'object' ? 
                      contract.farmer._id : contract.farmer?.toString();
                    return proposedById !== farmerId;
                  }).length
                }</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {contract.negotiationHistory.map((entry, index) => {
              // Determine if farmer or buyer
              const proposedById = typeof entry.proposedBy === 'object' ? 
                entry.proposedBy?._id : entry.proposedBy?.toString();
              const farmerId = typeof contract.farmer === 'object' ? 
                contract.farmer._id : contract.farmer?.toString();
              const proposedByFarmer = proposedById === farmerId;
              
              // Determine if current user
              const isCurrentUser = proposedById === user?._id?.toString();
              
              // Get name and image
              const proposerName = proposedByFarmer 
                ? (typeof contract.farmer === 'object' ? contract.farmer.Name : 'Farmer')
                : (typeof contract.buyer === 'object' ? contract.buyer.Name : 'Buyer');
              
              const proposerImage = proposedByFarmer
                ? (typeof contract.farmer === 'object' ? contract.farmer.photo : '')
                : (typeof contract.buyer === 'object' ? contract.buyer.photo : '');
              
              // Get formatted date
              const formattedDate = (() => {
                try {
                  if (!entry.proposedAt) return 'Unknown date';
                  return new Date(entry.proposedAt).toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                } catch (e) {
                  return 'Invalid date';
                }
              })();
              
              // Calculate changes from previous entry
              const getPreviousValues = () => {
                if (index === 0) {
                  // First negotiation - compare with original contract
                  return {
                    pricePerUnit: contract.originalTerms?.pricePerUnit || cropDetails?.price,
                    quantity: contract.originalTerms?.quantity || cropDetails?.availableQuantity,
                    deliveryDate: contract.originalTerms?.deliveryDate || contract.requestedDeliveryDate
                  };
                } else {
                  // Compare with previous negotiation
                  const prevEntry = contract.negotiationHistory[index - 1];
                  return {
                    pricePerUnit: prevEntry.proposedChanges?.pricePerUnit,
                    quantity: prevEntry.proposedChanges?.quantity,
                    deliveryDate: prevEntry.proposedChanges?.deliveryDate
                  };
                }
              };
              
              const previousValues = getPreviousValues();
              const changes = [];
              
              if (previousValues.pricePerUnit !== entry.proposedChanges.pricePerUnit) {
                changes.push({
                  label: 'Price',
                  from: `₹${previousValues.pricePerUnit || 'N/A'}`,
                  to: `₹${entry.proposedChanges.pricePerUnit}`
                });
              }
              
              if (previousValues.quantity !== entry.proposedChanges.quantity) {
                changes.push({
                  label: 'Quantity',
                  from: `${previousValues.quantity || 'N/A'} ${contract.unit || 'units'}`,
                  to: `${entry.proposedChanges.quantity} ${contract.unit || 'units'}`
                });
              }
              
              if (previousValues.deliveryDate !== entry.proposedChanges.deliveryDate) {
                changes.push({
                  label: 'Delivery Date',
                  from: previousValues.deliveryDate ? new Date(previousValues.deliveryDate).toLocaleDateString() : 'N/A',
                  to: new Date(entry.proposedChanges.deliveryDate).toLocaleDateString()
                });
              }
              
              // Set colors based on proposer
              const bgColor = proposedByFarmer 
                ? (isCurrentUser ? 'bg-green-50 border-green-300' : 'bg-green-50 border-green-200')
                : (isCurrentUser ? 'bg-blue-50 border-blue-300' : 'bg-blue-50 border-blue-200');
              
              const headerBgColor = proposedByFarmer
                ? (isCurrentUser ? 'bg-green-100' : 'bg-green-100')
                : (isCurrentUser ? 'bg-blue-100' : 'bg-blue-100');
              
              return (
                <div key={index} className={`border rounded-lg ${bgColor} overflow-hidden`}>
                  <div className={`px-4 py-3 ${headerBgColor} flex justify-between items-center`}>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {proposerImage ? (
                          <img src={proposerImage} alt={proposerName} className="w-full h-full object-cover" />
                        ) : (
                          proposedByFarmer ? <FaLeaf className="text-green-600" /> : <FaUserTie className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {isCurrentUser 
                            ? `You (${proposedByFarmer ? 'Farmer' : 'Buyer'})` 
                            : `${proposerName} (${proposedByFarmer ? 'Farmer' : 'Buyer'})`}
                        </span>
                        <span className="text-xs text-gray-500 block">Round {index + 1}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{formattedDate}</div>
                  </div>
                  
                  <div className="p-4">
                    {entry.message && (
                      <div className="mb-3 text-gray-700">
                        <p>"{entry.message}"</p>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                      <div className="bg-white rounded border border-gray-200 p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Proposed Terms</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price Per Unit:</span>
                            <span className="font-medium">₹{entry.proposedChanges.pricePerUnit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{entry.proposedChanges.quantity} {contract.unit || 'units'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Date:</span>
                            <span className="font-medium">
                              {entry.proposedChanges.deliveryDate 
                                ? new Date(entry.proposedChanges.deliveryDate).toLocaleDateString() 
                                : 'Not specified'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Value:</span>
                            <span className="font-medium">
                              ₹{entry.proposedChanges.pricePerUnit * entry.proposedChanges.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {changes.length > 0 && (
                        <div className="bg-white rounded border border-gray-200 p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Changes Made</h4>
                          <div className="space-y-3 text-sm">
                            {changes.map((change, i) => (
                              <div key={i} className="flex items-center">
                                <span className="text-gray-600 w-1/3">{change.label}:</span>
                                <div className="flex items-center">
                                  <span className="line-through text-red-500">{change.from}</span>
                                  <FaArrowRight className="mx-2 text-gray-400" />
                                  <span className="text-green-600 font-medium">{change.to}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {entry.proposedChanges.specialRequirements && (
                      <div className="mt-3 bg-white rounded border border-gray-200 p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Special Requirements</h4>
                        <p className="text-sm text-gray-700">{entry.proposedChanges.specialRequirements}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Contract Stats/Summary Section - New */}
      <section aria-labelledby="contract-summary" className="mb-8">
        <h3 id="contract-summary" className="text-xl font-semibold mb-4 flex items-center">
          <FaClipboardList className="mr-2 text-green-600" aria-hidden="true" /> Contract Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Negotiation Stats */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <FaHistory className="mr-1.5 text-blue-500" /> Negotiation Stats
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Rounds:</span>
                <span className="font-medium">{contract.negotiationHistory?.length || 0}</span>
              </div>
              
              {/* Count farmer proposals - handle both object and string IDs */}
              {(() => {
                const farmerProposals = contract.negotiationHistory?.filter(entry => {
                  const proposedById = typeof entry.proposedBy === 'object' ? 
                    entry.proposedBy?._id : entry.proposedBy?.toString();
                  const farmerId = typeof contract.farmer === 'object' ? 
                    contract.farmer._id : contract.farmer?.toString();
                  return proposedById === farmerId;
                }).length || 0;
                
                return (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Farmer Proposals:</span>
                    <span className="font-medium text-green-600">
                      {farmerProposals}
                    </span>
                  </div>
                );
              })()}
              
              {/* Count buyer proposals - handle both object and string IDs */}
              {(() => {
                const buyerProposals = contract.negotiationHistory?.filter(entry => {
                  const proposedById = typeof entry.proposedBy === 'object' ? 
                    entry.proposedBy?._id : entry.proposedBy?.toString();
                  const farmerId = typeof contract.farmer === 'object' ? 
                    contract.farmer._id : contract.farmer?.toString();
                  return proposedById !== farmerId;
                }).length || 0;
                
                return (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyer Proposals:</span>
                    <span className="font-medium text-blue-600">
                      {buyerProposals}
                    </span>
                  </div>
                );
              })()}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Current Status:</span>
                <span className="font-medium">{getStatusBadge(contract.status)}</span>
              </div>
            </div>
          </div>
          
          {/* Current Terms */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <FaFileContract className="mr-1.5 text-green-500" /> Current Terms
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Price Per Unit:</span>
                <span className="font-medium">₹{contract.pricePerUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{contract.quantity} {contract.unit || 'units'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium">₹{contract.totalAmount || (contract.pricePerUnit * contract.quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Date:</span>
                <span className="font-medium">
                  {(() => {
                    try {
                      return new Date(contract.deliveryDate).toLocaleDateString();
                    } catch (e) {
                      return 'Not specified';
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
              <FaHandshake className="mr-1.5 text-blue-500" /> Quick Actions
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/chat/${contract._id}`)}
                className="w-full text-center py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded hover:from-green-600 hover:to-blue-600 transition-all flex items-center justify-center"
              >
                <FaHandshake className="mr-2" /> {personalizedText.negotiateButtonText}
              </button>
              
              {contract.status === 'negotiating' && (
                <button
                  onClick={handleCancelContract}
                  disabled={cancelLoading}
                  className="w-full text-center py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all flex items-center justify-center"
                >
                  {cancelLoading ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> {personalizedText.declineButtonText}...
                    </>
                  ) : (
                    <><FaTimes className="mr-2" /> {personalizedText.declineButtonText}</>
                  )}
                </button>
              )}
              
              <button
                onClick={handlePrint}
                className="w-full text-center py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-all flex items-center justify-center"
              >
                <FaPrint className="mr-2" /> Print Details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between items-center mt-8 print:hidden gap-4">
        <Link
          to="/contracts"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          aria-label="Go back to all contracts"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to All Contracts
        </Link>
        
        {(contract.status === 'pending' || contract.status === 'requested' || contract.status === 'negotiating') && (
          <div className="flex flex-wrap gap-3">
            <button
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center shadow-sm"
              onClick={() => navigate(`/chat/${contract._id}`)}
              aria-label="Chat or negotiate"
            >
              <FaHandshake className="mr-2" /> {personalizedText.negotiateButtonText}
            </button>
            
            <button
              className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center shadow-sm"
              onClick={handleCancelContract}
              disabled={cancelLoading || contract.status === 'cancelled'}
              aria-label="Cancel this contract request"
            >
              {cancelLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> {personalizedText.declineButtonText}...
                </>
              ) : contract.status === 'cancelled' ? (
                <>Already Cancelled</>
              ) : (
                <><FaTimes className="mr-2" /> {personalizedText.declineButtonText}</>
              )}
            </button>
          </div>
        )}
        
        {(contract.status === 'approved' || contract.status === 'accepted') && (
          <div className="flex flex-wrap gap-3">
            <button
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center shadow-sm"
              onClick={() => navigate(`/chat/${contract._id}`)}
              aria-label="Contact the farmer about this contract"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
              Contact Farmer
            </button>
            
            <button
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center shadow-sm"
              onClick={() => navigate(`/payment?contractId=${contract._id}`)}
              aria-label="Make a payment for this contract"
            >
              <FaMoneyBillWave className="mr-2" /> Make Payment
            </button>
            
            <button
              className="px-5 py-2 border border-gray-300 bg-white rounded-md hover:bg-gray-50 transition-colors flex items-center"
              onClick={handlePrint}
              aria-label="Print contract"
            >
              <FaPrint className="mr-2" /> Print Contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDetail; 