/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const View_groups = ({ user }) => {
  const [formData, setFormData] = useState({
    seeGroups: true,
    groupName: '',
  });

  const [groups, setGroups] = useState([]);

  const { groupName } = formData;

  useEffect(() => {
    viewGroups();
  }, [user, viewGroups]);

  const viewGroups = async () => {
    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem('access')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const res = await axios.get(
      `/api/check_user_groups?email=${user.email}`,
      config
    );
    setGroups(res.data.Groups);
    setFormData({ ...formData, seeGroups: false });
  };

  const groupDetails = name => {
    setFormData({ ...formData, groupName: name });
  };

  if (groupName) {
    const url = '/group_details/' + groupName + '/' + user['email'];
    return <Redirect to={url} />;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex flex-column justify-content-center align-items-center">
        <h1>{user.email}'s Groups</h1>
        <br></br>
        <Link title="Create New Group" className="nav-link" to="/add_group">
          Add Group
        </Link>
        <br></br>
        {groups &&
          groups.map((group, index) => {
            return (
              <div
                key={index}
                style={{ alignItems: 'center', margin: '20px 40px' }}
              >
                <button
                  className="btn btn-primary"
                  title="View Group Details"
                  onClick={() => groupDetails(group.name)}
                >
                  {group.name}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  null
)(View_groups);
