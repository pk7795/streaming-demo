import React, { useEffect, useRef } from 'react';
import { useTheme } from '@emotion/react';
import { Box, Fade, List, ListItemButton, ListItemAvatar, ListItemText, Popper, styled } from '@mui/material';
import { useSelector } from 'react-redux';
import { formatString, getMemberInfo } from '../utils/commons';
import MemberAvatar from './MemberAvatar';

const StyledMentionItem = styled(ListItemButton)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all .1s',
  padding: '8px',
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },

  '& .MuiListItemAvatar-root': {
    marginRight: '10px',
  },

  '& .MuiListItemText-root': {
    '& .MuiTypography-root.MuiListItemText-primary': {
      fontSize: '14px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },

    '& .MuiTypography-root.MuiListItemText-secondary': {
      fontSize: '12px',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  },
}));

export default function Mentions({ filteredMentions, anchorEl, onSelectMention, highlightedIndex }) {
  const theme = useTheme();
  const listRef = useRef(null);
  const { all_members } = useSelector(state => state.member);

  useEffect(() => {
    if (highlightedIndex !== -1 && listRef.current) {
      const listItem = listRef.current.children[highlightedIndex];
      listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedIndex]);

  if (filteredMentions.length === 0) return null;

  return (
    <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-start" transition sx={{ zIndex: 10 }}>
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Box
            sx={{
              border: 1,
              borderColor: 'grey.200',
              borderRadius: 1,
              bgcolor: 'background.paper',
              width: '230px',
            }}
            tabIndex={0}
          >
            <List ref={listRef} sx={{ maxHeight: '250px', overflowY: 'auto' }} className="customScrollbar">
              {filteredMentions.map((mention, index) => {
                const memberInfo = getMemberInfo(mention.id, all_members);
                return (
                  <StyledMentionItem
                    alignItems="center"
                    key={mention.id}
                    onClick={() => onSelectMention(mention)}
                    selected={index === highlightedIndex}
                  >
                    <ListItemAvatar>
                      <MemberAvatar
                        member={mention.id === 'all' ? { name: 'All', avatar: '', id: 'all' } : memberInfo}
                        width={24}
                        height={24}
                      />
                    </ListItemAvatar>
                    <ListItemText primary={formatString(mention.name)} secondary={formatString(mention.mentionName)} />
                  </StyledMentionItem>
                );
              })}
            </List>
          </Box>
        </Fade>
      )}
    </Popper>
  );
}
