import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MagnifyingGlass, Phone, VideoCamera } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { setSidebar, showSnackbar } from '../../redux/slices/app';
import { useDispatch, useSelector } from 'react-redux';
import ChannelAvatar from '../ChannelAvatar';
import {
  getChannelName,
  handleError,
  isChannelDirect,
  isGuestInPublicChannel,
  isPublicChannel,
} from '../../utils/commons';
import { StartCallDirect } from '../../redux/slices/callDirect';
import { CallType, SidebarType } from '../../constants/commons-const';
import { LoadingButton } from '@mui/lab';
import { FetchChannels } from '../../redux/slices/channel';
import AvatarComponent from '../AvatarComponent';

const ChatHeader = ({ currentChannel }) => {
  const dispatch = useDispatch();
  const isMobile = useResponsive('between', 'md', 'xs', 'sm');
  const theme = useTheme();
  const { all_members } = useSelector(state => state.member);
  const { user_id } = useSelector(state => state.auth);
  const isDirect = isChannelDirect(currentChannel);
  const isPublic = isPublicChannel(currentChannel);

  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      setIsGuest(isGuestInPublicChannel(currentChannel));
    }
  }, [currentChannel]);

  const getReceiverId = () => {
    const members = Object.values(currentChannel.state.members);
    const receiverInfo = members.find(member => member.user_id !== user_id);
    if (receiverInfo) {
      return receiverInfo.user.id;
    } else {
      return '';
    }
  };

  const onStartCall = async callType => {
    const data = {
      callDirectData: {
        callerId: user_id,
        receiverId: getReceiverId(),
        cid: currentChannel.cid,
      },
      callDirectType: callType,
    };
    dispatch(StartCallDirect(data));
  };

  const onJoinChannel = async () => {
    try {
      const response = await currentChannel.acceptInvite('join');

      if (response) {
        if (response.ermis_code) {
          dispatch(showSnackbar({ severity: 'error', message: response.message }));
        } else {
          dispatch(FetchChannels());
          setIsGuest(false);
        }
      }
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
          width: '100%',
          height: '74px',
          padding: '8px 16px',
          boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Stack
          alignItems={'center'}
          direction={'row'}
          sx={{ width: '100%', height: '100%' }}
          justifyContent="space-between"
        >
          <Stack spacing={1} direction="row" alignItems="center">
            <Box>
              {isPublic ? (
                <AvatarComponent
                  name={currentChannel.data.name}
                  url={currentChannel.data.image}
                  width={40}
                  height={40}
                  isPublic={isPublic}
                />
              ) : (
                <ChannelAvatar channel={currentChannel} width={40} height={40} />
              )}
            </Box>

            <Stack spacing={0.2}>
              <Button
                onClick={() => {
                  dispatch(setSidebar({ type: SidebarType.Channel, open: true }));
                }}
                sx={{ textTransform: 'none', textAlign: 'left' }}
              >
                <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                  {getChannelName(currentChannel, all_members)}
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      color: theme.palette.grey[600],
                      fontSize: '12px',
                      fontWeight: 400,
                    }}
                  >
                    {!isDirect ? `${Object.values(currentChannel.state.members).length} members` : <>&nbsp;</>}
                  </Typography>
                </Typography>
              </Button>
            </Stack>
          </Stack>
          <Stack direction={'row'} alignItems="center" spacing={isMobile ? 1 : 3}>
            {isDirect && (
              <>
                <IconButton onClick={() => onStartCall(CallType.VIDEO)}>
                  <VideoCamera />
                </IconButton>
                <IconButton onClick={() => onStartCall(CallType.AUDIO)}>
                  <Phone />
                </IconButton>
              </>
            )}

            {!isMobile && !isGuest && (
              <IconButton
                onClick={() => {
                  dispatch(setSidebar({ type: SidebarType.SearchMessage, open: true }));
                }}
              >
                <MagnifyingGlass />
              </IconButton>
            )}

            {isGuest && (
              <LoadingButton variant="contained" onClick={onJoinChannel}>
                Join
              </LoadingButton>
            )}
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

export default ChatHeader;
