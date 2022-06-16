/* eslint-disable no-console */
import React from 'react';
import axios from 'axios';

import {
  UPDATE_TOKEN,
  INVESTIGATOR_LOGIN,
  HEALTHPROFESSIONAL_LOGIN,
  SUPERUSER_LOGIN_SUCCESS,
  SUPERUSER_LOGIN_FAIL,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  USER_LOADED_SUCCESS,
  USER_LOADED_FAIL,
  SUPERUSER_AUTHENTICATED_SUCCESS,
  SUPERUSER_AUTHENTICATED_FAIL,
  AUTHENTICATED_SUCCESS,
  AUTHENTICATED_FAIL,
  PASSWORD_RESET_SUCCESS,
  PASSWORD_RESET_FAIL,
  PASSWORD_RESET_CONFIRM_SUCCESS,
  PASSWORD_RESET_CONFIRM_FAIL,
  SIGNUP_SUCCESS,
  SIGNUP_FAIL,
  ACTIVATION_SUCCESS,
  ACTIVATION_FAIL,
  GOOGLE_AUTH_SUCCESS,
  GOOGLE_AUTH_FAIL,
  FACEBOOK_AUTH_SUCCESS,
  FACEBOOK_AUTH_FAIL,
  GITHUB_AUTH_SUCCESS,
  GITHUB_AUTH_FAIL,
  LINKEDIN_AUTH_SUCCESS,
  LINKEDIN_AUTH_FAIL,
  SPOTIFY_AUTH_SUCCESS,
  SPOTIFY_AUTH_FAIL,
  USER_LOADED_APPS_SUCCESS,
  USER_LOADED_APPS_FAIL,
  LOGOUT,
} from './types';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const csrftoken = Cookies.get('csrftoken');

export const load_user = () => async dispatch => {
  if (localStorage.getItem('access')) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('access')}`,
        Accept: 'application/json',
      },
    };
    try {
      const res = await axios.get(
        `/auth/users/me/`,
        config
      );
      dispatch({
        type: USER_LOADED_SUCCESS,
        payload: res.data,
      });
    } catch (err) {
      dispatch({
        type: USER_LOADED_FAIL,
      });
    }
  } else {
    dispatch({
      type: USER_LOADED_FAIL,
    });
  }
};

export const updateToken = () => async dispatch => {
  if (localStorage.getItem('access') && localStorage.getItem('refresh')) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    const body = JSON.stringify({ refresh: localStorage.getItem('refresh') });

    try {
      const res = await axios.post(
        `/auth/jwt/refresh/`,
        body,
        config
      );

      if (res.status === 200) {
        dispatch({
          type: UPDATE_TOKEN,
          payload: res.data,
        });
      } else {
        dispatch(logout());
      }
    } catch (err) {
      console.log(err);
    }
  }
};

export const load_user_apps = email => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${localStorage.getItem('access')}`,
    },
  };
  if (localStorage.getItem('access')) {
    dispatch({
      type: USER_LOADED_APPS_SUCCESS,
    });
    try {
      const res = await axios.get(
        `/api/check_main_group?email=${email}`,
        config
      );
      if (res.data.Group == 'investigators') {
        try {
          console.log('Sou investigator');
          dispatch(loginInvestigator());
          dispatch(load_user());
        } catch (err) {
          console.log(err);
        }
      } else {
        try {
          console.log('Sou médico');
          dispatch(loginHealthProfessional());
          dispatch(load_user());
        } catch (err) {
          console.log(err.message);
        }
      }

      try {
        const options = {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            HTTP_X_CSRFTOKEN: csrftoken,
          },
        };

        await axios.post(
          `/api/set_social_apps/${email}`,
          options
        );
      } catch (err) {
        console.log(err.message);
      }
    } catch (err) {
      console.log(err.message);
    }
  } else {
    dispatch({
      type: USER_LOADED_APPS_FAIL,
    });
  }
};

export const googleAuthenticate = (state, code) => async dispatch => {
  if (state && code && !localStorage.getItem('access')) {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const details = {
      state: state,
      code: code,
    };

    const formBody = Object.keys(details)
      .map(
        key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key])
      )
      .join('&');

    try {
      const res = await axios.post(
        `/auth/o/google-oauth2/?${formBody}`,
        config
      );

      dispatch({
        type: GOOGLE_AUTH_SUCCESS,
        payload: res.data,
      });

      dispatch(load_user());
    } catch (err) {
      dispatch({
        type: GOOGLE_AUTH_FAIL,
      });
    }
  }
};

export const facebookAuthenticate = (state, code) => async dispatch => {
  if (state && code && !localStorage.getItem('access')) {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const details = {
      state: state,
      code: code,
    };

    const formBody = Object.keys(details)
      .map(
        key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key])
      )
      .join('&');

    try {
      const res = await axios.post(
        `/auth/o/facebook/?${formBody}`,
        config
      );

      dispatch({
        type: FACEBOOK_AUTH_SUCCESS,
        payload: res.data,
      });

      dispatch(load_user());
    } catch (err) {
      dispatch({
        type: FACEBOOK_AUTH_FAIL,
      });
    }
  }
};

export const githubAuthenticate = (state, code) => async dispatch => {
  if (state && code && !localStorage.getItem('access')) {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const details = {
      state: state,
      code: code,
    };

    const formBody = Object.keys(details)
      .map(
        key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key])
      )
      .join('&');

    try {
      const res = await axios.post(
        `/auth/o/github/?${formBody}`,
        config
      );

      dispatch({
        type: GITHUB_AUTH_SUCCESS,
        payload: res.data,
      });

      dispatch(load_user());
    } catch (err) {
      dispatch({
        type: GITHUB_AUTH_FAIL,
      });
    }
  }
};

export const linkedinAuthenticate = (state, code) => async dispatch => {
  if (state && code && !localStorage.getItem('access')) {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const details = {
      state: state,
      code: code,
    };

    const formBody = Object.keys(details)
      .map(
        key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key])
      )
      .join('&');

    try {
      const res = await axios.post(
        `/auth/o/linkedin-oauth2/?${formBody}`,
        config
      );
      dispatch({
        type: LINKEDIN_AUTH_SUCCESS,
        payload: res.data,
      });

      dispatch(load_user());
    } catch (err) {
      dispatch({
        type: LINKEDIN_AUTH_FAIL,
      });
    }
  }
};

export const spotifyAuthenticate = (state, code) => async dispatch => {
  if (state && code && !localStorage.getItem('access')) {
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const details = {
      state: state,
      code: code,
    };

    const formBody = Object.keys(details)
      .map(
        key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key])
      )
      .join('&');

    try {
      const res = await axios.post(
        `/auth/o/spotify/?${formBody}`,
        config
      );

      dispatch({
        type: SPOTIFY_AUTH_SUCCESS,
        payload: res.data,
      });

      dispatch(load_user());
    } catch (err) {
      dispatch({
        type: SPOTIFY_AUTH_FAIL,
      });
    }
  }
};

export const checkAuthenticated = () => async dispatch => {
  if (
    localStorage.getItem('access') &&
    localStorage.getItem('Authenticated') &&
    localStorage.getItem('Investigator_Authenticated')
  ) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const body = JSON.stringify({ token: localStorage.getItem('access') });

    try {
      const res = await axios.post(
        `/auth/jwt/verify/`,
        body,
        config
      );

      if (res.data.code !== 'token_not_valid') {
        dispatch({
          type: AUTHENTICATED_SUCCESS,
        });
        dispatch(loginInvestigator());
      } else {
        dispatch({
          type: AUTHENTICATED_FAIL,
        });
      }
    } catch (err) {
      dispatch({
        type: AUTHENTICATED_FAIL,
      });
    }
  } else if (
    localStorage.getItem('access') &&
    localStorage.getItem('Authenticated') &&
    localStorage.getItem('HealthProfessional_Authenticated')
  ) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const body = JSON.stringify({ token: localStorage.getItem('access') });

    try {
      const res = await axios.post(
        `/auth/jwt/verify/`,
        body,
        config
      );

      if (res.data.code !== 'token_not_valid') {
        dispatch({
          type: AUTHENTICATED_SUCCESS,
        });
        dispatch(loginHealthProfessional());
      } else {
        dispatch({
          type: AUTHENTICATED_FAIL,
        });
      }
    } catch (err) {
      dispatch({
        type: AUTHENTICATED_FAIL,
      });
    }
  } else {
    dispatch({
      type: AUTHENTICATED_FAIL,
    });
  }
};

export const checkAuthenticated_Superuser = () => async dispatch => {
  if (
    localStorage.getItem('access') &&
    localStorage.getItem('Superuser_Authenticated')
  ) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const body = JSON.stringify({ token: localStorage.getItem('access') });

    try {
      const res = await axios.post(
        `/auth/jwt/verify/`,
        body,
        config
      );

      if (res.data.code !== 'token_not_valid') {
        dispatch({
          type: SUPERUSER_AUTHENTICATED_SUCCESS,
        });
      } else {
        dispatch({
          type: SUPERUSER_AUTHENTICATED_FAIL,
        });
      }
    } catch (err) {
      dispatch({
        type: SUPERUSER_AUTHENTICATED_FAIL,
      });
    }
  } else {
    dispatch({
      type: SUPERUSER_AUTHENTICATED_FAIL,
    });
  }
};

export const loginSuperuser = (email, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const body = JSON.stringify({ email, password });

  try {
    const res = await axios.post(
      `/auth/jwt/create/`,
      body,
      config
    );
    dispatch({
      type: SUPERUSER_LOGIN_SUCCESS,
      payload: res.data,
    });
    dispatch(load_user());
  } catch (err) {
    dispatch({
      type: SUPERUSER_LOGIN_FAIL,
    });
    toast.error('Incorrect password! Please, try again.', {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    return (
      <ToastContainer
        position="top-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    );
  }
};

export const loginInvestigator = () => dispatch => {
  dispatch({
    type: INVESTIGATOR_LOGIN,
  });
};

export const loginHealthProfessional = () => dispatch => {
  dispatch({
    type: HEALTHPROFESSIONAL_LOGIN,
  });
};

export const login = (email, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const body = JSON.stringify({ email, password });

  try {
    const res = await axios.get(
      `/api/check_main_group_login/${email}`,
      config
    );
    console.log('Pertenço ao grupo dos', res.data.Group);
    if (res.data.Group == 'investigators') {
      try {
        const res = await axios.post(
          `/auth/jwt/create/`,
          body,
          config
        );
        dispatch(loginInvestigator());
        dispatch({
          type: LOGIN_SUCCESS,
          payload: res.data,
        });
        dispatch(load_user());
      } catch (err) {
        dispatch({
          type: LOGIN_FAIL,
        });
        toast.error('Incorrect password! Please, try again.', {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        return (
          <ToastContainer
            position="top-right"
            autoClose={10000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        );
      }
    } else {
      try {
        const res = await axios.post(
          `/auth/jwt/create/`,
          body,
          config
        );
        dispatch({
          type: LOGIN_SUCCESS,
          payload: res.data,
        });
        dispatch(loginHealthProfessional());
        dispatch(load_user());
      } catch (err) {
        dispatch({
          type: LOGIN_FAIL,
        });
        toast.error('Incorrect password! Please, try again.', {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        return (
          <ToastContainer
            position="top-right"
            autoClose={10000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        );
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

export const signup = (
  first_name,
  last_name,
  email,
  password,
  re_password,
  profession,
  medical_certificate
) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  let form_data = new FormData();
  form_data.append('first_name', first_name);
  form_data.append('last_name', last_name);
  form_data.append('email', email);
  form_data.append('password', password);
  form_data.append('re_password', re_password);
  form_data.append('profession', profession);

  if (profession === 'Health Professional') {
    form_data.append(
      'medical_certificate',
      medical_certificate,
      medical_certificate.name
    );
  }
  try {
    const res = await axios.post(
      `/auth/users/`,
      form_data,
      config
    );
    console.log('Post to Djoser users status:', res.status);
    if (res.status === 201) {
      const requestOptions = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          HTTP_X_CSRFTOKEN: csrftoken,
        },
        body: JSON.stringify({
          email: email,
          profession: profession,
        }),
      };

      const options = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          HTTP_X_CSRFTOKEN: csrftoken,
        },
      };

      try {
        await axios.post(
          `/api/add_main_group`,
          requestOptions
        );
      } catch (err) {
        alert(err.message);
      }

      try {
        await axios.post(
          `/api/encrypt_db/${email}`,
          options
        );
      } catch (err) {
        alert(err.message);
      }

      dispatch({
        type: SIGNUP_SUCCESS,
        payload: res.data,
      });

      toast.success(
        'An account verification email was sent to ' +
          email +
          '. Please, check it!',
        {
          position: 'top-right',
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );

      return (
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
      );
    } else {
      dispatch({
        type: SIGNUP_FAIL,
      });

      toast.error('Failed to create an account with the email ' + email + '.', {
        position: 'top-right',
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      return (
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
      );
    }
  } catch (err) {
    alert(err);
    dispatch({
      type: SIGNUP_FAIL,
    });
    toast.error('Failed to create an account with the email ' + email + '.', {
      position: 'top-right',
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    return (
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
    );
  }
};

export const verify = (uid, token) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const body = JSON.stringify({ uid, token });

  try {
    await axios.post(
      `/auth/users/activation/`,
      body,
      config
    );

    dispatch({
      type: ACTIVATION_SUCCESS,
    });
  } catch (err) {
    dispatch({
      type: ACTIVATION_FAIL,
    });
  }
};

export const reset_password = email => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const body = JSON.stringify({ email });

  try {
    await axios.post(
      `/auth/users/reset_password/`,
      body,
      config
    );
    dispatch({
      type: PASSWORD_RESET_SUCCESS,
    });
  } catch (err) {
    dispatch({
      type: PASSWORD_RESET_FAIL,
    });
  }
};

export const reset_password_confirm = (
  uid,
  token,
  new_password,
  re_new_password
) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const body = JSON.stringify({ uid, token, new_password, re_new_password });

  try {
    await axios.post(
      `/auth/users/reset_password_confirm/`,
      body,
      config
    );
    dispatch({
      type: PASSWORD_RESET_CONFIRM_SUCCESS,
    });
  } catch (err) {
    dispatch({
      type: PASSWORD_RESET_CONFIRM_FAIL,
    });
  }
};

export const logout = () => dispatch => {
  dispatch({
    type: LOGOUT,
  });
};
