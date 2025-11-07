import React, { useState, useEffect, useCallback } from 'react';
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

export default function LoadPage(props) {
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

  const scanForDevices = useCallback(async () => {
    setScanning(true);
    setError(null);
    
    try {
      const response = await fetch(`${DISCOVERY_SERVICE_URL}/devices`);
      
      if (!response.ok) {
        throw new Error('Discovery service not responding');
      }
      
      const data = await response.json();
      setDevices(data.devices || []);
      
      if (data.devices.length === 0) {
        setError(
          'No RSAS modules found on network. Make sure modules are powered on and connected to WiFi.'
        );
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(
        'Cannot connect to Discovery Service. Please ensure the service is running on localhost:8080'
      );
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scanForDevices();
  }, [scanForDevices]);

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
        device_ip: selectedDevice.ip,
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
    const isSelected = selectedDevice?.ip === device.ip;
    
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
              <strong>IP Address:</strong> {device.ip}:{device.port}
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              <strong>Hostname:</strong> {device.hostname}
            </Typography>
            
            <Typography variant="caption" color="textSecondary" display="block" style={{ marginTop: 8 }}>
              Last seen: {new Date(device.last_seen * 1000).toLocaleTimeString()}
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

    if (devices.length === 0) {
      return (
        <Box className={classes.emptyState}>
          <WifiIcon className={classes.emptyIcon} />
          <Typography variant="h6" gutterBottom>
            No RSAS Modules Found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Make sure your ESP32 modules are powered on and connected to the same WiFi network.
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
          {devices.map((device, index) => renderDeviceCard(device, index))}
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
  };

  return (
    <Box className={classes.root}>
      <Helmet>
        <title>Activate RSAS Module - Airegister</title>
        <meta
          name="description"
          content="Activate RSAS Module in the Airegister system"
        />
        <body className={classes.fullBgImage} />
      </Helmet>
      <Box className={classes.container}>
        <Paper elevation={4} className={classes.paper}>
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
              onClick={() => props.history.push('/')}
            >
              Back to Home
            </Button>
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