const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { 
    getMessages, 
    sendMessage, 
    getUnreadCount, 
    markAsRead,
    getChatList,
    acceptCounterOffer
} = require('../controllers/chatController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get chat list (all contracts with latest message)
router.get('/chats', getChatList);

// Get unread message count
router.get('/unread', getUnreadCount);

// Routes for specific contract
router.route('/contracts/:contractId/messages')
    .get(getMessages)
    .post(sendMessage);

// Mark messages as read
router.put('/contracts/:contractId/messages/read', markAsRead);

// Accept counter offer
router.put('/contracts/:contractId/accept-offer', acceptCounterOffer);

module.exports = router; 