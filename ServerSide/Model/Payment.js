const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Contract reference
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  
  // User references
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment stage (advance, midterm, final)
  paymentStage: {
    type: String,
    enum: ['advance', 'midterm', 'final'],
    required: true
  },
  
  // Amount details
  amount: {
    type: Number,
    required: true
  },
  
  percentage: {
    type: Number,
    required: true
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'verified', 'disbursed'],
    default: 'pending'
  },
  
  // Payment gateway details
  gateway: {
    type: String,
    enum: ['instamojo', 'manual', 'other'],
    default: 'instamojo'
  },
  
  // Instamojo specific fields
  paymentRequestId: String,
  paymentId: String,
  paymentLink: String,
  
  // Admin disbursement tracking
  disbursed: {
    type: Boolean,
    default: false
  },
  
  disbursedAt: Date,
  
  disbursedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Transaction data received from payment gateway
  transactionData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Payment verification data 
  verificationData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Notes for admins
  adminNotes: String,
  
  // Payment description
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
paymentSchema.index({ contract: 1, paymentStage: 1 });
paymentSchema.index({ farmer: 1 });
paymentSchema.index({ buyer: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ disbursed: 1 });

module.exports = mongoose.model('Payment', paymentSchema); 