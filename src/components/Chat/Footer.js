import { Box, IconButton, InputAdornment, Stack, TextField, Popover, Paper, Typography, Alert } from '@mui/material';
import { File, FileAudio, FilePdf, FileVideo, FileZip, LinkSimple, PaperPlaneTilt, Smiley, X } from 'phosphor-react';
import { useTheme, styled } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';
import useResponsive from '../../hooks/useResponsive';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingSpinner } from '../animate';
import { getSizeInMb, handleError, isChannelDirect, myRoleInChannel } from '../../utils/commons';
import { onEditMessage, onReplyMessage } from '../../redux/slices/messages';
import ReplyMessageBox from '../../sections/dashboard/ReplyMessageBox';
import EditMessageBox from '../../sections/dashboard/EditMessageBox';
import { showSnackbar } from '../../redux/slices/app';
import CooldownMessage from '../CooldownMessage';
import * as linkify from 'linkifyjs';
import { RoleMember } from '../../constants/commons-const';
import Mentions from '../Mentions';
import { ClientEvents } from '../../constants/events-const';
import { AddMention, RemoveMention } from '../../redux/slices/channel';

const StyledInput = styled(TextField)(({ theme }) => ({
  '& .MuiFilledInput-root': {
    padding: '12px 90px 12px 12px',
    flexWrap: 'wrap',
  },
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ChatInput = ({
  setValue,
  value,
  inputRef,
  setAnchorElPicker,
  onChangeUpload,
  files,
  onRemoveFile,
  checkSendLinks,
  checkHaveFilterWords,
  onKeyDown,
  onKeyUp,
}) => {
  const dispatch = useDispatch();
  const renderMedia = data => {
    const stylePaper = {
      borderRadius: '12px',
      height: '80px',
      padding: '12px',
      width: '150px',
    };

    const styleText = {
      display: '-webkit-box',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      WebkitLineClamp: 2,
      lineClamp: 2,
      WebkitBoxOrient: 'vertical',
      wordBreak: 'break-word',
      lineHeight: '1.2',
      fontSize: '14px',
    };

    const fileType = data.type.split('/')[0];

    const sizeInMB = getSizeInMb(data.size);

    switch (fileType) {
      case 'image':
        return (
          <img
            src={data.url}
            alt={data.name}
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }}
          />
        );
      case 'video':
        return (
          <Paper elevation={3} sx={stylePaper}>
            <Stack direction="row">
              <FileVideo size={26} style={{ marginRight: 10 }} />
              <div style={{ flex: 1 }}>
                <Typography variant="body2" sx={styleText} title={data.name}>
                  {data.name}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12, color: '#666' }}>
                  {sizeInMB}
                </Typography>
              </div>
            </Stack>
          </Paper>
        );
      case 'audio':
        return (
          <Paper elevation={3} sx={stylePaper}>
            <Stack direction="row">
              <FileAudio size={26} style={{ marginRight: 10 }} />
              <div style={{ flex: 1 }}>
                <Typography variant="body2" sx={styleText} title={data.name}>
                  {data.name}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12, color: '#666' }}>
                  {sizeInMB}
                </Typography>
              </div>
            </Stack>
          </Paper>
        );
      case 'application':
        return (
          <Paper elevation={3} sx={stylePaper}>
            <Stack direction="row">
              {data.type === 'application/pdf' ? (
                <FilePdf size={26} style={{ marginRight: 10 }} />
              ) : data.type === 'application/zip' ? (
                <FileZip size={26} style={{ marginRight: 10 }} />
              ) : (
                <File size={26} style={{ marginRight: 10 }} />
              )}
              <div style={{ flex: 1 }}>
                <Typography variant="body2" sx={styleText} title={data.name}>
                  {data.name}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12, color: '#666' }}>
                  {sizeInMB}
                </Typography>
              </div>
            </Stack>
          </Paper>
        );

      default:
        return (
          <Paper elevation={3} sx={stylePaper}>
            <Stack direction="row">
              <File size={26} style={{ marginRight: 10 }} />
              <div style={{ flex: 1 }}>
                <Typography variant="body2" sx={styleText} title={data.name}>
                  {data.name}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12, color: '#666' }}>
                  {sizeInMB}
                </Typography>
              </div>
            </Stack>
          </Paper>
        );
    }
  };

  return (
    <StyledInput
      inputRef={inputRef}
      value={value}
      onChange={event => {
        const value = event.target.value;
        setValue(value);

        if (checkSendLinks(value)) {
          dispatch(
            showSnackbar({ severity: 'error', message: 'Members in this channel are not allowed to send links' }),
          );
        }

        if (checkHaveFilterWords(value)) {
          dispatch(showSnackbar({ severity: 'error', message: 'The content you entered contains blocked keywords' }));
        }
      }}
      fullWidth
      placeholder="Write a message..."
      variant="filled"
      multiline
      maxRows={3}
      InputProps={{
        disableUnderline: true,
        startAdornment: (
          <div style={{ padding: '10px 0', overflowX: 'auto', display: 'flex' }}>
            {files.map((item, index) => {
              return (
                <div style={{ position: 'relative', marginRight: 10, flex: 'none' }} key={index}>
                  {item.loading ? (
                    <Box
                      sx={{
                        backgroundColor: '#d6d6d6',
                        borderRadius: '12px',
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <LoadingSpinner />
                    </Box>
                  ) : item.error ? (
                    <Alert severity="error" sx={{ height: '80px', alignItems: 'center' }}>
                      Error
                    </Alert>
                  ) : (
                    renderMedia(item)
                  )}

                  <IconButton
                    edge="end"
                    aria-label="remove"
                    onClick={() => onRemoveFile(index)}
                    sx={{ position: 'absolute', top: '-10px', right: '5px', backgroundColor: '#fff', padding: '2px' }}
                  >
                    <X size={20} />
                  </IconButton>
                </div>
              );
            })}
          </div>
        ),
        endAdornment: (
          <Stack sx={{ position: 'absolute', bottom: '22px', right: '10px' }}>
            <InputAdornment position="end">
              <IconButton
                onClick={event => {
                  setAnchorElPicker(inputRef.current);
                }}
              >
                <Smiley />
              </IconButton>
              <IconButton component="label">
                <LinkSimple />
                <VisuallyHiddenInput type="file" multiple onChange={onChangeUpload} />
              </IconButton>
            </InputAdornment>
          </Stack>
        ),
      }}
      // onKeyPress={ev => {
      //   if (ev.key === 'Enter' && !ev.shiftKey) {
      //     ev.preventDefault();
      //     sendMessage();
      //   } else {
      //     onTyping();
      //   }
      // }}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    />
  );
};

const ChatFooter = ({ currentChannel, setMessages }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useResponsive('between', 'md', 'xs', 'sm');
  const inputRef = useRef(null);

  const { quotesMessage, editMessage } = useSelector(state => state.messages);
  const { canSendMessage, canSendLinks } = useSelector(state => state.channel.channelPermissions);
  const { cooldownTime, filterWords, mentions } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const [anchorElPicker, setAnchorElPicker] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingButton, setLoadingButton] = useState(false);
  const [value, setValue] = useState('');
  const [anchorElMention, setAnchorElMention] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState([]);
  const [selectedMentions, setSelectedMentions] = useState([]);

  const myRole = myRoleInChannel(currentChannel);
  const isDirect = isChannelDirect(currentChannel);

  const onTyping = async () => {
    try {
      await currentChannel.keystroke();
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current.focus();

      if (editMessage) {
        setValue(editMessage.messageText);
      } else if (currentChannel || quotesMessage) {
        setValue('');
        setFiles([]);
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [inputRef, currentChannel, quotesMessage, editMessage]);

  useEffect(() => {
    if (mentions.length) {
      const regexMention = /(^|\s)@([a-zA-Z0-9]+)?$/;
      const match = value.match(regexMention);

      if (match) {
        const query = match[2] ? match[2].toLowerCase() : '';
        const filtered = mentions.filter(
          mention =>
            mention.name.toLowerCase().includes(query) &&
            mention.id !== user_id &&
            !selectedMentions.some(selected => selected.id === mention.id),
        );
        const sortedMentions = filtered.sort((a, b) => a.name.localeCompare(b.name));

        setFilteredMentions(sortedMentions);
        setAnchorElMention(inputRef.current);
      } else {
        setFilteredMentions([]);
        setAnchorElMention(null);
      }
    }
  }, [value, mentions, inputRef, user_id, selectedMentions]);

  useEffect(() => {
    if (currentChannel) {
      const handleMemberBanned = event => {
        dispatch(RemoveMention(event.member.user_id));
      };

      const handleMemberUnBanned = event => {
        dispatch(AddMention(event.member.user_id));
      };

      currentChannel.on(ClientEvents.MemberBanned, handleMemberBanned);
      currentChannel.on(ClientEvents.MemberUnBanned, handleMemberUnBanned);

      return () => {
        currentChannel.off(ClientEvents.MemberBanned, handleMemberBanned);
        currentChannel.off(ClientEvents.MemberUnBanned, handleMemberUnBanned);
      };
    }
  }, [currentChannel]);

  function handleEmojiClick(emoji) {
    const input = inputRef.current;

    if (input) {
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;

      setValue(value.substring(0, selectionStart) + emoji + value.substring(selectionEnd));

      // Move the cursor to the end of the inserted emoji
      input.selectionStart = input.selectionEnd = selectionStart + 1;
    }
  }

  const getThumbUrlVideo = async thumbBlob => {
    const response = await currentChannel.sendFile(thumbBlob);
    if (response) {
      return response.file;
    } else {
      return '';
    }
  };

  const onChangeUpload = async event => {
    const filesArr = Array.from(event.target.files).map(file => {
      const data = {
        loading: true,
        type: file.type,
        name: file.name,
        size: file.size,
        error: false,
        url: '',
      };
      return data;
    });

    setFiles(filesArr);

    Array.from(event.target.files).forEach(async file => {
      try {
        const type = file.type.split('/')[0];
        let thumb_url = '';
        if (type === 'video') {
          const thumbBlob = await currentChannel.getThumbBlobVideo(file);

          thumb_url = await getThumbUrlVideo(thumbBlob);
        } else {
          thumb_url = '';
        }

        const response = await currentChannel.sendFile(file);

        if (response) {
          setFiles(prev => {
            return prev.map(item => {
              if (item.name === file.name) {
                return {
                  ...item,
                  loading: false,
                  url: response.file,
                  thumb_url,
                };
              }
              return item;
            });
          });
        }
      } catch (error) {
        setFiles(prev => {
          return prev.map(item => {
            if (item.name === file.name) {
              return {
                ...item,
                loading: false,
                error: true,
              };
            }
            return item;
          });
        });
      }
    });
  };

  const onRemoveFile = index => {
    setFiles(prev => {
      return prev.filter((_, i) => i !== index);
    });
  };

  const getAttachments = () => {
    if (files.length === 0) return [];

    const attachments = files
      .filter(item => !item.error)
      .map(file => {
        const type = file.type.split('/')[0];
        switch (type) {
          case 'image':
            return {
              type: 'image',
              image_url: file.url,
              title: file.name,
              file_size: file.size,
              mime_type: file.type,
            };
          case 'video':
            return {
              type: 'video',
              asset_url: file.url,
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
              thumb_url: file.thumb_url,
            };
          case 'audio':
            return {
              type: 'file',
              asset_url: file.url,
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
            };
          case 'application':
            return {
              type: 'file',
              asset_url: file.url,
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
            };
          default:
            return {
              type: 'file',
              asset_url: file.url,
              mime_type: '',
              file_size: file.size ? file.size : 0,
              title: file.name,
            };
        }
      });
    return attachments || [];
  };

  const sendMessage = async () => {
    try {
      if (checkDisabledButton()) {
        return;
      }

      if (!canSendMessage) {
        dispatch(
          showSnackbar({ severity: 'error', message: 'You do not have permission to send message in this channel' }),
        );
        return;
      }

      if (cooldownTime) {
        return;
      }

      if (editMessage) {
        const { messageId, messageText } = editMessage;
        const isNewText = value.trim() !== messageText;

        if (isNewText) {
          setLoadingButton(true);
          const result = await currentChannel?.editMessage(messageId, value.trim());
          if (result) {
            setValue('');
            setFiles([]);
            setLoadingButton(false);
            dispatch(onEditMessage(null));
          }
        } else {
          dispatch(onEditMessage(null));
        }
      } else {
        const attachments = getAttachments();

        const payload = { text: value.trim(), attachments: attachments };

        if (quotesMessage) {
          payload.quoted_message_id = quotesMessage.id;
        }

        if (selectedMentions) {
          const mentionIds = selectedMentions.map(item => item.id);
          if (mentionIds.includes('all')) {
            payload.mentioned_all = true;
            payload.mentioned_users = [];
            payload.text = replaceMentionsWithIds(value.trim());
          } else {
            payload.mentioned_all = false;
            payload.mentioned_users = mentionIds;
            payload.text = replaceMentionsWithIds(value.trim());
          }
        }

        setLoadingButton(true);
        const result = await currentChannel?.sendMessage(payload);
        if (result) {
          setValue('');
          setFiles([]);
          setSelectedMentions([]);
          setLoadingButton(false);
          if (quotesMessage) {
            dispatch(onReplyMessage(null));
          }
        }
      }
    } catch (error) {
      setLoadingButton(false);

      if (error.response.status === 400) {
        handleError(dispatch, error);
      } else {
        const data = JSON.parse(error.config.data);
        const created_at = new Date();
        const message = { ...data.message, status: 'error', user: { id: user_id }, created_at, updated_at: null };
        setMessages(prevMessages => [...prevMessages, message]);

        setValue('');
        setFiles([]);
        if (quotesMessage) {
          dispatch(onReplyMessage(null));
        }
      }
    }
  };

  const checkSendLinks = value => {
    if (!canSendLinks && myRole === RoleMember.MEMBER && linkify.find(value).length > 0) {
      return true;
    }
    return false;
  };

  const checkHaveFilterWords = value => {
    const hasKeyword = filterWords.some(keyword => value.trim().toLowerCase().includes(keyword));
    if (hasKeyword) {
      return true;
    }
    return false;
  };

  const checkDisabledButton = () => {
    if (
      (value.trim() === '' && files.length === 0) ||
      (files.length > 0 && files.some(item => item.loading || item.error)) ||
      checkSendLinks(value) ||
      checkHaveFilterWords(value) ||
      loadingButton
    ) {
      return true;
    }
    return false;
  };

  const replaceMentionsWithIds = inputValue => {
    mentions.forEach(user => {
      inputValue = inputValue.replaceAll(user.mentionName, user.mentionId);
    });
    return inputValue;
  };

  const onKeyDown = e => {
    if (anchorElMention && filteredMentions.length) {
      if (e.key === 'ArrowDown') {
        setHighlightedIndex(prevIndex => (prevIndex < filteredMentions.length - 1 ? prevIndex + 1 : prevIndex));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        onSelectMention(filteredMentions[highlightedIndex]);
        e.preventDefault();
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        sendMessage();
        e.preventDefault();
      } else {
        onTyping();
      }
    }
  };

  const onKeyUp = e => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const cursorPosition = inputRef.current.selectionStart;
      let newValue = value;

      mentions.forEach(user => {
        const mentionIndex = newValue.indexOf(user.mentionName);
        if (
          mentionIndex !== -1 &&
          cursorPosition > mentionIndex &&
          cursorPosition <= mentionIndex + user.mentionName.length
        ) {
          newValue = newValue.slice(0, mentionIndex) + newValue.slice(mentionIndex + user.mentionName.length);
          setValue(newValue);

          // Di chuyển con trỏ về vị trí mới sau khi xoá mention
          inputRef.current.setSelectionRange(mentionIndex, mentionIndex);
        }
      });
      setSelectedMentions(prev => prev.filter(item => newValue.includes(item.mentionName)));
    }
  };

  const onSelectMention = mention => {
    const mentionText = `@${mention.name.toLowerCase()}`;
    setValue(prevValue => prevValue.replace(/@\w*$/, mentionText + ' '));
    setSelectedMentions(prev => {
      const updatedMentions = [...prev, mention];
      const uniqueMentions = Array.from(new Map(updatedMentions.map(item => [item.id, item])).values());
      return uniqueMentions;
    });
    setHighlightedIndex(0);
    setAnchorElMention(null);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        backgroundColor: 'transparent !important',
      }}
    >
      <Box
        p={isMobile ? 1 : 2}
        width={'100%'}
        sx={{
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
          boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
        }}
      >
        {quotesMessage && <ReplyMessageBox quotesMessage={quotesMessage} />}
        {editMessage && <EditMessageBox editMessage={editMessage} />}

        <Stack direction="row" alignItems={'center'} spacing={isMobile ? 1 : 3}>
          <Stack sx={{ width: 'calc(100% - 68px)' }}>
            {/* --------------------emoji picker-------------------- */}
            <Popover
              id={Boolean(anchorElPicker) ? 'picker-popover' : undefined}
              open={Boolean(anchorElPicker)}
              anchorEl={anchorElPicker}
              onClose={() => {
                setAnchorElPicker(null);
              }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 340,
              }}
            >
              <Picker
                theme={theme.palette.mode}
                data={data}
                onEmojiSelect={emoji => {
                  handleEmojiClick(emoji.native);
                }}
              />
            </Popover>
            {/* --------------------mentions-------------------- */}
            {!isDirect && (
              <Mentions
                filteredMentions={filteredMentions}
                anchorEl={anchorElMention}
                onSelectMention={onSelectMention}
                highlightedIndex={highlightedIndex}
              />
            )}

            {/* ------------Chat Input------------ */}
            <ChatInput
              inputRef={inputRef}
              value={value}
              setValue={setValue}
              setAnchorElPicker={setAnchorElPicker}
              onChangeUpload={onChangeUpload}
              files={files}
              onRemoveFile={onRemoveFile}
              checkSendLinks={checkSendLinks}
              checkHaveFilterWords={checkHaveFilterWords}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
            />
          </Stack>

          {cooldownTime ? (
            <CooldownMessage cooldownTime={cooldownTime} />
          ) : (
            <Box
              sx={{
                height: 48,
                width: 48,
                backgroundColor: theme.palette.primary.main,
                borderRadius: 1.5,
                pointerEvents: checkDisabledButton() ? 'none' : 'auto',
                opacity: checkDisabledButton() ? 0.3 : 1,
              }}
            >
              <Stack sx={{ height: '100%' }} alignItems={'center'} justifyContent="center">
                <IconButton onClick={sendMessage}>
                  {loadingButton ? <LoadingSpinner /> : <PaperPlaneTilt color="#ffffff" />}
                </IconButton>
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default ChatFooter;
