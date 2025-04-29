import React, { useState } from 'react';
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
} from '@material-ui/core';
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
}));

export default function RegistrationPage() {
  const classes = useStyles();
  const [entityType, setEntityType] = useState('operator');
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form submitted:', { entityType, ...formData });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const renderFields = () => {
    switch (entityType) {
      case 'operator':
        return (
          <>
            <TextField
              className={classes.textField}
              label="Operator Name"
              variant="outlined"
              fullWidth
              name="name"
              onChange={handleInputChange}
              required
            />
            <TextField
              className={classes.textField}
              label="License Number"
              variant="outlined"
              fullWidth
              name="licenseNumber"
              onChange={handleInputChange}
              required
            />
          </>
        );
      case 'aircraft':
        return (
          <>
            <TextField
              className={classes.textField}
              label="Registration Number"
              variant="outlined"
              fullWidth
              name="registrationNumber"
              onChange={handleInputChange}
              required
            />
            <TextField
              className={classes.textField}
              label="Aircraft Model"
              variant="outlined"
              fullWidth
              name="model"
              onChange={handleInputChange}
              required
            />
          </>
        );
      case 'pilot':
        return (
          <>
            <TextField
              className={classes.textField}
              label="First Name"
              variant="outlined"
              fullWidth
              name="firstName"
              onChange={handleInputChange}
              required
            />
            <TextField
              className={classes.textField}
              label="Last Name"
              variant="outlined"
              fullWidth
              name="lastName"
              onChange={handleInputChange}
              required
            />
            <TextField
              className={classes.textField}
              label="License Number"
              variant="outlined"
              fullWidth
              name="licenseNumber"
              onChange={handleInputChange}
              required
            />
          </>
        );
      case 'contact':
        return (
          <>
            <TextField
              className={classes.textField}
              label="Contact Name"
              variant="outlined"
              fullWidth
              name="name"
              onChange={handleInputChange}
              required
            />
            <TextField
              className={classes.textField}
              label="Email"
              variant="outlined"
              fullWidth
              type="email"
              name="email"
              onChange={handleInputChange}
              required
            />
            <TextField
              className={classes.textField}
              label="Phone"
              variant="outlined"
              fullWidth
              type="tel"
              name="phone"
              onChange={handleInputChange}
              required
            />
          </>
        );
      default:
        return null;
    }
  };

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
              onChange={(e) => setEntityType(e.target.value)}
              variant="outlined"
              fullWidth
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
            >
              Register
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}
