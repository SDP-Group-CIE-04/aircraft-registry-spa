// testOperator.js
const axios = require('axios');
const jwt = require('jsonwebtoken');

/**
 * Generate a test token for authentication
 * @returns {string} Generated JWT token
 */
const generateTestToken = () => {
  // Create payload with expiration one day from now
  const payload = {
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 1 day from now
  };

  // Sign the token with the secret key
  const token = jwt.sign(payload, 'test-secret');
  return token;
};

/**
 * Test function to create an operator
 */
const testCreateOperator = async () => {
  // API endpoint
  const url = 'http://localhost:8000/api/v1/operators';

  // Test data for a new operator
  const operatorData = {
    company_name: 'Test Drone Company',
    website: 'https://testdronecompany.com',
    email: 'contact@testdronecompany.com',
    phone_number: '1234567890',
    operator_type: 2, // 2 = Non-LUC
    vat_number: 'VAT123456',
    insurance_number: 'INS123456',
    company_number: 'COMP123456',
    country: 'AE',
    address: {
      address_line_1: '123 Drone Street',
      address_line_2: 'Innovation District',
      address_line_3: '-',
      postcode: '12345',
      city: 'Abu Dhabi',
      country: 'UAE', // Backend will convert to AE
    },
  };

  // Headers
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${generateTestToken()}`,
  };

  try {
    // Make the POST request
    const response = await axios.post(url, operatorData, { headers });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${error.response.data}`,
      );
    } else if (error.request) {
      throw new Error('No response received. Is the server running?');
    } else {
      throw new Error('Error setting up request:', error.message);
    }
  }
};

// Execute the test
testCreateOperator();
