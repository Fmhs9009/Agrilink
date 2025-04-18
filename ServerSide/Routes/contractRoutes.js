const express = require('express');
const router = express.Router();
const { verifyToken, isFarmer, isBuyer } = require('../Middleware/auth');
const contractController = require('../Controller/contractController');

// This file will be implemented with actual controller functions
// For now, we'll define the route structure

// Public routes
router.get('/', contractController.getAllContracts);

// Get contract by ID
router.get('/:id', verifyToken, contractController.getContractById);

// Create a new contract request
router.post('/request', verifyToken, contractController.createContractRequest);

// Get contracts for a farmer
router.get('/farmer/contracts', verifyToken, isFarmer, contractController.getFarmerContracts);

// Get contracts for a buyer
router.get('/buyer/contracts', verifyToken, isBuyer, contractController.getBuyerContracts);

// Update contract status
router.put('/:id/status', verifyToken, contractController.updateContractStatus);

// Add progress update to contract
router.post('/:id/progress', verifyToken, contractController.addProgressUpdate);

// Negotiate contract terms
router.post('/:id/negotiate', verifyToken, contractController.negotiateContract);

// Get contract details
router.get('/:id/details', contractController.getContractDetails);

// Generate contract document
router.get('/:id/document', verifyToken, contractController.generateContractDocument);

// Get contract statistics
router.get('/stats/overview', verifyToken, contractController.getContractStatistics);

// Get all contracts for the logged-in user
router.get('/user/all', verifyToken, contractController.getContracts);

// Submit a counter offer for a contract
router.post('/:id/counter-offer', verifyToken, contractController.submitCounterOffer);

// Get contract statistics
router.get('/stats/detailed', verifyToken, contractController.getContractStats);

module.exports = router; 