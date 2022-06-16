/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useLocation, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { googleAuthenticate, load_user_apps } from '../actions/auth';
import queryString from 'query-string';
import axios from 'axios';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const Google = ({ user, load_user_apps, googleAuthenticate }) => {
  let location = useLocation();

  const [formData, setFormData] = useState({
    login: false,
    hasSecret: false,
    notMedicalCertificate: false,
    pin: '',
  });

  const { login, hasSecret, notMedicalCertificate, pin } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    const values = queryString.parse(location.search);
    const state = values.state ? values.state : null;
    const code = values.code ? values.code : null;

    if (state && code) {
      googleAuthenticate(state, code);
    }
  }, [googleAuthenticate, location]);

  const onSubmit1 = async e => {
    e.preventDefault();

    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem('access')}`,
        'Content-Type': 'multipart/form-data',
      },
    };
    let form_data = new FormData();
    form_data.append('email', user.email);
    form_data.append('pin', pin);
    try {
      const res = await axios.post(
        `/api/2FA_login`,
        form_data,
        config
      );

      if (res.data.Status === true) {
        setFormData({ ...formData, login: true });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const onSubmit = async e => {
    e.preventDefault();

    try {
      const config = {
        headers: {
          Authorization: `JWT ${localStorage.getItem('access')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };
      const res = await axios.get(
        `/api/check_medical_certificate?email=${user.email}`,
        config
      );

      if (res.data.Status === true) {
        /*try {
          const res = await axios.get(
            `/api/check_secret?email=${user.email}`,
            config
          );

          if (res.data.Status === true) {
            setFormData({ ...formData, hasSecret: true });
          } else {
            setFormData({ ...formData, login: true });
          }
        } catch (err) {
          alert(err.message);
        }*/
        setFormData({ ...formData, login: true });
      } else {
        setFormData({ ...formData, notMedicalCertificate: true });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (notMedicalCertificate) {
    const url = '/add_description/' + user.email;
    return <Redirect to={url} />;
  }

  if (login) {
    load_user_apps(user.email);
    return <Redirect to="/" />;
  }

  /*if (hasSecret) {
    return (
      <div className="container mt-5">
        <h1>
          Hello {user.first_name} {user.last_name}! Enter the code from Google
          Authenticator.
        </h1>

        <form onSubmit={e => onSubmit1(e)}>
          <div className="form-group">
            <input
              className="form-control"
              type="pin"
              placeholder="Pin"
              name="pin"
              value={pin}
              onChange={e => onChange(e)}
              required
            />
          </div>
        </form>
      </div>
    );
  }*/

  return (
    <div className="container">
      {user ? (
        <form onSubmit={e => onSubmit(e)}>
          <div className="jumbotron mt-5">
            <h1 className="display-4">Almost there...</h1>
            <br></br>
            <button className="btn btn-primary" type="submit">
              Press here to continue
            </button>
            <hr className="my-4" />
          </div>
        </form>
      ) : null}
    </div>
  );
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  { load_user_apps, googleAuthenticate }
)(Google);
