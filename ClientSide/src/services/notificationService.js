import axios from 'axios';
import { API_URL } from '../config';

const notificationAPI = {
    // Get all notifications for the logged-in user
    getNotifications: async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch notifications' };
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await axios.put(`${API_URL}/notifications/${notificationId}`, {}, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to mark notification as read' };
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await axios.put(`${API_URL}/notifications/mark-all-read`, {}, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to mark all notifications as read' };
        }
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await axios.delete(`${API_URL}/notifications/${notificationId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete notification' };
        }
    }
};

export default notificationAPI; 