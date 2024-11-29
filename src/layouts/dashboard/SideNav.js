import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Badge, Box, IconButton, Stack } from '@mui/material';
import AntSwitch from '../../components/AntSwitch';
import useSettings from '../../hooks/useSettings';
import { Nav_Buttons } from '../../data';
import ProfileMenu from './ProfileMenu';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateTab } from '../../redux/slices/app';
import { TabType } from '../../constants/commons-const';
import MenuLogo from '../../components/MenuLogo';

const SideBar = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { tab } = useSelector(state => state.app);
  const { projectCurrent } = useSelector(state => state.wallet);
  const { pendingChannels } = useSelector(state => state.channel);

  const { onToggleMode } = useSettings();

  const selectedTab = tab;

  const handleChangeTab = index => {
    dispatch(UpdateTab({ tab: index }));
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100px',
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
        boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
      }}
    >
      <Stack
        alignItems={'center'}
        justifyContent="space-between"
        sx={{ height: '100%', padding: '15px 0', width: '100%' }}
      >
        <Stack alignItems={'center'} spacing={4} sx={{ width: '100%' }}>
          <MenuLogo />
          <Stack sx={{ width: 'max-content' }} direction="column" alignItems={'center'} spacing={3}>
            {Nav_Buttons.map(el => {
              const displayTab = (projectCurrent && el.index === TabType.Invite) || el.index === TabType.Chat;
              const isShowBadge = el.index === TabType.Invite && pendingChannels.length;
              const countInvite = isShowBadge ? pendingChannels.length : 0;
              return el.index === selectedTab ? (
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 1.5,
                    padding: '0px',
                    visibility: displayTab ? 'visible' : 'hidden',
                  }}
                  key={el.index}
                >
                  <Badge badgeContent={countInvite} color="error">
                    <IconButton
                      onClick={() => {
                        handleChangeTab(el.index);
                      }}
                      sx={{ width: 'max-content', color: '#ffffff' }}
                    >
                      {el.icon}
                    </IconButton>
                  </Badge>
                </Box>
              ) : (
                <Badge
                  key={el.index}
                  badgeContent={countInvite}
                  color="error"
                  sx={{ visibility: displayTab ? 'visible' : 'hidden' }}
                >
                  <IconButton
                    onClick={() => {
                      handleChangeTab(el.index);
                    }}
                    sx={{
                      width: 'max-content',
                      color: theme.palette.mode === 'light' ? '#080707' : theme.palette.text.primary,
                    }}
                  >
                    {el.icon}
                  </IconButton>
                </Badge>
              );
            })}
          </Stack>
        </Stack>
        <Stack spacing={4}>
          <AntSwitch defaultChecked={theme.palette.mode === 'dark'} onChange={onToggleMode} />
          {/* Profile Menu */}
          <ProfileMenu />
        </Stack>
      </Stack>
    </Box>
  );
};

export default SideBar;
