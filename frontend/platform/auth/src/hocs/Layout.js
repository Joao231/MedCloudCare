/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { connect } from 'react-redux';
import {
  checkAuthenticated_Superuser,
  checkAuthenticated,
  load_user,
} from '../actions/auth';

const Layout = ({
  isAuthenticated,
  isSuperuserAuthenticated,
  checkAuthenticated_Superuser,
  checkAuthenticated,
  load_user,
  children,
}) => {
  useEffect(() => {
    console.log(isAuthenticated);
    console.log(isSuperuserAuthenticated);
    if (localStorage.getItem('Superuser_Authenticated')) {
      checkAuthenticated_Superuser();
    } else {
      checkAuthenticated();
    }
    load_user();
  }, [
    checkAuthenticated,
    checkAuthenticated_Superuser,
    isAuthenticated,
    isSuperuserAuthenticated,
    load_user,
  ]);

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  isSuperuserAuthenticated: state.auth.isSuperuserAuthenticated,
});

export default connect(
  mapStateToProps,
  { checkAuthenticated_Superuser, checkAuthenticated, load_user }
)(Layout);
