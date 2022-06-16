/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useLocation, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { githubAuthenticate, load_user_apps } from '../actions/auth';
import queryString from 'query-string';
import axios from 'axios';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const Github = ({ user, load_user_apps, githubAuthenticate }) => {
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

    console.log(values);
    console.log('State: ' + state);
    console.log('Code: ' + code);

    if (state && code) {
      githubAuthenticate(state, code);
    }
  }, [githubAuthenticate, location]);

  const onSubmit1 = async e => {
    e.preventDefault();

    const config = {
      headers: {
        //'Accept': 'application/json',
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
      console.log(res.data.Status);
      if (res.data.Status === true) {
        setFormData({ ...formData, login: true });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const onSubmit = async e => {
    e.preventDefault();

    try {
      const config = {
        headers: {
          //'Accept': 'application/json',
          Authorization: `JWT ${localStorage.getItem('access')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          //'HTTP_X_CSRFTOKEN': csrftoken
        },
      };
      const res = await axios.get(
        `/api/check_medical_certificate?email=${user.email}`,
        config
      );
      console.log(res.data.Status);

      if (res.data.Status === true) {
        /*try {
          const res = await axios.get(
            `/api/check_secret?email=${user.email}`,
            config
          );
          console.log(res.data.Status);

          if (res.data.Status === true) {
            setFormData({ ...formData, hasSecret: true });
          } else {
            setFormData({ ...formData, login: true });
          }
        } catch (err) {
          console.log(err);
        }*/
        setFormData({ ...formData, login: true });
      } else {
        setFormData({ ...formData, notMedicalCertificate: true });
      }
    } catch (err) {
      console.log(err);
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
          Hello {user.first_name} {user.last_name}! Enter the code which is in
          Google Authenticator.
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
    </div>
  );
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  { load_user_apps, githubAuthenticate }
)(Github);
