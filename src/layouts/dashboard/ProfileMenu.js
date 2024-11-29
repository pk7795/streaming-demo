import React from 'react';
import { Box, Divider, Fade, Menu, MenuItem, Stack, Typography } from '@mui/material';

import { Profile_Menu } from '../../data';
import { useDispatch, useSelector } from 'react-redux';
import { LogoutUser } from '../../redux/slices/auth';
import { OpenDialogProfile } from '../../redux/slices/dialog';
import MemberAvatar from '../../components/MemberAvatar';
import { formatString } from '../../utils/commons';

const ProfileMenu = () => {
  const { user } = useSelector(state => state.member);
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);
  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onLogout = () => {
    dispatch(LogoutUser());
  };

  return (
    <>
      <div onClick={handleClick} style={{ cursor: 'pointer' }}>
        <MemberAvatar member={user} width={40} height={40} />
      </div>

      <Menu
        MenuListProps={{
          'aria-labelledby': 'fade-button',
        }}
        TransitionComponent={Fade}
        id="profile-positioned-menu"
        aria-labelledby="profile-positioned-button"
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box p={1}>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', padding: '0 15px' }}>
              {formatString(user.name)}
            </Typography>
            <Divider />
            {Profile_Menu.map((el, idx) => (
              <MenuItem onClick={handleClose} key={idx}>
                <Stack
                  onClick={() => {
                    if (idx === 0) {
                      dispatch(OpenDialogProfile());
                    } else {
                      onLogout();
                    }
                  }}
                  sx={{ width: '100%' }}
                  direction="row"
                  alignItems={'center'}
                  justifyContent="space-between"
                >
                  <span>{el.title}</span>
                  {el.icon}
                </Stack>{' '}
              </MenuItem>
            ))}
          </Stack>
        </Box>
      </Menu>
    </>
  );
};

export default ProfileMenu;
