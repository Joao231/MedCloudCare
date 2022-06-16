/* eslint-disable react/jsx-key */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, Fragment } from 'react';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const Group_details = ({ match, user }) => {
  const [formData, setFormData] = useState({
    seeDetails: true,
    badUser: false,
    userName: '',
    mainUser: '',
    groupName: match.params.name,
    appUser: match.params.userName,
  });

  const {
    seeDetails,
    badUser,
    userName,
    mainUser,
    groupName,
    appUser,
  } = formData;
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [userSpecificPerms, setUserSpecificPerms] = useState([]);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (user && seeDetails) {
      groupDetails();
      if (
        groupName !== 'health_professionals' &&
        groupName !== 'investigators'
      ) {
        userDetails();
      }
    }
  }, [user, seeDetails, groupDetails, userDetails]);

  const userDetails = async () => {
    try {
      const config = {
        headers: {
          Authorization: `JWT ${localStorage.getItem('access')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      const res = await axios.get(
        `/api/see_permissions?group=${groupName}&email=${
          user['email']
        }&user=${user['email']}`,
        config
      );

      if (res.data.Perms === "You don't belong to this group!") {
        alert("You don't belong to this group!");
      } else {
        setUserSpecificPerms(res.data.Perms);
      }
    } catch (err) {
      alert(err);
    }
  };

  const groupDetails = async () => {
    try {
      const config = {
        headers: {
          Authorization: `JWT ${localStorage.getItem('access')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      const res = await axios.get(
        `/api/group_details?group=${groupName}&user=${
          user['email']
        }`,
        config
      );

      if (res.data === "You don't belong to this group!") {
        setFormData({ ...formData, badUser: true });
      } else {
        if (
          groupName === 'health_professionals' ||
          groupName === 'investigators'
        ) {
          setUsers(res.data.Users);
          setFormData({ ...formData, seeDetails: false });
        }
        if (
          groupName !== 'health_professionals' &&
          groupName !== 'investigators' &&
          res.data.mainUser !== appUser
        ) {
          setUsers(res.data.Users);
          setPermissions(res.data.Permissions);
          setFormData({
            ...formData,
            seeDetails: false,
            mainUser: res.data.mainUser,
          });
        }
        if (
          groupName !== 'health_professionals' &&
          groupName !== 'investigators' &&
          res.data.mainUser === appUser
        ) {
          setUsers(res.data.Users);
          setPermissions(res.data.Permissions);
          setFormData({
            ...formData,
            seeDetails: false,
            mainUser: res.data.mainUser,
          });
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (badUser === true) {
    return null;
  }

  const refresh = () => {
    window.location.reload(false);
  };

  const deleteGroup = async groupName => {
    if (user['email'] === mainUser) {
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
        form_data.append('mainUser', mainUser);
        const res = await axios.post(
          `/api/remove_group`,
          form_data,
          config
        );
        if (res.data.Status === true) {
          alert(`Group ${groupName} was eliminated!`);
          setRedirect(true);
        } else {
          alert("You can't delete this group!");
        }
      } catch (err) {
        alert(err);
      }
    } else {
      alert("You can't delete this group!");
    }
  };

  const deleteRecord = async email => {
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
      form_data.append('users', JSON.stringify([email]));
      form_data.append('appUser', JSON.stringify(user['email']));
      const res = await axios.post(
        `/api/remove_elements`,
        form_data,
        config
      );

      if (res.data.Status === true) {
        alert(`User ${email} was/were eliminated!`);
        refresh();
      } else {
        toast.error(`You don't belong to this group!`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (err) {
      alert(err);
    }
  };

  const add = () => (
    <div
      className="btn-toolbar"
      role="toolbar"
      aria-label="Toolbar with button groups"
      style={{
        display: 'inline-block',
        float: 'right',
        marginTop: '-10px',
      }}
    >
      <div className="btn-group btn-group-sm" role="group">
        <button
          type="button"
          className="btn btn-outline-primary"
          style={{
            borderRadius: '4px',
            backgroundColor: 'white',
          }}
        >
          {localStorage.getItem('Investigator_Authenticated') ? (
            <Link
              className="nav-link"
              to={{ pathname: '/add_models/' + groupName, state: groupName }}
            >
              Add/Remove models
            </Link>
          ) : localStorage.getItem('HealthProfessional_Authenticated') ? (
            <Link
              className="nav-link"
              to={{
                pathname: '/add_remove_studies/' + groupName,
                state: groupName,
              }}
            >
              Add/Remove studies
            </Link>
          ) : null}
        </button>
        <button
          type="button"
          className="btn btn-outline-primary"
          style={{
            borderRadius: '4px',
            backgroundColor: 'white',
            marginRight: '15px',
          }}
        >
          <Link
            className="nav-link"
            to={{ pathname: '/add_elements/' + groupName, state: users }}
          >
            Add users
          </Link>
        </button>

        <button
          type="button"
          className="btn btn-outline-primary"
          style={{
            borderRadius: '4px',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingRight: '10px',
            paddingLeft: '10px',
            borderColor: '#708090',
          }}
          onClick={() => removeGroup(groupName)}
        >
          Remove Group{' '}
        </button>
      </div>
    </div>
  );

  if (userName) {
    const url = '/see_permissions/' + groupName + '/' + userName;
    return <Redirect to={url} />;
  }

  const Msg = ({ closeToast, email }) => (
    <Fragment>
      <div
        style={{
          fontSize: '14px',
          fontFamily: 'Helvetica',
        }}
      >
        Are you sure you want to remove user <b>{email}</b> from group{' '}
        <b>{groupName}</b>?
      </div>
      <div>
        <button
          style={{
            fontSize: '14px',
            fontFamily: 'Helvetica',
            display: 'inline-block',
            marginTop: '10px',
            margin: '7px',
            background: '#FFD700',
            borderRadius: '6px',
            padding: '8px 16px',
          }}
          onClick={() => deleteRecord(email)}
        >
          Yes
        </button>
        <button
          style={{
            fontSize: '14px',
            fontFamily: 'Helvetica',
            display: 'inline-block',
            marginTop: '10px',
            margin: '7px' /* space between buttons */,
            background: '#FFD700' /* background color */,
            borderRadius: '6px' /* rounded corners */,
            padding: '8px 16px' /* space around text */,
          }}
          onClick={closeToast}
        >
          No
        </button>
      </div>
    </Fragment>
  );

  const Msg2 = ({ closeToast, group }) => (
    <Fragment>
      <div
        style={{
          fontSize: '14px',
          fontFamily: 'Helvetica',
        }}
      >
        Are you sure you want to remove group <b>{group}</b>?
      </div>
      <div>
        <button
          style={{
            fontSize: '14px',
            fontFamily: 'Helvetica',
            display: 'inline-block',
            marginTop: '10px',
            margin: '7px' /* space between buttons */,
            background: '#FFD700' /* background color */,
            borderRadius: '6px' /* rounded corners */,
            padding: '8px 16px' /* space around text */,
          }}
          onClick={() => deleteGroup(group)}
        >
          Yes
        </button>
        <button
          style={{
            fontSize: '14px',
            fontFamily: 'Helvetica',
            display: 'inline-block',
            marginTop: '10px',
            margin: '7px' /* space between buttons */,
            background: '#FFD700' /* background color */,
            borderRadius: '6px' /* rounded corners */,
            padding: '8px 16px' /* space around text */,
          }}
          onClick={closeToast}
        >
          No
        </button>
      </div>
    </Fragment>
  );

  const removeGroup = groupName => {
    toast.warn(<Msg2 group={groupName} />, {
      position: 'top-right',
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const remove = user => {
    toast.warn(<Msg email={user} />, {
      position: 'top-right',
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <div className="container mt-5">
      {redirect ? <Redirect to={`/view_groups`} /> : <Fragment></Fragment>}
      <div>
        <h1 style={{ display: 'inline-block', marginTop: '-12px' }}>
          <span style={{ fontFamily: 'Georgia', color: '#708090' }}>
            Details of Group:{' '}
          </span>
          <span style={{ fontFamily: 'Georgia' }}>{groupName} </span>
        </h1>
        {groupName !== 'health_professionals' &&
        groupName !== 'investigators' &&
        mainUser === appUser
          ? add()
          : null}
      </div>
      <hr></hr>
      {groupName !== 'health_professionals' &&
      groupName !== 'investigators' &&
      mainUser === appUser ? (
        <div>
          <br></br>
          <h5
            style={{
              fontFamily: 'Georgia',
              display: 'inline-block',
              color: 'dodgerblue',
            }}
          >
            Group Permissions:
          </h5>

          {permissions &&
            permissions.map((permission, key) => {
              return (
                <b
                  style={{
                    display: 'inline-block',
                    marginLeft: '10px',
                  }}
                  key={key}
                >
                  {permission.name}
                  {permissions.length > 1 && key !== permissions.length - 1
                    ? ','
                    : '.'}
                </b>
              );
            })}
        </div>
      ) : groupName !== 'health_professionals' &&
        groupName !== 'investigators' &&
        mainUser !== appUser ? (
        <div>
          <br></br>
          <h5
            style={{
              fontFamily: 'Georgia',
              display: 'inline-block',
              color: 'dodgerblue',
            }}
          >
            User Permissions:
          </h5>

          {userSpecificPerms &&
            userSpecificPerms.map((permission, key) => {
              return (
                <>
                  <b
                    style={{
                      display: 'inline-block',
                      marginLeft: '10px',
                    }}
                    key={key}
                  >
                    {permission.name}{' '}
                  </b>{' '}
                  {permission.givenByGroup
                    ? '(Group Permission)'
                    : '(Individual Permission)'}
                  {userSpecificPerms.length > 1 &&
                  key !== userSpecificPerms.length - 1
                    ? ','
                    : '.'}
                </>
              );
            })}
        </div>
      ) : null}
      <br></br>
      {localStorage.getItem('Investigator_Authenticated') ? (
        <Link to={'/view_models/' + groupName}>Models shared</Link>
      ) : (
        <Link to={'/view_studies/' + groupName}>Studies shared</Link>
      )}

      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{
          marginTop: '210px',
          alignItems: 'center',
          margin: '20px 60px',
        }}
      >
        <div>
          <h3 style={{ fontFamily: 'Georgia', textAlign: 'center' }}>Users:</h3>
          <br></br>

          <table className="table table-responsive">
            <thead className="table-head">
              <tr className="filters">
                <th style={{ textAlign: 'center' }}>
                  <label>{'Name'}</label>
                </th>
                <th style={{ textAlign: 'center' }}>
                  <label>{'Email'}</label>
                </th>
                {groupName !== 'health_professionals' &&
                groupName !== 'investigators' ? (
                  <>
                    <th style={{ textAlign: 'center' }}>
                      <label>{'Main User'}</label>
                    </th>
                    {mainUser === appUser && users.length > 1 ? (
                      <th style={{ textAlign: 'center' }}>
                        <label>{'Manage'}</label>
                      </th>
                    ) : null}
                  </>
                ) : null}
              </tr>
            </thead>
            {users &&
              users.map(userr => {
                return (mainUser || userr.email === appUser) &&
                  (groupName !== 'health_professionals' &&
                    groupName !== 'investigators') ? (
                  <tbody style={{ textAlign: 'center' }}>
                    {userr.email === mainUser ? (
                      <tr
                        style={{
                          fontFamily: 'Georgia',
                          backgroundColor: '#708090',
                        }}
                      >
                        <td className="title">
                          {userr.first_name} {userr.last_name}
                        </td>
                        <td>{mainUser}</td>
                        <td>Yes</td>
                      </tr>
                    ) : (
                      <tr
                        style={{
                          fontFamily: 'Georgia',
                          backgroundColor: '#708090',
                        }}
                      >
                        <td className="title">
                          {userr.first_name} {userr.last_name}
                        </td>

                        <td>{userr.email}</td>

                        <td>No</td>
                        {mainUser === appUser ? (
                          <td style={{ backgroundColor: 'white' }}>
                            <nav
                              className="navbar navbar-expand-lg navbar-light"
                              style={{
                                backgroundColor: '#ffffff',
                                marginTop: '-35px',
                              }}
                            >
                              <li className="nav-item">
                                <button
                                  style={{
                                    marginTop: '15px',
                                    marginRight: '5px',
                                  }}
                                  onClick={() => remove(userr.email)}
                                >
                                  Remove from group
                                </button>
                              </li>

                              <li className="nav-item">
                                <Link
                                  className="nav-link"
                                  to={
                                    '/add_permissions/' +
                                    groupName +
                                    '/' +
                                    userr.email
                                  }
                                >
                                  Add permissions
                                </Link>
                              </li>
                              <li className="nav-item">
                                <Link
                                  className="nav-link"
                                  to={
                                    '/remove_permissions/' +
                                    groupName +
                                    '/' +
                                    userr.email
                                  }
                                >
                                  Remove permissions{' '}
                                </Link>
                              </li>
                            </nav>
                          </td>
                        ) : null}
                      </tr>
                    )}
                  </tbody>
                ) : (
                  <tbody>
                    <tr
                      style={{
                        fontFamily: 'Georgia',
                        backgroundColor: '#708090',
                      }}
                    >
                      <td className="title">
                        {userr.first_name} {userr.last_name}
                      </td>
                      <td>{userr.email}</td>
                    </tr>
                  </tbody>
                );
              })}
            ;
          </table>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  null
)(Group_details);
