import { createSlice } from '@reduxjs/toolkit';
// ----------------------------------------------------------------------

const initialState = {
  openDialogCreateChannel: false,
  openDialogNewDirectMessage: false,
  openDialogProfile: false,
  channelConfirm: null, // {openDialog: false, channel: null, userId: '', type: ''}
  messagesHistoryDialog: { openDialog: false, messages: [] },
};

const slice = createSlice({
  name: 'dialog',
  initialState,
  reducers: {
    // Open Dialog Create Channel
    openDialogCreateChannel(state) {
      state.openDialogCreateChannel = true;
    },
    // Close Dialog Create Channel
    closeDialogCreateChannel(state) {
      state.openDialogCreateChannel = false;
    },

    // Open Dialog New Direct Message
    openDialogNewDirectMessage(state) {
      state.openDialogNewDirectMessage = true;
    },

    // Close Dialog New Direct Message
    closeDialogNewDirectMessage(state) {
      state.openDialogNewDirectMessage = false;
    },

    // Open Dialog Profile
    openDialogProfile(state) {
      state.openDialogProfile = true;
    },

    // Close Dialog Profile
    closeDialogProfile(state) {
      state.openDialogProfile = false;
    },

    setChannelConfirm(state, action) {
      state.channelConfirm = action.payload;
    },

    setMessagesHistoryDialog(state, action) {
      state.messagesHistoryDialog = action.payload;
    },
  },
});

// Reducer
export const { setChannelConfirm } = slice.actions;

export default slice.reducer;

// ----------------------------------------------------------------------

export const OpenDialogCreateChannel = () => async (dispatch, getState) => {
  dispatch(slice.actions.openDialogCreateChannel());
};

export const CloseDialogCreateChannel = () => async (dispatch, getState) => {
  dispatch(slice.actions.closeDialogCreateChannel());
};

export const OpenDialogNewDirectMessage = () => async (dispatch, getState) => {
  dispatch(slice.actions.openDialogNewDirectMessage());
};

export const CloseDialogNewDirectMessage = () => async (dispatch, getState) => {
  dispatch(slice.actions.closeDialogNewDirectMessage());
};

export const OpenDialogProfile = () => async (dispatch, getState) => {
  dispatch(slice.actions.openDialogProfile());
};

export const CloseDialogProfile = () => async (dispatch, getState) => {
  dispatch(slice.actions.closeDialogProfile());
};

export const SetMessagesHistoryDialog = payload => async (dispatch, getState) => {
  const messages = [...payload.messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  dispatch(slice.actions.setMessagesHistoryDialog({ ...payload, messages }));
};
