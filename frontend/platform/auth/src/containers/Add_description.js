/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { logout } from '../actions/auth';
import axios from 'axios';
import Cookies from 'js-cookie';
axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const csrftoken = Cookies.get('csrftoken');

const Add_description = ({ match }) => {
  const [formData, setFormData] = useState({
    profession: '',
    isbeingApproved: false,
    hasMedicalCertificate: false,
  });

  const types = ['Investigator', 'Health Professional'];

  const { profession, isbeingApproved, hasMedicalCertificate } = formData;

  const [selectedFile, setSelectedFile] = useState();

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onChange1 = e => {
    setSelectedFile(e.target.files[0]);
  };

  const onSubmit = async e => {
    e.preventDefault();

    try {
      const config = {
        headers: {
          Authorization: `JWT ${localStorage.getItem('access')}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      const email = match.params.email;

      let form_data = new FormData();
      form_data.append('email', email);
      form_data.append('profession', profession);

      if (profession !== 'Investigator') {
        form_data.append(
          'medical_certificate',
          selectedFile,
          selectedFile.name
        );
      }

      const res = await axios.post(
        `/api/add_description`,
        form_data,
        config
      );

      const options = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          HTTP_X_CSRFTOKEN: csrftoken,
        },
      };

      try {
        await axios.post(
          `/api/encrypt_db/${email}`,
          options
        );
      } catch (err) {
        alert(err.message);
      }

      if (res.data.Status === true) {
        setFormData({ ...formData, isbeingApproved: true });
      } else {
        setFormData({ ...formData, hasMedicalCertificate: true });
      }
    } catch (err) {
      alert(err);
    }
  };

  if (hasMedicalCertificate) {
    logout();
    return (
      <div className="container">
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ marginTop: '150px' }}
        >
          <h1>
            Your account was successfully created, but your medical certificate
            is under evaluation. We will reach to you soon!
          </h1>
        </div>
      </div>
    );
  }

  if (isbeingApproved) {
    logout();
    return (
      <div className="container">
        <div className="jumbotron mt-5">
          <h2 className="display-6" style={{ textAlign: 'center' }}>
            Account successfully created with the email{' '}
            <b>{match.params.email}</b>. You can now Log In!
          </h2>
          <hr className="my-4" />
        </div>
      </div>
    );
  }

  const files = () => (
    <div className="form-group">
      <br></br>
      <p>
        <b>Upload medical certificate</b>
      </p>
      <input type="file" name="file" onChange={e => onChange1(e)} required />
    </div>
  );
  return (
    <div className="container">
      <div className="jumbotron mt-5">
        <h1>Add description</h1>
        <br></br>
        <p>Please, choose the description that matches your role.</p>
        <form onSubmit={e => onSubmit(e)}>
          <div className="form-group">
            <select
              name="profession"
              value={profession}
              onChange={e => onChange(e)}
              required
            >
              <option key=""></option>
              {types.map(type => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
          {profession === 'Health Professional' ? files() : null}
          <br></br>

          <button className="btn btn-primary" type="submit">
            Register
          </button>
        </form>
        <hr className="my-4" />
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(
  mapStateToProps,
  { logout }
)(Add_description);
