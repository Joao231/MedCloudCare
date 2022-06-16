/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { verify } from '../actions/auth';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const Activate = ({ verify, match }) => {
  const [verified, setVerified] = useState(false);

  const [formData, setFormData] = useState({
    hasMedicalCertificate: false,
    notMedicalCertificate: false,
    email: '',
  });

  const { hasMedicalCertificate, notMedicalCertificate, email } = formData;

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'apikey' : '9jcoFNyj/XR2ipwhdMVuwYnT',
      'Authorization': 'Basic am9hbzpmMWRyaXZlcjE5OTk=',
    },
  };

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.get(
        `/api/check_medical_certificate_login/${email}`, config
      );

      if (res.data.Status === true) {
        setFormData({ ...formData, hasMedicalCertificate: true });
      } else {
        setFormData({ ...formData, notMedicalCertificate: true });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const verify_account = () => {
    const uid = match.params.uid;
    const token = match.params.token;

    verify(uid, token);
    toast.success('Your account has been created and is ready to use!', {
      position: 'top-right',
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    setVerified(true);

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
  };

  if (verified) {
    return <Redirect to="/login" />;
  }

  if (hasMedicalCertificate) {
    return (
      <div className="container">
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ marginTop: '200px' }}
        >
          <h1>Please, verify your account.</h1>
          <button
            onClick={verify_account}
            style={{ marginTop: '50px' }}
            type="button"
            className="btn btn-primary"
          >
            Verify
          </button>
        </div>
      </div>
    );
  } else if (notMedicalCertificate) {
    return (
      <div className="container">
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ marginTop: '200px' }}
        >
          <h1>Your account is being evaluated. We will reach to you soon!</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="jumbotron mt-5">
        <h1>Please, enter your email.</h1>
        <br></br>
        <form onSubmit={e => onSubmit(e)}>
          <div className="form-group">
            <input
              className="form-control"
              type="text"
              placeholder="Email*"
              name="email"
              value={email}
              onChange={e => onChange(e)}
              required
            />
          </div>
          <br></br>
          <button type="submit" className="btn btn-primary">
            Verify
          </button>
        </form>
        <hr className="my-4" />
      </div>
    </div>
  );
};

export default connect(
  null,
  { verify }
)(Activate);
