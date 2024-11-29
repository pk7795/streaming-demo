import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Slide,
  Stack,
  Typography,
  useTheme,
  styled,
  Box,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useDispatch, useSelector } from 'react-redux';
import { getMemberInfo, handleError, sendSignalData } from '../../utils/commons';
import { client } from '../../client';
import { ClientEvents } from '../../constants/events-const';
import { CallAction, CallStatus, CallType } from '../../constants/commons-const';
import {
  AcceptCallDirect,
  DisconnectCallDirect,
  setCallDirectStatus,
  setPeer,
  setSignalData,
} from '../../redux/slices/callDirect';
import SimplePeer from 'simple-peer';
import MemberAvatar from '../../components/MemberAvatar';
import {
  Microphone,
  MicrophoneSlash,
  Phone,
  PhoneDisconnect,
  Screencast,
  VideoCamera,
  VideoCameraSlash,
  X,
} from 'phosphor-react';
import { Howl } from 'howler';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  {
    urls: 'turn:36.50.62.152:3478',
    username: 'hoang',
    credential: 'pass1',
  },
];

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledCallDirectDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-container': {
    '& .MuiPaper-root': {
      width: '500px',
      height: '550px',
      background: theme.palette.mode === 'light' ? '#F0F4FA' : theme.palette.background.paper,
      '& .receiverAvatar': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '70px',
      },

      '& .MuiDialogActions-root': {
        padding: '15px',
        position: 'relative',
        zIndex: 1,
        '& >:not(:first-of-type)': {
          marginLeft: '20px',
        },
      },
    },
  },
}));

const StyledButton = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  width: '70px',
  '& .MuiButton-root': {
    minWidth: '45px',
    height: '45px',
    borderRadius: '50%',
    padding: 0,
    color: '#fff',
    boxShadow: 'none',
    '&.moreButton': {
      backgroundColor: theme.palette.grey[300],
      '&:hover, &.active': {
        backgroundColor: theme.palette.grey[600],
      },
    },
  },
  ' & .spanTitle': {
    fontSize: '12px',
    display: 'block',
    color: theme.palette.grey[500],
  },
}));

const CallDirectDialog = ({ open }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const intervalRef = useRef(null);
  const ringtone = useRef();
  const { peer, callDirectStatus, callDirectType, signalData } = useSelector(state => state.callDirect);
  const { callerId, receiverId, cid } = useSelector(state => state.callDirect.callDirectData);
  const { all_members } = useSelector(state => state.member);

  const [localStream, setLocalStream] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [peerCameraOn, setPeerCameraOn] = useState(false);
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [time, setTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRing = () => {
    ringtone.current = new Howl({
      src: ['/ringtone.mp3'],
      loop: true,
    });
    ringtone.current.play();
  };

  const stopRing = () => {
    if (ringtone.current) {
      ringtone.current.stop();
    }
  };

  useEffect(() => {
    if (callerId && receiverId) {
      setCallerInfo(getMemberInfo(callerId, all_members));
      setReceiverInfo(getMemberInfo(receiverId, all_members));
    }
  }, [callerId, receiverId, all_members]);

  useEffect(() => {
    if ([CallStatus.CONNECTING, CallStatus.RECEIVING].includes(callDirectStatus)) {
      startRing();
    } else {
      stopRing();
    }

    return () => {
      stopRing();
    };
  }, [callDirectStatus]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });
  }, []);

  useEffect(() => {
    if (callDirectStatus === CallStatus.CALLING && localStream) {
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: localStream,
        config: {
          iceServers: ICE_SERVERS,
        },
      });
      dispatch(setPeer(peer));

      peer.on('signal', async signal => {
        const payload = {
          cid,
          action: callDirectType === CallType.VIDEO ? CallAction.VIDEO_CREATE : CallAction.AUDIO_CREATE,
          signal,
        };
        const response = await sendSignalData(payload, dispatch);
        if (response) {
          dispatch(setSignalData(payload.signal));
          dispatch(setCallDirectStatus(CallStatus.CONNECTING));
        } else {
          dispatch(setCallDirectStatus(CallStatus.ERROR));
        }
      });

      peer.on('stream', stream => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });
    }
    if (callDirectType === CallType.VIDEO) {
      setCameraOn(true);
      setPeerCameraOn(true);
    } else {
      setCameraOn(false);
      setPeerCameraOn(false);
    }
  }, [localStream, cid, callDirectStatus, callDirectType]);

  useEffect(() => {
    if (peer) {
      peer.on('data', data => {
        const message = JSON.parse(data);
        if (message.type === 'cameraStatus') {
          setPeerCameraOn(message.isCameraOn);
        }
      });
      peer.on('connect', () => {
        startTimer();
      });
    }

    const handleCall = event => {
      if ([CallAction.AUDIO_ACCEPT, CallAction.VIDEO_ACCEPT].includes(event.action)) {
        if (peer && event.signal) {
          peer.signal(event.signal);
          dispatch(AcceptCallDirect({ peer }));
        }
      } else if (
        [CallAction.AUDIO_ENDED, CallAction.AUDIO_REJECT, CallAction.VIDEO_ENDED, CallAction.VIDEO_REJECT].includes(
          event.action,
        )
      ) {
        if (peer) {
          peer.destroy();
        }
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        dispatch(DisconnectCallDirect());
      }
    };

    client.on(ClientEvents.Signal, handleCall);
    return () => {
      client.off(ClientEvents.Signal, handleCall);
    };
  }, [dispatch, client, peer, localStream]);

  const onAcceptCall = () => {
    setIsConnected(true);
    stopRing();
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: localStream,
      config: {
        iceServers: ICE_SERVERS,
      },
    });

    peer.on('signal', async signal => {
      const payload = {
        cid,
        action: callDirectType === CallType.VIDEO ? CallAction.VIDEO_ACCEPT : CallAction.AUDIO_ACCEPT,
        signal,
      };
      await sendSignalData(payload, dispatch);
      dispatch(AcceptCallDirect({ peer }));
      setIsConnected(false);
    });

    peer.on('stream', stream => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    peer.signal(signalData);
  };

  const onDisconnectCall = async () => {
    try {
      const payload = {
        cid,
        action: callDirectType === CallType.VIDEO ? CallAction.VIDEO_ENDED : CallAction.AUDIO_ENDED,
        signal: {
          type: '',
          sdp: '',
        },
      };
      await sendSignalData(payload, dispatch);
      if (peer) {
        peer.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      dispatch(DisconnectCallDirect());
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  const onDeclineCall = async () => {
    try {
      const payload = {
        cid,
        action: callDirectType === CallType.VIDEO ? CallAction.VIDEO_REJECT : CallAction.AUDIO_REJECT,
        signal: {
          type: '',
          sdp: '',
        },
      };
      await sendSignalData(payload, dispatch);
      if (peer) {
        peer.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      dispatch(DisconnectCallDirect());
    } catch (error) {
      handleError(dispatch, error);
    }
  };

  const onCancelCall = () => {
    if (peer) {
      peer.destroy();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    dispatch(DisconnectCallDirect());
  };

  const onToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const onToggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !cameraOn;
      setCameraOn(!cameraOn);

      peer.send(JSON.stringify({ type: 'cameraStatus', isCameraOn: !cameraOn }));
    }
  };

  const onScreenShare = () => {
    if (isScreenShare) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        const screenTrack = stream.getTracks()[0];
        peer.replaceTrack(peer.streams[0].getVideoTracks()[0], screenTrack, peer.streams[0]);
        setIsScreenShare(false);

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      });
    } else {
      navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
        const screenTrack = stream.getTracks()[0];
        peer.replaceTrack(peer.streams[0].getVideoTracks()[0], screenTrack, peer.streams[0]);
        setIsScreenShare(true);

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        screenTrack.onended = () => {
          onScreenShare();
        };
      });
    }
  };

  const renderButton = () => {
    return (
      <>
        <StyledButton>
          <Button
            className={`moreButton ${micOn && callDirectStatus === CallStatus.CONNECTED ? 'active' : ''}`}
            variant="contained"
            color="inherit"
            onClick={onToggleMic}
            disabled={callDirectStatus !== CallStatus.CONNECTED}
          >
            {micOn ? <Microphone size={20} weight="fill" /> : <MicrophoneSlash size={20} weight="fill" />}
          </Button>
          <span className="spanTitle">{micOn ? 'mute' : 'unmute'}</span>
        </StyledButton>
        <StyledButton>
          <Button
            className={`moreButton ${cameraOn && callDirectStatus === CallStatus.CONNECTED ? 'active' : ''}`}
            variant="contained"
            color="inherit"
            onClick={onToggleCamera}
            disabled={callDirectStatus !== CallStatus.CONNECTED}
          >
            {cameraOn ? <VideoCamera weight="fill" size={20} /> : <VideoCameraSlash weight="fill" size={20} />}
          </Button>
          <span className="spanTitle">{cameraOn ? 'stop video' : 'start video'}</span>
        </StyledButton>
        <StyledButton>
          <Button
            className={`moreButton ${isScreenShare && callDirectStatus === CallStatus.CONNECTED ? 'active' : ''}`}
            variant="contained"
            color="inherit"
            onClick={onScreenShare}
            disabled={callDirectStatus !== CallStatus.CONNECTED}
          >
            <Screencast weight="fill" size={20} />
          </Button>
          <span className="spanTitle">screencast</span>
        </StyledButton>

        {callDirectStatus === CallStatus.RECEIVING && (
          <>
            <StyledButton>
              <Button onClick={onDeclineCall} variant="contained" color="error">
                <PhoneDisconnect weight="fill" size={20} />
              </Button>
              <span className="spanTitle">decline</span>
            </StyledButton>
            <StyledButton>
              <LoadingButton onClick={onAcceptCall} variant="contained" color="success" loading={isConnected}>
                <Phone weight="fill" size={20} />
              </LoadingButton>
              <span className="spanTitle">accept</span>
            </StyledButton>
          </>
        )}

        {[CallStatus.CALLING, CallStatus.CONNECTING, CallStatus.CONNECTED].includes(callDirectStatus) && (
          <StyledButton>
            <Button onClick={onDisconnectCall} variant="contained" color="error">
              <PhoneDisconnect weight="fill" size={20} />
            </Button>
            <span className="spanTitle">end call</span>
          </StyledButton>
        )}

        {callDirectStatus === CallStatus.ERROR && (
          <StyledButton>
            <Button onClick={onCancelCall} variant="contained" color="error">
              <X weight="fill" size={20} />
            </Button>
            <span className="spanTitle">cancel</span>
          </StyledButton>
        )}
      </>
    );
  };

  return (
    <>
      <StyledCallDirectDialog open={open} TransitionComponent={Transition} keepMounted onClose={onDisconnectCall}>
        <DialogContent sx={{ padding: 0 }}>
          <Typography variant="body1" sx={{ fontSize: '22px', fontWeight: 600, margin: '15px', textAlign: 'center' }}>
            {callDirectStatus === CallStatus.CALLING ? receiverInfo?.name : callerInfo?.name}
          </Typography>

          {callDirectStatus === CallStatus.CONNECTED && (
            <Typography
              variant="body1"
              sx={{
                fontSize: '20px',
                fontWeight: 500,
                margin: '0 15px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 3,
                color: theme.palette.success.main,
              }}
            >
              {formatTime(time)}
            </Typography>
          )}

          <div className="receiverAvatar">
            <MemberAvatar
              member={callDirectStatus === CallStatus.CALLING ? receiverInfo : callerInfo}
              width={200}
              height={200}
            />
          </div>
          <div
            style={{
              textAlign: 'center',
              fontWeight: 600,
              marginTop: '15px',
              fontSize: '14px',
              color: callDirectStatus === CallStatus.ERROR ? theme.palette.error.main : theme.palette.text.secondary,
            }}
          >
            {callDirectStatus === CallStatus.CALLING ? (
              'Waiting'
            ) : callDirectStatus === CallStatus.CONNECTING ? (
              'Connecting'
            ) : callDirectStatus === CallStatus.RECEIVING ? (
              'is calling you'
            ) : callDirectStatus === CallStatus.CONNECTED ? (
              <span style={{ color: theme.palette.success.main }}>Connected</span>
            ) : (
              'Call Failed'
            )}
            {[CallStatus.CALLING, CallStatus.CONNECTING, CallStatus.RECEIVING].includes(callDirectStatus) && (
              <>
                &nbsp;&nbsp;
                <div className="loader">
                  <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
                  <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
                  <div className="dot" style={{ backgroundColor: theme.palette.text.secondary }} />
                </div>
              </>
            )}
          </div>

          {/* <div style={{ display: callDirectType === CallType.VIDEO ? 'block' : 'none' }}> */}
          <Stack
            sx={{
              width: '150px',
              height: '100px',
              position: 'absolute',
              bottom: '90px',
              right: '15px',
              borderRadius: '6px',
              overflow: 'hidden',
              zIndex: 2,
              visibility: cameraOn ? 'visible' : 'hidden',
            }}
          >
            <video
              ref={localVideoRef}
              playsInline
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
            />
          </Stack>
          <Stack
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
              visibility: peerCameraOn ? 'visible' : 'hidden',
            }}
          >
            <video
              ref={remoteVideoRef}
              playsInline
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Stack>
          {/* </div> */}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>{renderButton()}</DialogActions>
      </StyledCallDirectDialog>
    </>
  );
};

export default CallDirectDialog;
