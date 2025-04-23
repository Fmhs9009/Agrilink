import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaPhone, FaMapMarkerAlt, FaUniversity, FaQrcode } from 'react-icons/fa';
import { setSignupData } from '../../reducer/Slice/authSlice';
import authService from '../../services/auth/authService';
import { ROLES, ROUTES, INDIAN_STATES } from '../../config/constants';
import logo from '../../assets/Logo.png';

const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer', // Default role
    address: '',
    city: '',
    state: '',
    pincode: '',
    agreeToTerms: false,
    farmName: '', // Add farmName field
    farmLocation: '', // Add farmLocation field
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // For IFSC code, convert to uppercase immediately
    if (name === 'ifscCode') {
      setFormData({
        ...formData,
        [name]: value.toUpperCase()
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add a function to check if bank details are valid
  const areBankDetailsValid = () => {
    if (formData.role !== 'farmer') return true;
    
    // If farmer, must have either UPI or both account number and IFSC
    const hasUpi = !!formData.upiId;
    const hasBankAccount = !!(formData.accountNumber && formData.ifscCode);
    
    return hasUpi || hasBankAccount;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    // Only require bank details for farmers
    if (formData.role === 'farmer') {
      // Either UPI ID or both Account Number and IFSC should be provided
      if (!formData.upiId && (!formData.accountNumber || !formData.ifscCode)) {
        newErrors.bankDetails = 'Please provide either UPI ID or both Account Number and IFSC Code';
      }
      
      // Validate UPI ID format if provided
      if (formData.upiId && !formData.upiId.includes('@')) {
        newErrors.upiId = 'Please enter a valid UPI ID (should contain @)';
      }
      
      // Validate account number if provided
      if (formData.accountNumber && !/^\d{9,18}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'Account number should be 9-18 digits';
      }
      
      // Validate IFSC code if provided - correct format for Indian banks
      // Use a more permissive regex that allows both uppercase and lowercase
      if (formData.ifscCode && !/^[A-Za-z]{4}[0][A-Za-z0-9]{6}$/i.test(formData.ifscCode)) {
        newErrors.ifscCode = 'Please enter a valid IFSC code (e.g., SBIN0123456)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      // Only proceed to step 3 for farmers
      if (formData.role === 'farmer') {
        setCurrentStep(3);
      } else if (formData.role === 'customer') {
        // For customers, submit the form directly after step 2
        handleSubmit(new Event('submit'));
      }
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      handleNextStep();
      return;
    }
    
    if (currentStep === 2) {
      if (formData.role === 'customer') {
        // For customers, submit directly after step 2
        if (!validateStep2()) {
          return;
        }
      } else {
        // For farmers, proceed to step 3
        handleNextStep();
        return;
      }
    }
    
    // For step 3 (bank details), validate before submission
    if (formData.role === 'farmer' && currentStep === 3) {
      if (!validateStep3()) {
        return;
      }
      
      // Additional safety check to make sure bank details are present
      if (!areBankDetailsValid()) {
        setErrors({
          ...errors,
          bankDetails: 'Please provide either UPI ID or complete bank account details'
        });
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Prepare complete user data for registration
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        accountType: formData.role,
        role: formData.role,
        phone: formData.phone,
      };
      
      // Create location string from address fields
      const locationString = formData.address + ', ' + formData.city + ', ' + formData.state + ' - ' + formData.pincode;
      
      // Add farm details for farmer
      if (formData.role === 'farmer') {
        userData.farmName = formData.city; // Use city as farmName
        userData.farmLocation = locationString;
        
        // Add bank details for farmers directly to userData
        if (formData.upiId) {
          userData.upiId = formData.upiId;
        }
        if (formData.accountNumber) {
          userData.accountNumber = formData.accountNumber;
        }
        if (formData.ifscCode) {
          userData.ifscCode = formData.ifscCode;
        }
      } else if (formData.role === 'customer') {
        // For customers, add the location too
        userData.farmLocation = locationString;
      }
      
      const result = await authService.register(userData);
      
      if (result.success) {
        // Store complete signup data for OTP verification
        dispatch(setSignupData(userData));
        
        // Navigate to OTP verification using the correct route from constants
        navigate(ROUTES.VERIFY_OTP);
        toast.success(result.message || 'Verification code sent to your email.');
      } else {
        setErrors({
          ...errors,
          general: result.message || 'Registration failed'
        });
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        ...errors,
        general: error.message || 'An error occurred during registration'
      });
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
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
            <Link to="/auth/login" className="text-green-600 hover:text-green-800 font-medium">
              Login
            </Link>
            <Link to="/auth/signup" className="text-green-600 hover:text-green-800 font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/auth/login" className="font-medium text-green-600 hover:text-green-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errors.general && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              {formData.role === 'farmer' && (
                <>
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep >= 3 ? 'bg-green-600' : 'bg-gray-200'
                  }`}></div>
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                    currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs">Account</span>
              <span className="text-xs">Address</span>
              {formData.role === 'farmer' && (
                <span className="text-xs">Payment</span>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="1234567890"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-5 w-5" />
                        ) : (
                          <FaEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="h-5 w-5" />
                        ) : (
                          <FaEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    I am a
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.address ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="123 Main St"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={handleChange}
                      className={`mt-1 block w-full py-2 px-3 border ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="Mumbai"
                    />
                    {errors.city && (
                      <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`mt-1 block w-full py-2 px-3 border ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="mt-2 text-sm text-red-600">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                    Pincode
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    autoComplete="postal-code"
                    value={formData.pincode}
                    onChange={handleChange}
                    className={`mt-1 block w-full py-2 px-3 border ${
                      errors.pincode ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    placeholder="400001"
                  />
                  {errors.pincode && (
                    <p className="mt-2 text-sm text-red-600">{errors.pincode}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                    I agree to the{' '}
                    <a href="#" className="text-green-600 hover:text-green-500">
                      Terms and Conditions
                    </a>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-2 text-sm text-red-600">{errors.agreeToTerms}</p>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {formData.role === 'customer' ? 'Create Account' : 'Next'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && formData.role === 'farmer' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
                    UPI ID (Optional if providing bank details)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaQrcode className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="upiId"
                      name="upiId"
                      type="text"
                      value={formData.upiId}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.upiId ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      placeholder="yourname@upi"
                    />
                  </div>
                  {errors.upiId && (
                    <p className="mt-2 text-sm text-red-600">{errors.upiId}</p>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">OR</h4>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                        Bank Account Number
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaUniversity className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="accountNumber"
                          name="accountNumber"
                          type="text"
                          value={formData.accountNumber}
                          onChange={handleChange}
                          className={`block w-full pl-10 pr-3 py-2 border ${
                            errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                          placeholder="Enter account number"
                        />
                      </div>
                      {errors.accountNumber && (
                        <p className="mt-2 text-sm text-red-600">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">
                        IFSC Code
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaUniversity className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="ifscCode"
                          name="ifscCode"
                          type="text"
                          value={formData.ifscCode}
                          onChange={handleChange}
                          onBlur={(e) => {
                            // Convert to uppercase when the user leaves the field
                            setFormData({
                              ...formData,
                              ifscCode: formData.ifscCode.toUpperCase()
                            });
                          }}
                          className={`block w-full pl-10 pr-3 py-2 border ${
                            errors.ifscCode ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                          placeholder="Enter IFSC code (e.g., SBIN0123456)"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                      {errors.ifscCode && (
                        <p className="mt-2 text-sm text-red-600">{errors.ifscCode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {errors.bankDetails && (
                  <p className="mt-2 text-sm text-red-600">{errors.bankDetails}</p>
                )}

                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 