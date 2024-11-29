import React, { useEffect, useState } from 'react';
import { IconButton, styled } from '@mui/material';
import { ArrowDown } from 'phosphor-react';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: '20px',
  bottom: '200px',
  zIndex: 1,
  backgroundColor: theme.palette.mode === 'light' ? '#FFF' : theme.palette.background.neutral,
  transition: 'all .2s',
  '& .MuiBadge-badge': {
    top: '-15px',
    right: '-5px',
  },
}));

const ScrollToBottom = ({ messageListRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const chatContainer = messageListRef.current;
    chatContainer.addEventListener('scroll', handleScroll);
    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
    };
  }, [messageListRef]);

  const handleScroll = () => {
    const chatContainer = messageListRef.current;

    if (chatContainer && chatContainer.scrollTop < 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToBottom = () => {
    const chatContainer = messageListRef.current;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    setIsVisible(false);
  };

  return (
    <StyledIconButton
      size={'large'}
      onClick={scrollToBottom}
      sx={{ opacity: isVisible ? 1 : 0, visibility: isVisible ? 'visible' : 'hidden' }}
    >
      <ArrowDown size={20} />
    </StyledIconButton>
  );
};

export default ScrollToBottom;
