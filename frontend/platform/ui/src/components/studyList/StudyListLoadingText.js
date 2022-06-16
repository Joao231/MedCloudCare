import React from 'react';
import { Icon } from './../../elements/Icon';

function StudyListLoadingText() {
  return (
    <div className="loading-text">
      Loading... <Icon name="circle-notch" animation="pulse" />
    </div>
  );
}

const connectedComponent = StudyListLoadingText;

export { connectedComponent as StudyListLoadingText };
