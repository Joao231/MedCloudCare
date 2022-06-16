/* eslint-disable jsx-a11y/alt-text */
import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const Superuser = () => {
  const [approval, setApproval] = React.useState('');
  const [formData, setFormData] = useState({
    img_data: '',
    hasMedicalCertificate: false,
    email: '',
  });

  const { img_data, hasMedicalCertificate, email } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem('access')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    try {
      const res = await axios.get(
        `/api/get_url_medicalcertificate?email=${email}`,
        config
      );

      if (res) {
        setFormData({
          ...formData,
          hasMedicalCertificate: true,
          img_data: res.data.Img,
        });
      }
    } catch (err) {
      alert(err);
    }
  };

  const onSubmit2 = async e => {
    e.preventDefault();
    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem('access')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    let form_data = new FormData();
    form_data.append('email', email);
    form_data.append('approval', approval);
    try {
      const res = await axios.post(
        `/api/change_approval`,
        form_data,
        config
      );
      alert(res.data['Status']);
      location.reload();
    } catch (err) {
      alert(err);
    }
  };

  if (hasMedicalCertificate) {
    return (
      <div className="container">
        <h1>User {email} medical certificate:</h1>
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ marginTop: '80px' }}
        >
          <img src={img_data} />
          <form onSubmit={e => onSubmit2(e)}>
            <div className="form-group">
              <label style={{ marginTop: '20px' }}>
                Medical certificate is:
              </label>
              <select
                className="selectAlgorithm"
                name="task"
                value={approval}
                onChange={e => setApproval(e.target.value)}
                required
              >
                <option key=""></option>
                {['Approved', 'Not Approved'].map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">
              Register
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className="container">
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ marginTop: '150px' }}
      >
        <h1>Please, enter the email of the user.</h1>
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
          <button
            style={{ marginTop: '30px' }}
            type="submit"
            className="btn btn-primary"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default Superuser;
