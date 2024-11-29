import { createSlice } from '@reduxjs/toolkit';
import { MessageReadType } from '../../constants/commons-const';
// ----------------------------------------------------------------------

const initialState = {
  quotesMessage: null,
  deleteMessage: { openDialog: false, messageId: '' },
  editMessage: null, // { channelType: '', channelId: '', messageId: '', messageText: '' },
  messageIdError: '',
  searchMessageId: '',
  messageReadType: MessageReadType.Empty,
};

const slice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    onReplyMessage(state, action) {
      state.quotesMessage = action.payload;
    },
    onDeleteMessage(state, action) {
      state.deleteMessage = action.payload;
    },
    onEditMessage(state, action) {
      state.editMessage = action.payload;
    },
    setMessageIdError(state, action) {
      state.messageIdError = action.payload;
    },
    setSearchMessageId(state, action) {
      state.searchMessageId = action.payload;
    },
    setMessageReadType(state, action) {
      state.messageReadType = action.payload;
    },
  },
});

// Reducer
export const {
  onReplyMessage,
  onDeleteMessage,
  onEditMessage,
  setMessageIdError,
  setSearchMessageId,
  setMessageReadType,
} = slice.actions;

export default slice.reducer;
