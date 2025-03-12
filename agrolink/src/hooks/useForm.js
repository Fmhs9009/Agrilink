import { useState, useCallback } from 'react';

/**
 * Custom hook for form handling with validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Function to call on form submission
 * @param {Function} validate - Validation function
 * @returns {Object} - Form handling utilities
 */
const useForm = (initialValues, onSubmit, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    const inputValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [errors]);

  // Handle input blur (for validation on blur)
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate single field if validate function exists
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: validationErrors[name]
        }));
      }
    }
  }, [validate, values]);

  // Set a specific field value programmatically
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is set
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [errors]);

  // Set multiple field values programmatically
  const setMultipleFields = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
    
    // Clear errors for updated fields
    const updatedErrors = { ...errors };
    Object.keys(newValues).forEach(key => {
      if (updatedErrors[key]) {
        delete updatedErrors[key];
      }
    });
    
    setErrors(updatedErrors);
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    
    setTouched(allTouched);
    
    // Validate all fields if validate function exists
    let validationErrors = {};
    if (validate) {
      validationErrors = validate(values);
      setErrors(validationErrors);
      
      // Don't submit if there are validation errors
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validate, values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setMultipleFields,
    resetForm
  };
};

export default useForm; 