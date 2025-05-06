import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaPaperPlane, FaSpinner, FaChevronLeft, FaExclamationTriangle, FaHandshake, FaFileContract, FaUser, FaCalculator, FaCalendarAlt, FaMoneyBillWave, FaCheck, FaTimes, FaImage, FaTimesCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import socketService from '../../services/socket';
import authService from '../../services/auth/authService';
import chatService from '../../services/chatService';
import imageService from '../../services/imageService';
import MessageItem from './MessageItem';

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  
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
        
        // 5. Set up socket error listener
        const socketErrorUnsubscribe = socketService.on('socket_error', (errorData) => {
          console.error('Socket error received:', errorData);
          // Only show UI errors for important issues
          if (errorData.message && (
              errorData.message.includes('authentication') || 
              errorData.message.includes('Failed to send')
            )) {
            toast.error(`Chat error: ${errorData.message}`, { id: 'socket-chat-error' });
          }
        });
        
        // 6. Set up message listeners even if socket isn't connected (for future reconnection)
        const newMessageUnsubscribe = socketService.on('new_message', (message) => {
          console.log('📩 New message received:', message);
          
          // Only handle messages for this contract
          if (message.contractId !== contractId) return;
          
          // Add message to state (avoiding duplicates)
          setMessages(prev => {
            // First check if this exact message already exists by ID
            const existsById = prev.some(m => m._id === message._id);
            if (existsById) return prev;
            
            // Check for duplicate images by URL to avoid double images
            if (message.messageType === 'image' && message.image?.url) {
              const duplicateByImageUrl = prev.some(m => 
                m.messageType === 'image' && 
                m.image?.url === message.image.url && 
                !m.image.url.startsWith('data:') // Don't match data URLs
              );
              
              if (duplicateByImageUrl) {
                console.log('🖼️ Duplicate image detected by URL, skipping:', message.image.url);
                return prev;
              }
            }
            
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
            
            // Check for temporary image messages
            if (message.messageType === 'image') {
              // First try to find a temporary image from the same sender with similar timestamp
              // This is more reliable for image matching
              const tempIndex = prev.findIndex(m => 
                m.isTemp && 
                m.messageType === 'image' && 
                m.senderId._id === message.senderId._id &&
                // If we have a data URL temp image from this sender, assume it's this one
                m.image && m.image.url && m.image.url.startsWith('data:')
              );
              
              if (tempIndex >= 0) {
                console.log('📩 Replacing temp image with real one:', message);
                // Replace temp image with real one
                const newMessages = [...prev];
                newMessages[tempIndex] = message;
                
                // Log the replacement for debugging
                console.log('Temp message:', prev[tempIndex]);
                console.log('Real message:', message);
                
                return newMessages;
              }
            }
            
            // Otherwise add as new message
            console.log('📩 Adding new message to state:', message);
            return [...prev, message];
          });
          
          // Auto scroll to bottom
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        });
        
        // 7. Set up message sent confirmation listener
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
        
        // 8. Set up message uncertainty listener (when delivery is uncertain)
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
        
        // 9. Set initial connection status based on current socket state
        setSocketConnected(socketService.isSocketConnected());
        
        // 10. Clean up function
        return () => {
          console.log('🧹 Cleaning up chat interface');
          connectionStatusUnsubscribe();
          socketErrorUnsubscribe();
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
        const result = await chatService.getMessages(contractId);
        
        if (result.success && result.messages) {
          setMessages(result.messages);
          
          // Set oldest message timestamp for pagination
          if (result.messages.length > 0) {
            setOldestMessageTimestamp(result.messages[0].createdAt);
          }
          
          // If fewer messages returned than limit, we've reached the end
          if (result.messages.length < 20) {
            setHasMoreMessages(false);
          }
        } else {
          throw new Error('Failed to fetch messages');
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
        // Use chatService to mark messages as read
        await chatService.markAsRead(contractId);
        
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
      const result = await chatService.getMessages(contractId, {
        before: oldestMessageTimestamp,
        limit: 20
      });
      
      if (result.success && result.messages) {
        const olderMessages = result.messages;
        
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
      } else {
        throw new Error('Failed to load more messages');
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
      let apiResult = null;
      
      if (socketService.isSocketConnected()) {
        sentViaSocket = socketService.sendMessage(contractId, messageData);
        console.log('📤 Sent via socket:', sentViaSocket);
      }
      
      // If socket send failed, use chatService immediately
      if (!sentViaSocket) {
        console.log('📤 Socket send failed, using API instead');
        apiResult = await chatService.sendMessage(contractId, messageData);
        
        if (apiResult.success && apiResult.message) {
          // Replace temp message with real one
          setMessages(prev => {
            return prev.map(msg => {
              if (msg._id === tempId) {
                return apiResult.message;
              }
              return msg;
            });
          });
        } else {
          throw new Error('Failed to send message via API');
        }
      }
      
      // Set a safety timeout to ensure UI doesn't get stuck
      // and to check if we need to fall back to API if socket didn't deliver
      setTimeout(async () => {
        // Always clean up sending state
        setSendingMessage(false);
        
        // Check if the temp message is still in 'sending' state
        const stillSending = messages.some(msg => 
          msg._id === tempId && msg.isTemp && msg.status === 'sending');
          
        // If message is still unconfirmed and we didn't already use the API, try API now
        if (stillSending && !apiResult) {
          console.log('⚠️ Socket delivery timeout, falling back to API');
          try {
            // Try sending via API as a fallback
            const fallbackResult = await chatService.sendMessage(contractId, messageData);
            
            if (fallbackResult.success && fallbackResult.message) {
              // Replace temp message with the real one from API
              setMessages(prev => 
                prev.map(msg => {
                  if (msg._id === tempId) {
                    return fallbackResult.message;
                  }
                  return msg;
                })
              );
            } else {
              // Mark as uncertain if API also failed
              setMessages(prev => 
                prev.map(msg => {
                  if (msg._id === tempId) {
                    return {
                      ...msg,
                      status: 'uncertain',
                    };
                  }
                  return msg;
                })
              );
            }
          } catch (fallbackError) {
            console.error('❌ API fallback also failed:', fallbackError);
            // Mark message as failed
            setMessages(prev => 
              prev.map(msg => {
                if (msg._id === tempId) {
                  return { ...msg, status: 'failed' };
                }
                return msg;
              })
            );
          }
        }
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
  
  // Handle retrying a failed image upload
  const handleRetryImage = (failedMessage) => {
    // Check if we have the original image data in the DOM
    const imageUrl = failedMessage.image?.url;
    if (!imageUrl || !imageUrl.startsWith('data:')) {
      toast.error('Cannot retry - original image data not available');
      return;
    }
    
    // Convert data URL back to a file
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        // Create a File object
        const fileName = `retry-image-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        
        // Set up the image upload process again
        setSelectedImage(file);
        setImagePreview(imageUrl);
        setImageCaption(failedMessage.content || '');
        
        // Remove the failed message
        setMessages(prev => prev.filter(msg => msg._id !== failedMessage._id));
        
        // Show a toast to let the user know they can send the image again
        toast.success('Image ready to retry sending');
      })
      .catch(error => {
        console.error('Error preparing image for retry:', error);
        toast.error('Could not prepare image for retry');
      });
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
  
  // Handle accepting an offer
  const handleAcceptOffer = async () => {
    try {
      setSendingMessage(true);
      
      // Try to accept offer via socket first for real-time experience
      let acceptedViaSocket = false;
      if (socketService.isSocketConnected()) {
        acceptedViaSocket = await socketService.acceptOffer(contractId);
      }
      
      // If socket acceptance failed, use the API
      if (!acceptedViaSocket) {
        const result = await chatService.acceptCounterOffer(contractId);
        
        if (!result.success) {
          throw new Error('Failed to accept offer');
        }
      }
      
      // Optimistically update contract status in UI for better UX
      setContract(prev => ({
        ...prev,
        status: 'accepted'
      }));
      
      // Add system message about the acceptance
      const systemMessage = {
        _id: `system-${Date.now()}`,
        contractId,
        messageType: 'systemMessage',
        content: 'The counter offer has been accepted. The contract is now finalized.',
        createdAt: new Date().toISOString(),
        senderId: {
          _id: 'system',
          Name: 'System',
        },
        recipientId: {
          _id: 'all'
        }
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Scroll to bottom to show the system message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      toast.success('Counter offer accepted successfully');
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer. Please try again.');
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
  
  // Function to handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG, WEBP)');
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(file);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Function to cancel image upload
  const cancelImageUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageCaption('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };
  
  // Effect for preloading images
  useEffect(() => {
    // Find all image URLs in messages
    const imageUrls = messages
      .filter(msg => msg.messageType === 'image' && msg.image?.url)
      .map(msg => msg.image.url);
    
    if (imageUrls.length > 0) {
      console.log('🖼️ Preloading images:', imageUrls.length);
      imageService.preloadImages(imageUrls)
        .then(() => console.log('🖼️ Images preloaded successfully'))
        .catch(err => console.error('Error preloading images:', err));
    }
  }, [messages]);

  // Function to send an image message
  const handleSendImage = async () => {
    if (!selectedImage) return;
    
    try {
      setUploadingImage(true);
      
      // Create a unique ID for the temporary message
      const tempId = `temp-image-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (imageCaption) {
        formData.append('caption', imageCaption);
      }
      
      // Keep a copy of the image data
      const currentImagePreview = imagePreview;
      const currentCaption = imageCaption || '';
      
      // Create a temporary message for instant feedback
      const tempMessage = {
        _id: tempId,
        isTemp: true,
        contractId,
        content: currentCaption,
        messageType: 'image',
        createdAt: new Date().toISOString(),
        senderId: {
          _id: user._id,
          Name: user.Name,
          photo: user.photo
        },
        status: 'sending',
        image: {
          url: currentImagePreview
        }
      };
      
      // Reset image selection UI immediately for better UX
      // This allows user to prepare next image while this one uploads
      cancelImageUpload();
      
      // Add to message list immediately for better UX
      setMessages(prev => {
        // Check if we already have this exact image in the list (prevents duplicates)
        const hasDuplicate = prev.some(msg => 
          msg.messageType === 'image' && 
          msg.image?.url === currentImagePreview && 
          Math.abs(new Date(msg.createdAt) - new Date()) < 5000 // Within 5 seconds
        );
        
        if (hasDuplicate) {
          console.log('🖼️ Duplicate image detected, not adding temp message');
          return prev;
        }
        
        return [...prev, tempMessage];
      });
      
      // Scroll to bottom to show new message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      
      // Send the image using chatService
      console.log('📤 Uploading image message via API');
      const result = await chatService.sendImageMessage(contractId, formData);
      
      if (result.success && result.message) {
        console.log('✅ Image uploaded successfully:', result.message);
        
        // Preload the real image for instant display
        if (result.message.image?.url) {
          imageService.preloadImage(result.message.image.url)
            .then(() => console.log('✅ Uploaded image preloaded successfully'));
        }
        
        // Replace temp message with real one
        setMessages(prev => {
          // First check if we already have this exact message (can happen with socket events)
          const hasExact = prev.some(msg => !msg.isTemp && msg._id === result.message._id);
          if (hasExact) {
            console.log('✅ Exact message already exists, removing temp version');
            return prev.filter(msg => msg._id !== tempId);
          }
          
          return prev.map(msg => {
            if (msg._id === tempId) {
              return result.message;
            }
            return msg;
          });
        });
        
        // Ensure scroll to bottom after successful upload
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
        
        toast.success('Image sent successfully');
      } else {
        console.error('❌ API reported failure sending image', result);
        throw new Error('Failed to send image - server rejected the upload');
      }
    } catch (error) {
      console.error('❌ Error sending image:', error);
      toast.error('Failed to send image: ' + (error.message || 'Unknown error'));
      
      // Mark temp message as failed
      setMessages(prev => 
        prev.map(msg => {
          if (msg._id.startsWith('temp-image-') && msg.isTemp) {
            return { ...msg, status: 'failed' };
          }
          return msg;
        })
      );
    } finally {
      setUploadingImage(false);
    }
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
            <MessageItem 
              key={message._id} 
              message={message} 
              user={user}
              handleRetryImage={handleRetryImage}
              handleRetryMessage={handleRetryMessage}
            />
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
          {/* Image preview area */}
          {imagePreview && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg relative">
              <div className="flex items-start">
                <div className="relative w-24 h-24 rounded overflow-hidden border border-gray-300">
                  <img 
                    src={imagePreview} 
                    alt="Selected" 
                    className="w-full h-full object-cover" 
                  />
                  <button 
                    onClick={cancelImageUpload}
                    className="absolute top-0 right-0 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                    title="Remove image"
                  >
                    <FaTimesCircle className="text-xs" />
                  </button>
                </div>
                <div className="ml-3 flex-1">
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Add a caption (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendImage}
                    disabled={uploadingImage}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <FaSpinner className="animate-spin mr-1" /> Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-1" /> Send Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Message input form */}
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-grow relative">
              <textarea
                id="message-input"
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
              {/* Image upload button */}
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageSelect}
                className="hidden"
                disabled={uploadingImage}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                title="Send image"
              >
                <FaImage />
              </button>
              
              {/* Offer button */}
              {contract?.status !== 'accepted' && contract?.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => setShowOfferForm(true)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FaHandshake />
                </button>
              )}
              
              {/* Send button */}
              <button
                type="submit"
                disabled={sendingMessage || (!messageText.trim() && !selectedImage)}
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
