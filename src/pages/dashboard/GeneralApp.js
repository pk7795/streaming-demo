import React, { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Stack, Typography } from '@mui/material';
import ChatComponent from './ChatComponent';
import NoChat from '../../assets/Illustration/NoChat';
import { useDispatch, useSelector } from 'react-redux';
import ChannelInfo from '../../sections/dashboard/ChannelInfo';
import Members from '../../sections/dashboard/Members';
import { OpenDialogCreateChannel, OpenDialogNewDirectMessage } from '../../redux/slices/dialog';
import ProfileDialog from '../../sections/dashboard/ProfileDialog';
import ChannelConfirmDialog from '../../sections/dashboard/ChannelConfirmDialog';
import ClientsTabPanel from './ClientsTabPanel';
import { User, UsersThree } from 'phosphor-react';
import { SidebarType } from '../../constants/commons-const';
import ChannelPermissions from '../../sections/dashboard/ChannelPermissions';
import ChannelMedia from '../../sections/dashboard/ChannelMedia';
import ChannelAdministrators from '../../sections/dashboard/ChannelAdministrators';
import ChannelBannedUsers from '../../sections/dashboard/ChannelBannedUsers';
import ChannelSearch from '../../sections/dashboard/ChannelSearch';
import ChannelKeywordFiltering from '../../sections/dashboard/ChannelKeywordFiltering';
import { LoadingSpinner } from '../../components/animate';
import { useParams, useNavigate } from 'react-router-dom';
import { splitChannelId } from '../../utils/commons';
import { ConnectCurrentChannel } from '../../redux/slices/channel';
import { DEFAULT_PATH } from '../../config';
import ChannelNotFound from '../../sections/dashboard/ChannelNotFound';

const GeneralApp = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();

  const { currentChannel, loadingChannel, errorChannel } = useSelector(state => state.channel);

  const { sideBar } = useSelector(state => state.app);
  const { openDialogProfile, channelConfirm } = useSelector(state => state.dialog);
  const { projectCurrent } = useSelector(state => state.wallet);
  const { all_members } = useSelector(state => state.member);

  const { id } = useParams();

  useEffect(() => {
    if (id && all_members.length) {
      const result = splitChannelId(id);
      if (result) {
        dispatch(ConnectCurrentChannel(result.channelId, result.channelType));
      } else {
        navigate(`${DEFAULT_PATH}`);
      }
    }
  }, [dispatch, id, all_members]);

  return (
    <>
      <Stack
        className={theme.palette.mode === 'light' ? 'lightTheme' : 'darkTheme'}
        direction="row"
        sx={{ width: 'calc(100% - 100px)', height: '100%' }}
      >
        <ClientsTabPanel />
        <Box
          sx={{
            height: '100%',
            width: sideBar.open ? 'calc(100% - 640px )' : 'calc(100% - 320px )',
            backgroundColor: theme.palette.mode === 'light' ? '#FFF' : theme.palette.background.paper,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {loadingChannel && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 10,
                backgroundColor: theme.palette.mode === 'light' ? '#F0F4FA' : theme.palette.background.default,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <LoadingSpinner />
            </Box>
          )}

          {currentChannel ? (
            <ChatComponent />
          ) : (
            <>
              {errorChannel ? (
                <ChannelNotFound />
              ) : (
                <Stack spacing={2} sx={{ height: '100%', width: '100%' }} alignItems="center" justifyContent={'center'}>
                  <NoChat />
                  <Typography variant="subtitle2">
                    {projectCurrent ? (
                      <>
                        Select a conversation or start a new one
                        <br />
                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ marginTop: '15px' }}>
                          <Button
                            variant="outlined"
                            sx={{ textTransform: 'none' }}
                            onClick={() => dispatch(OpenDialogCreateChannel())}
                          >
                            <UsersThree size={20} />
                            &nbsp;New channel
                          </Button>
                          <Button
                            variant="outlined"
                            sx={{ textTransform: 'none' }}
                            onClick={() => dispatch(OpenDialogNewDirectMessage())}
                          >
                            <User size={16} />
                            &nbsp;New direct
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      'Please select a project to start chatting.'
                    )}
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </Box>
        {sideBar.open &&
          (() => {
            switch (sideBar.type) {
              case SidebarType.Channel:
                return <ChannelInfo />;

              case SidebarType.Members:
                return <Members />;

              case SidebarType.Permissions:
                return <ChannelPermissions />;

              case SidebarType.Media:
                return <ChannelMedia />;

              case SidebarType.Administrators:
                return <ChannelAdministrators />;

              case SidebarType.BannedUsers:
                return <ChannelBannedUsers />;

              case SidebarType.SearchMessage:
                return <ChannelSearch />;

              case SidebarType.KeywordFiltering:
                return <ChannelKeywordFiltering />;

              default:
                break;
            }
          })()}
      </Stack>
      {openDialogProfile && <ProfileDialog />}
      {channelConfirm?.openDialog && <ChannelConfirmDialog />}
    </>
  );
};

export default GeneralApp;
