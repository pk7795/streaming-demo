import React, { RefObject, useEffect, useRef, useState } from "react";
import { WHEPClient } from 'whip-whep/whep';
const WhepViewer: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [token, setToken] = useState("eyJhbGciOiJIUzI1NiJ9.eyJyb29tIjoiZGVtbyIsInBlZXIiOm51bGwsInByb3RvY29sIjoiV2hlcCIsInB1Ymxpc2giOmZhbHNlLCJzdWJzY3JpYmUiOnRydWUsInRzIjoxNzAzNzUyMzE1NTgyfQ.6XS0gyZWJ699BUN0rXtlLH-0SvgtMXJeXIDtJomxnig");
    const [isStreaming, setIsStreaming] = useState(false);
    const whepClientRef = useRef<WHEPClient | null>(null);

    const start = async () => {

        const pc = new RTCPeerConnection();

        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });

        let stream = new MediaStream();
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }

        pc.ontrack = (event) => {
            stream.addTrack(event.track);
        };

        const whep = new WHEPClient();

        const url = "https://belo.chat:3030/whep/endpoint";

        try {
            await whep.view(pc, url, token);
            whepClientRef.current = whep;
            setIsStreaming(true);
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

    return (
        <div>
            <h1>WHEP Viewer</h1>
            <input
                type="text"
                placeholder="Enter JWT Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ marginBottom: "10px", width: "100%" }}
            />
            <div>
                <button onClick={start} disabled={isStreaming} style={{ marginRight: "10px" }}>
                    Start
                </button>
                <button onClick={stop} disabled={!isStreaming}>
                    Stop
                </button>
            </div>
            <video ref={videoRef} autoPlay playsInline controls style={{ width: "100%", maxHeight: "500px", marginTop: "10px" }} />
        </div>
    );
};

export default WhepViewer;