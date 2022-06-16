import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withModal } from '@ohif/ui';
import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import './Header.css';

function Header(props) {
  const { useLargeLogo, linkPath, linkText, location, children } = props;

  const hasLink = linkText && linkPath;

  return (
    <>
      <div
        className={classNames('entry-header', { 'header-big': useLargeLogo })}
      >
        <div className="header-left-box">
          {location && location.studyLink && (
            <Link
              to={location.studyLink}
              className="header-btn header-viewerLink"
            >
              {'Back to Viewer'}
            </Link>
          )}

          {children}

          {hasLink && (
            <Link
              className="header-btn header-studyListLinkSection"
              to={{
                pathname: linkPath,
                state: { studyLink: location.pathname },
              }}
            >
              {linkText}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

Header.propTypes = {
  linkText: PropTypes.string,
  linkPath: PropTypes.string,
  useLargeLogo: PropTypes.bool,
  location: PropTypes.object.isRequired,
  children: PropTypes.node,
};

Header.defaultProps = {
  useLargeLogo: false,
  children: OHIFLogo(),
};

export default withTranslation(['Header', 'AboutModal'])(
  withRouter(withModal(Header))
);
