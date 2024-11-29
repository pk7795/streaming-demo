import { createSlice } from '@reduxjs/toolkit';
import { SidebarType, TabType } from '../../constants/commons-const';
// ----------------------------------------------------------------------

const initialState = {
  user: {},
  sideBar: {
    open: false,
    type: SidebarType.Channel,
  },
  tab: TabType.Chat,
  snackbar: {
    open: null,
    severity: null,
    message: null,
  },
  isLoading: false,
  isResetEmailSent: false,
};

const slice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    updateIsLoading(state, action) {
      state.isLoading = action.payload.isLoading;
    },
    // Toggle Sidebar
    toggleSideBar(state) {
      state.sideBar.open = !state.sideBar.open;
    },
    updateSideBarType(state, action) {
      state.sideBar.type = action.payload.type;
    },
    setSidebar(state, action) {
      state.sideBar.type = action.payload.type;
      state.sideBar.open = action.payload.open;
    },
    updateTab(state, action) {
      state.tab = action.payload.tab;
    },

    openSnackBar(state, action) {
      console.log(action.payload);
      state.snackbar.open = true;
      state.snackbar.severity = action.payload.severity;
      state.snackbar.message = action.payload.message;
    },
    closeSnackBar(state) {
      state.snackbar.open = false;
      state.snackbar.message = null;
    },
    setIsResetEmailSent(state, action) {
      state.isResetEmailSent = action.payload;
    },
  },
});

// Reducer
export const { setSidebar, setIsResetEmailSent } = slice.actions;

export default slice.reducer;

// ----------------------------------------------------------------------

export function UpdateIsLoading(payload) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateIsLoading(payload));
  };
}

export const closeSnackBar = () => async (dispatch, getState) => {
  dispatch(slice.actions.closeSnackBar());
};

export const showSnackbar =
  ({ severity, message }) =>
  async (dispatch, getState) => {
    dispatch(
      slice.actions.openSnackBar({
        message,
        severity,
      }),
    );

    setTimeout(() => {
      dispatch(slice.actions.closeSnackBar());
    }, 4000);
  };

export function ToggleSidebar() {
  return async (dispatch, getState) => {
    dispatch(slice.actions.toggleSideBar());
  };
}
export function UpdateSidebarType(type) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateSideBarType({ type }));
  };
}
export function UpdateTab(tab) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateTab(tab));
  };
}
