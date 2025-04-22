const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../Middleware/auth');
const paymentController = require('../Controller/paymentController');

// Create payment request
router.post('/create', verifyToken, paymentController.createPayment);

// Handle Instamojo webhook (no auth required as it's called by Instamojo)
router.post('/webhook', paymentController.handleWebhook);

// Verify payment status after redirection
router.get('/:id/verify', verifyToken, paymentController.verifyPayment);

// Get payment details
router.get('/:id', verifyToken, paymentController.getPaymentDetails);

// Admin: Mark payment as disbursed
router.put('/:id/disburse', verifyToken, isAdmin, paymentController.markAsDisbursed);

module.exports = router; 