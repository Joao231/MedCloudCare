/* eslint-disable react/prop-types */
import React, { Fragment, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { logout } from '../actions/auth';
import { Icon } from '@ohif/ui';
import { ToastContainer, toast } from 'react-toastify';
import ExitToApp from '@material-ui/icons/ExitToApp';

const Navbar = ({
  logout,
  isAuthenticated,
  isInvestigatorAuthenticated,
  isHealthProfessionalAuthenticated,
  isSuperuserAuthenticated,
  user,
}) => {
  const [redirect, setRedirect] = useState(false);

  const logout_user = () => {
    logout();
    toast.success('Logged out!', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    setRedirect(true);
    localStorage.clear();
  };

  const logout_user2 = () => {
    logout();
  };

  const guestLinks = () => (
    <Fragment>
      <li className="nav-item">
        <Link className="nav-link" to="/login" onClick={logout_user2}>
          Log In
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/signup">
          Sign Up
        </Link>
      </li>
    </Fragment>
  );

  const investigatorAuthLinks = () => (
    <Fragment>
      <li className="nav-item">
        <Link className="nav-link" to="/model">
          Add AI Algorithm
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/modelList">
          Model List
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/studylist">
          Study List
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/local">
          View Local Studies
        </Link>
      </li>

      {user && !user.social_apps ? (
        <li className="nav-item">
          <Link className="nav-link" to="/twoFA">
            <Icon
              name="check"
              style={{ marginRight: '5px', marginTop: '-5px' }}
            />
            2 Factor Authentication
          </Link>
        </li>
      ) : null}
      <li className="nav-item">
        <Link className="nav-link" to="/view_groups">
          <Icon name="user" style={{ marginRight: '5px', marginTop: '-5px' }} />
          Research Groups
        </Link>
      </li>
    </Fragment>
  );

  const healthProfessionalAuthLinks = () => (
    <Fragment>
      <li className="nav-item">
        <Link className="nav-link" to="/studylist">
          Study List
        </Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/local">
          View Local Studies
        </Link>
      </li>
      {user && !user.social_apps ? (
        <li className="nav-item">
          <Link className="nav-link" to="/twoFA">
            <Icon
              name="check"
              style={{ marginRight: '5px', marginTop: '-5px' }}
            />
            2 Factor Authentication
          </Link>
        </li>
      ) : null}
      <li className="nav-item">
        <Link className="nav-link" to="/view_groups">
          <Icon name="user" style={{ marginRight: '5px', marginTop: '-5px' }} />
          Study Groups
        </Link>
      </li>
    </Fragment>
  );

  const SuperauthLinks = () => (
    <Fragment>
      <li className="nav-item">
        <Link className="nav-link" to="/superuser">
          View Medical Certificates
        </Link>
      </li>
      {user && !user.social_apps ? (
        <li className="nav-item">
          <Link className="nav-link" to="/twoFA">
            <Icon
              name="check"
              style={{ marginRight: '5px', marginTop: '-5px' }}
            />
            2 Factor Authentication
          </Link>
        </li>
      ) : null}
    </Fragment>
  );

  if (isAuthenticated && isInvestigatorAuthenticated) {
    return (
      <Fragment>
        <nav
          className="navbar navbar-expand-lg navbar-light"
          style={{ backgroundColor: '#ffffff' }}
        >
          <Icon
            style={{ color: '#00BFFF', height: '30px', width: '40px' }}
            name="brain"
            className="header-logo-image"
          />
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item active">
                <Link className="nav-link" to="/">
                  Home <span className="sr-only">(current)</span>
                </Link>
              </li>
              {investigatorAuthLinks()}
            </ul>
          </div>
          <div
            style={{
              float: 'right',
            }}
          >
            <button
              style={{
                backgroundColor: '#ffffff',
                color: '#00BFFF',
                borderRadius: '5px',
                padding: '6px 6px',
              }}
              className="btn btn-info btn-lg"
              onClick={logout_user}
            >
              <span className="glyphicon glyphicon-log-out"></span>
              Log out
              <ExitToApp
                style={{
                  marginLeft: '4px',
                }}
              />
            </button>
          </div>
        </nav>

        {redirect ? <Redirect to="/" /> : <Fragment></Fragment>}
      </Fragment>
    );
  }

  if (isAuthenticated && isHealthProfessionalAuthenticated) {
    return (
      <Fragment>
        <nav
          className="navbar navbar-expand-lg navbar-light"
          style={{ backgroundColor: '#ffffff' }}
        >
          <Icon
            style={{ color: '#00BFFF', height: '30px', width: '40px' }}
            name="brain"
            className="header-logo-image"
          />
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item active">
                <Link className="nav-link" to="/">
                  Home <span className="sr-only">(current)</span>
                </Link>
              </li>
              {healthProfessionalAuthLinks()}
            </ul>
          </div>
          <div
            style={{
              float: 'right',
            }}
          >
            <button
              style={{
                backgroundColor: '#ffffff',
                color: '#00BFFF',
                borderRadius: '5px',
                padding: '6px 6px',
              }}
              className="btn btn-info btn-lg"
              onClick={logout_user}
            >
              <span className="glyphicon glyphicon-log-out"></span>
              Log out
              <ExitToApp
                style={{
                  marginLeft: '4px',
                }}
              />
            </button>
          </div>
        </nav>
        {redirect ? <Redirect to="/" /> : <Fragment></Fragment>}
      </Fragment>
    );
  }

  if (isAuthenticated && isSuperuserAuthenticated) {
    return (
      <Fragment>
        <nav
          className="navbar navbar-expand-lg navbar-light"
          style={{ backgroundColor: '#ffffff' }}
        >
          <Icon
            style={{ color: '#00BFFF', height: '30px', width: '40px' }}
            name="brain"
            className="header-logo-image"
          />
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item active">
                <Link className="nav-link" to="/">
                  Home <span className="sr-only">(current)</span>
                </Link>
              </li>
              {SuperauthLinks()}
            </ul>
          </div>
          <div
            style={{
              float: 'right',
            }}
          >
            <button
              style={{
                backgroundColor: '#ffffff',
                color: '#00BFFF',
                borderRadius: '5px',
                padding: '6px 6px',
              }}
              className="btn btn-info btn-lg"
              onClick={logout_user}
            >
              <span className="glyphicon glyphicon-log-out"></span>
              Log out
              <ExitToApp
                style={{
                  marginLeft: '4px',
                }}
              />
            </button>
          </div>
        </nav>
        {redirect ? <Redirect to="/" /> : <Fragment></Fragment>}
      </Fragment>
    );
  }

  return (
    <Fragment>
      {redirect ? <Redirect to="/" /> : <Fragment></Fragment>}
      <nav
        className="navbar navbar-expand-lg navbar-light"
        style={{ backgroundColor: '#ffffff' }}
      >
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <Icon
              style={{ color: '#00BFFF', height: '30px', width: '40px' }}
              name="brain"
              className="header-logo-image"
            />
            <li className="nav-item active">
              <Link className="nav-link" to="/">
                Home <span className="sr-only">(current)</span>
              </Link>
            </li>
            {guestLinks()}
          </ul>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </nav>
    </Fragment>
  );
};

const mapStateToProps = state => ({
  user: state.auth.user,
  isAuthenticated: state.auth.isAuthenticated,
  isInvestigatorAuthenticated: state.auth.isInvestigatorAuthenticated,
  isHealthProfessionalAuthenticated:
    state.auth.isHealthProfessionalAuthenticated,
  isSuperuserAuthenticated: state.auth.isSuperuserAuthenticated,
});

export default connect(
  mapStateToProps,
  { logout }
)(Navbar);
