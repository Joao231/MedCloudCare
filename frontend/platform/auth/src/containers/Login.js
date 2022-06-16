/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { login, loginSuperuser } from '../actions/auth';
import axios from 'axios';
import Cookies from 'js-cookie';
import Home from './Home.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGoogle,
  faFacebook,
  faLinkedin,
  faGithub,
  faSpotify,
} from '@fortawesome/free-brands-svg-icons';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import Visibility from "@material-ui/icons/Visibility";
import InputAdornment from "@material-ui/core/InputAdornment";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import Input from "@material-ui/core/Input";

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const Login = ({
  login,
  loginSuperuser,
  isAuthenticated,
  isSuperuserAuthenticated,
}) => {
  const csrftoken = Cookies.get('csrftoken');
  const [formData, setFormData] = useState({
    hasSecret: false,
    pin: '',
    email: '',
    //password: '',
  });

  const { hasSecret, pin, email} = formData;

  const [values, setValues] = React.useState({
    password: "",
    showPassword: false,
  });
  
  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };
  
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  
  const handlePasswordChange = (prop) => (event) => {
    let input = document.getElementById('password');
    let text = document.getElementById('message');

    input.addEventListener('keyup', function(e) {
      if (e.getModifierState('CapsLock')) {
        text.textContent = 'Caps lock is on';
      } else {
        text.textContent = '';
      }
    });
    setValues({ ...values, [prop]: event.target.value });
  };

  const onChange = e => {
    let input = document.getElementById('password');
    let text = document.getElementById('message');

    input.addEventListener('keyup', function(e) {
      if (e.getModifierState('CapsLock')) {
        text.textContent = 'Caps lock is on';
      } else {
        text.textContent = '';
      }
    });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onChange1 = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit1 = async e => {
    e.preventDefault();

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic am9hbzpmMWRyaXZlcjE5OTk=',
        Accept: 'application/json',
        HTTP_X_CSRFTOKEN: csrftoken,
      },
      body: JSON.stringify({
        pin: pin,
        email: email,
      }),
    };

    try {
      const res = await axios.post(
        `/api/2FA_login_login`,
        requestOptions
      );
      if (res.data.Status === true) {
        const res = await axios.get(
          `/api/check_superuser/${email}`, requestOptions
        );
        if (res.data.Status === true) {
          loginSuperuser(email, values.password);
        } else {
          login(email, values.password);
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Basic am9hbzpmMWRyaXZlcjE5OTk=',
        'apikey' : '9jcoFNyj/XR2ipwhdMVuwYnT',
      },
    };
    try {
      const res = await axios.get(
        `/api/check_secret_login/${email}`, config
      );

      if (res.data.Status === true) {
        setFormData({ ...formData, hasSecret: true });
      } else {
        const res = await axios.get(
          `/api/check_superuser/${email}`
        );
        if (res.data.Status === true) {
          loginSuperuser(email, values.password);
        } else {
          login(email, values.password);
        }
      }
    } catch (err) {
      toast.error('User Account does not exist!', {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      return (
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      );
    }
  };

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'apikey' : '9jcoFNyj/XR2ipwhdMVuwYnT',
      'Authorization': 'Basic am9hbzpmMWRyaXZlcjE5OTk=',
    },
  };

  const continueWithGoogle = async () => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.get(
        `/auth/o/google-oauth2/?redirect_uri=http://localhost/google`, config
      );

      window.location.replace(res.data.authorization_url);
    } catch (err) {
      alert(err.message);
    }
  };

  const continueWithFacebook = async () => {
    try {
      const res = await axios.get(
        `/auth/o/facebook/?redirect_uri=http://localhost/facebook`, config
      );

      window.location.replace(res.data.authorization_url);
    } catch (err) {
      alert(err.message);
    }
  };

  const githubAuthenticate = async () => {
    try {
      const res = await axios.get(
        `/auth/o/github/?redirect_uri=http://localhost/complete/github/`, config
      );

      window.location.replace(res.data.authorization_url);
    } catch (err) {
      alert(err.message);
    }
  };

  const linkedinAuthenticate = async () => {
    try {
      const res = await axios.get(
        `/auth/o/linkedin-oauth2/?redirect_uri=http://localhost/complete/linkedin/`, config
      );

      window.location.replace(res.data.authorization_url);
    } catch (err) {
      alert(err.message);
    }
  };

  const spotifyAuthenticate = async () => {
    try {
      const res = await axios.get(
        `/auth/o/spotify/?redirect_uri=http://localhost/callback/spotify/`, config
      );

      window.location.replace(res.data.authorization_url);
    } catch (err) {
      alert(err.message);
    }
  };

  if (isSuperuserAuthenticated || isAuthenticated) {
    return <Home />;
  }

  if (hasSecret) {
    return (
      <div className="container mt-5">
        <h1>Enter the code from Google Authenticator</h1>
        <form onSubmit={e => onSubmit1(e)}>
          <div className="form-group">
            <input
              className="form-control"
              type="pin"
              placeholder="Pin"
              name="pin"
              value={pin}
              onChange={e => onChange1(e)}
              required
            />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1>Sign In</h1>
      <p>Sign into your account</p>
      <form onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <Input
            className="form-control"
            type="email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div className="form-group">
          <Input
            id="password"
            className="form-control"
            type={values.showPassword ? "text" : "password"}
            placeholder="Password"
            name="password"
            value={values.password}
            onChange={handlePasswordChange("password")}
            minLength="6"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                >
                  {values.showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            }
            required
          />
          <div className="message" id="message" style={{ color: 'red' }}></div>
        </div>
        <button className="btn btn-primary" type="submit">
          Sign In
        </button>
      </form>
      <p className="mt-3">Or sign with:</p>
      <div className="social-container">
        <a className="google social" onClick={continueWithGoogle}>
          <FontAwesomeIcon icon={faGoogle} size="3x" />
        </a>

        <a className="facebook social" onClick={continueWithFacebook}>
          <FontAwesomeIcon icon={faFacebook} size="3x" />
        </a>

        <a className="linkedin social" onClick={linkedinAuthenticate}>
          <FontAwesomeIcon icon={faLinkedin} size="3x" />
        </a>

        <a className="github social" onClick={githubAuthenticate}>
          <FontAwesomeIcon icon={faGithub} size="3x" />
        </a>

        <a className="spotify social" onClick={spotifyAuthenticate}>
          <FontAwesomeIcon icon={faSpotify} size="3x" />
        </a>
      </div>

      <p className="mt-3">
        Do not have an account? <Link to="/signup">Sign Up</Link>
      </p>
      <p className="mt-3">
        Forgot your password? <Link to="/reset-password">Reset Password</Link>
      </p>
    </div>
  );
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  isSuperuserAuthenticated: state.auth.isSuperuserAuthenticated,
});

export default connect(
  mapStateToProps,
  { login, loginSuperuser }
)(Login);
