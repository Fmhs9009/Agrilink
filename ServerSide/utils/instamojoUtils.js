const crypto = require('crypto');
const { initializeInstamojo } = require('../config/instamojo');
const ErrorHandler = require('./errorHandler');

/**
 * Create an Instamojo payment request
 * @param {Object} paymentData - Payment request data
 * @returns {Promise<Object>} Payment request response
 */
const createPaymentRequest = async (paymentData) => {
  try {
    const Insta = initializeInstamojo();
    
    // Validate required fields
    const requiredFields = ['purpose', 'amount', 'buyer_name', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        throw new ErrorHandler(`Missing required field: ${field}`, 400);
      }
    }
    
    // Set default redirect and webhook URLs if not provided
    if (!paymentData.redirect_url) {
      paymentData.redirect_url = process.env.INSTAMOJO_REDIRECT_URL;
    }
    
    if (!paymentData.webhook) {
      paymentData.webhook = process.env.INSTAMOJO_WEBHOOK_URL;
    }
    
    // Convert amount to string (Instamojo requirement)
    if (typeof paymentData.amount === 'number') {
      paymentData.amount = paymentData.amount.toString();
    }
    
    // Create a new payment request
    return new Promise((resolve, reject) => {
      Insta.createPayment(paymentData, (error, response) => {
        if (error) {
          console.error('Instamojo payment creation error:', error);
          return reject(new ErrorHandler('Failed to create payment request', 500));
        }
        
        try {
          // Parse the response
          const responseData = JSON.parse(response);
          
          if (responseData.success) {
            // Return payment details
            return resolve({
              paymentRequest: responseData.payment_request,
              paymentUrl: responseData.payment_request.longurl
            });
          } else {
            console.error('Instamojo error response:', responseData);
            return reject(new ErrorHandler(responseData.message || 'Payment creation failed', 400));
          }
        } catch (parseError) {
          console.error('Error parsing Instamojo response:', parseError);
          return reject(new ErrorHandler('Invalid response from payment gateway', 500));
        }
      });
    });
  } catch (error) {
    console.error('Error in createPaymentRequest:', error);
    throw error instanceof ErrorHandler ? error : new ErrorHandler('Payment request failed', 500);
  }
};

/**
 * Verify Instamojo payment status
 * @param {string} paymentRequestId - Payment request ID
 * @param {string} paymentId - Payment ID (optional)
 * @returns {Promise<Object>} Payment status
 */
const verifyPayment = async (paymentRequestId, paymentId = null) => {
  try {
    const Insta = initializeInstamojo();
    
    return new Promise((resolve, reject) => {
      Insta.getPaymentRequestStatus(paymentRequestId, (error, response) => {
        if (error) {
          console.error('Instamojo verification error:', error);
          return reject(new ErrorHandler('Failed to verify payment', 500));
        }
        
        try {
          // Parse the response
          const responseData = JSON.parse(response);
          
          if (responseData.success) {
            // If payment ID is provided, verify that specific payment
            if (paymentId && responseData.payment_request.payments) {
              const payment = responseData.payment_request.payments.find(p => p.payment_id === paymentId);
              
              if (!payment) {
                return reject(new ErrorHandler('Payment not found', 404));
              }
              
              return resolve({
                paymentRequest: responseData.payment_request,
                payment,
                status: payment.status
              });
            }
            
            // Return payment request status
            return resolve({
              paymentRequest: responseData.payment_request,
              status: responseData.payment_request.status
            });
          } else {
            console.error('Instamojo error response:', responseData);
            return reject(new ErrorHandler(responseData.message || 'Payment verification failed', 400));
          }
        } catch (parseError) {
          console.error('Error parsing Instamojo response:', parseError);
          return reject(new ErrorHandler('Invalid response from payment gateway', 500));
        }
      });
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    throw error instanceof ErrorHandler ? error : new ErrorHandler('Payment verification failed', 500);
  }
};

/**
 * Validate Instamojo webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Webhook signature from headers
 * @returns {boolean} Is signature valid
 */
const validateWebhookSignature = (payload, signature) => {
  try {
    const salt = process.env.INSTAMOJO_SALT;
    
    if (!salt) {
      console.error('Missing Instamojo salt in environment variables');
      return false;
    }
    
    if (!signature) {
      console.error('Missing webhook signature');
      return false;
    }
    
    // Create data string from payload sorted by keys
    const data = Object.keys(payload)
      .sort()
      .map(key => `${key}=${payload[key]}`)
      .join('|');
    
    // Create HMAC with SHA1
    const hmac = crypto.createHmac('sha1', salt);
    hmac.update(data);
    const calculatedSignature = hmac.digest('hex');
    
    // Compare signatures
    return calculatedSignature === signature;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
};

module.exports = {
  createPaymentRequest,
  verifyPayment,
  validateWebhookSignature
}; 