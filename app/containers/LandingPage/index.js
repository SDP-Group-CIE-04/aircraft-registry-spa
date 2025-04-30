/* eslint-disable react/prop-types */
/*
 * LandingPage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import {
  AppBar,
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
} from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
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
    // marginTop: 79,
  },
  fullBgImage: {
    backgroundImage: `url(${bgImage})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  },
  menuButton: {
    // marginRight: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
  },
  avatar: {
    margin: 10,
    cursor: 'pointer',
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  textField: {
    minWidth: 320,
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  menu: {
    width: 200,
  },
  typeCard: {
    height: 180,
    width: 180,
  },
  activeCard: {
    border: `solid 3px ${theme.palette.primary.main}`,
  },
  paper: {
    padding: 40,
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    '&:hover': {
      backgroundColor: '#1976D2',
    },
  },
}));

const key = 'landing';

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
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [searchString, setSearchString] = React.useState('');
  const initCollection = collectionName
    ? collectionTypes.find(col => col.value === collectionName)
    : collectionTypes[0];
  const [collectionType, setCollectionType] = React.useState(initCollection);
  const open = Boolean(anchorEl);
  const classes = useStyles();
  useInjectReducer({ key, reducer });
  useInjectSaga({ key, saga });

  function handleMenu(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }
  return (
    <Box className={classes.root}>
      <Helmet>
        <title>Airegister Landing</title>
        <meta
          name="description"
          content="An Airegister Boilerplate application landing page"
        />
        <body className={classes.fullBgImage} />
      </Helmet>
      <AppBar style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        <Box align="right">
          {isAuthenticated && (
            <>
              <Avatar
                alt={`${user.given_name} ${user.family_name}`}
                src={user.picture}
                className={classes.avatar}
                onClick={handleMenu}
              />
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem onClick={() => logout()}>Log out</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </AppBar>
      <Grid
        className={classes.container}
        // container
        // direction="column"
        // justify="center"
        // alignItems="center"
        // spacing={3}
      >
        {!isAuthenticated ? (
          <>
            <Button
              edge="start"
              color="inherit"
              type="button"
              onClick={() => loginWithPopup()}
            >
              Log in
            </Button>
          </>
        ) : (
          <>
            <Grid
              container
              direction="column"
              justify="center"
              alignItems="center"
              spacing={3}
            >
              {isFetchingCollection ? (
                <CircularProgress />
              ) : (
                <Grid
                  container
                  item
                  direction="column"
                  justify="center"
                  alignItems="center"
                >
                  <TextField
                    id="select-type"
                    select
                    label="Searching For:"
                    className={classes.textField}
                    value={collectionType.value}
                    onChange={e => {
                      const sel = collectionTypes.find(
                        item => item.value === e.target.value,
                      );
                      setCollectionType(sel);
                      clearCollection();
                    }}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu,
                      },
                    }}
                    variant="filled"
                    InputProps={{ disableUnderline: true }}
                  >
                    {collectionTypes.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    id="search-field"
                    label="Search"
                    className={classes.textField}
                    type="text"
                    name="search"
                    variant="filled"
                    defaultValue={searchString}
                    InputProps={{ disableUnderline: true }}
                    autoFocus
                    onKeyUp={e => {
                      if (e.keyCode === 13) {
                        getCollection(collectionType.value, e.target.value);
                        setSearchString(e.target.value);
                      }
                    }}
                  />
                  <Box className={classes.buttonContainer}>
                    <Button
                      variant="contained"
                      className={classes.actionButton}
                      onClick={() =>
                        getCollection(collectionType.value, searchString)
                      }
                    >
                      SEARCH
                    </Button>
                    <Button
                      variant="contained"
                      className={classes.actionButton}
                      onClick={() => props.history.push('/register')}
                    >
                      REGISTER NOW
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
            {fetchFailReason && (
              <Paper elevation={4} className={classes.paper}>
                <Typography color="textSecondary" gutterBottom>
                  It appears that access to this data failed
                </Typography>
                <Typography color="textSecondary">
                  for the following reason.
                </Typography>
                <Divider variant="fullWidth" style={{ margin: '10px 0' }} />
                <Typography>{fetchFailReason}</Typography>
              </Paper>
            )}
            <Grid
              container
              direction="row"
              justify="center"
              spacing={3}
              style={{ marginTop: '5px' }} // Added 5px margin to drop the search results down
            >
              {collection &&
                collection.length &&
                collection.map(item => (
                  <Grid key={item.id} item xs={12} sm={6} md={3}>
                    <Card style={{ marginTop: 10 }}>
                      {/* <CardActionArea
                        onClick={() =>
                          props.history.push(
                            `/${collectionType.single}/${item.id}`,
                          )
                        }
                      > */}
                      <CardContent>
                        <DetailsCard {...item} />
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() =>
                            props.history.push(
                              `/${collectionType.single}/${item.id}`,
                            )
                          }
                        >
                          Details
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            props.history.push(
                              `/${collectionType.single}/${item.id}/privileged`,
                            )
                          }
                        >
                          Details (privileged)
                        </Button>
                      </CardActions>
                      {/* </CardActionArea> */}
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </>
        )}
      </Grid>
    </Box>
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
