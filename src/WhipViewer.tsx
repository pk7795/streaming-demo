import React, { useRef, useState } from "react";
import { WHIPClient } from 'whip-whep/whip';

const WhipViewer: React.FC = () => {
    const [whipInstance, setWhipInstance] = useState<WHIPClient | null>(null);
    const [streamInstance, setStreamInstance] = useState<MediaStream | null>(null);
    const [token, setToken] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const start = async () => {
        try {
            if (whipInstance) {
                whipInstance.stop();
            }

            if (streamInstance) {
                streamInstance.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            const pc = new RTCPeerConnection();

            for (const track of stream.getTracks()) {
                pc.addTransceiver(track, {
                    direction: 'sendonly',
                    streams: [stream],
                    sendEncodings: [
                        { rid: '0', active: true },
                        { rid: '1', active: true },
                        { rid: '2', active: true }
                    ]
                });
            }

            const whip = new WHIPClient();
            await whip.publish(pc, 'https://media-dev.ermis.network/whip/endpoint', token);

            setWhipInstance(whip);
            setStreamInstance(stream);
            setIsStreaming(true);
        } catch (error) {
            setIsStreaming(false);
            console.error("Failed to start WHIP publisher:", error);

        }
    };

    const stop = () => {
        whipInstance?.stop();
        streamInstance?.getTracks().forEach(track => track.stop());
        setWhipInstance(null);
        setStreamInstance(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };
    return (
        <div>
            <h1>WHIP Publisher</h1>
            <input
                type="text"
                placeholder="Enter JWT Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ marginBottom: "10px", width: "100%" }}
            />
            <div>
                <button onClick={start} disabled={isStreaming} style={{ marginRight: "10px" }}>
                    Start Publishing
                </button>
                <button onClick={stop} disabled={!isStreaming}>
                    Stop Publishing
                </button>
            </div>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", maxHeight: "500px", marginTop: "10px" }}
            />
        </div>
    );
};

export default WhipViewer;