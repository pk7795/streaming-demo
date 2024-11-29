import { createSlice } from '@reduxjs/toolkit';
import { CallStatus } from '../../constants/commons-const';

const initialState = {
  openCallDirectDialog: false,
  callDirectData: null,
  peer: null,
  callDirectStatus: '',
  callDirectType: '',
  signalData: null,
};

const slice = createSlice({
  name: 'callDirect',
  initialState,
  reducers: {
    startCallDirect(state, action) {
      state.openCallDirectDialog = true;
      state.callDirectStatus = CallStatus.CALLING;
      state.callDirectData = action.payload.callDirectData;
      state.callDirectType = action.payload.callDirectType;
    },
    receivingCallDirect(state, action) {
      state.openCallDirectDialog = true;
      state.callDirectStatus = CallStatus.RECEIVING;
      state.callDirectData = action.payload.callDirectData;
      state.callDirectType = action.payload.callDirectType;
      state.signalData = action.payload.signalData;
    },
    acceptCallDirect(state, action) {
      state.callDirectStatus = CallStatus.CONNECTED;
      state.peer = action.payload.peer;
    },
    disconnectCallDirect(state, action) {
      state.openCallDirectDialog = false;
      state.callDirectStatus = '';
      state.callDirectData = null;
      state.callDirectType = '';
      state.peer = null;
      state.signalData = null;
    },
    setSignalData(state, action) {
      state.signalData = action.payload;
    },
    setPeer: (state, action) => {
      state.peer = action.payload;
    },
    setCallDirectStatus: (state, action) => {
      state.callDirectStatus = action.payload;
    },
  },
});

export const { setPeer, setSignalData, setCallDirectStatus } = slice.actions;

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

export const StartCallDirect = data => {
  return async (dispatch, getState) => {
    dispatch(
      slice.actions.startCallDirect({
        callDirectData: data.callDirectData,
        callDirectType: data.callDirectType,
      }),
    );
  };
};

export const ReceivingCallDirect = data => {
  return (dispatch, getState) => {
    dispatch(
      slice.actions.receivingCallDirect({
        callDirectData: data.callDirectData,
        callDirectType: data.callDirectType,
        signalData: data.signalData,
      }),
    );
  };
};

export const AcceptCallDirect = data => {
  return (dispatch, getState) => {
    dispatch(
      slice.actions.acceptCallDirect({
        peer: data.peer,
      }),
    );
  };
};

export const DisconnectCallDirect = () => {
  return (dispatch, getState) => {
    dispatch(slice.actions.disconnectCallDirect());
  };
};
