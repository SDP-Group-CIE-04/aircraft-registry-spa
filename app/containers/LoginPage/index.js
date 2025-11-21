import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { makeStyles } from '@material-ui/core/styles';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
} from '@material-ui/core';
import bgImage from '../../images/blurBg.jpg';
import { login } from '../../utils/loginHelper';
import { isAuthenticated } from '../../utils/loginHelper';
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
    maxWidth: 400,
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
}));

export default function LoginPage() {
  const classes = useStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      history.push('/');
    }
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      setNotification({
        open: true,
        message: 'Login successful! Redirecting...',
      });
      
      // Redirect after successful login
      setTimeout(() => {
        history.push('/');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setNotification({
        open: true,
        message: err.message || 'Login failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <>
      <Helmet>
        <title>Login - Aircraft Registry</title>
        <meta name="description" content="Login to Aircraft Registry" />
      </Helmet>

      <div className={classes.root}>
        <div className={`${classes.container} ${classes.fullBgImage}`}>
          <Paper className={classes.paper}>
            <Typography variant="h4" gutterBottom>
              Login
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24 }}>
              Enter your credentials to access the Aircraft Registry
            </Typography>

            <form onSubmit={handleSubmit} className={classes.form}>
              <TextField
                className={classes.textField}
                label="Username"
                variant="outlined"
                fullWidth
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
              <TextField
                className={classes.textField}
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              {error && (
                <Box p={2} style={{ backgroundColor: '#f2dede', borderRadius: 4 }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                className={classes.actionButton}
                fullWidth
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Login'
                )}
              </Button>
            </form>
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

