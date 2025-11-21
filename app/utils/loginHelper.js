/**
 * Login Helper for Registration Backend API
 * 
 * This utility helps authenticate with the backend and store JWT tokens.
 * 
 * Usage:
 *   import { login } from '../utils/loginHelper';
 *   const token = await login('username', 'password');
 */

import { API_URL } from './apiConfig';
import { setJwtToken } from './apiConfig';

/**
 * Attempt to login and get JWT token from backend
 * Tries common djangorestframework-jwt authentication endpoints
 * 
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @returns {Promise<string>} JWT token
 * @throws {Error} If login fails
 */
export const login = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  // Common JWT authentication endpoints for djangorestframework-jwt
  const endpoints = [
    '/api-token-auth/',
    '/token-auth/',
    '/auth/login/',
    '/auth/token/',
    '/login/',
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        const token = data.token || data.access || data;
        
        if (token && typeof token === 'string') {
          // Store token automatically
          setJwtToken(token);
          console.log('[Login] Token obtained and stored successfully');
          return token;
        }
      } else if (response.status === 401) {
        // Wrong credentials, don't try other endpoints
        throw new Error('Invalid username or password');
      } else if (response.status === 404) {
        // Endpoint doesn't exist, try next one
        continue;
      }
    } catch (error) {
      lastError = error;
      // Continue to next endpoint
      continue;
    }
  }

  // If we get here, all endpoints failed
  throw lastError || new Error(
    'Login failed: Could not find valid authentication endpoint. ' +
    'Please contact the backend administrator for the correct login endpoint.'
  );
};

/**
 * Check if user is currently authenticated (has a token)
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('jwt_token');
  return !!token;
};

/**
 * Logout - clear the stored token
 */
export const logout = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  console.log('[Logout] Token cleared');
};

/**
 * Get current token (if any)
 * @returns {string|null} JWT token or null
 */
export const getCurrentToken = () => {
  return localStorage.getItem('jwt_token');
};

