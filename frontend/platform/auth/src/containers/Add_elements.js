/* eslint-disable react/prop-types */
import React, { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import axiosInstance from 'axios';
import axios from 'axios';
import { Form } from '@progress/kendo-react-form';
import 'react-toastify/dist/ReactToastify.css';
import { TableSearchFilter, TablePagination } from '@ohif/ui';
import { Redirect } from 'react-router-dom';
import { load_user } from '../actions/auth';
import './Add_group.css';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

function Add_elements(props) {
  const { user } = props;
  //console.log(props.location.state); //groupUsers

  let groupUsersEmails = [];
  props.location.state.forEach(function(user) {
    if (!groupUsersEmails.includes(user.email)) {
      groupUsersEmails.push(user.email);
    }
  });

  const [groupUsers] = useState(groupUsersEmails);
  const [redirect, setRedirect] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [filterValuesUsers, setFilterValuesUsers] = useState({
    user: '',
  });

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pageNumber, setPageNumber] = useState(0);

  // Called when relevant state/props are updated
  useEffect(() => {
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
          if (
            person.email !== mainUser &&
            !users.includes(userData) &&
            !groupUsersEmails.includes(person.email)
          ) {
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

      fetchUsers(group);
    } else if (user && localStorage.getItem('Investigator_Authenticated')) {
      group = 'investigators';

      fetchUsers(group);
    }
  }, [
    filterValuesUsers,
    groupUsers,
    groupUsersEmails,
    pageNumber,
    rowsPerPage,
    user,
  ]);

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

  const totalSizeUsers = mediumTableMetaUsers
    .map(field => field.size)
    .reduce((prev, next) => prev + next);

  function handleUsersFilterChange(fieldName, value) {
    setFilterValuesUsers(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  async function handleSubmit() {
    const name = props.match.params.name;
    if (selectedUsers.length == 0) {
      let text = document.getElementById('message1');
      text.textContent = 'At least one user must be selected!';
    } else {
      if (localStorage.getItem('HealthProfessional_Authenticated')) {
        try {
          const config = {
            headers: {
              Authorization: `JWT ${localStorage.getItem('access')}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          };
          let form_data = new FormData();
          form_data.append('groupName', name);
          form_data.append('users', JSON.stringify(selectedUsers));
          form_data.append('appUser', JSON.stringify(user['email']));
          const res = await axios.post(
            `/api/add_elements`,
            form_data,
            config
          );

          if (res.data.Status === true) {
            alert(
              JSON.stringify(selectedUsers) + ` were added to group ${name}!`
            );
            setRedirect(true);
          } else {
            alert("You don't belong to this group!");
          }
        } catch (err) {
          alert(err);
        }
      } else if (localStorage.getItem('Investigator_Authenticated')) {
        try {
          const config = {
            headers: {
              Authorization: `JWT ${localStorage.getItem('access')}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          };
          let form_data = new FormData();
          form_data.append('groupName', name);
          form_data.append('users', JSON.stringify(selectedUsers));
          form_data.append('appUser', JSON.stringify(user['email']));
          const res = await axios.post(
            `/api/add_elements`,
            form_data,
            config
          );

          if (res.data.Status === true) {
            alert(
              JSON.stringify(selectedUsers) + ` were added to group ${name}!`
            );
            setRedirect(true);
          } else {
            alert("You don't belong to this group!");
          }
        } catch (err) {
          alert(err);
        }
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

  if (localStorage.getItem('Investigator_Authenticated')) {
    return (
      <Fragment>
        <div className="content">
          <Form
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
                                  paddingLeft: '5px',
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
                                  <td>
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
                </fieldset>
                <div className="k-form-buttons">
                  <button
                    className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                    onClick={() => handleSubmit()}
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
          />
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
  } else if (localStorage.getItem('HealthProfessional_Authenticated')) {
    return (
      <Fragment>
        <div className="content">
          <Form
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
                                  paddingLeft: '5px',
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
                                  style={{
                                    backgroundColor: 'rgba(54, 156, 199, 0.9)',
                                  }}
                                  key={email}
                                >
                                  <td className="text-center">{first_name}</td>
                                  <td className="text-center">{last_name}</td>
                                  <td className="text-center">{email}</td>
                                  <td>
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
                </fieldset>
                <div className="k-form-buttons">
                  <button
                    className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                    onClick={() => handleSubmit()}
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
          />
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

Add_elements.propTypes = {
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

  if (filters['user'] !== null && filters['user'] !== '') {
    let param = filters['user'];
    url = url + `&filter=${param}`;
  }

  const res = await axiosInstance.get(url, config);

  if (res.data !== "You don't belong to this group!") {
    return res.data.Users;
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  { load_user }
)(Add_elements);
