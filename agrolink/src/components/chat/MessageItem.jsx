import React, { useState, useEffect } from 'react';
import { FaUser, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import imageService from '../../services/imageService';

// Format message timestamp
const formatMessageTime = (timestamp) => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return 'Unknown time';
  }
};

const MessageItem = ({ message, user, handleRetryImage, handleRetryMessage }) => {
  const isCurrentUser = message.senderId._id === user._id;
  const formattedTime = formatMessageTime(message.createdAt);
  const messageStatus = message.status || 'delivered';
  const isFailed = messageStatus === 'failed';
  const isUncertain = messageStatus === 'uncertain';
  const isSending = messageStatus === 'sending';
  const isImage = message.messageType === 'image';
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use a ref to track if the component is mounted (for async operations)
  const isMounted = React.useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Load image only once when the component mounts
  useEffect(() => {
    if (isImage && message.image?.url && !message.isTemp && !message.image.url.startsWith('data:')) {
      // Try to get from cache first
      const cachedImage = imageService.getImage(message.image.url);
      if (cachedImage) {
        setImageLoaded(true);
        return;
      }
      
      // Otherwise load the image
      setImageLoaded(false);
      
      imageService.preloadImage(message.image.url)
        .then(() => {
          // Only update state if component is still mounted
          if (isMounted.current) {
            setImageLoaded(true);
            setImageError(false);
          }
        })
        .catch(() => {
          if (isMounted.current) {
            setImageLoaded(false);
            setImageError(true);
          }
        });
    } else if (isImage && message.image?.url && message.image.url.startsWith('data:')) {
      // Data URLs are already loaded
      setImageLoaded(true);
    }
  }, [isImage, message.image?.url, message.isTemp]);
  
  // Reset loaded state if URL changes
  useEffect(() => {
    if (isImage && message.image?.url) {
      setImageLoaded(message.image.url.startsWith('data:'));
      setImageError(false);
    }
  }, [isImage, message.image?.url]);
  
  const retryLoadImage = () => {
    if (!message.image?.url) return;
    
    setImageError(false);
    setImageLoaded(false);
    
    // Clear from cache first
    imageService.clearCache(message.image.url);
    
    // Try to load again
    imageService.preloadImage(message.image.url)
      .then(() => {
        if (isMounted.current) {
          setImageLoaded(true);
          setImageError(false);
        }
      })
      .catch(() => {
        if (isMounted.current) {
          setImageError(true);
        }
      });
  };
  
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
          {/* Image display */}
          {isImage && message.image && (
            <div className="mb-2 relative">
              {/* Loading overlay for sending status */}
              {isSending && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
                  <div className="text-white flex flex-col items-center">
                    <FaSpinner className="animate-spin text-xl mb-1" />
                    <span className="text-xs">Uploading...</span>
                  </div>
                </div>
              )}
              
              {/* Image load error display */}
              {imageError && !message.isTemp && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-40 flex items-center justify-center rounded">
                  <div className="text-white flex flex-col items-center">
                    <FaExclamationTriangle className="text-xl mb-1" />
                    <span className="text-xs">Image load failed</span>
                    <button 
                      onClick={retryLoadImage}
                      className="mt-1 text-xs bg-white text-red-500 px-2 py-1 rounded hover:bg-red-100"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              
              {/* Error overlay for failed uploads */}
              {isFailed && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-40 flex items-center justify-center rounded">
                  <div className="text-white flex flex-col items-center">
                    <FaExclamationTriangle className="text-xl mb-1" />
                    <span className="text-xs">Upload failed</span>
                  </div>
                </div>
              )}
              
              {/* Loading placeholder while image loads */}
              {!message.isTemp && !imageLoaded && !imageError && (
                <div className="h-48 w-full bg-gray-200 rounded flex items-center justify-center">
                  <FaSpinner className="animate-spin text-gray-400 text-2xl" />
                </div>
              )}
              
              <img 
                src={message.image.url} 
                alt={message.content || "Sent image"}
                className={`rounded max-w-full max-h-60 object-contain cursor-pointer ${
                  !message.isTemp && !imageLoaded && !imageError ? 'hidden' : ''
                }`}
                onClick={() => window.open(message.image.url, '_blank')} 
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  if (!message.isTemp) {
                    setImageError(true);
                  }
                }}
              />
            </div>
          )}
          
          {/* Message content */}
          {(message.content || message.messageType !== 'image') && (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
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

export default MessageItem; 