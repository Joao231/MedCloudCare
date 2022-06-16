import React, {
  useState,
  Fragment,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { metadata, studies, utils, log } from '@ohif/core';
import usePrevious from '../customHooks/usePrevious';
import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from '../App.js';
import { useSnackbarContext } from '@ohif/ui';
import AppContext from '../context/AppContext';
import NotFound from '../routes/NotFound';
import filesToStudies from '../lib/filesToStudies';
import { connect } from 'react-redux';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata, deleteStudyMetadataPromise } = studies;
const { studyMetadataManager, makeCancelable } = utils;

const _promoteToFront = (list, values, searchMethod) => {
  let listCopy = [...list];
  let response = [];
  let promotedCount = 0;

  const arrayValues = values.split(',');
  arrayValues.forEach(value => {
    const index = listCopy.findIndex(searchMethod.bind(undefined, value));

    if (index >= 0) {
      const [itemToPromote] = listCopy.splice(index, 1);
      response[promotedCount] = itemToPromote;
      promotedCount++;
    }
  });

  return {
    promoted: promotedCount === arrayValues.length,
    data: [...response, ...listCopy],
  };
};

/**
 * Promote series to front if find found equivalent on filters object
 * @param {Object} study - study reference to promote series against
 * @param {Object} [filters] - Object containing filters to be applied
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @param {boolean} isFilterStrategy - if filtering by query param strategy ON
 */
const _promoteList = (study, studyMetadata, filters, isFilterStrategy) => {
  let promoted = false;
  // Promote only if no filter should be applied
  if (!isFilterStrategy) {
    promoted = _promoteStudyDisplaySet(study, studyMetadata, filters);
  }

  return promoted;
};

const _promoteStudyDisplaySet = (study, studyMetadata, filters) => {
  let promoted = false;
  const queryParamsLength = Object.keys(filters).length;
  const shouldPromoteToFront = queryParamsLength > 0;

  if (shouldPromoteToFront) {
    const { seriesInstanceUID } = filters;

    const _seriesLookup = (valueToCompare, displaySet) => {
      return displaySet.SeriesInstanceUID === valueToCompare;
    };
    const promotedResponse = _promoteToFront(
      studyMetadata.getDisplaySets(),
      seriesInstanceUID,
      _seriesLookup
    );

    study.displaySets = promotedResponse.data;
    promoted = promotedResponse.promoted;
  }

  return promoted;
};

/**
 * Method to identify if query param (from url) was applied to given list
 * @param {Object} study - study reference to promote series against
 * @param {Object} [filters] - Object containing filters to be applied
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @param {boolean} isFilterStrategy - if filtering by query param strategy ON
 */
const _isQueryParamApplied = (study, filters = {}, isFilterStrategy) => {
  const { seriesInstanceUID } = filters;

  let applied = true;
  // skip in case no filter or no toast manager

  if (!seriesInstanceUID) {
    return applied;
  }
  const seriesInstanceUIDs = seriesInstanceUID.split(',');

  let validateFilterApplied = () => {
    const sameSize = arrayToInspect.length === seriesInstanceUIDs.length;
    if (!sameSize) {
      return;
    }

    return arrayToInspect.every(item =>
      seriesInstanceUIDs.some(
        seriesInstanceUIDStr => seriesInstanceUIDStr === item.SeriesInstanceUID
      )
    );
  };

  let validatePromoteApplied = () => {
    let isValid = true;
    for (let index = 0; index < seriesInstanceUIDs.length; index++) {
      const seriesInstanceUIDStr = seriesInstanceUIDs[index];
      const resultSeries = arrayToInspect[index];

      if (
        !resultSeries ||
        resultSeries.SeriesInstanceUID !== seriesInstanceUIDStr
      ) {
        isValid = false;
        break;
      }
    }
    return isValid;
  };

  const { series = [], displaySets = [] } = study;
  const arrayToInspect = isFilterStrategy ? series : displaySets;
  const validateMethod = isFilterStrategy
    ? validateFilterApplied
    : validatePromoteApplied;

  if (!arrayToInspect) {
    applied = false;
  } else {
    applied = validateMethod();
  }

  return applied;
};
const _showUserMessage = (queryParamApplied, message, dialog = {}) => {
  if (queryParamApplied) {
    return;
  }

  const { show: showUserMessage = () => {} } = dialog;
  showUserMessage({
    message,
  });
};

const _addSeriesToStudy = (studyMetadata, series) => {
  const sopClassHandlerModules =
    extensionManager.modules['sopClassHandlerModule'];
  const study = studyMetadata.getData();
  const seriesMetadata = new OHIFSeriesMetadata(series, study);
  const existingSeries = studyMetadata.getSeriesByUID(series.SeriesInstanceUID);
  if (existingSeries) {
    studyMetadata.updateSeries(series.SeriesInstanceUID, seriesMetadata);
  } else {
    studyMetadata.addSeries(seriesMetadata);
  }

  studyMetadata.createAndAddDisplaySetsForSeries(
    sopClassHandlerModules,
    seriesMetadata
  );

  study.displaySets = studyMetadata.getDisplaySets();

  study.derivedDisplaySets = studyMetadata.getDerivedDatasets({
    Modality: series.Modality,
  });

  _updateStudyMetadataManager(study, studyMetadata);
};

const _updateStudyMetadataManager = (study, studyMetadata) => {
  const { StudyInstanceUID } = study;

  if (!studyMetadataManager.get(StudyInstanceUID)) {
    studyMetadataManager.add(studyMetadata);
  }
};

const _updateStudyDisplaySets = (study, studyMetadata) => {
  const sopClassHandlerModules =
    extensionManager.modules['sopClassHandlerModule'];

  if (!study.displaySets) {
    study.displaySets = studyMetadata.createDisplaySets(sopClassHandlerModules);
  }

  if (study.derivedDisplaySets) {
    studyMetadata._addDerivedDisplaySets(study.derivedDisplaySets);
  }
};

const _thinStudyData = study => {
  return {
    StudyInstanceUID: study.StudyInstanceUID,
    series: study.series.map(item => ({
      SeriesInstanceUID: item.SeriesInstanceUID,
    })),
  };
};

function ViewerRetrieveStudyData({
  server,
  studyInstanceUIDs,
  seriesInstanceUIDs,
  clearViewportSpecificData,
  setStudyData,
  user,
}) {
  // hooks
  const [isRendered, setIsRendered] = useState(false);

  const [error, setError] = useState(false);
  const [reload, setReload] = useState(false);
  const [studies, setStudies] = useState([]);
  const [isStudyLoaded, setIsStudyLoaded] = useState(false);
  const snackbarContext = useSnackbarContext();
  const { appConfig = {} } = useContext(AppContext);
  const {
    filterQueryParam: isFilterStrategy = false,
    maxConcurrentMetadataRequests,
  } = appConfig;

  let cancelableSeriesPromises;
  let cancelableStudiesPromises;
  /**
   * Callback method when study is totally loaded
   * @param {object} study study loaded
   * @param {object} studyMetadata studyMetadata for given study
   * @param {Object} [filters] - Object containing filters to be applied
   * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
   */
  const studyDidLoad = (study, studyMetadata, filters) => {
    // User message
    const promoted = _promoteList(
      study,
      studyMetadata,
      filters,
      isFilterStrategy
    );

    // Clear viewport to allow new promoted one to be displayed
    if (promoted) {
      clearViewportSpecificData(0);
    }

    const isQueryParamApplied = _isQueryParamApplied(
      study,
      filters,
      isFilterStrategy
    );
    // Show message in case not promoted neither filtered but should to
    _showUserMessage(
      isQueryParamApplied,
      'Query parameters were not totally applied. It might be using original series list for given study.',
      snackbarContext
    );

    setStudies([...studies, study]);
  };

  /**
   * Method to process studies. It will update displaySet, studyMetadata, load remaining series, ...
   * @param {Array} studiesData Array of studies retrieved from server
   * @param {Object} [filters] - Object containing filters to be applied
   * @param {string} [filters.seriesInstanceUID] - series instance uid to filter results against
   */
  const processStudies = (studiesData, filters, loadRemaining) => {
    if (Array.isArray(studiesData) && studiesData.length > 0) {
      // Map studies to new format, update metadata manager?
      const studies = studiesData.map(study => {
        setStudyData(study.StudyInstanceUID, _thinStudyData(study));
        const studyMetadata = new OHIFStudyMetadata(
          study,
          study.StudyInstanceUID
        );

        _updateStudyDisplaySets(study, studyMetadata);
        _updateStudyMetadataManager(study, studyMetadata);

        // Attempt to load remaning series if any
        cancelableSeriesPromises[study.StudyInstanceUID] = makeCancelable(
          loadRemainingSeries(studyMetadata, loadRemaining)
        )
          .then(result => {
            if (result && !result.isCanceled) {
              studyDidLoad(study, studyMetadata, filters);
            }
          })
          .catch(error => {
            if (error && !error.isCanceled) {
              setError(error);
              log.error(error);
            }
          })
          .finally(() => {
            setIsStudyLoaded(true);
          });

        return study;
      });

      setStudies(studies);
    }
  };

  const forceRerender = () => setStudies(studies => [...studies]);

  const loadRemainingSeries = async (studyMetadata, loadRemaining) => {
    const { seriesLoader } = studyMetadata.getData();
    if (!seriesLoader) return;

    const loadNextSeries = async () => {
      if (!seriesLoader.hasNext()) return;
      const series = await seriesLoader.next();

      if (!loadRemaining) {
        // false
        if (series.Modality === 'SEG' || series.Modality === 'SR') {
          _addSeriesToStudy(studyMetadata, series);
        }
        forceRerender();
        return loadNextSeries();
      } else {
        _addSeriesToStudy(studyMetadata, series);
        forceRerender();
        return loadNextSeries();
      }
    };

    const concurrentRequestsAllowed =
      maxConcurrentMetadataRequests || studyMetadata.getSeriesCount();
    const promises = Array(concurrentRequestsAllowed)
      .fill(null)
      .map(loadNextSeries);
    const remainingPromises = await Promise.all(promises);
    setIsStudyLoaded(true);
    return remainingPromises;
  };

  const loadStudies = async () => {
    try {
      const studiesAccessControl = localStorage.getItem('studyAccessControl');

      let studiesMap = JSON.parse(studiesAccessControl);
      let isFirstTime = studiesMap[studyInstanceUIDs[0]];

      if (isFirstTime === 0) {
        const server_url = new URL('http://localhost/');

        let url = new URL(
          `api/image_decrypt/?hasPerm=true&study=${studyInstanceUIDs[0]}&user=${
            user.email
          }`,
          server_url
        );

        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = 'blob';
        req.setRequestHeader(
          'Authorization',
          `JWT ${localStorage.getItem('access')}`
        );
        req.send();

        req.onload = () => {
          const zip = require('jszip')();
          let flist = [];
          var blob = req.response;
          zip.loadAsync(blob).then(async function(zip) {
            for (let fileName in zip.files) {
              var fileBlob = await zip.file(fileName).async('blob');
              var file = new File([fileBlob], fileName, {
                type: 'application/dcm',
              });
              flist.push(file);
            }
            const studies = await filesToStudies(flist);

            const filters = {};
            const seriesInstanceUID =
              seriesInstanceUIDs && seriesInstanceUIDs[0];
            const retrieveParams = [server, studyInstanceUIDs];

            if (seriesInstanceUID) {
              filters.seriesInstanceUID = seriesInstanceUID;
              // Query param filtering controlled by appConfig property
              if (isFilterStrategy) {
                retrieveParams.push(filters);
              }
            }

            if (
              appConfig.splitQueryParameterCalls ||
              appConfig.enableGoogleCloudAdapter
            ) {
              retrieveParams.push(true);
            }

            cancelableStudiesPromises[studyInstanceUIDs] = makeCancelable(
              retrieveStudiesMetadata(...retrieveParams)
            )
              .then(result => {
                if (result && !result.isCanceled) {
                  setIsRendered(true);

                  let result_measurements = result[0].series.filter(function(
                    el
                  ) {
                    return el.Modality === 'SR' || el.Modality === 'SEG';
                  });

                  studies[0].series = studies[0].series.concat(
                    result_measurements
                  );

                  studies[0]['seriesLoader'] = result[0]['seriesLoader'];
                  studies[0]['seriesMap'] = result[0]['seriesMap'];
                  studies[0]['wadoRoot'] = result[0]['wadoRoot'];
                  studies[0]['wadoUriRoot'] = result[0]['wadoUriRoot'];
                  studies[0]['qidoRoot'] = result[0]['qidoRoots'];
                  studies[0]['FrameOfReferenceUID'] =
                    result[0]['FrameOfReferenceUID'];
                  //ReferencedSeriesSequence
                  studies[0]['ReferencedSeriesSequence'] =
                    result[0]['ReferencedSeriesSequence'];

                  processStudies(studies, filters, true);
                }
              })
              .catch(error => {
                if (error && !error.isCanceled) {
                  setError(error);
                  log.error(error);
                }
              });
            //setReload(true);
            studiesMap[studyInstanceUIDs] = 1; //not first time anymore.
            localStorage.setItem(
              'studyAccessControl',
              JSON.stringify(studiesMap)
            );
          });
        };
      } else if (isFirstTime === 1) {
        setReload(false);
        const filters = {};
        const seriesInstanceUID = seriesInstanceUIDs && seriesInstanceUIDs[0];
        const retrieveParams = [server, studyInstanceUIDs];

        if (seriesInstanceUID) {
          filters.seriesInstanceUID = seriesInstanceUID;
          // Query param filtering controlled by appConfig property
          if (isFilterStrategy) {
            retrieveParams.push(filters);
          }
        }

        if (
          appConfig.splitQueryParameterCalls ||
          appConfig.enableGoogleCloudAdapter
        ) {
          retrieveParams.push(true);
        }

        cancelableStudiesPromises[studyInstanceUIDs] = makeCancelable(
          retrieveStudiesMetadata(...retrieveParams)
        )
          .then(result => {
            if (result && !result.isCanceled) {
              setIsRendered(true);
              //console.log(result);

              processStudies(result, filters, true);
            }
          })
          .catch(error => {
            if (error && !error.isCanceled) {
              setError(error);
              log.error(error);
            }
          });
      } else {
        const server_url = new URL('http://localhost/');

        let url = new URL(
          `api/image_decrypt/?hasPerm=false&study=${
            studyInstanceUIDs[0]
          }&user=${user.email}`,
          server_url
        );

        let req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = 'blob';
        req.setRequestHeader(
          'Authorization',
          `JWT ${localStorage.getItem('access')}`
        );
        req.send();

        req.onload = () => {
          const zip = require('jszip')();
          let flist = [];
          var blob = req.response;
          zip.loadAsync(blob).then(async function(zip) {
            for (let fileName in zip.files) {
              var fileBlob = await zip.file(fileName).async('blob');
              var file = new File([fileBlob], fileName, {
                type: 'application/dcm',
              });
              flist.push(file);
            }
            let studies = await filesToStudies(flist);

            const filters = {};
            const seriesInstanceUID =
              seriesInstanceUIDs && seriesInstanceUIDs[0];
            const retrieveParams = [server, studyInstanceUIDs];

            if (seriesInstanceUID) {
              filters.seriesInstanceUID = seriesInstanceUID;
              // Query param filtering controlled by appConfig property
              if (isFilterStrategy) {
                retrieveParams.push(filters);
              }
            }

            if (
              appConfig.splitQueryParameterCalls ||
              appConfig.enableGoogleCloudAdapter
            ) {
              retrieveParams.push(true);
            }

            cancelableStudiesPromises[studyInstanceUIDs] = makeCancelable(
              retrieveStudiesMetadata(...retrieveParams)
            )
              .then(result => {
                if (result && !result.isCanceled) {
                  setIsRendered(true);

                  let result_measurements = result[0].series.filter(function(
                    el
                  ) {
                    return el.Modality === 'SR' || el.Modality === 'SEG';
                  });

                  studies[0].series = studies[0].series.concat(
                    result_measurements
                  );

                  studies[0]['seriesLoader'] = result[0]['seriesLoader'];

                  //studies[0]['seriesMap'] = result[0]['seriesMap'];
                  studies[0]['wadoRoot'] = result[0]['wadoRoot'];
                  studies[0]['wadoUriRoot'] = result[0]['wadoUriRoot'];
                  studies[0]['qidoRoot'] = result[0]['qidoRoots'];
                  studies[0]['FrameOfReferenceUID'] =
                    result[0]['FrameOfReferenceUID'];

                  studies[0]['ReferencedSeriesSequence'] =
                    result[0]['ReferencedSeriesSequence'];

                  processStudies(studies, filters, false);
                }
              })
              .catch(error => {
                if (error && !error.isCanceled) {
                  setError(error);
                  log.error(error);
                }
              });
            //setReload(true);
            studiesMap[studyInstanceUIDs] = -1;
            localStorage.setItem(
              'studyAccessControl',
              JSON.stringify(studiesMap)
            );
          });
        };
      }
    } catch (error) {
      if (error) {
        setError(error);
        log.error(error);
      }
    }
  };

  const purgeCancellablePromises = useCallback(() => {
    for (let studyInstanceUIDs in cancelableStudiesPromises) {
      if ('cancel' in cancelableStudiesPromises[studyInstanceUIDs]) {
        cancelableStudiesPromises[studyInstanceUIDs].cancel();
      }
    }

    for (let studyInstanceUIDs in cancelableSeriesPromises) {
      if ('cancel' in cancelableSeriesPromises[studyInstanceUIDs]) {
        cancelableSeriesPromises[studyInstanceUIDs].cancel();
        deleteStudyMetadataPromise(studyInstanceUIDs);
        studyMetadataManager.remove(studyInstanceUIDs);
      }
    }
  }, [cancelableSeriesPromises, cancelableStudiesPromises]);

  const prevStudyInstanceUIDs = usePrevious(studyInstanceUIDs);

  useEffect(() => {
    const hasStudyInstanceUIDsChanged = !(
      prevStudyInstanceUIDs &&
      prevStudyInstanceUIDs.every(e => studyInstanceUIDs.includes(e))
    );

    if (hasStudyInstanceUIDsChanged) {
      studyMetadataManager.purge();
      purgeCancellablePromises();
    }
  }, [prevStudyInstanceUIDs, purgeCancellablePromises, studyInstanceUIDs]);

  useEffect(() => {
    cancelableSeriesPromises = {};
    cancelableStudiesPromises = {};
    loadStudies();

    return () => {
      purgeCancellablePromises();
    };
  }, []);

  if (error) {
    const content = JSON.stringify(error);
    if (content.includes('404') || content.includes('NOT_FOUND')) {
      return <NotFound />;
    }

    return <NotFound message="Failed to retrieve study data" />;
  }

  return (
    <Fragment>
      {isRendered ? (
        <ConnectedViewer
          studies={studies}
          isStudyLoaded={isStudyLoaded}
          studyInstanceUIDs={studies && studies.map(a => a.StudyInstanceUID)}
          reload={reload}
        />
      ) : (
        <Fragment>
          <h3 style={{ marginLeft: '20px' }}>{'Loading...'}</h3>
        </Fragment>
      )}
    </Fragment>
  );
}

ViewerRetrieveStudyData.propTypes = {
  studyInstanceUIDs: PropTypes.array.isRequired,
  seriesInstanceUIDs: PropTypes.array,
  server: PropTypes.object,
  clearViewportSpecificData: PropTypes.func.isRequired,
  setStudyData: PropTypes.func.isRequired,
  user: PropTypes.object,
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

const ConnectedViewerRetrieveStudyData = connect(
  mapStateToProps,
  null
)(ViewerRetrieveStudyData);

export default ConnectedViewerRetrieveStudyData;
