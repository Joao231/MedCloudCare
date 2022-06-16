/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import axios from 'axios';
import { Form } from '@progress/kendo-react-form';
import 'react-toastify/dist/ReactToastify.css';
import { TableSearchFilter, TablePagination } from '@ohif/ui';
import { Redirect } from 'react-router-dom';
import { load_user } from '../actions/auth';
import './Add_group.css';
import { useDebounce } from '@ohif/ui';
import axiosInstance from 'axios';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

function Add_or_Remove_studies(props) {
  const { user } = props;

  const [groupName] = useState(props.location.state);
  const [redirect, setRedirect] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [choice, setChoice] = useState('Add');

  const [sharedStudies, setSharedStudies] = useState([]);
  const [studies, setStudies] = useState([]);
  const [selectedStudiesToAdd, setSelectedStudiesToAdd] = useState([]);
  const [selectedStudiesToRemove, setSelectedStudiesToRemove] = useState([]);

  const [filterValues, setFilterValues] = useState({
    patient_name: '',
    patient_id: '',
    study_date: '',
  });

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pageNumber, setPageNumber] = useState(0);

  const debouncedFilters = useDebounce(filterValues, 250);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const config = {
          headers: {
            Authorization: `JWT ${localStorage.getItem('access')}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        };

        const response = await axiosInstance.get(
          `/api/view_studies?groupName=${groupName}&user=${
            user['email']
          }`,
          config
        );

        //console.log(response.data.Studies);

        let sharedStudiesIds = [];
        Object.keys(response.data.Studies).forEach(function(study_uid) {
          //console.log(study_uid);
          if (!sharedStudiesIds.includes(study_uid)) {
            sharedStudiesIds.push(study_uid);
          }
        });

        let removable = [];

        try {
          const response = await _fetchStudies(user, debouncedFilters);

          let studies = [];
          response.forEach(function(study) {
            if (
              !sharedStudiesIds.includes(study['study_uid']) &&
              !studies.includes(study) &&
              study['user'] === user.email
            ) {
              studies.push(study);
            } else if (sharedStudiesIds.includes(study['study_uid'])) {
              removable.push(study);
            }
          });

          setSharedStudies(removable);
          setStudies(studies);
          setIsLoaded(true);
        } catch (error) {
          alert(error);
        }
      } catch (error) {
        alert(error);
      }
    };

    fetchStudies();
  }, [
    debouncedFilters,
    groupName,
    user,
    selectedStudiesToAdd,
    selectedStudiesToRemove,
  ]);

  const mediumTableMetaStudies = [
    {
      displayText: 'PatientName',
      fieldName: 'patient_name',
      inputType: 'text',
      size: 50,
    },
    {
      displayText: 'PatientId',
      fieldName: 'patient_id',
      inputType: 'text',
      size: 50,
    },
    {
      displayText: 'StudyDate',
      fieldName: 'study_date',
      inputType: 'text',
      size: 100,
    },
  ];

  const totalSizeStudies = mediumTableMetaStudies
    .map(field => field.size)
    .reduce((prev, next) => prev + next);

  function handleStudiesFilterChange(fieldName, value) {
    setFilterValues(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  const handleSelectStudyToAdd = event => {
    const study_uid = event.target.value;

    if (!selectedStudiesToAdd.includes(study_uid)) {
      selectedStudiesToAdd.push(study_uid);
    } else {
      setSelectedStudiesToAdd(
        selectedStudiesToAdd.filter(selectedStudyUID => {
          return selectedStudyUID !== study_uid;
        })
      );
    }
  };

  const handleSelectAllStudiesToAdd = () => {
    if (selectedStudiesToAdd.length < studies.length) {
      setSelectedStudiesToAdd(studies.map(({ study_uid }) => study_uid));
    } else {
      setSelectedStudiesToAdd([]);
    }
  };

  async function handleSubmitAdd() {
    if (selectedStudiesToAdd.length == 0) {
      let text = document.getElementById('message2');
      text.textContent = 'At least one study must be selected!';
    } else {
      try {
        const config = {
          headers: {
            Authorization: `JWT ${localStorage.getItem('access')}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        };
        let form_data = new FormData();
        form_data.append('groupName', groupName);
        form_data.append('mainUser', user.email);
        form_data.append('studies', JSON.stringify(selectedStudiesToAdd));

        const res = await axios.post(
          `/api/health_professional_add_studies`,
          form_data,
          config
        );

        if (res.data.Status === true) {
          setRedirect(true);
        } else {
          alert('Error while adding studies');
        }
      } catch (err) {
        alert(err);
      }
    }
  }

  const handleSelectStudyToRemove = event => {
    const study_uid = event.target.value;

    if (!selectedStudiesToRemove.includes(study_uid)) {
      selectedStudiesToRemove.push(study_uid);
    } else {
      setSelectedStudiesToRemove(
        selectedStudiesToRemove.filter(selectedStudyUID => {
          return selectedStudyUID !== study_uid;
        })
      );
    }
  };

  const handleSelectAllStudiesToRemove = () => {
    if (selectedStudiesToRemove.length < sharedStudies.length) {
      setSelectedStudiesToRemove(
        sharedStudies.map(({ study_uid }) => study_uid)
      );
    } else {
      setSelectedStudiesToRemove([]);
    }
  };

  async function handleSubmitRemove() {
    if (selectedStudiesToRemove.length == 0) {
      let text = document.getElementById('message2');
      text.textContent = 'At least one study must be selected!';
    } else {
      try {
        const config = {
          headers: {
            Authorization: `JWT ${localStorage.getItem('access')}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        };
        let form_data = new FormData();
        form_data.append('groupName', groupName);
        form_data.append('mainUser', user.email);
        form_data.append('studies', JSON.stringify(selectedStudiesToRemove));

        const res = await axios.post(
          `/api/health_professional_remove_studies`,
          form_data,
          config
        );

        if (res.data.Status === true) {
          setRedirect(true);
        } else {
          alert('Error while removing studies');
        }
      } catch (err) {
        alert(err);
      }
    }
  }

  if (localStorage.getItem('HealthProfessional_Authenticated') && isLoaded) {
    return (
      <Fragment>
        <div className="content" style={{ marginTop: '5px' }}>
          <h4>Add or Remove?</h4>
          <p className="tooltiptext">
            Choose if you want to <b>remove</b> or <b>add</b> studies from group
            "{groupName}".
          </p>
          <select
            className="select"
            name="choice"
            value={choice}
            onChange={e => setChoice(e.target.value)}
            required
          >
            <option key=""></option>
            {['Add', 'Remove'].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {choice === 'Add' ? (
            <Form
              className="addGroup"
              onSubmit={handleSubmitAdd}
              render={formRenderProps => (
                <form
                  className="addGroup"
                  style={{
                    maxWidth: 650,
                  }}
                  onSubmit={formRenderProps.onSubmit}
                >
                  <fieldset className={'k-form-fieldset'}>
                    <div className="mb-3">
                      <legend
                        className={'k-form-legend'}
                        style={{
                          marginBottom: '10px',
                          marginTop: '5px',
                          fontSize: '14px',
                        }}
                      >
                        <b>Add studies:</b>
                      </legend>

                      <table className="table">
                        <colgroup>
                          {mediumTableMetaStudies.map((field, i) => {
                            const size = field.size;
                            const percentWidth =
                              (size / totalSizeStudies) * 100.0;

                            return (
                              <col
                                key={i}
                                style={{
                                  width: `${percentWidth}%`,
                                  textAlign: 'center',
                                }}
                              />
                            );
                          })}
                        </colgroup>
                        <thead className="table-head">
                          <tr className="filters">
                            <TableSearchFilter
                              meta={mediumTableMetaStudies}
                              values={filterValues}
                              onValueChange={handleStudiesFilterChange}
                              sortFieldName={'patient_name'}
                              sortDirection={'asc'}
                            />
                            <th
                              style={{
                                color: 'black',
                                paddingBottom: '15px',
                                paddingLeft: '8px',
                              }}
                              className="text-left"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedStudiesToAdd.length === studies.length
                                }
                                onChange={handleSelectAllStudiesToAdd}
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {/* EMPTY */}
                          {!studies.length && (
                            <tr style={{ backgroundColor: '#5F9EA0' }}>
                              <td colSpan={mediumTableMetaStudies.length}>
                                <div>{'No matching results'}</div>
                              </td>
                            </tr>
                          )}
                          {studies.map(
                            ({
                              study_uid,
                              patient_name,
                              patient_id,
                              study_date,
                            }) => {
                              return (
                                <tr
                                  style={{ backgroundColor: '#5F9EA0' }}
                                  key={study_uid}
                                >
                                  <td className="text-center">
                                    {patient_name || 'Empty'}
                                  </td>
                                  <td className="text-center">{patient_id}</td>
                                  <td className="text-center">
                                    {study_date || 'Invalid date'}
                                  </td>
                                  <td
                                    style={{
                                      paddingLeft: '8px',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      value={study_uid}
                                      checked={selectedStudiesToAdd.includes(
                                        study_uid
                                      )}
                                      onChange={handleSelectStudyToAdd}
                                    />
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>

                      <TablePagination
                        currentPage={pageNumber}
                        pageOptions={[5, 10, 15]}
                        nextPageFunc={() => setPageNumber(pageNumber + 1)}
                        prevPageFunc={() => setPageNumber(pageNumber - 1)}
                        onRowsPerPageChange={Rows => setRowsPerPage(Rows)}
                        rowsPerPage={rowsPerPage}
                        recordCount={studies.length}
                      />

                      <div
                        className="message"
                        id="message2"
                        style={{ color: 'red' }}
                      ></div>
                    </div>
                  </fieldset>
                  <div className="k-form-buttons">
                    <button
                      className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                      onClick={() => handleSubmitAdd()}
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}
            />
          ) : choice === 'Remove' ? (
            <Form
              className="addGroup"
              onSubmit={handleSubmitRemove}
              render={formRenderProps => (
                <form
                  className="addGroup"
                  style={{
                    maxWidth: 650,
                  }}
                  onSubmit={formRenderProps.onSubmit}
                >
                  <fieldset className={'k-form-fieldset'}>
                    <div className="mb-3">
                      <legend
                        className={'k-form-legend'}
                        style={{
                          marginBottom: '10px',
                          marginTop: '5px',
                          fontSize: '14px',
                        }}
                      >
                        <b>Remove studies:</b>
                      </legend>

                      <table className="table">
                        <colgroup>
                          {mediumTableMetaStudies.map((field, i) => {
                            const size = field.size;
                            const percentWidth =
                              (size / totalSizeStudies) * 100.0;

                            return (
                              <col
                                key={i}
                                style={{
                                  width: `${percentWidth}%`,
                                  textAlign: 'center',
                                }}
                              />
                            );
                          })}
                        </colgroup>
                        <thead className="table-head">
                          <tr className="filters">
                            <TableSearchFilter
                              meta={mediumTableMetaStudies}
                              values={filterValues}
                              onValueChange={handleStudiesFilterChange}
                              sortFieldName={'patient_name'}
                              sortDirection={'asc'}
                            />
                            <th
                              style={{
                                color: 'black',
                                paddingBottom: '15px',
                                paddingLeft: '8px',
                              }}
                              className="text-left"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedStudiesToRemove.length ===
                                  sharedStudies.length
                                }
                                onChange={handleSelectAllStudiesToRemove}
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {/* EMPTY */}
                          {!sharedStudies.length && (
                            <tr style={{ backgroundColor: '#5F9EA0' }}>
                              <td colSpan={mediumTableMetaStudies.length}>
                                <div>{'No matching results'}</div>
                              </td>
                            </tr>
                          )}
                          {sharedStudies.map(
                            ({
                              study_uid,
                              patient_name,
                              patient_id,
                              study_date,
                            }) => {
                              return (
                                <tr
                                  style={{ backgroundColor: '#5F9EA0' }}
                                  key={study_uid}
                                >
                                  <td className="text-center">
                                    {patient_name || 'Empty'}
                                  </td>
                                  <td className="text-center">{patient_id}</td>
                                  <td className="text-center">
                                    {study_date || 'Invalid date'}
                                  </td>
                                  <td
                                    style={{
                                      paddingLeft: '8px',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      value={study_uid}
                                      checked={selectedStudiesToRemove.includes(
                                        study_uid
                                      )}
                                      onChange={handleSelectStudyToRemove}
                                    />
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>

                      <TablePagination
                        currentPage={pageNumber}
                        pageOptions={[5, 10, 15]}
                        nextPageFunc={() => setPageNumber(pageNumber + 1)}
                        prevPageFunc={() => setPageNumber(pageNumber - 1)}
                        onRowsPerPageChange={Rows => setRowsPerPage(Rows)}
                        rowsPerPage={rowsPerPage}
                        recordCount={studies.length}
                      />

                      <div
                        className="message"
                        id="message2"
                        style={{ color: 'red' }}
                      ></div>
                    </div>
                  </fieldset>
                  <div className="k-form-buttons">
                    <button
                      className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                      onClick={() => handleSubmitRemove()}
                    >
                      Remove
                    </button>
                  </div>
                </form>
              )}
            />
          ) : null}

          {redirect ? (
            <Redirect to={'/view_studies/' + groupName} />
          ) : (
            <Fragment></Fragment>
          )}
        </div>
      </Fragment>
    );
  } else if (localStorage.getItem('HealthProfessional_Authenticated')) {
    return (
      <Fragment>
        <div className="content">
          {redirect ? (
            <Redirect
              to={`/group_details/${props.match.params.name}/${user['email']}`}
            />
          ) : (
            <Fragment></Fragment>
          )}
        </div>
      </Fragment>
    );
  } else {
    return null;
  }
}

Add_or_Remove_studies.propTypes = {
  user: PropTypes.object,
};

async function _fetchStudies(user, filters) {
  let url = `/api/image/?user=${user.email}`;

  Object.keys(filters).forEach(field => {
    if (filters[field] !== null && filters[field] !== '') {
      let param = filters[field];
      url = url + `&${field}=${param}`;
    }
  });

  const accessStudies = await axiosInstance
    .get(url, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `JWT ${localStorage.getItem('access')}`,
      },
    })
    .then(res => {
      return res;
    })
    .catch(error => {
      return error.response;
    });

  let allowedStudies = [];

  accessStudies.data.forEach(study => {
    allowedStudies.push(study);
  });

  return allowedStudies;
}

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  { load_user }
)(Add_or_Remove_studies);
