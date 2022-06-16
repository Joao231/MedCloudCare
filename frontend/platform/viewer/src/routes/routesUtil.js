import { asyncComponent, retryImport } from '@ohif/ui';
import OHIF from '@ohif/core';
const { urlUtil: UrlUtil } = OHIF.utils;

const IHEInvokeImageDisplay = asyncComponent(() =>
  retryImport(() => import('./IHEInvokeImageDisplay.js'))
);

const UploadModel = asyncComponent(() =>
  retryImport(() => import('../components/AddAlgorithm.js'))
);

const ModelList = asyncComponent(() =>
  retryImport(() => import('../modelList/ModelListRouting.js'))
);

const Editor = asyncComponent(() =>
  retryImport(() => import('../editor/Editor.js'))
);

const ViewerRouting = asyncComponent(() =>
  retryImport(() => import('./ViewerRouting.js'))
);

const StudyListRouting = asyncComponent(() =>
  retryImport(() => import('../studylist/StudyListRouting.js'))
);
const StandaloneRouting = asyncComponent(() =>
  retryImport(() =>
    import('../connectedComponents/ConnectedStandaloneRouting.js')
  )
);
const ViewerLocalFileData = asyncComponent(() =>
  retryImport(() => import('../connectedComponents/ViewerLocalFileData.js'))
);

const Superuser = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/Superuser.js'))
);

const TwoFA = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/TwoFA.js'))
);

const View_groups = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/View_groups.js'))
);

const Group_details = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/Group_details.js'))
);

const View_studies = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/View_studies.js'))
);

const View_models = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/View_models.js'))
);

const Add_permissions = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/Add_permissions.js'))
);

const Add_models = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/Add_models.js'))
);

const Add_or_Remove_studies = asyncComponent(() =>
  retryImport(() =>
    import('../../../auth/src/containers/Add_or_Remove_studies.js')
  )
);

const Remove_permissions = asyncComponent(() =>
  retryImport(() =>
    import('../../../auth/src/containers/Remove_permissions.js')
  )
);

const NewGroup = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/Add_group.js'))
);

const Add_elements = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/Add_elements.js'))
);

const Verify_Secret = asyncComponent(() =>
  retryImport(() => import('../../../auth/src/containers/Verify_Secret.js'))
);

const reload = () => window.location.reload();

const ROUTES_DEF = {
  default: {
    superuser: {
      path: '/superuser',
      component: Superuser,
    },
    verifySecret: {
      path: '/verify_secret',
      component: Verify_Secret,
    },
    groupDetails: {
      path: '/group_details/:name/:userName',
      component: Group_details,
    },
    removePermissions: {
      path: '/remove_permissions/:name/:user',
      component: Remove_permissions,
    },
    addGroup: {
      path: '/add_group',
      component: NewGroup,
    },
    addElements: {
      path: '/add_elements/:name',
      component: Add_elements,
    },
    addModels: {
      path: '/add_models/:name',
      component: Add_models,
    },
    addRemoveStudies: {
      path: '/add_remove_studies/:name',
      component: Add_or_Remove_studies,
    },
    addPermissions: {
      path: '/add_permissions/:name/:user',
      component: Add_permissions,
    },
    viewModels: {
      path: '/view_models/:name',
      component: View_models,
    },
    viewStudies: {
      path: '/view_studies/:name',
      component: View_studies,
    },
    viewGroups: {
      path: '/view_groups',
      component: View_groups,
    },
    twoFa: {
      path: '/twoFA',
      component: TwoFA,
    },
    viewer: {
      path: '/viewer/:studyInstanceUIDs',
      component: ViewerRouting,
    },
    standaloneViewer: {
      path: '/viewer',
      component: StandaloneRouting,
    },
    upload: {
      path: '/model',
      component: UploadModel,
    },
    modelList: {
      path: '/modelList',
      component: ModelList,
    },
    editor: {
      path: '/editor',
      component: Editor,
    },
    list: {
      path: '/studylist',
      component: StudyListRouting,
    },
    local: {
      path: '/local',
      component: ViewerLocalFileData,
    },
    IHEInvokeImageDisplay: {
      path: '/IHEInvokeImageDisplay',
      component: IHEInvokeImageDisplay,
    },
  },
};

const getRoutes = appConfig => {
  const routes = [];
  for (let keyConfig in ROUTES_DEF) {
    const routesConfig = ROUTES_DEF[keyConfig];

    for (let routeKey in routesConfig) {
      const route = routesConfig[routeKey];
      const validRoute =
        typeof route.condition === 'function'
          ? route.condition(appConfig)
          : true;

      if (validRoute) {
        routes.push({
          path: route.path,
          Component: route.component,
        });
      }
    }
  }

  return routes;
};

const parsePath = (path, server, params) => {
  let _path = path;
  const _paramsCopy = Object.assign({}, server, params);

  for (let key in _paramsCopy) {
    _path = UrlUtil.paramString.replaceParam(_path, key, _paramsCopy[key]);
  }

  return _path;
};

const parseViewerPath = (appConfig = {}, server = {}, params) => {
  let viewerPath = ROUTES_DEF.default.viewer.path;
  if (appConfig.enableGoogleCloudAdapter) {
    viewerPath = ROUTES_DEF.gcloud.viewer.path;
  }

  return parsePath(viewerPath, server, params);
};

const parseStudyListPath = (appConfig = {}, server = {}, params) => {
  let studyListPath = ROUTES_DEF.default.list.path;
  if (appConfig.enableGoogleCloudAdapter) {
    studyListPath = ROUTES_DEF.gcloud.list.path || studyListPath;
  }

  return parsePath(studyListPath, server, params);
};

export { getRoutes, parseViewerPath, parseStudyListPath, reload };
