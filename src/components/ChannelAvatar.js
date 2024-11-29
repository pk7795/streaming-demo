import * as React from 'react';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import getColorName from '../utils/getColorName';
import { useEffect } from 'react';
import { useState } from 'react';
import capitalizeFirstLetter from '../utils/commons';
import { useTheme } from '@emotion/react';
import { ChatType } from '../constants/commons-const';
import { useSelector } from 'react-redux';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    '& .MuiAvatar-root': {
      // fontSize: '1rem',
      // fontWeight: '400',
    },
  },
}));

const SmallAvatar = styled(Avatar)(({ theme }) => ({
  border: `1px solid ${theme.palette.background.paper}`,
}));

export default function ChannelAvatar({ channel, width, height }) {
  const theme = useTheme();
  const { user_id } = useSelector(state => state.auth);
  const { all_members } = useSelector(state => state.member);
  const [directMember, setDirectMember] = useState({ name: '', avatar: '' });
  const [groupMemberFirst, setGroupMemberFirst] = useState({ name: '', avatar: '' });
  const [groupMemberSecond, setGroupMemberSecond] = useState({ name: '', avatar: '' });

  const isDirect = channel.data.type === ChatType.MESSAGING;
  const channelAvatar = channel.data.image;

  useEffect(() => {
    const members = Object.values(channel.state.members);
    if (isDirect) {
      const otherMember = members.find(member => member.user_id !== user_id);
      if (otherMember) {
        const userInfo = all_members && all_members.find(user => user.id === otherMember.user.id);
        setDirectMember(userInfo ? userInfo : { name: otherMember.user.id, avatar: '' });
      } else {
        setDirectMember({ name: '', avatar: '' });
      }
    } else {
      const firstMember = members ? members[0] : null;

      if (firstMember) {
        const memberInfoFirst = all_members && all_members.find(user => user.id === firstMember.user.id);
        setGroupMemberFirst(memberInfoFirst ? memberInfoFirst : { name: firstMember.user.id, avatar: '' });
      } else {
        setGroupMemberFirst({ name: '', avatar: '' });
      }

      const secondMember = members ? members[1] : null;

      if (secondMember) {
        const memberInfoSecond = all_members && all_members.find(user => user.id === secondMember.user.id);
        setGroupMemberSecond(memberInfoSecond ? memberInfoSecond : { name: secondMember.user.id, avatar: '' });
      } else {
        setGroupMemberSecond({ name: '', avatar: '' });
      }
    }
  }, [channel, isDirect, user_id, all_members]);

  const getSizeSmallAvatar = size => {
    return (62.5 * size) / 100;
  };

  const getFontSizeAvatar = size => {
    return `${size / 2}px`;
  };

  return (
    <Stack direction="row" spacing={2} sx={{ position: 'relative' }}>
      {isDirect ? (
        <Avatar
          alt={capitalizeFirstLetter(directMember?.name)}
          src={directMember && directMember.avatar ? directMember.avatar : directMember.name}
          sx={{
            background:
              directMember && directMember.avatar ? theme.palette.background.paper : getColorName(directMember.name),
            color: '#fff',
            width: width,
            height: height,
            border: `1px solid ${theme.palette.background.paper}`,
            fontSize: getFontSizeAvatar(width),
          }}
        />
      ) : channelAvatar ? (
        <Avatar
          src={channelAvatar}
          sx={{
            background: theme.palette.background.paper,
            width: width,
            height: height,
            border: `1px solid ${theme.palette.background.paper}`,
          }}
        />
      ) : (
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <SmallAvatar
              alt={capitalizeFirstLetter(groupMemberFirst.name)}
              src={groupMemberFirst && groupMemberFirst.avatar ? groupMemberFirst.avatar : groupMemberFirst.name}
              sx={{
                background:
                  groupMemberFirst && groupMemberFirst.avatar
                    ? theme.palette.background.paper
                    : getColorName(groupMemberFirst.name),
                color: '#fff',
                fontWeight: '400',
                fontSize: getFontSizeAvatar(getSizeSmallAvatar(width)),
                width: getSizeSmallAvatar(width),
                height: getSizeSmallAvatar(height),
              }}
            />
          }
        >
          <Avatar
            alt={capitalizeFirstLetter(groupMemberSecond.name)}
            src={groupMemberSecond && groupMemberSecond.avatar ? groupMemberSecond.avatar : groupMemberSecond.name}
            sx={{
              background:
                groupMemberSecond && groupMemberSecond.avatar
                  ? theme.palette.background.paper
                  : getColorName(groupMemberSecond.name),
              color: '#fff',
              width: width,
              height: height,
              border: `1px solid ${theme.palette.background.paper}`,
              fontSize: getFontSizeAvatar(width),
            }}
          />
        </StyledBadge>
      )}
    </Stack>
  );
}
