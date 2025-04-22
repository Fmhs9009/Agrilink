import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const MockPaymentPage = () => {
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    purpose: '',
    paymentRequestId: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get payment details from URL
    const params = new URLSearchParams(location.search);
    const amount = params.get('amount') || '';
    const purpose = params.get('purpose') || '';
    const paymentRequestId = params.get('payment_request_id') || '';

    if (!amount || !purpose || !paymentRequestId) {
      toast.error('Invalid payment information');
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    setPaymentDetails({
      amount,
      purpose,
      paymentRequestId
    });
  }, [location.search, navigate]);

  const handlePaymentSuccess = () => {
    setLoading(true);
    // Generate a mock payment ID
    const paymentId = `mock_payment_${Math.random().toString(36).substring(2, 15)}`;
    
    // Redirect to callback URL with success parameters
    const pendingPayment = localStorage.getItem('pendingPayment');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        const paymentId = paymentData.paymentId;
        
        setTimeout(() => {
          navigate(`/payment/callback?paymentId=${paymentId}&payment_request_id=${paymentDetails.paymentRequestId}&payment_status=Credit`);
        }, 2000);
      } catch (error) {
        console.error('Failed to parse pending payment data:', error);
        navigate(`/payment/callback?paymentId=${paymentId}&payment_request_id=${paymentDetails.paymentRequestId}&payment_status=Credit`);
      }
    } else {
      setTimeout(() => {
        navigate(`/payment/callback?paymentId=${paymentId}&payment_request_id=${paymentDetails.paymentRequestId}&payment_status=Credit`);
      }, 2000);
    }
  };

  const handlePaymentFailure = () => {
    setLoading(true);
    // Generate a mock payment ID
    const paymentId = `mock_payment_${Math.random().toString(36).substring(2, 15)}`;
    
    // Redirect to callback URL with failure parameters
    const pendingPayment = localStorage.getItem('pendingPayment');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        const paymentId = paymentData.paymentId;
        
        setTimeout(() => {
          navigate(`/payment/callback?paymentId=${paymentId}&payment_request_id=${paymentDetails.paymentRequestId}&payment_status=Failed`);
        }, 2000);
      } catch (error) {
        console.error('Failed to parse pending payment data:', error);
        navigate(`/payment/callback?paymentId=${paymentId}&payment_request_id=${paymentDetails.paymentRequestId}&payment_status=Failed`);
      }
    } else {
      setTimeout(() => {
        navigate(`/payment/callback?paymentId=${paymentId}&payment_request_id=${paymentDetails.paymentRequestId}&payment_status=Failed`);
      }, 2000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-green-500 p-4">
          <h1 className="text-white text-2xl font-bold text-center">Mock Payment Gateway</h1>
          <p className="text-green-100 text-center">(Development Environment Only)</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{paymentDetails.purpose}</h2>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(paymentDetails.amount)}</p>
            <p className="text-sm text-gray-500 mt-1">Payment ID: {paymentDetails.paymentRequestId}</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Payment Methods</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded p-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-sm">Credit Card</span>
                </div>
                <div className="border border-gray-200 rounded p-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm">UPI</span>
                </div>
                <div className="border border-gray-200 rounded p-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Net Banking</span>
                </div>
                <div className="border border-gray-200 rounded p-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Wallet</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePaymentSuccess}
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors"
              >
                {loading ? 'Processing...' : 'Complete Payment (Success)'}
              </button>
              
              <button
                onClick={handlePaymentFailure}
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-colors"
              >
                {loading ? 'Processing...' : 'Fail Payment (Test Failure)'}
              </button>
              
              <button
                onClick={() => navigate(-1)}
                disabled={loading}
                className="w-full py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-colors"
              >
                Cancel Payment
              </button>
            </div>
            
            <div className="text-xs text-gray-500 text-center mt-4">
              <p>This is a mock payment gateway for development only.</p>
              <p>No actual transactions will be processed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockPaymentPage; 