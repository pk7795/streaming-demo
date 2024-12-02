import React, { useEffect } from 'react';
import { Stack } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import useResponsive from '../../hooks/useResponsive';
import SideNav from './SideNav';
import { useDispatch, useSelector } from 'react-redux';
import { client, connectUser } from '../../client';
import { FetchUserProfile, UpdateMember } from '../../redux/slices/member';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { BASE_URL_PROFILE } from '../../config';
import { CallAction } from '../../constants/commons-const';
import { ReceivingCallDirect } from '../../redux/slices/callDirect';
import CallDirectDialog from '../../sections/dashboard/CallDirectDialog';
import { ClientEvents } from '../../constants/events-const';
import { FetchChains } from '../../redux/slices/wallet';
import PlatformDialog from '../../sections/dashboard/PlatformDialog';
import { LocalStorageKey } from '../../constants/localStorage-const';

const DashboardLayout = () => {
  const isDesktop = useResponsive('up', 'md');
  const dispatch = useDispatch();
  const { isLoggedIn, user_id, openDialogPlatform, project_id_ermis } = useSelector(state => state.auth);
  const { openCallDirectDialog } = useSelector(state => state.callDirect);

  const accessToken = localStorage.getItem(LocalStorageKey.AccessToken);

  useEffect(() => {
    const eventSource = new EventSourcePolyfill(`${BASE_URL_PROFILE}/uss/v1/sse/subscribe`, {
      headers: {
        method: 'GET',
        Authorization: 'Bearer ' + accessToken,
      },
      heartbeatTimeout: 60000,
    });

    eventSource.onmessage = result => {
      const data = JSON.parse(result.data);

      if (data && data.type !== 'health.check') {
        delete data.type;
        dispatch(UpdateMember(data));
      }
    };

    eventSource.onerror = err => { };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(FetchChains());
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      connectUser(project_id_ermis, user_id, accessToken, dispatch);
      fetchDataInitial();
    }
  }, [isLoggedIn, project_id_ermis]);

  useEffect(() => {
    if (client) {
      const handleCallDirect = event => {
        if ([CallAction.AUDIO_CREATE, CallAction.VIDEO_CREATE].includes(event.action)) {
          const data = {
            callDirectData: {
              callerId: event.user_id,
              receiverId: user_id,
              cid: event.cid,
            },
            callDirectType: event.action.split('-')[0] || '',
            signalData: event.signal,
          };
          dispatch(ReceivingCallDirect(data));
        }
      };

      client.on(ClientEvents.Signal, handleCallDirect);
      return () => {
        client.off(ClientEvents.Signal, handleCallDirect);
      };
    }
  }, [client]);

  const fetchDataInitial = async () => {
    await Promise.all([dispatch(FetchUserProfile())]);
  };

  if (!isLoggedIn) {
    return <Navigate to={'/login'} />;
  }

  return (
    <>
      {openDialogPlatform ? (
        <PlatformDialog />
      ) : (
        <Stack direction="row" sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          {/* {isDesktop && <SideNav />} */}

          <Outlet />
        </Stack>
      )}

      {openCallDirectDialog && <CallDirectDialog open={openCallDirectDialog} />}
    </>
  );
};

export default DashboardLayout;
