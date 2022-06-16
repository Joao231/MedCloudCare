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
import { getModelList } from './../../../viewer/src/modelList/ModelListRoute.js';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

function Add_or_Remove_models(props) {
  const { user } = props;

  const [groupName] = useState(props.location.state);
  const [redirect, setRedirect] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [choice, setChoice] = useState('Add');

  const [sharedModels, setSharedModels] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModelsToAdd, setSelectedModelsToAdd] = useState([]);
  const [selectedModelsToRemove, setSelectedModelsToRemove] = useState([]);

  const [filterValuesModels, setFilterValuesModels] = useState({
    name: '',
    version: '',
    task: '',
  });

  const [sort] = useState({
    fieldName: 'name',
    direction: 'desc',
  });

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pageNumber, setPageNumber] = useState(0);
  const debouncedSort = useDebounce(sort, 200);
  const debouncedFilters = useDebounce(filterValuesModels, 250);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await getModelList(
          user,
          {
            group: groupName,
          },
          debouncedSort,
          rowsPerPage
        );

        let sharedModelsNames = [];
        response.forEach(function(model) {
          if (!sharedModelsNames.includes(model['name'])) {
            sharedModelsNames.push(model['name']);
          }
        });

        let removable = [];

        try {
          const response = await getModelList(
            user,
            debouncedFilters,
            debouncedSort,
            rowsPerPage
          );

          let models = [];
          response.forEach(function(model) {
            if (
              !models.includes(model) &&
              !sharedModelsNames.includes(model['name']) &&
              model['user'] === user.email &&
              model['visibility'] === false
            ) {
              models.push(model);
            } else if (sharedModelsNames.includes(model['name'])) {
              removable.push(model);
            }
          });

          setSharedModels(removable);
          setModels(models);
          setIsLoaded(true);
        } catch (error) {
          alert(error);
        }
      } catch (error) {
        alert(error);
      }
    };

    fetchModels();
  }, [
    debouncedFilters,
    debouncedSort,
    groupName,
    rowsPerPage,
    user,
    selectedModelsToAdd,
  ]);

  const mediumTableMetaModels = [
    {
      displayText: 'ModelName',
      fieldName: 'name',
      inputType: 'text',
      size: 200,
    },
    {
      displayText: 'Version',
      fieldName: 'version',
      inputType: 'text',
      size: 100,
    },
    {
      displayText: 'Task',
      fieldName: 'task',
      inputType: 'text',
      size: 200,
    },
  ];

  const totalSizeModels = mediumTableMetaModels
    .map(field => field.size)
    .reduce((prev, next) => prev + next);

  function handleModelsFilterChange(fieldName, value) {
    setFilterValuesModels(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  const handleSelectModelToAdd = event => {
    const name = event.target.value;

    if (!selectedModelsToAdd.includes(name)) {
      selectedModelsToAdd.push(name);
    } else {
      setSelectedModelsToAdd(
        selectedModelsToAdd.filter(selectedModelName => {
          return selectedModelName !== name;
        })
      );
    }
  };

  const handleSelectAllModelsToAdd = () => {
    if (selectedModelsToAdd.length < models.length) {
      setSelectedModelsToAdd(models.map(({ name }) => name));
    } else {
      setSelectedModelsToAdd([]);
    }
  };

  async function handleSubmitAdd() {
    if (selectedModelsToAdd.length == 0) {
      let text = document.getElementById('message2');
      text.textContent = 'At least one model must be selected!';
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
        form_data.append('models', JSON.stringify(selectedModelsToAdd));

        const res = await axios.post(
          `/api/investigator_add_models`,
          form_data,
          config
        );

        if (res.data.Status === true) {
          setRedirect(true);
        } else {
          alert('Error while adding models');
        }
      } catch (err) {
        alert(err);
      }
    }
  }

  const handleSelectModelToRemove = event => {
    const name = event.target.value;

    if (!selectedModelsToRemove.includes(name)) {
      selectedModelsToRemove.push(name);
    } else {
      setSelectedModelsToRemove(
        selectedModelsToRemove.filter(selected => {
          return selected !== name;
        })
      );
    }
  };

  const handleSelectAllModelsToRemove = () => {
    if (selectedModelsToRemove.length < sharedModels.length) {
      setSelectedModelsToRemove(sharedModels.map(({ name }) => name));
    } else {
      setSelectedModelsToRemove([]);
    }
  };

  async function handleSubmitRemove() {
    if (selectedModelsToRemove.length === 0) {
      let text = document.getElementById('message2');
      text.textContent = 'At least one model must be selected!';
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
        form_data.append('models', JSON.stringify(selectedModelsToRemove));

        const res = await axios.post(
          `/api/investigator_remove_models`,
          form_data,
          config
        );

        if (res.data.Status === true) {
          setRedirect(true);
        } else {
          alert('Error while removing models');
        }
      } catch (err) {
        alert(err);
      }
    }
  }

  if (localStorage.getItem('Investigator_Authenticated') && isLoaded) {
    return (
      <Fragment>
        <div className="content" style={{ marginTop: '5px' }}>
          <h4>Add or Remove?</h4>
          <p className="tooltiptext">
            Choose if you want to <b>remove</b> or <b>add</b> models from group
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
                        <b>Share models:</b>
                      </legend>

                      <table className="table">
                        <colgroup>
                          {mediumTableMetaModels.map((field, i) => {
                            const size = field.size;
                            const percentWidth =
                              (size / totalSizeModels) * 100.0;

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
                              meta={mediumTableMetaModels}
                              values={filterValuesModels}
                              onValueChange={handleModelsFilterChange}
                              sortFieldName={'name'}
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
                                  selectedModelsToAdd.length === models.length
                                }
                                onChange={handleSelectAllModelsToAdd}
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {/* EMPTY */}
                          {!models.length && (
                            <tr style={{ backgroundColor: '#5F9EA0' }}>
                              <td colSpan={mediumTableMetaModels.length}>
                                <div>{'No matching results'}</div>
                              </td>
                            </tr>
                          )}
                          {models.map(({ name, version, task }) => {
                            return (
                              <tr
                                style={{ backgroundColor: '#5F9EA0' }}
                                key={name}
                              >
                                <td className="text-center">{name}</td>
                                <td className="text-center">{version}</td>
                                <td className="text-center">{task}</td>
                                <td
                                  style={{
                                    paddingLeft: '8px',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    value={name}
                                    checked={selectedModelsToAdd.includes(name)}
                                    onChange={handleSelectModelToAdd}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <TablePagination
                        currentPage={pageNumber}
                        pageOptions={[5, 10, 15]}
                        nextPageFunc={() => setPageNumber(pageNumber + 1)}
                        prevPageFunc={() => setPageNumber(pageNumber - 1)}
                        onRowsPerPageChange={Rows => setRowsPerPage(Rows)}
                        rowsPerPage={rowsPerPage}
                        recordCount={models.length}
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
                        <b>Remove models:</b>
                      </legend>

                      <table className="table">
                        <colgroup>
                          {mediumTableMetaModels.map((field, i) => {
                            const size = field.size;
                            const percentWidth =
                              (size / totalSizeModels) * 100.0;

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
                              meta={mediumTableMetaModels}
                              values={filterValuesModels}
                              onValueChange={handleModelsFilterChange}
                              sortFieldName={'name'}
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
                                  selectedModelsToRemove.length ===
                                  sharedModels.length
                                }
                                onChange={handleSelectAllModelsToRemove}
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody className="table-body">
                          {/* EMPTY */}
                          {!sharedModels.length && (
                            <tr style={{ backgroundColor: '#5F9EA0' }}>
                              <td colSpan={mediumTableMetaModels.length}>
                                <div>{'No matching results'}</div>
                              </td>
                            </tr>
                          )}
                          {sharedModels.map(({ name, version, task }) => {
                            return (
                              <tr
                                style={{ backgroundColor: '#5F9EA0' }}
                                key={name}
                              >
                                <td className="text-center">{name}</td>
                                <td className="text-center">{version}</td>
                                <td className="text-center">{task}</td>
                                <td
                                  style={{
                                    paddingLeft: '8px',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    value={name}
                                    checked={selectedModelsToRemove.includes(
                                      name
                                    )}
                                    onChange={handleSelectModelToRemove}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <TablePagination
                        currentPage={pageNumber}
                        pageOptions={[5, 10, 15]}
                        nextPageFunc={() => setPageNumber(pageNumber + 1)}
                        prevPageFunc={() => setPageNumber(pageNumber - 1)}
                        onRowsPerPageChange={Rows => setRowsPerPage(Rows)}
                        rowsPerPage={rowsPerPage}
                        recordCount={models.length}
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
            <Redirect to={'/view_models/' + groupName} />
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

Add_or_Remove_models.propTypes = {
  user: PropTypes.object,
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  { load_user }
)(Add_or_Remove_models);
