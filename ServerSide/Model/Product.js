const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter crop name"],
        trim: true,
        maxLength: [100, "Crop name cannot exceed 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Please enter crop description"],
        maxLength: [2000, "Description cannot exceed 2000 characters"]
    },
    price: {
        type: Number,
        required: [true, "Please enter base price per unit"],
        maxLength: [8, "Price cannot exceed 8 characters"],
        min: [0, "Price cannot be negative"]
    },
    images: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    category: {
        type: String,
        required: [true, "Please enter crop category"],
        enum: {
            values: [
                "Vegetables",
                "Fruits",
                "Grains",
                "Pulses",
                "Oilseeds",
                "Spices",
                "Herbs",
                "Other"
            ],
            message: "Please select correct category"
        }
    },
    availableQuantity: {
        type: Number,
        required: [true, "Please enter available quantity"],
        maxLength: [6, "Quantity cannot exceed 6 characters"],
        default: 1,
        min: [0, "Quantity cannot be negative"]
    },
    unit: {
        type: String,
        required: [true, "Please specify the unit"],
        enum: {
            values: ["kg", "g", "ton", "quintal", "acre", "hectare"],
            message: "Please select valid unit"
        }
    },
    minimumOrderQuantity: {
        type: Number,
        required: [true, "Please specify minimum order quantity"],
        default: 1
    },
    growingPeriod: {
        type: Number,
        required: [true, "Please specify growing period in days"],
        description: "Growing period in days"
    },
    currentGrowthStage: {
        type: String,
        enum: {
            values: ["seed", "seedling", "vegetative", "flowering", "fruiting", "mature", "harvested", "not_planted"],
            default: "not_planted"
        },
        required: true
    },
    estimatedHarvestDate: {
        type: Date,
        required: [true, "Please provide estimated harvest date"]
    },
    seasonalAvailability: {
        startMonth: {
            type: Number, // 1-12 for Jan-Dec
            required: true
        },
        endMonth: {
            type: Number, // 1-12 for Jan-Dec
            required: true
        }
    },
    farmingPractices: {
        type: [String],
        enum: {
            values: ["Traditional", "Organic", "Natural", "Permaculture", "Biodynamic", "Hydroponic", "Aquaponic", "Conventional"],
        },
        default: ["Conventional"]
    },
    waterSource: {
        type: String,
        enum: {
            values: ["Rainfed", "Canal", "Well", "Borewell", "River", "Pond", "Other"],
            default: "Rainfed"
        }
    },
    pesticidesUsed: {
        type: Boolean,
        default: true
    },
    soilType: {
        type: String
    },
    farmer: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    farmLocation: {
        address: String,
        district: String,
        state: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    ratings: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            maxLength: [500, "Comment cannot exceed 500 characters"]
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    organic: {
        type: Boolean,
        default: false
    },
    certification: {
        type: String,
        enum: {
            values: ["None", "Organic", "GAP", "PGS", "NPOP", "Global GAP", "Other"],
            default: "None"
        }
    },
    openToCustomGrowing: {
        type: Boolean,
        default: true,
        description: "Whether farmer is open to custom growing arrangements"
    },
    contractPreferences: {
        minDuration: {
            type: Number,
            default: 30,
            description: "Minimum contract duration in days"
        },
        maxDuration: {
            type: Number,
            default: 365,
            description: "Maximum contract duration in days"
        },
        preferredPaymentTerms: {
            type: String,
            enum: {
                values: ["Advance", "Milestone", "Delivery", "Custom"],
                default: "Milestone"
            }
        }
    },
    status: {
        type: String,
        enum: {
            values: ["active", "unavailable", "deleted"],
            default: "active"
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Method to calculate average rating
productSchema.methods.calculateAverageRating = function() {
    if (this.ratings.length === 0) {
        this.averageRating = 0;
        this.numOfReviews = 0;
    } else {
        this.averageRating = this.ratings.reduce((acc, item) => item.rating + acc, 0) / this.ratings.length;
        this.numOfReviews = this.ratings.length;
    }
    return this.save();
};

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Product", productSchema);