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
    let socketInitialized = false;
    
    const setupSocket = async () => {
      try {
        const token = authService.getToken();
        
        if (token && !socketService.isSocketConnected()) {
          console.log("Initializing socket connection...");
          await socketService.init(token);
          socketInitialized = true;
        } else if (socketService.isSocketConnected()) {
          console.log("Socket already connected");
          socketInitialized = true;
        }
        
        // Set state based on actual connection status
        setSocketConnected(socketService.isSocketConnected());
        
        // Check connection status periodically
        const checkConnection = setInterval(() => {
          const isConnected = socketService.isSocketConnected();
          setSocketConnected(isConnected);
          
          if (!isConnected && socketInitialized) {
            console.log("Connection lost, attempting to reconnect...");
            socketService.reconnect();
          }
        }, 3000);
        
        return () => {
          clearInterval(checkConnection);
        };
      } catch (error) {
        console.error("Socket initialization error:", error);
        setSocketConnected(false);
      }
    };
    
    const cleanup = setupSocket();
    
    return () => {
      // Clean up socket event listeners and connection checker
      if (socketService.isSocketConnected()) {
        socketService.leaveChat(contractId);
      }
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [contractId]);
  
  // Socket event listeners
  useEffect(() => {
    if (!socketService.getSocket()) {
      console.log("No socket available, skipping event listeners");
      return;
    }
    
    console.log("Setting up socket event listeners");
    
    // Join the chat room
    socketService.joinChat(contractId);
    
    // Listen for message sent acknowledgement
    const messageSentUnsub = socketService.on('message_sent', (data) => {
      if (data && data.success) {
        console.log('Message sent acknowledgement received:', data);
        // Ensure spinner stops on any message_sent event
        setSendingMessage(false);
      }
    });
    
    // Listen for new messages with correct handler
    const newMessageUnsub = socketService.on('new_message', (newMessage) => {
      if (newMessage && newMessage.contractId === contractId) {
        console.log('New message received via socket:', newMessage);
        
        // Check if this is replacing a temporary message
        setMessages(prev => {
          // If message already exists (by ID), don't add it again
          const messageExists = prev.some(msg => msg._id === newMessage._id);
          if (messageExists) {
            return prev;
          }
          
          // For system messages (like acceptance), match on content and type
          if (newMessage.messageType === 'systemMessage') {
            const tempIndex = prev.findIndex(msg => 
              msg.isTemp && 
              msg.messageType === 'systemMessage' &&
              msg.content.includes('accepted the contract offer')
            );
            
            if (tempIndex >= 0) {
              // Replace temp message with real one
              const newMessages = [...prev];
              newMessages[tempIndex] = newMessage;
              return newMessages;
            }
          } else {
            // For regular or offer messages, match on content and sender
            const tempIndex = prev.findIndex(msg => 
              msg.isTemp && 
              msg.senderId._id === newMessage.senderId._id && 
              msg.content === newMessage.content &&
              msg.messageType === newMessage.messageType
            );
            
            if (tempIndex >= 0) {
              // Replace temp message with real one
              const newMessages = [...prev];
              newMessages[tempIndex] = newMessage;
              return newMessages;
            }
          }
          
          // If no temp message found, add as new message
          return [...prev, newMessage];
        });
        
        // Auto scroll to bottom when new message arrives
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });
    
    // Debug connection status
    console.log("Current socket connected status:", socketService.isSocketConnected());
    setSocketConnected(socketService.isSocketConnected());
    
    return () => {
      // Clean up event listeners
      console.log("Cleaning up socket event listeners");
      if (messageSentUnsub) messageSentUnsub();
      if (newMessageUnsub) newMessageUnsub();
      
      // Other event listeners will be cleaned up in the main socket cleanup
    };
  }, [contractId, socketService.getSocket()]);
  
  // Separate useEffect for other socket events to avoid too many reconnects
  useEffect(() => {
    if (!socketService.getSocket()) {
      return;
    }
    
    // Listen for message status updates
    const messagesReadUnsub = socketService.on('messages_read', (data) => {
      if (data && data.contractId === contractId && data.userId !== user._id) {
        console.log('Messages read by other user:', data);
      }
    });
    
    // Listen for contract status updates
    const contractUpdatedUnsub = socketService.on('contract_updated', (data) => {
      if (data && data.contractId === contractId) {
        console.log('Contract updated:', data);
        
        // Update contract status in UI
        setContract(prev => {
          if (prev) {
            return {
              ...prev,
              status: data.status
            };
          }
          return prev;
        });
        
        // If contract was accepted, fetch messages again to ensure system message appears
        if (data.status === 'accepted') {
          refreshMessages();
        }
      }
    });
    
    // Listen for errors
    const errorUnsub = socketService.on('error', (error) => {
      toast.error(error.message || 'Socket error occurred');
      // Ensure spinner stops on any error
      setSendingMessage(false);
    });
    
    // Listen for offer accepted confirmation
    const offerAcceptedUnsub = socketService.on('offer_accepted', (data) => {
      if (data && data.contractId === contractId) {
        console.log('Offer accepted confirmation:', data);
        // Just ensure the spinner stops
        setSendingMessage(false);
      }
    });
    
    return () => {
      // Clean up event listeners
      if (messagesReadUnsub) messagesReadUnsub();
      if (contractUpdatedUnsub) contractUpdatedUnsub();
      if (errorUnsub) errorUnsub();
      if (offerAcceptedUnsub) offerAcceptedUnsub();
    };
  }, [contractId, user._id, socketService.getSocket()]);
  
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
        // Replace any temporary messages with real ones
        setMessages(response.data.messages);
        
        // Restart the connection lost indicator
        setConnectionIssue(false);
        
        // Update oldest message timestamp for pagination
        if (response.data.messages.length > 0) {
          setOldestMessageTimestamp(response.data.messages[0].createdAt);
        }
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
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
  
  // Handle sending a text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Create a temporary ID that is more unique and trackable
      const tempId = `temp-${user._id}-${Date.now()}`;
      
      // Create a temporary message for UI feedback
      const tempMessage = {
        _id: tempId,
        contractId,
        senderId: {
          _id: user._id,
          Name: user.Name,
          photo: user.photo
        },
        recipientId: otherParty?._id,
        messageType: 'text',
        content: messageText,
        createdAt: new Date().toISOString(),
        isTemp: true
      };
      
      // Add temp message to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input early for better UX
      const messageToSend = messageText;
      setMessageText('');
      
      // If socket is connected, send via socket for real-time delivery
      if (socketService.isSocketConnected()) {
        const messageSent = socketService.sendMessage(contractId, {
          content: messageToSend,
          messageType: 'text'
        });
        
        if (!messageSent) {
          // Fallback to REST API if socket fails
          await api.post(`/chat/contracts/${contractId}/messages`, {
            content: messageToSend,
            messageType: 'text'
          });
        }
      } else {
        // Use REST API if socket is not connected
        await api.post(`/chat/contracts/${contractId}/messages`, {
          content: messageToSend,
          messageType: 'text'
        });
      }
      
      // Safety timeout to ensure spinner stops after a maximum time
      // This prevents spinner getting stuck if server doesn't acknowledge
      setTimeout(() => {
        setSendingMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
    } finally {
      // Ensure spinner stops regardless of what happened
      setTimeout(() => {
        setSendingMessage(false);
      }, 500);
    }
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
        offerDetails: {
          pricePerUnit: parseFloat(offerFormData.pricePerUnit),
          quantity: parseInt(offerFormData.quantity),
          deliveryDate: new Date(offerFormData.deliveryDate).toISOString(),
          qualityRequirements: offerFormData.qualityRequirements,
          specialRequirements: offerFormData.specialRequirements
        },
        createdAt: new Date().toISOString(),
        isTemp: true
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
        offerDetails: {
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
      
      // If socket is connected, send via socket for real-time delivery
      if (socketService.isSocketConnected()) {
        socketService.getSocket().emit('accept_offer', {
          contractId
        });
      } else {
        // Use REST API if socket is not connected
        await api.post(`/chat/contracts/${contractId}/accept-offer`);
      }
      
      // No need for another toast since we already showed success message
      
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
  
  // Render a message bubble
  const renderMessage = (message, index) => {
    const isCurrentUser = message.senderId?._id === user?._id;
    const isSystemMessage = message.messageType === 'systemMessage';
    const isCounterOffer = message.messageType === 'counterOffer';
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showSenderInfo = !previousMessage || previousMessage.senderId?._id !== message.senderId?._id;
    
    if (isSystemMessage) {
      // System message (centered)
      return (
        <div key={message._id} className="flex justify-center my-4">
          <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm">
            {message.content}
          </div>
        </div>
      );
    }
    
    if (isCounterOffer) {
      // Counter offer message (special format)
      return (
        <div key={message._id} className={`my-4 max-w-[80%] ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
          {showSenderInfo && (
            <div className={`text-xs mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
              {message.senderId?.Name || 'Unknown User'}
            </div>
          )}
          
          <div className={`rounded-lg border ${isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center">
                <FaHandshake className={`${isCurrentUser ? 'text-blue-500' : 'text-green-500'} mr-2`} />
                <h3 className="font-medium">Counter Offer</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">{message.content}</p>
            </div>
            
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <FaMoneyBillWave className="text-gray-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Price Per Unit</p>
                    <p className="font-medium">₹{message.offerDetails.pricePerUnit}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaCalculator className="text-gray-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-medium">{message.offerDetails.quantity} {contract?.unit || 'units'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Delivery Date</p>
                    <p className="font-medium">{new Date(message.offerDetails.deliveryDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FaMoneyBillWave className="text-gray-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="font-medium">₹{message.offerDetails.pricePerUnit * message.offerDetails.quantity}</p>
                  </div>
                </div>
              </div>
              
              {message.offerDetails.qualityRequirements && (
                <div className="mt-2 text-sm">
                  <p className="text-xs text-gray-500">Quality Requirements</p>
                  <p className="text-sm">{message.offerDetails.qualityRequirements}</p>
                </div>
              )}
              
              {!isCurrentUser && contract?.status === 'negotiating' && (
                <div className="mt-3 flex space-x-2">
                  <button 
                    onClick={handleAcceptOffer}
                    disabled={sendingMessage}
                    className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    <FaCheck className="mr-1" /> Accept Offer
                  </button>
                  <button 
                    onClick={() => setShowOfferForm(true)}
                    className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    <FaHandshake className="mr-1" /> Counter
                  </button>
                </div>
              )}
            </div>
            
            <div className="px-3 py-1 text-xs text-gray-500 text-right border-t border-gray-200">
              {formatMessageTime(message.createdAt)}
            </div>
          </div>
        </div>
      );
    }
    
    // Regular text message
    return (
      <div key={message._id} className={`my-2 max-w-[70%] ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
        {showSenderInfo && (
          <div className={`text-xs mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            {message.senderId?.Name || 'Unknown User'}
          </div>
        )}
        
        <div className={`rounded-lg px-4 py-2 ${
          isCurrentUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}>
          {message.content}
          <div className={`text-xs mt-1 text-right ${
            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatMessageTime(message.createdAt)}
          </div>
        </div>
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
      
      {/* Chat messages */}
      <div 
        ref={chatContainerRef}
        className="flex-grow p-4 overflow-y-auto bg-gray-50"
      >
        {/* Load more button */}
        {hasMoreMessages && (
          <div className="text-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <FaSpinner className="inline mr-1 animate-spin" /> Loading...
                </>
              ) : (
                'Load older messages'
              )}
            </button>
          </div>
        )}
        
        {/* No messages placeholder */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <FaHandshake className="text-4xl mb-3 text-gray-400" />
            <p className="mb-1">No messages yet</p>
            <p className="text-sm">Start the conversation to negotiate this contract</p>
          </div>
        )}
        
        {/* Message list */}
        {messages.map((message, index) => renderMessage(message, index))}
        
        {/* Invisible element for scrolling to bottom */}
        <div ref={messagesEndRef} />
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