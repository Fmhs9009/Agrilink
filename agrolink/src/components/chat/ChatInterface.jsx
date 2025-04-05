import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaPaperPlane, FaSpinner, FaChevronLeft, FaExclamationTriangle, FaHandshake, FaFileContract, FaUser, FaCalculator, FaCalendarAlt, FaMoneyBillWave, FaCheck, FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import socketService from '../../services/socket';
import authService from '../../services/auth/authService';

const ChatInterface = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contract, setContract] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerFormData, setOfferFormData] = useState({
    pricePerUnit: '',
    quantity: '',
    deliveryDate: '',
    qualityRequirements: '',
    specialRequirements: ''
  });
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  
  // Determine if user is farmer or buyer
  const isFarmer = contract?.farmer?._id === user?._id;
  const otherParty = isFarmer ? contract?.buyer : contract?.farmer;
  
  // Initialize socket connection
  useEffect(() => {
    const setupChat = async () => {
      setLoading(true);
      
      try {
        // 1. Get authentication token
        const token = authService.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // 2. Initialize socket if needed
        let socketInitialized = false;
        try {
          if (!socketService.isSocketConnected()) {
            console.log('🔌 Initializing socket connection');
            const socket = await socketService.init(token);
            socketInitialized = socket !== null;
          } else {
            socketInitialized = true;
          }
        } catch (socketError) {
          console.error('Failed to initialize socket:', socketError);
          // Continue anyway - we'll use REST API as fallback
        }
        
        // 3. Join the chat room for this contract (if socket is working)
        if (socketInitialized && socketService.isSocketConnected()) {
          console.log('🚪 Joining chat room for contract:', contractId);
          socketService.joinChat(contractId);
        }
        
        // 4. Set up connection status listener
        const connectionStatusUnsubscribe = socketService.on('connection_status', (status) => {
          console.log('🔌 Connection status changed:', status);
          setSocketConnected(status.connected);
          
          // If reconnected and there were connection issues, refresh messages
          if (status.connected && connectionIssue) {
            console.log('🔄 Reconnected after connection issues, refreshing messages');
            refreshMessages();
            setConnectionIssue(false);
          } else if (!status.connected) {
            setConnectionIssue(true);
          }
        });
        
        // 5. Set up message listeners even if socket isn't connected (for future reconnection)
        const newMessageUnsubscribe = socketService.on('new_message', (message) => {
          console.log('📩 New message received:', message);
          
          // Only handle messages for this contract
          if (message.contractId !== contractId) return;
          
          // Add message to state (avoiding duplicates)
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(m => m._id === message._id);
            if (exists) return prev;
            
            // Check if there's a temporary message to replace
            if (message.messageType === 'text') {
              const tempIndex = prev.findIndex(m => 
                m.isTemp && 
                m.content === message.content && 
                m.senderId._id === message.senderId._id
              );
              
              if (tempIndex >= 0) {
                // Replace temp message with real one
                const newMessages = [...prev];
                newMessages[tempIndex] = message;
                return newMessages;
              }
            }
            
            // Check for temporary counter offer messages
            if (message.messageType === 'counterOffer') {
              const tempIndex = prev.findIndex(m => 
                m.isTemp && 
                m.messageType === 'counterOffer' && 
                m.senderId._id === message.senderId._id
              );
              
              if (tempIndex >= 0) {
                // Replace temp counter offer with real one
                const newMessages = [...prev];
                newMessages[tempIndex] = message;
                return newMessages;
              }
            }
            
            // Otherwise add as new message
            return [...prev, message];
          });
          
          // Auto scroll to bottom
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        });
        
        // 6. Set up message sent confirmation listener
        const messageSentUnsubscribe = socketService.on('message_sent', (data) => {
          console.log('✅ Message sent confirmation:', data);
          
          if (data.success) {
            // Update sending status
            setSendingMessage(false);
            
            // Update any temp messages with confirmed ID
            if (data.messageId) {
              setMessages(prev => 
                prev.map(msg => {
                  if (msg.isTemp) {
                    return {
                      ...msg,
                      _id: data.messageId,
                      isTemp: false,
                      status: 'delivered'
                    };
                  }
                  return msg;
                })
              );
            }
          }
        });
        
        // 7. Set up message uncertainty listener (when delivery is uncertain)
        const messageUncertaintyUnsubscribe = socketService.on('message_uncertainty', (data) => {
          console.log('⚠️ Message delivery uncertain:', data);
          
          // Find and update the temporary message
          setMessages(prev => 
            prev.map(msg => {
              if (msg.isTemp && msg.content === data.message.content) {
                return {
                  ...msg,
                  status: 'uncertain'
                };
              }
              return msg;
            })
          );
        });
        
        // 8. Set initial connection status based on current socket state
        setSocketConnected(socketService.isSocketConnected());
        
        // 9. Clean up function
        return () => {
          console.log('🧹 Cleaning up chat interface');
          connectionStatusUnsubscribe();
          newMessageUnsubscribe();
          messageSentUnsubscribe();
          messageUncertaintyUnsubscribe();
          socketService.leaveChat(contractId);
        };
        
      } catch (error) {
        console.error('❌ Error setting up chat:', error);
        toast.error('Chat connection issues detected. Falling back to basic mode.');
        setError('Chat connection issues detected');
        setConnectionIssue(true);
        // Continue to load the chat even with errors - will use REST API
      } finally {
        setLoading(false);
      }
    };
    
    setupChat();
  }, [contractId, connectionIssue]);
  
  // Function to force reconnect socket
  const forceReconnect = () => {
    try {
      console.log("Forcing socket reconnection...");
      socketService.disconnect();
      
      setTimeout(() => {
        const token = authService.getToken();
        if (token) {
          socketService.init(token);
          
          // After reconnection, check if we need to refresh messages
          setTimeout(() => {
            if (socketService.isSocketConnected()) {
              setSocketConnected(true);
              refreshMessages();
              socketService.joinChat(contractId);
            } else {
              toast.error("Could not reconnect. Try refreshing the page.");
            }
          }, 1000);
        }
      }, 500);
    } catch (error) {
      console.error("Error reconnecting socket:", error);
      toast.error("Connection error. Please refresh the page.");
    }
  };
  
  // Listen for socket connection status changes
  useEffect(() => {
    const connectionStatusListener = socketService.on('__internal__connection_status', (status) => {
      console.log("Connection status changed:", status);
      setSocketConnected(status.connected);
      setConnectionIssue(!status.connected);
      
      if (status.connected && connectionIssue) {
        // Reconnected after an issue - refresh messages
        refreshMessages();
      }
    });
    
    return () => {
      if (connectionStatusListener) connectionStatusListener();
    };
  }, [connectionIssue]);
  
  // Function to refresh messages after reconnection
  const refreshMessages = async () => {
    try {
      const response = await api.get(`/chat/contracts/${contractId}/messages`);
      
      if (response.data && response.data.messages) {
        // Get existing temp messages that are not yet confirmed
        const tempMessages = messages.filter(msg => msg.isTemp);
        
        // Get confirmed messages from server
        const confirmedMessages = response.data.messages;
        
        // Create a new array with confirmed messages first, then any pending temps
        // that aren't already in the confirmed list (to avoid duplicates)
        const mergedMessages = [...confirmedMessages];
        
        // Add temp messages that don't have a match in confirmed messages
        tempMessages.forEach(tempMsg => {
          // Skip if we already have a confirmed message with the same content and sender
          const hasConfirmed = confirmedMessages.some(
            confirmedMsg => 
              confirmedMsg.content === tempMsg.content && 
              confirmedMsg.senderId._id === tempMsg.senderId._id &&
              confirmedMsg.messageType === tempMsg.messageType
          );
          
          if (!hasConfirmed) {
            mergedMessages.push(tempMsg);
          }
        });
        
        // Sort by timestamp
        mergedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Update messages state
        setMessages(mergedMessages);
        
        // Restart the connection lost indicator
        setConnectionIssue(false);
        
        // Update oldest message timestamp for pagination
        if (confirmedMessages.length > 0) {
          setOldestMessageTimestamp(confirmedMessages[0].createdAt);
        }
        
        // Rejoin the chat room
        if (socketService.isSocketConnected()) {
          socketService.joinChat(contractId);
        }
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      setConnectionIssue(true);
    }
  };
  
  // Fetch contract details
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await api.get(`/contracts/${contractId}`);
        if (response.data && (response.data.contract || response.data)) {
          setContract(response.data.contract || response.data);
          
          // Initialize offer form with current contract values
          const contractData = response.data.contract || response.data;
          setOfferFormData({
            pricePerUnit: contractData.pricePerUnit || '',
            quantity: contractData.quantity || '',
            deliveryDate: contractData.deliveryDate ? new Date(contractData.deliveryDate).toISOString().split('T')[0] : '',
            qualityRequirements: contractData.qualityRequirements || '',
            specialRequirements: contractData.specialRequirements || ''
          });
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
        setError('Failed to load contract details');
      }
    };
    
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);
  
  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/chat/contracts/${contractId}/messages`);
        
        if (response.data && response.data.messages) {
          setMessages(response.data.messages);
          
          // Set oldest message timestamp for pagination
          if (response.data.messages.length > 0) {
            setOldestMessageTimestamp(response.data.messages[0].createdAt);
          }
          
          // If fewer messages returned than limit, we've reached the end
          if (response.data.messages.length < 20) {
            setHasMoreMessages(false);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load chat messages');
      } finally {
        setLoading(false);
      }
    };
    
    if (contractId) {
      fetchMessages();
    }
  }, [contractId]);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (!loading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);
  
  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await api.put(`/chat/contracts/${contractId}/messages/read`);
        
        // If socket is connected, also notify via socket
        if (socketService.isSocketConnected()) {
          socketService.markMessagesAsRead(contractId);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    
    if (contractId && !loading && messages.length > 0) {
      markAsRead();
    }
  }, [contractId, messages, loading]);
  
  // Load more (older) messages
  const handleLoadMore = async () => {
    if (!hasMoreMessages || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const response = await api.get(`/chat/contracts/${contractId}/messages`, {
        params: { before: oldestMessageTimestamp, limit: 20 }
      });
      
      if (response.data && response.data.messages) {
        const olderMessages = response.data.messages;
        
        // Append older messages to the beginning of the messages array
        setMessages(prevMessages => [...olderMessages, ...prevMessages]);
        
        // Update oldest timestamp for next pagination
        if (olderMessages.length > 0) {
          setOldestMessageTimestamp(olderMessages[0].createdAt);
        }
        
        // If fewer messages returned than limit, we've reached the end
        if (olderMessages.length < 20) {
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const text = messageText.trim();
    if (!text) return;
    
    console.log('📤 Sending message:', text);
    
    try {
      // Clear input field immediately for better UX
      setMessageText('');
      setSendingMessage(true);
      
      // Create a temporary message for instant feedback
      const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const tempMessage = {
        _id: tempId,
        isTemp: true,
        contractId,
        content: text,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        senderId: {
          _id: user._id,
          Name: user.Name,
          photo: user.photo
        },
        status: 'sending'
      };
      
      // Add to message list
      setMessages(prev => [...prev, tempMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      
      // Prepare message data
      const messageData = {
        content: text,
        senderId: user._id,
        messageType: 'text'
      };
      
      // Try sending through socket first
      let sentViaSocket = false;
      if (socketService.isSocketConnected()) {
        sentViaSocket = socketService.sendMessage(contractId, messageData);
        console.log('📤 Sent via socket:', sentViaSocket);
      }
      
      // If socket send failed, use REST API
      if (!sentViaSocket) {
        console.log('📤 Sending via API instead');
        const response = await api.post(`/chat/contracts/${contractId}/messages`, messageData);
        
        if (response.data && response.data.message) {
          // Replace temp message with real one
          setMessages(prev => {
            return prev.map(msg => {
              if (msg._id === tempId) {
                return response.data.message;
              }
              return msg;
            });
          });
          
          setSendingMessage(false);
        }
      }
      
      // Set a safety timeout to ensure UI doesn't get stuck
      setTimeout(() => {
        setSendingMessage(false);
        
        // Check if the temp message is still in 'sending' state
        setMessages(prev => {
          const hasUnconfirmedMessage = prev.some(msg => 
            msg._id === tempId && msg.isTemp && msg.status === 'sending');
          
          if (hasUnconfirmedMessage) {
            console.log('⚠️ Message still unconfirmed after timeout');
            return prev.map(msg => {
              if (msg._id === tempId && msg.isTemp) {
                return {
                  ...msg,
                  status: 'uncertain',
                  content: `${msg.content} (delivery unconfirmed)`
                };
              }
              return msg;
            });
          }
          
          return prev;
        });
      }, 8000);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
      
      // Mark temp message as failed
      setMessages(prev => 
        prev.map(msg => {
          if (msg._id.startsWith('temp-') && msg.isTemp) {
            return { ...msg, status: 'failed' };
          }
          return msg;
        })
      );
      
      setSendingMessage(false);
    }
  };
  
  // Retry sending a failed message
  const handleRetryMessage = (messageId) => {
    // Find the failed message
    const failedMessage = messages.find(msg => msg._id === messageId);
    if (!failedMessage) return;
    
    // Remove the failed message
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
    
    // Put the content back in the input field
    setMessageText(failedMessage.content.replace(' (delivery unconfirmed)', ''));
    
    // Focus the input field
    setTimeout(() => {
      const inputEl = document.getElementById('message-input');
      if (inputEl) inputEl.focus();
    }, 0);
  };
  
  // Handle counter offer form changes
  const handleOfferChange = (e) => {
    const { name, value } = e.target;
    setOfferFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle sending a counter offer
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    
    try {
      setSendingMessage(true);
      
      // Validate form
      if (!offerFormData.pricePerUnit || !offerFormData.quantity || !offerFormData.deliveryDate) {
        toast.error('Please fill all required fields in the offer');
        setSendingMessage(false);
        return;
      }
      
      // Generate a unique client message ID for tracking
      const clientMessageId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Create a temporary message for UI feedback
      const tempId = 'temp-offer-' + Date.now();
      const tempOfferMessage = {
        _id: tempId,
        contractId,
        senderId: {
          _id: user._id,
          Name: user.Name,
          photo: user.photo
        },
        recipientId: otherParty?._id,
        messageType: 'counterOffer',
        content: `I'm proposing new terms for our contract.`,
        offer: {
          pricePerUnit: parseFloat(offerFormData.pricePerUnit),
          quantity: parseInt(offerFormData.quantity),
          deliveryDate: new Date(offerFormData.deliveryDate).toISOString(),
          qualityRequirements: offerFormData.qualityRequirements,
          specialRequirements: offerFormData.specialRequirements
        },
        createdAt: new Date().toISOString(),
        isTemp: true,
        status: 'sending'
      };
      
      // Add temp offer to UI immediately
      setMessages(prev => [...prev, tempOfferMessage]);
      
      // Hide form after sending
      setShowOfferForm(false);
      
      // Update contract status in UI immediately for better UX
      setContract(prev => ({
        ...prev,
        status: 'negotiating'
      }));
      
      const offerMessage = {
        content: `I'm proposing new terms for our contract.`,
        messageType: 'counterOffer',
        clientMessageId,
        offer: {
          pricePerUnit: parseFloat(offerFormData.pricePerUnit),
          quantity: parseInt(offerFormData.quantity),
          deliveryDate: new Date(offerFormData.deliveryDate).toISOString(),
          qualityRequirements: offerFormData.qualityRequirements,
          specialRequirements: offerFormData.specialRequirements
        }
      };
      
      // If socket is connected, send via socket for real-time delivery
      if (socketService.isSocketConnected()) {
        const messageSent = socketService.sendMessage(contractId, offerMessage);
        
        if (!messageSent) {
          // Fallback to REST API if socket fails
          await api.post(`/chat/contracts/${contractId}/messages`, offerMessage);
        }
      } else {
        // Use REST API if socket is not connected
        await api.post(`/chat/contracts/${contractId}/messages`, offerMessage);
      }
      
      toast.success('Counter offer sent successfully');
    } catch (error) {
      console.error('Error sending counter offer:', error);
      toast.error('Failed to send counter offer');
      
      // Remove temporary offer on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
      
      // Revert UI changes on error
      setShowOfferForm(true);
      
      // Only revert contract status if we're not already negotiating
      if (contract?.status !== 'negotiating') {
        setContract(prev => ({
          ...prev,
          status: prev.status
        }));
      }
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Accept offer function
  const handleAcceptOffer = async () => {
    try {
      // Show confirmation
      const confirmed = window.confirm("Are you sure you want to accept this offer?");
      if (!confirmed) return;
      
      setSendingMessage(true);
      
      // Create a temporary system message for immediate UI feedback
      const tempId = 'temp-accept-' + Date.now();
      const tempSystemMessage = {
        _id: tempId,
        contractId,
        senderId: {
          _id: user._id,
          Name: user.Name,
          photo: user.photo
        },
        recipientId: otherParty?._id, 
        messageType: 'systemMessage',
        content: `${user.Name} has accepted the contract offer.`,
        createdAt: new Date().toISOString(),
        isTemp: true
      };
      
      // Add temp system message to UI immediately
      setMessages(prev => [...prev, tempSystemMessage]);
      
      // Update contract status in UI immediately
      setContract(prev => ({
        ...prev,
        status: 'accepted'
      }));
      
      // Display success message immediately
      toast.success('Offer accepted successfully');
      
      // Try socket first, fall back to API if needed
      let sentViaSocket = false;
      if (socketService.isSocketConnected()) {
        try {
          sentViaSocket = socketService.acceptOffer(contractId);
        } catch (socketError) {
          console.error('Socket error when accepting offer:', socketError);
          sentViaSocket = false;
        }
      }
      
      // Use REST API if socket didn't work
      if (!sentViaSocket) {
        try {
          await api.post(`/chat/contracts/${contractId}/accept-offer`);
        } catch (apiError) {
          console.error('API error when accepting offer:', apiError);
          throw apiError; // Re-throw to be caught by outer catch
        }
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer');
      
      // Revert UI changes on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
      
      setContract(prev => ({
        ...prev,
        status: 'negotiating'
      }));
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Render message item
  const MessageItem = ({ message }) => {
    const isCurrentUser = message.senderId._id === user._id;
    const formattedTime = formatMessageTime(message.createdAt);
    
    return (
      <div 
        className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isCurrentUser && !message.messageType === 'systemMessage' && (
          <div className="w-8 h-8 rounded-full overflow-hidden mr-2 mt-1">
            {message.senderId.photo ? (
              <img 
                src={message.senderId.photo} 
                alt={message.senderId.Name}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                <FaUser className="text-sm" />
              </div>
            )}
          </div>
        )}
        
        <div className={`max-w-[75%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
          {/* Message bubble */}
          <div 
            className={`rounded-lg p-3 ${
              message.messageType === 'systemMessage' 
                ? 'bg-gray-100 text-gray-700 italic mx-auto text-center max-w-md' 
                : isCurrentUser 
                  ? `bg-blue-600 text-white ${message.isTemp ? 'opacity-80' : ''}`
                  : 'bg-gray-200 text-gray-800'
            }`}
          >
            {/* Message content */}
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            {/* Delivery status for current user's messages */}
            {isCurrentUser && message.isTemp && (
              <div className="mt-1 text-xs text-blue-200 flex items-center justify-end">
                {message.status === 'failed' ? (
                  <button 
                    onClick={() => handleRetryMessage(message._id)}
                    className="text-red-300 hover:text-red-100 flex items-center"
                  >
                    <FaExclamationTriangle className="mr-1" /> Failed - Click to retry
                  </button>
                ) : (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-1" /> Sending...
                  </span>
                )}
              </div>
            )}
            
            {/* Special display for offer messages */}
            {message.messageType === 'offerMessage' && message.offer && (
              <div className="mt-2 pt-2 border-t border-opacity-20 border-gray-200 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Price:</span>
                    <span className="ml-1 font-medium">₹{message.offer.pricePerUnit || 0}</span>
                  </div>
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Quantity:</span>
                    <span className="ml-1 font-medium">{(message.offer.quantity || 0)} {contract?.unit || 'units'}</span>
                  </div>
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Delivery:</span>
                    <span className="ml-1 font-medium">{message.offer.deliveryDate ? new Date(message.offer.deliveryDate).toLocaleDateString() : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Total:</span>
                    <span className="ml-1 font-medium">₹{(parseFloat(message.offer.pricePerUnit || 0) * parseFloat(message.offer.quantity || 0)).toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Offer response buttons for other party */}
                {!isCurrentUser && contract?.status === 'negotiating' && (
                  <div className="mt-2 pt-2 border-t border-opacity-20 border-gray-200 flex justify-between">
                    <button 
                      onClick={() => handleAcceptOffer()}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center"
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? <FaSpinner className="animate-spin mr-1" /> : <FaCheck className="mr-1" />}
                      Accept
                    </button>
                    <button 
                      onClick={() => {
                        setOfferFormData({
                          pricePerUnit: message.offer.pricePerUnit || '',
                          quantity: message.offer.quantity || '',
                          deliveryDate: message.offer.deliveryDate ? new Date(message.offer.deliveryDate).toISOString().split('T')[0] : '',
                          qualityRequirements: message.offer.qualityRequirements || '',
                          specialRequirements: message.offer.specialRequirements || ''
                        });
                        setShowOfferForm(true);
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center"
                    >
                      <FaHandshake className="mr-1" /> Counter
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Special display for counter offer messages */}
            {message.messageType === 'counterOffer' && message.offer && (
              <div className="mt-2 pt-2 border-t border-opacity-20 border-gray-200 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Price:</span>
                    <span className="ml-1 font-medium">₹{message.offer.pricePerUnit || 0}</span>
                  </div>
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Quantity:</span>
                    <span className="ml-1 font-medium">{(message.offer.quantity || 0)} {contract?.unit || 'units'}</span>
                  </div>
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Delivery:</span>
                    <span className="ml-1 font-medium">{message.offer.deliveryDate ? new Date(message.offer.deliveryDate).toLocaleDateString() : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className={isCurrentUser ? 'text-blue-200' : 'text-gray-600'}>Total:</span>
                    <span className="ml-1 font-medium">₹{(parseFloat(message.offer.pricePerUnit || 0) * parseFloat(message.offer.quantity || 0)).toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Offer response buttons for other party */}
                {!isCurrentUser && contract?.status === 'negotiating' && (
                  <div className="mt-2 pt-2 border-t border-opacity-20 border-gray-200 flex justify-between">
                    <button 
                      onClick={() => handleAcceptOffer()}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center"
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? <FaSpinner className="animate-spin mr-1" /> : <FaCheck className="mr-1" />}
                      Accept
                    </button>
                    <button 
                      onClick={() => {
                        setOfferFormData({
                          pricePerUnit: message.offer.pricePerUnit || '',
                          quantity: message.offer.quantity || '',
                          deliveryDate: message.offer.deliveryDate ? new Date(message.offer.deliveryDate).toISOString().split('T')[0] : '',
                          qualityRequirements: message.offer.qualityRequirements || '',
                          specialRequirements: message.offer.specialRequirements || ''
                        });
                        setShowOfferForm(true);
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center"
                    >
                      <FaHandshake className="mr-1" /> Counter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Timestamp and sender info */}
          <div className={`flex items-center mt-1 text-xs text-gray-500 ${
            isCurrentUser ? 'justify-end' : 'justify-start'
          }`}>
            {!isCurrentUser && !message.messageType === 'systemMessage' && (
              <span className="mr-1 font-medium">{message.senderId.Name}</span>
            )}
            <span>{formattedTime}</span>
          </div>
        </div>
        
        {isCurrentUser && !message.messageType === 'systemMessage' && (
          <div className="w-8 h-8 rounded-full overflow-hidden ml-2 mt-1">
            {message.senderId.photo ? (
              <img 
                src={message.senderId.photo} 
                alt="You"
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-blue-300 flex items-center justify-center text-blue-600">
                <FaUser className="text-sm" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  if (loading) {
    return <LoadingSpinner message="Loading chat..." />;
  }
  
  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Chat</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/contracts')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Contracts
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md h-[calc(100vh-180px)] flex flex-col">
      {/* Chat header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/contracts')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <FaChevronLeft />
          </button>
          
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden mr-3 flex-shrink-0">
              {otherParty?.image ? (
                <img 
                  src={otherParty.image} 
                  alt={otherParty.Name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600">
                  <FaUser />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium">{otherParty?.Name || 'Unknown User'}</h3>
              <div className="flex items-center text-xs text-gray-500">
                <FaFileContract className="mr-1" />
                <span>
                  {contract?.crop?.name || 'Contract'} #{contract?._id?.substring(0, 8) || ''}
                </span>
                <span className="mx-1">•</span>
                <span className={`
                  ${contract?.status === 'accepted' ? 'text-green-600' : ''}
                  ${contract?.status === 'negotiating' ? 'text-blue-600' : ''}
                  ${contract?.status === 'requested' ? 'text-yellow-600' : ''}
                  ${contract?.status === 'cancelled' ? 'text-red-600' : ''}
                `}>
                  {contract?.status?.charAt(0).toUpperCase() + contract?.status?.slice(1)}
                </span>
                
                {/* Connection status indicator */}
                <span className="mx-1">•</span>
                <span className={`flex items-center ${socketConnected ? 'text-green-600' : 'text-red-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'} mr-1`}></span>
                  {socketConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          {/* Contract details button */}
          <button 
            onClick={() => navigate(`/contracts/${contractId}`)}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center transition-colors"
          >
            <FaFileContract className="mr-1" /> Contract Details
          </button>
        </div>
      </div>
      
      {/* Connection issue banner */}
      {connectionIssue && (
        <div className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2 flex items-center justify-center">
          <FaExclamationTriangle className="mr-2" />
          Connection issues detected. Messages may not appear in real-time.
          <button 
            onClick={forceReconnect}
            className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Reconnect
          </button>
        </div>
      )}
      
      {/* Socket status indicator when not in connection issue state */}
      {!connectionIssue && !socketConnected && (
        <div className="bg-red-100 text-red-800 text-sm px-4 py-2 flex items-center justify-center">
          <FaExclamationTriangle className="mr-2" />
          Offline mode. Messages will not update in real-time.
          <button 
            onClick={forceReconnect}
            className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Try to Connect
          </button>
        </div>
      )}
      
      {/* Connection Status Indicator */}
      <div className="px-3 py-1 text-xs border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className={`flex items-center ${socketConnected ? 'text-green-600' : 'text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'} mr-1`}></span>
            {socketConnected ? 'Connected' : 'Disconnected'}
          </span>
          
          {!socketConnected && (
            <button 
              onClick={forceReconnect}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <FaSpinner className={`mr-1 ${connectionIssue ? 'animate-spin' : ''}`} /> Reconnect
            </button>
          )}
          
          {connectionIssue && socketConnected && (
            <button 
              onClick={refreshMessages}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
              <FaSpinner className="mr-1" /> Refresh Messages
            </button>
          )}
        </div>
      </div>
      
      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {/* Load More Button */}
        {hasMoreMessages && !loadingMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleLoadMore}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm"
            >
              Load earlier messages
            </button>
          </div>
        )}
        
        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center text-gray-500">
              <FaSpinner className="animate-spin mr-2" />
              <span>Loading earlier messages...</span>
            </div>
          </div>
        )}
        
        {/* Messages List */}
        <div className="space-y-3">
          {messages.map(message => (
            <MessageItem key={message._id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Empty State */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
              <FaHandshake className="text-3xl text-gray-400" />
            </div>
            <p className="text-center">Start your conversation about this contract.</p>
            <p className="text-sm mt-2">
              You can negotiate terms or discuss details about the product.
            </p>
          </div>
        )}
      </div>
      
      {/* Counter offer form */}
      {showOfferForm && (
        <div className="border-t p-4 bg-gray-50">
          <h3 className="font-medium mb-3 flex items-center">
            <FaHandshake className="text-blue-500 mr-2" /> Make Counter Offer
          </h3>
          
          <form onSubmit={handleSubmitOffer} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price Per Unit *
              </label>
              <input
                type="number"
                name="pricePerUnit"
                value={offerFormData.pricePerUnit}
                onChange={handleOfferChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={offerFormData.quantity}
                onChange={handleOfferChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Delivery Date *
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={offerFormData.deliveryDate}
                onChange={handleOfferChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quality Requirements
              </label>
              <input
                type="text"
                name="qualityRequirements"
                value={offerFormData.qualityRequirements}
                onChange={handleOfferChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Special Requirements
              </label>
              <textarea
                name="specialRequirements"
                value={offerFormData.specialRequirements}
                onChange={handleOfferChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              ></textarea>
            </div>
            
            <div className="col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowOfferForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm focus:outline-none flex items-center disabled:opacity-50"
              >
                {sendingMessage ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" /> Sending...
                  </>
                ) : (
                  <>
                    <FaHandshake className="mr-1" /> Send Counter Offer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Message input */}
      {!showOfferForm && (
        <div className="border-t p-3">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-grow relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              ></textarea>
            </div>
            
            <div className="flex-shrink-0 flex space-x-2">
              {contract?.status !== 'accepted' && contract?.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => setShowOfferForm(true)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FaHandshake />
                </button>
              )}
              
              <button
                type="submit"
                disabled={sendingMessage || !messageText.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                {sendingMessage ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 
