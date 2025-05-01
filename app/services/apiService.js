// app/services/apiService.js

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

// Export all functions as a default object
export default {
  registerOperator,
  registerPilot,
  registerContact,
  registerAircraft,
  getOperators,
};
