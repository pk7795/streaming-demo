import React, { useEffect, useRef, useState } from "react";
import { WHEPClient } from 'whip-whep/whep';
import ShakaPlayer from 'shaka-player-react';
import { Box, IconButton, InputAdornment, Stack, TextField, Popover, Paper, Typography, Alert, Button } from '@mui/material';
import AntSwitch from '../../components/AntSwitch';
import { useTheme, styled } from '@mui/material/styles';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import useSettings from '../../hooks/useSettings';
import { LogoutUser } from '../../redux/slices/auth';

const WhepViewer = ({ showChat }) => {
    const dispatch = useDispatch();

    const { onToggleMode, themeMode } = useSettings();
    const theme = useTheme();
    const isMobile = useResponsive('between', 'md', 'xs', 'sm');
    const videoRef = useRef(null);

    const [token, setToken] = useState("eyJhbGciOiJIUzI1NiJ9.eyJyb29tIjoiZGVtbyIsInBlZXIiOm51bGwsInByb3RvY29sIjoiV2hlcCIsInB1Ymxpc2giOmZhbHNlLCJzdWJzY3JpYmUiOnRydWUsInRzIjoxNzAzNzUyMzE1NTgyfQ.6XS0gyZWJ699BUN0rXtlLH-0SvgtMXJeXIDtJomxnig");

    const [isStreaming, setIsStreaming] = useState(false);

    const whepClientRef = useRef(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [volume, setVolume] = useState(1.0);
    const { setLoadingChannel } = useSelector(state => state.channel);
    const toggleMic = () => {
        if (mediaStream) {
            const audioTrack = mediaStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (mediaStream) {
            const videoTrack = mediaStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    };

    const handleVolumeChange = (event) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);

        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
    };
    const start = async () => {

        const pc = new RTCPeerConnection();

        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.addTransceiver("video", { direction: "recvonly" });

        let stream = new MediaStream();

        videoRef.current.srcObject = stream;

        pc.ontrack = (event) => {

            stream.addTrack(event.track);

        };

        const whep = new WHEPClient();

        const url = "https://belo.chat:3030/whep/endpoint";

        try {

            await whep.view(pc, url, token);

            whepClientRef.current = whep;

            setIsStreaming(true);
            // setLoadingChannel(false);
            showChat();
            console.log("Viewing started successfully!");

        } catch (error) {

            setIsStreaming(false);

            console.error("Failed to start WHEP viewer:", error);

        }

    };

    const stop = async () => {

        if (whepClientRef.current) {

            await whepClientRef.current.stop();

        }

        if (videoRef.current) {

            videoRef.current.srcObject = null;

        }

        setIsStreaming(false);

        console.log("Streaming stopped.");

    };
    const onLogout = () => {
        stop();
        dispatch(LogoutUser());
    };

    useEffect(() => {
        const initMediaStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    // video: false,
                });
                setMediaStream(stream);
            } catch (error) {
                console.error("Failed to access media devices:", error);
            }
        };
        if (themeMode === 'light') {
            onToggleMode();
        }
        start();

        // setLoadingChannel(true);
        initMediaStream();
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);
    // useEffect(() => {
    //     if (videoRef.current && mediaStream) {
    //         videoRef.current.srcObject = mediaStream;
    //     }
    // }, [mediaStream]);
    return (
        <Stack sx={{
            // overflow: 'hidden',
            position: 'relative',
            height: '100%',
            width: '75%',
            backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.default,
            justifyContent: 'space-between',
            // borderTopWidth: 0,
            // borderRightWidth: 0.5,
            // borderBottomWidth: 0,
            // borderLeftWidth: 0,
            // borderColor: '#98A2B3',
            // borderStyle: 'solid'
        }}>
            <Box
                sx={{
                    backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
                    width: '100%',
                    height: '62px',
                    padding: '8px 16px',
                    boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
                    // borderTopWidth: 0,
                    // borderRightWidth: 0,
                    // borderBottomWidth: 0.1,
                    // borderLeftWidth: 0,
                    // borderColor: '#D0D5DD',
                    // borderStyle: 'solid'
                }}
            >
                <Stack
                    alignItems='center'
                    sx={{ width: '100%', height: '100%' }}
                    justifyContent="space-between"
                >
                    <Stack spacing={.2}>
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                            Streaming Demo
                        </Typography>
                    </Stack>
                </Stack>
            </Box>
            {/* <input
                type="text"
                placeholder="Enter JWT Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ marginBottom: "10px", width: "100%" }}
            /> */}

            <Box sx={{
                position: 'relative',
                backgroundColor: 'transparent !important',
                p: 2
            }}>
                <video ref={videoRef} autoPlay playsInline controls style={{ width: "100%", marginTop: "10px" }} />
                {/* <ShakaPlayer ref={videoRef} autoPlay playsInline volume={20} style={{ width: "100%", marginTop: "10px" }}
                // src="https://assets.codepen.io/6093409/river.mp4"
                controls
                /> */}
            </Box>
            <Box
                sx={{
                    position: 'relative',
                    backgroundColor: 'transparent !important',
                    height: '120px',
                }}
            >
                <Box
                    p={isMobile ? 1 : 2}
                    width={'100%'}
                    height={'100%'}
                    sx={{
                        backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
                        boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
                        justifyContent: 'space-between',
                        flexDirection: isMobile ? 'column' : 'row',
                        display: 'flex',
                        alignItems: 'center',
                        // borderTopWidth: 0.1,
                        // borderRightWidth: 0,
                        // borderBottomWidth: 0,
                        // borderLeftWidth: 0,
                        // borderColor: '#D0D5DD',
                        // borderStyle: 'solid'
                    }}
                >
                    <Box
                        p={isMobile ? 1 : 2}
                        sx={{
                            backgroundColor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
                            boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.25)',
                            justifyContent: 'flex-start',
                            flexDirection: isMobile ? 'column' : 'row',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <AntSwitch defaultChecked={theme.palette.mode === 'dark'} onChange={onToggleMode} sx={{ marginRight: 8 }} />
                        {/* Nút bật/tắt mic */}
                        {/* <Button
                            onClick={toggleMic}
                            sx={{ backgroundColor: isMicOn ? 'green' : 'gray', color: '#fff', marginRight: 2 }}
                        >
                            {isMicOn ? "Mic On" : "Mic Off"}
                        </Button> */}

                        {/* Nút bật/tắt camera */}
                        {/* <Button
                            onClick={toggleCamera}
                            sx={{ backgroundColor: isCameraOn ? 'green' : 'gray', color: '#fff', marginRight: 2 }}
                        >
                            {isCameraOn ? "Camera On" : "Camera Off"}
                        </Button> */}

                        {/* Thanh điều chỉnh âm lượng */}
                        <Box display="flex" alignItems="center">
                            <Typography variant="body2" sx={{ marginRight: 1 }}>
                                Volume
                            </Typography>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolumeChange}
                                style={{ width: '100px' }}
                            />
                        </Box>
                    </Box>
                    {/* <Box>
                        <Button sx={{ backgroundColor: theme.palette.primary.main, alignItems: 'center', justifyContent: 'center' }} onClick={start}>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px', marginBottom: '5px', color: '#fff' }}>
                                {isStreaming ? "Stop Live Stream" : "Watch Live Stream"}
                            </Typography>
                        </Button>
                    </Box> */}
                    <Box>
                        <Button sx={{ backgroundColor: 'red', alignItems: 'center', justifyContent: 'center' }} onClick={onLogout}>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px', marginBottom: '5px', color: '#fff' }}>
                                Stop Live Stream
                            </Typography>
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Stack>

    );

};

export default WhepViewer;