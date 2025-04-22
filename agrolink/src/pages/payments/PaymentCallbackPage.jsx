import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PaymentCallbackPage = () => {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get payment data from query params or local storage
    const queryParams = new URLSearchParams(location.search);
    const paymentId = queryParams.get('paymentId');
    const paymentRequestId = queryParams.get('payment_request_id');
    const paymentStatus = queryParams.get('payment_status');
    
    console.log('Payment callback received:', { 
      paymentId, 
      paymentRequestId, 
      paymentStatus,
      searchParams: location.search
    });
    
    const pendingPaymentData = localStorage.getItem('pendingPayment');
    let paymentData = null;
    
    if (pendingPaymentData) {
      try {
        paymentData = JSON.parse(pendingPaymentData);
        console.log('Found pending payment data:', paymentData);
      } catch (error) {
        console.error('Failed to parse pending payment data:', error);
      }
    }
    
    // If no payment data found, redirect to dashboard
    if (!paymentId && !paymentData?.paymentId) {
      toast.error('No payment information found');
      navigate('/dashboard');
      return;
    }
    
    // Verify payment
    const verifyPayment = async () => {
      try {
        const idToVerify = paymentId || paymentData?.paymentId;
        console.log('Verifying payment with ID:', idToVerify);
        
        // For Instamojo, pass both payment_id and payment_request_id if available
        const verifyParams = { paymentRequestId };
        
        const response = await paymentService.verifyPayment(idToVerify, verifyParams);
        
        if (response.success) {
          const paymentStatus = response.payment.status;
          setPaymentDetails(response.payment);
          
          if (paymentStatus === 'completed') {
            setSuccess(true);
            toast.success('Payment completed successfully!');
            
            // Clear pending payment data
            localStorage.removeItem('pendingPayment');
            
            // Redirect to contract page after 5 seconds
            setTimeout(() => {
              const contractId = paymentData?.contractId;
              if (contractId) {
                navigate(`/contracts/${contractId}`);
              } else {
                navigate('/dashboard');
              }
            }, 5000);
          } else if (paymentStatus === 'failed') {
            setSuccess(false);
            toast.error('Payment failed. Please try again.');
            
            // Redirect to contract page after 5 seconds
            setTimeout(() => {
              const contractId = paymentData?.contractId;
              if (contractId) {
                navigate(`/contracts/${contractId}`);
              } else {
                navigate('/dashboard');
              }
            }, 5000);
          } else {
            // For any other status, show appropriate message
            setSuccess(false);
            toast.error(`Payment status: ${paymentStatus}. Please contact support if you were charged.`);
            
            // Redirect to contract page after 5 seconds
            setTimeout(() => {
              const contractId = paymentData?.contractId;
              if (contractId) {
                navigate(`/contracts/${contractId}`);
              } else {
                navigate('/dashboard');
              }
            }, 5000);
          }
        } else {
          setSuccess(false);
          toast.error('Failed to verify payment. Please contact support if you were charged.');
          
          // Redirect to contract page after 5 seconds
          setTimeout(() => {
            const contractId = paymentData?.contractId;
            if (contractId) {
              navigate(`/contracts/${contractId}`);
            } else {
              navigate('/dashboard');
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setSuccess(false);
        toast.error('Failed to verify payment. Please contact support if you were charged.');
        
        // Redirect to contract page after 5 seconds
        setTimeout(() => {
          const contractId = paymentData?.contractId;
          if (contractId) {
            navigate(`/contracts/${contractId}`);
          } else {
            navigate('/dashboard');
          }
        }, 5000);
      } finally {
        setVerifying(false);
      }
    };
    
    verifyPayment();
  }, [location.search, navigate]);
  
  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {verifying ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Verifying Payment</h1>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
            <div className="flex justify-center">
              <LoadingSpinner message="Verifying payment..." />
            </div>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Payment Successful!</h1>
            
            {paymentDetails && (
              <div className="mt-4 text-left bg-green-50 p-4 rounded-lg">
                <h2 className="font-semibold text-lg mb-2 text-green-800">Payment Details</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Payment ID:</span> {paymentDetails.id}</p>
                  <p><span className="font-medium">Amount:</span> {formatCurrency(paymentDetails.amount)}</p>
                  <p><span className="font-medium">Stage:</span> {paymentDetails.stage}</p>
                  <p><span className="font-medium">Status:</span> <span className="text-green-600 font-semibold">{paymentDetails.status}</span></p>
                  <p><span className="font-medium">Date:</span> {formatDate(new Date())}</p>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mt-4">Your payment has been processed successfully.</p>
            <p className="text-gray-500 text-sm mt-2">You will be redirected back to the contract page shortly...</p>
            <button 
              onClick={() => {
                try {
                  const contractId = JSON.parse(localStorage.getItem('pendingPayment'))?.contractId;
                  if (contractId) {
                    navigate(`/contracts/${contractId}`);
                  } else {
                    navigate('/dashboard');
                  }
                } catch (e) {
                  navigate('/dashboard');
                }
              }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Return to Contract
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Payment Failed</h1>
            
            {paymentDetails && (
              <div className="mt-4 text-left bg-red-50 p-4 rounded-lg">
                <h2 className="font-semibold text-lg mb-2 text-red-800">Payment Details</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Payment ID:</span> {paymentDetails.id}</p>
                  <p><span className="font-medium">Amount:</span> {formatCurrency(paymentDetails.amount)}</p>
                  <p><span className="font-medium">Stage:</span> {paymentDetails.stage}</p>
                  <p><span className="font-medium">Status:</span> <span className="text-red-600 font-semibold">{paymentDetails.status}</span></p>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mt-4">We couldn't process your payment. Please try again.</p>
            <p className="text-gray-500 text-sm mt-2">You will be redirected back to the contract page shortly...</p>
            <button 
              onClick={() => {
                try {
                  const contractId = JSON.parse(localStorage.getItem('pendingPayment'))?.contractId;
                  if (contractId) {
                    navigate(`/contracts/${contractId}`);
                  } else {
                    navigate('/dashboard');
                  }
                } catch (e) {
                  navigate('/dashboard');
                }
              }}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Return to Contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage; 