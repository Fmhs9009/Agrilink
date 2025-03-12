/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1',
  TIMEOUT: 30000,
  CONTENT_TYPE: 'application/json'
};

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer',
  BUYER: 'buyer'
};

// Authentication Constants
export const AUTH_CONSTANTS = {
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'user_data',
  REMEMBER_ME_KEY: 'remember_me',
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  EXTENDED_SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  MIN_PASSWORD_LENGTH: 8
};

// Theme colors
export const THEME_COLORS = {
  primary: '#10B981',    // Green-500
  secondary: '#4F46E5',  // Indigo-600
  accent: '#F59E0B',     // Amber-500
  danger: '#EF4444',     // Red-500
  success: '#10B981',    // Green-500
  warning: '#F59E0B',    // Amber-500
  info: '#3B82F6',       // Blue-500
  light: '#F3F4F6',      // Gray-100
  dark: '#1F2937'        // Gray-800
};

// Response Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500
};

// Toast Configuration
export const TOAST_CONFIG = {
  duration: 3000,
  success: {
    style: {
      background: THEME_COLORS.success,
      color: '#FFFFFF'
    }
  },
  error: {
    style: {
      background: THEME_COLORS.danger,
      color: '#FFFFFF'
    }
  },
  warning: {
    style: {
      background: THEME_COLORS.warning,
      color: '#FFFFFF'
    }
  }
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  password: `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters long`,
  phone: 'Please enter a valid phone number',
  otp: 'Please enter a valid OTP'
};

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/signup',
  VERIFY_OTP: '/auth/verify-otp',
  PROFILE: '/profile',
  PRODUCTS: '/products',
  SHOP: '/shop',
  CART: '/cart',
  ORDERS: '/orders',
  CONTRACTS: '/contracts',
  ADMIN_DASHBOARD: '/admin/dashboard'
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Product categories
export const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Meat',
  'Poultry',
  'Seafood',
  'Herbs',
  'Nuts',
  'Seeds',
  'Honey',
  'Other'
];

// Product units
export const PRODUCT_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'ton', label: 'Ton' },
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' }
];

// Contract status
export const CONTRACT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NEGOTIATING: 'negotiating'
};

// Breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  CART: 'cart'
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Available languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' }
]; 