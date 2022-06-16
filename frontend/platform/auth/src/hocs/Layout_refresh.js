/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  checkAuthenticated_Superuser,
  checkAuthenticated,
  load_user,
  updateToken,
} from '../actions/auth';

const LayoutRefresh = ({ updateToken, children }) => {
  const [authTokens, setAuthTokens] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      console.log('updatetoken');
      updateToken();
      setLoading(false);
    }

    const fourMinutes = 1000 * 60 * 4;

    const interval = setInterval(() => {
      if (localStorage.getItem('access') && localStorage.getItem('refresh')) {
        updateToken();
        setAuthTokens(localStorage.getItem('access'));
      }
    }, fourMinutes);
    return () => clearInterval(interval);
  }, [authTokens, loading, updateToken]);

  return <div>{children}</div>;
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  isSuperuserAuthenticated: state.auth.isSuperuserAuthenticated,
});

export default connect(
  mapStateToProps,
  { checkAuthenticated_Superuser, checkAuthenticated, load_user, updateToken }
)(LayoutRefresh);
