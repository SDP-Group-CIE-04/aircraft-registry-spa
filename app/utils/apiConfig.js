/**
 * API Configuration
 * Centralized configuration for the Registration Backend API
 */

// Get API base URL from environment variable, with fallback
// Remove trailing slash if present
const getBaseUrl = () => {
  // For local testing, use localhost backend
  const url = 'http://127.0.0.1:8000';
  return url.replace(/\/$/, ''); // Remove trailing slash
};

export const API_BASE_URL = getBaseUrl();

// Get API version from environment variable, with fallback
export const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

// Construct the full API base URL (no trailing slash)
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// Log API URL in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('[API Config] API_URL:', API_URL);
  console.log(
    '[API Config] REACT_APP_REGISTRATION_API_URL:',
    process.env.REACT_APP_REGISTRATION_API_URL,
  );
}

/**
 * Get JWT token from localStorage or return null
 * The token should be stored with key 'jwt_token' or 'auth_token'
 * @returns {string|null} JWT token or null if not found
 */
export const getJwtToken = () => {
  // Try multiple possible storage keys
  const token =
    localStorage.getItem('jwt_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    null;

  return token;
};

/**
 * Store JWT token in localStorage
 * @param {string} token - JWT token to store
 */
export const setJwtToken = token => {
  if (token) {
    localStorage.setItem('jwt_token', token);
  } else {
    localStorage.removeItem('jwt_token');
  }
};

/**
 * Remove JWT token from localStorage
 */
export const removeJwtToken = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
};
