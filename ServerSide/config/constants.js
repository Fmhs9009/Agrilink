// Environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';

// Server Configuration
const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || 'localhost',
  API_PREFIX: '/api',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

// Database Configuration
const DB_CONFIG = {
  URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agrolink',
  OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

// Authentication Configuration
const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: '24h',
  COOKIE_EXPIRE: 24 * 60 * 60 * 1000, // 24 hours
  SALT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 8,
  OTP_EXPIRE: 10 * 60 * 1000, // 10 minutes
  OTP_LENGTH: 6
};

// User Roles
const ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer',
  BUYER: 'buyer'
};

// Response Status Codes
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500
};

// File Upload Configuration
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 5
};

// Validation Messages
const VALIDATION_MESSAGES = {
  required: '{PATH} is required',
  minlength: '{PATH} must be at least {MINLENGTH} characters',
  maxlength: '{PATH} cannot exceed {MAXLENGTH} characters',
  min: '{PATH} must be at least {MIN}',
  max: '{PATH} cannot exceed {MAX}',
  enum: '{PATH} must be one of: {ENUM}',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`
};

// Contract Status
const CONTRACT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Product Categories
const PRODUCT_CATEGORIES = {
  GRAINS: 'grains',
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  DAIRY: 'dairy',
  MEAT: 'meat',
  OTHER: 'other'
};

module.exports = {
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  SERVER_CONFIG,
  DB_CONFIG,
  AUTH_CONFIG,
  ROLES,
  STATUS_CODES,
  UPLOAD_CONFIG,
  VALIDATION_MESSAGES,
  CONTRACT_STATUS,
  PRODUCT_CATEGORIES
}; 