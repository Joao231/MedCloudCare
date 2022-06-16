import ConnectedPanel from './components/Panel.js';

const panelModule = () => {
  return {
    menuOptions: [
      {
        icon: 'brain',
        label: 'AI',
        from: 'right',
        target: 'panel',
      },
    ],
    components: [
      {
        id: 'panel',
        component: ConnectedPanel,
      },
    ],
    defaultContext: ['VIEWER'],
  };
};

export default panelModule;
