import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import ConnectedStudyList from './ConnectedStudyList';
import OHIF from '@ohif/core';

const { urlUtil: UrlUtil } = OHIF.utils;

function StudyListRouting({ location: routeLocation }) {
  const filters = UrlUtil.queryString.getQueryFilters(routeLocation);

  return (
    <ConnectedStudyList filters={filters} studyListFunctionsEnabled={true} />
  );
}

StudyListRouting.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};

export default withRouter(StudyListRouting);
