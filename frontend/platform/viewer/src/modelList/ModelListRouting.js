import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import ConnectedModelList from './ConnectedModelList';
import OHIF from '@ohif/core';

const { urlUtil: UrlUtil } = OHIF.utils;

function ModelListRouting({ location: routeLocation }) {
  const filters = UrlUtil.queryString.getQueryFilters(routeLocation);
  return <ConnectedModelList filters={filters} />;
}

ModelListRouting.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};

export default withRouter(ModelListRouting);
