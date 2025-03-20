import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useForm from '../../hooks/useForm';
import { FaHandshake, FaCalendarAlt, FaMoneyBillWave, FaFileContract, FaTractor } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import authService from '../../services/authService';
import { contractAPI } from '../../services/api';

const ContractRequest = ({ product, onClose, onSubmitSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      toast.error('You must be logged in to request a contract');
      navigate('/login', { state: { from: `/product/${product?._id}` } });
    }
  }, [navigate, product?._id]);

  // Get current user for the buyer ID
  const currentUser = authService.getUser();

  const initialValues = {
    quantity: product?.minimumOrderQuantity || 1,
    requestedDeliveryDate: product?.harvestDate 
      ? new Date(product.harvestDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    specialRequirements: '',
    proposedPrice: product?.price || 0,
    contractDuration: product?.contractPreferences?.minDuration || 30,
    paymentTerms: 'standard',
    qualityStandards: 'market',
  };

  const validate = (values) => {
    const errors = {};
    
    // Quantity validation
    if (!values.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(values.quantity) || values.quantity <= 0) {
      errors.quantity = 'Quantity must be a positive number';
    } else if (product?.minimumOrderQuantity && values.quantity < product.minimumOrderQuantity) {
      errors.quantity = `Minimum order quantity is ${product.minimumOrderQuantity} ${product.unit || 'unit'}`;
    } else if (product?.availableQuantity && values.quantity > product.availableQuantity) {
      errors.quantity = `Maximum available quantity is ${product.availableQuantity} ${product.unit || 'unit'}`;
    }

    // Delivery date validation
    if (!values.requestedDeliveryDate) {
      errors.requestedDeliveryDate = 'Requested delivery date is required';
    } else {
      const selectedDate = new Date(values.requestedDeliveryDate);
      const today = new Date();
      if (selectedDate < today) {
        errors.requestedDeliveryDate = 'Delivery date cannot be in the past';
      }
    }

    // Price validation
    if (!values.proposedPrice) {
      errors.proposedPrice = 'Proposed price is required';
    } else if (isNaN(values.proposedPrice) || values.proposedPrice <= 0) {
      errors.proposedPrice = 'Price must be a positive number';
    }

    // Contract duration validation
    if (!values.contractDuration) {
      errors.contractDuration = 'Contract duration is required';
    } else if (isNaN(values.contractDuration) || values.contractDuration <= 0) {
      errors.contractDuration = 'Duration must be a positive number';
    } else if (
      product?.contractPreferences &&
      (values.contractDuration < product.contractPreferences.minDuration ||
        values.contractDuration > product.contractPreferences.maxDuration)
    ) {
      errors.contractDuration = `Duration must be between ${product.contractPreferences.minDuration} and ${product.contractPreferences.maxDuration} days`;
    }

    // Special requirements validation (optional but sanitize if provided)
    if (values.specialRequirements && values.specialRequirements.length > 1000) {
      errors.specialRequirements = 'Special requirements must be less than 1000 characters';
    }

    return errors;
  };

  const handleSubmit = async (values) => {
    // Declare contractRequest variable outside try block so it's accessible in the catch block
    let contractRequest;
    
    try {
      setIsSubmitting(true);
      
      // Basic validation
      if (!product) {
        throw new Error("Product information is missing");
      }

      // Check if product object has the complete information we need
      if (!product._id) {
        console.error("Missing product ID:", product);
        throw new Error("Product information is incomplete. Missing product ID.");
      }

      if (!product.farmer && (!product.farmer || !product.farmer._id)) {
        console.error("Missing farmer information:", product.farmer);
        // We'll try to continue anyway, but log the issue
        console.warn("Will attempt to submit without complete farmer information");
      }

      // Sanitize inputs
      const sanitizedValues = {
        ...values,
        quantity: Number(values.quantity),
        proposedPrice: Number(values.proposedPrice),
        contractDuration: Number(values.contractDuration),
        specialRequirements: values.specialRequirements ? values.specialRequirements.trim() : ""
      };

      // Set payment structure based on selected payment terms
      let paymentStructure = {
        advancePercentage: 20,
        midtermPercentage: 50,
        finalPercentage: 30
      };

      // Adjust payment structure based on payment terms selection
      switch (sanitizedValues.paymentTerms) {
        case 'standard':
          paymentStructure = { advancePercentage: 50, midtermPercentage: 0, finalPercentage: 50 };
          break;
        case 'milestone':
          paymentStructure = { advancePercentage: 20, midtermPercentage: 50, finalPercentage: 30 };
          break;
        case 'delivery':
          paymentStructure = { advancePercentage: 0, midtermPercentage: 0, finalPercentage: 100 };
          break;
        case 'advance':
          paymentStructure = { advancePercentage: 100, midtermPercentage: 0, finalPercentage: 0 };
          break;
        default:
          // Use default structure
          break;
      }

      // To match the structure expected by the API
      contractRequest = {
        cropId: product._id,
        farmerId: typeof product.farmer === 'object' ? product.farmer._id : product.farmer,
        quantity: sanitizedValues.quantity,
        unit: product.unit || "kg",
        pricePerUnit: sanitizedValues.proposedPrice || product.price,
        totalAmount: sanitizedValues.quantity * (sanitizedValues.proposedPrice || product.price),
        expectedHarvestDate: product.harvestDate || sanitizedValues.requestedDeliveryDate 
          ? new Date(sanitizedValues.requestedDeliveryDate || product.harvestDate) 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        deliveryFrequency: sanitizedValues.paymentTerms,
        paymentTerms: paymentStructure,
        qualityRequirements: product.qualityStandards || sanitizedValues.qualityStandards || "",
        specialRequirements: sanitizedValues.specialRequirements || "",
        status: "requested" // Explicitly set status to a valid enum value according to the model
      };

      // Validate required fields based on backend validation
      const requiredFields = ['cropId', 'farmerId', 'quantity', 'unit', 'pricePerUnit'];
      const missingFields = requiredFields.filter(field => !contractRequest[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log("Sending contract request:", contractRequest);
      
      const response = await contractAPI.createContractRequest(contractRequest);
      
      // Check for various error response formats
      if (!response) {
        console.error("No response received from server");
        throw new Error("No response received from server");
      }
      
      if (response.success === false) {
        console.error("API returned error:", response);
        console.error("Contract data that caused error:", contractRequest);
        throw new Error(response.message || "Server error: Failed to submit contract request");
      }
      
      if (response.error) {
        console.error("API returned error object:", response.error);
        console.error("Error details:", response);
        console.error("Contract data that caused error:", contractRequest);
        throw new Error(response.message || response.error.message || "Server error in contract request");
      }
      
      console.log("Contract request successful:", response);
      resetForm();
      
      // Call onSubmitSuccess with the contract data if provided
      if (onSubmitSuccess && typeof onSubmitSuccess === 'function') {
        // If the response contains a contract object, use it, otherwise use the whole response
        const resultData = response.contract || response;
        toast.success("Contract request submitted successfully!");
        onSubmitSuccess(resultData);
      } else {
        toast.success("Contract request submitted successfully!");
        navigate('/contracts/manage');
      }
    } catch (error) {
      console.error("Error in contract submission:", error);
      console.error("Contract data that failed:", contractRequest);
      
      // Try to extract more detailed error information
      let errorMessage = '';
      if (error.response) {
        console.error("Error response:", error.response);
        errorMessage = error.response.data?.message || error.message;
      } else {
        errorMessage = error.message || 'Failed to submit contract request';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    setFieldValue, 
    handleSubmit: submitForm,
    resetForm
  } = useForm(initialValues, handleSubmit, validate);

  const paymentTermsOptions = [
    { value: 'standard', label: 'Standard (50% advance, 50% on delivery)' },
    { value: 'milestone', label: 'Milestone-based payments' },
    { value: 'delivery', label: 'Full payment on delivery' },
    { value: 'advance', label: 'Full payment in advance (10% discount)' }
  ];

  const qualityStandardsOptions = [
    { value: 'market', label: 'Market Standard' },
    { value: 'premium', label: 'Premium Quality' },
    { value: 'organic', label: 'Certified Organic' },
    { value: 'custom', label: 'Custom Standards (specify in requirements)' }
  ];

  // Check if product is defined - After all hooks have been called
  if (!product) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm">Product information is missing</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaHandshake className="mr-2 text-green-600" /> Request Contract
      </h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Current Price: ₹{product.price}/{product.unit}</span>
          <span>Available: {product.availableQuantity} {product.unit}</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>Farmer: {product.farmer?.name || 'Local Farmer'}</p>
          <p>Expected Harvest: {product.estimatedHarvestDate ? new Date(product.estimatedHarvestDate).toLocaleDateString() : 'Not specified'}</p>
        </div>
      </div>

      {isSubmitting ? (
        <LoadingSpinner message="Submitting your contract request..." />
      ) : (
        <form onSubmit={submitForm} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity ({product.unit})
              </label>
              <input
                type="number"
                name="quantity"
                value={values.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                min={product.minimumOrderQuantity}
                max={product.availableQuantity}
                className={`w-full p-2 border rounded-md ${
                  touched.quantity && errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby="quantity-error"
              />
              {touched.quantity && errors.quantity && (
                <p id="quantity-error" className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Proposed Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Price (₹/{product.unit})
              </label>
              <input
                type="number"
                name="proposedPrice"
                value={values.proposedPrice}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-2 border rounded-md ${
                  touched.proposedPrice && errors.proposedPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby="price-error"
              />
              {touched.proposedPrice && errors.proposedPrice && (
                <p id="price-error" className="text-red-500 text-xs mt-1">{errors.proposedPrice}</p>
              )}
            </div>

            {/* Requested Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaCalendarAlt className="mr-1" /> Requested Delivery Date
              </label>
              <input
                type="date"
                name="requestedDeliveryDate"
                value={values.requestedDeliveryDate}
                onChange={handleChange}
                onBlur={handleBlur}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full p-2 border rounded-md ${
                  touched.requestedDeliveryDate && errors.requestedDeliveryDate ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby="delivery-date-error"
              />
              {touched.requestedDeliveryDate && errors.requestedDeliveryDate && (
                <p id="delivery-date-error" className="text-red-500 text-xs mt-1">{errors.requestedDeliveryDate}</p>
              )}
            </div>

            {/* Contract Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaFileContract className="mr-1" /> Contract Duration (days)
              </label>
              <input
                type="number"
                name="contractDuration"
                value={values.contractDuration}
                onChange={handleChange}
                onBlur={handleBlur}
                min={product.contractPreferences?.minDuration || 30}
                max={product.contractPreferences?.maxDuration || 365}
                className={`w-full p-2 border rounded-md ${
                  touched.contractDuration && errors.contractDuration ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby="duration-error"
              />
              {touched.contractDuration && errors.contractDuration && (
                <p id="duration-error" className="text-red-500 text-xs mt-1">{errors.contractDuration}</p>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaMoneyBillWave className="mr-1" /> Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={values.paymentTerms}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {paymentTermsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Standards */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaTractor className="mr-1" /> Quality Standards
              </label>
              <select
                name="qualityStandards"
                value={values.qualityStandards}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {qualityStandardsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requirements or Notes
            </label>
            <textarea
              name="specialRequirements"
              value={values.specialRequirements}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="4"
              placeholder="Any specific requirements for the crop, farming practices, or delivery conditions..."
              className={`w-full p-2 border rounded-md ${
                touched.specialRequirements && errors.specialRequirements ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby="requirements-error"
            ></textarea>
            {touched.specialRequirements && errors.specialRequirements && (
              <p id="requirements-error" className="text-red-500 text-xs mt-1">{errors.specialRequirements}</p>
            )}
          </div>

          {/* Total Value */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Contract Value:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{(values.quantity * values.proposedPrice).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <FaHandshake className="mr-2" /> Submit Contract Request
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContractRequest; 