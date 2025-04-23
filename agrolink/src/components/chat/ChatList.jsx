import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaSpinner, FaSearch, FaExclamationTriangle, FaUser, FaFileContract, FaLeaf, FaCalendarAlt, FaCircle, FaComment } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import socketService from '../../services/socket';
import authService from '../../services/auth/authService';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Initialize socket connection
  useEffect(() => {
    const token = authService.getToken();
    if (token && !socketService.isSocketConnected()) {
      socketService.init(token);
      setSocketConnected(true);
    }
    
    return () => {
      // No need to disconnect here as we want to keep the socket alive
    };
  }, []);
  
  // Socket event listeners for unread updates
  useEffect(() => {
    if (!socketService.isSocketConnected()) {
      return;
    }
    
    // Listen for unread message updates
    const unreadUpdateUnsub = socketService.on('unread_update', (data) => {
      if (data.contractId && data.message) {
        // Update unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [data.contractId]: (prev[data.contractId] || 0) + 1
        }));
        
        // Update chat list with latest message
        setChatList(prev => {
          const updatedList = [...prev];
          const chatIndex = updatedList.findIndex(chat => chat._id === data.contractId);
          
          if (chatIndex !== -1) {
            // Update existing chat
            updatedList[chatIndex] = {
              ...updatedList[chatIndex],
              latestMessage: data.message
            };
            
            // Sort to bring to top
            updatedList.sort((a, b) => {
              const dateA = a.latestMessage ? new Date(a.latestMessage.createdAt) : new Date(a.createdAt);
              const dateB = b.latestMessage ? new Date(b.latestMessage.createdAt) : new Date(b.createdAt);
              return dateB - dateA; // Descending order (newest first)
            });
          }
          
          return updatedList;
        });
      }
    });
    
    // Listen for errors
    const errorUnsub = socketService.on('error', (error) => {
      console.error('Socket error in chat list:', error);
    });
    
    return () => {
      unreadUpdateUnsub();
      errorUnsub();
    };
  }, []);
  
  // Fetch chats and unread counts
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        
        // Get chat list
        const chatResponse = await api.get('/chat/chats');
        if (chatResponse.data && chatResponse.data.chatList) {
          setChatList(chatResponse.data.chatList);
        }
        
        // Get unread counts
        const unreadResponse = await api.get('/chat/unread');
        if (unreadResponse.data && unreadResponse.data.unreadCounts) {
          // Convert array to object for easier lookup
          const countsObj = {};
          unreadResponse.data.unreadCounts.forEach(item => {
            countsObj[item.contractId] = item.count;
          });
          setUnreadCounts(countsObj);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Failed to load chat information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
    
    // Set up polling for unread counts only if socket is not connected
    let pollInterval;
    if (!socketConnected) {
      pollInterval = setInterval(async () => {
        try {
          const unreadResponse = await api.get('/chat/unread');
          if (unreadResponse.data && unreadResponse.data.unreadCounts) {
            const countsObj = {};
            unreadResponse.data.unreadCounts.forEach(item => {
              countsObj[item.contractId] = item.count;
            });
            setUnreadCounts(countsObj);
          }
        } catch (error) {
          console.error('Error updating unread counts:', error);
        }
      }, 30000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [socketConnected]);
  
  // Filter chats based on search term
  const filteredChats = chatList.filter(chat => {
    const searchLower = searchTerm.toLowerCase();
    const cropName = chat.crop?.name?.toLowerCase() || '';
    const otherParty = user._id === chat.farmer?._id ? chat.buyer : chat.farmer;
    const otherPartyName = otherParty?.Name?.toLowerCase() || '';
    
    return cropName.includes(searchLower) || otherPartyName.includes(searchLower);
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Loading chats..." />;
  }
  
  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Chats</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md h-[calc(100vh-160px)] flex flex-col">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Chats</h2>
        <p className="text-gray-500 text-sm">Negotiate your contracts</p>
        
        <div className="mt-3 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by crop or name..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <FaComment className="text-4xl mb-3 text-gray-400" />
            <p className="mb-1">No chats yet</p>
            <p className="text-sm">Negotiate contracts to start chatting</p>
          </div>
        ) : (
          filteredChats.map(chat => {
            const otherParty = user._id === chat.farmer?._id ? chat.buyer : chat.farmer;
            const latestMessage = chat.latestMessage;
            const unreadCount = unreadCounts[chat._id] || 0;
            const isFarmer = user._id === chat.farmer?._id;
            
            return (
              <Link 
                key={chat._id}
                to={`/chat/${chat._id}`}
                className="block border-b hover:bg-gray-50 transition-colors"
              >
                <div className="px-6 py-4 flex items-start">
                  <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden mr-4 flex-shrink-0">
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
                  
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{otherParty?.Name || 'Unknown User'}</h3>
                      <span className="text-xs text-gray-500">
                        {latestMessage ? formatDate(latestMessage.createdAt) : 'No messages'}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <FaLeaf className="mr-1" />
                      <span>{chat.crop?.name || 'Unknown crop'}</span>
                      <span className="mx-1">•</span>
                      <span className={`
                        ${chat.status === 'accepted' ? 'text-green-600' : ''}
                        ${chat.status === 'negotiating' ? 'text-blue-600' : ''}
                        ${chat.status === 'requested' ? 'text-yellow-600' : ''}
                        ${chat.status === 'cancelled' ? 'text-red-600' : ''}
                      `}>
                        {chat.status?.charAt(0).toUpperCase() + chat.status?.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex-grow">
                        {latestMessage && (
                          <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {latestMessage.messageType === 'counterOffer' ? (
                              <span className="flex items-center">
                                <FaFileContract className="mr-1 text-blue-500" />
                                Counter offer received
                              </span>
                            ) : latestMessage.messageType === 'systemMessage' ? (
                              <span className="italic text-gray-500">{latestMessage.content}</span>
                            ) : (
                              latestMessage.content
                            )}
                          </p>
                        )}
                      </div>
                      
                      {unreadCount > 0 && (
                        <div className="ml-2 flex-shrink-0 bg-blue-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <FaCalendarAlt className="mr-1" />
                      <span>
                        Delivery: {chat.deliveryDate ? new Date(chat.deliveryDate).toLocaleDateString() : 'Not set'}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {chat.quantity} {chat.unit || 'units'} at ₹{chat.pricePerUnit}/unit
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList; 