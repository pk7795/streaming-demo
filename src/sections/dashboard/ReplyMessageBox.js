import React from 'react';
import { Stack, useTheme, Typography, Box, IconButton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Quotes, X } from 'phosphor-react';
import { formatString, getIconAttachment, getMemberInfo } from '../../utils/commons';
import { onReplyMessage } from '../../redux/slices/messages';

const ReplyMessageBox = ({ quotesMessage }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { all_members } = useSelector(state => state.member);
  const { mentions } = useSelector(state => state.channel);

  const attachment = quotesMessage && quotesMessage.attachments ? quotesMessage.attachments[0] : null;
  const memberInfo = getMemberInfo(quotesMessage?.user.id, all_members);
  const name = memberInfo ? formatString(memberInfo.name) : formatString(quotesMessage?.user.id);

  const replaceMentionsWithNames = inputValue => {
    mentions.forEach(user => {
      inputValue = inputValue.replaceAll(user.mentionId, user.mentionName);
    });
    return inputValue;
  };

  return (
    <Stack sx={{ paddingBottom: '16px', position: 'relative' }}>
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
          borderRadius: 1.5,
          width: '100%',
          position: 'relative',
        }}
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
          <Box sx={{ paddingLeft: '10px', width: 'calc(100% - 50px)' }}>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text,
                fontSize: 12,
              }}
            >
              <Quotes size={12} weight="fill" />
              <span>&nbsp;&nbsp;Reply to&nbsp;</span>
              <strong> {name}</strong>
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
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {replaceMentionsWithNames(quotesMessage.text)}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <IconButton
        sx={{ position: 'absolute', top: '10px', right: '10px' }}
        onClick={() => dispatch(onReplyMessage(null))}
      >
        <X size={20} />
      </IconButton>
    </Stack>
  );
};

export default ReplyMessageBox;
