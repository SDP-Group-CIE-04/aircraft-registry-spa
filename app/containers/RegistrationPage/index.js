import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { makeStyles } from '@material-ui/core/styles';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Snackbar,
} from '@material-ui/core';
import bgImage from '../../images/blurBg.jpg';
import { OPERATOR_TYPES, COUNTRIES, INITIAL_ADDRESS } from './constants';
import * as apiService from '../../services/apiService';
import history from '../../utils/history';

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'stretch',
  },
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '2rem',
  },
  fullBgImage: {
    backgroundImage: `url(${bgImage})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  },
  paper: {
    padding: 40,
    maxWidth: 800,
    width: '100%',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  textField: {
    backgroundColor: 'white',
    borderRadius: 4,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    marginTop: '20px',
    '&:hover': {
      backgroundColor: '#1976D2',
    },
  },
  backButton: {
    marginTop: '20px',
  },
  sectionTitle: {
    marginTop: '20px',
    marginBottom: '10px',
  },
  personSection: {
    marginTop: '10px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
}));

// Role type options for contacts
const CONTACT_ROLE_TYPES = [
  { value: 0, label: 'Primary Contact' },
  { value: 1, label: 'Technical Contact' },
  { value: 2, label: 'Business Contact' },
  { value: 3, label: 'Emergency Contact' },
];

// Aircraft status options
const AIRCRAFT_STATUS = [
  { value: 0, label: 'Inactive' },
  { value: 1, label: 'Active' },
  { value: 2, label: 'Maintenance' },
  { value: 3, label: 'Grounded' },
];

// Aircraft sub-category options
const SUB_CATEGORIES = [
  { value: 1, label: 'Fixed-wing' },
  { value: 2, label: 'Rotorcraft' },
  { value: 3, label: 'Hybrid' },
  { value: 4, label: 'Multirotor' },
  { value: 5, label: 'VTOL' },
  { value: 6, label: 'Balloon/Airship' },
  { value: 7, label: 'Other' },
];

// Sample manufacturers for the dropdown (in a real app, you'd fetch these from an API)
const MANUFACTURERS = [
  { id: '6f9cd973-15b9-4066-b4d0-1e8bbd0f279d', name: 'Parrot' },
  { id: '4effcea2-e9d4-4696-891f-52d350d68a9f', name: 'senseFly' },
  { id: '8a7b3c1d-2e4f-5g6h-7i8j-9k0l1m2n3o4p', name: 'DJI' },
  { id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', name: 'Autel Robotics' },
];

export default function RegistrationPage() {
  const classes = useStyles();
  // const history = useHistory(); // remove this line
  const [entityType, setEntityType] = useState('operator');
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [formData, setFormData] = useState({
    // Default operator data structure matching the backend test code
    company_name: '',
    website: '',
    email: '',
    phone_number: '',
    operator_type: 2, // Default to Non-LUC
    vat_number: '',
    insurance_number: '',
    company_number: '',
    country: 'AE',
    address: { ...INITIAL_ADDRESS },
  });

  // Spotlight Login fields
  const [spotlightPassword, setSpotlightPassword] = useState('');
  const [spotlightConfirmPassword, setSpotlightConfirmPassword] = useState('');
  const [spotlightPasswordError, setSpotlightPasswordError] = useState('');

  const [pilotData, setPilotData] = useState({
    operator: '',
    is_active: true,
    tests: {
      name: null,
    },
    person: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      date_of_birth: null,
    },
    address: { ...INITIAL_ADDRESS },
  });

  const [contactData, setContactData] = useState({
    operator: '',
    person: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      date_of_birth: null,
    },
    role_type: 1,
    address: { ...INITIAL_ADDRESS },
  });

  const [aircraftData, setAircraftData] = useState({
    operator: '',
    mass: 0,
    manufacturer: '',
    model: '',
    esn: '',
    maci_number: '',
    status: 1, // Default to Active
    registration_mark: '',
    sub_category: 7, // Default to Other
    type_certificate: {
      type_certificate_id: '',
      type_certificate_issuing_country: '',
      type_certificate_holder: '',
      type_certificate_holder_country: '',
    },
    master_series: '',
    series: '',
    popular_name: '',
    icao_aircraft_type_designator: '',
    max_certified_takeoff_weight: 0,
  });

  // Fetch operators for the dropdown
  useEffect(() => {
    if (
      entityType === 'pilot' ||
      entityType === 'contact' ||
      entityType === 'aircraft'
    ) {
      fetchOperators();
    }
  }, [entityType]);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const data = await apiService.getOperators();
      setOperators(data);
    } catch (error) {
      console.error('Error fetching operators:', error);
      // Fallback to dummy data
      setOperators([
        {
          id: '566d63bb-cb1c-42dc-9a51-baef0d0a8d04',
          company_name: 'Electric Inspection',
        },
        {
          id: '41174c3f-e86c-4e5a-a629-32d4d9da6011',
          company_name: 'A.J. August Photography',
        },
      ]);
      showNotification(`Error loading operators: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  const resetForm = () => {
    if (entityType === 'operator') {
      setFormData({
        company_name: '',
        website: '',
        email: '',
        phone_number: '',
        operator_type: 2,
        vat_number: '',
        insurance_number: '',
        company_number: '',
        country: 'AE',
        address: { ...INITIAL_ADDRESS },
      });
    } else if (entityType === 'pilot') {
      setPilotData({
        operator: '',
        is_active: true,
        tests: { name: null },
        person: {
          first_name: '',
          middle_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          date_of_birth: null,
        },
        address: { ...INITIAL_ADDRESS },
      });
    } else if (entityType === 'contact') {
      setContactData({
        operator: '',
        person: {
          first_name: '',
          middle_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          date_of_birth: null,
        },
        role_type: 1,
        address: { ...INITIAL_ADDRESS },
      });
    } else if (entityType === 'aircraft') {
      setAircraftData({
        operator: '',
        mass: 0,
        manufacturer: '',
        model: '',
        esn: '',
        maci_number: '',
        status: 1,
        registration_mark: '',
        sub_category: 7,
        type_certificate: {
          type_certificate_id: '',
          type_certificate_issuing_country: '',
          type_certificate_holder: '',
          type_certificate_holder_country: '',
        },
        master_series: '',
        series: '',
        popular_name: '',
        icao_aircraft_type_designator: '',
        max_certified_takeoff_weight: 0,
      });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    setSubmitting(true);

    try {
      switch (entityType) {
        case 'operator':
          // Validate Spotlight Login passwords
          if (spotlightPassword !== spotlightConfirmPassword) {
            setSpotlightPasswordError('Passwords do not match');
            setSubmitting(false);
            return;
          }
          setSpotlightPasswordError('');
          // Add password to registration payload
          await apiService.registerOperator({
            ...formData,
            password: spotlightPassword,
          });
          break;
        case 'pilot':
          await apiService.registerPilot(pilotData);
          break;
        case 'contact':
          await apiService.registerContact(contactData);
          break;
        case 'aircraft':
          await apiService.registerAircraft(aircraftData);
          break;
        default:
          throw new Error('Unknown entity type');
      }
      resetForm();
      showNotification('Registration successful!', 'success');
    } catch (error) {
      showNotification(`Registration failed: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddressChange = e => {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handlePilotChange = e => {
    setPilotData({
      ...pilotData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePersonChange = (e, personType) => {
    if (personType === 'pilot') {
      setPilotData({
        ...pilotData,
        person: {
          ...pilotData.person,
          [e.target.name]: e.target.value,
        },
      });
    } else if (personType === 'contact') {
      setContactData({
        ...contactData,
        person: {
          ...contactData.person,
          [e.target.name]: e.target.value,
        },
      });
    }
  };

  const handleContactChange = e => {
    setContactData({
      ...contactData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAircraftChange = e => {
    const { name, value } = e.target;
    setAircraftData({
      ...aircraftData,
      [name]:
        name === 'mass' || name === 'max_certified_takeoff_weight'
          ? parseFloat(value)
          : value,
    });
  };

  const handlePilotAddressChange = e => {
    setPilotData({
      ...pilotData,
      address: {
        ...pilotData.address,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleContactAddressChange = e => {
    setContactData({
      ...contactData,
      address: {
        ...contactData.address,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleCertificateChange = e => {
    setAircraftData({
      ...aircraftData,
      type_certificate: {
        ...aircraftData.type_certificate,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleCheckboxChange = e => {
    setPilotData({
      ...pilotData,
      [e.target.name]: e.target.checked,
    });
  };

  const renderFields = () => {
    switch (entityType) {
      case 'operator':
        return renderOperatorFields();
      case 'aircraft':
        return renderAircraftFields();
      case 'pilot':
        return renderPilotFields();
      case 'contact':
        return renderContactFields();
      default:
        return null;
    }
  };

  const renderAircraftFields = () => (
    <>
      {/* Operator Selection */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Operator Information
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      ) : (
        <TextField
          className={classes.textField}
          select
          label="Select Operator"
          variant="outlined"
          fullWidth
          name="operator"
          value={aircraftData.operator}
          onChange={handleAircraftChange}
          required
          margin="normal"
        >
          {operators.map(operator => (
            <MenuItem key={operator.id} value={operator.id}>
              {operator.company_name}
            </MenuItem>
          ))}
        </TextField>
      )}
      {/* Basic Aircraft Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Basic Aircraft Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            select
            label="Manufacturer"
            variant="outlined"
            fullWidth
            name="manufacturer"
            value={aircraftData.manufacturer}
            onChange={handleAircraftChange}
            required
            margin="normal"
          >
            {MANUFACTURERS.map(manufacturer => (
              <MenuItem key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="Model"
            variant="outlined"
            fullWidth
            name="model"
            value={aircraftData.model}
            onChange={handleAircraftChange}
            required
            margin="normal"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="Mass (g)"
            variant="outlined"
            fullWidth
            type="number"
            name="mass"
            value={aircraftData.mass}
            onChange={handleAircraftChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            select
            label="Status"
            variant="outlined"
            fullWidth
            name="status"
            value={aircraftData.status}
            onChange={handleAircraftChange}
            required
            margin="normal"
          >
            {AIRCRAFT_STATUS.map(status => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="ESN (Electronic Serial Number)"
            variant="outlined"
            fullWidth
            name="esn"
            value={aircraftData.esn}
            onChange={handleAircraftChange}
            required
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="MACI Number"
            variant="outlined"
            fullWidth
            name="maci_number"
            value={aircraftData.maci_number}
            onChange={handleAircraftChange}
            required
            margin="normal"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="Registration Mark"
            variant="outlined"
            fullWidth
            name="registration_mark"
            value={aircraftData.registration_mark || ''}
            onChange={handleAircraftChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            select
            label="Sub-Category"
            variant="outlined"
            fullWidth
            name="sub_category"
            value={aircraftData.sub_category}
            onChange={handleAircraftChange}
            required
            margin="normal"
          >
            {SUB_CATEGORIES.map(category => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Additional Aircraft Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Additional Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="Popular Name"
            variant="outlined"
            fullWidth
            name="popular_name"
            value={aircraftData.popular_name || ''}
            onChange={handleAircraftChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="ICAO Aircraft Type Designator"
            variant="outlined"
            fullWidth
            name="icao_aircraft_type_designator"
            value={aircraftData.icao_aircraft_type_designator}
            onChange={handleAircraftChange}
            margin="normal"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="Master Series"
            variant="outlined"
            fullWidth
            name="master_series"
            value={aircraftData.master_series || ''}
            onChange={handleAircraftChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            className={classes.textField}
            label="Series"
            variant="outlined"
            fullWidth
            name="series"
            value={aircraftData.series || ''}
            onChange={handleAircraftChange}
            margin="normal"
          />
        </Grid>
      </Grid>

      <TextField
        className={classes.textField}
        label="Max Certified Takeoff Weight (kg)"
        variant="outlined"
        fullWidth
        type="number"
        name="max_certified_takeoff_weight"
        value={aircraftData.max_certified_takeoff_weight}
        onChange={handleAircraftChange}
        margin="normal"
        InputProps={{
          inputProps: {
            min: 0,
            step: 0.001,
          },
        }}
      />

      {/* Type Certificate Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Type Certificate Information
      </Typography>
      <Box className={classes.personSection}>
        <TextField
          className={classes.textField}
          label="Type Certificate ID"
          variant="outlined"
          fullWidth
          name="type_certificate_id"
          value={aircraftData.type_certificate.type_certificate_id}
          onChange={handleCertificateChange}
          margin="normal"
        />

        <TextField
          className={classes.textField}
          label="Issuing Country"
          variant="outlined"
          fullWidth
          name="type_certificate_issuing_country"
          value={aircraftData.type_certificate.type_certificate_issuing_country}
          onChange={handleCertificateChange}
          margin="normal"
        />

        <TextField
          className={classes.textField}
          label="Certificate Holder"
          variant="outlined"
          fullWidth
          name="type_certificate_holder"
          value={aircraftData.type_certificate.type_certificate_holder}
          onChange={handleCertificateChange}
          margin="normal"
        />

        <TextField
          className={classes.textField}
          label="Holder Country"
          variant="outlined"
          fullWidth
          name="type_certificate_holder_country"
          value={aircraftData.type_certificate.type_certificate_holder_country}
          onChange={handleCertificateChange}
          margin="normal"
        />
      </Box>
    </>
  );

  const renderContactFields = () => (
    <>
      {/* Operator Selection */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Operator Information
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      ) : (
        <TextField
          className={classes.textField}
          select
          label="Select Operator"
          variant="outlined"
          fullWidth
          name="operator"
          value={contactData.operator}
          onChange={handleContactChange}
          required
        >
          {operators.map(operator => (
            <MenuItem key={operator.id} value={operator.id}>
              {operator.company_name}
            </MenuItem>
          ))}
        </TextField>
      )}

      <TextField
        className={classes.textField}
        select
        label="Contact Role"
        variant="outlined"
        fullWidth
        name="role_type"
        value={contactData.role_type}
        onChange={handleContactChange}
        required
      >
        {CONTACT_ROLE_TYPES.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {/* Person Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Contact Personal Information
      </Typography>
      <Box className={classes.personSection}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              className={classes.textField}
              label="First Name"
              variant="outlined"
              fullWidth
              name="first_name"
              value={contactData.person.first_name}
              onChange={e => handlePersonChange(e, 'contact')}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              className={classes.textField}
              label="Middle Name"
              variant="outlined"
              fullWidth
              name="middle_name"
              value={contactData.person.middle_name}
              onChange={e => handlePersonChange(e, 'contact')}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              className={classes.textField}
              label="Last Name"
              variant="outlined"
              fullWidth
              name="last_name"
              value={contactData.person.last_name}
              onChange={e => handlePersonChange(e, 'contact')}
              required
              margin="normal"
            />
          </Grid>
        </Grid>

        <TextField
          className={classes.textField}
          label="Email"
          variant="outlined"
          fullWidth
          type="email"
          name="email"
          value={contactData.person.email}
          onChange={e => handlePersonChange(e, 'contact')}
          required
          margin="normal"
        />

        <TextField
          className={classes.textField}
          label="Phone Number"
          variant="outlined"
          fullWidth
          name="phone_number"
          value={contactData.person.phone_number}
          onChange={e => handlePersonChange(e, 'contact')}
          required
          margin="normal"
          placeholder="+123456789"
        />

        <TextField
          className={classes.textField}
          label="Date of Birth"
          variant="outlined"
          fullWidth
          type="date"
          name="date_of_birth"
          InputLabelProps={{
            shrink: true,
          }}
          onChange={e => handlePersonChange(e, 'contact')}
          margin="normal"
        />
      </Box>

      {/* Address Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Contact Address
      </Typography>
      <Box className={classes.personSection}>
        <TextField
          className={classes.textField}
          label="Address Line 1"
          variant="outlined"
          fullWidth
          name="address_line_1"
          value={contactData.address.address_line_1}
          onChange={handleContactAddressChange}
          required
          margin="normal"
        />
        <TextField
          className={classes.textField}
          label="Address Line 2"
          variant="outlined"
          fullWidth
          name="address_line_2"
          value={contactData.address.address_line_2}
          onChange={handleContactAddressChange}
          margin="normal"
        />
        <TextField
          className={classes.textField}
          label="Address Line 3"
          variant="outlined"
          fullWidth
          name="address_line_3"
          value={contactData.address.address_line_3}
          onChange={handleContactAddressChange}
          margin="normal"
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.textField}
              label="City"
              variant="outlined"
              fullWidth
              name="city"
              value={contactData.address.city}
              onChange={handleContactAddressChange}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.textField}
              label="Postal Code"
              variant="outlined"
              fullWidth
              name="postcode"
              value={contactData.address.postcode}
              onChange={handleContactAddressChange}
              required
              margin="normal"
            />
          </Grid>
        </Grid>
        <TextField
          className={classes.textField}
          select
          label="Country"
          variant="outlined"
          fullWidth
          name="country"
          value={contactData.address.country}
          onChange={handleContactAddressChange}
          required
          margin="normal"
        >
          {COUNTRIES.map(option => (
            <MenuItem key={option.code} value={option.code}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );

  const renderPilotFields = () => (
    <>
      {/* Operator Selection */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Operator Information
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      ) : (
        <TextField
          className={classes.textField}
          select
          label="Select Operator"
          variant="outlined"
          fullWidth
          name="operator"
          value={pilotData.operator}
          onChange={handlePilotChange}
          required
        >
          {operators.map(operator => (
            <MenuItem key={operator.id} value={operator.id}>
              {operator.company_name}
            </MenuItem>
          ))}
        </TextField>
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={pilotData.is_active}
            onChange={handleCheckboxChange}
            name="is_active"
            color="primary"
          />
        }
        label="Active Pilot"
      />

      {/* Person Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Personal Information
      </Typography>
      <Box className={classes.personSection}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              className={classes.textField}
              label="First Name"
              variant="outlined"
              fullWidth
              name="first_name"
              value={pilotData.person.first_name}
              onChange={e => handlePersonChange(e, 'pilot')}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              className={classes.textField}
              label="Middle Name"
              variant="outlined"
              fullWidth
              name="middle_name"
              value={pilotData.person.middle_name}
              onChange={e => handlePersonChange(e, 'pilot')}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              className={classes.textField}
              label="Last Name"
              variant="outlined"
              fullWidth
              name="last_name"
              value={pilotData.person.last_name}
              onChange={e => handlePersonChange(e, 'pilot')}
              required
              margin="normal"
            />
          </Grid>
        </Grid>

        <TextField
          className={classes.textField}
          label="Email"
          variant="outlined"
          fullWidth
          type="email"
          name="email"
          value={pilotData.person.email}
          onChange={e => handlePersonChange(e, 'pilot')}
          required
          margin="normal"
        />

        <TextField
          className={classes.textField}
          label="Phone Number"
          variant="outlined"
          fullWidth
          name="phone_number"
          value={pilotData.person.phone_number}
          onChange={e => handlePersonChange(e, 'pilot')}
          required
          margin="normal"
          placeholder="+123456789"
        />

        <TextField
          className={classes.textField}
          label="Date of Birth"
          variant="outlined"
          fullWidth
          type="date"
          name="date_of_birth"
          InputLabelProps={{
            shrink: true,
          }}
          onChange={e => handlePersonChange(e, 'pilot')}
          margin="normal"
        />
      </Box>

      {/* Tests section - currently minimal as per API response */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Tests
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Tests information will be added by admin after registration
      </Typography>

      {/* Address Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Pilot Address
      </Typography>
      <Box className={classes.personSection}>
        <TextField
          className={classes.textField}
          label="Address Line 1"
          variant="outlined"
          fullWidth
          name="address_line_1"
          value={pilotData.address.address_line_1}
          onChange={handlePilotAddressChange}
          required
          margin="normal"
        />
        <TextField
          className={classes.textField}
          label="Address Line 2"
          variant="outlined"
          fullWidth
          name="address_line_2"
          value={pilotData.address.address_line_2}
          onChange={handlePilotAddressChange}
          margin="normal"
        />
        <TextField
          className={classes.textField}
          label="Address Line 3"
          variant="outlined"
          fullWidth
          name="address_line_3"
          value={pilotData.address.address_line_3}
          onChange={handlePilotAddressChange}
          margin="normal"
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.textField}
              label="City"
              variant="outlined"
              fullWidth
              name="city"
              value={pilotData.address.city}
              onChange={handlePilotAddressChange}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.textField}
              label="Postal Code"
              variant="outlined"
              fullWidth
              name="postcode"
              value={pilotData.address.postcode}
              onChange={handlePilotAddressChange}
              required
              margin="normal"
            />
          </Grid>
        </Grid>
        <TextField
          className={classes.textField}
          select
          label="Country"
          variant="outlined"
          fullWidth
          name="country"
          value={pilotData.address.country}
          onChange={handlePilotAddressChange}
          required
          margin="normal"
        >
          {COUNTRIES.map(option => (
            <MenuItem key={option.code} value={option.code}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );

  const renderOperatorFields = () => (
    <>
      {/* Company Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Company Information
      </Typography>
      <TextField
        className={classes.textField}
        label="Company Name"
        variant="outlined"
        fullWidth
        name="company_name"
        value={formData.company_name}
        onChange={handleInputChange}
        required
      />
      <TextField
        className={classes.textField}
        label="Website"
        variant="outlined"
        fullWidth
        name="website"
        value={formData.website}
        onChange={handleInputChange}
      />
      <TextField
        className={classes.textField}
        label="Email"
        variant="outlined"
        fullWidth
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        required
      />
      <TextField
        className={classes.textField}
        label="Phone Number"
        variant="outlined"
        fullWidth
        name="phone_number"
        value={formData.phone_number}
        onChange={handleInputChange}
        required
      />

      {/* Spotlight Login - only for operator registration */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Spotlight Login
      </Typography>
      <TextField
        className={classes.textField}
        label="Password"
        variant="outlined"
        fullWidth
        type="password"
        name="password"
        value={spotlightPassword}
        onChange={e => setSpotlightPassword(e.target.value)}
        required
        margin="normal"
      />
      <TextField
        className={classes.textField}
        label="Confirm Password"
        variant="outlined"
        fullWidth
        type="password"
        name="spotlight_confirm_password"
        value={spotlightConfirmPassword}
        onChange={e => setSpotlightConfirmPassword(e.target.value)}
        required
        margin="normal"
        error={!!spotlightPasswordError}
        helperText={spotlightPasswordError}
      />

      {/* Business Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Business Information
      </Typography>
      <TextField
        className={classes.textField}
        select
        label="Operator Type"
        variant="outlined"
        fullWidth
        name="operator_type"
        value={formData.operator_type}
        onChange={handleInputChange}
        required
      >
        {OPERATOR_TYPES.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        className={classes.textField}
        label="VAT Number"
        variant="outlined"
        fullWidth
        name="vat_number"
        value={formData.vat_number}
        onChange={handleInputChange}
      />
      <TextField
        className={classes.textField}
        label="Company Registration Number"
        variant="outlined"
        fullWidth
        name="company_number"
        value={formData.company_number}
        onChange={handleInputChange}
        required
      />
      <TextField
        className={classes.textField}
        label="Insurance Number"
        variant="outlined"
        fullWidth
        name="insurance_number"
        value={formData.insurance_number}
        onChange={handleInputChange}
        required
      />
      <TextField
        className={classes.textField}
        select
        label="Country"
        variant="outlined"
        fullWidth
        name="country"
        value={formData.country}
        onChange={handleInputChange}
        required
      >
        {COUNTRIES.map(option => (
          <MenuItem key={option.code} value={option.code}>
            {option.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Address Information */}
      <Typography variant="h6" className={classes.sectionTitle}>
        Address Information
      </Typography>
      <Box className={classes.personSection}>
        <TextField
          className={classes.textField}
          label="Address Line 1"
          variant="outlined"
          fullWidth
          name="address_line_1"
          value={formData.address.address_line_1}
          onChange={handleAddressChange}
          required
          margin="normal"
        />
        <TextField
          className={classes.textField}
          label="Address Line 2"
          variant="outlined"
          fullWidth
          name="address_line_2"
          value={formData.address.address_line_2}
          onChange={handleAddressChange}
          margin="normal"
        />
        <TextField
          className={classes.textField}
          label="Address Line 3"
          variant="outlined"
          fullWidth
          name="address_line_3"
          value={formData.address.address_line_3}
          onChange={handleAddressChange}
          margin="normal"
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.textField}
              label="City"
              variant="outlined"
              fullWidth
              name="city"
              value={formData.address.city}
              onChange={handleAddressChange}
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              className={classes.textField}
              label="Postal Code"
              variant="outlined"
              fullWidth
              name="postcode"
              value={formData.address.postcode}
              onChange={handleAddressChange}
              required
              margin="normal"
            />
          </Grid>
        </Grid>
        <TextField
          className={classes.textField}
          select
          label="Country"
          variant="outlined"
          fullWidth
          name="country"
          value={formData.address.country}
          onChange={handleAddressChange}
          required
          margin="normal"
        >
          {COUNTRIES.map(option => (
            <MenuItem key={option.code} value={option.code}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );

  return (
    <Box className={classes.root}>
      <Helmet>
        <title>Register New Entity - Airegister</title>
        <meta
          name="description"
          content="Register a new entity in the Airegister system"
        />
        <body className={classes.fullBgImage} />
      </Helmet>
      <Box className={classes.container}>
        <Paper elevation={4} className={classes.paper}>
          <Typography variant="h4" gutterBottom>
            Register New Entity
          </Typography>

          <form onSubmit={handleSubmit} className={classes.form}>
            <TextField
              className={classes.textField}
              select
              label="Entity Type"
              value={entityType}
              onChange={e => setEntityType(e.target.value)}
              variant="outlined"
              fullWidth
              disabled={submitting}
            >
              <MenuItem value="operator">Operator</MenuItem>
              <MenuItem value="aircraft">Aircraft</MenuItem>
              <MenuItem value="pilot">Pilot</MenuItem>
              <MenuItem value="contact">Contact</MenuItem>
            </TextField>

            {renderFields()}

            <Button
              type="submit"
              variant="contained"
              className={classes.actionButton}
              fullWidth
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Register'
              )}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              className={classes.backButton}
              onClick={() => history.push('/')}
            >
              Back to Home
            </Button>
          </form>
        </Paper>
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </Box>
  );
}
