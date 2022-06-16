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
} from '../actions/types';

const initialState = {
  access: localStorage.getItem('access'),
  refresh: localStorage.getItem('refresh'),
  superuser_authenticated: localStorage.getItem('Superuser_Authenticated'),
  isSuperuserAuthenticated: null,
  authenticated: localStorage.getItem('Authenticated'),
  isAuthenticated: null,
  investigator_authenticated: localStorage.getItem(
    'Investigator_Authenticated'
  ),
  isInvestigatorAuthenticated: null,
  healthProfessional_authenticated: localStorage.getItem(
    'HealthProfessional_Authenticated'
  ),
  isHealthProfessionalAuthenticated: null,
  user: null,
};

export default function reduce(state = initialState, action) {
  const { type, payload } = action;

  const investigator_authenticated = true;
  const healthProfessional_authenticated = true;
  const authenticated = true;
  const superuser_authenticated = true;

  switch (type) {
    case UPDATE_TOKEN:
      localStorage.setItem('access', payload.access);
      localStorage.setItem('refresh', payload.refresh);
      return {
        ...state,
        access: payload.access,
        refresh: payload.refresh,
      };

    case INVESTIGATOR_LOGIN:
      localStorage.setItem(
        'Investigator_Authenticated',
        investigator_authenticated
      );
      return {
        ...state,
        isInvestigatorAuthenticated: true,
        isAuthenticated: true,
      };
    case HEALTHPROFESSIONAL_LOGIN:
      localStorage.setItem(
        'HealthProfessional_Authenticated',
        healthProfessional_authenticated
      );
      return {
        ...state,
        isHealthProfessionalAuthenticated: true,
        isAuthenticated: true,
      };
    case SUPERUSER_AUTHENTICATED_SUCCESS:
      return {
        ...state,
        isSuperuserAuthenticated: true,
        isAuthenticated: true,
      };
    case AUTHENTICATED_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
      };
    case SUPERUSER_LOGIN_SUCCESS:
      localStorage.setItem('access', payload.access);
      localStorage.setItem('refresh', payload.refresh);
      localStorage.setItem('Superuser_Authenticated', superuser_authenticated);
      return {
        ...state,
        isSuperuserAuthenticated: true,
        access: payload.access,
        refresh: payload.refresh,
      };
    case LOGIN_SUCCESS:
      localStorage.setItem('access', payload.access);
      localStorage.setItem('refresh', payload.refresh);
      localStorage.setItem('Authenticated', authenticated);
      return {
        ...state,
        isAuthenticated: true,
        access: payload.access,
        refresh: payload.refresh,
      };
    case GOOGLE_AUTH_SUCCESS:
    case FACEBOOK_AUTH_SUCCESS:
    case GITHUB_AUTH_SUCCESS:
    case LINKEDIN_AUTH_SUCCESS:
    case SPOTIFY_AUTH_SUCCESS:
      localStorage.setItem('access', payload.access);
      localStorage.setItem('refresh', payload.refresh);
      return {
        ...state,
        isAuthenticated: false,
        access: payload.access,
        refresh: payload.refresh,
      };
    case SIGNUP_SUCCESS:
      return {
        ...state,
        isAuthenticated: false,
      };
    case USER_LOADED_SUCCESS:
      return {
        ...state,
        user: payload,
      };
    case USER_LOADED_APPS_SUCCESS:
      localStorage.setItem('Authenticated', authenticated);
      return {
        ...state,
        isAuthenticated: true,
      };
    case SUPERUSER_AUTHENTICATED_FAIL:
      return {
        ...state,
        isSuperuserAuthenticated: false,
      };
    case USER_LOADED_APPS_FAIL:
    case AUTHENTICATED_FAIL:
      return {
        ...state,
        isAuthenticated: false,
      };
    case USER_LOADED_FAIL:
      return {
        ...state,
        user: null,
      };
    case SUPERUSER_LOGIN_FAIL:
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('Superuser_Authenticated');
      return {
        ...state,
        access: null,
        refresh: null,
        isSuperuserAuthenticated: false,
        user: null,
      };
    case LOGIN_FAIL:
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('Authenticated');
      return {
        ...state,
        access: null,
        refresh: null,
        isAuthenticated: false,
        user: null,
      };
    case GOOGLE_AUTH_FAIL:
    case FACEBOOK_AUTH_FAIL:
    case GITHUB_AUTH_FAIL:
    case LINKEDIN_AUTH_FAIL:
    case SPOTIFY_AUTH_FAIL:
    case SIGNUP_FAIL:
    case LOGOUT:
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('Authenticated');
      localStorage.removeItem('Superuser_Authenticated');
      localStorage.removeItem('Investigator_Authenticated');
      localStorage.removeItem('HealthProfessional_Authenticated');
      return {
        ...state,
        access: null,
        refresh: null,
        isSuperuserAuthenticated: false,
        isAuthenticated: false,
        isInvestigatorAuthenticated: false,
        isHealthProfessionalAuthenticated: false,
        user: null,
      };
    case PASSWORD_RESET_SUCCESS:
    case PASSWORD_RESET_FAIL:
    case PASSWORD_RESET_CONFIRM_SUCCESS:
    case PASSWORD_RESET_CONFIRM_FAIL:
    case ACTIVATION_SUCCESS:
    case ACTIVATION_FAIL:
      return {
        ...state,
      };
    default:
      return state;
  }
}
