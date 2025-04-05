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
      
      // Create new socket connection
      this.socket = io(baseURL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000, // Increased timeout
        forceNew: true // Force new connection
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
      toast.error('Chat error: ' + (error.message || 'Unknown error'));
    });
    
    // Handle server-side events
    this.socket.on('new_message', (message) => {
      this.log('📩 Received new message:', message);
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
  
  // Send a message via socket
  sendMessage(contractId, message) {
    if (!this.isSocketConnected()) {
      this.log('⚠️ Cannot send message - not connected');
      return false;
    }
    
    try {
      // Generate a unique client message ID if one isn't provided
      if (!message.clientMessageId) {
        message.clientMessageId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      }
      
      this.log('📤 Sending message to contract:', contractId);
      
      // Add message to pending messages registry
      this.pendingMessages[message.clientMessageId] = {
        contractId,
        message,
        sentAt: Date.now(),
        attempts: 1
      };
      
      // Set up timeout for message uncertainty
      const uncertaintyTimeout = setTimeout(() => {
        // If message is still pending after timeout
        if (this.pendingMessages[message.clientMessageId]) {
          this.log('⚠️ No acknowledgement received for message:', message.clientMessageId);
          
          // Emit uncertainty event for UI updates
          this.triggerEvent('message_uncertainty', {
            clientMessageId: message.clientMessageId,
            contractId,
            message
          });
          
          // Keep message in pending - will be retried on reconnection
        }
      }, 8000);
      
      // Store the uncertainty timeout reference
      this.messageTimeouts[message.clientMessageId] = uncertaintyTimeout;
      
      // Send the message through socket
      this.socket.emit('send_message', { 
        contractId, 
        message
      });
      
      // Message was sent successfully (but not yet confirmed by server)
      return true;
    } catch (error) {
      this.log('❌ Error sending message:', error);
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