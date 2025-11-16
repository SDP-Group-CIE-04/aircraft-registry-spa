import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Snackbar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RefreshIcon from '@material-ui/icons/Refresh';
import WifiIcon from '@material-ui/icons/Wifi';
import history from '../../utils/history';
import bgImage from '../../images/blurBg.jpg';
import * as apiService from '../../services/apiService';

const useStyles = makeStyles(theme => ({
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
    maxWidth: 1000,
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  title: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: theme.spacing(1),
    fontSize: 32,
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(6),
  },
  deviceCard: {
    marginBottom: theme.spacing(2),
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
      cursor: 'pointer',
    },
  },
  deviceCardActive: {
    border: `2px solid ${theme.palette.primary.main}`,
  },
  statusChip: {
    marginLeft: theme.spacing(1),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(6),
  },
  emptyIcon: {
    fontSize: 80,
    color: theme.palette.grey[300],
    marginBottom: theme.spacing(2),
  },
  actionButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    marginTop: '10px',
    '&:hover': {
      backgroundColor: '#1976D2',
    },
  },
  backButton: {
    marginTop: '20px',
  },
  consoleBox: {
    background: '#0f172a',       // slate-900-ish
    color: '#e2e8f0',            // slate-200-ish
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12.5,
    borderRadius: 6,
    padding: '12px 14px',
    overflowX: 'auto',
  },
  consoleLabel: {
    color: '#93c5fd',            // blue-300
    fontWeight: 600,
    marginRight: 8,
  },
  consoleMuted: {
    color: '#94a3b8',            // slate-400
  },
}));

// If Discovery Service runs on another machine, change this to that host/IP.
const DISCOVERY_SERVICE_URL = 'http://localhost:8080';

export default function LoadPage() {
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [operatorId, setOperatorId] = useState(null);
  const [aircraftLoading, setAircraftLoading] = useState(false);
  const [aircraftError, setAircraftError] = useState(null);
  const [aircraftList, setAircraftList] = useState([]);
  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  const [operators, setOperators] = useState([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [operatorsError, setOperatorsError] = useState(null);

  // NEW: simple per-device console { [port]: { cmd, msg, time } }
  const [deviceConsole, setDeviceConsole] = useState({});
  
  // Confirmation dialog state for override warning
  const [overrideDialog, setOverrideDialog] = useState({
    open: false,
    existingIds: null,
    pendingActivation: null, // Store the activation function to call after confirmation
  });

  // Scan on mount (fixed stray char)
  useEffect(() => {
    scanForDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Load operator id from localStorage and fetch aircraft
    const storedOperatorId = window.localStorage.getItem('operator_id');
    if (storedOperatorId) {
      setOperatorId(storedOperatorId);
      fetchAircraftForOperator(storedOperatorId);
    } else {
      setOperatorId(null);
      setAircraftList([]);
    }
  }, []);

  useEffect(() => {
    // Fetch operator list
    const loadOperators = async () => {
      try {
        setOperatorsLoading(true);
        setOperatorsError(null);
        const data = await apiService.getOperators();
        setOperators(Array.isArray(data) ? data : (data?.results || []));
      } catch (err) {
        console.error('Fetch operators error:', err);
        setOperatorsError(err.message || 'Failed to load operators');
        setOperators([]);
      } finally {
        setOperatorsLoading(false);
      }
    };
    loadOperators();
  }, []);

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const scanForDevices = async () => {
    try {
      setScanning(true);
      setError(null);

      const response = await fetch(`${DISCOVERY_SERVICE_URL}/devices`);
      if (!response.ok) throw new Error('Discovery service not responding');

      const data = await response.json().catch(() => ({}));
      const list = data?.devices || [];
      setDevices(list);

      if (list.length === 0) {
        setError('No RSAS modules found. Make sure your ESP32 is connected via USB.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Cannot connect to Discovery Service. Please ensure the service is running on localhost:8080');
      setDevices([]);
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  const fetchAircraftForOperator = async (opId) => {
    try {
      setAircraftLoading(true);
      setAircraftError(null);
      const list = await apiService.getAircraftByOperator(opId);
      setAircraftList(list || []);
      if ((list || []).length === 0) {
        setAircraftError('No aircraft found for this operator. Please register an aircraft first.');
      }
    } catch (err) {
      console.error('Fetch aircraft error:', err);
      setAircraftError(err.message || 'Failed to load aircraft');
      setAircraftList([]);
    } finally {
      setAircraftLoading(false);
    }
  };

  const handleDeviceSelect = (device) => setSelectedDevice(device);

  const handleOperatorSelect = (e) => {
    const id = e.target.value;
    setOperatorId(id);
    setSelectedAircraftId('');
    setAircraftList([]);
    if (id) {
      try {
        window.localStorage.setItem('operator_id', id);
      } catch (err) {
        console.warn('Unable to persist operator_id:', err);
      }
      fetchAircraftForOperator(id);
    }
  };

  // Always store aircraft id as string to avoid type mismatch on lookup
  const handleAircraftSelect = (e) => {
    setSelectedAircraftId(String(e.target.value));
  };

  // Check for existing IDs in the module
  const checkExistingIds = async (devicePort) => {
    try {
      console.log('[DEBUG] Checking for existing IDs on port:', devicePort);
      const response = await fetch(
        `${DISCOVERY_SERVICE_URL}/device-info?device_port=${encodeURIComponent(devicePort)}`
      );
      console.log('[DEBUG] Device info response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[DEBUG] Failed to get device info:', response.status, errorText);
        return null; // Error reading, but don't block activation
      }
      
      const data = await response.json();
      console.log('[DEBUG] Device info data received:', data);
      
      // Check if any IDs are stored (non-empty strings after trimming)
      const hasOperatorId = data.operator_id && data.operator_id.trim().length > 0;
      const hasAircraftId = data.aircraft_id && data.aircraft_id.trim().length > 0;
      const hasRidId = data.rid_id && data.rid_id.trim().length > 0;
      
      console.log('[DEBUG] ID check results:', {
        hasOperatorId,
        hasAircraftId,
        hasRidId,
        operator_id: data.operator_id,
        aircraft_id: data.aircraft_id,
        rid_id: data.rid_id
      });
      
      if (hasOperatorId || hasAircraftId || hasRidId) {
        console.log('[DEBUG] Existing IDs found, will show confirmation dialog');
        return {
          operator_id: hasOperatorId ? data.operator_id.trim() : '',
          aircraft_id: hasAircraftId ? data.aircraft_id.trim() : '',
          rid_id: hasRidId ? data.rid_id.trim() : ''
        };
      }
      
      console.log('[DEBUG] No existing IDs found');
      return null; // No IDs stored
    } catch (err) {
      console.error('[DEBUG] Failed to check existing IDs:', err);
      return null; // Don't block activation on check failure
    }
  };

  // Perform the actual activation
  const performActivation = async () => {
    if (!selectedDevice) {
      showNotification('Please select a device first', 'error');
      return;
    }
    if (!operatorId) {
      showNotification('Missing operator. Please register an operator first.', 'error');
      return;
    }
    const selectedAircraft = aircraftList.find(a => String(a.id) === String(selectedAircraftId));
    if (!selectedAircraft) {
      showNotification('Please select an aircraft first', 'error');
      return;
    }

    setActivating(true);
    setError(null);

    try {
      // Validate inputs before generating RID ID
      if (!operatorId) {
        throw new Error('Operator ID is missing');
      }
      if (!selectedAircraft?.id) {
        throw new Error('Aircraft ID is missing');
      }
      if (!selectedDevice?.esn) {
        throw new Error('Device ESN is missing');
      }

      // Generate RID ID
      const ridId = apiService.generateRidId(
        operatorId,
        selectedAircraft.id,
        selectedDevice.esn
      );

      console.log('[DEBUG] ========================================');
      console.log('[DEBUG] RID ID Generation:');
      console.log('[DEBUG]   Operator ID:', operatorId);
      console.log('[DEBUG]   Aircraft ID:', selectedAircraft.id);
      console.log('[DEBUG]   Device ESN:', selectedDevice.esn);
      console.log('[DEBUG]   Generated RID ID:', ridId);
      console.log('[DEBUG]   RID ID type:', typeof ridId);
      console.log('[DEBUG]   RID ID length:', ridId?.length);
      console.log('[DEBUG]   Is UUID format?', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ridId));
      console.log('[DEBUG] ========================================');
      
      if (!ridId || ridId.length === 0) {
        throw new Error('Failed to generate RID ID');
      }

      // Normalize mass to kilograms if backend stores grams
      const rawMass = selectedAircraft.mass;
      const mass =
        typeof rawMass === 'number'
          ? (rawMass > 50 ? rawMass / 1000 : rawMass)
          : parseFloat(rawMass) || 0;

      const activationData = {
        device_port: selectedDevice.port,  // USB serial port to Discovery Service
        aircraft_data: {
          operator_id: operatorId,
          aircraft_id: selectedAircraft.id,
          registration_mark: selectedAircraft.registration_mark,
          model: selectedAircraft.model || selectedAircraft.popular_name || '',
          mass,
          esn: selectedDevice.esn,
          rid_id: ridId,  // Add RID ID to activation data
        },
      };

      console.log('[DEBUG] ========================================');
      console.log('[DEBUG] Activation Data Being Sent:');
      console.log(JSON.stringify(activationData, null, 2));
      console.log('[DEBUG] RID ID in activationData:', activationData.aircraft_data.rid_id);
      console.log('[DEBUG] ========================================');

      const response = await fetch(`${DISCOVERY_SERVICE_URL}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activationData),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        // Capture failure in console as well
        const now = new Date().toLocaleString();
        setDeviceConsole(prev => ({
          ...prev,
          [selectedDevice.port]: {
            cmd: result?.sent_command || 'BASIC_SET ...',
            msg: result?.error || 'Activation failed',
            time: now,
            ridId: null,
          },
        }));
        throw new Error(result?.error || 'Activation failed');
      }

      const deviceReply = result?.esp32_response || 'OK';
      const now = new Date().toLocaleString();
      setDeviceConsole(prev => ({
        ...prev,
        [selectedDevice.port]: {
          cmd: result?.sent_command || `BASIC_SET operator_id=${operatorId}|aircraft_id=${selectedAircraft.id}|rid_id=${ridId}`,
          msg: deviceReply,
          time: now,
          ridId: ridId,
        },
      }));

      // Save RID module to backend (separate from aircraft record)
      try {
        const moduleData = {
          rid_id: ridId,
          operator: operatorId,
          aircraft: selectedAircraft.id,
          module_esn: selectedDevice.esn,
          module_port: selectedDevice.port,
          module_type: 'ESP32-S3',
          status: 'active',
          activation_status: 'temporary', // Can be updated to 'permanent' if module is locked
        };
        
        const savedModule = await apiService.createRidModule(moduleData);
        console.log('RID module saved to backend:', savedModule);
      } catch (backendError) {
        console.error('Failed to save RID module to backend:', backendError);
        // Don't fail the activation if backend save fails, but log it
        showNotification(
          `Module activated but failed to save RID module to backend: ${backendError.message}`,
          'warning'
        );
      }

      showNotification(
        `Module ${selectedDevice.esn} activated with RID ID: ${ridId}`,
        'success'
      );

      // Keep selection so user can see console; re-scan to reflect status
      setTimeout(() => scanForDevices(), 1200);
    } catch (err) {
      console.error('Activation error:', err);
      showNotification(err.message || 'Activation failed', 'error');
    } finally {
      setActivating(false);
    }
  };

  // Handle activate button click - check for existing IDs first
  const handleActivate = async () => {
    console.log('[DEBUG] handleActivate called');
    if (!selectedDevice) {
      showNotification('Please select a device first', 'error');
      return;
    }

    console.log('[DEBUG] Selected device:', selectedDevice.port);
    
    // Check for existing IDs
    const existingIds = await checkExistingIds(selectedDevice.port);
    console.log('[DEBUG] checkExistingIds returned:', existingIds);
    
    if (existingIds) {
      console.log('[DEBUG] Showing override confirmation dialog');
      // Show confirmation dialog
      setOverrideDialog({
        open: true,
        existingIds,
        pendingActivation: performActivation,
      });
    } else {
      console.log('[DEBUG] No existing IDs, proceeding with activation');
      // No existing IDs, proceed directly
      await performActivation();
    }
  };

  // Handle dialog confirmation
  const handleConfirmOverride = () => {
    const pendingActivation = overrideDialog.pendingActivation;
    setOverrideDialog({ open: false, existingIds: null, pendingActivation: null });
    if (pendingActivation) {
      pendingActivation();
    }
  };

  // Handle dialog cancellation
  const handleCancelOverride = () => {
    setOverrideDialog({ open: false, existingIds: null, pendingActivation: null });
  };

  const renderDeviceConsole = (device) => {
    const entry = deviceConsole[device.port];
    if (!entry) return null;

    return (
      <Box mt={1.5}>
        <Divider style={{ marginBottom: 8 }} />
        <Typography variant="subtitle2" gutterBottom>
          Device Console
        </Typography>
        {entry.ridId && (
          <Box mb={1.5} p={1.5} style={{ backgroundColor: '#e8f5e9', borderRadius: 4, border: '1px solid #4caf50' }}>
            <Typography variant="subtitle2" style={{ fontWeight: 600, color: '#2e7d32' }}>
              RID ID: {entry.ridId}
            </Typography>
            <Typography variant="caption" style={{ color: '#388e3c' }}>
              This RID ID has been loaded into the ESP32 and saved to the backend
            </Typography>
          </Box>
        )}
        <Box className={classes.consoleBox}>
          <div>
            <span className={classes.consoleLabel}>Sent:</span>
            <span className={classes.consoleMuted}>{entry.time}</span>
          </div>
          <pre style={{ margin: '6px 0 10px' }}>
{entry.cmd}
          </pre>
          <div className={classes.consoleLabel}>Response:</div>
          <pre style={{ margin: '6px 0 0' }}>
{entry.msg || '—'}
          </pre>
        </Box>
      </Box>
    );
  };

  const renderDeviceCard = (device, index) => {
    const isSelected = selectedDevice?.port === device.port;

    return (
      <Grid item xs={12} md={6} key={index}>
        <Card
          className={`${classes.deviceCard} ${isSelected ? classes.deviceCardActive : ''}`}
          onClick={() => handleDeviceSelect(device)}
        >
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" component="div">
                RSAS-Module-{device.esn}
              </Typography>
              <Chip
                label="Ready"
                size="small"
                color="primary"
                className={classes.statusChip}
              />
            </Box>

            <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
              <strong>USB Port:</strong> {device.port}
            </Typography>

            <Typography variant="body2" color="textSecondary">
              <strong>Connection:</strong> {device.connection_type}
            </Typography>

            <Typography variant="body2" color="textSecondary">
              <strong>Manufacturer:</strong> {device.manufacturer}
            </Typography>

            <Typography variant="caption" color="textSecondary" display="block" style={{ marginTop: 8 }}>
              {device.description}
            </Typography>

            {isSelected && renderDeviceConsole(device)}
          </CardContent>

          {isSelected && (
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                className={classes.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivate();
                }}
                disabled={activating}
              >
                {activating ? <CircularProgress size={24} color="inherit" /> : 'Activate This Module'}
              </Button>
            </CardActions>
          )}
        </Card>
      </Grid>
    );
  };

  const renderContent = () => {
    try {
      if (loading) {
        return (
          <Box className={classes.loadingBox}>
            <CircularProgress size={60} />
            <Typography variant="body1" style={{ marginTop: 16 }}>
              Scanning for RSAS modules...
            </Typography>
          </Box>
        );
      }

      if (!devices || devices.length === 0) {
        return (
          <Box className={classes.emptyState}>
            <WifiIcon className={classes.emptyIcon} />
            <Typography variant="h6" gutterBottom>
              No RSAS Modules Found
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Make sure your ESP32 module is connected via USB cable.
            </Typography>
            <Button
              variant="contained"
              className={classes.actionButton}
              startIcon={<RefreshIcon />}
              onClick={scanForDevices}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Scan Again'}
            </Button>
          </Box>
        );
      }

      return (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="body1">
              Found <strong>{devices.length}</strong> module(s) on network
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={scanForDevices}
              disabled={scanning || activating}
            >
              {scanning ? 'Scanning...' : 'Refresh'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {devices && devices.map((device, index) => renderDeviceCard(device, index))}
          </Grid>

          {selectedDevice && (
            <Box mt={3} p={2} style={{ backgroundColor: '#d9edf7', borderRadius: 4 }}>
              <Typography variant="body2" color="textSecondary">
                Click "Activate This Module" to configure {selectedDevice.esn} with aircraft identity
              </Typography>
            </Box>
          )}
        </>
      );
    } catch (err) {
      console.error('Error rendering content:', err);
      return (
        <Box className={classes.emptyState}>
          <Typography variant="h6" gutterBottom color="error">
            Error Loading Page
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {err.message || 'An unexpected error occurred'}
          </Typography>
          <Button
            variant="contained"
            className={classes.actionButton}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }
  };

  return (
    <>
      <Helmet>
        <title>Activate RSAS Module</title>
        <meta name="description" content="Activate RSAS Module" />
      </Helmet>

      <div className={classes.root}>
        <div className={`${classes.container} ${classes.fullBgImage}`}>
          <Paper className={classes.paper}>
            <Box className={classes.header}>
              <Box className={classes.title}>
                <WifiIcon className={classes.icon} color="primary" />
                <Typography variant="h4">Activate RSAS Module</Typography>
              </Box>
            </Box>

            {/* Operator selection */}
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                Select Operator
              </Typography>
              {operatorsLoading ? (
                <Box display="flex" alignItems="center">
                  <CircularProgress size={24} />
                  <Typography variant="body2" style={{ marginLeft: 8 }}>
                    Loading operators...
                  </Typography>
                </Box>
              ) : (
                <select
                  style={{ width: '100%', padding: 12, borderRadius: 4 }}
                  value={operatorId || ''}
                  onChange={handleOperatorSelect}
                >
                  <option value="" disabled>
                    Choose an operator
                  </option>
                  {operators.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.company_name || o.name || o.id}
                    </option>
                  ))}
                </select>
              )}
              {operatorsError && (
                <Typography variant="body2" color="error" style={{ marginTop: 8 }}>
                  {operatorsError}
                </Typography>
              )}
            </Box>

            {/* Aircraft selection */}
            <Box mb={2}>
              {operatorId ? (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Aircraft
                  </Typography>
                  {aircraftLoading ? (
                    <Box display="flex" alignItems="center">
                      <CircularProgress size={24} />
                      <Typography variant="body2" style={{ marginLeft: 8 }}>
                        Loading aircraft...
                      </Typography>
                    </Box>
                  ) : (
                    <select
                      style={{ width: '100%', padding: 12, borderRadius: 4 }}
                      value={selectedAircraftId}
                      onChange={handleAircraftSelect}
                    >
                      <option value="" disabled>
                        Choose an aircraft
                      </option>
                      {aircraftList.map(a => (
                        <option key={a.id} value={String(a.id)}>
                          {(a.registration_mark || 'Unregistered') +
                            ' - ' +
                            (a.model || a.popular_name || 'Unknown model') +
                            (a.mass ? ` (${a.mass > 50 ? (a.mass / 1000) : a.mass}kg)` : '')}
                        </option>
                      ))}
                    </select>
                  )}
                  {aircraftError && (
                    <Typography variant="body2" color="error" style={{ marginTop: 8 }}>
                      {aircraftError}
                    </Typography>
                  )}
                </>
              ) : (
                <Box p={2} style={{ backgroundColor: '#fff8e1', borderRadius: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No operator found. Register an operator first; its ID will be saved and used to load aircraft.
                  </Typography>
                </Box>
              )}
            </Box>

            {error && (
              <Box mb={2} p={2} style={{ backgroundColor: '#f2dede', borderRadius: 4 }}>
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              </Box>
            )}

            {renderContent()}

            <Button
              fullWidth
              variant="outlined"
              className={classes.backButton}
              onClick={() => history.push('/')}
            >
              Back to Home
            </Button>
          </Paper>
        </div>
      </div>

      {/* Override Confirmation Dialog */}
      <Dialog
        open={overrideDialog.open}
        onClose={handleCancelOverride}
        aria-labelledby="override-dialog-title"
        aria-describedby="override-dialog-description"
      >
        <DialogTitle id="override-dialog-title">
          Module Already Configured
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="override-dialog-description">
            This module already has IDs stored. Overwriting will replace the existing configuration.
          </DialogContentText>
          {overrideDialog.existingIds && (
            <Box mt={2} p={2} style={{ backgroundColor: '#fff3cd', borderRadius: 4, border: '1px solid #ffc107' }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Configuration:
              </Typography>
              {overrideDialog.existingIds.operator_id && (
                <Typography variant="body2">
                  <strong>Operator ID:</strong> {overrideDialog.existingIds.operator_id}
                </Typography>
              )}
              {overrideDialog.existingIds.aircraft_id && (
                <Typography variant="body2">
                  <strong>Aircraft ID:</strong> {overrideDialog.existingIds.aircraft_id}
                </Typography>
              )}
              {overrideDialog.existingIds.rid_id && (
                <Typography variant="body2">
                  <strong>RID ID:</strong> {overrideDialog.existingIds.rid_id}
                </Typography>
              )}
            </Box>
          )}
          <DialogContentText style={{ marginTop: 16 }}>
            Are you sure you want to proceed? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelOverride} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmOverride} 
            variant="contained"
            className={classes.actionButton}
          >
            Override and Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </>
  );
}
