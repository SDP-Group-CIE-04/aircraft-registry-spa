/**
 * Authentication Helper Utilities
 * 
 * This file provides helper functions for managing JWT authentication
 * with the Registration Backend API.
 */

import { getJwtToken, setJwtToken, removeJwtToken } from './apiConfig';

/**
 * Check if user has a valid JWT token stored
 * @returns {boolean} True if token exists
 */
export const hasToken = () => {
  const token = getJwtToken();
  return !!token;
};

/**
 * Get the current JWT token
 * @returns {string|null} JWT token or null
 */
export const getToken = () => getJwtToken();

/**
 * Set the JWT token (typically after login)
 * @param {string} token - JWT token from backend
 */
export const setToken = token => {
  setJwtToken(token);
};

/**
 * Clear the JWT token (typically on logout)
 */
export const clearToken = () => {
  removeJwtToken();
};

/**
 * Example: How to set JWT token after login
 * 
 * After receiving a JWT token from your authentication endpoint:
 * 
 * ```javascript
 * import { setToken } from '../utils/authHelper';
 * 
 * // After successful login
 * const response = await fetch('https://register-ku.duckdns.org/api/v1/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ username, password })
 * });
 * 
 * const data = await response.json();
 * if (data.token) {
 *   setToken(data.token);
 * }
 * ```
 * 
 * Or manually set token in browser console:
 * ```javascript
 * localStorage.setItem('jwt_token', 'your-jwt-token-here');
 * ```
 */

