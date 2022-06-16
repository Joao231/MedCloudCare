import log from '../log';
import studies from '../studies';
import utils from '../utils';
import {
  retrieveMeasurementFromSR,
  stowSRFromMeasurements,
} from './handleStructuredReport';

/**
 *
 * @typedef serverType
 * @property {string} type - type of the server
 * @property {string} wadoRoot - server wado root url
 *
 */

/**
 * Function to be registered into MeasurementAPI to retrieve measurements from DICOM Structured Reports
 *
 * @param {serverType} server
 * @param {object} external
 * @returns {Promise} Should resolve with OHIF measurementData object
 */

// alterei!!!
const retrieveMeasurements = (server, external = {}) => {
  log.info('[DICOMSR] retrieveMeasurements');

  if (!server || server.type !== 'dicomWeb') {
    log.error('[DICOMSR] DicomWeb server is required!');
    return Promise.reject({});
  }

  const serverUrl = server.wadoRoot;
  const studies = utils.studyMetadataManager.all();
  let measurementSeries = [];
  studies.forEach(study => {
    const allSeries = study.getSeries ? study.getSeries() : [];
    allSeries.forEach(series => {
      // Skip series that may not have instances yet
      // This can happen if we have retrieved just the initial
      // details about the series via QIDO-RS, but not the full metadata
      if (!series || series.getInstanceCount() === 0) {
        return;
      }

      const supportedSopClassUIDs = [
        '1.2.840.10008.5.1.4.1.1.88.22',
        '1.2.840.10008.5.1.4.1.1.11.1',
        '1.2.840.10008.5.1.4.1.1.88.34', // COMPREHENSIVE_3D_SR
      ];

      const firstInstance = series.getFirstInstance();
      const SOPClassUID = firstInstance.getData().metadata.SOPClassUID;

      if (supportedSopClassUIDs.includes(SOPClassUID)) {
        measurementSeries.push(series);
      }
    });
  });

  if (measurementSeries.length === 0) return Promise.resolve({});

  //const latestSeries = findMostRecentStructuredReport(studies);

  return retrieveMeasurementFromSR(
    measurementSeries,
    studies,
    serverUrl,
    external
  );
};

/**
 *  Function to be registered into MeasurementAPI to store measurements into DICOM Structured Reports
 *
 * @param {Object} measurementData - OHIF measurementData object
 * @param {Object} filter
 * @param {serverType} server
 * @returns {Object} With message to be displayed on success
 */
const storeMeasurements = async (measurementData, filter, server) => {
  log.info('[DICOMSR] storeMeasurements');

  if (!server || server.type !== 'dicomWeb') {
    log.error('[DICOMSR] DicomWeb server is required!');
    return Promise.reject({});
  }

  const serverUrl = server.wadoRoot;
  const firstMeasurementKey = Object.keys(measurementData)[0];
  const firstMeasurement = measurementData[firstMeasurementKey][0];
  const StudyInstanceUID =
    firstMeasurement && firstMeasurement.StudyInstanceUID;

  try {
    await stowSRFromMeasurements(measurementData, serverUrl);
    if (StudyInstanceUID) {
      studies.deleteStudyMetadataPromise(StudyInstanceUID);
    }

    return {
      message: 'Measurements saved successfully',
    };
  } catch (error) {
    log.error(
      `[DICOMSR] Error while saving the measurements: ${error.message}`
    );
    throw new Error('Error while saving the measurements.');
  }
};

export { retrieveMeasurements, storeMeasurements };
