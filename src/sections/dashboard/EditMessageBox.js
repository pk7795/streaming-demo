import React from 'react';
import { Stack, useTheme, Typography, Box, IconButton } from '@mui/material';
import { useDispatch } from 'react-redux';
import { PencilSimple, X } from 'phosphor-react';
import { onEditMessage } from '../../redux/slices/messages';

const EditMessageBox = ({ editMessage }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { messageText } = editMessage;

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

          <Box sx={{ paddingLeft: '10px', width: 'calc(100% - 50px)' }}>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text,
                fontSize: 12,
              }}
            >
              <PencilSimple size={12} />
              <span>&nbsp;&nbsp;Edit message</span>
            </Typography>

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
              {messageText}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <IconButton
        sx={{ position: 'absolute', top: '10px', right: '10px' }}
        onClick={() => dispatch(onEditMessage(null))}
      >
        <X size={20} />
      </IconButton>
    </Stack>
  );
};

export default EditMessageBox;
