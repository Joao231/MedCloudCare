/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const TwoFA = ({ user }) => {
  const [formData, setFormData] = useState({
    status: false,
    secret_key: '',
  });

  const { status, secret_key } = formData;

  const getCode = async () => {
    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem('access')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    let form_data = new FormData();
    form_data.append('email', user.email);
    try {
      const res = await axios.post(
        `/api/change_to2FA`,
        form_data,
        config
      );

      if (res.data.Status === true) {
        setFormData({ ...formData, status: true });
      } else {
        setFormData({ ...formData, secret_key: res.data.secret_key });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (status) {
    return <h1 style={{ textAlign: 'center' }}>You already have a code!</h1>;
  }

  if (secret_key !== '') {
    return (
      <h1 style={{ textAlign: 'center' }}>
        This is your secret key: {secret_key}. You must put it on Google
        Authenticator. Save it in a <b>safe place</b>, because it will not
        appear again!
      </h1>
    );
  }
  return (
    <div style={{ margin: 'auto', padding: '10px' }} className="container mt-5">
      <h1>Change to 2 Factor Authentication?</h1>
      <button
        style={{ margin: 'auto', padding: '10px' }}
        className="btn btn-danger mt-3"
        onClick={getCode}
      >
        Yes, get secret.
      </button>
    </div>
  );
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  {}
)(TwoFA);
