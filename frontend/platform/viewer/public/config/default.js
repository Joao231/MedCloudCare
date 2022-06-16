window.config = {
  // default: '/'
  routerBasename: '/',
  extensions: [],
  showStudyList: true,
  filterQueryParam: false,
  disableServersCache: false,
  studyPrefetcher: {
    enabled: true,
    order: 'closest',
    displaySetCount: 3,
    preventCache: false,
    prefetchDisplaySetsTimeout: 300,
    maxNumPrefetchRequests: 100,
    displayProgress: true,
    includeActiveDisplaySet: true,
  },
  servers: {
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: '/wado',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
      },
    ],
  },
  // Extensions should be able to suggest default values for these?
  // Or we can require that these be explicitly set

  cornerstoneExtensionConfig: {},
};
