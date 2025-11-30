/**
 * Logger Utility
 * Provides controlled logging that can be disabled in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugMode = process.env.REACT_APP_DEBUG_MODE === 'true' || process.env.REACT_APP_DEBUG_MODE === '1';

/**
 * Log debug messages (only in development or when REACT_APP_DEBUG_MODE is enabled)
 */
export const debug = (...args) => {
  if (isDevelopment || isDebugMode) {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Log info messages (only in development or when REACT_APP_DEBUG_MODE is enabled)
 */
export const info = (...args) => {
  if (isDevelopment || isDebugMode) {
    console.info('[INFO]', ...args);
  }
};

/**
 * Log warnings (always shown)
 */
export const warn = (...args) => {
  console.warn('[WARN]', ...args);
};

/**
 * Log errors (always shown)
 */
export const error = (...args) => {
  console.error('[ERROR]', ...args);
};

