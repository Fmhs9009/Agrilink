const Contract = require('../Model/Contract');
const Product = require('../Model/Product');
const User = require('../Model/User');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// Get all contracts (with filtering)
exports.getAllContracts = catchAsyncErrors(async (req, res, next) => {
    try {
        const { status, farmer, buyer, crop } = req.query;
        
        // Build query
        const query = {};
        
        if (status) query.status = status;
        if (farmer) query.farmer = farmer;
        if (buyer) query.buyer = buyer;
        if (crop) query.crop = crop;
        
        const contracts = await Contract.find(query)
            .populate('farmer', 'name email')
            .populate('buyer', 'name email')
            .populate('crop', 'name images price');
        
        res.status(200).json({
            success: true,
            count: contracts.length,
            contracts
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get contract by ID
exports.getContractById = catchAsyncErrors(async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('farmer', 'name email phone')
            .populate('buyer', 'name email phone')
            .populate('crop', 'name description images price');
        
        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }
        
        res.status(200).json({
            success: true,
            contract
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Create a new contract request
exports.createContractRequest = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            cropId,
            farmerId,
            quantity,
            unit,
            pricePerUnit,
            expectedHarvestDate,
            deliveryDate,
            qualityRequirements,
            specialRequirements
        } = req.body;
        
        // Validate required fields
        if (!cropId || !farmerId || !quantity || !unit || !pricePerUnit || !expectedHarvestDate || !deliveryDate || !qualityRequirements) {
            return next(new ErrorHandler('Please provide all required fields', 400));
        }
        
        // Check if crop exists
        const crop = await Product.findById(cropId);
        if (!crop) {
            return next(new ErrorHandler('Crop not found', 404));
        }
        
        // Check if farmer exists
        const farmer = await User.findById(farmerId);
        if (!farmer) {
            return next(new ErrorHandler('Farmer not found', 404));
        }
        
        // Calculate total amount
        const totalAmount = quantity * pricePerUnit;
        
        // Create contract request
        const contract = await Contract.create({
            farmer: farmerId,
            buyer: req.user.id, // Current user (buyer)
            crop: cropId,
            quantity,
            unit,
            pricePerUnit,
            totalAmount,
            expectedHarvestDate,
            deliveryDate,
            qualityRequirements,
            specialRequirements,
            status: 'requested'
        });
        
        res.status(201).json({
            success: true,
            message: 'Contract request created successfully',
            contract
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get contracts for a farmer
exports.getFarmerContracts = catchAsyncErrors(async (req, res, next) => {
    try {
        const contracts = await Contract.find({ farmer: req.user.id })
            .populate('buyer', 'name email')
            .populate('crop', 'name images price');
        
        res.status(200).json({
            success: true,
            count: contracts.length,
            contracts
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get contracts for a buyer
exports.getBuyerContracts = catchAsyncErrors(async (req, res, next) => {
    try {
        const contracts = await Contract.find({ buyer: req.user.id })
            .populate('farmer', 'name email')
            .populate('crop', 'name images price');
        
        res.status(200).json({
            success: true,
            count: contracts.length,
            contracts
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Update contract status
exports.updateContractStatus = catchAsyncErrors(async (req, res, next) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return next(new ErrorHandler('Please provide status', 400));
        }
        
        const contract = await Contract.findById(req.params.id);
        
        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }
        
        // Check if user is authorized to update this contract
        if (contract.farmer.toString() !== req.user.id && contract.buyer.toString() !== req.user.id) {
            return next(new ErrorHandler('You are not authorized to update this contract', 403));
        }
        
        // Update status
        contract.status = status;
        await contract.save();
        
        res.status(200).json({
            success: true,
            message: 'Contract status updated successfully',
            contract
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Add progress update to contract
exports.addProgressUpdate = catchAsyncErrors(async (req, res, next) => {
    try {
        const { updateType, description, images } = req.body;
        
        if (!updateType || !description) {
            return next(new ErrorHandler('Please provide update type and description', 400));
        }
        
        const contract = await Contract.findById(req.params.id);
        
        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }
        
        // Check if user is the farmer of this contract
        if (contract.farmer.toString() !== req.user.id) {
            return next(new ErrorHandler('Only the farmer can add progress updates', 403));
        }
        
        // Add progress update
        contract.progressUpdates.push({
            updateType,
            description,
            images: images || [],
            updatedAt: Date.now()
        });
        
        await contract.save();
        
        res.status(200).json({
            success: true,
            message: 'Progress update added successfully',
            contract
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Add negotiation to contract
exports.negotiateContract = catchAsyncErrors(async (req, res, next) => {
    try {
        const { proposedChanges, message } = req.body;
        
        if (!proposedChanges) {
            return next(new ErrorHandler('Please provide proposed changes', 400));
        }
        
        const contract = await Contract.findById(req.params.id);
        
        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }
        
        // Check if user is authorized to negotiate this contract
        if (contract.farmer.toString() !== req.user.id && contract.buyer.toString() !== req.user.id) {
            return next(new ErrorHandler('You are not authorized to negotiate this contract', 403));
        }
        
        // Add negotiation
        contract.negotiationHistory.push({
            proposedBy: req.user.id,
            proposedChanges,
            message: message || '',
            proposedAt: Date.now()
        });
        
        // Update status to negotiating
        contract.status = 'negotiating';
        
        await contract.save();
        
        res.status(200).json({
            success: true,
            message: 'Negotiation added successfully',
            contract
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Accept contract (for farmer)
exports.acceptContract = catchAsyncErrors(async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id);
        
        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }
        
        // Check if user is the farmer of this contract
        if (contract.farmer.toString() !== req.user.id) {
            return next(new ErrorHandler('Only the farmer can accept this contract', 403));
        }
        
        // Check if contract is in requested or negotiating status
        if (contract.status !== 'requested' && contract.status !== 'negotiating') {
            return next(new ErrorHandler(`Cannot accept contract in ${contract.status} status`, 400));
        }
        
        // Update status to accepted
        contract.status = 'accepted';
        await contract.save();
        
        res.status(200).json({
            success: true,
            message: 'Contract accepted successfully',
            contract
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get contract details
exports.getContractDetails = catchAsyncErrors(async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('crop', 'name description images category unit price organic certification')
            .populate('farmer', 'Name email contactNumber farmName FarmLocation')
            .populate('buyer', 'Name email contactNumber')
            .populate('negotiationHistory.proposedBy', 'Name accountType');

        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }

        // Check if user is authorized to view this contract
        if (contract.farmer.toString() !== req.user.id && contract.buyer.toString() !== req.user.id) {
            return next(new ErrorHandler('You are not authorized to view this contract', 403));
        }

        res.status(200).json({
            success: true,
            contract
        });
    } catch (error) {
        console.error('Error fetching contract details:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Generate contract document
exports.generateContractDocument = catchAsyncErrors(async (req, res, next) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('crop', 'name description category unit price organic certification')
            .populate('farmer', 'Name email contactNumber farmName FarmLocation')
            .populate('buyer', 'Name email contactNumber');

        if (!contract) {
            return next(new ErrorHandler('Contract not found', 404));
        }

        // Check if user is authorized to generate document
        if (contract.farmer.toString() !== req.user.id && contract.buyer.toString() !== req.user.id) {
            return next(new ErrorHandler('You are not authorized to generate this contract document', 403));
        }

        // Check if contract is in accepted state
        if (contract.status !== 'accepted') {
            return next(new ErrorHandler('Contract document can only be generated for accepted contracts', 400));
        }

        // In a real implementation, we would generate a PDF here
        // For now, we'll just return the contract data
        res.status(200).json({
            success: true,
            message: 'Contract document generated successfully',
            contractData: {
                contractId: contract._id,
                farmer: {
                    name: contract.farmer.Name,
                    email: contract.farmer.email,
                    phone: contract.farmer.contactNumber,
                    farmName: contract.farmer.farmName,
                    location: contract.farmer.FarmLocation
                },
                buyer: {
                    name: contract.buyer.Name,
                    email: contract.buyer.email,
                    phone: contract.buyer.contactNumber
                },
                crop: {
                    name: contract.crop.name,
                    description: contract.crop.description,
                    category: contract.crop.category,
                    organic: contract.crop.organic,
                    certification: contract.crop.certification
                },
                terms: {
                    quantity: contract.quantity,
                    unit: contract.unit,
                    pricePerUnit: contract.pricePerUnit,
                    totalAmount: contract.totalAmount,
                    expectedHarvestDate: contract.expectedHarvestDate,
                    deliveryDate: contract.deliveryDate,
                    qualityRequirements: contract.qualityRequirements,
                    specialRequirements: contract.specialRequirements
                },
                paymentTerms: contract.paymentTerms,
                createdAt: contract.createdAt,
                status: contract.status
            }
        });
    } catch (error) {
        console.error('Error generating contract document:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get contract statistics
exports.getContractStatistics = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userType = req.user.accountType;
        
        let query = {};
        if (userType === 'farmer') {
            query.farmer = userId;
        } else if (userType === 'customer') {
            query.buyer = userId;
        }
        
        // Get counts by status
        const statusCounts = await Contract.aggregate([
            { $match: query },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        // Format the results
        const stats = {
            total: 0,
            requested: 0,
            negotiating: 0,
            accepted: 0,
            active: 0,
            readyForHarvest: 0,
            harvested: 0,
            delivered: 0,
            completed: 0,
            cancelled: 0,
            disputed: 0
        };
        
        statusCounts.forEach(item => {
            stats[item._id] = item.count;
            stats.total += item.count;
        });
        
        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting contract statistics:', error);
        return next(new ErrorHandler(error.message, 500));
    }
});

module.exports = exports; 