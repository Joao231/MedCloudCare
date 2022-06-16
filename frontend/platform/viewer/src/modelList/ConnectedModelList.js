import { connect } from 'react-redux';
import ModelListRoute from './ModelListRoute.js';

const mapStateToProps = state => {
  return {
    user: state.auth.user,
  };
};

const ConnectedModelList = connect(
  mapStateToProps,
  null
)(ModelListRoute);

export default ConnectedModelList;
