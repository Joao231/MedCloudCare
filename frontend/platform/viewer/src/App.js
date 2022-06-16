import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';

import {
  SnackbarProvider,
  ModalProvider,
  DialogProvider,
  OHIFModal,
  LoggerProvider,
  ErrorBoundary,
} from '@ohif/ui';

import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  LoggerService,
  MeasurementService,
  utils,
} from '@ohif/core';

import {
  Layout,
  LayoutRefresh,
  Home,
  Login,
  Signup,
  Google,
  Activate,
  ResetPassword,
  ResetPasswordConfirm,
  Add_description,
  Linkedin,
  Spotify,
  Facebook,
  Github,
} from '../../auth/src/index.js';

import { setConfiguration } from './config';

/** Utils */
import { initWebWorkers } from './utils/index.js';

/** Extensions */
import { GenericViewerCommands, MeasurementsPanel } from './appExtensions';

/** Viewer */
import OHIFStandaloneViewer from './OHIFStandaloneViewer';

/** Store */
import { getActiveContexts } from './store/layout/selectors.js';
import store from './store';

/** Contexts */
import { AppProvider, useAppContext, CONTEXTS } from './context/AppContext';

localStorage.setItem('debug', 'cornerstoneTools');

/** ~~~~~~~~~~~~~ Application Setup */
const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => getActiveContexts(store.getState()),
};

/** Managers */
const commandsManager = new CommandsManager(commandsManagerConfig);
const servicesManager = new ServicesManager();
let extensionManager;
/** ~~~~~~~~~~~~~ End Application Setup */

window.store = store;

window.ohif = window.ohif || {};
window.ohif.app = {
  commandsManager,
  servicesManager,
  extensionManager,
};

class App extends Component {
  static propTypes = {
    config: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({
        routerBasename: PropTypes.string.isRequired,
        extensions: PropTypes.array,
      }),
    ]).isRequired,
    defaultExtensions: PropTypes.array,
  };

  static defaultProps = {
    config: {
      showStudyList: true,
      extensions: [],
    },
    defaultExtensions: [],
  };

  _appConfig;

  constructor(props) {
    super(props);

    const { config, defaultExtensions } = props;

    const appDefaultConfig = {
      showStudyList: true,
      cornerstoneExtensionConfig: {},
      extensions: [],
      routerBasename: '/',
    };

    this._appConfig = {
      ...appDefaultConfig,
      ...(typeof config === 'function' ? config({ servicesManager }) : config),
    };

    const { servers, cornerstoneExtensionConfig, extensions } = this._appConfig;

    setConfiguration(this._appConfig);

    _initServices([
      UINotificationService,
      UIModalService,
      UIDialogService,
      MeasurementService,
      LoggerService,
    ]);
    _initExtensions(
      [...defaultExtensions, ...extensions],
      cornerstoneExtensionConfig,
      this._appConfig
    );

    _initServers(servers);
    initWebWorkers();
  }

  render() {
    const { routerBasename } = this._appConfig;
    const {
      UINotificationService,
      UIDialogService,
      UIModalService,
      LoggerService,
    } = servicesManager.services;

    return (
      <ErrorBoundary context="App">
        <Provider store={store}>
          <AppProvider config={this._appConfig}>
            <Router basename={routerBasename}>
              <LoggerProvider service={LoggerService}>
                <SnackbarProvider service={UINotificationService}>
                  <DialogProvider service={UIDialogService}>
                    <ModalProvider modal={OHIFModal} service={UIModalService}>
                      <LayoutRefresh>
                        <Layout>
                          <Switch>
                            <Route exact path="/" component={Home} />
                            <Route exact path="/login" component={Login} />
                            <Route exact path="/signup" component={Signup} />
                            <Route
                              exact
                              path="/add_description/:email"
                              component={Add_description}
                            />
                            <Route
                              exact
                              path="/facebook"
                              component={Facebook}
                            />
                            <Route exact path="/google" component={Google} />
                            <Route
                              exact
                              path="/complete/github/"
                              component={Github}
                            />
                            <Route
                              exact
                              path="/complete/linkedin/"
                              component={Linkedin}
                            />
                            <Route
                              exact
                              path="/callback/spotify/"
                              component={Spotify}
                            />
                            <Route
                              exact
                              path="/reset-password"
                              component={ResetPassword}
                            />
                            <Route
                              exact
                              path="/password/reset/confirm/:uid/:token"
                              component={ResetPasswordConfirm}
                            />
                            <Route
                              exact
                              path="/activate/:uid/:token"
                              component={Activate}
                            />
                          </Switch>
                          <OHIFStandaloneViewer />
                        </Layout>
                      </LayoutRefresh>
                    </ModalProvider>
                  </DialogProvider>
                </SnackbarProvider>
              </LoggerProvider>
            </Router>
          </AppProvider>
        </Provider>
      </ErrorBoundary>
    );
  }
}

function _initServices(services) {
  servicesManager.registerServices(services);
}

function _initExtensions(extensions, cornerstoneExtensionConfig, appConfig) {
  extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    appConfig,
    api: {
      contexts: CONTEXTS,
      hooks: {
        useAppContext,
      },
    },
  });

  const requiredExtensions = [
    GenericViewerCommands,
    [OHIFCornerstoneExtension, cornerstoneExtensionConfig],
  ];

  /* WARNING: MUST BE REGISTERED _AFTER_ OHIFCornerstoneExtension */
  requiredExtensions.push(MeasurementsPanel);

  const mergedExtensions = requiredExtensions.concat(extensions);
  extensionManager.registerExtensions(mergedExtensions);
}

function _initServers(servers) {
  if (servers) {
    utils.addServers(servers, store);
  }
}

/*
 * Only wrap/use hot if in dev.
 */
const ExportedApp = process.env.NODE_ENV === 'development' ? hot(App) : App;

export default ExportedApp;
export { commandsManager, extensionManager, servicesManager };
