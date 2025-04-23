import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaKey, FaArrowLeft } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { setUser, setAuthenticated, clearSignupData } from '../../reducer/Slice/authSlice';
import authService from '../../services/auth/authService';
import { ROUTES } from '../../config/constants';
import logo from '../../assets/Logo.png';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { signupData } = useSelector((state) => state.auth);
  const email = signupData?.email || '';
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  
  // Pre-validate user data when component loads
  useEffect(() => {
    if (!email) {
      navigate(ROUTES.REGISTER);
      toast.error('Please sign up first');
      return;
    }
    
    // Validate bank details for farmers
    if (signupData?.role === 'farmer' || signupData?.accountType === 'farmer') {
      const hasUpi = !!signupData.upiId;
      const hasBankAccount = !!(signupData.accountNumber && signupData.ifscCode);
      
      if (!hasUpi && !hasBankAccount) {
        navigate(ROUTES.REGISTER);
        toast.error('Missing bank details. Please provide UPI ID or bank account information.');
      }
    }
  }, [email, navigate, signupData]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Validate required data before proceeding
      if (!signupData) {
        setError('Registration data is missing. Please return to the signup page.');
        return;
      }
      
      // Final check for bank details for farmers
      if (signupData.role === 'farmer' || signupData.accountType === 'farmer') {
        const hasUpi = !!signupData.upiId;
        const hasBankAccount = !!(signupData.accountNumber && signupData.ifscCode);
        
        if (!hasUpi && !hasBankAccount) {
          setError('Missing bank details. Please return to signup and provide the required information.');
          setIsLoading(false);
          return;
        }
      }
      
      console.log('Submitting OTP verification with:', { 
        email, 
        otp, 
        hasFarmDetails: !!signupData.farmLocation,
        hasUpi: !!signupData.upiId, 
        hasAccountNumber: !!signupData.accountNumber,
        role: signupData.role || signupData.accountType
      });
      
      const result = await authService.verifyOTP({
        email: email,
        otp: otp,
        userData: signupData
      });
      
      console.log('OTP verification result:', result);
      
      if (result.success) {
        // Show success message
        toast.success('Registration successful');
        
        // Clear signup data
        dispatch(clearSignupData());
        
        // Redirect to login page
        console.log('Redirecting to login page');
        navigate(ROUTES.LOGIN);
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'An error occurred during verification');
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (!email) {
      toast.error('Email address is missing');
      return;
    }
    
    setIsResending(true);
    
    try {
      const result = await authService.resendOTP({ email });
      
      if (result.success) {
        toast.success('OTP resent successfully');
        setResendDisabled(true);
        
        setTimeout(() => {
          setResendDisabled(false);
        }, 60000);
      } else {
        toast.error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Navigation Header */}
      <div className="absolute top-0 left-0 w-full p-3 bg-white shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="AgriLink Logo" className="h-8 w-auto" />
          </Link>
          <div className="flex space-x-4">
            <Link to={ROUTES.LOGIN} className="text-green-600 hover:text-green-800 font-medium">
              Login
            </Link>
            <Link to={ROUTES.REGISTER} className="text-green-600 hover:text-green-800 font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the OTP sent to {email || 'your email'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaKey className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter verification code"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm">
              <Link to={ROUTES.REGISTER} className="font-medium text-green-600 hover:text-green-500">
                <FaArrowLeft className="inline mr-1" /> Back to registration
              </Link>
            </div>
            <div className="text-sm">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending || resendDisabled}
                className="font-medium text-green-600 hover:text-green-500"
              >
                {isResending ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP; 