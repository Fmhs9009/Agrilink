const Message = require('../Model/Message');
const Contract = require('../Model/Contract');
const User = require('../Model/User');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

// Get messages for a specific contract
exports.getMessages = catchAsyncErrors(async (req, res, next) => {
    const { contractId } = req.params;
    const userId = req.user._id;
    const { before, limit = 20 } = req.query;
    
    // Validate contract existence and user's access
    const contract = await Contract.findById(contractId);
    
    if (!contract) {
        return next(new ErrorHandler('Contract not found', 404));
    }
    
    // Check if user is part of the contract
    if (contract.farmer.toString() !== userId.toString() && 
        contract.buyer.toString() !== userId.toString()) {
        return next(new ErrorHandler('Unauthorized access to this contract', 403));
    }
    
    // Build query for pagination
    const query = { contractId };
    
    // If 'before' parameter is provided, get messages before that timestamp
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }
    
    try {
        // Find messages for this contract
        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('senderId', 'Name photo accountType')
            .lean();
            
        // Mark messages as read if recipient is the current user
        if (messages.length > 0) {
            await Message.updateMany(
                { 
                    contractId,
                    recipientId: userId, 
                    read: false
                },
                { read: true }
            );
        }
        
        // Sort messages in ascending order (oldest first)
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return next(new ErrorHandler('Failed to fetch messages', 500));
    }
});

// Send a new message
exports.sendMessage = catchAsyncErrors(async (req, res, next) => {
    const { contractId } = req.params;
    const { content, messageType = 'text', offerDetails } = req.body;
    
    // Validate message data
    if (messageType === 'text' && !content) {
        return next(new ErrorHandler('Message content is required', 400));
    }
    
    if (messageType === 'counterOffer' && !offerDetails) {
        return next(new ErrorHandler('Offer details are required for counter offers', 400));
    }
    
    // Verify contract exists and user has access
    const contract = await Contract.findById(contractId);
    if (!contract) {
        return next(new ErrorHandler('Contract not found', 404));
    }
    
    // Determine if user is farmer or buyer and set recipient accordingly
    const isFarmer = contract.farmer.toString() === req.user._id.toString();
    const isBuyer = contract.buyer.toString() === req.user._id.toString();
    
    if (!isFarmer && !isBuyer) {
        return next(new ErrorHandler('Unauthorized access to this contract', 403));
    }
    
    const recipientId = isFarmer ? contract.buyer : contract.farmer;
    
    // Create the message
    const message = await Message.create({
        contractId,
        senderId: req.user._id,
        recipientId,
        messageType,
        content,
        offerDetails,
        read: false,
        createdAt: new Date()
    });
    
    // If it's a counter offer, update contract status and add to negotiation history
    if (messageType === 'counterOffer') {
        // Create negotiation history entry
        const negotiationEntry = {
            proposedBy: req.user._id,
            proposedChanges: offerDetails,
            message: content || 'New counter offer',
            proposedAt: new Date()
        };
        
        // Update contract with new negotiation history and set status to negotiating
        await Contract.findByIdAndUpdate(
            contractId,
            { 
                $push: { negotiationHistory: negotiationEntry },
                status: 'negotiating'
            }
        );
    }
    
    // Fetch the populated message to return
    const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'Name accountType image')
        .lean();
    
    res.status(201).json({
        success: true,
        message: populatedMessage
    });
});

// Get unread message count
exports.getUnreadCount = catchAsyncErrors(async (req, res, next) => {
    // Count unread messages for the current user
    const unreadCount = await Message.countDocuments({
        recipientId: req.user._id,
        read: false
    });
    
    // Group by contract to show counts per contract
    const unreadByContract = await Message.aggregate([
        {
            $match: {
                recipientId: req.user._id,
                read: false
            }
        },
        {
            $group: {
                _id: '$contractId',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                contractId: '$_id',
                count: 1,
                _id: 0
            }
        }
    ]);
    
    res.status(200).json({
        success: true,
        totalUnread: unreadCount,
        unreadCounts: unreadByContract
    });
});

// Mark messages as read
exports.markAsRead = catchAsyncErrors(async (req, res, next) => {
    const { contractId } = req.params;
    
    // Verify contract exists and user has access
    const contract = await Contract.findById(contractId);
    if (!contract) {
        return next(new ErrorHandler('Contract not found', 404));
    }
    
    // Check if user is either the farmer or buyer of the contract
    if (contract.farmer.toString() !== req.user._id.toString() && 
        contract.buyer.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler('Unauthorized access to this contract', 403));
    }
    
    // Mark all messages for this contract where user is recipient as read
    const result = await Message.updateMany(
        {
            contractId,
            recipientId: req.user._id,
            read: false
        },
        { read: true }
    );
    
    res.status(200).json({
        success: true,
        markedAsRead: result.nModified || 0
    });
});

// Get all contracts with latest messages for chat list view
exports.getChatList = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;
    
    // Find all contracts where user is either farmer or buyer
    const contracts = await Contract.find({
        $or: [{ farmer: userId }, { buyer: userId }]
    })
    .populate('farmer', 'Name image')
    .populate('buyer', 'Name image')
    .populate('crop', 'name images')
    .lean();
    
    // For each contract, get the latest message
    const contractsWithMessages = await Promise.all(contracts.map(async (contract) => {
        // Get latest message
        const latestMessage = await Message.findOne({ contractId: contract._id })
            .sort({ createdAt: -1 })
            .populate('senderId', 'Name')
            .lean();
        
        // Count unread messages
        const unreadCount = await Message.countDocuments({
            contractId: contract._id,
            recipientId: userId,
            read: false
        });
        
        // Determine if user is farmer or buyer
        const isFarmer = contract.farmer._id.toString() === userId.toString();
        
        // Determine the other party
        const otherParty = isFarmer ? contract.buyer : contract.farmer;
        
        return {
            ...contract,
            latestMessage,
            unreadCount,
            otherParty
        };
    }));
    
    // Sort by latest message (if exists) or contract creation date
    contractsWithMessages.sort((a, b) => {
        const dateA = a.latestMessage ? new Date(a.latestMessage.createdAt) : new Date(a.createdAt);
        const dateB = b.latestMessage ? new Date(b.latestMessage.createdAt) : new Date(b.createdAt);
        return dateB - dateA; // Descending order (newest first)
    });
    
    res.status(200).json({
        success: true,
        count: contractsWithMessages.length,
        chatList: contractsWithMessages
    });
});

// Accept the latest counter offer
exports.acceptCounterOffer = catchAsyncErrors(async (req, res, next) => {
    const { contractId } = req.params;
    
    // Verify contract exists and user has access
    const contract = await Contract.findById(contractId);
    if (!contract) {
        return next(new ErrorHandler('Contract not found', 404));
    }
    
    // Check if user is either the farmer or buyer of the contract
    if (contract.farmer.toString() !== req.user._id.toString() && 
        contract.buyer.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler('Unauthorized access to this contract', 403));
    }
    
    // Get the latest counter offer
    const latestOfferMessage = await Message.findOne({
        contractId,
        messageType: 'counterOffer'
    })
    .sort({ createdAt: -1 });
    
    if (!latestOfferMessage) {
        return next(new ErrorHandler('No counter offers found to accept', 404));
    }
    
    // Make sure the offer being accepted is not from the current user
    if (latestOfferMessage.senderId.toString() === req.user._id.toString()) {
        return next(new ErrorHandler('You cannot accept your own counter offer', 400));
    }
    
    // Update contract with the terms from the latest counter offer
    const { offerDetails } = latestOfferMessage;
    
    const contractUpdates = {
        status: 'accepted',
        ...offerDetails,
        // Calculate total amount based on price and quantity
        totalAmount: offerDetails.pricePerUnit * offerDetails.quantity
    };
    
    // Update the contract
    await Contract.findByIdAndUpdate(contractId, contractUpdates);
    
    // Create a system message to notify about the acceptance
    const recipientId = contract.farmer.toString() === req.user._id.toString() 
        ? contract.buyer 
        : contract.farmer;
    
    await Message.create({
        contractId,
        senderId: req.user._id,
        recipientId,
        messageType: 'systemMessage',
        content: `${req.user.Name} has accepted the latest counter offer.`,
        read: false
    });
    
    res.status(200).json({
        success: true,
        message: 'Counter offer accepted successfully'
    });
});

module.exports = exports; 