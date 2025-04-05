const jwt = require('jsonwebtoken');
const User = require('../Model/User');
const Message = require('../Model/Message');
const Contract = require('../Model/Contract');
const ErrorHandler = require('../utils/errorHandler');

/**
 * Setup Socket.io server
 * @param {Object} io - Socket.io instance
 */
const setupSocketServer = (io) => {
  console.log('Setting up socket server...');

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.error('No auth token provided for socket connection');
        return next(new Error('Authentication token is missing'));
      }
      
      try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id);
        
        if (!user) {
          console.error('User not found for socket authentication');
          return next(new Error('User not found'));
        }
        
        // Attach user to socket
        socket.user = {
          _id: user._id,
          Name: user.Name,
          email: user.email,
          accountType: user.accountType,
          image: user.photo
        };
        
        next();
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        return next(new Error('Authentication failed: ' + jwtError.message));
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user?.Name || 'Unknown'} (${socket.user?._id || 'Unknown ID'})`);
    
    // Debug socket ID for tracking
    const socketId = socket.id;
    console.log(`Socket ID: ${socketId}`);
    
    // Send immediate connection acknowledgement
    socket.emit('connection_status', { 
      connected: true,
      userId: socket.user?._id,
      socketId: socketId
    });
    
    // Handle ping for latency checking
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
    
    // Handle join chat room with more logging
    socket.on('join_chat', async ({ contractId }) => {
      try {
        if (!contractId) {
          socket.emit('error', { message: 'Contract ID is required' });
          return;
        }
        
        console.log(`Join chat request: User ${socket.user?.Name} (${socket.user?._id}) for contract ${contractId}`);
        
        // Validate contract existence and user's access
        const contract = await Contract.findById(contractId);
        
        if (!contract) {
          console.log(`Contract not found: ${contractId}`);
          socket.emit('error', { message: 'Contract not found' });
          return;
        }
        
        // Check if user is part of the contract
        const userId = socket.user._id.toString();
        const farmerId = contract.farmer?.toString();
        const buyerId = contract.buyer?.toString();
        
        if (userId !== farmerId && userId !== buyerId) {
          console.log(`Unauthorized access: User ${userId} not part of contract ${contractId}`);
          socket.emit('error', { message: 'Unauthorized access to this contract' });
          return;
        }
        
        // Join room for this contract
        const roomName = `contract:${contractId}`;
        socket.join(roomName);
        
        console.log(`${socket.user.Name} joined chat room: ${roomName} (Socket ID: ${socketId})`);
        
        // Get room members
        const sockets = await io.in(roomName).fetchSockets();
        console.log(`Room ${roomName} has ${sockets.length} members`);
        
        // Notify user that they joined successfully
        socket.emit('joined_chat', { 
          contractId, 
          message: 'Successfully joined chat',
          members: sockets.length
        });
        
        try {
          // Mark messages as read when joining chat
          const updateResult = await Message.updateMany(
            { 
              contractId, 
              recipientId: socket.user._id,
              read: false
            },
            { 
              read: true 
            }
          );
          
          console.log(`Marked ${updateResult.modifiedCount} messages as read`);
          
          // Notify other users in the room that this user has read messages
          socket.to(roomName).emit('messages_read', {
            contractId,
            userId: socket.user._id.toString()
          });
        } catch (updateError) {
          console.error('Error marking messages as read:', updateError);
          // Continue without failing the whole join process
        }
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat: ' + error.message });
      }
    });
    
    // Leave chat room
    socket.on('leave_chat', ({ contractId }) => {
      if (!contractId) return;
      
      const roomName = `contract:${contractId}`;
      socket.leave(roomName);
      console.log(`${socket.user?.Name || 'User'} left chat room: ${roomName}`);
      
      // Acknowledge
      socket.emit('left_chat', { 
        contractId, 
        success: true 
      });
    });
    
    // Handle send message event with more debug
    socket.on('send_message', async ({ contractId, message }) => {
      try {
        console.log(`Send message request: User ${socket.user?.Name} for contract ${contractId}`);
        console.log('Message content:', message.content?.substring(0, 30) + (message.content?.length > 30 ? '...' : ''));
        
        if (!contractId || !message) {
          socket.emit('error', { message: 'Contract ID and message are required' });
          return;
        }
        
        // Validate contract existence and user's access
        const contract = await Contract.findById(contractId);
        
        if (!contract) {
          console.log(`Contract not found: ${contractId}`);
          socket.emit('error', { message: 'Contract not found' });
          return;
        }
        
        // Check if user is part of the contract
        const userId = socket.user._id.toString();
        const farmerId = contract.farmer?.toString();
        const buyerId = contract.buyer?.toString();
        
        if (userId !== farmerId && userId !== buyerId) {
          console.log(`Unauthorized access: User ${userId} not part of contract ${contractId}`);
          socket.emit('error', { message: 'Unauthorized access to this contract' });
          return;
        }
        
        // Determine recipient
        const recipientId = userId === farmerId ? buyerId : farmerId;
        
        // Create message
        const newMessage = {
          contractId,
          senderId: userId,
          recipientId,
          messageType: message.messageType || 'text',
          content: message.content,
          read: false
        };
        
        // Add offer details if this is a counter offer
        if (message.messageType === 'counterOffer' && message.offerDetails) {
          newMessage.offerDetails = message.offerDetails;
          
          // Update contract status to negotiating
          if (contract.status === 'requested') {
            contract.status = 'negotiating';
            await contract.save();
            
            // Notify about contract status update
            io.to(`contract:${contractId}`).emit('contract_updated', {
              contractId,
              status: 'negotiating'
            });
          }
          
          // Add to negotiation history
          contract.negotiationHistory.push({
            proposedBy: userId,
            proposedChanges: message.offerDetails,
            message: message.content,
            proposedAt: new Date()
          });
          
          await contract.save();
        }
        
        // Save message to database
        const createdMessage = await Message.create(newMessage);
        console.log(`Message saved to database with ID: ${createdMessage._id}`);
        
        // Populate the sender details for the frontend
        const populatedMessage = await Message.findById(createdMessage._id)
          .populate('senderId', 'Name photo accountType');
        
        // Get room members before emitting
        const roomName = `contract:${contractId}`;
        const sockets = await io.in(roomName).fetchSockets();
        console.log(`Emitting message to room ${roomName} with ${sockets.length} members`);
        
        // Emit to all users in the contract room
        io.to(roomName).emit('new_message', populatedMessage);
        
        // Also broadcast to recipient's personal room
        io.to(`user:${recipientId}`).emit('new_notification', {
          type: 'new_message',
          message: `New message from ${socket.user.Name}`,
          data: {
            contractId,
            senderId: userId
          }
        });
        
        // Acknowledge successful message sending
        socket.emit('message_sent', {
          success: true,
          messageId: populatedMessage._id
        });
        
        console.log(`Message sent from ${socket.user.Name} to room ${roomName}`);
        
      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('error', { message: 'Failed to send message: ' + error.message });
      }
    });
    
    // Mark messages as read
    socket.on('mark_messages_read', async ({ contractId }) => {
      try {
        if (!contractId) {
          socket.emit('error', { message: 'Contract ID is required' });
          return;
        }
        
        // Update messages in database
        await Message.updateMany(
          { 
            contractId, 
            recipientId: socket.user._id,
            read: false
          },
          { 
            read: true 
          }
        );
        
        // Notify other users in the room that this user has read messages
        const roomName = `contract:${contractId}`;
        socket.to(roomName).emit('messages_read', {
          contractId,
          userId: socket.user._id.toString()
        });
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read: ' + error.message });
      }
    });
    
    // Join user's personal room for notifications
    socket.join(`user:${socket.user._id}`);
    
    // Handle accepting counter offer via socket
    socket.on('accept_offer', async ({ contractId }) => {
      try {
        if (!contractId) {
          socket.emit('error', { message: 'Contract ID is required' });
          return;
        }
        
        // Validate contract existence and user's access
        const contract = await Contract.findById(contractId);
        
        if (!contract) {
          socket.emit('error', { message: 'Contract not found' });
          return;
        }
        
        // Check if contract status is negotiating
        if (contract.status !== 'negotiating') {
          socket.emit('error', { message: 'This contract is not currently under negotiation' });
          return;
        }
        
        // Check if user is part of the contract
        const userId = socket.user._id.toString();
        const farmerId = contract.farmer?.toString();
        const buyerId = contract.buyer?.toString();
        
        if (userId !== farmerId && userId !== buyerId) {
          socket.emit('error', { message: 'Unauthorized access to this contract' });
          return;
        }
        
        // Update contract status
        contract.status = 'accepted';
        await contract.save();
        
        // Send system message about acceptance
        const recipientId = userId === farmerId ? buyerId : farmerId;
        
        const systemMessage = await Message.create({
          contractId,
          senderId: userId,
          recipientId,
          messageType: 'systemMessage',
          content: `${socket.user.Name} has accepted the contract offer.`,
          read: false
        });
        
        // Populate the system message
        const populatedMessage = await Message.findById(systemMessage._id)
          .populate('senderId', 'Name photo accountType');
        
        // Notify all users in the contract room
        const roomName = `contract:${contractId}`;
        io.to(roomName).emit('new_message', populatedMessage);
        
        // Also notify about contract status update
        io.to(roomName).emit('contract_updated', {
          contractId,
          status: 'accepted'
        });
        
        // Emit success response back to the user
        socket.emit('offer_accepted', {
          success: true,
          contractId,
          message: 'Contract offer accepted successfully'
        });
        
      } catch (error) {
        console.error('Error accepting offer via socket:', error);
        socket.emit('error', { message: 'Failed to accept offer: ' + error.message });
      }
    });
    
    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.Name || 'Unknown'} (${socket.user?._id || 'Unknown ID'})`);
    });
  });
};

module.exports = setupSocketServer; 