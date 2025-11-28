/* eslint-disable react/prop-types */
/*
 * LandingPage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { makeStyles, fade } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import {
  Button,
  Avatar,
  Menu,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Box,
  Grid,
  Divider,
  Typography,
  Paper,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Tooltip,
} from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import SearchIcon from '@material-ui/icons/Search';
import FlightTakeoffIcon from '@material-ui/icons/FlightTakeoff';
import PersonIcon from '@material-ui/icons/Person';
import BusinessIcon from '@material-ui/icons/Business';
import ContactMailIcon from '@material-ui/icons/ContactMail';
import HowToRegIcon from '@material-ui/icons/HowToReg';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import SettingsIcon from '@material-ui/icons/Settings';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import AddIcon from '@material-ui/icons/Add';
import AssessmentIcon from '@material-ui/icons/Assessment';
import WifiIcon from '@material-ui/icons/Wifi';
import WifiOffIcon from '@material-ui/icons/WifiOff';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import RefreshIcon from '@material-ui/icons/Refresh';
import { useInjectReducer } from 'utils/injectReducer';
import { useInjectSaga } from 'utils/injectSaga';

import bgImage from '../../images/blurBg.jpg';
import {
  makeSelectCollectionName,
  makeSelectUser,
  makeSelectCollection,
  makeSelectFetchingCollection,
  makeSelectIsPristine,
  makeSelectFetchFailReason,
} from '../App/selectors';
import { fetchCollection, clearCollectionAction } from '../App/actions';
// import messages from './messages';
import reducer from './reducer';
import saga from './saga';
import { useAuth0 } from '../Auth';
import DetailsCard from '../../components/DetailsCard';
import { collectionTypes } from './constants';
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
    maxWidth: 1400,
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  avatarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    cursor: 'pointer',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: fade(theme.palette.primary.main, 0.1),
    },
  },
  avatar: {
    width: 40,
    height: 40,
    border: `2px solid ${theme.palette.primary.main}`,
  },
  userName: {
    fontWeight: 500,
    color: theme.palette.text.primary,
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  searchSection: {
    marginBottom: theme.spacing(3),
  },
  collectionTypeSection: {
    marginBottom: theme.spacing(2),
  },
  collectionTypeLabel: {
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  collectionTypeChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  collectionTypeChip: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  textFieldContainer: {
    marginBottom: theme.spacing(2),
  },
  textField: {
    backgroundColor: 'white',
    borderRadius: 4,
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    marginTop: theme.spacing(2),
  },
  actionButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    '&:hover': {
      backgroundColor: '#1976D2',
    },
  },
  loginButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: theme.spacing(1.5, 4),
    fontSize: '1.1rem',
    '&:hover': {
      backgroundColor: '#1976D2',
    },
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(6),
  },
  resultCard: {
    height: '100%',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  },
  cardContent: {
    padding: theme.spacing(2),
  },
  cardActions: {
    padding: theme.spacing(1, 2),
    justifyContent: 'space-between',
  },
  cardButton: {
    textTransform: 'none',
    fontSize: '0.85rem',
  },
  errorPaper: {
    padding: theme.spacing(2),
    backgroundColor: '#f2dede',
    borderRadius: 4,
    marginTop: theme.spacing(2),
  },
  errorIcon: {
    color: '#d32f2f',
    marginRight: theme.spacing(1),
    verticalAlign: 'middle',
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
  resultsSection: {
    marginTop: theme.spacing(3),
  },
  resultsTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
  },
  menu: {
    marginTop: theme.spacing(1),
    '& .MuiMenuItem-root': {
      padding: theme.spacing(1.5, 2),
    },
  },
  welcomeSection: {
    textAlign: 'center',
    marginBottom: theme.spacing(4),
  },
  welcomeTitle: {
    marginBottom: theme.spacing(2),
  },
  welcomeSubtitle: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
  dashboardSection: {
    marginBottom: theme.spacing(4),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  statCard: {
    height: '100%',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  },
  statCardContent: {
    padding: theme.spacing(3),
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: theme.spacing(1),
  },
  statLabel: {
    fontSize: '0.9rem',
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statTrend: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    fontSize: '0.85rem',
    '&.positive': {
      color: '#4caf50',
    },
    '&.negative': {
      color: '#f44336',
    },
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    '&.warning': {
      backgroundColor: '#fff3cd',
      borderLeft: `4px solid #ffc107`,
    },
    '&.error': {
      backgroundColor: '#f2dede',
      borderLeft: `4px solid #d32f2f`,
    },
    '&.info': {
      backgroundColor: '#d9edf7',
      borderLeft: `4px solid #2196F3`,
    },
  },
  actionCard: {
    height: '100%',
    padding: theme.spacing(3),
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
    '&.primary': {
      backgroundColor: fade(theme.palette.primary.main, 0.1),
      '&:hover': {
        backgroundColor: fade(theme.palette.primary.main, 0.15),
      },
    },
    '&.success': {
      backgroundColor: fade('#4caf50', 0.1),
      '&:hover': {
        backgroundColor: fade('#4caf50', 0.15),
      },
    },
    '&.warning': {
      backgroundColor: fade('#ff9800', 0.1),
      '&:hover': {
        backgroundColor: fade('#ff9800', 0.15),
      },
    },
  },
  actionIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  modulesTable: {
    marginTop: theme.spacing(2),
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: theme.spacing(1),
    '&.online': {
      backgroundColor: '#4caf50',
    },
    '&.offline': {
      backgroundColor: '#9e9e9e',
    },
    '&.error': {
      backgroundColor: '#f44336',
    },
  },
  searchToggle: {
    marginBottom: theme.spacing(2),
  },
}));

const key = 'landing';

// Helper function to get icon for collection type
const getCollectionIcon = type => {
  const iconMap = {
    operators: <BusinessIcon />,
    pilots: <PersonIcon />,
    aircrafts: <FlightTakeoffIcon />,
    contacts: <ContactMailIcon />,
  };
  return iconMap[type] || <SearchIcon />;
};

export function LandingPage({
  getCollection,
  collection,
  collectionName,
  isFetchingCollection,
  clearCollection,
  isPristine,
  fetchFailReason,
  user,
  ...props
}) {
  const { isAuthenticated, loginWithPopup, logout } = useAuth0();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchString, setSearchString] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const initCollection = collectionName
    ? collectionTypes.find(col => col.value === collectionName)
    : collectionTypes[0];
  const [collectionType, setCollectionType] = useState(initCollection);
  const [dashboardStats, setDashboardStats] = useState({
    totalOperators: 0,
    activeAircraft: 0,
    registeredPilots: 0,
    activeModules: 0,
    totalModules: 0,
    loading: true,
  });
  const [aircraftWithRid, setAircraftWithRid] = useState({}); // Map of aircraft_id -> {rid_id, module_esn}
  const open = Boolean(anchorEl);
  const classes = useStyles();
  useInjectReducer({ key, reducer });
  useInjectSaga({ key, saga });

  // Fetch aircraft with RID IDs
  const fetchAircraftWithRid = React.useCallback(async () => {
    try {
      const aircraft = await apiService.getAircraft().catch(() => []);
      const aircraftList = Array.isArray(aircraft)
        ? aircraft
        : aircraft?.results || [];
      
      // Create a map of module_esn -> {rid_id, aircraft_id, registration_mark}
      const ridMap = {};
      aircraftList.forEach(ac => {
        if (ac.rid_id && ac.module_esn) {
          ridMap[ac.module_esn] = {
            rid_id: ac.rid_id,
            aircraft_id: ac.id,
            registration_mark: ac.registration_mark,
          };
        }
      });
      setAircraftWithRid(ridMap);
    } catch (error) {
      console.error('Error fetching aircraft with RID:', error);
    }
  }, []);

  // Fetch dashboard statistics
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
      fetchAircraftWithRid();
    }
  }, [isAuthenticated, fetchAircraftWithRid]);

  React.useEffect(() => {
    if (collectionName) {
      const sel = collectionTypes.find(col => col.value === collectionName);
      if (sel) {
        setCollectionType(sel);
      }
    }
  }, [collectionName]);

  const fetchDashboardStats = async () => {
    try {
      setDashboardStats(prev => ({ ...prev, loading: true }));
      const [operators, aircraft, pilots] = await Promise.all([
        apiService.getOperators().catch(() => []),
        apiService.getAircraft().catch(() => []),
        apiService.getPilots().catch(() => []),
      ]);

      const operatorsList = Array.isArray(operators)
        ? operators
        : operators?.results || [];
      const aircraftList = Array.isArray(aircraft)
        ? aircraft
        : aircraft?.results || [];
      const pilotsList = Array.isArray(pilots) ? pilots : pilots?.results || [];

      const activeAircraftCount = aircraftList.filter(
        a => a.status === 1 || a.status === 'Active',
      ).length;

      // Count modules from aircraft with RID IDs
      const modulesWithRid = aircraftList.filter(
        a => a.rid_id && a.module_esn,
      ).length;

      setDashboardStats(prev => ({
        ...prev,
        totalOperators: operatorsList.length,
        activeAircraft: activeAircraftCount,
        registeredPilots: pilotsList.length,
        activeModules: modulesWithRid,
        totalModules: modulesWithRid,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setDashboardStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Note: Module discovery now requires Web Serial API (user interaction)
  // Use /load page to connect and activate modules
  // Module stats are calculated from aircraft with RID IDs

  function handleMenu(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleCollectionChange(type) {
    const sel = collectionTypes.find(item => item.value === type);
    setCollectionType(sel);
    clearCollection();
    setSearchString('');
  }

  function handleSearch() {
    if (searchString.trim()) {
      getCollection(collectionType.value, searchString);
      setShowSearch(true);
    }
  }

  // Calculate status indicators (mock data for now)
  const statusIndicators = [
    {
      type: 'warning',
      icon: <WarningIcon />,
      message: '3 Operators pending approval',
      count: 3,
    },
    {
      type: 'info',
      icon: <SettingsIcon />,
      message: '5 Aircraft needing maintenance updates',
      count: 5,
    },
    {
      type: 'warning',
      icon: <PersonIcon />,
      message: '2 Pilots with expiring certifications',
      count: 2,
    },
    {
      type: 'error',
      icon: <WifiOffIcon />,
      message: '1 Module requiring activation',
      count: 1,
    },
  ];

  // Module discovery now requires Web Serial API (user interaction on /load page)

  return (
    <>
      <Helmet>
        <title>Airegister Landing</title>
        <meta
          name="description"
          content="An Airegister Boilerplate application landing page"
        />
      </Helmet>

      <div className={classes.root}>
        <div className={`${classes.container} ${classes.fullBgImage}`}>
          <Paper className={classes.paper}>
            {/* Header */}
            <Box className={classes.header}>
              <Box className={classes.title}>
                <FlightTakeoffIcon className={classes.icon} color="primary" />
                <Typography variant="h4">
                  {!isAuthenticated ? 'Airegister' : 'Dashboard'}
                </Typography>
              </Box>
              {isAuthenticated && user && (
                <Box
                  className={classes.avatarContainer}
                  onClick={handleMenu}
                  onKeyPress={handleMenu}
                  role="button"
                  tabIndex={0}
                >
                  <Avatar
                    alt={`${user.given_name || ''} ${user.family_name || ''}`}
                    src={user.picture}
                    className={classes.avatar}
                  />
                  <Typography variant="body2" className={classes.userName}>
                    {user.given_name || user.name || 'User'}
                  </Typography>
                </Box>
              )}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
                className={classes.menu}
              >
                <MenuItem onClick={handleClose}>
                  <SettingsIcon style={{ marginRight: 8 }} fontSize="small" />
                  Settings
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    logout();
                    handleClose();
                  }}
                >
                  <PowerSettingsNewIcon
                    style={{ marginRight: 8 }}
                    fontSize="small"
                  />
                  Log out
                </MenuItem>
              </Menu>
            </Box>

            {/* Not Authenticated - Welcome Section */}
            {!isAuthenticated ? (
              <Box className={classes.welcomeSection}>
                <Typography variant="h5" className={classes.welcomeTitle}>
                  Welcome to Airegister
                </Typography>
                <Typography variant="body1" className={classes.welcomeSubtitle}>
                  Your comprehensive aircraft registry management system.
                  Search, register, and manage aircraft, operators, pilots, and
                  contacts with ease.
                </Typography>
                <Button
                  variant="contained"
                  className={classes.loginButton}
                  onClick={() => loginWithPopup()}
                  size="large"
                >
                  Get Started - Log In
                </Button>
              </Box>
            ) : (
              <>
                {/* Dashboard Overview Section */}
                <Box className={classes.dashboardSection}>
                  <Typography variant="h5" className={classes.sectionTitle}>
                    <AssessmentIcon /> Dashboard Overview
                  </Typography>

                  {/* Statistics Cards */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        className={classes.statCard}
                        onClick={() => {
                          setCollectionType(
                            collectionTypes.find(c => c.value === 'operators'),
                          );
                          setShowSearch(true);
                        }}
                      >
                        <CardContent className={classes.statCardContent}>
                          <BusinessIcon
                            style={{ fontSize: 40, color: '#2196F3', marginBottom: 8 }}
                          />
                          <Typography className={classes.statValue}>
                            {dashboardStats.loading ? (
                              <CircularProgress size={24} />
                            ) : (
                              dashboardStats.totalOperators
                            )}
                          </Typography>
                          <Typography className={classes.statLabel}>
                            Total Operators
                          </Typography>
                          <Box className={`${classes.statTrend} positive`}>
                            <ArrowUpwardIcon fontSize="small" />
                            <span style={{ marginLeft: 4 }}>+12%</span>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        className={classes.statCard}
                        onClick={() => {
                          setCollectionType(
                            collectionTypes.find(c => c.value === 'aircrafts'),
                          );
                          setShowSearch(true);
                        }}
                      >
                        <CardContent className={classes.statCardContent}>
                          <FlightTakeoffIcon
                            style={{ fontSize: 40, color: '#4caf50', marginBottom: 8 }}
                          />
                          <Typography className={classes.statValue}>
                            {dashboardStats.loading ? (
                              <CircularProgress size={24} />
                            ) : (
                              dashboardStats.activeAircraft
                            )}
                          </Typography>
                          <Typography className={classes.statLabel}>
                            Active Aircraft
                          </Typography>
                          <Box className={`${classes.statTrend} positive`}>
                            <ArrowUpwardIcon fontSize="small" />
                            <span style={{ marginLeft: 4 }}>+5%</span>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        className={classes.statCard}
                        onClick={() => {
                          setCollectionType(
                            collectionTypes.find(c => c.value === 'pilots'),
                          );
                          setShowSearch(true);
                        }}
                      >
                        <CardContent className={classes.statCardContent}>
                          <PersonIcon
                            style={{ fontSize: 40, color: '#9c27b0', marginBottom: 8 }}
                          />
                          <Typography className={classes.statValue}>
                            {dashboardStats.loading ? (
                              <CircularProgress size={24} />
                            ) : (
                              dashboardStats.registeredPilots
                            )}
                          </Typography>
                          <Typography className={classes.statLabel}>
                            Registered Pilots
                          </Typography>
                          <Box className={`${classes.statTrend} positive`}>
                            <ArrowUpwardIcon fontSize="small" />
                            <span style={{ marginLeft: 4 }}>+8%</span>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        className={classes.statCard}
                        onClick={() => props.history.push('/load')}
                      >
                        <CardContent className={classes.statCardContent}>
                          <WifiIcon
                            style={{ fontSize: 40, color: '#ff9800', marginBottom: 8 }}
                          />
                          <Typography className={classes.statValue}>
                            {dashboardStats.loading ? (
                              <CircularProgress size={24} />
                            ) : (
                              `${dashboardStats.activeModules}/${dashboardStats.totalModules}`
                            )}
                          </Typography>
                          <Typography className={classes.statLabel}>
                            Active RID Modules
                          </Typography>
                          <Box className={`${classes.statTrend} positive`}>
                            <CheckCircleIcon fontSize="small" />
                            <span style={{ marginLeft: 4 }}>
                              {dashboardStats.totalModules > 0
                                ? Math.round(
                                    (dashboardStats.activeModules /
                                      dashboardStats.totalModules) *
                                      100,
                                  )
                                : 0}
                              % Online
                            </span>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Quick Status Indicators */}
                  <Box style={{ marginTop: 24 }}>
                    <Typography variant="subtitle1" style={{ marginBottom: 12 }}>
                      Quick Status Indicators
                    </Typography>
                    <Grid container spacing={2}>
                      {statusIndicators.map((indicator, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box className={`${classes.statusIndicator} ${indicator.type}`}>
                            {indicator.icon}
                            <Typography variant="body2" style={{ marginLeft: 8 }}>
                              {indicator.message}
                            </Typography>
                            <Badge
                              badgeContent={indicator.count}
                              color="error"
                              style={{ marginLeft: 'auto' }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>

                <Divider style={{ margin: '24px 0' }} />

                {/* Quick Actions Panel */}
                <Box className={classes.dashboardSection}>
                  <Typography variant="h5" className={classes.sectionTitle}>
                    <SettingsIcon /> Quick Actions
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card
                        className={`${classes.actionCard} primary`}
                        onClick={() => {
                          props.history.push('/register');
                          // Set entity type to operator if possible
                        }}
                      >
                        <BusinessIcon className={classes.actionIcon} />
                        <Typography variant="h6" gutterBottom>
                          Register New Operator
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Add a new operator to the registry
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Card
                        className={`${classes.actionCard} success`}
                        onClick={() => {
                          props.history.push('/register');
                          // Set entity type to aircraft if possible
                        }}
                      >
                        <FlightTakeoffIcon className={classes.actionIcon} />
                        <Typography variant="h6" gutterBottom>
                          Register Aircraft
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Register a new aircraft
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Card
                        className={`${classes.actionCard} warning`}
                        onClick={() => props.history.push('/load')}
                      >
                        <WifiIcon className={classes.actionIcon} />
                        <Typography variant="h6" gutterBottom>
                          Activate RID Module
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Configure and activate modules
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Card
                        className={`${classes.actionCard} primary`}
                        onClick={() => {
                          props.history.push('/register');
                          // Set entity type to pilot if possible
                        }}
                      >
                        <PersonIcon className={classes.actionIcon} />
                        <Typography variant="h6" gutterBottom>
                          Register Pilot
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Add a new pilot to the system
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Card
                        className={`${classes.actionCard} success`}
                        onClick={() => {
                          // TODO: Implement reports page
                          alert('Reports feature coming soon!');
                        }}
                      >
                        <AssessmentIcon className={classes.actionIcon} />
                        <Typography variant="h6" gutterBottom>
                          View Reports
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Generate compliance reports
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Card
                        className={`${classes.actionCard} primary`}
                        onClick={() => setShowSearch(!showSearch)}
                      >
                        <SearchIcon className={classes.actionIcon} />
                        <Typography variant="h6" gutterBottom>
                          Search Registry
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Advanced search interface
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                <Divider style={{ margin: '24px 0' }} />

                {/* RID Module Management */}
                <Box className={classes.dashboardSection}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom={2}
                  >
                    <Typography variant="h5" className={classes.sectionTitle}>
                      <WifiIcon /> RID Module Management
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => props.history.push('/load')}
                    >
                      Connect & Activate Module
                    </Button>
                  </Box>

                  <Paper style={{ padding: 24, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body1" paragraph>
                      To connect and activate RID modules, use the <strong>Load Page</strong> which supports Web Serial API for direct USB communication.
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Connect your ESP32 module via USB cable
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Click "Request Port" to select your device (Chrome/Edge browsers only)
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Select operator and aircraft, then activate the module
                    </Typography>
                    <Box marginTop={2}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => props.history.push('/load')}
                      >
                        Go to Load Page
                      </Button>
                    </Box>
                  </Paper>
                </Box>

                {/* Search Section - Toggleable */}
                {showSearch && (
                  <>
                    <Divider style={{ margin: '24px 0' }} />
                    <Box className={classes.searchSection}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom={2}
                      >
                        <Typography variant="h5" className={classes.sectionTitle}>
                          <SearchIcon /> Search Registry
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setShowSearch(false);
                            clearCollection();
                          }}
                        >
                          Hide Search
                        </Button>
                      </Box>
                  {/* Collection Type Selection */}
                  <Box className={classes.collectionTypeSection}>
                    <Typography
                      variant="subtitle1"
                      className={classes.collectionTypeLabel}
                    >
                      Search Type:
                    </Typography>
                    <Box className={classes.collectionTypeChips}>
                      {collectionTypes.map(option => {
                        const isSelected =
                          collectionType.value === option.value;
                        return (
                          <Chip
                            key={option.value}
                            icon={getCollectionIcon(option.value)}
                            label={option.label}
                            onClick={() =>
                              handleCollectionChange(option.value)
                            }
                            className={classes.collectionTypeChip}
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'default' : 'outlined'}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Search Field */}
                  <Box className={classes.textFieldContainer}>
                    <TextField
                      id="search-field"
                      label={`Search ${collectionType.label}`}
                      className={classes.textField}
                      type="text"
                      name="search"
                      variant="outlined"
                      fullWidth
                      value={searchString}
                      onChange={e => setSearchString(e.target.value)}
                      onKeyUp={e => {
                        if (e.keyCode === 13) {
                          handleSearch();
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      autoFocus
                    />
                  </Box>

                  {/* Action Buttons */}
                  <Box className={classes.buttonContainer}>
                    <Button
                      variant="contained"
                      className={classes.actionButton}
                      onClick={handleSearch}
                      disabled={!searchString.trim() || isFetchingCollection}
                      startIcon={<SearchIcon />}
                    >
                      Search
                    </Button>
                    <Button
                      variant="contained"
                      className={classes.actionButton}
                      onClick={() => props.history.push('/register')}
                      startIcon={<HowToRegIcon />}
                    >
                      Register Now
                    </Button>
                    <Button
                      variant="contained"
                      className={classes.actionButton}
                      onClick={() => props.history.push('/load')}
                      startIcon={<SettingsIcon />}
                    >
                      Activate Module
                    </Button>
                  </Box>
                </Box>

                {/* Loading State */}
                {isFetchingCollection && (
                  <Box className={classes.loadingBox}>
                    <CircularProgress size={60} />
                    <Typography variant="body1" style={{ marginTop: 16 }}>
                      Searching...
                    </Typography>
                  </Box>
                )}

                {/* Error Message */}
                {fetchFailReason && !isFetchingCollection && (
                  <Box className={classes.errorPaper}>
                    <Typography variant="h6" gutterBottom>
                      <ErrorOutlineIcon className={classes.errorIcon} />
                      Access Failed
                    </Typography>
                    <Typography color="textSecondary" paragraph>
                      It appears that access to this data failed for the
                      following reason:
                    </Typography>
                    <Divider style={{ margin: '10px 0' }} />
                    <Typography>{fetchFailReason}</Typography>
                  </Box>
                )}

                {/* Results Section */}
                {collection &&
                  collection.length > 0 &&
                  !isFetchingCollection && (
                    <Box className={classes.resultsSection}>
                      <Typography variant="h6" className={classes.resultsTitle}>
                        Search Results ({collection.length} found)
                      </Typography>
                      <Grid container spacing={3}>
                        {collection.map(item => (
                          <Grid key={item.id} item xs={12} sm={6} md={4} lg={3}>
                            <Card className={classes.resultCard} elevation={2}>
                              <CardContent className={classes.cardContent}>
                                <DetailsCard {...item} />
                              </CardContent>
                              <CardActions className={classes.cardActions}>
                                <Button
                                  size="small"
                                  className={classes.cardButton}
                                  onClick={() =>
                                    props.history.push(
                                      `/${collectionType.single}/${item.id}`,
                                    )
                                  }
                                  startIcon={<VisibilityIcon />}
                                >
                                  Details
                                </Button>
                                <Button
                                  size="small"
                                  className={classes.cardButton}
                                  onClick={() =>
                                    props.history.push(
                                      `/${collectionType.single}/${item.id}/privileged`,
                                    )
                                  }
                                  startIcon={<VisibilityOffIcon />}
                                >
                                  Privileged
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Empty State */}
                {!isPristine &&
                  collection &&
                  collection.length === 0 &&
                  !isFetchingCollection &&
                  !fetchFailReason && (
                    <Box className={classes.emptyState}>
                      <SearchIcon className={classes.emptyIcon} />
                      <Typography variant="h6" gutterBottom>
                        No Results Found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Try adjusting your search criteria or browse different
                        collection types.
                      </Typography>
                    </Box>
                  )}
                  </>
                )}
              </>
            )}
          </Paper>
        </div>
      </div>
    </>
  );
}

LandingPage.propTypes = {
  isFetchingCollection: PropTypes.bool,
  user: PropTypes.shape({}),
  getCollection: PropTypes.func,
  clearCollection: PropTypes.func,
  collection: PropTypes.array,
  collectionName: PropTypes.string,
  fetchFailReason: PropTypes.string,
  isPristine: PropTypes.bool,
};

const mapStateToProps = createStructuredSelector({
  isFetchingCollection: makeSelectFetchingCollection(),
  user: makeSelectUser(),
  collection: makeSelectCollection(),
  collectionName: makeSelectCollectionName(),
  fetchFailReason: makeSelectFetchFailReason(),
  isPristine: makeSelectIsPristine(),
});

export function mapDispatchToProps(dispatch) {
  return {
    getCollection: (type, filterString) =>
      dispatch(fetchCollection(type, filterString)),
    clearCollection: () => dispatch(clearCollectionAction()),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
  memo,
)(LandingPage);
