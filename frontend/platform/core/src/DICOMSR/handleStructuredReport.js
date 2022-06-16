import dcmjs from 'dcmjs';
import { api } from 'dicomweb-client';

import DICOMWeb from '../DICOMWeb';
import parseDicomStructuredReport from './parseDicomStructuredReport';
import parseMeasurementsData from './parseMeasurementsData';
import getAllDisplaySets from './utils/getAllDisplaySets';
import errorHandler from '../errorHandler';
import getXHRRetryRequestHook from '../utils/xhrRetryRequestHook';

const VERSION_NAME = 'dcmjs-0.0';
const TRANSFER_SYNTAX_UID = '1.2.840.10008.1.2.1';

/**
 * Function to retrieve measurements from DICOM Structured Reports coming from determined server
 *
 * @param {Array} series - List of all series metaData loaded
 * @param {Array} studies - List of all studies metaData loaded
 * @param {string} serverUrl - Server URL to be used on request
 * @param {object} external
 * @returns {Object} MeasurementData
 */
const retrieveMeasurementFromSR = async (
  measurementSeries,
  studies,
  serverUrl,
  external
) => {
  const config = {
    url: serverUrl,
    headers: DICOMWeb.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
    requestHooks: [getXHRRetryRequestHook()],
  };

  const dicomWeb = new api.DICOMwebClient(config);

  const instance = measurementSeries[0].getFirstInstance();
  const options = {
    studyInstanceUID: instance.getStudyInstanceUID(),
    seriesInstanceUID: instance.getSeriesInstanceUID(),
    sopInstanceUID: instance.getSOPInstanceUID(),
  };

  const part10SRArrayBuffer = await dicomWeb.retrieveInstance(options);

  const displaySets = getAllDisplaySets(studies);
  const measurementData = parseDicomStructuredReport(
    part10SRArrayBuffer,
    displaySets,
    external,
    instance._data.baseWadoRsUri // acrescentei!
  );

  let storedMeasurementByToolType = measurementData[1];

  //console.log(measurementData[0]);
  let toolType = measurementData[0]['toolType'];
  storedMeasurementByToolType[toolType].splice(0, 1);
  storedMeasurementByToolType[toolType].push(measurementData[0]);

  for (let i = 1; i < measurementSeries.length; i++) {
    const instance = measurementSeries[i].getFirstInstance();
    const options = {
      studyInstanceUID: instance.getStudyInstanceUID(),
      seriesInstanceUID: instance.getSeriesInstanceUID(),
      sopInstanceUID: instance.getSOPInstanceUID(),
    };

    const part10SRArrayBuffer = await dicomWeb.retrieveInstance(options);

    const displaySets = getAllDisplaySets(studies);
    const measurementData = parseDicomStructuredReport(
      part10SRArrayBuffer,
      displaySets,
      external,
      instance._data.baseWadoRsUri // acrescentei!
    );

    //console.log(measurementData[0]);
    let toolType = measurementData[0]['toolType'];
    storedMeasurementByToolType[toolType].push(measurementData[0]);
  }

  //storedMeasurementByToolType.push(measurementData);

  //console.log(storedMeasurementByToolType);
  return storedMeasurementByToolType;
};

/**
 * Function to store measurements to DICOM Structured Reports in determined server
 *
 * @param {Object} measurements - OHIF measurementData object
 * @param {string} serverUrl - Server URL to be used on request
 * @returns {Promise}
 */

// alterei!!!
const stowSRFromMeasurements = async (measurements, serverUrl) => {
  //console.log(measurements);
  measurements['allTools'].forEach(async measurement => {
    let data = { allTools: [] };
    if (measurement.wadorsURI === undefined) {
      // se ainda não está no Orthanc
      data['allTools'].push(measurement);

      const { dataset } = parseMeasurementsData(data);

      const { DicomMetaDictionary, DicomDict } = dcmjs.data;
      const meta = {
        FileMetaInformationVersion:
          dataset._meta.FileMetaInformationVersion.Value,
        MediaStorageSOPClassUID: dataset.SOPClassUID,
        MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
        TransferSyntaxUID: TRANSFER_SYNTAX_UID,
        ImplementationClassUID: DicomMetaDictionary.uid(),
        ImplementationVersionName: VERSION_NAME,
      };

      const denaturalized = DicomMetaDictionary.denaturalizeDataset(meta);
      const dicomDict = new DicomDict(denaturalized);

      dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);

      const part10Buffer = dicomDict.write();

      const config = {
        url: serverUrl,
        headers: DICOMWeb.getAuthorizationHeader(),
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
        requestHooks: [getXHRRetryRequestHook()],
      };

      const dicomWeb = new api.DICOMwebClient(config);
      const options = {
        datasets: [part10Buffer],
      };

      await dicomWeb.storeInstances(options);
    }
  });
};

export { retrieveMeasurementFromSR, stowSRFromMeasurements };
