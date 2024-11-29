import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Tabs,
  Tab,
  Grid,
  useTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import { ArrowLeft, PlayCircle } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType } from '../../redux/slices/app';
import { SimpleBarStyle } from '../../components/Scrollbar';
import { MediaType, SidebarType } from '../../constants/commons-const';
import { downloadFile, getIconAttachment, getSizeInMb } from '../../utils/commons';
import { SlideshowLightbox } from 'lightbox.js-react';
import 'lightbox.js-react/dist/index.css';

const LIST_TAB = [
  { value: 0, label: 'Media' },
  { value: 1, label: 'Files' },
];

const MediasBox = ({ medias }) => {
  const theme = useTheme();
  const [isOpenLightBox, setIsOpenLightBox] = useState(false);
  const [indexMedia, setIndexMedia] = useState(0);

  return (
    <>
      {medias.length > 0 ? (
        <Grid container sx={{ width: '100%' }}>
          {medias.map((item, index) => {
            const isVideo = item.type === MediaType.VIDEO;

            return (
              <Grid
                key={index}
                item
                xs={4}
                sx={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => {
                  setIsOpenLightBox(true);
                  setIndexMedia(index);
                }}
              >
                <img
                  src={item.thumbnail}
                  alt={item.alt}
                  style={{ width: '100%', height: '96px', objectFit: 'cover' }}
                />
                {isVideo && (
                  <PlayCircle
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    size={30}
                    weight="fill"
                    color="#fff"
                  />
                )}
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography
          sx={{
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '14px',
            color: theme.palette.text.secondary,
            fontWeight: 400,
          }}
        >
          No medias
        </Typography>
      )}

      <SlideshowLightbox
        theme="lightbox"
        images={medias}
        startingSlideIndex={indexMedia}
        showThumbnails={true}
        open={isOpenLightBox}
        lightboxIdentifier="lbox1"
        onClose={() => {
          setIsOpenLightBox(false);
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
    </>
  );
};

const FilesBox = ({ files }) => {
  const theme = useTheme();

  return (
    <>
      {files.length > 0 ? (
        <List>
          {files.map((item, index) => {
            const lastItem = index === files.length - 1;
            return (
              <ListItem key={index} disablePadding sx={{ marginBottom: lastItem ? '0px' : '10px' }}>
                <Paper elevation={3} sx={{ borderRadius: '12px', width: '100%' }}>
                  <ListItemButton onClick={() => downloadFile(item.url, item.file_name)}>
                    <ListItemIcon>{getIconAttachment(item.content_type, 24)}</ListItemIcon>
                    <ListItemText primary={item.file_name} secondary={getSizeInMb(item.content_length)} />
                  </ListItemButton>
                </Paper>
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Typography
          sx={{
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '14px',
            color: theme.palette.text.secondary,
            fontWeight: 400,
          }}
        >
          No files
        </Typography>
      )}
    </>
  );
};

const ChannelMedia = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive('up', 'md');
  const { currentChannel } = useSelector(state => state.channel);

  const [tabIndex, setTabIndex] = useState(0);
  const [medias, setMedias] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (currentChannel) {
      const fetchAttachmentMessages = async () => {
        const response = await currentChannel.queryAttachmentMessages();

        if (response) {
          const { attachments } = response;
          const imagesAndVideos = attachments.filter(
            attachment => attachment.content_type.startsWith('image/') || attachment.content_type.startsWith('video/'),
          );
          const newFormatMedias = imagesAndVideos.map(item => {
            const isVideo = item.content_type.startsWith('video/');

            if (isVideo) {
              return {
                type: MediaType.VIDEO,
                videoSrc: item.url,
                thumbnail: item.thumb_url,
                alt: item.file_name,
                autoPlay: false,
              };
            } else {
              return {
                type: MediaType.IMAGE,
                src: item.url,
                thumbnail: item.url,
                alt: item.file_name,
              };
            }
          });

          const otherTypes = attachments.filter(
            attachment =>
              !attachment.content_type.startsWith('image/') && !attachment.content_type.startsWith('video/'),
          );

          setMedias(newFormatMedias);
          setFiles(otherTypes);
        }
      };

      fetchAttachmentMessages();
    }
  }, [currentChannel]);

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box
      sx={{
        width: !isDesktop ? '100%' : 320,
        height: '100%',
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
      }}
    >
      <Stack sx={{ height: '100%' }}>
        <Box
          sx={{
            boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
            width: '100%',
            height: '74px',
          }}
        >
          <Stack
            sx={{ height: '100%' }}
            direction="row"
            alignItems={'center'}
            spacing={2}
            p={2}
            justifyContent="space-between"
          >
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType(SidebarType.Channel));
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
              Media & Files
            </Typography>
          </Stack>
        </Box>
        <Stack
          sx={{
            height: 'calc(100% - 74px)',
            position: 'relative',
            flexGrow: 1,
            backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.default,
          }}
          spacing={2}
          p={2}
        >
          <Stack sx={{ width: '100%', height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabIndex}
                onChange={handleChange}
                indicatorColor="secondary"
                textColor="inherit"
                variant="fullWidth"
              >
                {LIST_TAB.map(item => {
                  return <Tab key={item.value} label={item.label} />;
                })}
              </Tabs>
            </Box>

            <div style={{ overflowY: 'auto', height: 'calc(100% - 49px)' }} className="customScrollbar">
              <SimpleBarStyle timeout={500} clickOnTrack={false}>
                <Stack spacing={2} sx={{ paddingTop: '15px' }}>
                  {(() => {
                    switch (tabIndex) {
                      case 0:
                        return <MediasBox medias={medias} />;
                      case 1:
                        return <FilesBox files={files} />;
                      default:
                        break;
                    }
                  })()}
                </Stack>
              </SimpleBarStyle>
            </div>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ChannelMedia;
