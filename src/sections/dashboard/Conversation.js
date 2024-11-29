import React, { useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBendUpLeft, Copy, DotsThree, Smiley, Trash, PencilSimple } from 'phosphor-react';
import linkifyHtml from 'linkify-html';
import {
  checkPermissionDeleteMessage,
  formatString,
  getIconAttachment,
  getMemberInfo,
  handleError,
} from '../../utils/commons';
import { EMOJI_QUICK } from '../../constants/commons-const';
import { useDispatch, useSelector } from 'react-redux';
import { onDeleteMessage, onEditMessage, onReplyMessage } from '../../redux/slices/messages';
import Attachments from '../../components/Attachments';
import { showSnackbar } from '../../redux/slices/app';
import { SetCooldownTime } from '../../redux/slices/channel';
import { SetMessagesHistoryDialog } from '../../redux/slices/dialog';
import { fTime } from '../../utils/formatTime';

const QuickReaction = ({ message, setIsOpen, orderEmotion }) => {
  const dispatch = useDispatch();
  const { user_id } = useSelector(state => state.auth);

  const { currentChannel } = useSelector(state => state.channel);
  const { canReactMessage } = useSelector(state => state.channel.channelPermissions);

  const [anchorEl, setAnchorEl] = useState(null);

  const onReactMessage = async type => {
    try {
      const messageID = message.id;

      const response = await currentChannel.sendReaction(messageID, type);
      if (response) {
        setIsOpen(false);
        setAnchorEl(null);
      }
    } catch (error) {
      setIsOpen(false);
      setAnchorEl(null);
      handleError(dispatch, error);
    }
  };

  const my_reactions = message.latest_reactions
    ? message.latest_reactions.filter(item => item.user_id === user_id).map(item => item.type)
    : [];

  return (
    <>
      <Tooltip title="Emotion">
        <IconButton
          sx={{ order: orderEmotion }}
          onClick={event => {
            if (!canReactMessage) {
              dispatch(
                showSnackbar({
                  severity: 'error',
                  message: 'You do not have permission to react message in this channel',
                }),
              );
              return;
            }

            setAnchorEl(event.currentTarget);
            setIsOpen(true);
          }}
        >
          <Smiley size={18} />
        </IconButton>
      </Tooltip>
      <Popover
        id={Boolean(anchorEl) ? 'reaction-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setIsOpen(false);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ padding: '10px' }}>
          {EMOJI_QUICK.map(item => {
            return (
              <IconButton
                key={item.type}
                sx={{ fontSize: 14, width: 35, height: 35 }}
                onClick={() => onReactMessage(item.type)}
                disabled={my_reactions.includes(item.type)}
              >
                {item.value}
              </IconButton>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
};

const MoreOptions = ({ message, setIsOpen, orderMore, isMyMessage }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel } = useSelector(state => state.channel);
  const { canEditMessage, canDeleteMessage } = useSelector(state => state.channel.channelPermissions);

  const [anchorEl, setAnchorEl] = useState(null);

  const membership = currentChannel.state.membership;
  const channelType = currentChannel.type;
  const channelId = currentChannel.id;
  const messageId = message.id;
  const messageText = message.text;
  const isDelete = checkPermissionDeleteMessage(message, channelType, membership.user_id, membership.channel_role);
  const isEdit = isMyMessage && message.text;

  const onCoppyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      dispatch(showSnackbar({ severity: 'success', message: 'Text copied to clipboard!' }));
      setAnchorEl(null);
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to copy!' }));
      setAnchorEl(null);
    }
  };

  const onDelete = () => {
    if (!canDeleteMessage) {
      dispatch(
        showSnackbar({ severity: 'error', message: 'You do not have permission to delete message in this channel' }),
      );
      return;
    }

    dispatch(
      onDeleteMessage({
        openDialog: true,
        messageId,
      }),
    );
    setAnchorEl(null);
  };

  const onEdit = () => {
    if (!canEditMessage) {
      dispatch(
        showSnackbar({ severity: 'error', message: 'You do not have permission to edit message in this channel' }),
      );
      return;
    }

    dispatch(onEditMessage({ channelType, channelId, messageId, messageText }));
    dispatch(onReplyMessage(null));
    dispatch(SetCooldownTime(null));
    setAnchorEl(null);
    setIsOpen(false);
  };

  return (
    <>
      <Tooltip title="More">
        <IconButton
          sx={{ order: orderMore }}
          onClick={event => {
            setAnchorEl(event.currentTarget);
            setIsOpen(true);
          }}
        >
          <DotsThree size={18} />
        </IconButton>
      </Tooltip>
      <Popover
        id={Boolean(anchorEl) ? 'more-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setIsOpen(false);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <List>
          {/* ----------------------pin------------------------ */}
          {/* <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <PushPin size={18} />
              </ListItemIcon>
              <ListItemText
                primary="Pin"
                primaryTypographyProps={{
                  fontSize: '14px',
                }}
              />
            </ListItemButton>
          </ListItem> */}
          {/* ----------------------forward------------------------ */}
          {/* <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <ArrowBendUpRight size={18} />
              </ListItemIcon>
              <ListItemText
                primary="Forward"
                primaryTypographyProps={{
                  fontSize: '14px',
                }}
              />
            </ListItemButton>
          </ListItem> */}

          {/* ----------------------edit------------------------ */}
          {isEdit && (
            <ListItem disablePadding onClick={onEdit}>
              <ListItemButton>
                <ListItemIcon>
                  <PencilSimple size={18} />
                </ListItemIcon>
                <ListItemText
                  primary="Edit"
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------coppy text------------------------ */}
          {messageText && (
            <ListItem disablePadding>
              <ListItemButton onClick={onCoppyText}>
                <ListItemIcon>
                  <Copy size={18} />
                </ListItemIcon>
                <ListItemText
                  primary="Coppy text"
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------delete------------------------ */}
          {isDelete && (
            <ListItem disablePadding>
              <ListItemButton onClick={onDelete}>
                <ListItemIcon>
                  <Trash size={18} color={theme.palette.error.main} />
                </ListItemIcon>
                <ListItemText
                  primary="Delete"
                  primaryTypographyProps={{
                    fontSize: '14px',
                    color: theme.palette.error.main,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Popover>
    </>
  );
};

const MessageOption = ({ isMyMessage, message }) => {
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(false);

  const orderEmotion = isMyMessage ? 3 : 1;
  const orderReply = 2;
  const orderMore = isMyMessage ? 1 : 3;

  const onReply = () => {
    dispatch(onReplyMessage(message));
    dispatch(onEditMessage(null));
  };

  return (
    <Stack
      className={`messageActions ${isOpen ? 'open' : ''}`}
      direction="row"
      sx={{
        position: 'absolute',
        top: '50%',
        left: isMyMessage ? 'auto' : '100%',
        right: isMyMessage ? '100%' : 'auto',
        transform: 'translateY(-50%)',
        visibility: 'hidden',
      }}
    >
      <QuickReaction message={message} setIsOpen={setIsOpen} orderEmotion={orderEmotion} />
      <Tooltip title="Reply">
        <IconButton sx={{ order: orderReply }} onClick={onReply}>
          <ArrowBendUpLeft size={18} />
        </IconButton>
      </Tooltip>
      <MoreOptions message={message} setIsOpen={setIsOpen} orderMore={orderMore} isMyMessage={isMyMessage} />
    </Stack>
  );
};

const TextLine = ({ message }) => {
  const theme = useTheme();
  const { mentions } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const replaceMentionsWithNames = inputValue => {
    mentions.forEach(user => {
      if (user.mentionId === '@all') {
        inputValue = inputValue.replaceAll(
          user.mentionId,
          `<span class="mentionHighlight mentionAll">${user.mentionName}</span>`,
        );
      } else if (user.id === user_id) {
        inputValue = inputValue.replaceAll(
          user.mentionId,
          `<span class="mentionHighlight mentionMe">${user.mentionName}</span>`,
        );
      } else {
        inputValue = inputValue.replaceAll(user.mentionId, `<span class="mentionHighlight">${user.mentionName}</span>`);
      }
    });
    return inputValue;
  };

  const isEdited = message.updated_at;

  return (
    <>
      {message.text.split('\n').map((line, i) => {
        return (
          <Typography
            key={i}
            variant="body2"
            color={message.isMyMessage ? '#fff' : theme.palette.text}
            dangerouslySetInnerHTML={{
              __html: linkifyHtml(replaceMentionsWithNames(line), {
                target: '_blank',
                className: 'linkUrl',
                rel: 'noreferrer',
              }),
            }}
            sx={{ wordBreak: 'break-word' }}
          />
        );
      })}

      <Typography
        variant="body2"
        color={theme.palette.grey[400]}
        sx={{ textAlign: 'right', fontSize: '12px', marginLeft: '20px', marginTop: '5px', fontStyle: 'italic' }}
      >
        {isEdited && (
          <span className="underline" style={{ cursor: 'pointer', marginRight: '6px' }}>
            Edited
          </span>
        )}
        <span>{fTime(message.created_at)}</span>
      </Typography>
    </>
  );
};

const TextMsg = ({ el }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage
            ? theme.palette.primary.main
            : theme.palette.mode === 'light'
              ? '#fff'
              : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: '75%',
        }}
      >
        <TextLine message={el} />
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};

const AttachmentMsg = ({ el, menu }) => {
  const theme = useTheme();
  const attachments = el.attachments;

  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} sx={{ width: '100%' }}>
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage
            ? theme.palette.primary.main
            : theme.palette.mode === 'light'
              ? '#fff'
              : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: '75%',
        }}
      >
        <Stack spacing={1}>
          <Attachments attachments={attachments} />
          {el.text && (
            <>
              <TextLine message={el} />
            </>
          )}
        </Stack>
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};
const ReplyMsg = ({ el, all_members, onScrollToReplyMsg }) => {
  const theme = useTheme();
  const memberInfo = getMemberInfo(el.quoted_message.user.id, all_members);
  const name = memberInfo ? formatString(memberInfo.name) : formatString(el.quoted_message.user.id);
  const attachments = el.quoted_message.attachments;
  const attachment = attachments ? attachments[0] : null;

  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage
            ? theme.palette.primary.main
            : theme.palette.mode === 'light'
              ? '#fff'
              : theme.palette.background.neutral,
          borderRadius: 1.5,
          maxWidth: '75%',
          position: 'relative',
        }}
      >
        <Box
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
            borderRadius: 1.5,
            position: 'relative',
            marginBottom: '5px',
            cursor: 'pointer',
          }}
          onClick={() => onScrollToReplyMsg(el.quoted_message.id)}
        >
          <Stack direction="row">
            <Box
              sx={{
                width: '2px',
                backgroundColor: theme.palette.primary.main,
              }}
            />
            {attachment && (
              <Box sx={{ paddingLeft: '10px' }}>
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.image_url}
                    alt={attachment.title}
                    loading="lazy"
                    style={{ width: '24px', borderRadius: '12px', objectFit: 'cover' }}
                  />
                ) : (
                  getIconAttachment(attachment.mime_type, 24)
                )}
              </Box>
            )}
            <Box sx={{ flex: 1, paddingLeft: '10px', width: 'calc(100% - 50px)' }}>
              {el.quoted_message.deleted_at ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.grey[600],
                    fontSize: 12,
                    display: 'flex',
                  }}
                >
                  <Trash size={16} color={theme.palette.grey[600]} />
                  &nbsp;&nbsp;Message deleted
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {name}
                  </Typography>
                  {attachment && (
                    <Typography variant="body1" sx={{ fontSize: 12 }}>
                      {attachment.title}
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.grey[500],
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {el.quoted_message.text}
                  </Typography>
                </>
              )}
            </Box>
          </Stack>
        </Box>
        <TextLine message={el} />
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};

export { TextMsg, AttachmentMsg, ReplyMsg };
