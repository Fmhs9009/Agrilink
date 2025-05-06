import { api } from './api';
import { toast } from 'react-hot-toast';

const chatService = {
  /**
   * Get messages for a specific contract
   * @param {string} contractId - ID of the contract
   * @param {Object} params - Query parameters (before, limit)
   * @returns {Promise<Object>} - Response with messages and count
   */
  getMessages: async (contractId, params = {}) => {
    try {
      const response = await api.get(`/chat/contracts/${contractId}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, messages: [], count: 0 };
    }
  },

  /**
   * Send a text message
   * @param {string} contractId - ID of the contract
   * @param {Object} messageData - Message data (content, messageType)
   * @returns {Promise<Object>} - Response with created message
   */
  sendMessage: async (contractId, messageData) => {
    try {
      const response = await api.post(`/chat/contracts/${contractId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return { success: false };
    }
  },

  /**
   * Send an image message
   * @param {string} contractId - ID of the contract
   * @param {FormData} formData - Form data with image and optional caption
   * @returns {Promise<Object>} - Response with created message
   */
  sendImageMessage: async (contractId, formData) => {
    try {
      const response = await api.post(`/chat/contracts/${contractId}/messages/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error sending image message:', error);
      toast.error('Failed to send image');
      return { success: false };
    }
  },

  /**
   * Mark messages as read
   * @param {string} contractId - ID of the contract
   * @returns {Promise<Object>} - Response with success status
   */
  markAsRead: async (contractId) => {
    try {
      const response = await api.put(`/chat/contracts/${contractId}/messages/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false };
    }
  },

  /**
   * Get unread message count
   * @returns {Promise<Object>} - Response with unread counts
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/chat/unread');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, totalUnread: 0, unreadCounts: [] };
    }
  },

  /**
   * Get chat list (all contracts with latest message)
   * @returns {Promise<Object>} - Response with chat list
   */
  getChatList: async () => {
    try {
      const response = await api.get('/chat/chats');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat list:', error);
      return { success: false, chats: [] };
    }
  },

  /**
   * Accept counter offer
   * @param {string} contractId - ID of the contract
   * @returns {Promise<Object>} - Response with updated contract
   */
  acceptCounterOffer: async (contractId) => {
    try {
      const response = await api.put(`/chat/contracts/${contractId}/accept-offer`);
      return response.data;
    } catch (error) {
      console.error('Error accepting counter offer:', error);
      toast.error('Failed to accept offer');
      return { success: false };
    }
  }
};

export default chatService; 