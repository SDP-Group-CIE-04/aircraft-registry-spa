/**
 * Serial API Detection & Loading
 * Checks browser and returns preferred serial API.
 */

let serialPolyfill = null;

/**
 * Load the web-serial-polyfill dynamically
 * This is done lazily to avoid issues if the module isn't available
 */
function loadPolyfill() {
  if (serialPolyfill === null) {
    try {
      // eslint-disable-next-line global-require
      const polyfill = require('web-serial-polyfill');
      serialPolyfill = polyfill.serial;
    } catch (e) {
      console.warn('web-serial-polyfill not available:', e);
      serialPolyfill = false;
    }
  }
  return serialPolyfill;
}

/**
 * Checks browser and returns preferred serial API.
 *
 * @returns {Serial|null} The serial API object or null if not supported
 */
export function loadSerialApi() {
  // Check for native Web Serial API (Chrome/Edge 89+)
  if ('serial' in navigator) {
    return navigator.serial;
  }

  // Fallback: Use Web USB polyfill for browsers with USB support
  // Note: Brave has USB support but doesn't work properly with the polyfill
  if ('usb' in navigator && !('brave' in navigator)) {
    const polyfill = loadPolyfill();
    if (polyfill) {
      return polyfill;
    }
  }

  // No serial support available
  return null;
}

/**
 * Check if Web Serial API is supported in the current browser
 * @returns {boolean}
 */
export function isSerialApiSupported() {
  return loadSerialApi() !== null;
}

