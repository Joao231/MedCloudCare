/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import ConnectedStudyList from './../../../viewer/src/studyList/ConnectedStudyList.js';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const View_studies = ({ match }) => {
  return <ConnectedStudyList group={match.params.name} />;
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  {}
)(View_studies);
