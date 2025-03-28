import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchContractRequests, 
  cancelContractRequest,
  addContractRequest 
} from '../../reducer/Slice/contractRequestsSlice';
import { FaHandshake, FaCalendarAlt, FaMoneyBillWave,FaTractor, FaFileContract, FaCheck, FaTimes, FaClock, FaUser, FaMapMarkerAlt, FaSeedling, FaLeaf, FaClipboardList, FaDownload, FaPrint, FaExclamationTriangle } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { api } from '../../services/api';

const ContractDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contractRequests, loading, error } = useSelector(state => state.contractRequests);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
      case 'requested':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800" role="status">
            <FaClock className="mr-1" aria-hidden="true" /> {status === 'requested' ? 'Requested' : 'Pending'}
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
  
  console.log("Final contract state:", contract);
  
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
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto" role="main" aria-labelledby="contract-title">
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
            <h2 className="font-semibold text-xl mb-1">{contract.product?.name || 'Crop Contract'}</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Contract Details */}
        <section aria-labelledby="contract-details-heading">
          <h3 id="contract-details-heading" className="text-lg font-semibold mb-4 flex items-center">
            <FaFileContract className="mr-2 text-green-600" aria-hidden="true" /> Contract Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <FaMoneyBillWave className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Contract Value</p>
                <p className="text-xl font-bold text-green-600">
                  ₹{contract.totalAmount?.toLocaleString() || (contract.quantity * contract.pricePerUnit).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  {contract.quantity} {contract.unit || 'units'} at ₹{contract.pricePerUnit} per unit
                </p>
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

            {contract.expectedHarvestDate && (
              <div className="flex items-start">
                <FaCalendarAlt className="text-green-600 mr-3 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium">Expected Harvest Date</p>
                  <p>
                    {(() => {
                      try {
                        return new Date(contract.expectedHarvestDate).toLocaleDateString();
                      } catch (e) {
                        return contract.expectedHarvestDate || 'Not specified';
                      }
                    })()}
                  </p>
                </div>
              </div>
            )}

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
              <FaClipboardList className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Quality Requirements</p>
                <p>{contract.qualityRequirements || contract.qualityStandards || 'Standard quality'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Farmer & Crop Details */}
        <section aria-labelledby="farmer-crop-details-heading">
          <h3 id="farmer-crop-details-heading" className="text-lg font-semibold mb-4 flex items-center">
            <FaUser className="mr-2 text-green-600" aria-hidden="true" /> Farmer & Crop Details
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
                <p>{contract.crop?.name || 'Agricultural product'}</p>
                {contract.crop?.images && contract.crop.images.length > 0 && (
                  <img 
                    src={contract.crop.images[0]} 
                    alt={contract.crop.name || 'Crop'} 
                    className="mt-2 w-20 h-20 object-cover rounded-md"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start">
              <FaMoneyBillWave className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Market Price</p>
                <p>₹{contract.crop?.price || 'N/A'}</p>
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
            </div>
          </div>

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

          {contract.status !== 'pending' && contract.status !== 'requested' && contract.status !== 'cancelled' && (
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 print:hidden">
        <Link
          to="/contracts"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          aria-label="Go back to all contracts"
        >
          Back to All Contracts
        </Link>
        
        {(contract.status === 'pending' || contract.status === 'requested') && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
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
              <>Cancel Request</>
            )}
          </button>
        )}
        
        {(contract.status === 'approved' || contract.status === 'accepted') && (
          <div className="space-x-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={() => navigate(`/messages?contractId=${contract._id}`)}
              aria-label="Contact the farmer about this contract"
            >
              Contact Farmer
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => navigate(`/payment?contractId=${contract._id}`)}
              aria-label="Make a payment for this contract"
            >
              Make Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractDetail; 