/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { signup } from '../actions/auth';

export default class Secret_Key extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pin: '',
    };

    this.pinChange = this.pinChange.bind(this);
    this.verify_pin = this.verify_pin.bind(this);
  }

  pinChange(e) {
    this.setState({
      pin: e.target.value,
    });
  }

  verify_pin() {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic am9hbzpmMWRyaXZlcjE5OTk='},
      body: JSON.stringify({
        email: this.props.email,
        pin: this.props.pin,
      }),
    };
    fetch('/api/2FA_login', requestOptions).then(response => {
      if (response.data.status === true) {
        signup(
          this.props.email,
          this.props.first_name,
          this.props.last_name,
          this.props.password,
          this.props.secret_key
        );
      }
    });
  }

  render() {
    return (
      <div className="container mt-5">
        <h1>Put the pin which is on the Google Authenticator</h1>

        <div className="form-group">
          <input
            className="form-control"
            type="text"
            placeholder="Pin*"
            name="pin"
            value={this.state.pin}
            onChange={this.pinChange}
            required
          />
        </div>
        <button className="btn btn-primary" onClick={this.verify_pin}>
          Register
        </button>
      </div>
    );
  }
}
