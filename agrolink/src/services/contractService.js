import axios from 'axios';
import authService from './auth/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

/**
 * Service for contract-related API calls
 */
const contractService = {
  /**
   * Get all contracts with optional filters
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Contracts array
   */
  getAllContracts: async (filters = {}) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`${API_BASE_URL}/contracts?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.contracts;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  },
  
  /**
   * Get contract details by ID
   * @param {string} id - Contract ID
   * @returns {Promise<Object>} - Contract details
   */
  getContractById: async (id) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_BASE_URL}/contracts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.contract;
    } catch (error) {
      console.error(`Error fetching contract ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new contract request
   * @param {Object} contractData - Contract data
   * @returns {Promise<Object>} - Created contract
   */
  createContractRequest: async (contractData) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${API_BASE_URL}/contracts/request`, contractData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating contract request:', error);
      throw error;
    }
  },
  
  /**
   * Get contracts for the current farmer
   * @returns {Promise<Array>} - Farmer's contracts array
   */
  getFarmerContracts: async () => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_BASE_URL}/contracts/farmer/contracts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.contracts;
    } catch (error) {
      console.error('Error fetching farmer contracts:', error);
      throw error;
    }
  },
  
  /**
   * Get contracts for the current buyer
   * @returns {Promise<Array>} - Buyer's contracts array
   */
  getBuyerContracts: async () => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_BASE_URL}/contracts/buyer/contracts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.contracts;
    } catch (error) {
      console.error('Error fetching buyer contracts:', error);
      throw error;
    }
  },
  
  /**
   * Update contract status
   * @param {string} id - Contract ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated contract
   */
  updateContractStatus: async (id, status) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Both farmers and buyers can use this endpoint
      const response = await axios.put(`${API_BASE_URL}/contracts/${id}/status`, { status }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating contract ${id} status:`, error);
      throw error;
    }
  },
  
  /**
   * Add progress update to contract
   * @param {string} id - Contract ID
   * @param {Object} updateData - Progress update data
   * @returns {Promise<Object>} - Updated contract
   */
  addProgressUpdate: async (id, updateData) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Check if this is a payment update from a customer
      const isBuyer = authService.getUserRole() === 'customer';
      const isPaymentUpdate = updateData.get('description')?.toLowerCase().includes('payment');
      
      // If it's a payment update from a buyer, don't try to create a progress update
      // Instead, we'll rely on the subsequent status update to track the payment
      if (isBuyer && isPaymentUpdate) {
        // Return a mock success response rather than trying to call an endpoint
        console.log('Skipping progress update for buyer payment - will update status instead');
        return { success: true, message: 'Payment will be tracked through status update' };
      }
      
      // For all other cases, proceed with the regular progress update
      const response = await axios.post(`${API_BASE_URL}/contracts/${id}/progress`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error adding progress update to contract ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Negotiate contract terms
   * @param {string} id - Contract ID
   * @param {Object} negotiationData - Negotiation data
   * @returns {Promise<Object>} - Updated contract
   */
  negotiateContract: async (id, negotiationData) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${API_BASE_URL}/contracts/${id}/negotiate`, negotiationData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error negotiating contract ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Accept contract (for farmer)
   * @param {string} id - Contract ID
   * @returns {Promise<Object>} - Updated contract
   */
  acceptContract: async (id) => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${API_BASE_URL}/contracts/${id}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error accepting contract ${id}:`, error);
      throw error;
    }
  }
};

export { contractService }; 