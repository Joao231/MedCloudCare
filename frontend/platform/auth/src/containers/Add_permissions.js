/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const Add_permissions = ({ match, user }) => {
  const [formData, setFormData] = useState({
    seeDetails: true,
    badUser: false,
    userName: '',
    name: match.params.name,
    userEmail: match.params.user,
  });

  const { seeDetails, badUser, name, userEmail } = formData;
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    if (user && seeDetails) {
      userDetails(name, userEmail);
    }
  }, [seeDetails, user, userDetails]);

  async function handleSubmit() {
    if (selectedPermissions.length == 0) {
      let text = document.getElementById('message1');
      text.textContent = 'At least one permission must be selected!';
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
        form_data.append('groupName', name);
        form_data.append('user', userEmail);
        form_data.append('permissions', JSON.stringify(selectedPermissions));
        form_data.append('appUser', JSON.stringify(user['email']));
        const res = await axios.post(
          `/api/add_permissions`,
          form_data,
          config
        );
        if (res.data.Status === true) {
          window.location.reload(false);
          alert(userEmail + ' has now more permissions!');
        } else {
          alert("You don't belong to this group!");
        }
      } catch (err) {
        alert(err);
      }
    }
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
      console.log(selectedPermissions);
    }
  }

  const userDetails = async (name, userEmail) => {
    try {
      const config = {
        headers: {
          Authorization: `JWT ${localStorage.getItem('access')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };
      console.log(user['email']);
      const res = await axios.get(
        `/api/see_permissions?group=${name}&email=${userEmail}&user=${
          user['email']
        }`,
        config
      );

      console.log(res.data.Perms);
      if (res.data.Perms === "You don't belong to this group!") {
        setFormData({ ...formData, badUser: true });
      } else {
        setPermissions(res.data.Perms);
      }
    } catch (err) {
      console.log(err);
    }
  };

  if (badUser === true) {
    return null;
  }

  if (localStorage.getItem('Investigator_Authenticated')) {
    let namePermissions = [];
    permissions.forEach(permission => {
      namePermissions.push(permission['name']);
    });

    let availablePerms = ['Test Models', 'Edit Models'];
    return (
      <div className="container">
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ marginTop: '20px' }}
        >
          <h2 style={{ fontFamily: 'Georgia', color: 'dodgerblue' }}>
            User Permissions:
          </h2>
          {userEmail &&
            permissions &&
            permissions.map((permission, i) => {
              return (
                <div
                  key={i}
                  style={{ alignItems: 'center', margin: '10px 40px' }}
                >
                  <p>
                    <b>{permission['name']} </b>
                    {permission['givenByGroup'] ? '(Group permission)' : null}
                  </p>
                </div>
              );
            })}
          <div className="container mt-5">
            <h1 style={{ fontFamily: 'Georgia', color: 'dodgerblue ' }}>
              Add permission/s to user: <i>{userEmail}</i>
            </h1>
            <hr></hr>
            <div>
              {userEmail &&
                availablePerms.map((perm, i) => {
                  return !namePermissions.includes(perm) ? (
                    <div className="form-group" key={i}>
                      <label>{perm}</label>
                      <input
                        className="permissions"
                        name="permissions"
                        id="permissions"
                        type="checkbox"
                        onChange={e => {
                          handleChange(e, perm);
                        }}
                      />
                    </div>
                  ) : null;
                })}
              <div
                className="message"
                id="message1"
                style={{ color: 'red' }}
              ></div>
            </div>

            <br></br>
            <button onClick={() => handleSubmit()}>Add</button>
          </div>
        </div>
      </div>
    );
  } else if (localStorage.getItem('HealthProfessional_Authenticated')) {
    let namePermissions = [];
    permissions.forEach(permission => {
      namePermissions.push(permission['name']);
    });

    let availablePerms = ['View Studies Metadata', 'Edit Studies'];
    return (
      <div className="container">
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ marginTop: '20px' }}
        >
          <h2 style={{ fontFamily: 'Georgia', color: 'dodgerblue ' }}>
            User Permissions:
          </h2>
          {userEmail &&
            permissions &&
            permissions.map((permission, i) => {
              return (
                <div
                  key={i}
                  style={{ alignItems: 'center', margin: '10px 40px' }}
                >
                  <p>
                    <b>{permission['name']} </b>
                    {permission['givenByGroup'] ? '(Group permission)' : null}
                  </p>
                </div>
              );
            })}
          <div className="container mt-5">
            <h1 style={{ fontFamily: 'Georgia', color: 'dodgerblue ' }}>
              Add permission/s to user: <i>{userEmail}</i>
            </h1>
            <hr></hr>
            <div>
              {userEmail &&
                availablePerms.map((perm, i) => {
                  return !namePermissions.includes(perm) ? (
                    <div className="form-group" key={i}>
                      <label>{perm}</label>
                      <input
                        className="permissions"
                        name="permissions"
                        id="permissions"
                        type="checkbox"
                        onChange={e => {
                          handleChange(e, perm);
                        }}
                      />
                    </div>
                  ) : null;
                })}
              <div
                className="message"
                id="message1"
                style={{ color: 'red' }}
              ></div>
            </div>

            <br></br>
            <button onClick={() => handleSubmit()}>Add</button>
          </div>
        </div>
      </div>
    );
  } else {
    return null;
  }
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  {}
)(Add_permissions);
