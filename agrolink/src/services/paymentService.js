import axios from 'axios';
import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

export const paymentService = {
  /**
   * Create a payment request
   * @param {string} contractId - Contract ID
   * @param {string} paymentStage - Payment stage (advance, midterm, final)
   * @returns {Promise<Object>} - Payment response with payment URL
   */
  createPayment: async (contractId, paymentStage) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/payments/create`, 
        { 
          contractId,
          paymentStage
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },
  
  /**
   * Verify a payment
   * @param {string} paymentId - Payment ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Payment verification result
   */
  verifyPayment: async (paymentId, options = {}) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Build query params for Instamojo
      const queryParams = new URLSearchParams();
      if (options?.paymentRequestId) {
        queryParams.append('payment_request_id', options.paymentRequestId);
      }
      
      // Add URL with query params if needed
      const url = options?.paymentRequestId 
        ? `${API_BASE_URL}/payments/${paymentId}/verify?${queryParams.toString()}`
        : `${API_BASE_URL}/payments/${paymentId}/verify`;
      
      const response = await axios.get(
        url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },
  
  /**
   * Get payment details
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} - Payment details
   */
  getPaymentDetails: async (paymentId) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  },
  
  /**
   * Get contract payments
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object>} - List of payments for the contract
   */
  getContractPayments: async (contractId) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/contracts/${contractId}/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting contract payments:', error);
      throw error;
    }
  }
}; 