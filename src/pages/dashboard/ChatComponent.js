import { Stack, Box, Typography, Chip, Alert } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { SimpleBarStyle } from '../../components/Scrollbar';
import { ChatHeader, ChatFooter } from '../../components/Chat';
import useResponsive from '../../hooks/useResponsive';
import { AttachmentMsg, ReplyMsg, TextMsg } from '../../sections/dashboard/Conversation';
import { useDispatch, useSelector } from 'react-redux';
import {
  checkMyMessage,
  checkPendingInvite,
  formatString,
  getChannelName,
  getMemberInfo,
  handleError,
  isChannelDirect,
  isGuestInPublicChannel,
  isTabInvite,
  myRoleInChannel,
  splitChannelId,
} from '../../utils/commons';
import dayjs from 'dayjs';
import InfiniteScroll from 'react-infinite-scroll-component';
import { LoadingSpinner } from '../../components/animate';
import MemberAvatar from '../../components/MemberAvatar';
import ReadBy from '../../components/ReadBy';
import { ClientEvents } from '../../constants/events-const';
import ReactionsMessage from '../../components/ReactionsMessage';
import ChannelInvitation from '../../sections/dashboard/ChannelInvitation';
import {
  AddActiveChannel,
  RemoveActiveChannel,
  RemovePendingChannel,
  SetCooldownTime,
  SetFilterWords,
  SetMemberCapabilities,
  WatchCurrentChannel,
} from '../../redux/slices/channel';
import { Trash, WarningCircle } from 'phosphor-react';
import ScrollToBottom from '../../components/ScrollToBottom';
import DeleteMessageDialog from '../../sections/dashboard/DeleteMessageDialog';
import { ChatType, DefaultLastSend, MessageType, RoleMember, TabType } from '../../constants/commons-const';
import { UpdateTab } from '../../redux/slices/app';
import BannedBackdrop from '../../components/BannedBackdrop';
import { client } from '../../client';
import { setSearchMessageId } from '../../redux/slices/messages';
import { convertMessageSystem } from '../../utils/messageSystem';
import BlockedBackdrop from '../../components/BlockedBackdrop';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PATH } from '../../config';
import MessagesHistoryDialog from '../../sections/dashboard/MessagesHistoryDialog';
import { SetMessagesHistoryDialog } from '../../redux/slices/dialog';

const StyledMessage = styled(Stack)(({ theme }) => ({
  marginTop: '0px !important',
  paddingTop: '24px',
  '&:hover': {
    '& .messageActions': {
      visibility: 'visible',
    },
  },
  '& .mentionHighlight': {
    padding: '2px 10px',
    borderRadius: '12px',
    backgroundColor: '#F4F6F8',
    color: '#212B36',
    '&.mentionAll': {
      color: '#FF4842',
    },
    '&.mentionMe': {
      color: '#FF4842',
    },
  },
  '&.myMessage': {
    '& .linkUrl': {
      color: '#fff',
    },
  },
  '& .messageActions.open': {
    visibility: 'visible',
  },
}));

const MESSAGE_LIMIT = 25;

const MessageList = ({
  messageListRef,
  isMobile,
  messages,
  usersTyping,
  lastReadMessageId,
  targetId,
  setTargetId,
  isDirect,
  setShowChipUnread,
  onScrollToReplyMsg,
  highlightMsg,
  setHighlightMsg,
}) => {
  const dispatch = useDispatch();
  const messageRefs = useRef({});
  const unreadRefs = useRef([]);
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const { all_members } = useSelector(state => state.member);
  const { currentChannel } = useSelector(state => state.channel);

  const lastReadIndex = messages.findIndex(msg => msg.id === lastReadMessageId);

  useEffect(() => {
    if (messages.length > 0) {
      let messageElement;
      if (targetId) {
        messageElement = messageRefs.current[targetId];
      }
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
          setTargetId('');
          setHighlightMsg('');
          dispatch(setSearchMessageId(''));
        }, 1000);
      }
    }
  }, [messages, targetId]);

  useEffect(() => {
    if (messageListRef.current) {
      const chatBoxHeight = messageListRef.current.offsetHeight;

      // Tính tổng chiều cao của các tin nhắn chưa đọc
      const totalUnreadHeight = unreadRefs.current.reduce((acc, msgRef) => {
        return acc + (msgRef?.offsetHeight || 0);
      }, 0);

      // So sánh chiều cao tổng của tin nhắn chưa đọc với chiều cao hộp chat
      setShowChipUnread(totalUnreadHeight > chatBoxHeight);
    }
  }, [messageListRef, unreadRefs]);

  const setMessageRef = (id, element, index) => {
    messageRefs.current[id] = element;

    if (lastReadIndex && lastReadIndex >= 0 && index > lastReadIndex) {
      unreadRefs.current[index - lastReadIndex - 1] = element;
    }
  };

  const onRetrySendMessage = async message => {
    try {
      const payload = { id: message.id, text: message.text, attachments: message.attachments, mentioned_users: [] };
      if (message.quoted_message_id) {
        payload.quoted_message_id = message.quoted_message_id;
      }
      await currentChannel?.sendMessage(payload);
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  const renderMessage = el => {
    const isMyMessage = checkMyMessage(user_id, el.user.id);
    const messageType = el.type;

    if (el.deleted_at) {
      return (
        <Stack direction="row" justifyContent={isMyMessage ? 'end' : 'start'} alignItems="center">
          <Box
            px={1.5}
            py={1.5}
            sx={{
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
              borderRadius: 1.5,
              width: 'max-content',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.grey[600],
            }}
          >
            <Trash size={16} color={theme.palette.grey[600]} />
            &nbsp;&nbsp;Message deleted
          </Box>
        </Stack>
      );
    } else {
      if (messageType === MessageType.Regular) {
        if (el.attachments && el.attachments.length > 0) {
          return <AttachmentMsg el={{ ...el, isMyMessage }} />;
        } else {
          return <TextMsg el={{ ...el, isMyMessage }} />;
        }
      } else if (messageType === MessageType.Reply) {
        if (el.quoted_message) {
          return (
            <ReplyMsg el={{ ...el, isMyMessage }} all_members={all_members} onScrollToReplyMsg={onScrollToReplyMsg} />
          );
        } else {
          return <TextMsg el={{ ...el, isMyMessage }} />;
        }
      } else {
        return null;
      }
    }
  };

  const getDateLabel = (currentDate, lastDate) => {
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');

    if (!lastDate || !currentDate.isSame(lastDate)) {
      if (currentDate.isSame(today)) {
        return 'Today';
      }
      if (currentDate.isSame(yesterday)) {
        return 'Yesterday';
      }
      return currentDate.format('DD/MM/YYYY');
    }

    return null;
  };

  let lastUserId = '';
  let lastDate = null;

  return (
    <Box sx={{ padding: isMobile ? '15px' : '40px 15px' }}>
      <Stack spacing={1} sx={{ position: 'relative' }}>
        {messages.length
          ? messages.map((el, idx) => {
            const isNewUser = el.user.id !== lastUserId;
            lastUserId = el.user.id;
            const messageType = el.type;
            const isMyMessage = el.user.id === user_id;
            const memberInfo = getMemberInfo(el.user.id, all_members);
            const name = memberInfo ? formatString(memberInfo.name) : formatString(el.user.id);
            const isMessageDeleted = el.deleted_at;

            const currentDate = dayjs(el.created_at).startOf('day');
            const label = getDateLabel(currentDate, lastDate);

            // Cập nhật lastDate để sử dụng cho tin nhắn tiếp theo
            if (label) {
              lastDate = currentDate;
            }

            if (messageType === MessageType.System) {
              return (
                <StyledMessage
                  direction="row"
                  justifyContent="center"
                  key={el.id}
                  ref={element => setMessageRef(el.id, element, idx)}
                >
                  <Typography variant="body2" color={theme.palette.grey[500]} sx={{ textAlign: 'center' }}>
                    {convertMessageSystem(el.text, all_members, isDirect)}
                  </Typography>
                </StyledMessage>
              );
            } else {
              return (
                <StyledMessage
                  direction="row"
                  justifyContent={isMyMessage ? 'end' : 'start'}
                  flexWrap="wrap"
                  key={el.id}
                  className={isMyMessage ? 'myMessage' : ''}
                  ref={element => setMessageRef(el.id, element, idx)}
                  sx={{ position: 'relative', maxWidth: '100%', paddingTop: isNewUser ? '24px' : '0px' }}
                >
                  {highlightMsg === el.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'calc(100% + 80px)',
                        height: '100%',
                        backgroundColor: theme.palette.action.selected,
                      }}
                    />
                  )}

                  {label && (
                    <Stack direction="row" justifyContent="center" sx={{ width: '100%', margin: '10px 0', order: 1 }}>
                      <Chip label={label} />
                    </Stack>
                  )}

                  <Stack
                    sx={{
                      padding: isMyMessage ? '0 0 0 15px' : '0 15px 0 0',
                      order: isMyMessage ? 3 : 2,
                      width: '47px',
                      visibility: isNewUser ? 'visible' : 'hidden',
                    }}
                  >
                    <MemberAvatar member={memberInfo} width={32} height={32} />
                  </Stack>

                  <Stack sx={{ order: isMyMessage ? 2 : 3, width: 'calc(100%)' }}>
                    <Stack
                      direction="row"
                      sx={{
                        display: isNewUser ? 'flex' : 'none',
                        justifyContent: isMyMessage ? 'right' : 'left',
                        alignItems: 'center',
                        margin: '0 -5px',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.text,
                          fontSize: 14,
                          fontWeight: 700,
                          padding: '0 5px',
                        }}
                      >
                        {name}
                      </Typography>
                    </Stack>

                    {renderMessage(el)}

                    {el.latest_reactions && !isMessageDeleted && (
                      <ReactionsMessage isMyMessage={isMyMessage} message={el} />
                    )}

                    {el.status === 'error' && (
                      <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: '5px' }}>
                        <Stack direction="row" alignItems="center">
                          <WarningCircle size={18} weight="fill" color={theme.palette.error.main} />
                          <span style={{ fontSize: '12px', color: theme.palette.error.main }}>
                            &nbsp;Message sending failed&nbsp;&#8226;&nbsp;
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: theme.palette.error.main,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                            onClick={() => onRetrySendMessage(el)}
                          >
                            Try again
                          </span>
                        </Stack>
                      </Stack>
                    )}
                  </Stack>

                  {lastReadMessageId === el.id && (
                    <Stack direction="row" justifyContent="center" sx={{ width: '100%', margin: '10px 0', order: 4 }}>
                      <Chip label="Unread message" />
                    </Stack>
                  )}
                </StyledMessage>
              );
            }
          })
          : null}
        <ReadBy />
      </Stack>
      {usersTyping.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            zIndex: 1,
            bottom: 95,
            color: theme.palette.text.secondary,
          }}
        >
          <div style={{ fontStyle: 'italic', fontSize: '14px' }}>
            {usersTyping.length === 1
              ? `${usersTyping[0].name} is typing`
              : usersTyping.length === 2
                ? `${usersTyping[0].name} and 1 other are typing`
                : `${usersTyping[0].name} and ${usersTyping.length - 1} other are typing`}
            &nbsp;&nbsp;
            <div className="loader">
              <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
              <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
              <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
            </div>
          </div>
        </Box>
      )}
    </Box>
  );
};

const ChatComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isMobile = useResponsive('between', 'md', 'xs', 'sm');
  const theme = useTheme();
  const messageListRef = useRef(null);
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { all_members } = useSelector(state => state.member);
  const { deleteMessage, messageIdError, searchMessageId } = useSelector(state => state.messages);
  const { tab } = useSelector(state => state.app);

  const [messages, setMessages] = useState([]);
  const [usersTyping, setUsersTyping] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPendingInvite, setIsPendingInvite] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [showChipUnread, setShowChipUnread] = useState(false);
  const [highlightMsg, setHighlightMsg] = useState('');

  const isDirect = isChannelDirect(currentChannel);
  const tabInvite = isTabInvite(tab);

  useEffect(() => {
    if (currentChannel) {
      if (messageListRef.current) {
        messageListRef.current.scrollTop = 0;
      }
      const listMessage = currentChannel.state.messages || [];
      const members = Object.values(currentChannel.state.members);
      const receiverInfo = members.find(member => member.user_id !== user_id);
      setShowAlert(isDirect && receiverInfo?.channel_role === RoleMember.PENDING);
      setMessages(listMessage);
      setIsPendingInvite(checkPendingInvite(currentChannel));
      setUnreadCount(currentChannel.state.unreadCount);
      setIsGuest(isGuestInPublicChannel(currentChannel));

      const read = currentChannel.state.read[user_id];
      const lastReadMsgId = read.unread_messages ? read.last_read_message_id : '';
      setLastReadMessageId(lastReadMsgId);
      let lastSend = read.last_send || DefaultLastSend;
      let duration = currentChannel.data.member_message_cooldown || 0;

      const onSetCooldownTime = event => {
        const myRole = myRoleInChannel(currentChannel);
        if (event.type === ClientEvents.MessageNew) {
          if (event.user.id === user_id && event.channel_type === ChatType.TEAM && myRole === RoleMember.MEMBER) {
            lastSend = event.message.created_at;

            if (duration) {
              dispatch(SetCooldownTime({ duration, lastSend }));
            } else {
              dispatch(SetCooldownTime(null));
            }
          }
        }

        if (event.type === ClientEvents.ChannelUpdated) {
          if (event.user.id !== user_id && event.channel_type === ChatType.TEAM && myRole === RoleMember.MEMBER) {
            duration = event.channel.member_message_cooldown ? event.channel.member_message_cooldown : 0;

            if (duration) {
              dispatch(SetCooldownTime({ duration, lastSend }));
            } else {
              dispatch(SetCooldownTime(null));
            }
          }
        }
      };

      const onSetFilterWords = event => {
        if (event.type === ClientEvents.ChannelUpdated && event.channel_type === ChatType.TEAM) {
          dispatch(SetFilterWords(event.channel.filter_words || []));
        }
      };

      const handleMessages = event => {
        switch (event.type) {
          case ClientEvents.MessageNew:
            setMessages(prev => {
              return [...prev, event.message];
            });
            setLastReadMessageId('');
            setUnreadCount(0);
            messageListRef.current.scrollTop = messageListRef.current?.scrollHeight;
            onSetCooldownTime(event);
            break;
          case ClientEvents.ReactionDeleted:
            setMessages(prev => {
              return prev.map(item => (item.id === event.message.id ? event.message : item));
            });
            break;
          case ClientEvents.ReactionNew:
            setMessages(prev => {
              return prev.map(item => (item.id === event.message.id ? event.message : item));
            });
            break;
          case ClientEvents.MessageDeleted:
            setMessages(prev => {
              return prev.filter(item => {
                if (item.quoted_message_id && item.quoted_message_id === event.message.id) {
                  return { ...item, quoted_message: { ...item.quoted_message, deleted_at: event.message.deleted_at } };
                } else if (item.id === event.message.id) {
                  return false;
                } else {
                  return true;
                }
              });
            });
            break;
          case ClientEvents.MessageUpdated:
            setMessages(prev => {
              return prev.map(item => (item.id === event.message.id ? event.message : item));
            });
            dispatch(SetMessagesHistoryDialog({ openDialog: false, messages: event.message.old_texts }));
            break;
          default:
            setMessages([]);
            break;
        }
      };

      const handleTypingStart = event => {
        if (user_id !== event.user.id) {
          const memberInfo = getMemberInfo(event.user.id, all_members);
          const name = memberInfo ? formatString(memberInfo.name) : formatString(event.user.id);

          const item = {
            name: name,
            id: event.user.id,
          };

          setUsersTyping(prev => {
            const updatedItems = [...prev, item];

            // lọc các item trùng nhau theo id
            const uniqueItems = Object.values(
              updatedItems.reduce((acc, item) => {
                acc[item.id] = item;
                return acc;
              }, {}),
            );

            return uniqueItems;
          });
        } else {
          setUsersTyping([]);
        }
      };

      const handleTypingStop = event => {
        if (user_id !== event.user.id) {
          setUsersTyping(prev => prev.filter(item => item.id !== event.user.id));
        } else {
          setUsersTyping([]);
        }
      };

      const handleInviteAccept = async event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;

        if (event.member.user_id === user_id) {
          dispatch(UpdateTab({ tab: TabType.Chat }));
          setIsPendingInvite(false);
          dispatch(RemovePendingChannel(channelId));
          dispatch(AddActiveChannel(channelId, channelType, event.type));
        } else {
          dispatch(WatchCurrentChannel(channelId, channelType));
        }
      };

      const handleInviteReject = event => {
        const splitCID = splitChannelId(event.cid);
        const channelId = splitCID.channelId;
        const channelType = splitCID.channelType;

        if (event.member.user_id === user_id) {
          navigate(`${DEFAULT_PATH}`);
          dispatch(RemovePendingChannel(channelId));
        } else {
          dispatch(WatchCurrentChannel(channelId, channelType));
        }
      };

      const handleChannelDeleted = () => {
        dispatch(RemoveActiveChannel(currentChannel.data.id));
      };

      const handleChannelUpdated = event => {
        const member_capabilities = event.channel.member_capabilities;
        dispatch(SetMemberCapabilities(member_capabilities));
        onSetCooldownTime(event);
        onSetFilterWords(event);
      };

      const handleMemberJoined = event => {
        setIsGuest(false);
      };

      const handleMemberRemoved = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        if (event.member.user_id !== user_id) {
          dispatch(WatchCurrentChannel(channelId, channelType));
        } else {
          navigate(`${DEFAULT_PATH}`);
          dispatch(RemoveActiveChannel(channelId));
        }
      };

      const handleMemberPromoted = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        dispatch(WatchCurrentChannel(channelId, channelType));
      };

      const handleMemberDemoted = event => {
        const channelId = event.channel_id;
        const channelType = event.channel_type;
        dispatch(WatchCurrentChannel(channelId, channelType));
      };

      currentChannel.on(ClientEvents.MessageNew, handleMessages);
      currentChannel.on(ClientEvents.ReactionNew, handleMessages);
      currentChannel.on(ClientEvents.ReactionDeleted, handleMessages);
      currentChannel.on(ClientEvents.MessageDeleted, handleMessages);
      currentChannel.on(ClientEvents.MessageUpdated, handleMessages);
      currentChannel.on(ClientEvents.TypingStart, handleTypingStart);
      currentChannel.on(ClientEvents.TypingStop, handleTypingStop);
      currentChannel.on(ClientEvents.Notification.InviteAccepted, handleInviteAccept);
      currentChannel.on(ClientEvents.Notification.InviteRejected, handleInviteReject);
      currentChannel.on(ClientEvents.ChannelDeleted, handleChannelDeleted);
      currentChannel.on(ClientEvents.ChannelUpdated, handleChannelUpdated);
      currentChannel.on(ClientEvents.MemberJoined, handleMemberJoined);
      currentChannel.on(ClientEvents.MemberRemoved, handleMemberRemoved);
      currentChannel.on(ClientEvents.MemberPromoted, handleMemberPromoted);
      currentChannel.on(ClientEvents.MemberDemoted, handleMemberDemoted);

      return () => {
        currentChannel.off(ClientEvents.MessageNew, handleMessages);
        currentChannel.off(ClientEvents.ReactionNew, handleMessages);
        currentChannel.off(ClientEvents.ReactionDeleted, handleMessages);
        currentChannel.off(ClientEvents.MessageDeleted, handleMessages);
        currentChannel.off(ClientEvents.MessageUpdated, handleMessages);
        currentChannel.off(ClientEvents.TypingStart, handleTypingStart);
        currentChannel.off(ClientEvents.TypingStop, handleTypingStop);
        currentChannel.off(ClientEvents.Notification.InviteAccepted, handleInviteAccept);
        currentChannel.off(ClientEvents.Notification.InviteRejected, handleInviteReject);
        currentChannel.off(ClientEvents.ChannelDeleted, handleChannelDeleted);
        currentChannel.off(ClientEvents.ChannelUpdated, handleChannelUpdated);
        currentChannel.off(ClientEvents.MemberJoined, handleMemberJoined);
        currentChannel.off(ClientEvents.MemberRemoved, handleMemberRemoved);
        currentChannel.off(ClientEvents.MemberPromoted, handleMemberPromoted);
        currentChannel.off(ClientEvents.MemberDemoted, handleMemberDemoted);
      };
    } else {
      if (messageListRef.current) {
        messageListRef.current.scrollTop = 0;
      }
      setMessages([]);
    }
  }, [currentChannel, user_id, messageListRef]);

  useEffect(() => {
    if (messageIdError) {
      setMessages(prev => prev.filter(item => item.id !== messageIdError));
    }
  }, [messageIdError]);

  useEffect(() => {
    if (searchMessageId) {
      setHighlightMsg(searchMessageId);
      const message = messages.find(item => item.id === searchMessageId);
      if (message) {
        setTargetId(message.id);
      } else {
        queryMessages(searchMessageId);
      }
    }
  }, [searchMessageId, messages]);

  const fetchMoreMessages = async () => {
    try {
      setLoadingMore(true);
      const response = await currentChannel.query({
        messages: { limit: MESSAGE_LIMIT, id_lt: messages[0]?.id },
      });

      if (response) {
        const allMessages = currentChannel.state.messages;

        setMessages(allMessages);
        setLoadingMore(false);
      }
    } catch (error) {
      setLoadingMore(false);
      handleError(dispatch, error);
    }
  };

  const queryMessages = async msgId => {
    const channelType = currentChannel.data.type;
    const channelId = currentChannel.data.id;
    const channel = client.channel(channelType, channelId);

    const response = await channel.query({
      messages: { limit: MESSAGE_LIMIT, id_gt: msgId },
    });

    if (response) {
      const messages = channel.state.messages;

      setMessages(messages);
      setTargetId(msgId);
    }
  };

  const onScrollToReplyMsg = msgId => {
    setHighlightMsg(msgId);
    const message = messages.find(item => item.id === msgId);
    if (message) {
      setTargetId(message.id);
    } else {
      queryMessages(msgId);
    }
  };

  const onScrollToFirstUnread = () => {
    if (lastReadMessageId) {
      const message = messages.find(item => item.id === lastReadMessageId);
      if (message) {
        setTargetId(message.id);
      } else {
        queryMessages(lastReadMessageId);
      }

      setTimeout(() => {
        onDeleteUnread();
      }, 1000);
    }
  };

  const onDeleteUnread = () => {
    setShowChipUnread(false);
    setUnreadCount(0);
  };

  return (
    <Stack sx={{ position: 'relative', width: isMobile ? '100%' : 'auto', height: '100%', overflow: 'hidden' }}>
      <ChatHeader currentChannel={currentChannel} />
      {(showChipUnread || unreadCount >= MESSAGE_LIMIT) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          sx={{ width: '100%', position: 'absolute', top: '75px', zIndex: 2 }}
        >
          <Chip
            label={`${unreadCount} Unread messages`}
            color="primary"
            onClick={onScrollToFirstUnread}
            onDelete={onDeleteUnread}
          />
        </Stack>
      )}

      {showAlert && (
        <Box sx={{ position: 'absolute', top: '75px', zIndex: 2, width: '100%' }}>
          <Alert severity="info" sx={{ fontWeight: 400 }}>
            <strong>{getChannelName(currentChannel, all_members)}</strong>
            &nbsp;needs to accept your invitation to see the messages you've sent
          </Alert>
        </Box>
      )}
      <Box
        id="scrollableDiv"
        className="customScrollbar"
        ref={messageListRef}
        width={'100%'}
        sx={{
          position: 'relative',
          flexGrow: 1,
          overflowY: 'auto',
          backgroundColor: theme.palette.mode === 'light' ? '#F0F4FA' : theme.palette.background.default,
          boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column-reverse',
        }}
      >
        {messages.length ? (
          <InfiniteScroll
            dataLength={messages.length}
            next={fetchMoreMessages}
            style={{ display: 'flex', flexDirection: 'column-reverse', position: 'relative' }}
            inverse={true}
            hasMore={true}
            loader={
              loadingMore && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                  <LoadingSpinner />
                </div>
              )
            }
            scrollableTarget="scrollableDiv"
          >
            <SimpleBarStyle timeout={500} clickOnTrack={false}>
              <MessageList
                messageListRef={messageListRef}
                isMobile={isMobile}
                messages={messages}
                usersTyping={usersTyping}
                lastReadMessageId={lastReadMessageId}
                targetId={targetId}
                setTargetId={setTargetId}
                isDirect={isDirect}
                setShowChipUnread={setShowChipUnread}
                onScrollToReplyMsg={onScrollToReplyMsg}
                highlightMsg={highlightMsg}
                setHighlightMsg={setHighlightMsg}
              />
            </SimpleBarStyle>
          </InfiniteScroll>
        ) : (
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '14px',
              color: theme.palette.text.secondary,
              fontWeight: 400,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            No messages here yet...
          </Typography>
        )}
      </Box>
      {!tabInvite && currentChannel ? <ScrollToBottom messageListRef={messageListRef} /> : null}
      {!isGuest && <ChatFooter currentChannel={currentChannel} setMessages={setMessages} />}
      {isPendingInvite && <ChannelInvitation />}
      {deleteMessage.openDialog && <DeleteMessageDialog />}
      {!isDirect && <BannedBackdrop />}
      {isDirect && <BlockedBackdrop />}
      <MessagesHistoryDialog />
    </Stack>
  );
};

export default ChatComponent;

export { MessageList };
