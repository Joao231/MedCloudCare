/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { reset_password_confirm } from '../actions/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPasswordConfirm = ({ match, reset_password_confirm }) => {
  const [requestSent, setRequestSent] = useState(false);
  const [formData, setFormData] = useState({
    new_password: '',
    re_new_password: '',
  });

  const { new_password, re_new_password } = formData;

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

  const onSubmit = e => {
    e.preventDefault();

    const uid = match.params.uid;
    const token = match.params.token;

    if (new_password !== re_new_password) {
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
    } else {
      reset_password_confirm(uid, token, new_password, re_new_password);
      setRequestSent(true);

      toast.success('Your password has been successfully changed!', {
        position: 'top-right',
        autoClose: 10000,
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

  if (requestSent) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mt-5">
      <form onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <input
            id="password"
            className="form-control"
            type="password"
            placeholder="New Password"
            name="new_password"
            value={new_password}
            onChange={e => onChange(e)}
            minLength="6"
            required
          />
          <div className="message" id="message1" style={{ color: 'red' }}></div>
        </div>
        <div className="form-group">
          <input
            id="confirm_password"
            className="form-control"
            type="password"
            placeholder="Confirm New Password"
            name="re_new_password"
            value={re_new_password}
            onChange={e => onChange(e)}
            minLength="6"
            required
          />
          <div className="message" id="message2" style={{ color: 'red' }}></div>
        </div>
        <button className="btn btn-primary" type="submit">
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default connect(
  null,
  { reset_password_confirm }
)(ResetPasswordConfirm);
