import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { Plus, X, UsersThree, User } from 'phosphor-react';
import { useTheme } from '@mui/material/styles';
import { SimpleBarStyle } from '../../components/Scrollbar';
import ChatElement from '../../components/ChatElement';
import { useDispatch, useSelector } from 'react-redux';
import useResponsive from '../../hooks/useResponsive';
import { client } from '../../client';
import {
  AddActiveChannel,
  AddPendingChannel,
  FetchChannels,
  MoveActiveChannelToTop,
  SetActiveChannels,
  SetPendingChannels,
  setCurrentChannel,
} from '../../redux/slices/channel';
import { ClientEvents } from '../../constants/events-const';
import { getChannelName, getMemberInfo, isTabInvite } from '../../utils/commons';
import Logo from '../../assets/Images/ermis.svg';
import { DEFAULT_PATH, DOMAIN_APP } from '../../config';
import { ChatType, EMOJI_QUICK, MessageType, TabType } from '../../constants/commons-const';
import { UpdateTab } from '../../redux/slices/app';
import { SetProjectCurrent } from '../../redux/slices/wallet';
import { OpenDialogCreateChannel, OpenDialogNewDirectMessage } from '../../redux/slices/dialog';
import ProjectAvatar from '../../components/ProjectAvatar';
import { CHAIN_ID } from '../../constants/wallet-const';
import { FetchAllMembers } from '../../redux/slices/member';
import { convertMessageSystem } from '../../utils/messageSystem';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import HomeSearch from '../../components/Search/HomeSearch';

const Channels = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { tab } = useSelector(state => state.app);
  const { activeChannels, pendingChannels } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { all_members } = useSelector(state => state.member);
  const { projectCurrent, chainCurrent } = useSelector(state => state.wallet);

  const isDesktop = useResponsive('up', 'md');
  const [anchorEl, setAnchorEl] = useState(null);
  const tabInvite = isTabInvite(tab);

  useEffect(() => {
    if (projectCurrent && all_members.length) {
      dispatch(FetchChannels());
    }
  }, [projectCurrent, all_members]);

  useEffect(() => {
    if (projectCurrent) {
      dispatch(FetchAllMembers());
    }
  }, [projectCurrent]);

  useEffect(() => {
    const currentState = window.history.state;
    const { channelId, channelType, type } = currentState;

    if (channelId && channelType && type) {
      switch (type) {
        case ClientEvents.MessageNew:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.ChannelCreated:
          dispatch(UpdateTab({ tab: TabType.Invite }));
          break;
        case ClientEvents.ReactionNew:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.MemberAdded:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.MemberUnBanned:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        case ClientEvents.MessageUpdated:
          navigate(`${DEFAULT_PATH}/${channelType}:${channelId}`);
          break;
        default:
          break;
      }

      window.history.replaceState({}, `${DOMAIN_APP}${DEFAULT_PATH}`);
    }

    return () => {
      window.history.replaceState({}, `${DOMAIN_APP}${DEFAULT_PATH}`);
    };
  }, []);

  function truncateMessage(message, maxLength) {
    if (message.length > maxLength) {
      return message.substring(0, maxLength) + '...';
    }
    return message;
  }

  function sendNotification(data) {
    const { channelId, channelType, channelName, type, notiText } = data;

    const formattedTimestamp = dayjs().format('DD/MM/YYYY, HH:mm');
    const truncatedBody = truncateMessage(notiText, 73); // Giới hạn 2 dòng cho body;

    const notification = new Notification(`${channelName} - ${formattedTimestamp}`, {
      icon: Logo,
      body: truncatedBody,
    });

    notification.addEventListener('click', function (event) {
      event.preventDefault();

      const url = `${DOMAIN_APP}/channels`;
      window.history.pushState({ channelId, channelType, type }, '', url);
      window.focus();
      window.location.href = url;
    });
  }

  function notifyUser(notiData) {
    const { type, message, senderId, channel } = notiData;
    const senderInfo = getMemberInfo(senderId, all_members);
    const senderName = senderInfo ? senderInfo.name : '';
    const channelData = client.channel(channel.type, channel.id);
    const channelName = getChannelName(channelData, all_members);
    const isDirect = channel.type === ChatType.MESSAGING;

    let notiText = '';
    switch (type) {
      case ClientEvents.MessageNew:
        const replaceMentionsWithNames = inputValue => {
          all_members.forEach(user => {
            inputValue = inputValue.replaceAll(`@${user.id}`, `@${user.name}`);
          });
          return inputValue;
        };

        if (message.type === MessageType.System) {
          notiText = convertMessageSystem(message.text, all_members, isDirect);
        } else {
          if (message.attachments) {
            notiText = `${senderName} has sent you an attachment`;
          } else {
            if (message.mentioned_all) {
              notiText = `${senderName} mentioned everyone in ${channelName}: ${message.text}`;
            } else if (message.mentioned_users && message.mentioned_users.includes(user_id)) {
              const messagePreview = replaceMentionsWithNames(message.text);
              notiText = `You were mentioned by ${senderName} in ${channelName}: ${messagePreview}`;
            } else {
              notiText = replaceMentionsWithNames(message.text);
            }
          }
        }
        break;
      case ClientEvents.ChannelCreated:
        notiText = message.text;
        break;
      case ClientEvents.ReactionNew:
        notiText = `${senderName} reacted with ${message.emoji.value} to your message`;
        break;
      case ClientEvents.MemberBanned:
        notiText = message.text;
        break;
      case ClientEvents.MemberUnBanned:
        notiText = message.text;
        break;
      case ClientEvents.MessageUpdated:
        notiText =
          message.type === MessageType.System
            ? convertMessageSystem(message.text, all_members, isDirect)
            : message.text;
        break;
      case ClientEvents.MemberAdded:
        notiText = message.text;
        break;
      default:
        notiText = '';
        break;
    }

    const data = {
      channelId: channel.id,
      channelType: channel.type,
      channelName: channelName,
      type,
      notiText,
    };

    if (!('Notification' in window)) {
      alert('This browser does not support system notifications!');
    } else if (Notification.permission === 'granted') {
      sendNotification(data);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission(permission => {
        if (permission === 'granted') {
          sendNotification(data);
        }
      });
    }
  }

  useEffect(() => {
    if (client) {
      const handleMessageNew = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        dispatch(MoveActiveChannelToTop(channelId));

        if (event.user.id !== user_id && !tabInvite) {
          if (!event.message.text.includes(`11 ${event.user.id}`)) {
            // ko nhận thông báo nếu user reject invite
            const notiData = {
              type: ClientEvents.MessageNew,
              message: event.message,
              senderId: event.user.id,
              channel: {
                id: channelId,
                type: channelType,
              },
            };

            notifyUser(notiData);
          }
        }
      };

      const handleChannelCreated = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        if (user_id === event.user.id) {
          // lời mời mình gửi
          dispatch(AddActiveChannel(channelId, channelType, event.type));
        } else {
          // lời mời mình nhận
          const notiData = {
            type: ClientEvents.ChannelCreated,
            message: {
              text:
                event.channel_type === ChatType.TEAM
                  ? 'You have a new channel invitation'
                  : 'You have a new DM invitation',
            },
            senderId: event.user.id,
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          notifyUser(notiData);

          dispatch(AddPendingChannel(channelId, channelType));
        }
      };

      // const handleChannelDeleted = event => {
      //   console.log('---event---', event);
      // };

      const handleReactionNew = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        const isMyMessage = event.message.user.id === user_id;

        if (isMyMessage && event.user.id !== user_id && !tabInvite) {
          const emoji = EMOJI_QUICK.find(item => item.type === event.reaction.type);

          const notiData = {
            type: ClientEvents.ReactionNew,
            message: { emoji },
            senderId: event.user.id,
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          notifyUser(notiData);
        }
      };

      const handleBanned = event => {
        if (event.member.user_id === user_id && !tabInvite) {
          const channelId = event.channel_id;
          const channelType = event.channel_type;
          const notiData = {
            type: ClientEvents.MemberBanned,
            message: { text: `You have been banned from interacting in a channel` },
            senderId: '',
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          notifyUser(notiData);
        }
      };

      const handleUnBanned = event => {
        if (event.member.user_id === user_id && !tabInvite) {
          const channelId = event.channel_id;
          const channelType = event.channel_type;

          const notiData = {
            type: ClientEvents.MemberBanned,
            message: { text: `You have been unbanned in a channel` },
            senderId: '',
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          notifyUser(notiData);
        }
      };

      const handleMessageUpdated = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;

        const notiData = {
          type: ClientEvents.MessageUpdated,
          message: event.message,
          senderId: event.user.id,
          channel: {
            id: channelId,
            type: channelType,
          },
        };

        notifyUser(notiData);
      };

      const handleMemberAdded = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;

        if (user_id !== event.user.id) {
          // lời mời mình nhận
          const notiData = {
            type: ClientEvents.MemberAdded,
            message: {
              text:
                channelType === ChatType.TEAM ? 'You have a new channel invitation' : 'You have a new DM invitation',
            },
            senderId: event.user.id,
            channel: {
              id: channelId,
              type: channelType,
            },
          };

          notifyUser(notiData);

          dispatch(AddPendingChannel(channelId, channelType));
        }
      };

      client.on(ClientEvents.ChannelCreated, handleChannelCreated);
      // client.on(ClientEvents.ChannelDeleted, handleChannelDeleted);
      client.on(ClientEvents.MessageNew, handleMessageNew);
      client.on(ClientEvents.ReactionNew, handleReactionNew);
      client.on(ClientEvents.MemberBanned, handleBanned);
      client.on(ClientEvents.MemberUnBanned, handleUnBanned);
      client.on(ClientEvents.MessageUpdated, handleMessageUpdated);
      client.on(ClientEvents.MemberAdded, handleMemberAdded);

      return () => {
        client.off(ClientEvents.ChannelCreated, handleChannelCreated);
        // client.off(ClientEvents.ChannelDeleted, handleChannelDeleted);
        client.off(ClientEvents.MessageNew, handleMessageNew);
        client.off(ClientEvents.ReactionNew, handleReactionNew);
        client.off(ClientEvents.MemberBanned, handleBanned);
        client.off(ClientEvents.MemberUnBanned, handleUnBanned);
        client.off(ClientEvents.MessageUpdated, handleMessageUpdated);
        client.off(ClientEvents.MemberAdded, handleMemberAdded);
      };
    }
  }, [dispatch, tabInvite, user_id]);

  const onCloseChannels = () => {
    dispatch(UpdateTab({ tab: TabType.Chat }));
    dispatch(SetActiveChannels([]));
    dispatch(SetPendingChannels([]));
    dispatch(SetProjectCurrent(null));
    dispatch(setCurrentChannel(null));
  };

  const onOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const onCloseMenu = () => {
    setAnchorEl(null);
  };

  const displayChannels = tabInvite ? pendingChannels : activeChannels;

  if (!projectCurrent) return null;

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          width: '100%',
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.default,
          boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Stack spacing={2} sx={{ height: '100%', width: '100%', padding: '15px' }}>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row" alignItems="center">
              {chainCurrent.chain_id !== CHAIN_ID.Ermis && (
                <IconButton onClick={onCloseChannels}>
                  <X style={{ color: theme.palette.text.primary }} size={22} />
                </IconButton>
              )}

              <Stack direction="row" alignItems="center">
                <ProjectAvatar project={projectCurrent} width={40} height={40} />
                <Typography
                  variant="subtitle1"
                  sx={{ fontSize: '14px', fontWeight: 700, flex: 1, paddingLeft: '15px' }}
                >
                  {projectCurrent?.project_name}
                </Typography>
              </Stack>
            </Stack>

            <HomeSearch channels={activeChannels} />

            <Stack spacing={2} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>
                {tabInvite ? 'Invites' : 'All Chats'}
              </Typography>

              <div>
                <IconButton onClick={onOpenMenu}>
                  <Plus style={{ color: theme.palette.primary.main }} />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={onCloseMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      dispatch(OpenDialogCreateChannel());
                      onCloseMenu();
                    }}
                  >
                    <span style={{ width: '26px' }}>
                      <UsersThree size={22} />
                    </span>
                    <span style={{ fontSize: 14, marginLeft: 10 }}>New channel</span>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      dispatch(OpenDialogNewDirectMessage());
                      onCloseMenu();
                    }}
                  >
                    <span style={{ width: '26px' }}>
                      <User size={18} />
                    </span>
                    <span style={{ fontSize: 14, marginLeft: 10 }}>New direct message</span>
                  </MenuItem>
                </Menu>
              </div>
            </Stack>
          </Stack>

          <Stack
            className="customScrollbar"
            sx={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '40px', height: 'calc(100% - 167px)' }}
          >
            <SimpleBarStyle timeout={500} clickOnTrack={false}>
              <Stack spacing={2}>
                {displayChannels && displayChannels.length > 0 ? (
                  displayChannels.map(item => {
                    return <ChatElement key={item.id} channel={item} />;
                  })
                ) : (
                  <Typography
                    variant="subtitle2"
                    sx={{
                      textAlign: 'center',
                      fontStyle: 'italic',
                      fontSize: '14px',
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                    }}
                  >
                    No channels
                  </Typography>
                )}
              </Stack>
            </SimpleBarStyle>
          </Stack>
        </Stack>
      </Box >
    </>
  );
};

export default Channels;
