/* eslint-disable react/prop-types */
import React, { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import axiosInstance from 'axios';
import axios from 'axios';
import { Form, Field } from '@progress/kendo-react-form';
import { Input } from '@progress/kendo-react-inputs';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TableSearchFilter, TablePagination } from '@ohif/ui';
import './Add_group.css';
import { getModelList } from './../../../viewer/src/modelList/ModelListRoute.js';
import { useDebounce } from '@ohif/ui';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

function NewGroup(props) {
  const { user } = props;
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [studies, setStudies] = useState([]);
  const [selectedStudies, setSelectedStudies] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [redirect, setRedirect] = useState(false);

  const [filterValues, setFilterValues] = useState({
    patient_name: '',
    patient_id: '',
    study_date: '',
  });

  const [filterValuesUsers, setFilterValuesUsers] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });

  const [sort] = useState({
    fieldName: 'name',
    direction: 'desc',
  });

  const [filterValuesModels, setFilterValuesModels] = useState({
    name: '',
    version: '',
    task: '',
  });
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pageNumber, setPageNumber] = useState(0);
  const debouncedSort = useDebounce(sort, 200);
  const debouncedFilters = useDebounce(filterValuesModels, 250);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const response = await _fetchStudies(user, filterValues);

        let studies = [];
        response.forEach(function(study) {
          if (!studies.includes(study) && study['user'] === user.email) {
            studies.push(study);
          }
        });

        setStudies(studies);
      } catch (error) {
        alert(error);
      }
    };

    const fetchModels = async () => {
      try {
        const response = await getModelList(
          user,
          debouncedFilters,
          debouncedSort,
          rowsPerPage
        );

        let models = [];
        response.forEach(function(model) {
          if (!models.includes(model) && model['user'] === user.email) {
            models.push(model);
          }
        });

        setModels(models);
      } catch (error) {
        alert(error);
      }
    };

    const fetchUsers = async group => {
      try {
        const response = await _getUsers(user, group, filterValuesUsers);

        let users = [];
        let mainUser = user.email;
        response.forEach(function(person) {
          let userData = {
            email: person.email,
            first_name: person.first_name,
            last_name: person.last_name,
          };
          if (person.email !== mainUser && !users.includes(userData)) {
            users.push(userData);
          }
        });
        setUsers(users);
      } catch (error) {
        alert(error);
      }
    };

    let group = '';
    if (user && localStorage.getItem('HealthProfessional_Authenticated')) {
      group = 'health_professionals';
      fetchStudies();
      fetchUsers(group);
      setPermissions(['View Studies Metadata', 'Edit Studies']);
    } else if (user && localStorage.getItem('Investigator_Authenticated')) {
      group = 'investigators';
      fetchModels();
      fetchUsers(group);
      setPermissions(['Test Models', 'Edit Models']);
    }
  }, [
    debouncedFilters,
    debouncedSort,
    filterValues,
    filterValuesModels,
    filterValuesUsers,
    rowsPerPage,
    user,
  ]);

  const mediumTableMeta = [
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

  const mediumTableMetaUsers = [
    {
      displayText: 'First Name',
      fieldName: 'first_name',
      inputType: 'text',
      size: 80,
    },
    {
      displayText: 'Last Name',
      fieldName: 'last_name',
      inputType: 'text',
      size: 80,
    },
    {
      displayText: 'Email',
      fieldName: 'email',
      inputType: 'text',
      size: 100,
    },
  ];

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

  const totalSize = mediumTableMeta
    .map(field => field.size)
    .reduce((prev, next) => prev + next);

  const totalSizeUsers = mediumTableMetaUsers
    .map(field => field.size)
    .reduce((prev, next) => prev + next);

  function CustomInput({ fieldType, ...others }) {
    return (
      <div>
        <Input type={fieldType} {...others} />
        <ValidationMessage {...others} />
      </div>
    );
  }

  function handleFilterChange(fieldName, value) {
    setFilterValues(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  function handleModelsFilterChange(fieldName, value) {
    setFilterValuesModels(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  function handleUsersFilterChange(fieldName, value) {
    setFilterValuesUsers(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  function ValidationMessage({ valid, visited, validationMessage }) {
    return (
      <>
        {!valid && visited && (
          <div className="required">{validationMessage}</div>
        )}
      </>
    );
  }

  function requiredValidator(value) {
    return value ? '' : <div className="required">This field is required.</div>;
  }

  function handleChange(e, el) {
    let inputElements = null;
    let i = null;
    if (e.target.name === 'permissions') {
      inputElements = document.getElementsByClassName('permissions');
      for (i = 0; inputElements[i]; ++i) {
        if (inputElements[i].checked && !selectedPermissions.includes(el)) {
          selectedPermissions.push(el);
          break;
        } else {
          const index = selectedPermissions.indexOf(el);
          if (index > -1) {
            selectedPermissions.splice(index, 1);
          }
        }
      }
      setSelectedPermissions(selectedPermissions);
    }
  }

  async function handleSubmit(formRenderProps) {
    if (selectedUsers.length == 0 || selectedPermissions.length == 0) {
      if (selectedUsers.length == 0) {
        let text = document.getElementById('message1');
        text.textContent = 'At least one user must be selected!';
      } else {
        let text = document.getElementById('message3');
        text.textContent = 'At least one permission must be selected!';
      }
    } else {
      if (localStorage.getItem('HealthProfessional_Authenticated')) {
        if (selectedStudies.length == 0) {
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
            form_data.append('groupName', formRenderProps['groupName']);
            form_data.append('mainUser', user.email);
            form_data.append('users', JSON.stringify(selectedUsers));
            form_data.append(
              'permissions',
              JSON.stringify(selectedPermissions)
            );
            form_data.append('studies', JSON.stringify(selectedStudies));

            const res = await axios.post(
              `/api/health_professional_add_group`,
              form_data,
              config
            );

            if (res.data.Status === true) {
              toast.success(
                `Group ${formRenderProps['groupName']} was created!`,
                {
                  position: 'top-right',
                  autoClose: 8000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                }
              );
              setRedirect(true);
            } else {
              toast.error('You have no permissions on the studies selected!', {
                position: 'top-right',
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              });
            }
          } catch (err) {
            toast.error('Error creating group! Please, try again.', {
              position: 'top-right',
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          }
        }
      } else if (localStorage.getItem('Investigator_Authenticated')) {
        if (selectedModels.length == 0) {
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
            form_data.append('groupName', formRenderProps['groupName']);
            form_data.append('mainUser', user.email);
            form_data.append('users', JSON.stringify(selectedUsers));
            form_data.append(
              'permissions',
              JSON.stringify(selectedPermissions)
            );
            form_data.append('models', JSON.stringify(selectedModels));

            const res = await axios.post(
              `/api/investigator_add_group`,
              form_data,
              config
            );

            if (res.data.Status === true) {
              setRedirect(true);
              toast.success(
                `Group ${formRenderProps['groupName']} was created!`,
                {
                  position: 'top-right',
                  autoClose: 8000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                }
              );
            } else {
              toast.error('You have no permissions on the models selected!', {
                position: 'top-right',
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              });
            }
          } catch (err) {
            toast.error('Error creating group! Please, try again.', {
              position: 'top-right',
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          }
        }
      } else {
        return null;
      }
    }
  }

  const handleSelectUser = event => {
    const email = event.target.value;

    if (!selectedUsers.includes(email)) {
      selectedUsers.push(email);
    } else {
      setSelectedUsers(
        selectedUsers.filter(selectedUserEmail => {
          return selectedUserEmail !== email;
        })
      );
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length < users.length) {
      setSelectedUsers(users.map(({ email }) => email));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectModel = event => {
    const name = event.target.value;

    if (!selectedModels.includes(name)) {
      selectedModels.push(name);
    } else {
      setSelectedModels(
        selectedModels.filter(selectedModelName => {
          return selectedModelName !== name;
        })
      );
    }
  };

  const handleSelectAllModels = () => {
    if (selectedModels.length < models.length) {
      setSelectedModels(models.map(({ name }) => name));
    } else {
      setSelectedModels([]);
    }
  };

  const handleSelectStudy = event => {
    const study_uid = event.target.value;

    if (!selectedStudies.includes(study_uid)) {
      selectedStudies.push(study_uid);
    } else {
      setSelectedStudies(
        selectedStudies.filter(selectedStudyUID => {
          return selectedStudyUID !== study_uid;
        })
      );
    }
  };

  const handleSelectAllStudies = () => {
    if (selectedStudies.length < studies.length) {
      setSelectedStudies(studies.map(({ study_uid }) => study_uid));
    } else {
      setSelectedStudies([]);
    }
  };

  if (localStorage.getItem('Investigator_Authenticated') && users && models) {
    return (
      <>
        {redirect ? <Redirect to="/view_groups" /> : <Fragment></Fragment>}
        <div className="content">
          <Form
            initialValues={{
              groupName: '',
            }}
            className="addGroup"
            onSubmit={handleSubmit}
            render={formRenderProps => (
              <form
                className="addGroup"
                style={{
                  maxWidth: 650,
                }}
                onSubmit={formRenderProps.onSubmit}
              >
                <fieldset className={'k-form-fieldset'}>
                  <legend
                    className={'k-form-legend'}
                    style={{ marginBottom: '15px', marginTop: '15px' }}
                  >
                    <b>Please fill in the fields:</b>
                  </legend>
                  <div className="mb-3">
                    <Field
                      className="addGroup_input"
                      name={'groupName'}
                      fieldType="text"
                      component={CustomInput}
                      value={formRenderProps.valueGetter('groupName')}
                      placeholder={'Group Name'}
                      validator={[requiredValidator]}
                    />
                  </div>

                  <div className="mb-3">
                    <legend
                      className={'k-form-legend'}
                      style={{
                        marginBottom: '5px',
                        marginTop: '5px',
                        fontSize: '14px',
                      }}
                    >
                      <b>Add investigators:</b>
                    </legend>
                    <div className="form-group">
                      <div className="responsive-table">
                        <table className="table">
                          <colgroup>
                            {mediumTableMetaUsers.map((field, i) => {
                              const size = field.size;
                              const percentWidth =
                                (size / totalSizeUsers) * 100.0;

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
                                meta={mediumTableMetaUsers}
                                values={filterValuesUsers}
                                onValueChange={handleUsersFilterChange}
                                sortFieldName={'first_name'}
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
                                    selectedUsers.length === users.length
                                  }
                                  onChange={handleSelectAllUsers}
                                />
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {!users.length && (
                              <tr
                                style={{
                                  backgroundColor: 'rgba(54, 156, 199, 0.9)',
                                }}
                                className="no-hover"
                              >
                                <td colSpan={mediumTableMetaUsers.length}>
                                  <div className="notFound">
                                    {'No matching results'}
                                  </div>
                                </td>
                              </tr>
                            )}
                            {users.map(({ email, first_name, last_name }) => {
                              return (
                                <tr
                                  style={{
                                    backgroundColor: 'rgba(54, 156, 199, 0.9)',
                                  }}
                                  key={email}
                                >
                                  <td className="text-center">{first_name}</td>
                                  <td className="text-center">{last_name}</td>
                                  <td className="text-center">{email}</td>
                                  <td
                                    style={{
                                      paddingLeft: '8px',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      value={email}
                                      checked={selectedUsers.includes(email)}
                                      onChange={handleSelectUser}
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
                          recordCount={users.length}
                        />

                        <div
                          className="message"
                          id="message1"
                          style={{ color: 'red' }}
                        ></div>
                      </div>
                    </div>
                  </div>

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
                          const percentWidth = (size / totalSizeModels) * 100.0;

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
                              checked={selectedModels.length === models.length}
                              onChange={handleSelectAllModels}
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
                                  checked={selectedModels.includes(name)}
                                  onChange={handleSelectModel}
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

                  <div className="mb-3">
                    <legend
                      className={'k-form-legend'}
                      style={{
                        marginBottom: '5px',
                        marginTop: '5px',
                        fontSize: '14px',
                      }}
                    >
                      <b>Group permissions:</b>
                    </legend>

                    {permissions.map((el, i) => (
                      <div className="form-group" key={i}>
                        <label>{el}</label>
                        <input
                          className="permissions"
                          name="permissions"
                          id="permissions"
                          type="checkbox"
                          onChange={e => {
                            handleChange(e, el);
                          }}
                        />
                      </div>
                    ))}

                    <div
                      className="message"
                      id="message3"
                      style={{ color: 'red' }}
                    ></div>
                  </div>
                </fieldset>
                <div className="k-form-buttons">
                  <button
                    type={'submit'}
                    className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                    disabled={!formRenderProps.allowSubmit}
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          />
        </div>
        <ToastContainer
          position="top-right"
          autoClose={8000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </>
    );
  } else if (
    localStorage.getItem('HealthProfessional_Authenticated') &&
    users &&
    studies
  ) {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={8000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="content">
          <Form
            initialValues={{
              groupName: '',
            }}
            className="addGroup"
            onSubmit={handleSubmit}
            render={formRenderProps => (
              <form
                className="addGroup"
                style={{
                  maxWidth: 650,
                }}
                onSubmit={formRenderProps.onSubmit}
              >
                <fieldset className={'k-form-fieldset'}>
                  <legend
                    className={'k-form-legend'}
                    style={{ marginBottom: '15px', marginTop: '15px' }}
                  >
                    <b>Please fill in the fields:</b>
                  </legend>
                  <div className="mb-3">
                    <Field
                      className="addGroup_input"
                      name={'groupName'}
                      fieldType="text"
                      component={CustomInput}
                      value={formRenderProps.valueGetter('groupName')}
                      placeholder={'Group Name'}
                      validator={[requiredValidator]}
                    />
                  </div>

                  <div className="mb-3">
                    <legend
                      className={'k-form-legend'}
                      style={{
                        marginBottom: '5px',
                        marginTop: '5px',
                        fontSize: '14px',
                      }}
                    >
                      <b>Add health professionals:</b>
                    </legend>
                    <div className="form-group">
                      <div className="responsive-table">
                        <table className="table">
                          <colgroup>
                            {mediumTableMetaUsers.map((field, i) => {
                              const size = field.size;
                              const percentWidth =
                                (size / totalSizeUsers) * 100.0;

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
                                meta={mediumTableMetaUsers}
                                values={filterValuesUsers}
                                onValueChange={handleUsersFilterChange}
                                sortFieldName={'first_name'}
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
                                    selectedUsers.length === users.length
                                  }
                                  onChange={handleSelectAllUsers}
                                />
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {!users.length && (
                              <tr
                                style={{ backgroundColor: '#FF8C00' }}
                                className="no-hover"
                              >
                                <td colSpan={mediumTableMetaUsers.length}>
                                  <div className="notFound">
                                    {'No matching results'}
                                  </div>
                                </td>
                              </tr>
                            )}
                            {users.map(({ email, first_name, last_name }) => {
                              return (
                                <tr
                                  style={{ backgroundColor: '#FF8C00' }}
                                  key={email}
                                >
                                  <td className="text-center">{first_name}</td>
                                  <td className="text-center">{last_name}</td>
                                  <td className="text-center">{email}</td>
                                  <td
                                    style={{
                                      paddingLeft: '8px',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      value={email}
                                      checked={selectedUsers.includes(email)}
                                      onChange={handleSelectUser}
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
                          recordCount={users.length}
                        />

                        <div
                          className="message"
                          id="message1"
                          style={{ color: 'red' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <legend
                      className={'k-form-legend'}
                      style={{
                        marginBottom: '5px',
                        marginTop: '5px',
                        fontSize: '14px',
                      }}
                    >
                      <b>Share studies:</b>
                    </legend>

                    <table className="table">
                      <colgroup>
                        {mediumTableMeta.map((field, i) => {
                          const size = field.size;
                          const percentWidth = (size / totalSize) * 100.0;

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
                            meta={mediumTableMeta}
                            values={filterValues}
                            onValueChange={handleFilterChange}
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
                                selectedStudies.length === studies.length
                              }
                              onChange={handleSelectAllStudies}
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="table-body">
                        {/* EMPTY */}
                        {!studies.length && (
                          <tr style={{ backgroundColor: '#5F9EA0' }}>
                            <td colSpan={mediumTableMeta.length}>
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
                                    checked={selectedStudies.includes(
                                      study_uid
                                    )}
                                    onChange={handleSelectStudy}
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

                  <div className="mb-3">
                    <legend
                      className={'k-form-legend'}
                      style={{
                        marginBottom: '5px',
                        marginTop: '5px',
                        fontSize: '14px',
                      }}
                    >
                      <b>Group permissions:</b>
                    </legend>

                    {permissions.map((el, i) => (
                      <div className="form-group" key={i}>
                        <label>{el}</label>
                        <input
                          className="permissions"
                          name="permissions"
                          id="permissions"
                          type="checkbox"
                          onChange={e => {
                            handleChange(e, el);
                          }}
                        />
                      </div>
                    ))}

                    <div
                      className="message"
                      id="message3"
                      style={{ color: 'red' }}
                    ></div>
                  </div>
                </fieldset>
                <div className="k-form-buttons">
                  <button
                    type={'submit'}
                    className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                    disabled={!formRenderProps.allowSubmit}
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          />
        </div>
        {redirect ? <Redirect to="/view_groups" /> : <Fragment></Fragment>}
      </>
    );
  } else {
    return null;
  }
}

NewGroup.propTypes = {
  user: PropTypes.object,
};

async function _getUsers(user, group, filters) {
  const config = {
    headers: {
      Authorization: `JWT ${localStorage.getItem('access')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  let url = `/api/group_details?group=${group}&user=${user.email}`;

  Object.keys(filters).forEach(field => {
    if (filters[field] !== null && filters[field] !== '') {
      let param = filters[field];
      url = url + `&${field}=${param}`;
    }
  });

  const res = await axiosInstance.get(url, config);

  if (res.data !== "You don't belong to this group!") {
    return res.data.Users;
  }
}

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
  null
)(NewGroup);
