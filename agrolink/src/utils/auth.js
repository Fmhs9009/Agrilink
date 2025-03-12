/**
 * Get the authentication token from localStorage
 * @returns {string|null} - The authentication token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The authentication token to store
 */
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

/**
 * Check if the user is authenticated (has a token)
 * @returns {boolean} - Whether the user is authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Parse the JWT token to get user information
 * @returns {Object|null} - The decoded token payload or null if invalid
 */
export const getDecodedToken = () => {
  try {
    const token = getAuthToken();
    if (!token) return null;
    
    // Split the token and get the payload part
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get the user ID from the decoded token
 * @returns {string|null} - The user ID or null if not found
 */
export const getUserId = () => {
  const decoded = getDecodedToken();
  return decoded ? decoded.id : null;
};

/**
 * Get the user role from the decoded token
 * @returns {string|null} - The user role or null if not found
 */
export const getUserRole = () => {
  const decoded = getDecodedToken();
  return decoded ? decoded.role : null;
};

/**
 * Check if the token is expired
 * @returns {boolean} - Whether the token is expired
 */
export const isTokenExpired = () => {
  const decoded = getDecodedToken();
  if (!decoded || !decoded.exp) return true;
  
  // Compare expiration time with current time
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Check if the user has a specific role
 * @param {string|string[]} roles - The role(s) to check
 * @returns {boolean} - Whether the user has the specified role
 */
export const hasRole = (roles) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
}; 