import React, { useEffect, useState } from 'react';
import { useTheme } from '@emotion/react';
import { Box, Stack, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { downloadFile, getIconAttachment, getSizeInMb } from '../utils/commons';
import { SlideshowLightbox } from 'lightbox.js-react';
import { PlayCircle } from 'phosphor-react';
import { MediaType } from '../constants/commons-const';
import 'lightbox.js-react/dist/index.css';

export default function Attachments({ attachments }) {
  const theme = useTheme();
  const [medias, setMedias] = useState([]);
  const [indexMedia, setIndexMedia] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const attachmentsImageAndVideo = attachments.filter(
    attachment => attachment.type === 'image' || attachment.type === 'video',
  );
  const attachmentsOther = attachments.filter(attachment => attachment.type !== 'image' && attachment.type !== 'video');

  useEffect(() => {
    const attachmentsImageAndVideo = attachments.filter(
      attachment => attachment.type === 'image' || attachment.type === 'video',
    );
    if (attachmentsImageAndVideo.length > 0) {
      const newMedias = attachmentsImageAndVideo.map(item => {
        if (item.type === 'image') {
          return {
            type: MediaType.IMAGE,
            src: item.image_url,
            thumbnail: item.image_url,
            alt: item.title,
          };
        } else {
          return {
            type: MediaType.VIDEO,
            videoSrc: item.asset_url,
            thumbnail: item.thumb_url,
            alt: item.title,
            autoPlay: false,
          };
        }
      });

      setMedias(newMedias);
    } else {
      setMedias([]);
    }
  }, [attachments]);

  const getSizeMedia = index => {
    let width = '';
    let height = '';
    if (attachmentsImageAndVideo.length === 1) {
      width = '50%';
      height = '50%';
    } else if (attachmentsImageAndVideo.length === 2) {
      width = '50%';
      height = '25%';
    } else if (attachmentsImageAndVideo.length === 3) {
      if (index === 0) {
        width = '100%';
        height = '50%';
      } else {
        width = '50%';
        height = '50%';
      }
    } else {
      width = '50%';
      height = '50%';
    }

    return { width, height };
  };

  const renderAttachmentsImageAndVideo = () => {
    if (medias.length > 0) {
      const displayedAttachments = medias.slice(0, 4);
      const remainingCount = medias.length - displayedAttachments.length;
      return (
        <Stack direction="row" flexWrap="wrap" sx={{ width: '100%', height: '400px' }}>
          {displayedAttachments.map((item, index) => {
            const size = getSizeMedia(index);

            return (
              <Box key={index} sx={{ width: size.width, height: size.height, padding: '5px' }}>
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: '12px',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setIsOpen(true);
                    setIndexMedia(index);
                  }}
                >
                  {remainingCount !== 0 && index === displayedAttachments.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '0px',
                        left: '0px',
                        right: '0px',
                        bottom: '0px',
                        background: theme.palette.action.disabled,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#fff',
                        fontSize: '24px',
                        fontWeight: 700,
                      }}
                    >
                      +{remainingCount}
                    </Box>
                  )}
                  <img
                    src={item.thumbnail}
                    alt={item.alt}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                  />
                  {item.type === MediaType.VIDEO && (
                    <PlayCircle
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      size={40}
                      weight="fill"
                      color="#fff"
                    />
                  )}
                </Paper>
              </Box>
            );
          })}
        </Stack>
      );
    } else {
      return null;
    }
  };

  return (
    <Box sx={{}}>
      {/* <Stack direction="row" justifyContent="flex-end">
        {renderAttachmentsImageAndVideo()}
      </Stack> */}

      <SlideshowLightbox
        theme="lightbox"
        images={medias}
        startingSlideIndex={indexMedia}
        showThumbnails={true}
        open={isOpen}
        lightboxIdentifier="lbox1"
        onClose={() => {
          setIsOpen(false);
          setIndexMedia(0);
        }}
        downloadImages
        iconColor={theme.palette.grey[400]}
        imgAnimation="fade"
        animateThumbnails
        roundedImages
        modalClose="clickOutside"
        lightboxImgClass="slideItem"
      />

      {attachments.length > 0 && (
        <List>
          {attachments.map((item, index) => {
            const lastItem = index === attachments.length - 1;
            return (
              <ListItem key={index} disablePadding sx={{ marginBottom: lastItem ? '0px' : '10px' }}>
                <ListItemButton onClick={() => downloadFile(item.asset_url, item.title)}>
                  {item.mime_type && <ListItemIcon>{getIconAttachment(item.mime_type, 24)}</ListItemIcon>}
                  <ListItemText primary={item.title} secondary={getSizeInMb(item.file_size)} sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
}
