import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchContractRequests, cancelContractRequest } from '../../reducer/Slice/contractRequestsSlice';
import { FaHandshake, FaCalendarAlt, FaMoneyBillWave, FaFileContract, FaCheck, FaTimes, FaClock, FaUser, FaMapMarkerAlt, FaSeedling, FaLeaf, FaClipboardList, FaDownload, FaPrint, FaExclamationTriangle } from 'react-icons/fa';
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

  // Fetch contract requests if not already in Redux store
  useEffect(() => {
    if (contractRequests.length === 0 && !loading && !error) {
      dispatch(fetchContractRequests());
    }
  }, [dispatch, contractRequests.length, loading, error]);

  // Find the specific contract from the Redux store
  useEffect(() => {
    if (contractRequests.length > 0) {
      const foundContract = contractRequests.find(c => c._id === id);
      if (foundContract) {
        setContract(foundContract);
      } else {
        // If not found in Redux store, try to fetch it directly
        fetchContractById();
      }
    }
  }, [contractRequests, id]);

  // Fetch a single contract by ID if not found in Redux store
  const fetchContractById = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/contracts/${id}`);
      setContract(data);
    } catch (error) {
      toast.error(`Error fetching contract: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800" role="status">
            <FaCheck className="mr-1" aria-hidden="true" /> Approved
          </span>
        );
      case 'rejected':
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
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800" role="status">
            <FaCheck className="mr-1" aria-hidden="true" /> Completed
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
        await dispatch(cancelContractRequest(id)).unwrap();
        toast.success('Contract request cancelled successfully');
        navigate('/contracts');
      } catch (error) {
        toast.error(`Failed to cancel contract: ${error.message}`);
      } finally {
        setCancelLoading(false);
      }
    }
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
        <Link 
          to="/contracts" 
          className="text-green-600 hover:underline mt-4 inline-block"
          aria-label="Go back to contract requests"
        >
          Back to Contract Requests
        </Link>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md" role="alert">
        <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Contract Not Found</h2>
        <p className="text-gray-600 mb-4">The contract you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link 
          to="/contracts" 
          className="text-green-600 hover:underline mt-4 inline-block"
          aria-label="Go back to contract requests"
        >
          Back to Contract Requests
        </Link>
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
              Requested on {new Date(contract.createdAt).toLocaleDateString()}
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
                  ₹{(contract.quantity * contract.proposedPrice).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  {contract.quantity} {contract.product?.unit || 'units'} at ₹{contract.proposedPrice} per unit
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <FaCalendarAlt className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Requested Delivery Date</p>
                <p>{new Date(contract.requestedDeliveryDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-start">
              <FaFileContract className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Contract Duration</p>
                <p>{contract.contractDuration} days</p>
              </div>
            </div>

            <div className="flex items-start">
              <FaMoneyBillWave className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Payment Terms</p>
                <p>{contract.paymentTerms === 'standard' 
                    ? 'Standard (50% advance, 50% on delivery)' 
                    : contract.paymentTerms === 'milestone' 
                    ? 'Milestone-based payments'
                    : contract.paymentTerms === 'delivery'
                    ? 'Full payment on delivery'
                    : contract.paymentTerms === 'advance'
                    ? 'Full payment in advance (10% discount)'
                    : contract.paymentTerms}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <FaClipboardList className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Quality Standards</p>
                <p>{contract.qualityStandards === 'market' 
                    ? 'Market Standard' 
                    : contract.qualityStandards === 'premium' 
                    ? 'Premium Quality'
                    : contract.qualityStandards === 'organic'
                    ? 'Certified Organic'
                    : contract.qualityStandards === 'custom'
                    ? 'Custom Standards'
                    : contract.qualityStandards}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Farmer & Product Details */}
        <section aria-labelledby="farmer-details-heading">
          <h3 id="farmer-details-heading" className="text-lg font-semibold mb-4 flex items-center">
            <FaUser className="mr-2 text-green-600" aria-hidden="true" /> Farmer & Crop Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <FaUser className="text-green-600 mr-3 mt-1" aria-hidden="true" />
              <div>
                <p className="font-medium">Farmer</p>
                <p>{contract.farmer?.name || 'Local Farmer'}</p>
                {contract.farmer?.rating && (
                  <div className="flex items-center mt-1" aria-label={`Farmer rating: ${contract.farmer.rating.toFixed(1)} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.round(contract.farmer.rating) ? 'text-yellow-400' : 'text-gray-300'} aria-hidden="true">★</span>
                    ))}
                    <span className="ml-1 text-sm text-gray-600">({contract.farmer.rating.toFixed(1)})</span>
                  </div>
                )}
              </div>
            </div>

            {contract.farmer?.location && (
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-green-600 mr-3 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium">Farm Location</p>
                  <p>{contract.farmer.location}</p>
                </div>
              </div>
            )}

            {contract.product?.currentGrowthStage && (
              <div className="flex items-start">
                <FaSeedling className="text-green-600 mr-3 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium">Current Growth Stage</p>
                  <p>{contract.product.currentGrowthStage}</p>
                </div>
              </div>
            )}

            {contract.product?.farmingPractices && (
              <div className="flex items-start">
                <FaTractor className="text-green-600 mr-3 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium">Farming Practices</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contract.product.farmingPractices.map((practice, index) => (
                      <span 
                        key={index}
                        className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                      >
                        {practice}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {contract.product?.organic && (
              <div className="flex items-start">
                <FaLeaf className="text-green-600 mr-3 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium">Organic Certification</p>
                  <p>{contract.product.certification || 'Organic Certified'}</p>
                </div>
              </div>
            )}
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
              <p className="text-sm text-gray-600">{new Date(contract.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {contract.status !== 'pending' && (
            <div className="relative pl-12 pb-8">
              <div className="absolute left-0 rounded-full bg-blue-500 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                {contract.status === 'approved' ? <FaCheck /> : <FaTimes />}
              </div>
              <div>
                <p className="font-medium">
                  {contract.status === 'approved' ? 'Contract Approved' : 'Contract Rejected'}
                </p>
                <p className="text-sm text-gray-600">
                  {contract.statusUpdateDate 
                    ? new Date(contract.statusUpdateDate).toLocaleString()
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

          {contract.status === 'completed' && (
            <div className="relative pl-12">
              <div className="absolute left-0 rounded-full bg-green-600 text-white w-10 h-10 flex items-center justify-center" aria-hidden="true">
                <FaCheck />
              </div>
              <div>
                <p className="font-medium">Contract Completed</p>
                <p className="text-sm text-gray-600">
                  {contract.completionDate 
                    ? new Date(contract.completionDate).toLocaleString()
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
        
        {contract.status === 'pending' && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            onClick={handleCancelContract}
            disabled={cancelLoading}
            aria-label="Cancel this contract request"
          >
            {cancelLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Cancelling...
              </>
            ) : (
              <>Cancel Request</>
            )}
          </button>
        )}
        
        {contract.status === 'approved' && (
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