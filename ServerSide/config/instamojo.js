const Insta = require('instamojo-nodejs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Initialize Instamojo with API credentials
 * @returns {Object} Instamojo instance
 */
const initializeInstamojo = () => {
  const API_KEY = process.env.INSTAMOJO_API_KEY;
  const AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
  
  if (!API_KEY || !AUTH_TOKEN) {
    console.error('Missing Instamojo API credentials in environment variables');
    throw new Error('Instamojo API credentials not configured');
  }
  
  try {
    // Set API keys
    Insta.setKeys(API_KEY, AUTH_TOKEN);
    
    // Enable sandbox mode for testing (based on environment)
    const isSandbox = process.env.NODE_ENV !== 'production';
    Insta.isSandboxMode(isSandbox);
    
    console.log(`Instamojo initialized in ${isSandbox ? 'SANDBOX' : 'PRODUCTION'} mode`);
    return Insta;
  } catch (error) {
    console.error('Error initializing Instamojo:', error);
    throw new Error('Failed to initialize Instamojo');
  }
};

module.exports = { 
  Insta,
  initializeInstamojo 
}; 