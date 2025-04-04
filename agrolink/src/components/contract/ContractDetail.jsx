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
  FaClipboardList, FaDownload, FaPrint, FaExclamationTriangle, FaHistory
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { api } from '../../services/api';

const ContractDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contractRequests, loading, error } = useSelector(state => state.contractRequests);
  const [contract, setContract] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
    if (window.confirm('Are you sure you want to cancel this contract request? This action cannot be undone.')) {
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
        {/* Farmer's Original Terms */}
        <div className="border rounded-lg overflow-hidden shadow-sm relative">
          <div className="bg-green-50 p-4 border-b border-green-100">
            <h3 className="font-semibold text-lg flex items-center">
              <FaTractor className="mr-2 text-green-600" /> Farmer's Original Terms
            </h3>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Original</span>
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
                        Buyer proposed {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit).percent}% lower price
                      </p>
                    )}
                    {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit)?.type === 'increase' && (
                      <p className="text-xs mt-1 text-green-500 font-medium">
                        Buyer proposed {getTermDifference(cropDetails?.price || contract.crop?.price, contract.pricePerUnit).percent}% higher price
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
                    Buyer requested more than available
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
        
        {/* Buyer's Proposed Terms */}
        <div className="border rounded-lg overflow-hidden shadow-sm border-blue-100 relative">
          <div className="bg-blue-50 p-4 border-b border-blue-100">
            <h3 className="font-semibold text-lg flex items-center">
              <FaUser className="mr-2 text-blue-600" /> Buyer's Proposed Terms
            </h3>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Proposal</span>
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
                  <span className="font-medium">With initial negotiation:</span> Price changed from 
                  <span className="font-medium"> ₹{cropDetails?.price || contract.crop?.price}</span> to 
                  <span className="font-medium"> ₹{contract.pricePerUnit}</span>
                  {contract.quantity && cropDetails?.availableQuantity && contract.quantity !== cropDetails.availableQuantity && (
                    <>, Quantity requested: <span className="font-medium">{contract.quantity}</span> of <span className="font-medium">{cropDetails.availableQuantity}</span> available</>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* If contract has negotiation history, show as a timeline item */}
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
              </div>
            </div>
          )}

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

          {(contract.status === 'negotiating') && (
            <div className="relative pl-12 pb-8">
              <div className="absolute left-0 rounded-full bg-yellow-500 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                <FaHandshake />
              </div>
              <div>
                <p className="font-medium">Currently Under Negotiation</p>
                <p className="text-sm text-gray-600">
                  Awaiting response from {contract.negotiationHistory && 
                    contract.negotiationHistory.length > 0 && 
                    contract.negotiationHistory[contract.negotiationHistory.length - 1]?.proposedBy?._id === contract.farmer?._id 
                    ? 'buyer' : 'farmer'}
                </p>
                <button
                  onClick={() => navigate(`/chat/${contract._id}`)}
                  className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <FaHandshake className="mr-1" /> Chat/Negotiate
                </button>
              </div>
            </div>
          )}

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

      {/* Negotiation History Section (Enhanced) */}
      {contract.negotiationHistory && contract.negotiationHistory.length > 0 && (
        <section aria-labelledby="negotiation-heading" className="mb-8">
          <h3 id="negotiation-heading" className="text-lg font-semibold mb-4 flex items-center">
            <FaHistory className="mr-2 text-green-600" aria-hidden="true" /> Negotiation History
          </h3>
          
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-4 border-b">
              <div className="grid grid-cols-12 gap-4 font-medium text-gray-700">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Proposed By</div>
                <div className="col-span-8">Changes</div>
              </div>
            </div>
            
            <div className="divide-y">
              {contract.negotiationHistory.map((entry, index) => (
                <div key={index} className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2 text-sm text-gray-600">
                      {(() => {
                        try {
                          return new Date(entry.proposedAt).toLocaleString();
                        } catch (e) {
                          return entry.proposedAt || 'Date not available';
                        }
                      })()}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        {entry.proposedBy?._id === contract.farmer?._id ? (
                          <FaTractor className="text-green-600 mr-1.5" size={14} />
                        ) : (
                          <FaUser className="text-blue-600 mr-1.5" size={14} />
                        )}
                        <span className={entry.proposedBy?._id === contract.farmer?._id ? 'text-green-700' : 'text-blue-700'}>
                          {entry.proposedBy?._id === contract.farmer?._id ? 'Farmer' : 'Buyer'}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-8">
                      <div className="space-y-2">
                        {Object.entries(entry.proposedChanges || {}).map(([key, value]) => {
                          // Format the key name for better readability
                          const formatKey = (key) => {
                            switch(key) {
                              case 'pricePerUnit': return 'Price Per Unit';
                              case 'quantity': return 'Quantity';
                              case 'deliveryDate': return 'Delivery Date';
                              case 'qualityRequirements': return 'Quality Requirements';
                              default: return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            }
                          };
                          
                          // Format value based on its type
                          const formatValue = (key, value) => {
                            if (key.toLowerCase().includes('date') && value) {
                              try {
                                return new Date(value).toLocaleDateString();
                              } catch (e) {
                                return value;
                              }
                            }
                            if (key === 'pricePerUnit') return `₹${value}`;
                            if (key === 'quantity') return `${value} ${contract.unit || 'units'}`;
                            return value.toString();
                          };
                          
                          return (
                            <div key={key} className="flex items-center p-1.5 bg-gray-100 rounded">
                              <span className="font-medium text-sm min-w-[120px]">{formatKey(key)}:</span> 
                              <span className="text-sm">{formatValue(key, value)}</span>
                            </div>
                          );
                        })}
                        {entry.message && (
                          <p className="mt-2 text-sm text-gray-700 italic bg-yellow-50 p-2 rounded border-l-2 border-yellow-300">
                            "{entry.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add a helpful message or button if negotiation is ongoing */}
            {contract.status === 'negotiating' && (
              <div className="p-4 bg-blue-50 border-t border-blue-100 text-center">
                <p className="text-sm text-blue-800 mb-2">This contract is currently under negotiation.</p>
                <button
                  onClick={() => navigate(`/chat/${contract._id}`)}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <FaHandshake className="mr-1" /> Chat/Negotiate
                </button>
              </div>
            )}
          </div>
        </section>
      )}

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
              <FaHandshake className="mr-2" /> Chat/Negotiate
            </button>
            
            <button
              className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center shadow-sm"
              onClick={handleCancelContract}
              disabled={cancelLoading || contract.status === 'cancelled'}
              aria-label="Cancel this contract request"
            >
              {cancelLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Cancelling...
                </>
              ) : contract.status === 'cancelled' ? (
                <>Already Cancelled</>
              ) : (
                <><FaTimes className="mr-2" /> Decline Offer</>
              )}
            </button>
          </div>
        )}
        
        {(contract.status === 'approved' || contract.status === 'accepted') && (
          <div className="flex flex-wrap gap-3">
            <button
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center shadow-sm"
              onClick={() => navigate(`/messages?contractId=${contract._id}`)}
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