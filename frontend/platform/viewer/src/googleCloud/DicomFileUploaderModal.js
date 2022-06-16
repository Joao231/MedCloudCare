import React from 'react';
import PropTypes from 'prop-types';
import ConnectedDicomUploader from './DicomUploader';
import { servicesManager } from './../App.js';

function DicomFileUploaderModal({
  isOpen = false,
  onClose,
  url,
  retrieveAuthHeaderFunction,
}) {
  const { UIModalService } = servicesManager.services;

  const showDicomStorePickerModal = () => {
    if (!UIModalService) {
      return;
    }

    UIModalService.show({
      content: ConnectedDicomUploader,
      title: 'Upload DICOM Files',
      contentProps: {
        url,
        retrieveAuthHeaderFunction,
      },
      onClose,
    });
  };

  return (
    <React.Fragment>{isOpen && showDicomStorePickerModal()}</React.Fragment>
  );
}

DicomFileUploaderModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  retrieveAuthHeaderFunction: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  url: PropTypes.string,
};

export default DicomFileUploaderModal;
