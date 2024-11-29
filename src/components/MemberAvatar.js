import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import getColorName from '../utils/getColorName';
import capitalizeFirstLetter from '../utils/commons';
import { useTheme } from '@emotion/react';

export default function MemberAvatar({ member, width, height }) {
  const theme = useTheme();

  const getFontSizeAvatar = size => {
    return `${size / 2}px`;
  };

  if (!member) {
    return null;
  }

  return (
    <Avatar
      alt={capitalizeFirstLetter(member.name)}
      src={member.avatar ? member.avatar : member.name}
      sx={{
        background: member.avatar ? theme.palette.background.paper : getColorName(member.name),
        color: '#fff',
        width: width,
        height: height,
        border: `1px solid ${theme.palette.background.paper}`,
        fontSize: getFontSizeAvatar(width),
      }}
    />
  );
}
