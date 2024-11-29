import React, { useEffect, useState } from 'react';
import { useTheme } from '@emotion/react';
import {
  Stack,
  Tooltip,
  AvatarGroup,
  styled,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { CheckCircle } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import MemberAvatar from './MemberAvatar';
import { formatString, getMemberInfo } from '../utils/commons';
import { fDateTime } from '../utils/formatTime';
import { ClientEvents } from '../constants/events-const';
import { MessageReadType, MessageType } from '../constants/commons-const';
import { setMessageReadType } from '../redux/slices/messages';

const StyledAvatarGroup = styled(AvatarGroup)(({ theme }) => ({
  cursor: 'pointer',
  '& .MuiAvatar-root': {
    border: 'none',
    boxSizing: 'border-box',
    '&.MuiAvatarGroup-avatar': {
      width: '18px',
      height: '18px',
      fontSize: '10px',
    },
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ReadBy() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { all_members } = useSelector(state => state.member);
  const { messageReadType } = useSelector(state => state.messages);

  const [readBy, setReadBy] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      let messages = currentChannel.state.messages.filter(msg => msg.type !== MessageType.System) || [];

      if (messages.length) {
        const members = Object.values(currentChannel.state.read).filter(item => item.user.id !== user_id);

        if (members.some(item => item.unread_messages === 0 && item.last_read_message_id)) {
          const readMembers = members.filter(item => item.unread_messages === 0 && item.last_read_message_id);
          setReadBy(readMembers);
          dispatch(setMessageReadType(MessageReadType.Read));
        } else {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.user.id === user_id) {
            dispatch(setMessageReadType(MessageReadType.Unread));
          } else {
            dispatch(setMessageReadType(MessageReadType.Empty));
          }
        }
      } else {
        dispatch(setMessageReadType(MessageReadType.Empty));
      }

      const handleMessageNew = event => {
        // console.log('------handleMessageNew----', event);
        messages = [...messages, event.message];
        if (event.user.id === user_id) {
          // tin nhắn mới tôi gửi
          setReadBy([]);
          dispatch(setMessageReadType(MessageReadType.Unread));
        } else {
          // tin nhắn mới người khác gửi
          dispatch(setMessageReadType(MessageReadType.Read));

          const obj = {
            last_read: event.received_at,
            last_read_message_id: event.message.id,
            unread_messages: 0,
            user: event.user,
          };
          setReadBy([obj]);
        }
      };

      const handleMessageRead = event => {
        // console.log('------handleMessageRead----', event);
        dispatch(setMessageReadType(MessageReadType.Read));

        const obj = {
          last_read: event.received_at,
          last_read_message_id: event.last_read_message_id,
          unread_messages: 0,
          user: event.user,
        };

        if (event.user.id !== user_id) {
          // tin nhắn mới người khác đọc
          setReadBy(prev =>
            [...prev, obj].filter((item, index, self) => index === self.findIndex(t => t.user.id === item.user.id)),
          );
        }
      };

      const handleMessageDeleted = event => {
        messages = messages.filter(msg => msg.id !== event.message.id);
        if (messages.length === 0) {
          dispatch(setMessageReadType(MessageReadType.Empty));
        }
      };

      currentChannel.on(ClientEvents.MessageNew, handleMessageNew);
      currentChannel.on(ClientEvents.MessageRead, handleMessageRead);
      currentChannel.on(ClientEvents.MessageDeleted, handleMessageDeleted);

      return () => {
        currentChannel.off(ClientEvents.MessageNew, handleMessageNew);
        currentChannel.off(ClientEvents.MessageRead, handleMessageRead);
        currentChannel.off(ClientEvents.MessageDeleted, handleMessageDeleted);
      };
    }
  }, [currentChannel, user_id]);

  const renderReadBy = () => {
    switch (messageReadType) {
      case MessageReadType.Empty:
        return null;
      case MessageReadType.Unread:
        return (
          <Tooltip title="Sent" placement="left">
            <CheckCircle size={22} color={theme.palette.grey[500]} />
          </Tooltip>
        );
      case MessageReadType.Read:
        return (
          <Tooltip title={`${readBy.length} members have seen`} placement="left">
            <StyledAvatarGroup max={5} spacing={2} onClick={() => setIsOpen(true)}>
              {readBy.map(item => {
                const memberInfo = getMemberInfo(item.user.id, all_members);
                return <MemberAvatar key={item.user.id} member={memberInfo} width={18} height={18} />;
              })}
            </StyledAvatarGroup>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent="flex-end"
      sx={{ position: 'absolute', bottom: '-25px', right: '0px', zIndex: 1 }}
    >
      {renderReadBy()}

      {isOpen && (
        <Dialog
          fullWidth
          maxWidth="xs"
          open={isOpen}
          TransitionComponent={Transition}
          onClose={() => setIsOpen(false)}
          // sx={{ p: 4 }}
        >
          <DialogTitle>{'Members have seen the message'}</DialogTitle>
          <DialogContent sx={{ mt: 4 }}>
            {readBy.length ? (
              <List>
                {readBy.map(item => {
                  const memberInfo = getMemberInfo(item.user.id, all_members);
                  return (
                    <ListItem alignItems="flex-start" key={item.user.id}>
                      <ListItemAvatar>
                        <MemberAvatar member={memberInfo} width={40} height={40} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={formatString(memberInfo?.name)}
                        secondary={<>{!isNaN(new Date(item.last_read)) ? fDateTime(item.last_read) : 'Invalid date'}</>}
                      />
                    </ListItem>
                  );
                })}
              </List>
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
                Empty
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Stack>
  );
}
