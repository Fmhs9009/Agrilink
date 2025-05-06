import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { updateUserData } from '../../reducer/Slice/authSlice';
import authService from '../../services/auth/authService';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaWarehouse, FaUniversity, FaQrcode, FaSpinner, FaCheck } from 'react-icons/fa';
import { INDIAN_STATES } from '../../config/constants';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.loginData);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Parse location string if it exists
  const parseLocationString = (locationString) => {
    if (!locationString) return { address: '', city: '', state: '', pincode: '' };
    
    try {
      // Location format from signup: address + ', ' + city + ', ' + state + ' - ' + pincode
      const parts = locationString.split(', ');
      
      if (parts.length >= 3) {
        const address = parts[0];
        const city = parts[1];
        
        // Handle the last part which contains state and pincode
        const stateAndPincode = parts[parts.length - 1].split(' - ');
        
        return {
          address: address,
          city: city,
          state: stateAndPincode[0] || '',
          pincode: stateAndPincode[1] || ''
        };
      }
      
      return { address: locationString, city: '', state: '', pincode: '' };
    } catch (error) {
      console.error('Error parsing location string:', error);
      return { address: locationString, city: '', state: '', pincode: '' };
    }
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });
  
  const [errors, setErrors] = useState({});

  // Pre-fill the form with user data when component mounts or user data changes
  useEffect(() => {
    if (user) {
      // Parse the farm location into address components if it exists
      const locationDetails = parseLocationString(user.FarmLocation || '');
      
      setFormData({
        name: user.Name || '',
        email: user.email || '',
        phone: user.contactNumber || '',
        address: locationDetails.address,
        city: locationDetails.city,
        state: locationDetails.state,
        pincode: locationDetails.pincode,
        accountNumber: user.accountNumber || '',
        ifscCode: user.ifscCode || '',
        upiId: user.upiId || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle IFSC code - convert to uppercase
    if (name === 'ifscCode') {
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Phone validation
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    // Address validation
    if (formData.address && !formData.city) {
      newErrors.city = 'City is required when address is provided';
    }
    
    if (formData.address && !formData.state) {
      newErrors.state = 'State is required when address is provided';
    }
    
    // Pincode validation
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    // Bank details validation for farmers
    if (user?.accountType === 'farmer') {
      // IFSC code validation
      if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
        newErrors.ifscCode = 'Please enter a valid IFSC code (e.g., SBIN0123456)';
      }
      
      // Account number validation
      if (formData.accountNumber && !/^\d{9,18}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'Account number should be 9-18 digits';
      }
      
      // UPI ID validation
      if (formData.upiId && !formData.upiId.includes('@')) {
        newErrors.upiId = 'Please enter a valid UPI ID (should contain @)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setSubmitting(true);
    setSuccess(false);

    try {
      // Create location string from address fields, similar to signup
      let locationString = '';
      if (formData.address) {
        locationString = formData.address;
        
        if (formData.city) {
          locationString += ', ' + formData.city;
        }
        
        if (formData.state) {
          locationString += ', ' + formData.state;
          
          if (formData.pincode) {
            locationString += ' - ' + formData.pincode;
          }
        }
      }
    // Map front-end field names to backend field names
    const backendData = {
      Name: formData.name,
      };
      
      if (formData.phone) {
        backendData.contactNumber = formData.phone;
      }
      
      if (locationString) {
        backendData.FarmLocation = locationString;
      }
    
    // Add bank details for farmers
    if (user?.accountType === 'farmer') {
        if (formData.accountNumber) {
      backendData.accountNumber = formData.accountNumber;
        }
        
        if (formData.ifscCode) {
      backendData.ifscCode = formData.ifscCode;
        }
        
        if (formData.upiId) {
      backendData.upiId = formData.upiId;
        }
    }
    
      const result = await authService.updateProfile(backendData);
      
      if (result.success) {
        // Create an updated user object that matches the frontend structure
        const updatedUser = {
          ...user,
          Name: formData.name,
          contactNumber: formData.phone,
          FarmLocation: locationString
        };
        
        // Add bank details for farmers
        if (user?.accountType === 'farmer') {
          if (formData.accountNumber) updatedUser.accountNumber = formData.accountNumber;
          if (formData.ifscCode) updatedUser.ifscCode = formData.ifscCode;
          if (formData.upiId) updatedUser.upiId = formData.upiId;
        }
        
        dispatch(updateUserData(updatedUser));
        setSuccess(true);
        toast.success('Profile updated successfully');
      } else {
        setErrors({ form: result.message || 'Failed to update profile' });
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({ form: error.message || 'An error occurred' });
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-green-600 h-8 w-8" />
        <span className="ml-2 text-gray-700">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-green-50 px-4 py-4 border-b border-gray-200">
          <h3 className="text-xl leading-6 font-medium text-green-800">
            Edit Your Profile
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Update your personal information
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {errors.form && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{errors.form}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 text-green-700 flex items-center">
              <FaCheck className="h-5 w-5 mr-2" />
              <p>Profile updated successfully!</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="relative">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                      className={`pl-10 block w-full border ${
                        errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
              </div>

              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Non-editable)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className="pl-10 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="relative">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                      className={`pl-10 block w-full border ${
                        errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                      placeholder="Enter 10-digit number"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
                </div>
              </div>

            {/* Address Information Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-lg font-medium text-gray-800 mb-4">
                {user?.accountType === 'farmer' ? 'Farm Location' : 'Address Information'}
              </h4>
              <div className="space-y-4">
              <div className="relative">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`pl-10 block w-full border ${
                        errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                      placeholder="123 Main St"
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      className={`block w-full border ${
                        errors.city ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                      placeholder="Mumbai"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`block w-full border ${
                        errors.state ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="sm:w-1/2">
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleChange}
                    className={`block w-full border ${
                      errors.pincode ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                    placeholder="400001"
                    maxLength={6}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
                  )}
                </div>
                </div>
              </div>

            {/* Payment Information Section - Only for Farmers */}
              {user?.accountType === 'farmer' && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-lg font-medium text-gray-800 mb-4">Payment Information</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide at least one payment method (Bank Account or UPI ID)
                </p>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="relative">
                    <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                      UPI ID
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaQrcode className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="upiId"
                        id="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        className={`pl-10 block w-full border ${
                          errors.upiId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                        } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                        placeholder="example@upi"
                      />
                    </div>
                    {errors.upiId && (
                      <p className="mt-1 text-sm text-red-600">{errors.upiId}</p>
                    )}
                  </div>

                  <div className="relative">
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Account Number
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUniversity className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="accountNumber"
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className={`pl-10 block w-full border ${
                          errors.accountNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                        } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                        placeholder="Enter account number"
                      />
                    </div>
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                    )}
                  </div>

                  <div className="relative">
                    <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUniversity className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="ifscCode"
                        id="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        className={`pl-10 block w-full border ${
                          errors.ifscCode ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                        } rounded-md shadow-sm py-2 px-3 focus:outline-none`}
                        placeholder="Enter IFSC code"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    {errors.ifscCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.ifscCode}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mr-4 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit; 