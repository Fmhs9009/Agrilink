import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { API_CONFIG } from '../config/constants';

// Singleton pattern for socket service
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.token = null;
    this.DEBUG = true; // For detailed logging
    this.messageTimeouts = {};
    this.pendingMessages = {};
    this.activeRooms = {};
    this.eventListeners = {};
    this.reconnectAttempts = 0;
    this.connectionCheckInterval = null;
    this.heartbeatInterval = null;
    this.rooms = new Set();
  }

  log(...args) {
    if (this.DEBUG) {
      console.log(...args);
    }
  }

  // Initialize socket connection with a clean approach
  async init(token) {
    this.token = token;
    
    // If we already have a socket, first clean it up
    if (this.socket) {
      this.log('🧹 Cleaning up existing socket before reinitializing');
      this.cleanup();
    }

    try {
      const baseURL = API_CONFIG.BASE_URL.replace('/api/v1', '');
      this.log('🔌 Connecting to socket server:', baseURL);
      
      // Create new socket connection with optimized settings
      this.socket = io(baseURL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        query: { token }
      });
      
      // Set up core event handlers
      this.setupEventHandlers();
      
      // Return a promise that resolves when connected
      return new Promise((resolve, reject) => {
        // Set connection timeout with a longer duration
        const timeout = setTimeout(() => {
          this.log('⏱️ Socket connection timeout - falling back to REST API mode');
          // Don't reject, just resolve with the socket instance anyway
          // This way the app will fallback to REST API mode instead of failing
          this.isConnected = false;
          if (this.socket) {
            // Keep the socket alive for potential reconnection
            resolve(this.socket);
          } else {
            // Create a dummy socket to avoid null reference errors
            this.socket = {
              connected: false,
              on: () => {},
              emit: () => {},
              disconnect: () => {}
            };
            resolve(this.socket);
          }
        }, 15000); // 15 second timeout (increased)
        
        // Wait for connect event
        this.socket.once('connect', () => {
          clearTimeout(timeout);
          this.log('✅ Socket connected successfully!');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Notify UI
          this.emitConnectionStatus(true);
          
          // Setup monitoring
          this.startConnectionMonitoring();
          
          // Process any pending messages
          this.processPendingMessages();
          
          // Rejoin any rooms we were in
          this.rejoinRooms();
          
          resolve(this.socket);
        });
        
        // Handle connection error
        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          this.log('❌ Socket connection error:', error);
          
          // Just resolve with null and fallback to REST API
          this.isConnected = false;
          resolve(null);
        });
      });
    } catch (error) {
      this.log('❌ Socket initialization error:', error);
      this.isConnected = false;
      
      // Don't throw, just return null so app can continue in REST mode
      return null;
    }
  }
  
  // Set up all socket event handlers
  setupEventHandlers() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      this.log('🔄 Socket reconnected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitConnectionStatus(true);
      this.processPendingMessages();
      this.rejoinRooms();
    });
    
    this.socket.on('connect_error', (error) => {
      this.log('❌ Socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      this.emitConnectionStatus(false, 'Connection error');
    });
    
    this.socket.on('disconnect', (reason) => {
      this.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      this.emitConnectionStatus(false, reason);
    });
    
    this.socket.on('error', (error) => {
      this.log('❌ Socket error:', error);
      
      // Handle different error formats
      let errorMessage = 'Unknown error';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && error.message) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      // Show user-friendly error toast for important socket errors
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('Failed to send message')) {
        toast.error('Chat error: ' + errorMessage, { id: 'socket-error' });
      }
      
      // Emit error event for components to handle
      this.triggerEvent('socket_error', { error, message: errorMessage });
    });
    
    // Handle server-side events
    this.socket.on('new_message', (message) => {
      this.log('📩 Received new message:', message);
      
      // If this is an image message, start preloading the image right away
      if (message.messageType === 'image' && message.image?.url) {
        // Import dynamically to avoid circular dependencies
        import('./imageService').then(module => {
          const imageService = module.default;
          imageService.preloadImage(message.image.url)
            .then(() => this.log('🖼️ Preloaded image from socket message:', message.image.url))
            .catch(err => this.log('❌ Failed to preload image:', err));
        });
      }
      
      this.triggerEvent('new_message', message);
    });
    
    // Handle heartbeat responses here too
    this.socket.on('heartbeat_response', (data) => {
      this.log('💓 Heartbeat response received:', data);
      // Calculate latency if server sent back our timestamp
      if (data && data.receivedTime) {
        const latency = Date.now() - data.receivedTime;
        this.log(`💓 Connection latency: ${latency}ms`);
      }
    });
    
    this.socket.on('message_sent', (data) => {
      this.log('✅ Message sent confirmation:', data);
      
      // Check for a client message ID (for mapping to pending messages)
      let clientMessageId = null;
      
      // First check if we have a direct client message ID
      if (data.clientMessageId) {
        clientMessageId = data.clientMessageId;
      } 
      // If not, look through pending messages to find a match by server message ID
      else if (data.messageId) {
        // Find the pending message that corresponds to this server message
        const pendingMessageEntry = Object.entries(this.pendingMessages).find(
          ([_, value]) => value.tempMessageId === data.messageId
        );
        
        if (pendingMessageEntry) {
          [clientMessageId] = pendingMessageEntry;
        }
      }
      
      // If we found the corresponding message, clear it from pending
      if (clientMessageId && this.pendingMessages[clientMessageId]) {
        this.log('✅ Clearing pending message:', clientMessageId);
        
        // Clear any timeouts for this message
        if (this.messageTimeouts[clientMessageId]) {
          clearTimeout(this.messageTimeouts[clientMessageId]);
          delete this.messageTimeouts[clientMessageId];
        }
        
        // Remove from pending messages
        delete this.pendingMessages[clientMessageId];
      }
      
      // Trigger event for UI updates
      this.triggerEvent('message_sent', data);
    });
    
    this.socket.on('connection_status', (status) => {
      this.log('🔌 Connection status update from server:', status);
      this.isConnected = status.connected;
      
      // Trigger internal connection status event
      this.triggerEvent('__internal__connection_status', status);
    });
    
    this.socket.on('joined_chat', (data) => {
      this.log('🚪 Joined chat room:', data);
      
      // Add room to active rooms list
      if (data.contractId) {
        this.activeRooms[data.contractId] = true;
      }
      
      this.triggerEvent('joined_chat', data);
    });
    
    this.socket.on('messages_read', (data) => {
      this.log('👁️ Messages read notification:', data);
      this.triggerEvent('messages_read', data);
    });
    
    this.socket.on('contract_updated', (data) => {
      this.log('📋 Contract updated notification:', data);
      this.triggerEvent('contract_updated', data);
    });
  }
  
  // Start connection status monitoring
  startConnectionMonitoring() {
    // Clear existing intervals
    if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    // Check connection status periodically
    this.connectionCheckInterval = setInterval(() => {
      if (this.socket) {
        const currentStatus = this.socket.connected;
        
        // If our tracking doesn't match reality, update it
        if (this.isConnected !== currentStatus) {
          this.log('🔄 Connection state mismatch, updating:', 
            { wasConnected: this.isConnected, actuallyConnected: currentStatus });
          this.isConnected = currentStatus;
          this.emitConnectionStatus(currentStatus);
        }
      }
    }, 5000);
    
    // Send periodic heartbeats to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        try {
          // Use 'heartbeat' event instead of 'ping' which is reserved in Socket.io
          this.socket.emit('heartbeat', { timestamp: Date.now() }, (response) => {
            if (response && response.status === 'ok') {
              this.log('💓 Heartbeat successful at:', new Date().toISOString());
            } else {
              this.log('💓 Heartbeat received but invalid response:', response);
            }
          });
        } catch (err) {
          // Don't log heartbeat errors to avoid console spam
          // Just silently continue as the connection check will detect real issues
        }
      }
    }, 25000);
  }
  
  // Emit connection status to subscribers
  emitConnectionStatus(connected, reason = null) {
    // Show toast only on status changes to avoid spamming
    const statusChanged = this._lastConnectedStatus !== connected;
    this._lastConnectedStatus = connected;
    
    if (statusChanged) {
      if (connected) {
        toast.success('Chat connected', { id: 'socket-connected', duration: 2000 });
      } else if (reason !== 'io client disconnect') {
        // Don't show disconnection message if we intentionally disconnected
        toast.error('Chat disconnected. Reconnecting...', { id: 'socket-disconnected' });
      }
    }
    
    // Notify all subscribers
    this.triggerEvent('connection_status', { connected, reason });
  }
  
  // Rejoin all previously joined rooms
  rejoinRooms() {
    if (this.rooms.size > 0) {
      this.log('🔄 Rejoining rooms:', Array.from(this.rooms));
      this.rooms.forEach(contractId => {
        this.joinChat(contractId);
      });
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.socket && this.socket.connected && this.isConnected;
  }
  
  // Register event listener
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    this.eventListeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      }
    };
  }
  
  // Trigger event for all listeners
  triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
  
  // Join a chat room
  joinChat(contractId) {
    if (!contractId) return false;
    
    this.rooms.add(contractId);
    
    if (!this.isSocketConnected()) {
      this.log('⚠️ Socket not connected when trying to join room. Will join after reconnection.');
      this.reconnect();
      return false;
    }
    
    this.log('🚪 Joining chat room:', contractId);
    this.socket.emit('join_chat', { contractId });
    return true;
  }
  
  // Leave a chat room
  leaveChat(contractId) {
    if (!contractId) return false;
    
    this.rooms.delete(contractId);
    
    if (!this.isSocketConnected()) {
      return false;
    }
    
    this.log('🚪 Leaving chat room:', contractId);
    this.socket.emit('leave_chat', { contractId });
    return true;
  }
  
  /**
   * Send a message through the socket
   * @param {string} contractId - ID of the contract
   * @param {Object} message - Message object with content, messageType, etc.
   * @param {string} message.content - Message text content
   * @param {string} message.messageType - Type of message: 'text', 'image', 'counterOffer'
   * @param {Object} message.offer - Offer details (for counter offers)
   * @param {Object} message.image - Image data (for image messages)
   * @returns {boolean} - Whether the message was sent via socket
   */
  sendMessage(contractId, message) {
    if (!this.isSocketConnected() || !contractId) {
      return false;
    }
    
    try {
      // Generate a unique client message ID for tracking
      const clientMessageId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Note: For images, we don't send via socket since they need to be uploaded
      // Images are sent directly to the API endpoint
      if (message.messageType === 'image') {
        return false; 
      }
      
      // Validate and ensure message object has valid content to prevent errors
      const messageData = {
        messageType: message.messageType || 'text',
        // Ensure content is always a string, never undefined
        content: typeof message.content === 'string' ? message.content : '',
        senderId: message.senderId,
        clientMessageId,
        tempId: message.tempId, // Store temp ID if provided
      };
      
      // Add offer data if present for counter offers
      if (message.offer) {
        messageData.offer = message.offer;
      }
      
      // Add message to pending list
      this.pendingMessages[clientMessageId] = {
        contractId,
        message: messageData,
        timestamp: Date.now(),
        tempMessageId: message.tempId // Store temp ID if provided
      };
      
      // Set timeout for uncertainty
      this.messageTimeouts[clientMessageId] = setTimeout(() => {
        // If message is still pending after timeout, mark as uncertain
        if (this.pendingMessages[clientMessageId]) {
          this.log('⚠️ Message delivery uncertain:', clientMessageId);
          
          // Trigger uncertainty event for UI
          this.triggerEvent('message_uncertainty', {
            clientMessageId,
            message: this.pendingMessages[clientMessageId].message
          });
          
          // Keep in pending list for potential completion
        }
      }, 5000); // 5 second timeout
      
      // Emit the message through socket
      this.socket.emit('send_message', {
        contractId,
        clientMessageId,
        ...messageData
      });
      
      this.log('📤 Message sent through socket:', { contractId, clientMessageId, messageData });
      return true;
    } catch (error) {
      this.log('❌ Error sending message through socket:', error);
      return false;
    }
  }
  
  // Process pending messages
  processPendingMessages() {
    if (Object.keys(this.pendingMessages).length === 0) return;
    
    this.log('📩 Processing pending messages:', Object.keys(this.pendingMessages).length);
    
    // Process oldest messages first
    const messages = Object.entries(this.pendingMessages).sort((a, b) => a[1].timestamp - b[1].timestamp);
    this.pendingMessages = {};
    
    // Send each message
    messages.forEach(([clientMessageId, { contractId, message }]) => {
      this.log('📤 Sending pending message for contract:', contractId);
      this.sendMessage(contractId, message);
    });
  }
  
  // Mark messages as read
  markMessagesAsRead(contractId) {
    if (!this.isSocketConnected()) {
      this.log('⚠️ Cannot mark messages as read - not connected');
      return false;
    }
    
    this.log('👁️ Marking messages as read for contract:', contractId);
    this.socket.emit('mark_messages_read', { contractId });
    return true;
  }
  
  // Accept an offer
  acceptOffer(contractId) {
    if (!contractId) {
      this.log('⚠️ Cannot accept offer - no contract ID provided');
      return false;
    }
    
    if (!this.isSocketConnected()) {
      this.log('⚠️ Cannot accept offer via socket - not connected');
      // Return true anyway so the UI knows we'll handle it via API fallback
      return true;
    }
    
    try {
      this.log('🤝 Accepting offer for contract:', contractId);
      this.socket.emit('accept_offer', { contractId });
      return true;
    } catch (error) {
      this.log('❌ Error accepting offer via socket:', error);
      return false;
    }
  }
  
  // Reconnect to the socket server
  async reconnect() {
    if (this.isSocketConnected()) {
      this.log('✅ Already connected, no need to reconnect');
      return true;
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.log('❌ Max reconnect attempts reached');
      toast.error('Unable to connect to chat. Please refresh the page.');
      return false;
    }
    
    this.log('🔄 Attempting to reconnect... Attempt:', this.reconnectAttempts);
    
    try {
      if (this.socket) {
        this.socket.connect();
        return true;
      } else if (this.token) {
        await this.init(this.token);
        return true;
      } else {
        this.log('❌ Cannot reconnect - no token available');
        return false;
      }
    } catch (error) {
      this.log('❌ Reconnect failed:', error);
      return false;
    }
  }
  
  // Disconnect from the socket server
  disconnect() {
    this.cleanup();
    this.log('🔌 Socket disconnected');
  }
  
  // Clean up resources
  cleanup() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.socket) {
      // Remove all listeners
      this.socket.removeAllListeners();
      
      // Disconnect
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService; 