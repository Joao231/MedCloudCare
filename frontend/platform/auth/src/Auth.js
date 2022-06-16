import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Home from './containers/Home';
import Superuser from './containers/Superuser';
import Login from './containers/Login';
import Signup from './containers/Signup';
import Activate from './containers/Activate';
import ResetPassword from './containers/ResetPassword';
import ResetPasswordConfirm from './containers/ResetPasswordConfirm';
import Facebook from './containers/Facebook';
import Google from './containers/Google';
import Twitter from './containers/Twitter';
import Github from './containers/Github';
import Linkedin from './containers/Linkedin';
import Spotify from './containers/Spotify';
import Slack from './containers/Slack';
import TwoFA from './containers/TwoFA';
import Add_description from './containers/Add_description';
import View_groups from './containers/View_groups';
import Group_details from './containers/Group_details';
import View_studies from './containers/View_studies';
import View_models from './containers/View_models';
import See_permissions from './containers/See_permissions';
import addPermissions from './containers/Add_permissions.js';
import removePermissions from './containers/Remove_permissions';
import addGroup from './containers/Add_group';
import removeGroup from './containers/Remove_group';
import addElements from './containers/Add_elements';
import removeElements from './containers/Remove_elements';
import Verify_Secret from './containers/Verify_Secret';

import { Provider } from 'react-redux';
import store from './store';

import Layout from './hocs/Layout';
import LayoutRefresh from './hocs/Layout_refresh';

const Auth = () => (
  <Provider store={store}>
    <Router>
      <LayoutRefresh>
        <Layout>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/superuser" component={Superuser} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <Route exact path="/twoFA" component={TwoFA} />
            <Route
              exact
              path="/add_description/:email"
              component={Add_description}
            />
            <Route exact path="/view_groups" component={View_groups} />
            <Route
              exact
              path="/group_details/:name/:userName"
              component={Group_details}
            />
            <Route exact path="/view_studies/:name" component={View_studies} />
            <Route exact path="/view_models/:name" component={View_models} />
            <Route
              exact
              path="/see_permissions/:name/:user"
              component={See_permissions}
            />
            <Route
              exact
              path="/see_permissions/:name/:user/add_permissions"
              component={addPermissions}
            />
            <Route
              exact
              path="/see_permissions/:name/:user/remove_permissions"
              component={removePermissions}
            />
            <Route exact path="/add_group" component={addGroup} />
            <Route exact path="/remove_group" component={removeGroup} />
            <Route exact path="/add_elements/:name" component={addElements} />
            <Route
              exact
              path="/remove_elements/:name"
              component={removeElements}
            />
            <Route exact path="/verify_secret" component={Verify_Secret} />
            <Route exact path="/facebook" component={Facebook} />
            <Route exact path="/google" component={Google} />
            <Route exact path="/complete/twitter/" component={Twitter} />
            <Route exact path="/complete/github/" component={Github} />
            <Route exact path="/complete/linkedin/" component={Linkedin} />
            <Route exact path="/callback/spotify/" component={Spotify} />
            <Route exact path="/complete/slack/" component={Slack} />
            <Route exact path="/reset-password" component={ResetPassword} />
            <Route
              exact
              path="/password/reset/confirm/:uid/:token"
              component={ResetPasswordConfirm}
            />
            <Route exact path="/activate/:uid/:token" component={Activate} />
          </Switch>
        </Layout>
      </LayoutRefresh>
    </Router>
  </Provider>
);

export default Auth;
