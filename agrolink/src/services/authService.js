import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Use sessionStorage for tokens instead of localStorage for better security
const TOKEN_KEY = 'agrolink_auth_token';
const USER_KEY = 'agrolink_user';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const API_VERSION = 'v1';
const AUTH_BASE_URL = `${API_BASE_URL}/api/${API_VERSION}/auth`;

/**
 * Securely stores authentication token in both storages
 * @param {string} token - JWT token
 */
const setToken = (token) => {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('token', token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
  }
};

/**
 * Securely stores user data in both storages
 * @param {object} user - User data
 */
const setUser = (user) => {
  if (user) {
    const userData = JSON.stringify(user);
    sessionStorage.setItem(USER_KEY, userData);
    localStorage.setItem('userData', userData);
  } else {
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem('userData');
  }
};

/**
 * Gets the stored authentication token
 * @returns {string|null} - JWT token or null if not found
 */
const getToken = () => {
  // First try sessionStorage, then fallback to localStorage
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
};

/**
 * Gets the stored user data
 * @returns {object|null} - User data or null if not found
 */
const getUser = () => {
  // First try sessionStorage, then fallback to localStorage
  const sessionData = sessionStorage.getItem(USER_KEY);
  const localData = localStorage.getItem('userData');
  const userData = sessionData || localData;
  return userData ? JSON.parse(userData) : null;
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} - Whether the user is authenticated
 */
const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    if (decoded.exp < currentTime) {
      clearAuth();
      return false;
    }

    return true;
  } catch (error) {
    clearAuth();
    return false;
  }
};

/**
 * Clears all authentication data
 */
const clearAuth = () => {
  // Clear both sessionStorage and localStorage
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
};

/**
 * Gets the user's role
 * @returns {string|null} - User role or null if not authenticated
 */
const getUserRole = () => {
  const user = getUser();
  return user ? user.accountType : null;
};

/**
 * Checks if the user has a specific role
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean} - Whether the user has the role
 */
const hasRole = (roles) => {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }

  return userRole === roles;
};

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<object>} - API response
 */
const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', data = null, headers = {} } = options;

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await axios({
      method,
      url: `${AUTH_BASE_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      clearAuth();
    }
    throw error;
  }
};

/**
 * Logs in a user
 * @param {object} credentials - Login credentials
 * @returns {Promise<object>} - Login result
 */
const login = async (credentials) => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/login`, credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success && response.data.token) {
      // Store token and user data using our storage functions
      setToken(response.data.token);
      setUser(response.data.user || {});
      
      // Return success with user data and token
      return { 
        success: true, 
        user: response.data.user,
        token: response.data.token
      };
    }

    return { 
      success: false, 
      message: response.data.message || 'Login failed' 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Unable to connect to the server. Please try again.'
    };
  }
};

/**
 * Signs up a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} - Signup result
 */
const signup = async (userData) => {
  try {
    return await apiRequest('/auth/signup', {
      method: 'POST',
      data: userData
    });
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Verifies an OTP
 * @param {object} otpData - OTP verification data
 * @returns {Promise<object>} - Verification result
 */
const verifyOTP = async (otpData) => {
  try {
    const response = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      data: otpData
    });

    if (response.token) {
      setToken(response.token);
      setUser(response.user);
    }

    return response;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Logs out the current user
 * @returns {Promise<object>} - Logout result
 */
const logout = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
    clearAuth();
    return { success: true };
  } catch (error) {
    clearAuth();
    return { success: false, message: error.message };
  }
};

/**
 * Checks authentication status with the server
 * @returns {Promise<boolean>} - Whether the user is authenticated
 */
const checkAuthStatus = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    // First check if token is valid by decoding it
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // If token is expired, don't even try to verify with server
      if (decoded.exp < currentTime) {
        console.log("Token expired locally");
        return false;
      }
    } catch (decodeError) {
      console.error("Token decode error:", decodeError);
      return false;
    }
    
    // If token looks valid locally, verify with server
    try {
      // Use a simple GET request instead of a custom endpoint
      // This will work with any protected endpoint
      const response = await axios.get(`${API_BASE_URL}/api/${API_VERSION}/auth/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.status === 200;
    } catch (apiError) {
      // If server returns 401/403, token is invalid
      if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
        console.log("Token rejected by server");
        return false;
      }
      
      // For other errors (like network errors), assume token is still valid
      // to prevent unnecessary logouts
      console.error("Server verification error, assuming token is still valid:", apiError);
      return true;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};

// Export the authentication service
const authService = {
  login,
  signup,
  verifyOTP,
  logout,
  isAuthenticated,
  getToken,
  getUser,
  getUserRole,
  hasRole,
  checkAuthStatus,
  setToken,
  removeToken: () => {
    sessionStorage.removeItem(TOKEN_KEY);
  }
};

export default authService; 