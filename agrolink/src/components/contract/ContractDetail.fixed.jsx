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
  FaUserTie, FaChartLine, FaCannon, FaShippingFast, FaWarehouse, FaTruckLoading, FaCommentDots, FaCommentSlash, FaPlus, FaArrowLeft,
  FaCameraRetro, FaExpand, FaCheckCircle, FaCircleNotch
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { contractService } from '../../services/contractService';
import { formatDistanceToNow } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Utility function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Utility function to format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Not specified';
    try {
      return `₹${Number(amount).toLocaleString('en-IN')}`;
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `₹${amount}`;
    }
  };
  
  // Check if active tab is no longer accessible due to contract status
  useEffect(() => {
    // If on terms tab but contract is not in an approved state, redirect to overview
    if (activeTab === 'terms' && !['payment_pending', 'accepted', 'active', 'harvested', 'delivered', 'completed'].includes(contract?.status)) {
      setActiveTab('overview');
    }
    
    // If on progress tab but contract is not in an approved state, redirect to overview
    if (activeTab === 'progress' && !['accepted', 'active', 'harvested', 'delivered', 'completed'].includes(contract?.status)) {
      setActiveTab('overview');
    }
  }, [contract?.status, activeTab]);
  
  // Determine if current user is farmer or buyer
  const isFarmer = contract ? (contract.farmer._id === user._id || contract.farmer === user._id) : false;
  const isBuyer = !isFarmer; // Define isBuyer as the opposite of isFarmer
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
      case 'payment_pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800" role="status">
            <FaMoneyBillWave className="mr-1" aria-hidden="true" /> Payment Required
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
    if (window.confirm("Are you sure you want to cancel this contract? This action cannot be undone.")) {
        setCancelLoading(true);
      try {
        const result = await contractService.updateContractStatus(contract._id, 'cancelled');
        if (result) {
          toast.success("Contract cancelled successfully");
          setContract(prev => ({ ...prev, status: 'cancelled' }));
          } else {
          toast.error("Failed to cancel contract. Please try again.");
        }
      } catch (error) {
        console.error("Error cancelling contract:", error);
        toast.error(error.message || "An error occurred while cancelling the contract");
      } finally {
          setCancelLoading(false);
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

  // Handle contract status updates
  const updateContractStatus = async (newStatus) => {
    if (!confirm(`Are you sure you want to update the contract status to ${newStatus}?`)) {
      return;
    }

    try {
      setCancelLoading(true);
      const response = await api.put(`/contracts/${id}/status`, { status: newStatus });
      
      if (response.data && response.data.success) {
        console.log(newStatus)
        console.log(response)
        toast.success(`Contract ${newStatus} successfully`);
        // Update local contract state
        setContract(prevContract => ({
          ...prevContract,
          status: newStatus
        }));
      }
    } catch (error) {
      console.error(`Error updating contract to ${newStatus}:`, error);
      toast.error(`Failed to update contract: ${error.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Define payment stage constants to prevent confusion
  const PAYMENT_STAGE = {
    ADVANCE: 'advance',
    MIDTERM: 'midterm',
    FINAL: 'final'
  };

  // Function to check if a specific payment is completed by looking at progressUpdates
  const isPaymentCompleted = (contract, stage) => {
    if (!contract || !contract.progressUpdates || contract.progressUpdates.length === 0) {
      return false;
    }
    
    return contract.progressUpdates.some(update => 
      update.updateType === "payment" && 
      update.description.toLowerCase().includes(stage)
    );
  };

  // Replace isMidtermPaymentCompleted with the more generic function
  const isMidtermPaymentCompleted = (contract) => {
    return isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM);
  };

  // Add specific helper functions for each payment type
  const isAdvancePaymentCompleted = (contract) => {
    return isPaymentCompleted(contract, PAYMENT_STAGE.ADVANCE);
  };

  const isFinalPaymentCompleted = (contract) => {
    return isPaymentCompleted(contract, PAYMENT_STAGE.FINAL);
  };

  // Get payment date for a specific stage
  const getPaymentDate = (contract, stage) => {
    if (!contract || !contract.progressUpdates) return null;
    
    const paymentUpdate = contract.progressUpdates.find(update => 
      update.updateType === "payment" && 
      update.description.toLowerCase().includes(stage)
    );
    
    return paymentUpdate ? paymentUpdate.updatedAt : null;
  };

  // Update handleConfirmPayment function to use progressUpdates for tracking payments
  const handleConfirmPayment = async () => {
    try {
      // Determine which payment stage we're in based on contract.currentPaymentStage
      let paymentStage = contract.currentPaymentStage || PAYMENT_STAGE.ADVANCE;
      let paymentPercentage = 0;
      let nextStatus = '';
      
      // Set correct payment percentage and next status based on stage
      if (paymentStage === PAYMENT_STAGE.ADVANCE) {
        paymentPercentage = contract.paymentTerms?.advancePercentage || 20;
        nextStatus = 'active';
      } else if (paymentStage === PAYMENT_STAGE.MIDTERM) {
        paymentPercentage = contract.paymentTerms?.midtermPercentage || 50;
        nextStatus = 'harvested'; // After midterm payment, status should be harvested
      } else if (paymentStage === PAYMENT_STAGE.FINAL) {
        paymentPercentage = contract.paymentTerms?.finalPercentage || 30;
        nextStatus = 'completed';
      }
      
      // Calculate payment amount based on percentage
      const paymentAmount = (contract.totalAmount * paymentPercentage / 100).toFixed(2);
      
      // Create a progress update to track this payment - using standard updateType from schema
      const formData = new FormData();
      formData.append('updateType', 'payment'); // Use standard type from schema
      formData.append('description', `${paymentStage.charAt(0).toUpperCase() + paymentStage.slice(1)} payment of ${formatCurrency(paymentAmount)} (${paymentPercentage}%) completed.`);
      
      try {
        // Add the payment update to progress updates
        await contractService.addProgressUpdate(contract._id, formData);
      } catch (error) {
        console.error(`Error adding payment progress update: ${error.message}`);
      }
      
      // Update contract status
      await updateContractStatus(nextStatus);
      
      // Show success message
      toast.success(`${paymentStage.charAt(0).toUpperCase() + paymentStage.slice(1)} payment completed successfully! Contract is now ${nextStatus}.`);
      
      // Update local contract state
      setContract(prevContract => ({
        ...prevContract,
        status: nextStatus,
        progressUpdates: [...(prevContract.progressUpdates || []), {
          updateType: 'payment',
          description: `${paymentStage.charAt(0).toUpperCase() + paymentStage.slice(1)} payment of ${formatCurrency(paymentAmount)} (${paymentPercentage}%) completed.`,
          updatedAt: new Date()
        }],
        currentPaymentStage: null,
        currentPaymentAmount: null,
        currentPaymentPercentage: null
      }));
    } catch (error) {
      toast.error(`Failed to process payment: ${error.message}`);
      console.error(error);
    }
  };

  // Keep handleVerifyPayment for farmer to manually verify payments if needed
  const handleVerifyPayment = async () => {
    if (window.confirm('Confirm that you have received the payment?')) {
      try {
        const currentStage = contract.currentPaymentStage || PAYMENT_STAGE.ADVANCE;
        let nextStatus = 'active';
        
        // Determine next status based on payment stage
        if (currentStage === PAYMENT_STAGE.ADVANCE) {
          nextStatus = 'active';
        } else if (currentStage === PAYMENT_STAGE.MIDTERM) {
          nextStatus = 'harvested';
        } else if (currentStage === PAYMENT_STAGE.FINAL) {
          nextStatus = 'completed';
        }
        
        // Use standard updateType from schema
        const formData = new FormData();
        formData.append('updateType', 'payment');
        formData.append('description', `${currentStage.charAt(0).toUpperCase() + currentStage.slice(1)} payment verified by farmer.`);
        
        try {
          await contractService.addProgressUpdate(contract._id, formData);
        } catch (progressError) {
          console.error('Error adding payment verification update:', progressError);
        }
        
        // Update the contract status
        await updateContractStatus(nextStatus);
        
        toast.success(`Payment verified! Contract ${nextStatus === 'active' ? 'is now active' : 'updated accordingly'}.`);
        
        // Update local contract state
        setContract(prevContract => ({
          ...prevContract,
          status: nextStatus,
          progressUpdates: [...(prevContract.progressUpdates || []), {
            updateType: 'payment',
            description: `${currentStage.charAt(0).toUpperCase() + currentStage.slice(1)} payment verified by farmer.`,
            updatedAt: new Date()
          }],
          paymentSubmitted: false,
          currentPaymentStage: null,
          currentPaymentAmount: null,
          currentPaymentPercentage: null
        }));
      } catch (error) {
        toast.error(`Failed to verify payment: ${error.message}`);
        console.error(error);
      }
    }
  };

  // Fix handleAcceptContract to set correct payment stage
  const handleAcceptContract = async () => {
    try {
      // Update contract status to payment_pending
      await updateContractStatus('payment_pending');
      toast.success('Contract accepted. Waiting for advance payment.');
      
      // Set the correct payment stage (advance) when accepting a contract
      setContract(prevContract => ({
        ...prevContract,
        status: 'payment_pending',
        currentPaymentStage: PAYMENT_STAGE.ADVANCE
      }));
    } catch (error) {
      toast.error(`Failed to accept contract: ${error.message}`);
      console.error(error);
    }
  };

  // Simplify handleMarkAsHarvested to transition correctly
  const handleMarkAsHarvested = async () => {
    if (!window.confirm('Are you sure you want to mark this contract as harvested?')) {
      return;
    }
    
    setCancelLoading(true);
    try {
      // Check if midterm payment is needed
      if ((contract.paymentTerms?.midtermPercentage || 50) > 0) {
        // First update status to payment_pending for midterm payment
        await updateContractStatus('payment_pending');
        
        // Add harvest progress update - using standard updateType from schema
        const formData = new FormData();
        formData.append('updateType', 'harvesting'); // This is a valid enum value in the schema
        formData.append('description', 'Crop has been harvested and is ready for processing. Waiting for midterm payment.');
        
        try {
          await contractService.addProgressUpdate(contract._id, formData);
        } catch (progressError) {
          console.error('Error adding harvest progress update:', progressError);
        }
        
        toast.info('Crop has been harvested. Waiting for midterm payment from buyer');
        
        // Update contract locally with correct payment stage and status
        setContract(prevContract => ({
          ...prevContract,
          status: 'payment_pending',
          currentPaymentStage: PAYMENT_STAGE.MIDTERM,
          progressUpdates: [...(prevContract.progressUpdates || []), {
            updateType: 'harvesting',
            description: 'Crop has been harvested and is ready for processing. Waiting for midterm payment.',
            updatedAt: new Date()
          }]
        }));
      } else {
        // If no midterm payment needed, just update to harvested
        await updateContractStatus('harvested');
        
        // Add harvest progress update - using standard updateType from schema  
        const formData = new FormData();
        formData.append('updateType', 'harvesting'); // This is a valid enum value in the schema  
        formData.append('description', 'Crop has been harvested and is ready for processing.');
        
        try {
          await contractService.addProgressUpdate(contract._id, formData);
        } catch (progressError) {
          console.error('Error adding harvest progress update:', progressError);
        }
        
        toast.success('Contract marked as harvested');
        
        // Update contract with new status and progress update
        setContract(prevContract => ({
          ...prevContract,
          status: 'harvested',
          progressUpdates: [...(prevContract.progressUpdates || []), {
            updateType: 'harvesting',
            description: 'Crop has been harvested and is ready for processing.',
            updatedAt: new Date()
          }]
        }));
      }
    } catch (error) {
      console.error('Error during harvest marking:', error);
      toast.error(`Failed to mark as harvested: ${error.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Simplify handleMarkAsDelivered for correct transitions
  const handleMarkAsDelivered = async () => {
    if (!window.confirm('Are you sure you want to mark this contract as delivered?')) {
      return;
    }
    
    setCancelLoading(true);
    try {
      // Update contract status to delivered
      await updateContractStatus('delivered');
      
      // Add delivery progress update - using standard updateType from schema
      const formData = new FormData();
      formData.append('updateType', 'shipping'); // This is a valid enum value in the schema
      formData.append('description', 'Crop has been delivered to the buyer.');
      
      try {
        await contractService.addProgressUpdate(contract._id, formData);
      } catch (progressError) {
        console.error('Error adding delivery progress update:', progressError);
      }
      
      toast.success('Contract marked as delivered');
      
      // Update contract with new status and progress update
      setContract(prevContract => ({
        ...prevContract,
        status: 'delivered',
        progressUpdates: [...(prevContract.progressUpdates || []), {
          updateType: 'shipping',
          description: 'Crop has been delivered to the buyer.',
          updatedAt: new Date()
        }]
      }));
      
      // Check if final payment is needed
      if ((contract.paymentTerms?.finalPercentage || 30) > 0) {
        // Simple delay to ensure the status update completes
        setTimeout(async () => {
          try {
            await updateContractStatus('payment_pending');
            toast.info('Waiting for final payment from buyer. Note: Payment should be made once delivery is received.');
            
            // Update contract locally with correct payment stage
            setContract(prevContract => ({
              ...prevContract,
              status: 'payment_pending',
              currentPaymentStage: PAYMENT_STAGE.FINAL
            }));
          } catch (paymentError) {
            console.error('Error transitioning to payment_pending:', paymentError);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error during delivery marking:', error);
      toast.error(`Failed to mark as delivered: ${error.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Get color scheme based on contract status
  const getStatusColors = (status) => {
    switch (status) {
      case 'requested':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FaClock className="mr-1" /> };
      case 'negotiating':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaHandshake className="mr-1" /> };
      case 'payment_pending':
        return { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaMoneyBillWave className="mr-1" /> };
      case 'accepted':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheck className="mr-1" /> };
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: <FaLeaf className="mr-1" /> };
      case 'readyForHarvest':
        return { bg: 'bg-amber-100', text: 'text-amber-800', icon: <FaSeedling className="mr-1" /> };
      case 'harvested':
        return { bg: 'bg-teal-100', text: 'text-teal-800', icon: <FaTractor className="mr-1" /> };
      case 'delivered':
        return { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: <FaShippingFast className="mr-1" /> };
      case 'completed':
        return { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaCheck className="mr-1" /> };
      case 'cancelled':
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaTimes className="mr-1" /> };
      case 'disputed':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: <FaExclamationTriangle className="mr-1" /> };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaFileContract className="mr-1" /> };
    }
  };

  // Navigate to chat
  const handleOpenChat = () => {
    navigate(`/chat/${id}`);
  };

  // Add this helper function after the existing helper functions
  const canAcceptContract = (contract, isFarmer) => {
    // Check if contract is undefined
    if (!contract) {
      return false;
    }
    
    // If contract is already cancelled or approved, no one can accept
    if (['cancelled', 'accepted'].includes(contract.status)) {
      return false;
    }

    // If no negotiation history, only farmer can accept
    if (!contract.negotiationHistory || contract.negotiationHistory.length === 0) {
      return isFarmer;
    }

    // Get the last negotiation entry
    const lastNegotiation = contract.negotiationHistory[contract.negotiationHistory.length - 1];
    const lastProposerId = typeof lastNegotiation.proposedBy === 'object' 
      ? lastNegotiation.proposedBy._id 
      : lastNegotiation.proposedBy;

    const farmerId = typeof contract.farmer === 'object' 
      ? contract.farmer._id 
      : contract.farmer;

    // If farmer made the last offer, only buyer can accept
    if (lastProposerId === farmerId) {
      return !isFarmer;
    }
    
    // If buyer made the last offer, only farmer can accept
    return isFarmer;
  };

  // Add back simple reject and complete functions
  const handleRejectContract = async () => {
    if (window.confirm('Are you sure you want to reject this contract?')) {
      try {
        await updateContractStatus('rejected');
        toast.success('Contract has been rejected');
      } catch (error) {
        toast.error(`Failed to reject contract: ${error.message}`);
        console.error(error);
      }
    }
  };

  const handleMarkAsCompleted = async () => {
    if (window.confirm('Are you sure you want to mark this contract as completed?')) {
      try {
        await updateContractStatus('completed');
        toast.success('Contract has been marked as completed');
      } catch (error) {
        toast.error(`Failed to complete contract: ${error.message}`);
        console.error(error);
      }
    }
  };

  const handleAddProgressUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updateType = formData.get('updateType');
    const description = formData.get('description');
    const images = formData.getAll('images');
    
    if (!updateType || !description) {
      toast.error('Please provide an update type and description');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images if any
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          if (images[i].size > 0) {
            formData.append(`images[]`, images[i]);
          }
        }
      }
      
      // Make API call to add progress update
      await contractService.addProgressUpdate(contract._id, formData);
      
      // Reset form
      e.target.reset();
      
      // Show success message
      toast.success('Progress update added successfully!');
      
      // Refetch contract to get updated data
      fetchContractById();
    } catch (error) {
      toast.error(`Failed to add progress update: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
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

  const statusColors = getStatusColors(contract.status);
  const cropName = cropDetails?.name || contract.crop?.name || 'Agricultural Product';
  const otherParty = isFarmer ? contract.buyer : contract.farmer;
  const otherPartyName = otherParty?.Name || 'Contract Party';

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-6xl mx-auto">
      {/* Contract Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold">{cropName} Contract</h1>
            <p className="text-sm opacity-80">ID: {contract._id}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
              {statusColors.icon} {contract.status.charAt(0).toUpperCase() + contract.status.slice(1).replace(/([A-Z])/g, ' $1')}
            </span>
            
            <div className="flex gap-2 print:hidden">
          <button
                onClick={handleOpenChat}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
                <FaCommentDots className="mr-1" /> Chat
          </button>
              
          <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 flex items-center text-sm"
          >
                <FaPrint className="mr-1" /> Print
          </button>
            </div>
        </div>
      </div>

        {/* Contract Timeline */}
        <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4">
          <div className="flex flex-wrap items-center text-sm">
            <div className="flex items-center mr-6 mb-2">
              <FaCalendarAlt className="mr-1 opacity-80" />
              <span>Requested: {formatDate(contract.createdAt || contract.requestDate)}</span>
          </div>
            
            <div className="flex items-center mr-6 mb-2">
              <FaSeedling className="mr-1 opacity-80" />
              <span>Expected Harvest: {formatDate(contract.expectedHarvestDate)}</span>
            </div>
            
            <div className="flex items-center mb-2">
              <FaShippingFast className="mr-1 opacity-80" />
              <span>Delivery: {formatDate(contract.deliveryDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 print:hidden">
        <nav className="flex overflow-x-auto">
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' 
              ? 'border-b-2 border-green-600 text-green-600' 
              : 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          
          {/* Only show Detailed Contract Terms tab when contract is accepted or later */}
          {['payment_pending', 'accepted', 'active', 'harvested', 'delivered', 'completed'].includes(contract.status) && (
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'terms' 
                ? 'border-b-2 border-green-600 text-green-600' 
                : 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300'}`}
              onClick={() => setActiveTab('terms')}
            >
              Detailed Contract Terms
            </button>
          )}
          
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'negotiations' 
              ? 'border-b-2 border-green-600 text-green-600' 
              : 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300'}`}
            onClick={() => setActiveTab('negotiations')}
          >
            Negotiation History
          </button>
          
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'progress' 
              ? 'border-b-2 border-green-600 text-green-600' 
              : 'text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300'}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress Updates
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Contract Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
              <div className={`p-4 ${statusColors.bg} flex justify-between items-center`}>
                <div className="flex items-center">
                  <h3 className={`text-lg font-semibold ${statusColors.text} flex items-center`}>
                    {statusColors.icon} Contract Status: {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                  </h3>
          </div>
                <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-white shadow-sm">
                  ID: {contract._id.substr(-6)}
                </span>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created</h4>
                    <p className="text-gray-800">{formatDate(contract.createdAt)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(contract.createdAt), { addSuffix: true })}
            </p>
          </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                    <p className="text-gray-800">{formatDate(contract.updatedAt)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(contract.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contract Term</h4>
                    <p className="text-gray-800">
                      {formatDate(contract.expectedDeliveryDate)} (Expected)
                    </p>
                    {contract.status === 'completed' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed on {formatDate(contract.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
        </div>
      </div>

            {/* Payment Required Card - Only shown to buyer when contract is in payment_pending state */}
            {isBuyer && contract.status === 'payment_pending' && (
              <div className="bg-white rounded-lg border border-yellow-300 p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                  <FaMoneyBillWave className="mr-2 text-yellow-600" /> 
                  {contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? 'Advance Payment Required' :
                   contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? 'Midterm Payment Required' :
                   contract.currentPaymentStage === PAYMENT_STAGE.FINAL ? 'Final Payment Required' : 'Payment Required'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE 
                    ? 'Please complete the advance payment to activate this contract.' 
                    : contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM
                      ? 'The crop has been harvested. Please complete the midterm payment as per agreement.'
                      : 'The crop has been delivered. Please complete the final payment to complete the contract. Please verify that you have received the delivery before making payment.'}
                </p>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Payment Details:</h4>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Payment Stage:</span>
                    <span className="font-medium">
                      {contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? 'Advance Payment' :
                       contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? 'Midterm Payment' :
                       contract.currentPaymentStage === PAYMENT_STAGE.FINAL ? 'Final Payment' : 'Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Percentage:</span>
                    <span className="font-medium">
                      {contract.currentPaymentPercentage || 
                       (contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? contract.paymentTerms?.advancePercentage || 20 :
                        contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? contract.paymentTerms?.midtermPercentage || 50 :
                        contract.paymentTerms?.finalPercentage || 30)}%
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(contract.currentPaymentAmount || 
                        ((contract.totalAmount * (contract.currentPaymentPercentage || 
                          (contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? contract.paymentTerms?.advancePercentage || 20 :
                           contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? contract.paymentTerms?.midtermPercentage || 50 :
                           contract.paymentTerms?.finalPercentage || 30)) / 100).toFixed(2))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Total Contract Value:</span>
                    <span className="font-medium">{formatCurrency(contract.totalAmount)}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (window.confirm(`Confirm payment of ${formatCurrency(contract.currentPaymentAmount || 
                        ((contract.totalAmount * (contract.currentPaymentPercentage || 
                          (contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? contract.paymentTerms?.advancePercentage || 20 :
                           contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? contract.paymentTerms?.midtermPercentage || 50 :
                           contract.paymentTerms?.finalPercentage || 30)) / 100).toFixed(2))
                      )} for ${contract.currentPaymentStage || PAYMENT_STAGE.ADVANCE} payment? This will automatically progress the contract.`)) {
                        handleConfirmPayment();
                      }
                    }}
                    className="mt-4 py-2 px-4 rounded-md flex items-center justify-center w-full bg-green-600 text-white hover:bg-green-700"
                  >
                    <FaMoneyBillWave className="mr-2" /> Complete Payment
                  </button>
                </div>
              </div>
            )}
            
            {/* Payment Confirmation - Only shown to farmer when contract is in payment_pending state */}
            {isFarmer && contract.status === 'payment_pending' && (
              <div className="bg-white rounded-lg border border-yellow-300 p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                  <FaMoneyBillWave className="mr-2 text-yellow-600" /> 
                  {contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? 'Awaiting Advance Payment' :
                   contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? 'Awaiting Midterm Payment' :
                   contract.currentPaymentStage === PAYMENT_STAGE.FINAL ? 'Awaiting Final Payment' : 'Awaiting Payment'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {contract.paymentSubmitted 
                    ? `The buyer has confirmed making the ${contract.currentPaymentStage || PAYMENT_STAGE.ADVANCE} payment. Please verify once you've received it.`
                    : `Waiting for buyer to complete ${contract.currentPaymentStage || PAYMENT_STAGE.ADVANCE} payment. If you have already received the payment, you can manually verify below.`}
                </p>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Payment Details:</h4>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Payment Stage:</span>
                    <span className="font-medium">
                      {contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? 'Advance Payment' :
                       contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? 'Midterm Payment' :
                       contract.currentPaymentStage === PAYMENT_STAGE.FINAL ? 'Final Payment' : 'Payment'}
                    </span>
          </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Percentage:</span>
                    <span className="font-medium">
                      {contract.currentPaymentPercentage || 
                       (contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? contract.paymentTerms?.advancePercentage || 20 :
                        contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? contract.paymentTerms?.midtermPercentage || 50 :
                        contract.paymentTerms?.finalPercentage || 30)}%
                    </span>
        </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(contract.currentPaymentAmount || 
                        ((contract.totalAmount * (contract.currentPaymentPercentage || 
                          (contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? contract.paymentTerms?.advancePercentage || 20 :
                           contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? contract.paymentTerms?.midtermPercentage || 50 :
                           contract.paymentTerms?.finalPercentage || 30)) / 100).toFixed(2))
                      )}
                    </span>
      </div>

                  <button
                    onClick={handleVerifyPayment}
                    className="mt-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center w-full"
                  >
                    <FaCheckCircle className="mr-2" /> {contract.paymentSubmitted ? "Verify Payment Received" : "Payment Already Received"}
                  </button>
                </div>
              </div>
            )}
            
            {/* Contract Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Latest Offer / Decided Terms Card */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                  {contract.status === 'accepted' || contract.status === 'active' ? (
                    <>
                      <FaCheck className="mr-2 text-green-600" /> Decided Terms
                    </>
                  ) : (
                    <>
                      <FaHandshake className="mr-2 text-blue-600" /> Latest Offer
                    </>
                  )}
          </h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-32">Product:</span>
                    <span className="text-gray-800">{cropDetails?.name || contract.crop?.name || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-32">Quantity:</span>
                    <span className="text-gray-800">
                      {contract.negotiationHistory && contract.negotiationHistory.length > 0 
                        ? `${contract.negotiationHistory[contract.negotiationHistory.length - 1].proposedChanges.quantity} ${contract.unit}`
                        : `${contract.quantity} ${contract.unit}`}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-32">Price Per Unit:</span>
                    <span className="text-gray-800">
                      {contract.negotiationHistory && contract.negotiationHistory.length > 0 
                        ? formatCurrency(contract.negotiationHistory[contract.negotiationHistory.length - 1].proposedChanges.pricePerUnit)
                        : formatCurrency(contract.pricePerUnit)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-32">Total Value:</span>
                    <span className="text-gray-800 font-semibold">
                      {contract.negotiationHistory && contract.negotiationHistory.length > 0 
                        ? formatCurrency(contract.negotiationHistory[contract.negotiationHistory.length - 1].proposedChanges.pricePerUnit * 
                          contract.negotiationHistory[contract.negotiationHistory.length - 1].proposedChanges.quantity)
                        : formatCurrency(contract.totalAmount)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-32">Delivery Date:</span>
                    <span className="text-gray-800">
                      {contract.negotiationHistory && contract.negotiationHistory.length > 0 
                        ? formatDate(contract.negotiationHistory[contract.negotiationHistory.length - 1].proposedChanges.deliveryDate)
                        : formatDate(contract.deliveryDate)}
                    </span>
                  </div>
                  {contract.negotiationHistory && contract.negotiationHistory.length > 0 && (
                    <div className="flex">
                      <span className="font-medium text-gray-600 w-32">Last Updated:</span>
                      <span className="text-gray-800">
                        {formatDate(contract.negotiationHistory[contract.negotiationHistory.length - 1].proposedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Contract Parties Card */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                  <FaHandshake className="mr-2 text-green-600" /> Contract Parties
                </h3>
          <div className="space-y-4">
                  {/* Farmer Info */}
              <div>
                    <h4 className="font-medium flex items-center text-gray-700 mb-2">
                      <FaTractor className="mr-1 text-sm" /> 
                      Farmer {isFarmer ? '(You)' : ''}
                    </h4>
                    <div className="ml-6 space-y-1 text-sm">
                      <p className="text-gray-800">{contract.farmer?.Name || 'Not specified'}</p>
                      {contract.farmer?.farmName && (
                        <p className="text-gray-600">{contract.farmer.farmName}</p>
                      )}
                      {contract.farmer?.email && (
                        <p className="text-gray-600">{contract.farmer.email}</p>
                      )}
                      {contract.farmer?.contactNumber && (
                        <p className="text-gray-600">{contract.farmer.contactNumber}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Buyer Info */}
                  <div>
                    <h4 className="font-medium flex items-center text-gray-700 mb-2">
                      <FaUserTie className="mr-1 text-sm" /> 
                      Buyer {!isFarmer ? '(You)' : ''}
                    </h4>
                    <div className="ml-6 space-y-1 text-sm">
                      <p className="text-gray-800">{contract.buyer?.Name || 'Not specified'}</p>
                      {contract.buyer?.email && (
                        <p className="text-gray-600">{contract.buyer.email}</p>
                      )}
                      {contract.buyer?.contactNumber && (
                        <p className="text-gray-600">{contract.buyer.contactNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timelines and Key Dates */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <FaCalendarAlt className="mr-2 text-green-600" /> Contract Timeline
              </h3>
              
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {/* Timeline Events */}
                <div className="space-y-6 relative ml-8">
                  {/* Request Date */}
                  <div className="relative">
                    <div className="absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 border-green-600 bg-white"></div>
                    <div>
                      <h4 className="font-medium text-gray-800">Contract Requested</h4>
                <p className="text-sm text-gray-600">
                        {formatDate(contract.createdAt || contract.requestDate)}
                </p>
              </div>
            </div>

                  {/* Negotiation / Acceptance Phase */}
                  <div className="relative">
                    <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                      ${contract.status === 'requested' || contract.status === 'negotiating' 
                        ? 'border-blue-500 bg-blue-100' 
                        : (contract.status === 'cancelled' || contract.status === 'rejected') 
                          ? 'border-red-500 bg-red-100' 
                          : 'border-green-600 bg-white'}`}>
                    </div>
              <div>
                      <h4 className="font-medium text-gray-800">
                        {contract.status === 'negotiating' 
                          ? 'Under Negotiation' 
                          : (contract.status === 'cancelled' || contract.status === 'rejected')
                            ? 'Contract Cancelled/Rejected'
                            : contract.status === 'requested'
                              ? 'Awaiting Approval'
                              : 'Contract Accepted'}
                      </h4>
                <p className="text-sm text-gray-600">
                        {contract.status === 'requested' 
                          ? 'Pending farmer approval' 
                          : contract.status === 'negotiating' 
                            ? 'Terms being negotiated'
                            : contract.status === 'accepted' || contract.status === 'active'
                              ? `Accepted on ${formatDate(contract.updatedAt)}`
                              : 'No longer active'}
                </p>
              </div>
            </div>

                  {/* Payment Timeline - based on payment terms */}
                  {(['payment_pending', 'active', 'readyForHarvest', 'harvested', 'delivered', 'completed'].includes(contract.status)) && (
                    <>
                      {/* Advance Payment */}
                      <div className="relative">
                        <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                          ${contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE
                            ? 'border-amber-500 bg-amber-100' 
                            : isAdvancePaymentCompleted(contract)
                              ? 'border-green-600 bg-white'
                              : 'border-gray-300 bg-gray-100'}`}>
                        </div>
              <div>
                          <h4 className="font-medium text-gray-800 flex items-center">
                            <FaMoneyBillWave className="mr-1 text-green-600" />
                            Advance Payment ({contract.paymentTerms?.advancePercentage || 20}%)
                          </h4>
                          <p className="text-sm text-gray-600">
                            {isAdvancePaymentCompleted(contract)
                              ? `Completed on ${formatDate(getPaymentDate(contract, PAYMENT_STAGE.ADVANCE))}`
                              : contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE
                                ? contract.paymentSubmitted
                                  ? 'Payment notification sent, awaiting verification'
                                  : 'Waiting for buyer to complete advance payment'
                                : ['active', 'harvested', 'readyForHarvest', 'delivered', 'completed'].includes(contract.status)
                                  ? 'Completed'
                                  : 'Due after contract acceptance'}
                </p>
              </div>
            </div>

                      {/* Inside the Growing Phase section in the Timeline */}
                      <div className="relative">
                        <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                          ${contract.status === 'active'
                            ? 'border-green-500 bg-green-100' 
                            : ['harvested', 'readyForHarvest', 'delivered', 'completed'].includes(contract.status)
                              ? 'border-green-600 bg-white'
                              : 'border-gray-300 bg-gray-100'}`}>
                        </div>
                <div>
                          <h4 className="font-medium text-gray-800 flex items-center justify-between">
                            <span className="flex items-center">
                              <FaLeaf className="mr-1 text-green-600" />
                              Growing Phase
                            </span>
                            {/* Add Mark as Harvested button for farmer only when contract is active */}
                            {isFarmer && contract.status === 'active' && !['harvested', 'delivered', 'completed'].includes(contract.status) && (
                              <button 
                                onClick={handleMarkAsHarvested}
                                disabled={cancelLoading}
                                className="ml-4 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                              >
                                <FaTractor className="mr-1" /> Mark as Harvested
                              </button>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {contract.status === 'active'
                              ? 'In progress - Crop is being cultivated'
                              : ['harvested', 'readyForHarvest', 'delivered', 'completed'].includes(contract.status)
                                ? 'Completed'
                                : 'Starts after advance payment'}
                            {contract.expectedHarvestDate && [
                              ' (Expected completion: ',
                              formatDate(contract.expectedHarvestDate),
                              ')'
                            ].join('')}
                            {/* Add progress updates if available */}
                            {contract.progressUpdates && contract.progressUpdates.some(update => 
                              update.updateType === 'growth_update' || update.updateType === 'planting' || update.updateType === 'issue'
                            ) && (
                              <span className="ml-1 text-blue-600 text-xs">
                                ({contract.progressUpdates.filter(update => 
                                  update.updateType === 'growth_update' || update.updateType === 'planting' || update.updateType === 'issue'
                                ).length} updates available)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Inside the Harvest section in the Timeline */}
                      <div className="relative">
                        <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                          ${contract.status === 'readyForHarvest'
                            ? 'border-amber-500 bg-amber-100' 
                            : ['harvested', 'delivered', 'completed'].includes(contract.status)
                              ? 'border-green-600 bg-white'
                              : 'border-gray-300 bg-gray-100'}`}>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 flex items-center justify-between">
                            <span className="flex items-center">
                              <FaTractor className="mr-1 text-green-600" />
                              Harvest
                            </span>
                          </h4>
                          <p className="text-sm text-gray-600">
                            {contract.status === 'readyForHarvest'
                              ? 'Ready for harvest'
                              : ['harvested', 'delivered', 'completed'].includes(contract.status)
                                ? 'Harvested on ' + formatDate(contract.progressUpdates.find(p => p.updateType === 'harvesting')?.updatedAt || contract.updatedAt)
                                : contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM
                                  ? 'Harvested. Awaiting midterm payment'
                                  : `Expected: ${formatDate(contract.expectedHarvestDate)}`}
                            
                            {/* Display payment status messages */}
                            {contract.status === 'harvested' && !isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM) && (
                              <span className="ml-2 text-amber-600 text-xs font-medium">
                                Waiting for midterm payment
                              </span>
                            )}
                            {contract.status === 'harvested' && isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM) && !['delivered', 'completed'].includes(contract.status) && (
                              <span className="ml-2 text-green-600 text-xs font-medium">
                                Ready for delivery
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Midterm Payment - Only if midtermPercentage > 0 */}
                      {(contract.paymentTerms?.midtermPercentage || 50) > 0 && (
                        <div className="relative">
                          <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                            ${contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM
                              ? 'border-amber-500 bg-amber-100' 
                              : isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM)
                                ? 'border-green-600 bg-white'
                                : ['delivered', 'completed'].includes(contract.status)
                                  ? 'border-green-600 bg-white'
                                  : 'border-gray-300 bg-gray-100'}`}>
                          </div>
              <div>
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <FaMoneyBillWave className="mr-1 text-green-600" />
                              Midterm Payment ({contract.paymentTerms?.midtermPercentage || 50}%)
                            </h4>
                            <p className="text-sm text-gray-600">
                              {isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM)
                                ? `Completed on ${formatDate(getPaymentDate(contract, PAYMENT_STAGE.MIDTERM))}`
                                : contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM
                                  ? contract.paymentSubmitted 
                                    ? 'Payment notification sent, awaiting verification'
                                    : 'Due after harvest - Waiting for buyer to complete payment'
                                  : ['harvested', 'delivered', 'completed'].includes(contract.status) && !isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM)
                                    ? 'Pending payment'
                                    : 'Due after harvest'}
                  </p>
                </div>
              </div>
            )}

                      {/* Delivery */}
                      <div className="relative">
                        <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                          ${contract.status === 'readyForDelivery'
                            ? 'border-amber-500 bg-amber-100' 
                            : ['delivered', 'completed'].includes(contract.status)
                              ? 'border-green-600 bg-white'
                              : 'border-gray-300 bg-gray-100'}`}>
                        </div>
              <div>
                          <h4 className="font-medium text-gray-800 flex items-center justify-between">
                            <span className="flex items-center">
                              <FaShippingFast className="mr-1 text-indigo-600" />
                              Delivery
                            </span>
                            {/* Move Out for Delivery button to the delivery section */}
                            {isFarmer && 
                             contract.status === 'harvested' && 
                             !['payment_pending', 'delivered', 'completed'].includes(contract.status) &&
                             isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM) && (
                              <button 
                                onClick={handleMarkAsDelivered}
                                disabled={cancelLoading}
                                className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                              >
                                <FaShippingFast className="mr-1" /> Mark as Out for Delivery
                              </button>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {contract.status === 'readyForDelivery'
                              ? 'Ready for delivery'
                              : ['delivered', 'completed'].includes(contract.status)
                                ? 'Delivered on ' + formatDate(contract.progressUpdates.find(p => p.updateType === 'shipping')?.updatedAt || contract.updatedAt)
                                : 'Planned after harvest'}
                          </p>
                        </div>
                      </div>

                      {/* Final Payment - Only if finalPercentage > 0 */}
                      {(contract.paymentTerms?.finalPercentage || 30) > 0 && (
                        <div className="relative">
                          <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                            ${contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.FINAL
                              ? 'border-amber-500 bg-amber-100' 
                              : isPaymentCompleted(contract, PAYMENT_STAGE.FINAL)
                                ? 'border-green-600 bg-white'
                                : 'border-gray-300 bg-gray-100'}`}>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <FaMoneyBillWave className="mr-1 text-green-600" />
                              Final Payment ({contract.paymentTerms?.finalPercentage || 30}%)
                            </h4>
                            <p className="text-sm text-gray-600">
                              {isPaymentCompleted(contract, PAYMENT_STAGE.FINAL)
                                ? `Completed on ${formatDate(getPaymentDate(contract, PAYMENT_STAGE.FINAL))}`
                                : contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.FINAL
                                  ? contract.paymentSubmitted 
                                    ? 'Payment notification sent, awaiting verification'
                                    : 'Waiting for buyer to complete final payment'
                                  : contract.status === 'completed'
                                    ? 'Completed'
                                    : 'Due after delivery'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Contract Completion */}
                      <div className="relative">
                        <div className={`absolute -left-8 mt-1.5 w-5 h-5 rounded-full border-2 
                          ${contract.status === 'completed'
                            ? 'border-green-600 bg-white' 
                            : 'border-gray-300 bg-gray-100'}`}>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 flex items-center">
                            <FaCheckCircle className="mr-1 text-green-600" />
                            Contract Completion
                          </h4>
                          <p className="text-sm text-gray-600">
                            {contract.status === 'completed'
                              ? `Completed on ${formatDate(contract.updatedAt)}`
                              : 'Pending completion of all stages'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Next Actions Card - Overview Tab */}
            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaClipboardList className="mr-2 text-blue-600" /> Next Actions
                </h3>
                
                <div className="space-y-3">
                  {contract.status === 'pending' && (
                    <>
                      <p className="text-gray-700">This contract request is awaiting your response.</p>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        {user.role === (contract.buyerId === user._id ? 'buyer' : 'farmer') && (
                          <>
                            <button 
                              onClick={handleAcceptContract} 
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                            >
                              <FaCheck className="mr-2" /> Accept Contract
                            </button>
                            
                            <button 
                              onClick={handleRejectContract} 
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                            >
                              <FaTimes className="mr-2" /> Reject Contract
                            </button>
                            
                            <button 
                              onClick={() => navigate(`/chat/${contract.chatId}`)} 
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            >
                              <FaCommentDots className="mr-2" /> Open Chat
                            </button>
                          </>
                    )}
              </div>
                    </>
                  )}
                  
                  {contract.status === 'negotiating' && (
                    <>
                      <p className="text-gray-700">This contract is in negotiation. Use the chat to discuss terms with the {user.role === 'farmer' ? 'buyer' : 'farmer'}.</p>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        {canAcceptContract(contract, isFarmer) && (
                          <button 
                            onClick={handleAcceptContract} 
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                          >
                            <FaCheck className="mr-2" /> Accept Contract
                          </button>
                        )}
                        
                        <button 
                          onClick={() => navigate(`/chat/${contract.chatId}`)} 
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        >
                          <FaCommentDots className="mr-2" /> Open Chat
                        </button>
            </div>
                    </>
                  )}
          </div>
              </div>
            )}
            
            {/* Next Actions Card - Role & Status-specific */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 print:hidden">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">
                Next Steps
          </h3>
          
          <div className="space-y-4">
                {/* Status-specific guidance */}
                {contract.status === 'requested' && (
            <div className="flex items-start">
                    <FaClipboardList className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
              <div>
                      <p className="text-gray-800 mb-2">You've received a contract request from {contract.buyer?.Name}. Review the terms and decide whether to accept or decline.</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {canAcceptContract(contract, isFarmer) && (
                          <button 
                            onClick={handleAcceptContract}
                            disabled={cancelLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                          >
                            {cancelLoading ? 'Processing...' : <><FaCheck className="mr-1" /> Accept Contract</>}
                          </button>
                        )}
                        <button 
                          onClick={handleOpenChat}
                          disabled={cancelLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                          <FaCommentDots className="mr-1" /> Open Chat
                        </button>
                        <button 
                          onClick={handleRejectContract}
                          disabled={cancelLoading}
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
                        >
                          <FaTimes className="mr-1" /> Decline
                        </button>
              </div>
            </div>
          </div>
                )}

                {contract.status === 'negotiating' && (
            <div className="flex items-start">
                    <FaHandshake className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
              <div>
                      <p className="text-gray-800 mb-2">This contract is under negotiation. Review the latest terms and respond.</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button 
                          onClick={() => setActiveTab('negotiations')}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                          <FaHistory className="mr-1" /> View Negotiation History
                        </button>
                        <button 
                          onClick={handleOpenChat}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                          <FaCommentDots className="mr-1" /> Open Chat
                        </button>
                        {canAcceptContract(contract, isFarmer) && (
                          <button 
                            onClick={handleAcceptContract}
                            disabled={cancelLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                          >
                            {cancelLoading ? 'Processing...' : <><FaCheck className="mr-1" /> Accept Terms</>}
                          </button>
                        )}
              </div>
            </div>
          </div>
                )}

                {contract.status === 'payment_pending' && (
            <div className="flex items-start">
                    <FaMoneyBillWave className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
              <div>
                      {isBuyer && (
                        <>
                          <p className="text-gray-800 mb-2">
                            {contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE 
                              ? "Contract terms accepted! Please complete the advance payment to activate the contract."
                              : contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM
                                ? "The crop has been harvested. Please complete the midterm payment as per agreement."
                                : contract.currentPaymentStage === PAYMENT_STAGE.FINAL
                                  ? "The crop has been delivered. Please verify delivery and complete the final payment."
                                  : "Payment is required to proceed with the contract."}
                            {contract.paymentSubmitted 
                              ? " Your payment notification has been sent. Waiting for farmer to verify receipt."
                              : ""}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button 
                              onClick={() => {
                                if (window.confirm(`Confirm payment of ${formatCurrency(contract.currentPaymentAmount || 
                                  ((contract.totalAmount * (contract.currentPaymentPercentage || 
                                    (contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? contract.paymentTerms?.advancePercentage || 20 :
                                     contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? contract.paymentTerms?.midtermPercentage || 50 :
                                     contract.paymentTerms?.finalPercentage || 30)) / 100).toFixed(2))
                                )}? This will automatically complete this stage.`)) {
                                  handleConfirmPayment();
                                }
                              }}
                              disabled={cancelLoading}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                            >
                              <FaMoneyBillWave className="mr-1" /> Complete Payment
                            </button>
                            <button 
                              onClick={handleOpenChat}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                            >
                              <FaCommentDots className="mr-1" /> Open Chat
                            </button>
              </div>
                        </>
                      )}
                      
                      {isFarmer && (
                        <>
                          <p className="text-gray-800 mb-2">
                            {contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE 
                              ? "Waiting for buyer to complete advance payment."
                              : contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM
                                ? "The crop has been harvested. Waiting for buyer to complete midterm payment."
                                : contract.currentPaymentStage === PAYMENT_STAGE.FINAL
                                  ? "The crop has been delivered. Waiting for buyer to complete final payment."
                                  : "Waiting for buyer to complete payment."}
                            {contract.paymentSubmitted 
                              ? " The buyer has confirmed payment. Please verify that you've received it."
                              : " If you have already received the payment, you can manually verify below."}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button 
                              onClick={handleVerifyPayment}
                              disabled={cancelLoading}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                            >
                              <FaCheckCircle className="mr-1" /> Verify Payment Received
                            </button>
                            <button 
                              onClick={handleOpenChat}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                            >
                              <FaCommentDots className="mr-1" /> Open Chat
                            </button>
            </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {contract.status === 'delivered' && (
            <div className="flex items-start">
                    <FaShippingFast className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
              <div>
                      <p className="text-gray-800 mb-2">The crop has been delivered. Please complete the contract once payment is finalized.</p>
                      {!isFarmer && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button 
                            onClick={handleMarkAsCompleted}
                            disabled={cancelLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                          >
                            <FaCheck className="mr-1" /> Mark as Completed
                          </button>
              </div>
                )}
            </div>
          </div>
                )}

                {contract.status === 'completed' && (
            <div className="flex items-start">
                    <FaCheck className="text-green-600 mt-1 mr-2 flex-shrink-0" />
              <div>
                      <p className="text-gray-800 mb-2">This contract has been successfully completed. Thank you for using AgroLink!</p>
                      <button 
                        onClick={() => navigate('/contracts/new')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mt-2"
                      >
                        <FaFileContract className="mr-1" /> Create New Contract
                      </button>
              </div>
            </div>
                )}

                {(contract.status === 'cancelled' || contract.status === 'rejected') && (
            <div className="flex items-start">
                    <FaTimes className="text-red-600 mt-1 mr-2 flex-shrink-0" />
              <div>
                      <p className="text-gray-800 mb-2">This contract has been {contract.status}. No further actions are available.</p>
                      <button 
                        onClick={() => navigate('/contracts/new')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center mt-2"
                      >
                        <FaFileContract className="mr-1" /> Create New Contract
                      </button>
          </div>
      </div>
                )}
          </div>
            </div>
          </div>
        )}

        {/* Contract Terms Tab */}
        {activeTab === 'terms' && (
            <div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gray-100 p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaFileContract className="mr-2 text-green-600" /> Detailed Contract Terms
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  These are the finalized terms that were agreed upon by both parties.
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {/* Main Contract Details */}
                <div className="p-5">
                  <h4 className="font-medium text-gray-800 mb-3">Product & Quantity</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Product:</span>
                      <span className="font-medium text-gray-800">{cropDetails?.name || contract.crop?.name || 'Not specified'}</span>
            </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <span className="font-medium text-gray-800">{contract.quantity} {contract.unit}</span>
          </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Price Per Unit:</span>
                      <span className="font-medium text-gray-800">{formatCurrency(contract.pricePerUnit)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Total Amount:</span>
                      <span className="font-medium text-gray-800">{formatCurrency(contract.totalAmount)}</span>
                    </div>
            </div>
          </div>

                {/* Delivery & Timeline */}
                <div className="p-5">
                  <h4 className="font-medium text-gray-800 mb-3">Timeline & Delivery</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Request Date:</span>
                      <span className="font-medium text-gray-800">{formatDate(contract.createdAt || contract.requestDate)}</span>
              </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Expected Harvest Date:</span>
                      <span className="font-medium text-gray-800">{formatDate(contract.expectedHarvestDate)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Delivery Date:</span>
                      <span className="font-medium text-gray-800">{formatDate(contract.deliveryDate)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Contract Status:</span>
                      <span className="font-medium text-gray-800 capitalize">{contract.status.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Quality Requirements */}
                <div className="p-5">
                  <h4 className="font-medium text-gray-800 mb-3">Quality Requirements</h4>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {contract.qualityRequirements || 'No specific quality requirements provided.'}
                    </p>
                  </div>
      </div>

      {/* Special Requirements */}
      {contract.specialRequirements && (
                  <div className="p-5">
                    <h4 className="font-medium text-gray-800 mb-3">Special Requirements</h4>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {contract.specialRequirements}
                      </p>
          </div>
                  </div>
                )}
                
                {/* Payment Terms */}
                <div className="p-5">
                  <h4 className="font-medium text-gray-800 mb-3">Payment Terms</h4>
                  {contract.paymentTerms ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Advance Payment</h5>
                        <p className="text-xl font-semibold text-green-600">{contract.paymentTerms.advancePercentage || 0}%</p>
                        <p className="text-sm text-gray-600 mt-1">Upon contract acceptance</p>
              </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Midterm Payment</h5>
                        <p className="text-xl font-semibold text-green-600">{contract.paymentTerms.midtermPercentage || 0}%</p>
                        <p className="text-sm text-gray-600 mt-1">Upon harvest</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Final Payment</h5>
                        <p className="text-xl font-semibold text-green-600">{contract.paymentTerms.finalPercentage || 0}%</p>
                        <p className="text-sm text-gray-600 mt-1">Upon delivery</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-gray-800">
                        Standard payment terms apply:
                      </p>
                      <ul className="list-disc pl-5 mt-2 text-gray-600">
                        <li>20% advance payment upon contract acceptance</li>
                        <li>50% midterm payment upon harvest</li>
                        <li>30% final payment upon delivery</li>
                      </ul>
            </div>
          )}
                </div>
            </div>
          </div>

            {/* Contract Document (if available) */}
            {contract.contractDocument && contract.contractDocument.url && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaFileContract className="mr-2 text-green-600" /> Contract Document
                </h3>
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">
                    Official contract document is available for download.
                  </p>
                  <a 
                    href={contract.contractDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  >
                    <FaDownload className="mr-2" /> Download Document
                  </a>
            </div>
              </div>
            )}
          </div>
        )}
        
        {/* Negotiations Tab */}
        {activeTab === 'negotiations' && (
            <div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gray-100 p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaHistory className="mr-2 text-blue-600" /> Negotiation History
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {contract.negotiationHistory && contract.negotiationHistory.length > 0 
                    ? `${contract.negotiationHistory.length} round${contract.negotiationHistory.length === 1 ? '' : 's'} of negotiation`
                    : 'No negotiations yet'}
              </p>
            </div>
              
              {(!contract.negotiationHistory || contract.negotiationHistory.length === 0) ? (
                <div className="p-6 text-center text-gray-500">
                  <FaCommentSlash className="mx-auto mb-2 text-gray-400 text-2xl" />
                  <p>No negotiation history available for this contract.</p>
            </div>
              ) : (
                <div className="p-4">
                  {/* Negotiation Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Total Rounds</h4>
                      <p className="text-2xl font-bold text-gray-800">{contract.negotiationHistory.length}</p>
          </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Farmer Proposals</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {contract.negotiationHistory.filter(entry => {
                          const proposedById = typeof entry.proposedBy === 'object' ? 
                            entry.proposedBy?._id : entry.proposedBy?.toString();
                          const farmerId = typeof contract.farmer === 'object' ? 
                            contract.farmer._id : contract.farmer?.toString();
                          return proposedById === farmerId;
                        }).length}
                      </p>
              </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Buyer Proposals</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {contract.negotiationHistory.filter(entry => {
                          const proposedById = typeof entry.proposedBy === 'object' ? 
                            entry.proposedBy?._id : entry.proposedBy?.toString();
                          const farmerId = typeof contract.farmer === 'object' ? 
                            contract.farmer._id : contract.farmer?.toString();
                          return proposedById !== farmerId;
                        }).length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timeline of Negotiations */}
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
                      
                      // Get name
                      const proposerName = proposedByFarmer 
                        ? (typeof contract.farmer === 'object' ? contract.farmer.Name : 'Farmer')
                        : (typeof contract.buyer === 'object' ? contract.buyer.Name : 'Buyer');
                      
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
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200';
                      
                      const headerBgColor = proposedByFarmer
                        ? 'bg-green-100'
                        : 'bg-blue-100';
                        
                      const iconBgColor = proposedByFarmer
                        ? 'bg-green-600'
                        : 'bg-blue-600';
                      
                      return (
                        <div key={index} className={`border rounded-lg ${bgColor} overflow-hidden`}>
                          <div className={`px-4 py-3 ${headerBgColor} flex justify-between items-center`}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full overflow-hidden ${iconBgColor} text-white flex items-center justify-center`}>
                                {proposedByFarmer ? <FaTractor /> : <FaUserTie />}
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
                            <div className="text-sm text-gray-600">{formattedDate}</div>
                          </div>
                          
                          <div className="p-4">
                            {entry.message && (
                              <div className="mb-3 text-gray-700">
                                <p className="whitespace-pre-wrap">"{entry.message}"</p>
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Negotiation Actions */}
            {(contract.status === 'requested' || contract.status === 'negotiating') && (
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 mt-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">Negotiation Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleOpenChat}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  >
                    <FaCommentDots className="mr-2" /> Open Chat
                  </button>
                  
                  {canAcceptContract(contract, isFarmer) && (
                    <button 
                      onClick={handleAcceptContract}
                      disabled={cancelLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      <FaCheck className="mr-2" /> Accept Contract
                    </button>
                  )}
              </div>
              </div>
            )}
            
            {/* Negotiation Actions */}
            {['negotiating', 'payment_pending'].includes(contract.status) && (
              <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6">
                <h4 className="font-medium text-gray-800 mb-4">Actions</h4>
                
                {contract.status === 'negotiating' && (
                  <div className="space-y-3">
                    {canAcceptContract(contract, isFarmer) && (
                      <button
                        onClick={handleAcceptContract}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                      >
                        <FaCheck className="mr-2" /> Accept Current Terms
                      </button>
                    )}
                    
                    <button
                      onClick={handleOpenChat}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                    >
                      <FaCommentDots className="mr-2" /> Open Chat for Negotiation
                    </button>
                    
                    <button
                      onClick={handleRejectContract}
                      className="w-full px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 flex items-center justify-center"
                    >
                      <FaTimes className="mr-2" /> Reject Contract
                    </button>
                  </div>
                )}
                
                {contract.status === 'payment_pending' && (
                  <div className="space-y-3">
                    {isBuyer && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Have you completed the ${contract.currentPaymentStage || PAYMENT_STAGE.ADVANCE} payment? Click Yes to confirm.`)) {
                            handleConfirmPayment();
                          }
                        }}
                        disabled={contract.paymentSubmitted}
                        className={`w-full px-4 py-2 rounded flex items-center justify-center ${
                          contract.paymentSubmitted 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {contract.paymentSubmitted ? (
                          <>
                            <FaCheck className="mr-2" /> Payment Notification Sent
                          </>
                        ) : (
                          <>
                            <FaMoneyBillWave className="mr-2" /> Proceed to Payment
                          </>
                        )}
                      </button>
                    )}
                    
                    {isFarmer && (
                      <button
                        onClick={handleVerifyPayment}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                      >
                        <FaCheckCircle className="mr-2" /> Verify Payment Received
                      </button>
                    )}
                    
                    <button
                      onClick={handleOpenChat}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                    >
                      <FaCommentDots className="mr-2" /> Open Chat
                    </button>
              </div>
                )}
            </div>
          )}
        </div>
          )}
        </div>

      {/* Next Actions section for status-specific transitions */}
      {(['active', 'harvested'].includes(contract.status) || 
        (contract.status === 'payment_pending' && 
         [PAYMENT_STAGE.MIDTERM, PAYMENT_STAGE.FINAL].includes(contract.currentPaymentStage))) && (
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 print:hidden mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Current Stage Updates</h3>
          
          <div className="space-y-4">
            {/* For active contracts, show growing phase info */}
            {contract.status === 'active' && (
              <div className="flex items-start">
                <FaLeaf className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-800 mb-2">
                    <span className="font-medium">Growing Phase:</span> The contract is active and the crop is being cultivated. 
                    {isFarmer ? ' When the crop is ready for harvest, use the button to update the status.' : ' The farmer will update the status when the crop is ready for harvest.'}
                  </p>
                  {isFarmer && (
                    <button 
                      onClick={handleMarkAsHarvested}
                      disabled={cancelLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mt-2"
                    >
                      <FaTractor className="mr-2" /> Mark as Harvested
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* For payment_pending with midterm stage */}
            {contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM && (
              <div className="flex items-start">
                <FaMoneyBillWave className="text-amber-600 mt-1 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-800 mb-2">
                    <span className="font-medium">Midterm Payment Required:</span> 
                    {isBuyer 
                      ? ' The crop has been harvested. Please complete the midterm payment to proceed to delivery.' 
                      : ' The crop has been harvested. Waiting for the buyer to complete the midterm payment.'}
                  </p>
                  {isBuyer && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Complete midterm payment of ${formatCurrency((contract.totalAmount * (contract.paymentTerms?.midtermPercentage || 50) / 100).toFixed(2))}?`)) {
                          handleConfirmPayment();
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mt-2"
                    >
                      <FaMoneyBillWave className="mr-2" /> Complete Midterm Payment
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* For harvested contracts with completed midterm payment */}
            {contract.status === 'harvested' && !['payment_pending'].includes(contract.status) && (
              <div className="flex items-start">
                {!isPaymentCompleted(contract, PAYMENT_STAGE.MIDTERM) ? (
                  <>
                    <FaMoneyBillWave className="text-amber-600 mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-gray-800 mb-2">
                        <span className="font-medium">Harvest Complete:</span> 
                        {isBuyer 
                          ? ' The crop has been harvested. Midterm payment required before delivery.' 
                          : ' The crop has been harvested. Waiting for the buyer to complete the midterm payment before delivery.'}
                      </p>
                      {isBuyer && (
                        <button 
                          onClick={() => {
                            if (window.confirm(`Complete midterm payment of ${formatCurrency((contract.totalAmount * (contract.paymentTerms?.midtermPercentage || 50) / 100).toFixed(2))}?`)) {
                              // First set the correct payment stage
                              setContract(prevContract => ({
                                ...prevContract,
                                currentPaymentStage: PAYMENT_STAGE.MIDTERM
                              }));
                              // Then update status to payment_pending
                              updateContractStatus('payment_pending').then(() => {
                                setContract(prevContract => ({
                                  ...prevContract,
                                  status: 'payment_pending'
                                }));
                                // Finally handle payment after a short delay to ensure state updates
                                setTimeout(() => {
                                  handleConfirmPayment();
                                }, 500);
                              });
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mt-2"
                        >
                          <FaMoneyBillWave className="mr-2" /> Complete Midterm Payment
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <FaShippingFast className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-gray-800 mb-2">
                        <span className="font-medium">Ready for Delivery:</span> 
                        {isFarmer
                          ? ' Midterm payment has been received. The crop is ready to be delivered to the buyer.'
                          : ' Midterm payment is complete. Waiting for the farmer to arrange delivery.'}
                      </p>
                      {isFarmer && (
                        <button 
                          onClick={handleMarkAsDelivered}
                          disabled={cancelLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center mt-2"
                        >
                          <FaShippingFast className="mr-2" /> Mark as Out for Delivery
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* For final payment stage */}
            {contract.status === 'payment_pending' && contract.currentPaymentStage === PAYMENT_STAGE.FINAL && (
              <div className="flex items-start">
                <FaExclamationTriangle className="text-amber-600 mt-1 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-800 mb-2">
                    <span className="font-medium">Delivery Complete:</span> 
                    {isBuyer 
                      ? ' The farmer has marked the crop as delivered. Please verify you have received the delivery before completing the final payment.'
                      : ' The crop has been delivered. Waiting for the buyer to complete the final payment.'}
                  </p>
                  {isBuyer && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Complete final payment of ${formatCurrency((contract.totalAmount * (contract.paymentTerms?.finalPercentage || 30) / 100).toFixed(2))}?`)) {
                          handleConfirmPayment();
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center mt-2"
                    >
                      <FaMoneyBillWave className="mr-2" /> Complete Final Payment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Action Footer */}
      <div className="mt-8 border-t border-gray-200 pt-4 pb-4 print:hidden">
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/contracts')}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Back to Contracts
            </button>
            
          <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 flex items-center"
            >
              <FaPrint className="mr-2" /> Print Contract
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {contract.status === 'negotiating' && (
              <button
                onClick={handleOpenChat}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <FaCommentDots className="mr-2" /> Open Chat
              </button>
            )}
            
            {/* Payment Pending Actions */}
            {contract.status === 'payment_pending' && isBuyer && (
              <button
                onClick={() => {
                  if (window.confirm(`Confirm payment of ${formatCurrency(contract.currentPaymentAmount || 
                    ((contract.totalAmount * (contract.currentPaymentPercentage || 
                      (contract.currentPaymentStage === PAYMENT_STAGE.ADVANCE ? contract.paymentTerms?.advancePercentage || 20 :
                       contract.currentPaymentStage === PAYMENT_STAGE.MIDTERM ? contract.paymentTerms?.midtermPercentage || 50 :
                       contract.paymentTerms?.finalPercentage || 30)) / 100).toFixed(2))
                  )}? This will automatically complete this stage.`)) {
                    handleConfirmPayment();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
              >
                <FaMoneyBillWave className="mr-2" /> Complete Payment
              </button>
            )}
            
            {contract.status === 'payment_pending' && isFarmer && (
            <button
                onClick={handleVerifyPayment}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
                <FaCheckCircle className="mr-2" /> Verify Payment Received
            </button>
            )}
            
            {contract.status === 'payment_pending' && (
            <button
                onClick={handleOpenChat}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
                <FaCommentDots className="mr-2" /> Open Chat
            </button>
            )}
            
            {isFarmer && contract.status === 'requested' && (
              <>
                <button
                  onClick={handleAcceptContract}
                  disabled={cancelLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                >
                  <FaCheck className="mr-2" /> Accept Contract
                </button>
                <button
                  onClick={handleRejectContract}
                  disabled={cancelLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                >
                  <FaTimes className="mr-2" /> Reject Contract
                </button>
              </>
            )}
            
            {contract.status === 'accepted' && isFarmer && (
              <button
                onClick={handleMarkAsHarvested}
                disabled={cancelLoading}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center"
              >
                <FaTractor className="mr-2" /> Mark as Harvested
          </button>
        )}
        
            {contract.status === 'harvested' && isFarmer && (
            <button
                onClick={handleMarkAsDelivered}
                disabled={cancelLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <FaShippingFast className="mr-2" /> Mark as Delivered
            </button>
            )}
            
            {contract.status === 'delivered' && !isFarmer && (
            <button
                onClick={handleMarkAsCompleted}
                disabled={cancelLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
              >
                <FaCheck className="mr-2" /> Complete Contract
            </button>
            )}
            
            {['requested', 'negotiating'].includes(contract.status) && (
              <button
                onClick={handleCancelContract}
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
              >
                <FaTimes className="mr-2" /> Cancel Contract
              </button>
        )}
      </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;
