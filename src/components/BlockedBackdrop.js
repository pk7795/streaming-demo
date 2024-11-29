import React, { useEffect, useState } from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { ClientEvents } from '../constants/events-const';
import { ConfirmType } from '../constants/commons-const';
import { setChannelConfirm } from '../redux/slices/dialog';

export default function BlockedBackdrop() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      const membership = currentChannel.state.membership;
      const blocked = membership?.blocked ?? false;
      setIsBlocked(blocked);

      const handleMemberBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(true);
        }
      };

      const handleMemberUnBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(false);
        }
      };

      currentChannel.on(ClientEvents.MemberBlocked, handleMemberBlocked);
      currentChannel.on(ClientEvents.MemberUnblocked, handleMemberUnBlocked);

      return () => {
        currentChannel.off(ClientEvents.MemberBlocked, handleMemberBlocked);
        currentChannel.off(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
      };
    }
  }, [currentChannel, user_id]);

  if (!isBlocked) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '90px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
      }}
    >
      <Button
        variant="contained"
        sx={{ textTransform: 'none', position: 'absolute', top: '-65px', right: '210px' }}
        onClick={() => {
          const payload = {
            openDialog: true,
            channel: currentChannel,
            userId: user_id,
            type: ConfirmType.UNBLOCK,
          };
          dispatch(setChannelConfirm(payload));
        }}
      >
        Unblock
      </Button>
      {/* <Box sx={{ position: 'absolute', width: '100%', height: '90px', top: 0, left: 0 }} /> */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '80px',
          bottom: 0,
          left: 0,
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
        }}
      />
    </Box>
  );
}
