/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import ConnectedModelList from './../../../viewer/src/modelList/ConnectedModelList.js';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const View_models = ({ match }) => {
  return (
    <ConnectedModelList
      title={'Models Shared By Group: '}
      group={match.params.name}
    />
  );
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  {}
)(View_models);
