import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { API_CONFIG } from '../config/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  // Initialize socket connection
  init(token) {
    if (this.socket) {
      console.log('Socket already initialized');
      return this.socket;
    }

    try {
      // Extract the base URL without the /api/v1 path
      const baseURL = API_CONFIG.BASE_URL.replace('/api/v1', '');

      console.log('Initializing socket connection to:', baseURL);

      // Create socket connection with auth token
      this.socket = io(baseURL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('Socket connected!');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          toast.error('Could not connect to chat server. Please try again later.');
          this.disconnect();
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, need to manually reconnect
          this.reconnect();
        }
      });

      // Handle authentication errors
      this.socket.on('unauthorized', (error) => {
        console.error('Socket authentication failed:', error);
        toast.error('Chat authentication failed. Please log in again.');
        this.disconnect();
      });

      return this.socket;
    } catch (error) {
      console.error('Error initializing socket:', error);
      toast.error('Error connecting to chat server');
      return null;
    }
  }

  // Get the socket instance
  getSocket() {
    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Reconnect socket
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Join a chat room (contract)
  joinChat(contractId) {
    if (!this.isConnected) {
      console.warn('Socket not connected. Cannot join chat.');
      return false;
    }

    this.socket.emit('join_chat', { contractId });
    return true;
  }

  // Leave a chat room
  leaveChat(contractId) {
    if (!this.isConnected) {
      return;
    }

    this.socket.emit('leave_chat', { contractId });
  }

  // Send a message
  sendMessage(contractId, message) {
    if (!this.isConnected) {
      console.warn('Socket not connected. Cannot send message.');
      return false;
    }

    this.socket.emit('send_message', { contractId, message });
    return true;
  }

  // Mark messages as read
  markMessagesAsRead(contractId) {
    if (!this.isConnected) {
      return;
    }

    this.socket.emit('mark_messages_read', { contractId });
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized. Cannot subscribe to events.');
      return () => {};
    }

    this.socket.on(event, callback);
    this.listeners.set(event, callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (!this.socket) {
      return;
    }

    this.socket.off(event, callback);
    this.listeners.delete(event);
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 