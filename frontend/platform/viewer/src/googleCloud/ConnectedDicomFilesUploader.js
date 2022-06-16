import { connect } from 'react-redux';
import DicomFileUploaderModal from './DicomFileUploaderModal.js';
import OHIF from '@ohif/core';

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);

  const retrieveAuthHeaderFunction = () =>
    OHIF.DICOMWeb.getAuthorizationHeader(activeServer);

  return {
    retrieveAuthHeaderFunction,
    url: activeServer && activeServer.qidoRoot,
  };
};

const ConnectedDicomFileUploader = connect(
  mapStateToProps,
  null
)(DicomFileUploaderModal);

export default ConnectedDicomFileUploader;
