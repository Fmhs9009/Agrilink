const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    // Contract parties
    farmer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    buyer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Contract details
    crop: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    
    // Contract terms
    quantity: {
        type: Number,
        required: [true, "Please specify quantity"],
        min: [1, "Quantity cannot be less than 1"]
    },
    unit: {
        type: String,
        required: [true, "Please specify unit"],
        enum: {
            values: ["kg", "g", "ton", "quintal", "acre", "hectare"],
            message: "Please select valid unit"
        }
    },
    pricePerUnit: {
        type: Number,
        required: [true, "Please specify price per unit"],
        min: [1, "Price cannot be less than 1"]
    },
    totalAmount: {
        type: Number,
        required: true
    },
    
    // Timeline
    requestDate: {
        type: Date,
        default: Date.now
    },
    expectedHarvestDate: {
        type: Date,
        required: true
    },
    deliveryDate: {
        type: Date,
        required: true
    },
    
    // Contract specifications
    qualityRequirements: {
        type: String,
        required: [true, "Please specify quality requirements"]
    },
    specialRequirements: {
        type: String
    },
    
    // Contract status
    status: {
        type: String,
        enum: {
            values: [
                "requested",      // Initial request from buyer
                "negotiating",    // Under negotiation
                "accepted",       // Accepted by both parties
                "active",         // Contract is active, crop is being grown
                "readyForHarvest", // Crop is ready for harvest
                "harvested",      // Crop has been harvested
                "delivered",      // Crop has been delivered
                "completed",      // Contract fulfilled
                "cancelled",      // Contract cancelled
                "disputed"        // Under dispute
            ],
            default: "requested"
        }
    },
    
    // Payment structure (placeholders for future implementation)
    paymentTerms: {
        advancePercentage: {
            type: Number,
            default: 20
        },
        midtermPercentage: {
            type: Number,
            default: 50
        },
        finalPercentage: {
            type: Number,
            default: 30
        }
    },
    
    // Contract negotiation history
    negotiationHistory: [
        {
            proposedBy: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            proposedChanges: {
                type: Object,
                required: true
            },
            message: String,
            proposedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    
    // Progress updates
    progressUpdates: [
        {
            updateType: {
                type: String,
                enum: ["planting", "growing", "harvesting", "processing", "shipping", "other"],
                required: true
            },
            description: {
                type: String,
                required: true
            },
            images: [
                {
                    public_id: String,
                    url: String
                }
            ],
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    
    // Contract document
    contractDocument: {
        public_id: String,
        url: String
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
contractSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Contract', contractSchema); 