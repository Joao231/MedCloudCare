/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

const Home = ({
  user,
  isAuthenticated,
  isInvestigatorAuthenticated,
  isSuperuserAuthenticated,
  isHealthProfessionalAuthenticated,
}) => {
  if (user !== null && isAuthenticated && isInvestigatorAuthenticated) {
    return (
      <div className="container">
        <div className="jumbotron mt-5">
          <h1 className="display-4">
            Hello, <b>{user.email}</b>!
          </h1>
          <br></br>
          <p className="lead">
            You can browse studies from Orthanc, upload and view local images,
            and add AI algorithms.
          </p>

          <hr className="my-4" />
        </div>
      </div>
    );
  } else if (user !== null && isAuthenticated && isSuperuserAuthenticated) {
    return (
      <div className="container">
        <div className="jumbotron mt-5">
          <h1 className="display-4">
            Hello, admin <b>{user.email}</b>!
          </h1>
          <br></br>
          <hr className="my-4" />
        </div>
      </div>
    );
  } else if (
    user !== null &&
    isAuthenticated &&
    isHealthProfessionalAuthenticated
  ) {
    return (
      <div className="container">
        <div className="jumbotron mt-5">
          <h1 className="display-4">
            Hello, Dr. <b>{user.email}</b>!
          </h1>
          <br></br>
          <p className="lead">
            You can browse studies from Orthanc, upload, share and view local
            images.
          </p>
          <hr className="my-4" />
        </div>
      </div>
    );
  } else {
    return (
      <div className="container">
        <div className="jumbotron mt-5">
          <h1 className="display-4">Welcome!</h1>
          <p className="lead">This is a DICOM Image Tool with AI features!</p>
          <br></br>
          <p>
            For more information, visit our
            {` `}
            <FontAwesomeIcon
              icon={faGithub}
              size="2x"
              style={{ color: 'black', cursor: 'pointer' }}
              onClick={() =>
                window.open(
                  'https://github.com/Joao231/Medical-app-authentication?fbclid=IwAR1FHWLY4_B6lQtei5vtYacTtxFKp9tqwJYnaCNQyBKYjudHaUNuIlATcUY',
                  '_blank'
                )
              }
            />
            {` `} repository.
          </p>
          <hr className="my-4" />
        </div>
      </div>
    );
  }
};

const mapStateToProps = state => ({
  user: state.auth.user,
  isAuthenticated: state.auth.isAuthenticated,
  isInvestigatorAuthenticated: state.auth.isInvestigatorAuthenticated,
  isSuperuserAuthenticated: state.auth.isSuperuserAuthenticated,
  isHealthProfessionalAuthenticated:
    state.auth.isHealthProfessionalAuthenticated,
});

export default connect(
  mapStateToProps,
  null
)(Home);
