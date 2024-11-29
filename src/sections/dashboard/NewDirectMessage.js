import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Button, Dialog, DialogContent, DialogTitle, Slide, Stack } from '@mui/material';

import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import FormProvider from '../../components/hook-form/FormProvider';
import { useDispatch, useSelector } from 'react-redux';
import { client } from '../../client';
import { ChatType, RoleMember } from '../../constants/commons-const';
import { LoadingButton } from '@mui/lab';
import { showSnackbar } from '../../redux/slices/app';
import { CloseDialogNewDirectMessage } from '../../redux/slices/dialog';
import RHFAutocompleteMember from '../../components/hook-form/RHFAutocompleteMember';
import { FetchFriends } from '../../redux/slices/member';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const NewDirectMessageForm = ({ onCloseDialogNewDirectMessage }) => {
  const dispatch = useDispatch();
  const { user_id } = useSelector(state => state.auth);
  const { friend_ids } = useSelector(state => state.member);
  const { projectCurrent } = useSelector(state => state.wallet);

  const [isLoading, setIsLoading] = useState(false);
  const [friendPendingIds, setFriendPendingIds] = useState([]); // Danh sách những người được invite nhưng chưa accept

  const NewGroupSchema = Yup.object().shape({
    member: Yup.object().nullable().required('Member is required'),
  });

  const defaultValues = {
    member: null,
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    defaultValues,
  });

  const { reset, handleSubmit } = methods;

  const fetchPendingChannelsDirect = async () => {
    const filter = {
      type: [ChatType.MESSAGING],
      other_roles: [RoleMember.PENDING],
    };
    const sort = [];
    const options = {
      presence: true,
      watch: true,
    };

    const response = await client.queryChannels(filter, sort, options);
    if (response) {
      const ids = response.map(channel => {
        const members = Object.values(channel.state.members);
        const otherMember = members.find(member => member.user_id !== user_id);
        return otherMember ? otherMember.user.id : [];
      });

      setFriendPendingIds(ids);
    } else {
      setFriendPendingIds([]);
    }
  };

  useEffect(() => {
    fetchPendingChannelsDirect();
  }, []);

  useEffect(() => {
    if (projectCurrent) {
      dispatch(FetchFriends());
    }
  }, [projectCurrent]);

  const onSubmit = async data => {
    try {
      setIsLoading(true);
      const channel = await client.channel(ChatType.MESSAGING, {
        members: [data.member.id, user_id],
      });
      const response = await channel.create();

      if (response) {
        dispatch(showSnackbar({ severity: 'success', message: 'Invitation sent' }));
        setIsLoading(false);
        reset();
        onCloseDialogNewDirectMessage();
      }
    } catch (error) {
      reset();
      setIsLoading(false);
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to send invite. Please retry' }));
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <RHFAutocompleteMember
          name="member"
          label="Member"
          ChipProps={{ size: 'medium' }}
          getOptionDisabled={option =>
            option.id === user_id || friend_ids.includes(option.id) || friendPendingIds.includes(option.id)
          }
        />
        <Stack spacing={2} direction={'row'} alignItems="center" justifyContent={'end'}>
          <Button
            onClick={() => {
              reset();
              onCloseDialogNewDirectMessage();
            }}
          >
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isLoading}>
            Start chatting
          </LoadingButton>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

const NewDirectMessage = () => {
  const dispatch = useDispatch();
  const { openDialogNewDirectMessage } = useSelector(state => state.dialog);

  const onCloseDialogNewDirectMessage = () => {
    dispatch(CloseDialogNewDirectMessage());
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openDialogNewDirectMessage}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialogNewDirectMessage}
      aria-describedby="alert-dialog-slide-description"
      sx={{ p: 4 }}
    >
      <DialogTitle>{'Start new chat'}</DialogTitle>

      <DialogContent sx={{ mt: 4, overflowY: 'visible' }}>
        <NewDirectMessageForm onCloseDialogNewDirectMessage={onCloseDialogNewDirectMessage} />
      </DialogContent>
    </Dialog>
  );
};

export default NewDirectMessage;
