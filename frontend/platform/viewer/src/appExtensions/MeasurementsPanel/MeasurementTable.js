/* eslint-disable react/prop-types */
import './MeasurementTable.styl';
import React, { useState, useEffect, Fragment } from 'react';
import { Icon } from '@ohif/ui';
import MeasurementTableItem from './MeasurementTableItem.js';
import PropTypes from 'prop-types';
import { ScrollableArea } from '@ohif/ui';
import { TableList } from '@ohif/ui';
import axiosInstance from 'axios';
import { UINotificationService } from '@ohif/core';
import { utils } from '@ohif/core';
import findMostRecentStructuredReport from '../../../../core/src/DICOMSR/utils/findMostRecentStructuredReport.js';
import Report from './Report.js';
import { withModal } from '@ohif/ui';

function MeasurementTable(props) {
  const {
    measurementCollection,
    selectedMeasurementNumber,
    timepoints,
    onItemClick,
    onDeleteClick,
    onRelabelClick,
    onEditDescriptionClick,
    saveFunction,
    onSaveComplete,
    user,
    modal: { show, hide },
    studies,
  } = props;

  const [selectedKey, setSelectedKey] = useState(null);
  const [info, setInfo] = useState(null);
  const [canEditStudy, setCanEditStudy] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await onInfo(user, studies[0].StudyInstanceUID);

        response.forEach(djangoMeasurement => {
          let collectionMeasurement = measurementCollection[0].measurements.filter(
            function(el) {
              return (
                el.wadorsURI !== undefined &&
                el.data[0].displayText === djangoMeasurement.displayText &&
                el.toolType === djangoMeasurement.toolType
              );
            }
          );
          if (collectionMeasurement.length !== 0) {
            collectionMeasurement[0].measurementNumber =
              djangoMeasurement.measurement_number;
            // os números das medições têm de coincidir na Collection e no Django
            if (
              collectionMeasurement[0].label === '...' &&
              collectionMeasurement[0].description === undefined
            ) {
              Object.keys(collectionMeasurement[0]).forEach(key => {
                if (!['label', 'description'].includes(key))
                  djangoMeasurement[key] = collectionMeasurement[0][key];
              });
            } else {
              if (collectionMeasurement[0].label.split(' ').length === 2) {
                djangoMeasurement[
                  'label'
                ] = collectionMeasurement[0].label.split(' ')[0];

                let description = collectionMeasurement[0].label.split(' ')[1];

                description = description.replace('(', '');
                description = description.replace(')', '');

                djangoMeasurement['description'] = description;
                Object.keys(collectionMeasurement[0]).forEach(key => {
                  if (!['label', 'description'].includes(key))
                    djangoMeasurement[key] = collectionMeasurement[0][key];
                });
              } else {
                Object.keys(collectionMeasurement[0]).forEach(key => {
                  djangoMeasurement[key] = collectionMeasurement[0][key];
                });
              }
            }
          }
        });
        setInfo(response);
      } catch (error) {
        alert(error);
      }
    };

    fetchInfo();
    const studiesEditControl = localStorage.getItem('studyEditControl');
    let studiesMap = JSON.parse(studiesEditControl);
    if (studiesMap[studies[0].StudyInstanceUID] === 0) {
      setCanEditStudy(true);
    }
  }, [measurementCollection, studies, user]);

  function report(measurementNumber, isEditingDjango) {
    let report = '';

    if (isEditingDjango) {
      let measurementData = info.filter(function(el) {
        return el.measurement_number === measurementNumber;
      });

      if (measurementData.length !== 0) {
        report = measurementData[0]['report'];
      }
    } else {
      let filtered = measurementCollection[0].measurements.filter(function(el) {
        return el.measurementNumber === selectedKey;
      });

      report = filtered[0]['report'];
    }

    show({
      content: Report,
      contentProps: {
        report,
        measurementNumber,
        isEditingDjango,
        canEditStudy,
        saveReport,
        hide,
      },
      title: 'Measurement Report',
      //fullscreen: true,
    });
  }

  function saveReport(report, measurementNumber, isEditingDjango) {
    if (isEditingDjango) {
      let measurementData = info.filter(function(el) {
        return el.measurement_number === measurementNumber;
      });
      if (measurementData.length !== 0) {
        // está guardada na base de dados
        measurementData[0]['report'] = report;
      }
    } else {
      // NÃO está guardada na base de dados
      let filtered = measurementCollection[0].measurements.filter(function(el) {
        return el.measurementNumber === selectedKey;
      });

      filtered[0]['report'] = report;

      let updatedMeasurement = filtered[0];

      const index = measurementCollection[0].measurements.indexOf(filtered[0]);

      if (index !== -1) {
        measurementCollection[0].measurements[index] = updatedMeasurement;
      }
    }
  }

  if (info === null) {
    return (
      <div className="measurementTable">
        <div className="measurementTableHeader">
          {
            <div className="measurementTableHeaderItem">
              <div className="timepointLabel">{timepoints[0].key}</div>
              <div className="timepointDate">{timepoints[0].date}</div>
            </div>
          }
        </div>
        <ScrollableArea>
          <div>
            <TableList
              customHeader={
                <React.Fragment>
                  <div className="tableListHeaderTitle">Study Measurements</div>
                  <div className="numberOfItems">
                    {measurementCollection[0].measurements.length}
                  </div>
                </React.Fragment>
              }
            >
              {<Fragment></Fragment>}
            </TableList>
          </div>
        </ScrollableArea>
      </div>
    );
  } else {
    return (
      <div className="measurementTable">
        <div className="measurementTableHeader">
          {
            <div className="measurementTableHeaderItem">
              <div className="timepointLabel">{timepoints[0].key}</div>
              <div className="timepointDate">{timepoints[0].date}</div>
            </div>
          }
        </div>
        <ScrollableArea>
          <div>
            <TableList
              customHeader={
                <React.Fragment>
                  <div className="tableListHeaderTitle">Study Measurements</div>
                  <div className="numberOfItems">
                    {measurementCollection[0].measurements.length}
                  </div>
                </React.Fragment>
              }
            >
              {getMeasurements()}
            </TableList>
          </div>
        </ScrollableArea>
        <div className="measurementTableFooter">
          {saveFunction &&
          canEditStudy &&
          measurementCollection[0].measurements.length !== 0 &&
          localStorage.getItem('HealthProfessional_Authenticated') ? (
            <button
              onClick={save}
              className="saveBtn"
              data-cy="save-measurements-btn"
            >
              <Icon name="save" width="14px" height="14px" />
              Save measurements
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  async function save() {
    if (saveFunction) {
      let notification = UINotificationService.create({});

      let form_data = new FormData();

      measurementCollection[0].measurements.map((measurement, index) => {
        let measurementData = {};
        if (measurement.wadorsURI !== undefined) {
          if (info.length !== 0) {
            // significa que é uma medição que JÁ ESTÁ guardada, por isso estamos a edita-la!
            console.log(
              '\n--------------- Medição guardada no Django. A editar... ----------------------'
            );
            let djangoMeasurement = info.filter(function(el) {
              return (
                el.toolType === measurement.toolType &&
                el.displayText === measurement.data[0].displayText &&
                el.wadorsURI !== undefined &&
                el.measurement_number === measurement.measurementNumber
              );
            });

            measurementData['measurement_number'] =
              djangoMeasurement[0].measurement_number;
            measurementData['instance_uid'] = djangoMeasurement[0].instance_uid;
            measurementData['study'] = djangoMeasurement[0].study;
            measurementData['displayText'] =
              djangoMeasurement[0].data[0].displayText;
            measurementData['toolType'] = djangoMeasurement[0].toolType;
            measurementData['report'] = djangoMeasurement[0].report;
            if (measurement.label.split(' ').length === 2) {
              measurementData['label'] = measurement.label.split(' ')[0];

              let description = measurement.label.split(' ')[1];

              description = description.replace('(', '');
              description = description.replace(')', '');

              measurementData['description'] = description;
            } else {
              measurementData['label'] = djangoMeasurement[0].label;
              measurementData['description'] = djangoMeasurement[0].description;
            }
          } else {
            return;
          }
        } else {
          console.log(
            '\n--------------- Medição nova. A guardar... ----------------------'
          );
          // significa que é uma medição que ainda NÃO ESTÁ guardada
          measurementData['measurement_number'] = measurement.measurementNumber;
          measurementData['instance_uid'] = measurement.SOPInstanceUID;
          measurementData['study'] = measurement.StudyInstanceUID;
          measurementData['displayText'] = measurement.data[0].displayText;
          measurementData['toolType'] = measurement.toolType;

          if (measurement.label.split(' ').length === 2) {
            measurementData['label'] = measurement.label.split(' ')[0];

            let description = measurement.label.split(' ')[1];

            description = description.replace('(', '');
            description = description.replace(')', '');

            measurementData['description'] = description;
          } else {
            measurementData['label'] = measurement.label;
            measurementData['description'] = '';
          }

          if (measurement['report'] !== undefined) {
            measurementData['report'] = measurement.report;
          } else {
            measurementData['report'] = '';
          }
        }

        form_data.append(index, JSON.stringify(measurementData));
      });

      const myNewMeasurement = await axiosInstance
        .post(
          `/api/measurement/?user=${user.email}`,
          form_data,
          {
            headers: {
              Authorization: `JWT ${localStorage.getItem('access')}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        .then(res => {
          return res;
        })
        .catch(error => {
          return error.response;
        });

      if (myNewMeasurement.status === 201) {
        let m = info.filter(function(el) {
          return el.measurement_number === selectedKey;
        });
        if (m.length === 0) {
          // se ela não existe no Orthanc
          try {
            const result = await saveFunction();

            if (onSaveComplete) {
              localStorage.setItem('saved', true);
              location.reload(false);
              onSaveComplete({
                title: 'Measurements - Success!',
                message: result.message,
                type: 'success',
              });
            }
          } catch (error) {
            if (onSaveComplete) {
              onSaveComplete({
                title: 'Measurements - Failure!',
                message: error.message,
                type: 'error',
              });
            }
          }
        } else {
          if (myNewMeasurement.status === 201) {
            //já existe, logo estamos simplesmente a editar
            location.reload(false);
            notification.show({
              title: 'Measurements - Success!',
              message: 'Measurement edited - Success',
              type: 'success',
              duration: 8000,
            });
          } else {
            notification.show({
              title: 'Measurements - Failure!',
              message: 'Measurement edited - Failure',
              type: 'error',
              duration: 8000,
            });
          }
        }
      } else {
        notification.show({
          title: 'Measurements - Failure!',
          message: 'Measurement saved - Failure',
          type: 'error',
          duration: 8000,
        });
      }
    }
  }

  function getMeasurements() {
    const selected = selectedMeasurementNumber
      ? selectedMeasurementNumber
      : selectedKey;
    return measurementCollection[0].measurements.map((measurement, index) => {
      const key = measurement.measurementNumber;
      const itemIndex = index + 1;
      const itemClass = selected === key ? 'selected' : '';

      if (measurement.wadorsURI !== undefined) {
        if (info.length !== 0) {
          // significa que é uma medição que JÁ ESTÁ guardada
          console.log(
            '\n--------------- Está guardada no Django ----------------------'
          );
          let djangoMeasurement = info.filter(function(el) {
            return (
              el.toolType === measurement.toolType &&
              el.displayText === measurement.data[0].displayText &&
              el.wadorsURI !== undefined &&
              el.measurement_number === measurement.measurementNumber
            );
          });

          if (djangoMeasurement[0]) {
            measurement = djangoMeasurement[0];

            measurement['created_by'] = djangoMeasurement[0]['user'];
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        console.log(
          '\n---------------- NÃO está guardada no Django ------------------'
        );
        let isRepeated = measurementCollection[0].measurements.filter(function(
          el
        ) {
          return (
            el.toolType === measurement.toolType &&
            el.data[0].displayText === measurement.data[0].displayText &&
            el.wadorsURI === undefined &&
            el.label === measurement.label
          );
        });

        if (isRepeated.length > 1) {
          console.log(
            '\n---------------- A eliminar repetidos... ------------------'
          );
          isRepeated.forEach(rep => {
            const index = measurementCollection[0].measurements.indexOf(rep);

            measurementCollection[0].measurements.splice(index, 1);
          });
          return;
        }
      }

      return (
        <MeasurementTableItem
          key={key}
          itemIndex={itemIndex}
          itemClass={itemClass}
          measurementData={measurement}
          onItemClick={onClick}
          onRelabel={onRelabelClick}
          onDelete={onDeleteClick}
          onEditDescription={onEditDescriptionClick}
          onMeasurementDelete={deleteMeasurement}
          onReport={report}
          canEditStudy={canEditStudy}
        />
      );
    });
  }

  function onClick(event, measurementData) {
    setSelectedKey(measurementData.measurementNumber);

    if (onItemClick) {
      onItemClick(event, measurementData);
    }
  }

  async function deleteMeasurement(measurement_number) {
    const studies = utils.studyMetadataManager.all();

    const latestSeries = findMostRecentStructuredReport(studies);

    const instance = latestSeries.getFirstInstance();

    let notification = UINotificationService.create({});
    let form_data = new FormData();

    if (info.length !== 0) {
      // significa que é uma medição que JÁ ESTÁ guardada. Vamos elimina-la!
      console.log(
        '\n--------------- Medição guardada no Django. A eliminar... ----------------------'
      );
      let djangoMeasurement = info.filter(function(el) {
        return (
          el.wadorsURI !== undefined &&
          el.measurement_number === measurement_number
        );
      });

      if (djangoMeasurement.length === 1) {
        let measurementData = {};

        measurementData['created_by'] = djangoMeasurement[0].created_by;
        measurementData['measurement_number'] =
          djangoMeasurement[0].measurement_number;
        measurementData['patient_id'] =
          instance._instance.metadata.PatientID || '';
        measurementData['instance_uid'] = djangoMeasurement[0].instance_uid;
        measurementData['study'] = djangoMeasurement[0].study;
        measurementData['wadorsURI'] = djangoMeasurement[0].wadorsURI;

        form_data.append('measurement', JSON.stringify(measurementData));
      } else {
        return;
      }
    } else {
      return;
    }

    const deleteMeasurement = await axiosInstance
      .post(
        `/api/measurement_delete/?user=${user.email}`,
        form_data,
        {
          headers: {
            Authorization: `JWT ${localStorage.getItem('access')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      .then(res => {
        return res;
      })
      .catch(error => {
        return error.response;
      });

    if (deleteMeasurement.status === 200) {
      location.reload(false);
      notification.show({
        title: 'Measurements - Success!',
        message: 'Measurement deleted - Success',
        type: 'success',
        duration: 8000,
      });
    } else {
      notification.show({
        title: 'Measurements - Failure!',
        message: 'Measurement deleted - Failure',
        type: 'error',
        duration: 8000,
      });
    }
  }
}

MeasurementTable.propTypes = {
  measurementCollection: PropTypes.array.isRequired,
  timepoints: PropTypes.array.isRequired,
  onItemClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  selectedMeasurementNumber: PropTypes.number,
  saveFunction: PropTypes.func,
  onSaveComplete: PropTypes.func,
  user: PropTypes.object.isRequired,
};

async function onInfo(user, study) {
  let notification = UINotificationService.create({});
  const response = await axiosInstance
    .get(
      `/api/measurement/?user=${user.email}&study=${study}`,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `JWT ${localStorage.getItem('access')}`,
        },
      }
    )
    .then(res => {
      return res;
    })
    .catch(error => {
      return error.response;
    });

  if (response.status !== 200) {
    notification.show({
      title: 'Measurements - Failure!',
      message: 'Failed to Connect to Server',
      type: 'error',
      duration: 6000,
    });
  } else {
    return response.data;
  }
}

export default withModal(MeasurementTable);
