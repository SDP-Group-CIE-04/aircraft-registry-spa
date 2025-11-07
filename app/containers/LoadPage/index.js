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
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RefreshIcon from '@material-ui/icons/Refresh';
import WifiIcon from '@material-ui/icons/Wifi';
import history from '../../utils/history';
import bgImage from '../../images/blurBg.jpg';

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
}));


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

  useEffect(() => {
    // Call scanForDevices on mount
    scanForDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      if (!response.ok) {
        throw new Error('Discovery service not responding');
      }
      
      const data = await response.json();
      setDevices(data.devices || []);
      
      if (data.devices && data.devices.length === 0) {
        setError(
          'No RSAS modules found. Make sure your ESP32 is connected via USB.'
        );
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(
        'Cannot connect to Discovery Service. Please ensure the service is running on localhost:8080'
      );
      setDevices([]); // Ensure devices is set to empty array on error
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleActivate = async () => {
    if (!selectedDevice) {
      showNotification('Please select a device first', 'error');
      return;
    }

    setActivating(true);
    setError(null);
    
    try {
      const activationData = {
        device_port: selectedDevice.port,  // Changed from device_ip to device_port
        aircraft_data: {
          operator_id: 'PENDING',
          aircraft_id: 'PENDING',
          registration_mark: 'PENDING',
          model: 'TEST MODULE',
          esn: selectedDevice.esn,
        },
      };
      
      console.log('Activating device:', activationData);
      
      if (activationData.aircraft_data.aircraft_id === 'PENDING') {
        throw new Error(
          'Please register an aircraft first. Go to Register → Aircraft Registration.'
        );
      }
      
      const response = await fetch(`${DISCOVERY_SERVICE_URL}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activationData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification(
          `Module ${selectedDevice.esn} activated successfully!`,
          'success'
        );
        setSelectedDevice(null);
        setTimeout(() => scanForDevices(), 2000);
      } else {
        throw new Error(result.error || 'Activation failed');
      }
    } catch (err) {
      console.error('Activation error:', err);
      showNotification(err.message, 'error');
    } finally {
      setActivating(false);
    }
  };

  const renderDeviceCard = (device, index) => {
    const isSelected = selectedDevice?.port === device.port;
    
    return (
      <Grid item xs={12} md={6} key={index}>
        <Card
          className={`${classes.deviceCard} ${
            isSelected ? classes.deviceCardActive : ''
          }`}
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
                {activating ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Activate This Module'
                )}
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

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </>
  );
}