import { createSlice } from '@reduxjs/toolkit';
import { ChatType, RoleMember, SidebarType } from '../../constants/commons-const';
import { client } from '../../client';
import { handleError, myRoleInChannel } from '../../utils/commons';
import { CapabilitiesName } from '../../constants/capabilities-const';
import { setSidebar } from './app';
import { ClientEvents } from '../../constants/events-const';

const initialState = {
  channels: [],
  activeChannels: [],
  pendingChannels: [],
  searchChannels: [], // data for feature search channel
  channel_id: null,
  currentChannel: null,
  allUnreadData: {},
  capabilities: [],
  channelPermissions: {
    canSendMessage: true,
    canSendLinks: true,
    canEditMessage: true,
    canDeleteMessage: true,
    canReactMessage: true,
  },
  cooldownTime: null,
  filterWords: [],
  mentions: [],
  loadingChannel: false,
  errorChannel: false,
};

const slice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    fetchChannels(state, action) {
      // state.channels = action.payload;
      state.activeChannels = action.payload.activeChannels;
      state.pendingChannels = action.payload.pendingChannels;
    },
    setCurrentChannel(state, action) {
      state.currentChannel = action.payload;
    },
    addActiveChannel(state, action) {
      state.activeChannels.unshift(action.payload);
    },
    addPendingChannel(state, action) {
      state.pendingChannels.unshift(action.payload);
    },
    removeActiveChannel(state, action) {
      state.activeChannels = state.activeChannels.filter(item => item.id !== action.payload);
      state.currentChannel = null;
    },
    removePendingChannel(state, action) {
      state.pendingChannels = state.pendingChannels.filter(item => item.id !== action.payload);
      state.currentChannel = null;
    },
    fetchAllUnreadData(state, action) {
      state.allUnreadData = action.payload;
    },
    setCapabilities(state, action) {
      state.capabilities = action.payload;
    },
    setChannelPermissions(state, action) {
      const { canSendMessage, canSendLinks, canEditMessage, canDeleteMessage, canReactMessage } = action.payload;
      state.channelPermissions.canSendMessage = canSendMessage;
      state.channelPermissions.canSendLinks = canSendLinks;
      state.channelPermissions.canEditMessage = canEditMessage;
      state.channelPermissions.canDeleteMessage = canDeleteMessage;
      state.channelPermissions.canReactMessage = canReactMessage;
    },
    setCooldownTime(state, action) {
      state.cooldownTime = action.payload;
    },
    setFilterWords(state, action) {
      state.filterWords = action.payload;
    },
    setMentions(state, action) {
      state.mentions = action.payload;
    },
    addMention(state, action) {
      state.mentions.push(action.payload);
    },
    removeMention(state, action) {
      state.mentions = state.mentions.filter(item => item.id !== action.payload);
    },
    setLoadingChannel(state, action) {
      state.loadingChannel = action.payload;
    },
    setSearchChannels(state, action) {
      state.searchChannels = action.payload;
    },
    setActiveChannels(state, action) {
      state.activeChannels = action.payload;
    },
    setPendingChannels(state, action) {
      state.pendingChannels = action.payload;
    },
    setErrorChannel(state, action) {
      state.errorChannel = action.payload;
    },
  },
});

// Reducer
export const { setCurrentChannel, setLoadingChannel, setSearchChannels, setErrorChannel } = slice.actions;

export default slice.reducer;

// ----------------------------------------------------------------------

const loadDataChannel = (channel, dispatch, user_id) => {
  const channelType = channel.type;
  if (channelType === ChatType.TEAM) {
    const myRole = myRoleInChannel(channel);
    const duration = channel.data.member_message_cooldown;
    const lastSend = channel.state.read[user_id].last_send;
    dispatch(
      SetMentions(
        Object.values(channel.state.members).filter(
          member => member.channel_role !== RoleMember.PENDING && !member.banned,
        ) || [],
      ),
    );
    dispatch(SetMemberCapabilities(channel.data?.member_capabilities));
    dispatch(SetFilterWords(channel.data.filter_words || []));
    if (myRole === RoleMember.MEMBER && duration > 0) {
      dispatch(SetCooldownTime({ duration, lastSend }));
    }
  }
};

export function FetchChannels(params) {
  return async (dispatch, getState) => {
    if (!client) return;
    // const filter = {
    //   roles: tab === TabType.Chat ? [RoleMember.OWNER, RoleMember.MOD, RoleMember.MEMBER] : [RoleMember.PENDING],
    // };

    // if (params) {
    //   const { type } = params;
    //   filter.type = type ? type : ChatType.ALL;
    // }

    const filter = {};
    const sort = [];
    const options = {
      // limit: 10,
      // offset: 0,
      message_limit: 25,
      // presence: true,
      // watch: true,
    };
    dispatch(slice.actions.fetchChannels({ activeChannels: [], pendingChannels: [] }));

    await client
      .queryChannels(filter, sort, options)
      .then(response => {
        const sortedArray = response.sort((a, b) => {
          const dateA = a.state.last_message_at ? new Date(a.state.last_message_at) : new Date(a.data.created_at);
          const dateB = b.state.last_message_at ? new Date(b.state.last_message_at) : new Date(b.data.created_at);
          return dateB - dateA;
        });
        const activeChannels =
          sortedArray.filter(item => item.state.membership.channel_role !== RoleMember.PENDING) || [];
        const pendingChannels =
          sortedArray.filter(item => item.state.membership.channel_role === RoleMember.PENDING) || [];
        dispatch(slice.actions.fetchChannels({ activeChannels, pendingChannels }));
      })
      .catch(err => {
        dispatch(slice.actions.fetchChannels({ activeChannels: [], pendingChannels: [] }));
        handleError(dispatch, err);
      });
  };
}

export const SetActiveChannels = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setActiveChannels(payload));
  };
};

export const SetPendingChannels = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setPendingChannels(payload));
  };
};

export const ConnectCurrentChannel = (channelId, channelType) => {
  return async (dispatch, getState) => {
    try {
      if (!client) return;
      dispatch(slice.actions.setLoadingChannel(true));
      dispatch(SetCooldownTime(null));
      dispatch(slice.actions.setCurrentChannel(null));
      const { user_id } = getState().auth;
      const channel = client.channel(channelType, channelId);
      // const read = channel.state.read[user_id];
      // const lastMessageId =
      //   read && read.unread_messages > 0 && read.last_read_message_id ? read.last_read_message_id : '';

      const messages = { limit: 25 };
      // if (lastMessageId) {
      //   messages.id_gt = lastMessageId;
      // }

      // await channel.watch();
      const response = await channel.query({
        messages,
      });

      if (response) {
        dispatch(slice.actions.setErrorChannel(false));
        dispatch(slice.actions.setCurrentChannel(channel));
        dispatch(setSidebar({ type: SidebarType.Channel, open: false }));
        setTimeout(() => {
          dispatch(slice.actions.setLoadingChannel(false));
          dispatch(SetMarkReadChannel(channel));
        }, 100);

        loadDataChannel(channel, dispatch, user_id);
      }
    } catch (error) {
      // handleError(dispatch, error);
      dispatch(slice.actions.setErrorChannel(true));
      dispatch(slice.actions.setLoadingChannel(false));
    }
  };
};

export const WatchCurrentChannel = (channelId, channelType) => {
  return async (dispatch, getState) => {
    try {
      if (!client) return;
      const { user_id } = getState().auth;
      const channel = client.channel(channelType, channelId);
      const response = await channel.watch();

      if (response) {
        dispatch(slice.actions.setCurrentChannel(channel));
        loadDataChannel(channel, dispatch, user_id);
      }
    } catch (error) {
      handleError(dispatch, error);
    }
  };
};

export const AddActiveChannel = (channelId, channelType, eventType) => {
  return async (dispatch, getState) => {
    if (!client) return;
    const { user_id } = getState().auth;
    const channel = client.channel(channelType, channelId);

    const response = await channel.watch();

    if (response) {
      dispatch(slice.actions.addActiveChannel(channel));

      if (eventType === ClientEvents.Notification.InviteAccepted) {
        dispatch(slice.actions.setCurrentChannel(channel));
        loadDataChannel(channel, dispatch, user_id);
      }
    }
  };
};

export const AddPendingChannel = (channelId, channelType) => {
  return async (dispatch, getState) => {
    if (!client) return;
    const channel = client.channel(channelType, channelId);

    const messages = { limit: 25 };
    const response = await channel.query({
      messages,
    });

    if (response) {
      dispatch(slice.actions.addPendingChannel(channel));
    }
  };
};

export const RemoveActiveChannel = channelId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeActiveChannel(channelId));
  };
};

export const RemovePendingChannel = channelId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removePendingChannel(channelId));
  };
};

export const MoveActiveChannelToTop = channelId => {
  return async (dispatch, getState) => {
    const { activeChannels } = getState().channel;

    // Tìm channel có channelId trong danh sách activeChannels
    const channelIndex = activeChannels.findIndex(channel => channel.id === channelId);

    if (channelIndex > -1) {
      // Lấy channel cần di chuyển
      const channelToMove = activeChannels[channelIndex];

      // Xóa channel khỏi vị trí cũ và thêm nó lên đầu danh sách
      const updatedChannels = [
        channelToMove,
        ...activeChannels.slice(0, channelIndex),
        ...activeChannels.slice(channelIndex + 1),
      ];

      // Cập nhật lại danh sách activeChannels
      dispatch(slice.actions.setActiveChannels(updatedChannels));
    }
  };
};

export const SetMarkReadChannel = channel => {
  return async (dispatch, getState) => {
    const { user_id } = getState().auth;
    const read = channel.state.read[user_id];
    const unreadMessage = read.unread_messages;
    if (unreadMessage) {
      await channel.markRead();
    }
  };
};

export function FetchAllUnreadData() {
  return async (dispatch, getState) => {
    if (!client) return;

    const userId = getState().auth.user_id;
    await client
      .getUnreadCount(userId)
      .then(response => {
        dispatch(slice.actions.fetchAllUnreadData(response));
      })
      .catch(err => {
        handleError(dispatch, err);
      });
  };
}

export function SetMemberCapabilities(capabilities) {
  return async (dispatch, getState) => {
    const { currentChannel } = getState().channel;

    if (currentChannel && currentChannel.type === ChatType.TEAM) {
      dispatch(slice.actions.setCapabilities(capabilities));

      const membership = currentChannel.state.membership;
      if (membership.channel_role === RoleMember.MEMBER) {
        const canSendMessage = capabilities.includes(CapabilitiesName.SendMessage);
        const canSendLinks = capabilities.includes(CapabilitiesName.SendLinks);
        const canEditMessage = capabilities.includes(CapabilitiesName.UpdateOwnMessage);
        const canDeleteMessage = capabilities.includes(CapabilitiesName.DeleteOwnMessage);
        const canReactMessage = capabilities.includes(CapabilitiesName.SendReaction);

        dispatch(
          slice.actions.setChannelPermissions({
            canSendMessage,
            canSendLinks,
            canEditMessage,
            canDeleteMessage,
            canReactMessage,
          }),
        );
      } else {
        dispatch(
          slice.actions.setChannelPermissions({
            canSendMessage: true,
            canEditMessage: true,
            canDeleteMessage: true,
            canReactMessage: true,
          }),
        );
      }
    }
  };
}

export const SetCooldownTime = payload => {
  return async (dispatch, getState) => {
    if (payload) {
      const { duration, lastSend } = payload;
      dispatch(slice.actions.setCooldownTime({ duration, lastSend }));
    } else {
      dispatch(slice.actions.setCooldownTime(null));
    }
  };
};

export const SetFilterWords = payload => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setFilterWords(payload));
  };
};

export const SetMentions = payload => {
  return async (dispatch, getState) => {
    const { all_members } = getState().member;

    const mentionsData = payload.map(member => {
      const memberInfo = all_members.find(it => it.id === member.user_id);
      const name = memberInfo ? memberInfo.name : member.user_id;
      return { name, id: member.user_id, mentionName: `@${name.toLowerCase()}`, mentionId: `@${member.user_id}` };
    });
    const allData = { name: 'All', id: 'all', mentionName: `@all`, mentionId: `@all` };

    dispatch(slice.actions.setMentions([allData, ...mentionsData]));
  };
};

export const AddMention = mentionId => {
  return async (dispatch, getState) => {
    const { all_members } = getState().member;

    const memberInfo = all_members.find(it => it.id === mentionId);
    const name = memberInfo ? memberInfo.name : mentionId;
    const mentionData = {
      name,
      id: mentionId,
      mentionName: `@${name.toLowerCase()}`,
      mentionId: `@${mentionId}`,
    };
    dispatch(slice.actions.addMention(mentionData));
  };
};

export const RemoveMention = mentionId => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.removeMention(mentionId));
  };
};
