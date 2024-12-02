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
import ChannelNotFound from '../../sections/dashboard/ChannelNotFound';
import WhepViewer from '../stream/WhepViewer';
import { DEFAULT_PATH, DOMAIN_APP } from '../../config';
import { ClientEvents } from '../../constants/events-const';
import {
  FetchChannels,
} from '../../redux/slices/channel';
import { FetchAllMembers } from '../../redux/slices/member';
import { UpdateTab } from '../../redux/slices/app';
import { TabType } from '../../constants/commons-const';
import { LocalStorageKey } from '../../constants/localStorage-const';

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
  const [isStreaming, setIsStreaming] = React.useState(false);
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
    const defaultChannel = window.localStorage.getItem(LocalStorageKey.ChannelId);

    if (defaultChannel) {
      navigate(`${DEFAULT_PATH}/${defaultChannel}`);
    }
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
  return (
    <>
      <Stack
        className={theme.palette.mode === 'light' ? 'lightTheme' : 'darkTheme'}
        direction="row"
        sx={{ width: '100%', height: '100%' }}
      >
        {/* <ClientsTabPanel /> */}
        <WhepViewer showChat={() => setIsStreaming(true)} />
        <Box
          sx={{
            height: '100%',
            width: '25%',
            backgroundColor: theme.palette.mode === 'light' ? '#FFF' : theme.palette.background.paper,
            overflow: 'hidden',
            position: 'relative',
            borderWidth: 1,
            borderColor: '#E0E0E0',
          }}
        >
          {(loadingChannel || !isStreaming) && (
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
