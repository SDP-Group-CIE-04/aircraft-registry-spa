// app/services/apiService.js
import { v4 as uuidv4 } from 'uuid';
import { API_URL, getJwtToken, removeJwtToken } from '../utils/apiConfig';

/**
 * Get authorization headers for API requests
 * Uses JWT token from localStorage or returns headers without auth if token is missing
 * @returns {Object} Headers object
 */
const getAuthHeaders = () => {
  const token = getJwtToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Using JWT token for authentication');
    }
  } else {
    // Warn if no token in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[API] No JWT token found. Request will be unauthenticated.');
    }
  }

  return headers;
};

/**
 * Make an API request to the Registration Backend
 * @param {string} endpoint - API endpoint (e.g., 'operators', 'aircraft', 'operators/{uuid}/aircraft')
 * @param {string} method - HTTP method (GET, POST, PATCH, PUT, DELETE)
 * @param {Object} data - Request data (for POST/PATCH/PUT requests)
 * @returns {Promise} Promise that resolves with the response data
 */
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_URL}/${cleanEndpoint}`;

  const options = {
    method,
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  };

  // Check if debug mode is enabled (used for conditional logging)
  const isDebugMode = process.env.REACT_APP_DEBUG_MODE === 'true' || process.env.REACT_APP_DEBUG_MODE === '1';

  // Log request details for PATCH requests (especially for RID module updates)
  // Only log if debug mode is enabled
  if (isDebugMode && method === 'PATCH' && data && endpoint.includes('rid-modules')) {
    console.log('[API] PATCH request to update RID module:', {
      url,
      endpoint,
      data,
      body: JSON.stringify(data, null, 2),
    });
  }

  try {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized - token might be expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      removeJwtToken();
      // Try to parse error response for more details
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: 'Unauthorized: Invalid or expired token' };
      }
      const errorMessage =
        errorData?.detail ||
        errorData?.message ||
        errorData?.error ||
        'Unauthorized: Invalid or expired token';
      throw new Error(errorMessage);
    }

    // Check if the response was ok (status code 200-299)
    if (!response.ok) {
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: `API request failed with status ${response.status}` };
      }

      // Handle different error response formats
      const errorMessage =
        errorData?.detail ||
        errorData?.message ||
        errorData?.error ||
        `API request failed with status ${response.status}`;

      throw new Error(errorMessage);
    }

    // Handle 204 No Content (successful but no response body)
    if (response.status === 204) {
      return null;
    }

    // Parse successful response
    const responseData = await response.json();
    
    // Log response details for PATCH requests (especially for RID module updates)
    // Only log if debug mode is enabled
    if (isDebugMode && method === 'PATCH' && endpoint.includes('rid-modules')) {
      console.log('[API] PATCH response from RID module update:', {
        status: response.status,
        data: responseData,
        stringified: JSON.stringify(responseData, null, 2),
      });
    }
    
    return responseData;
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        `Network error: Unable to connect to ${API_URL}. Please check your internet connection and ensure the API server is running.`,
      );
    }
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
 * @returns {Promise} Promise that resolves with the response data (array or paginated result)
 */
export const getOperators = async () => {
  const result = await apiRequest('operators');
  // Handle paginated responses
  return Array.isArray(result) ? result : result?.results || [];
};

/**
 * Get all aircraft
 * @returns {Promise} Promise that resolves with the response data (array or paginated result)
 */
export const getAircraft = async () => {
  const result = await apiRequest('aircraft');
  // Handle paginated responses
  return Array.isArray(result) ? result : result?.results || [];
};

/**
 * Get aircraft details by UUID
 * @param {string} aircraftUuid - Aircraft UUID
 * @returns {Promise} Promise that resolves with the aircraft details
 */
export const getAircraftDetails = aircraftUuid =>
  apiRequest(`aircraft/${aircraftUuid}`);

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
 * Get all RID modules
 * @returns {Promise} Promise that resolves with the response data (array or paginated result)
 */
export const getRidModules = async () => {
  try {
    const result = await apiRequest('rid-modules');
    // Handle paginated responses
    return Array.isArray(result) ? result : result?.results || [];
  } catch (error) {
    // If endpoint doesn't exist, return empty array
    if (error.message.includes('404') || error.message.includes('Not found')) {
      return [];
    }
    throw error;
  }
};

/**
 * Get operator details by UUID
 * @param {string} operatorUuid - Operator UUID
 * @returns {Promise} Promise that resolves with the operator details
 */
export const getOperatorDetails = operatorUuid =>
  apiRequest(`operators/${operatorUuid}`);

/**
 * Get aircraft for a given operator
 * Uses the nested route: GET /api/v1/operators/{uuid}/aircraft
 * @param {string} operatorId - Operator UUID
 * @returns {Promise<Array>} list of aircraft
 */
export const getAircraftByOperator = async (operatorId) => {
  if (!operatorId) {
    throw new Error('operatorId is required');
  }
  try {
    // Use the nested route as per API specification
    const list = await apiRequest(
      `operators/${encodeURIComponent(operatorId)}/aircraft`,
      'GET',
    );
    return Array.isArray(list) ? list : list?.results || [];
  } catch (error) {
    console.error('Error fetching aircraft for operator:', error);
    throw error;
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
 * Update a RID module
 * @param {string} moduleId - RID module UUID
 * @param {Object} updateData - Data to update
 * @returns {Promise} Promise that resolves with the updated RID module data
 */
export const updateRidModule = (moduleId, updateData) =>
  apiRequest(`rid-modules/${moduleId}`, 'PATCH', updateData);

/**
 * Update a RID module's RID ID
 * @param {string} moduleId - RID module UUID
 * @param {string} ridId - New RID ID (UUID v4)
 * @returns {Promise} Promise that resolves with the updated RID module data
 */
export const updateRidModuleRidId = (moduleId, ridId) =>
  apiRequest(`rid-modules/${moduleId}/rid-id`, 'PATCH', { rid_id: ridId });

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
  getOperatorDetails,
  getAircraft,
  getAircraftDetails,
  getAircraftByOperator,
  getPilots,
  getContacts,
  updateAircraft,
  generateRidId,
  createRidModule,
  getRidModuleByEsn,
  updateRidModule,
  updateRidModuleRidId,
  getRidModules,
};
