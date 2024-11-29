import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import getColorName from '../utils/getColorName';
import capitalizeFirstLetter from '../utils/commons';
import { useTheme } from '@emotion/react';
import { GlobeHemisphereWest } from 'phosphor-react';

export default function AvatarComponent({ name = '', url = '', width, height, isPublic = false }) {
  const theme = useTheme();

  const getFontSizeAvatar = size => {
    return `${size / 2}px`;
  };

  const renderIconPublic = () => {
    if (isPublic) {
      return (
        <GlobeHemisphereWest
          weight="fill"
          size={width / 2.5}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            zIndex: 1,
            margin: 0,
            color: '#4A90E2',
          }}
        />
      );
    }
    return null;
  };

  return (
    <Stack direction="row" sx={{ position: 'relative' }}>
      <Avatar
        alt={capitalizeFirstLetter(name)}
        src={url ? url : name}
        sx={{
          background: getColorName(name),
          color: '#fff',
          width: width,
          height: height,
          border: `1px solid ${theme.palette.background.paper}`,
          fontSize: getFontSizeAvatar(width),
        }}
      />

      {renderIconPublic()}
    </Stack>
  );
}
