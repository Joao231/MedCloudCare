/* eslint-disable jsx-a11y/anchor-is-valid */
import './OHIFLogo.css';
import { Icon } from '@ohif/ui';
import React from 'react';

function OHIFLogo() {
  return (
    <a target="_blank" rel="noopener noreferrer" className="header-brand">
      <Icon name="brain" className="header-logo-image" />
      <h1 className="header-logo-text">DICOM Image Viewer</h1>
    </a>
  );
}

export default OHIFLogo;
