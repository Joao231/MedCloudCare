import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, matchPath } from 'react-router';
import { Route } from 'react-router-dom';
import { NProgress } from '@tanem/react-nprogress';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { ViewerbaseDragDropContext, ErrorBoundary } from '@ohif/ui';
import * as RoutesUtil from './routes/routesUtil';
import NotFound from './routes/NotFound.js';
import { Bar, Container } from './components/LoadingBar/';
import './OHIFStandaloneViewer.css';
import './variables.css';
import './theme-tide.css';
import AppContext from './context/AppContext';

class OHIFStandaloneViewer extends Component {
  static contextType = AppContext;
  state = {
    isLoading: false,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    user: PropTypes.object,
    isAuthenticated: PropTypes.bool,
    setContext: PropTypes.func,
    userManager: PropTypes.object,
    location: PropTypes.object,
  };

  componentDidMount() {
    this.unlisten = this.props.history.listen(() => {
      if (this.props.setContext) {
        this.props.setContext(window.location.pathname);
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { user, isAuthenticated } = this.props;
    const { appConfig = {} } = this.context;
    if (user != null && isAuthenticated) {
      const routes = RoutesUtil.getRoutes(appConfig);

      const currentPath = this.props.location.pathname;

      const noMatchingRoutes = !routes.find(r =>
        matchPath(currentPath, {
          path: r.path,
          exact: true,
        })
      );

      return (
        <>
          <NProgress isAnimating={this.state.isLoading}>
            {({ isFinished, progress, animationDuration }) => (
              <Container
                isFinished={isFinished}
                animationDuration={animationDuration}
              >
                <Bar
                  progress={progress}
                  animationDuration={animationDuration}
                />
              </Container>
            )}
          </NProgress>
          <Route
            exact
            path="/silent-refresh.html"
            onEnter={RoutesUtil.reload}
          />
          <Route
            exact
            path="/logout-redirect.html"
            onEnter={RoutesUtil.reload}
          />
          {!noMatchingRoutes &&
            routes.map(({ path, Component }) => (
              <Route key={path} exact path={path}>
                {({ match }) => (
                  <CSSTransition
                    in={match !== null}
                    timeout={300}
                    classNames="fade"
                    unmountOnExit
                    onEnter={() => {
                      this.setState({
                        isLoading: true,
                      });
                    }}
                    onEntered={() => {
                      this.setState({
                        isLoading: false,
                      });
                    }}
                  >
                    {match === null ? (
                      <></>
                    ) : (
                      <ErrorBoundary context={match.url}>
                        <Component
                          match={match}
                          location={this.props.location}
                        />
                      </ErrorBoundary>
                    )}
                  </CSSTransition>
                )}
              </Route>
            ))}
          {noMatchingRoutes && <NotFound />}
        </>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = state => {
  return {
    user: state.auth.user,
    isAuthenticated: state.auth.isAuthenticated,
  };
};

const ConnectedOHIFStandaloneViewer = connect(
  mapStateToProps,
  null
)(OHIFStandaloneViewer);

export default ViewerbaseDragDropContext(
  withRouter(ConnectedOHIFStandaloneViewer)
);
