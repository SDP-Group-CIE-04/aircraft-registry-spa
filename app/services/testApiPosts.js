// app/services/testApiPosts.js
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:8000/api/v1';

const generateTestToken = () => {
  const payload = {
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    scope: 'read:privileged',
  };
  // Backend decodes with verify=false, any secret works
  return jwt.sign(payload, 'test-secret');
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${generateTestToken()}`,
});

const post = async (path, data) => {
  try {
    const res = await axios.post(`${BASE_URL}/${path}`, data, {
      headers: authHeaders(),
    });
    return { ok: true, data: res.data, status: res.status };
  } catch (error) {
    if (error.response) {
      return {
        ok: false,
        status: error.response.status,
        data: error.response.data,
      };
    }
    return { ok: false, error: error.message };
  }
};

async function createOperator() {
  const payload = {
    company_name: 'Test Drone Company',
    website: 'https://testdronecompany.com',
    email: 'contact@testdronecompany.com',
    phone_number: '1234567890',
    operator_type: 2,
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
      country: 'AE',
    },
  };

  // 1) Create operator
  const res = await post('operators', payload);
  if (!res.ok)
    throw new Error(`Operator create failed: ${JSON.stringify(res, null, 2)}`);

  // The backend’s POST serializer doesn’t return id; fetch it
  try {
    const list = await axios.get(`${BASE_URL}/operators`, {
      headers: authHeaders(),
    });
    if (list.status === 200 && Array.isArray(list.data)) {
      const match =
        list.data.find(
          o =>
            o.email === payload.email &&
            o.company_name === payload.company_name,
        ) || list.data[list.data.length - 1];
      if (match && match.id) return match.id;
    }
  } catch (e) {
    // fall through to error
  }
  throw new Error('Could not resolve operator id after creation');
}

async function testContacts(operatorId) {
  const payload = {
    operator: operatorId, // must be UUID, not nested object
    role_type: 1,
    person: {
      first_name: 'Alice',
      middle_name: 'Q',
      last_name: 'Pilot',
      email: 'alice@example.com',
      phone_number: '1234567890',
      date_of_birth: '1990-05-20', // required
    },
    address: {
      address_line_1: '42 Person Ave',
      address_line_2: '-', // non-blank
      address_line_3: '-', // non-blank
      postcode: '42424',
      city: 'Dubai',
      country: 'AE',
    },
  };
  return post('contacts', payload);
}

async function testPilots(operatorId) {
  const payload = {
    operator: operatorId, // must be UUID
    is_active: true,
    person: {
      first_name: 'Bob',
      middle_name: 'R',
      last_name: 'Aviator',
      email: 'bob@example.com',
      phone_number: '1234567890',
      date_of_birth: '1988-07-15', // required
    },
    address: {
      address_line_1: '7 Runway Rd',
      address_line_2: '-', // non-blank
      address_line_3: '-', // non-blank
      postcode: '77777',
      city: 'Dubai',
      country: 'AE',
    },
    // Do NOT include tests in create payload; add later via dedicated endpoint if needed
  };
  return post('pilots', payload);
}

async function fetchManufacturerIdOrEmpty() {
  try {
    const res = await axios.get(`${BASE_URL}/manufacturers`);
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0].id;
    }
  } catch (_) {}
  // Serializer create() handles falsy/empty manufacturer by creating a default
  return '';
}

async function testAircraft(operatorId) {
  const manufacturerId = await fetchManufacturerIdOrEmpty();

  const payload = {
    operator: operatorId, // must be UUID
    mass: 12, // integer
    manufacturer: manufacturerId, // id or '' to let backend choose/create
    model: 'SkySwift 100',
    esn: uuidv4()
      .replace(/-/g, '')
      .padEnd(48, '0')
      .slice(0, 48),
    maci_number: 'MACI-001',
    registration_mark: 'A6-TEST',
    category: 2,
    sub_category: 7,
    is_airworthy: true,
    icao_aircraft_type_designator: 'UAV',
    max_certified_takeoff_weight: 12.5,
    status: 1,
  };
  return post('aircraft', payload);
}

(async () => {
  try {
    console.log('Creating operator ...');
    const operatorId = await createOperator();
    console.log('Operator ID:', operatorId);

    console.log('Testing POST /contacts ...');
    const contactRes = await testContacts(operatorId);
    console.log(JSON.stringify(contactRes, null, 2));

    console.log('Testing POST /pilots ...');
    const pilotRes = await testPilots(operatorId);
    console.log(JSON.stringify(pilotRes, null, 2));

    console.log('Testing POST /aircraft ...');
    const aircraftRes = await testAircraft(operatorId);
    console.log(JSON.stringify(aircraftRes, null, 2));
  } catch (e) {
    console.error(e.message);
  }
})();
