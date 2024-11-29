import { createSlice } from '@reduxjs/toolkit';

import axiosInstance from '../../utils/axios';
import { UpdateIsLoading, setIsResetEmailSent, showSnackbar } from './app';
import { client } from '../../client';
import axiosWalletInstance from '../../utils/axiosWallet';
import { handleError } from '../../utils/commons';
import { API_KEY } from '../../config';
import { LocalStorageKey } from '../../constants/localStorage-const';
import { LoginType } from '../../constants/commons-const';

// ----------------------------------------------------------------------

const initialState = {
  isLoggedIn: false,
  user_id: null,
  project_id_ermis: null,
  openDialogPlatform: true,
  loginType: '',
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logIn(state, action) {
      state.isLoggedIn = action.payload.isLoggedIn;
      state.user_id = action.payload.user_id;
      state.project_id_ermis = action.payload.project_id_ermis;
      state.openDialogPlatform = action.payload.openDialogPlatform;
      state.loginType = action.payload.loginType;
    },
    signOut(state, action) {
      state.isLoggedIn = false;
      state.user_id = null;
      state.project_id_ermis = null;
      state.openDialogPlatform = true;
      state.loginType = '';
    },
    setOpenDialogPlatform(state, action) {
      state.openDialogPlatform = action.payload;
    },
    setLoginType(state, action) {
      state.loginType = action.payload;
    },
  },
});

// Reducer
export const { setOpenDialogPlatform, signOut } = slice.actions;
export default slice.reducer;

export function LoginUserByWallet(data) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    const { address, signature, nonce } = data;

    await axiosWalletInstance
      .post('/uss/v1/wallets/auth', { address, signature, nonce, api_key: API_KEY })
      .then(async function (response) {
        if (response.status === 200) {
          const { refresh_token, token, user_id, project_id } = response.data;
          dispatch(
            slice.actions.logIn({
              isLoggedIn: true,
              user_id: user_id,
              project_id_ermis: project_id,
              openDialogPlatform: true,
              loginType: LoginType.Wallet,
            }),
          );
          window.localStorage.setItem(LocalStorageKey.UserId, user_id);
          window.localStorage.setItem(LocalStorageKey.AccessToken, token);
          window.localStorage.setItem(LocalStorageKey.RefreshToken, refresh_token);
          dispatch(UpdateIsLoading({ isLoading: false }));

          // const userInfo = await FetchUserFirst(user_id, token);
          // if (userInfo.name === user_id) {
          //   // show dialog update user
          //   setTimeout(() => {
          //     dispatch(OpenDialogProfile());
          //   }, 500);
          // }
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        handleError(dispatch, error);
      });
  };
}

export function LogoutUser() {
  return async (dispatch, getState) => {
    await client.disconnectUser();

    window.localStorage.clear();
    dispatch(slice.actions.signOut());
    window.location.reload();
  };
}

export function RegisterUserByEmail(formValues) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    await axiosWalletInstance
      .post('/uss/v1/wallets/register', {
        ...formValues,
      })
      .then(function (response) {
        dispatch(showSnackbar({ severity: 'success', message: 'Register successfully!' }));
        dispatch(UpdateIsLoading({ isLoading: false }));
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'An error occurred during the registration process. Please try again later!',
          }),
        );
      });
  };
}

export function LoginUserByEmail(data) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));
    const { email, password } = data;

    await axiosWalletInstance
      .post('/uss/v1/wallets/email_login', { email, password, apikey: API_KEY })
      .then(async function (response) {
        if (response.status === 200) {
          const { refresh_token, token, user_id, project_id } = response.data;
          dispatch(
            slice.actions.logIn({
              isLoggedIn: true,
              user_id: user_id,
              project_id_ermis: project_id,
              loginType: LoginType.Email,
            }),
          );
          window.localStorage.setItem(LocalStorageKey.UserId, user_id);
          window.localStorage.setItem(LocalStorageKey.AccessToken, token);
          window.localStorage.setItem(LocalStorageKey.RefreshToken, refresh_token);
          dispatch(UpdateIsLoading({ isLoading: false }));
        }
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'The login information is incorrect. Please check and try again!',
          }),
        );
      });
  };
}

export function ForgotPasswordByEmail(formValues) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));

    await axiosWalletInstance
      .post('/uss/v1/wallets/forgot', {
        ...formValues,
      })
      .then(function (response) {
        dispatch(
          showSnackbar({
            severity: 'success',
            message: 'Your password reset request has been successfully sent. Please check your email to proceed!',
          }),
        );
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(setIsResetEmailSent(true));
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'Unable to send the password reset request. Please try again later!',
          }),
        );
        dispatch(setIsResetEmailSent(false));
      });
  };
}

export function ResetPasswordByEmail(formValues) {
  return async (dispatch, getState) => {
    dispatch(UpdateIsLoading({ isLoading: true }));

    await axiosWalletInstance
      .post('/uss/v1/wallets/reset', {
        ...formValues,
      })
      .then(function (response) {
        dispatch(
          showSnackbar({
            severity: 'success',
            message: 'Your password has been successfully reset. Please use the new password to log in!',
          }),
        );
        dispatch(UpdateIsLoading({ isLoading: false }));
      })
      .catch(function (error) {
        dispatch(UpdateIsLoading({ isLoading: false }));
        dispatch(
          showSnackbar({
            severity: 'error',
            message: 'The verification code is invalid. Please check your email and try again!',
          }),
        );
      });
  };
}
