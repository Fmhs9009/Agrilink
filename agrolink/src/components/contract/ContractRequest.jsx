import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { submitContractRequest } from '../../reducer/Slice/contractRequestsSlice';
import useForm from '../../hooks/useForm';
import { FaHandshake, FaCalendarAlt, FaMoneyBillWave, FaFileContract, FaTractor } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import authService from '../../services/authService';

const ContractRequest = ({ product, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      toast.error('You must be logged in to request a contract');
      navigate('/login', { state: { from: `/product/${product._id}` } });
    }
  }, [navigate, product._id]);

  const initialValues = {
    quantity: product.minimumOrderQuantity || 1,
    requestedHarvestDate: '',
    specialRequirements: '',
    proposedPrice: product.price,
    contractDuration: product.contractPreferences?.minDuration || 30,
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
    } else if (values.quantity < product.minimumOrderQuantity) {
      errors.quantity = `Minimum order quantity is ${product.minimumOrderQuantity} ${product.unit}`;
    } else if (values.quantity > product.availableQuantity) {
      errors.quantity = `Maximum available quantity is ${product.availableQuantity} ${product.unit}`;
    }

    // Harvest date validation
    if (!values.requestedHarvestDate) {
      errors.requestedHarvestDate = 'Requested harvest date is required';
    } else {
      const selectedDate = new Date(values.requestedHarvestDate);
      const today = new Date();
      if (selectedDate < today) {
        errors.requestedHarvestDate = 'Harvest date cannot be in the past';
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
      product.contractPreferences &&
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

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Sanitize inputs
      const sanitizedValues = {
        ...values,
        quantity: Number(values.quantity),
        proposedPrice: Number(values.proposedPrice),
        contractDuration: Number(values.contractDuration),
        specialRequirements: values.specialRequirements.trim()
      };

      const contractRequest = {
        productId: product._id,
        farmerId: product.farmer?._id,
        ...sanitizedValues,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await dispatch(submitContractRequest(contractRequest)).unwrap();
      resetForm();
      navigate('/contract-requests');
    } catch (error) {
      toast.error(error.message || 'Failed to submit contract request');
    } finally {
      setSubmitting(false);
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
    isSubmitting: formSubmitting
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
          <p>Expected Harvest: {new Date(product.estimatedHarvestDate).toLocaleDateString()}</p>
        </div>
      </div>

      {formSubmitting ? (
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

            {/* Requested Harvest Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FaCalendarAlt className="mr-1" /> Requested Harvest Date
              </label>
              <input
                type="date"
                name="requestedHarvestDate"
                value={values.requestedHarvestDate}
                onChange={handleChange}
                onBlur={handleBlur}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full p-2 border rounded-md ${
                  touched.requestedHarvestDate && errors.requestedHarvestDate ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby="harvest-date-error"
              />
              {touched.requestedHarvestDate && errors.requestedHarvestDate && (
                <p id="harvest-date-error" className="text-red-500 text-xs mt-1">{errors.requestedHarvestDate}</p>
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
              disabled={formSubmitting}
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