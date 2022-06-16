import toolbarModule from './toolbarModule';
import panelModule from './panelModule.js';
import init from './init';

export default {
  id: 'com.ohif.monai-label',

  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },
  getToolbarModule() {
    return toolbarModule;
  },
  getPanelModule({ servicesManager, commandsManager }) {
    return panelModule({ servicesManager, commandsManager });
  },
};
