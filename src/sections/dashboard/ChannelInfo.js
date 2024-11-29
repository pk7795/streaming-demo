import React, { useCallback, useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material';
import {
  CaretRight,
  X,
  Users,
  Link,
  UserCircleGear,
  LockKey,
  MinusCircle,
  PencilSimple,
  ArrowLeft,
  SignOut,
  Trash,
  Prohibit,
  ProhibitInset,
  Funnel,
} from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import { ToggleSidebar, UpdateSidebarType, showSnackbar } from '../../redux/slices/app';
import ChannelAvatar from '../../components/ChannelAvatar';
import {
  checkDirectBlock,
  formatString,
  getChannelName,
  handleError,
  isChannelDirect,
  isPublicChannel,
  myRoleInChannel,
} from '../../utils/commons';
import { ConfirmType, RoleMember, SidebarType } from '../../constants/commons-const';
import ClipboardCopy from '../../components/ClipboardCopy';
import { LoadingButton } from '@mui/lab';
import FormProvider from '../../components/hook-form/FormProvider';
import { RHFTextField, RHFUploadAvatar } from '../../components/hook-form';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { setChannelConfirm } from '../../redux/slices/dialog';
import { ClientEvents } from '../../constants/events-const';
import RHFRadio from '../../components/hook-form/RHFRadio';
import AvatarComponent from '../../components/AvatarComponent';
import { DOMAIN_APP } from '../../config';

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginTop: '10px !important',
}));

const StyledStackItem = styled(Stack)(({ theme }) => ({
  marginTop: '10px !important',
}));

const styleChannelName = {
  display: '-webkit-box',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 2,
  lineClamp: 2,
  WebkitBoxOrient: 'vertical',
  wordBreak: 'break-word',
  textAlign: 'center',
};

const EditChannel = ({ setIsEdit }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const { all_members } = useSelector(state => state.member);

  const [loadingButton, setLoadingButton] = useState(false);

  const channelInfo = {
    name: getChannelName(currentChannel, all_members) || '',
    description: currentChannel.data.description || '',
    image: currentChannel.data.image || '',
    public: String(currentChannel.data.public),
  };

  const NewGroupSchema = Yup.object().shape({
    name: Yup.string().trim().required('Channel name is required').max(255, 'Max 255 characters'),
    description: Yup.string().trim().max(255, 'Max 255 characters'),
  });

  const defaultValues = {
    name: channelInfo.name,
    description: channelInfo.description,
    image: channelInfo.image,
    public: String(channelInfo.public),
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    mode: 'onChange',
    defaultValues,
  });

  const { watch, setValue, handleSubmit } = methods;

  const handleDrop = useCallback(
    acceptedFiles => {
      const file = acceptedFiles[0];
      const isImage = file.type.startsWith('image/');

      if (file.size > 3145728) {
        dispatch(showSnackbar({ severity: 'error', message: 'File size exceeds 3MB!' }));
      } else if (!isImage) {
        dispatch(showSnackbar({ severity: 'error', message: 'Please upload an image file!' }));
      } else {
        const newFile = Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
        if (file) {
          setValue('image', newFile, { shouldValidate: true });
        }
      }
    },
    [setValue],
  );

  const onSubmit = async data => {
    try {
      const { name, description, image } = data;

      const params = {
        public: data.public,
      };
      if (name && name.trim() !== defaultValues.name.trim()) {
        params.name = name;
      }
      if (description && description.trim() !== defaultValues.description.trim()) {
        params.description = description;
      }

      if (typeof image === 'object' && image !== null) {
        const response = await currentChannel.sendFile(image);
        if (response) {
          params.image = response.file;
        }
      }

      if (data.public === 'true') {
        params.public = true;
      } else {
        params.public = false;
      }

      setLoadingButton(true);
      await currentChannel.update(params);
      setLoadingButton(false);
    } catch (error) {
      setLoadingButton(false);
      handleError(dispatch, error);
    }
  };

  const watchValues = () => {
    const data = watch();

    return {
      name: data.name.trim(),
      description: data.description.trim(),
      image: data.image,
      public: data.public,
    };
  };

  return (
    <>
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
          <Stack direction="row" alignItems={'center'} spacing={2}>
            <IconButton
              onClick={() => {
                setIsEdit(false);
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
              Edit channel
            </Typography>
          </Stack>
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
          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <RHFUploadAvatar name="image" onDrop={handleDrop} />
              <RHFRadio
                row
                name="public"
                options={[
                  { value: 'false', label: 'Private' },
                  { value: 'true', label: 'Public' },
                ]}
              />
              <RHFTextField name="name" label="Channel name" placeholder="Channel name" autoFocus />
              <RHFTextField multiline rows={4} name="description" label="Description" />
              <Stack direction={'row'} justifyContent={'center'}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={loadingButton}
                  disabled={JSON.stringify(defaultValues) === JSON.stringify(watchValues())}
                >
                  Save
                </LoadingButton>
              </Stack>
            </Stack>
          </FormProvider>
        </Stack>
      </Stack>
    </>
  );
};

const styleDescription = {
  display: '-webkit-box',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  WebkitLineClamp: 3,
  lineClamp: 3,
  WebkitBoxOrient: 'vertical',
  wordBreak: 'break-word',
};

const ChannelInfo = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive('up', 'md');
  const { currentChannel } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { all_members } = useSelector(state => state.member);
  const myRole = myRoleInChannel(currentChannel);
  const isDirect = isChannelDirect(currentChannel);
  const isPublic = isPublicChannel(currentChannel);

  const [otherMemberId, setOtherMemberId] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (currentChannel) {
      // const watchChannel = async () => {
      //   await currentChannel.watch();
      // };
      // watchChannel();
      const members = Object.keys(currentChannel.state.members);
      const otherMemberId = members.find(member => member !== user_id);
      setOtherMemberId(otherMemberId);

      setIsBlocked(checkDirectBlock(currentChannel));

      const handleMemberBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(true);
        }
      };

      const handleMemberUnBlocked = event => {
        if (event.user.id === user_id) {
          setIsBlocked(false);
        }
      };

      currentChannel.on(ClientEvents.MemberBlocked, handleMemberBlocked);
      currentChannel.on(ClientEvents.MemberUnblocked, handleMemberUnBlocked);

      return () => {
        currentChannel.off(ClientEvents.MemberBlocked, handleMemberBlocked);
        currentChannel.off(ClientEvents.MemberUnblocked, handleMemberUnBlocked);
      };
    }
  }, [currentChannel, user_id]);

  const fullUrl = `${DOMAIN_APP}/channels/${currentChannel?.cid}`;
  const showItemMembers = !isDirect;
  const showItemAdministrators = !isDirect && myRole === RoleMember.OWNER;
  const showItemBanned = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole);
  const showItemPermissions = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole);
  const showEditChannel = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole);
  const showItemLeaveChannel = !isDirect && [RoleMember.MOD, RoleMember.MEMBER].includes(myRole);
  const showItemDeleteChannel = !isDirect && [RoleMember.OWNER].includes(myRole);
  const showItemDeleteConversation = isDirect;
  const showItemKeywordFiltering = !isDirect && [RoleMember.OWNER, RoleMember.MOD].includes(myRole);

  if (!currentChannel) return null;

  return (
    <Box
      sx={{
        width: !isDesktop ? '100%' : '320px',
        height: '100%',
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
      }}
    >
      <Stack sx={{ height: '100%' }}>
        {isEdit ? (
          <EditChannel setIsEdit={setIsEdit} />
        ) : (
          <>
            <Box
              sx={{
                boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
                width: '100%',
                height: '74px',
              }}
            >
              <Stack
                sx={{ height: '100%', p: 2 }}
                direction="row"
                alignItems={'center'}
                justifyContent="space-between"
                spacing={3}
              >
                <Typography variant="subtitle2">Channel Info</Typography>
                <IconButton
                  onClick={() => {
                    dispatch(ToggleSidebar());
                  }}
                >
                  <X />
                </IconButton>
              </Stack>
            </Box>
            <Stack
              sx={{
                height: 'calc(100% - 74px)',
                position: 'relative',
                flexGrow: 1,
                overflow: 'scroll',
              }}
              p={3}
              spacing={3}
            >
              <Stack alignItems="center" direction="column" spacing={2} sx={{ position: 'relative' }}>
                {showEditChannel && (
                  <IconButton
                    aria-label="edit"
                    sx={{ position: 'absolute', top: '-15px', right: '-15px' }}
                    onClick={() => setIsEdit(true)}
                  >
                    <PencilSimple size={20} />
                  </IconButton>
                )}
                {isPublic ? (
                  <AvatarComponent
                    name={currentChannel.data.name}
                    url={currentChannel.data.image}
                    width={80}
                    height={80}
                    isPublic={isPublic}
                  />
                ) : (
                  <ChannelAvatar channel={currentChannel} width={80} height={80} />
                )}
                <Stack direction="column" alignItems="center">
                  <Typography variant="article" fontWeight={600} sx={styleChannelName}>
                    {getChannelName(currentChannel, all_members)}
                  </Typography>

                  {isPublic && (
                    <Typography style={{ fontSize: '12px', color: theme.palette.secondary.main }} title={fullUrl}>
                      {formatString(fullUrl, 8, 8)}
                      <ClipboardCopy text={fullUrl} />
                    </Typography>
                  )}
                  {isDirect ? (
                    <Typography style={{ fontSize: '12px', color: '#666' }} title={otherMemberId}>
                      {formatString(otherMemberId)} <ClipboardCopy text={otherMemberId} />
                    </Typography>
                  ) : (
                    <Typography
                      style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all', ...styleDescription }}
                    >
                      {currentChannel.data.description}
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <StyledDivider />

              {/* ------------Members--------------- */}
              {showItemMembers && (
                <>
                  <StyledStackItem direction="row" alignItems="center" justifyContent={'space-between'}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Users size={21} />

                      <Typography variant="subtitle2">Members</Typography>
                    </Stack>

                    <IconButton
                      onClick={() => {
                        dispatch(UpdateSidebarType(SidebarType.Members));
                      }}
                    >
                      <CaretRight />
                    </IconButton>
                  </StyledStackItem>
                  <StyledDivider />
                </>
              )}

              {/* ------------Media & Files--------------- */}
              <StyledStackItem direction="row" alignItems="center" justifyContent={'space-between'}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Link size={21} />

                  <Typography variant="subtitle2">Media & Files</Typography>
                </Stack>
                <IconButton
                  onClick={() => {
                    dispatch(UpdateSidebarType(SidebarType.Media));
                  }}
                >
                  <CaretRight />
                </IconButton>
              </StyledStackItem>
              <StyledDivider />

              {/* ------------Permissions--------------- */}
              {showItemPermissions && (
                <>
                  <StyledStackItem direction="row" alignItems="center" justifyContent={'space-between'}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <UserCircleGear size={21} />

                      <Typography variant="subtitle2">Permissions</Typography>
                    </Stack>
                    <IconButton
                      onClick={() => {
                        dispatch(UpdateSidebarType(SidebarType.Permissions));
                      }}
                    >
                      <CaretRight />
                    </IconButton>
                  </StyledStackItem>
                  <StyledDivider />
                </>
              )}

              {/* ------------Administrators--------------- */}
              {showItemAdministrators && (
                <>
                  <StyledStackItem direction="row" alignItems="center" justifyContent={'space-between'}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LockKey size={21} />

                      <Typography variant="subtitle2">Administrators</Typography>
                    </Stack>
                    <IconButton
                      onClick={() => {
                        dispatch(UpdateSidebarType(SidebarType.Administrators));
                      }}
                    >
                      <CaretRight />
                    </IconButton>
                  </StyledStackItem>
                  <StyledDivider />
                </>
              )}

              {/* ------------Banned members--------------- */}
              {showItemBanned && (
                <>
                  <StyledStackItem direction="row" alignItems="center" justifyContent={'space-between'}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MinusCircle size={21} color="red" />

                      <Typography variant="subtitle2">Banned members</Typography>
                    </Stack>
                    <IconButton
                      onClick={() => {
                        dispatch(UpdateSidebarType(SidebarType.BannedUsers));
                      }}
                    >
                      <CaretRight />
                    </IconButton>
                  </StyledStackItem>
                  <StyledDivider />
                </>
              )}

              {/* ------------Keyword filtering--------------- */}
              {showItemKeywordFiltering && (
                <>
                  <StyledStackItem direction="row" alignItems="center" justifyContent={'space-between'}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Funnel size={21} />
                      <Typography variant="subtitle2">Keyword filtering</Typography>
                    </Stack>
                    <IconButton
                      onClick={() => {
                        dispatch(UpdateSidebarType(SidebarType.KeywordFiltering));
                      }}
                    >
                      <CaretRight />
                    </IconButton>
                  </StyledStackItem>
                  <StyledDivider />
                </>
              )}

              {/* ------------Actions--------------- */}

              {isDirect && (
                <>
                  {!isBlocked && (
                    <Stack direction="row" alignItems={'center'} spacing={2}>
                      <Button
                        onClick={() => {
                          const payload = {
                            openDialog: true,
                            channel: currentChannel,
                            userId: user_id,
                            type: ConfirmType.BLOCK,
                          };
                          dispatch(setChannelConfirm(payload));
                        }}
                        fullWidth
                        startIcon={<Prohibit />}
                        variant="outlined"
                        color="error"
                      >
                        Block
                      </Button>
                    </Stack>
                  )}

                  {isBlocked && (
                    <Stack direction="row" alignItems={'center'} spacing={2}>
                      <Button
                        onClick={() => {
                          const payload = {
                            openDialog: true,
                            channel: currentChannel,
                            userId: user_id,
                            type: ConfirmType.UNBLOCK,
                          };
                          dispatch(setChannelConfirm(payload));
                        }}
                        fullWidth
                        startIcon={<ProhibitInset />}
                        variant="outlined"
                        color="error"
                      >
                        Unblock
                      </Button>
                    </Stack>
                  )}
                </>
              )}

              {showItemLeaveChannel && (
                <Stack direction="row" alignItems={'center'} spacing={2}>
                  <Button
                    onClick={() => {
                      const payload = {
                        openDialog: true,
                        channel: currentChannel,
                        userId: user_id,
                        type: ConfirmType.LEAVE,
                      };
                      dispatch(setChannelConfirm(payload));
                    }}
                    fullWidth
                    startIcon={<SignOut />}
                    variant="outlined"
                    color="error"
                  >
                    Leave channel
                  </Button>
                </Stack>
              )}

              {showItemDeleteChannel && (
                <Stack direction="row" alignItems={'center'} spacing={2}>
                  <Button
                    onClick={() => {
                      const payload = {
                        openDialog: true,
                        channel: currentChannel,
                        userId: user_id,
                        type: ConfirmType.DELETE,
                      };
                      dispatch(setChannelConfirm(payload));
                    }}
                    fullWidth
                    startIcon={<Trash />}
                    variant="outlined"
                    color="error"
                  >
                    Delete channel
                  </Button>
                </Stack>
              )}

              {showItemDeleteConversation && (
                <Stack direction="row" alignItems={'center'} spacing={2}>
                  <Button
                    onClick={() => {
                      const payload = {
                        openDialog: true,
                        channel: currentChannel,
                        userId: user_id,
                        type: ConfirmType.TRUNCATE,
                      };
                      dispatch(setChannelConfirm(payload));
                    }}
                    fullWidth
                    startIcon={<Trash />}
                    variant="outlined"
                    color="error"
                  >
                    Delete chat
                  </Button>
                </Stack>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default ChannelInfo;
