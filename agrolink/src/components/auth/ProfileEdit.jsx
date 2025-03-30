import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import authService from '../../services/auth/authService';
import { updateUserData } from '../../reducer/Slice/authSlice';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaWarehouse } from 'react-icons/fa';

const ProfileEdit = () => {
  const user = useSelector((state) => state.auth.loginData);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    farmLocation: '',
  });
  const [error, setError] = useState('');

  // Pre-fill the form with user data when component mounts or user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.Name || '',
        email: user.email || '',
        phone: user.contactNumber || '',
        address: user.address || '',
        farmLocation: user.farmLocation || user.FarmLocation || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    // Map front-end field names to backend field names
    const backendData = {
      Name: formData.name,
      contactNumber: formData.phone,
      address: user?.accountType === 'customer' ? formData.address : undefined,
      FarmLocation: user?.accountType === 'farmer' ? formData.farmLocation : undefined,
    };
    
    try {
      const result = await authService.updateProfile(backendData);
      
      if (result.success) {
        // Create an updated user object that matches the frontend structure
        const updatedUser = {
          ...user,
          Name: formData.name,
          contactNumber: formData.phone,
        };
        
        if (user?.accountType === 'customer') {
          updatedUser.address = formData.address;
        } else if (user?.accountType === 'farmer') {
          updatedUser.FarmLocation = formData.farmLocation;
        }
        
        dispatch(updateUserData(updatedUser));
        toast.success('Profile updated successfully');
      } else {
        setError(result.message || 'Failed to update profile');
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'An error occurred');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      toast.error('Name is required');
      return false;
    }
    
    return true;
  };

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
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="relative">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
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
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Not given previously"
                  />
                </div>
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
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Not given previously"
                  />
                </div>
              </div>

              {user?.accountType === 'customer' && (
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
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Not given previously"
                    />
                  </div>
                </div>
              )}

              {user?.accountType === 'farmer' && (
                <div className="relative">
                  <label htmlFor="farmLocation" className="block text-sm font-medium text-gray-700 mb-1">
                    Farm Location
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="farmLocation"
                      id="farmLocation"
                      value={formData.farmLocation}
                      onChange={handleChange}
                      className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Not given previously"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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