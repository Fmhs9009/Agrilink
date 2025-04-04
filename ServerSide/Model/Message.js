const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Which contract this message belongs to
    contractId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Contract',
        required: true,
        index: true // Add index for faster query performance
    },
    
    // Message sender - farmer or buyer
    senderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Message recipient - farmer or buyer
    recipientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Message type (regular text message or counter offer)
    messageType: {
        type: String,
        enum: ['text', 'counterOffer', 'systemMessage'],
        default: 'text',
        required: true
    },
    
    // Actual text content of the message
    content: {
        type: String,
        required: function() {
            return this.messageType === 'text' || this.messageType === 'systemMessage';
        }
    },
    
    // Counter offer details (if it's a counter offer message)
    offerDetails: {
        pricePerUnit: {
            type: Number,
            required: function() {
                return this.messageType === 'counterOffer';
            }
        },
        quantity: {
            type: Number,
            required: function() {
                return this.messageType === 'counterOffer';
            }
        },
        deliveryDate: {
            type: Date,
            required: function() {
                return this.messageType === 'counterOffer';
            }
        },
        qualityRequirements: {
            type: String
        },
        specialRequirements: {
            type: String
        },
        paymentTerms: {
            type: Object
        }
    },
    
    // Read status
    read: {
        type: Boolean,
        default: false
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Add index for sorting by time
    }
});

// Create compound indexes for efficient querying
messageSchema.index({ contractId: 1, createdAt: -1 }); // For loading message history
messageSchema.index({ recipientId: 1, read: 1 }); // For querying unread messages

module.exports = mongoose.model('Message', messageSchema); 