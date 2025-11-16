// app/services/apiService.js
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a test token for authentication
 * @returns {string} Generated JWT token
 */
const generateTestToken = () =>
  // In a real app, you'd implement proper JWT generation
  // This is a simplified version that mimics the Python code
  // For testing, we're using a pre-generated token that would be valid
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjE3MTY1NjgwMDB9.iBe9wr72rJoXFZY_W4F8ZhFsEtW9NH5YWjnG9rEaXLc';
/**
 * Get authorization headers for API requests
 * @returns {Object} Headers object
 */
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${generateTestToken()}`,
});

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} data - Request data
 * @returns {Promise} Promise that resolves with the response data
 */
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const baseUrl = 'http://localhost:8000/api/v1';
  const url = `${baseUrl}/${endpoint}`;

  const options = {
    method,
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(url, options);

    // Check if the response was ok (status code 200-299)
    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail ||
          `API request failed with status ${response.status}`,
      );
    }

    // Parse successful response
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Register an operator
 * @param {Object} operatorData - Operator data
 * @returns {Promise} Promise that resolves with the response data
 */
export const registerOperator = operatorData =>
  apiRequest('operators', 'POST', operatorData);

/**
 * Register a pilot
 * @param {Object} pilotData - Pilot data
 * @returns {Promise} Promise that resolves with the response data
 */
export const registerPilot = pilotData =>
  apiRequest('pilots', 'POST', pilotData);

/**
 * Register a contact
 * @param {Object} contactData - Contact data
 * @returns {Promise} Promise that resolves with the response data
 */
export const registerContact = contactData =>
  apiRequest('contacts', 'POST', contactData);

/**
 * Register an aircraft
 * @param {Object} aircraftData - Aircraft data
 * @returns {Promise} Promise that resolves with the response data
 */
export const registerAircraft = aircraftData =>
  apiRequest('aircraft', 'POST', aircraftData);

/**
 * Get all operators
 * @returns {Promise} Promise that resolves with the response data
 */
export const getOperators = () => apiRequest('operators');

/**
 * Get all aircraft
 * @returns {Promise} Promise that resolves with the response data
 */
export const getAircraft = () => apiRequest('aircraft');

/**
 * Get all pilots
 * @returns {Promise} Promise that resolves with the response data
 */
export const getPilots = () => apiRequest('pilots');

/**
 * Get all contacts
 * @returns {Promise} Promise that resolves with the response data
 */
export const getContacts = () => apiRequest('contacts');

/**
 * Get aircraft for a given operator
 * Tries querystring first (?operator=<id>), falls back to nested route (operators/<id>/aircraft)
 * @param {string} operatorId
 * @returns {Promise<Array>} list of aircraft
 */
export const getAircraftByOperator = async (operatorId) => {
  if (!operatorId) {
    throw new Error('operatorId is required');
  }
  try {
    // Common REST filter style
    const list = await apiRequest(`aircraft?operator=${encodeURIComponent(operatorId)}`, 'GET');
    return Array.isArray(list) ? list : (list?.results || []);
  } catch (firstErr) {
    // Fallback to nested route
    const list = await apiRequest(`operators/${encodeURIComponent(operatorId)}/aircraft`, 'GET');
    return Array.isArray(list) ? list : (list?.results || []);
  }
};

/**
 * Update an aircraft with RID ID and module information
 * @param {string} aircraftId - Aircraft UUID
 * @param {Object} updateData - Data to update (rid_id, module_esn, etc.)
 * @returns {Promise} Promise that resolves with the updated aircraft data
 */
export const updateAircraft = (aircraftId, updateData) =>
  apiRequest(`aircraft/${aircraftId}`, 'PATCH', updateData);

/**
 * Create/Activate a RID module
 * @param {Object} moduleData - RID module data
 * @param {string} moduleData.rid_id - RID ID (UUID v4, required or auto-generated)
 * @param {string} moduleData.operator - Operator UUID (required)
 * @param {string} moduleData.aircraft - Aircraft UUID (optional)
 * @param {string} moduleData.module_esn - Electronic Serial Number (required, unique)
 * @param {string} moduleData.module_port - USB port (optional)
 * @param {string} moduleData.module_type - Module type (optional, defaults to "ESP32-S3")
 * @param {string} moduleData.status - Status (optional, defaults to "active")
 * @param {string} moduleData.activation_status - temporary or permanent (optional, defaults to "temporary")
 * @returns {Promise} Promise that resolves with the created RID module data
 */
export const createRidModule = (moduleData) =>
  apiRequest('rid-modules', 'POST', moduleData);

/**
 * Check if a RID module exists by ESN
 * @param {string} moduleEsn - Electronic Serial Number
 * @returns {Promise} Promise that resolves with the module data or null if not found
 */
export const getRidModuleByEsn = async (moduleEsn) => {
  try {
    return await apiRequest(`rid-modules/by-esn/${encodeURIComponent(moduleEsn)}`, 'GET');
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('Not found')) {
      return null;
    }
    throw error;
  }
};

/**
 * Generate a RID ID as a UUID
 * Format: e0c8a7f2-d6f0-4f33-a101-7b5b93da565f
 * @param {string} operatorId - Operator UUID
 * @param {string} aircraftId - Aircraft UUID
 * @param {string} moduleEsn - Module ESN
 * @returns {string} Generated RID ID (UUID format)
 */
export const generateRidId = (operatorId, aircraftId, moduleEsn) => {
  console.log('[RID_ID_GEN] generateRidId called - NEW UUID V4 CODE VERSION');
  // Generate a UUID v4 for the RID ID
  // Use crypto.randomUUID() if available (modern browsers), otherwise fallback to uuid library
  let ridId;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    ridId = crypto.randomUUID();
    console.log('[RID_ID_GEN] Used crypto.randomUUID():', ridId);
  } else {
    // Fallback: use uuid library if crypto.randomUUID is not available
    ridId = uuidv4();
    console.log('[RID_ID_GEN] Used uuidv4() fallback:', ridId);
  }
  
  // Validate that we got a proper UUID format (safety check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(ridId)) {
    console.error('[ERROR] Generated RID ID is not a valid UUID:', ridId);
    // Force generate a new one using uuid library as last resort
    ridId = uuidv4();
    console.log('[RID_ID_GEN] Regenerated with uuidv4() after validation failed:', ridId);
  }
  
  console.log('[RID_ID_GEN] Final RID ID:', ridId);
  return ridId;
};

// Export all functions as a default object
export default {
  registerOperator,
  registerPilot,
  registerContact,
  registerAircraft,
  getOperators,
  getAircraft,
  getAircraftByOperator,
  getPilots,
  getContacts,
  updateAircraft,
  generateRidId,
  createRidModule,
  getRidModuleByEsn,
};
