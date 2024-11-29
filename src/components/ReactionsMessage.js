import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Stack, Tooltip, styled, Box } from '@mui/material';
import { EMOJI_QUICK } from '../constants/commons-const';
import { getMemberInfo, handleError } from '../utils/commons';
import { useDispatch, useSelector } from 'react-redux';

const StyledReactions = styled(Stack)(({ theme }) => ({
  '&.reactionsMyMessage': {
    '& .MuiBox-root': {
      marginLeft: 3,
      marginRight: 0,
    },
  },

  '& .MuiBox-root': {
    marginRight: 3,
  },
}));

export default function ReactionsMessage({ isMyMessage, message }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { all_members } = useSelector(state => state.member);
  const { user_id } = useSelector(state => state.auth);
  const { currentChannel } = useSelector(state => state.channel);

  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const newArr = Object.keys(message.reaction_counts).map(type => {
      const reactorIds = message.latest_reactions
        .filter(reaction => reaction.type === type)
        .map(reaction => reaction.user_id);
      const objReaction = EMOJI_QUICK.find(item => item.type === type);
      const value = objReaction ? objReaction.value : '';
      const isMyReact = !!reactorIds.includes(user_id);
      return { type, value, count: message.reaction_counts[type], reactorIds, isMyReact };
    });
    setReactions(newArr);
  }, [message]);

  const onDeleteReaction = async type => {
    const messageID = message.id;
    await currentChannel.deleteReaction(messageID, type);
  };

  const onSendReaction = async type => {
    const messageID = message.id;

    await currentChannel.sendReaction(messageID, type);
  };

  const onToggleReaction = async data => {
    try {
      if (data.isMyReact) {
        await onDeleteReaction(data.type);
      } else {
        await onSendReaction(data.type);
      }
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  return (
    <StyledReactions
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      sx={{ justifyContent: isMyMessage ? 'right' : 'left', marginTop: '3px' }}
      className={isMyMessage ? 'reactionsMyMessage' : ''}
    >
      {reactions.map((item, idx) => {
        const reactorsName = item.reactorIds.map(reactorId => {
          const reactor = getMemberInfo(reactorId, all_members);
          return reactor ? reactor.name : '';
        });

        return (
          <Tooltip
            key={idx}
            placement="top"
            title={reactorsName.map((name, idx) => {
              return (
                <span key={idx} style={{ display: 'block' }}>
                  {name}
                </span>
              );
            })}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.divider,
                borderRadius: '5px',
                fontSize: '12px',
                padding: '2px 5px',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${item.isMyReact ? theme.palette.action.active : 'transparent'}`,
              }}
              onClick={() => onToggleReaction(item)}
            >
              <span>{item.value}</span>
              <span style={{ marginLeft: 5 }}>{item.count}</span>
            </Box>
          </Tooltip>
        );
      })}
    </StyledReactions>
  );
}
