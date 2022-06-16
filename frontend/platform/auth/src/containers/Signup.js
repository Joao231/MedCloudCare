/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-empty */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { signup } from '../actions/auth';
import axios from 'axios';
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

const Signup = ({ signup, isAuthenticated }) => {
  const [accountCreated, setAccountCreated] = useState(false);
  const [formData, setFormData] = useState({
    profession: '',
    first_name: '',
    last_name: '',
    email: '',
    //password: '',
    //re_password: '',
  });

  const [selectedFile, setSelectedFile] = useState();

  const {
    profession,
    first_name,
    last_name,
    email,
    //password,
    //re_password,
  } = formData;

  const types = ['Investigator', 'Health Professional'];

  const [values, setValues] = React.useState({
    password: "",
    showPassword: false,
    re_password: "",
    showRe_Password: false,
  });
  
  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleClickShowRe_Password = () => {
    setValues({ ...values, showRe_Password: !values.showRe_Password });
  };
  
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseDownRe_Password = (event) => {
    event.preventDefault();
  };
  
  const handlePasswordChange = (prop) => (event) => {
    let input_password = document.getElementById('password');
    let confirm_password = document.getElementById('confirm_password');
    let text1 = document.getElementById('message1');
    let text2 = document.getElementById('message2');

    confirm_password.addEventListener('keyup', function(e) {
      if (e.getModifierState('CapsLock')) {
        text2.textContent = 'Caps lock is on';
      } else {
        text2.textContent = '';
      }
    });

    input_password.addEventListener('keyup', function(e) {
      if (e.getModifierState('CapsLock')) {
        text1.textContent = 'Caps lock is on';
      } else {
        text1.textContent = '';
      }
    });
    setValues({ ...values, [prop]: event.target.value });
  };

  const onChange = e => {
    let input_password = document.getElementById('password');
    let confirm_password = document.getElementById('confirm_password');
    let text1 = document.getElementById('message1');
    let text2 = document.getElementById('message2');

    confirm_password.addEventListener('keyup', function(e) {
      if (e.getModifierState('CapsLock')) {
        text2.textContent = 'Caps lock is on';
      } else {
        text2.textContent = '';
      }
    });

    input_password.addEventListener('keyup', function(e) {
      if (e.getModifierState('CapsLock')) {
        text1.textContent = 'Caps lock is on';
      } else {
        text1.textContent = '';
      }
    });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onChange1 = e => {
    setSelectedFile(e.target.files[0]);
  };
  const onSubmit = async e => {
    e.preventDefault();

    if (values.password === values.re_password) {
      signup(
        first_name,
        last_name,
        email,
        values.password,
        values.re_password,
        profession,
        selectedFile
      );
      //setAccountCreated(true);
    } else {
      toast.error('Password fields do not match.', {
        position: 'top-right',
        autoClose: 3000,
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

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }
  if (accountCreated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="container mt-5">
      <h1>Sign Up</h1>
      <p>Create your account</p>
      <form onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <Input
            className="form-control"
            type="text"
            placeholder="First Name*"
            name="first_name"
            value={first_name}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div className="form-group">
          <Input
            className="form-control"
            type="text"
            placeholder="Last Name*"
            name="last_name"
            value={last_name}
            onChange={e => onChange(e)}
            required
          />
        </div>
        <div className="form-group">
          <Input
            className="form-control"
            type="email"
            placeholder="Email*"
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
          <div className="message" id="message1" style={{ color: 'red' }}></div>
        </div>
        <div className="form-group">
          <Input
            id="confirm_password"
            className="form-control"
            type={values.showRe_Password ? "text" : "password"}
            placeholder="Confirm Password*"
            name="re_password"
            value={values.re_password}
            onChange={handlePasswordChange("re_password")}
            minLength="6"
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowRe_Password}
                  onMouseDown={handleMouseDownRe_Password}
                >
                  {values.showRe_Password ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            }
            required
          />
          <div className="message" id="message2" style={{ color: 'red' }}></div>
        </div>
        <div className="form-group">
          <p>Please choose the description that matches your role.</p>
          <select
            name="profession"
            value={profession}
            onChange={e => onChange(e)}
          >
            <option key=""></option>
            {types.map(type => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        {profession === 'Health Professional' ? (
          <div className="form-group">
            <input
              type="file"
              name="file"
              onChange={e => onChange1(e)}
              required
            />
          </div>
        ) : null}

        <button className="btn btn-primary" type="submit">
          Register
        </button>
      </form>

      <p className="mt-3">
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(
  mapStateToProps,
  { signup }
)(Signup);
