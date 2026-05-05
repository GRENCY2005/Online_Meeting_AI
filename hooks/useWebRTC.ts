import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const STUN_SERVER = 'stun:stun.l.google.com:19302';

export interface PeerState {
  userId: string;
  userName: string;
  stream: MediaStream;
}

export interface Caption {
  speaker: string;
  text: string;
  timestamp: number;
}

export const useWebRTC = (
  meetingId: string, 
  userId: string | undefined, 
  userName: string | undefined,
  isMicOn: boolean,
  isCamOn: boolean
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const recognitionRef = useRef<any>(null);

  // 1. Initialize Local Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let mounted = true;

    const initStream = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (mounted) setError("Camera/mic unavailable — open the app at http://localhost:3000 (browsers block media access over plain HTTP from an IP address)");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        // Apply initial toggle state
        stream.getAudioTracks().forEach(track => track.enabled = isMicOn);
        stream.getVideoTracks().forEach(track => track.enabled = isCamOn);

        if (mounted) {
          setLocalStream(stream);
          activeStream = stream;
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      } catch (err: any) {
        if (mounted) setError("Failed to access Camera/Microphone: " + err.message);
      }
    };

    initStream();

    return () => {
      mounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Re-evaluating toggles is done later via effects

  // Handle toggles changing during call
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = isMicOn);
      localStream.getVideoTracks().forEach(track => track.enabled = isCamOn);
    }
  }, [isMicOn, isCamOn, localStream]);

  // 2. Initialize Socket and Signaling Once Local Stream is ready
  useEffect(() => {
    if (!meetingId || !userId || !userName || !localStream) return;

    // Connect to Signaling server
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId: meetingId, userId, userName });
    });

    const createPeerConnection = (targetSocketId: string, remoteUserId: string, remoteUserName: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: STUN_SERVER }]
      });

      peerConnections.current[targetSocketId] = pc;

      // Add local tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetSocketId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setPeers(prev => ({
          ...prev,
          [targetSocketId]: {
            userId: remoteUserId,
            userName: remoteUserName,
            stream: remoteStream
          }
        }));
      };

      // Handle disconnection
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          // Cleanup peer
          setPeers(prev => {
            const copy = { ...prev };
            delete copy[targetSocketId];
            return copy;
          });
          pc.close();
          delete peerConnections.current[targetSocketId];
        }
      };

      return pc;
    };

    // Signaling Handlers
    socket.on('existing-users', async (users) => {
      for (const u of users) {
        const pc = createPeerConnection(u.socketId, u.userId, u.userName);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { targetSocketId: u.socketId, offer, callerId: userId, callerName: userName });
      }
    });

    socket.on('user-joined', ({ userId: remoteUserId, userName: remoteUserName, socketId }) => {
      // Waiting for their offer
    });

    socket.on('offer', async ({ offer, callerId, callerName, socketId }) => {
      const pc = createPeerConnection(socketId, callerId, callerName);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { targetSocketId: socketId, answer });
    });

    socket.on('answer', async ({ answer, socketId }) => {
      const pc = peerConnections.current[socketId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate, socketId }) => {
      const pc = peerConnections.current[socketId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
      }
    });

    socket.on('user-left', ({ socketId }) => {
      setPeers(prev => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
    });

    // Transcript event
    socket.on('transcript', (data: Caption) => {
      setCaptions(prev => [...prev, data]);
    });

    return () => {
      socket.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      setPeers({});
    };
  }, [meetingId, userId, userName, localStream]);

  // 3. Audio Recording for Transcription via Web Speech API
  useEffect(() => {
    if (!localStream || !meetingId || !userId || !userName) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("Speech Recognition API not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      
      recognitionRef.current = recognition;

      let lastTranscript = "";
      let retryDelay = 1000;
      let hadNetworkError = false;

      recognition.onresult = (event: any) => {
        if (!isMicOn || !socketRef.current) return;

        retryDelay = 1000; // reset backoff on successful result
        hadNetworkError = false;

        const result = event.results[event.results.length - 1];
        if (!result.isFinal) return;

        const transcript = result[0].transcript.trim();
        if (!transcript || transcript.length < 3) return;
        if (transcript === lastTranscript) return;

        lastTranscript = transcript;

        socketRef.current.emit("transcript", {
          text: transcript,
          speaker: userName,
          meetingId: meetingId,
          timestamp: Date.now()
        });
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'network') {
          hadNetworkError = true;
          retryDelay = Math.min(retryDelay * 2, 30000);
          return; // suppress console spam; onend will handle retry with backoff
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          recognitionRef.current = null; // mic permission denied — stop retrying
          return;
        }
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        if (!recognitionRef.current) return;
        const delay = hadNetworkError ? retryDelay : 500;
        retryTimer = setTimeout(() => {
          if (recognitionRef.current && isMicOn) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }, delay);
      };

      if (isMicOn) {
        recognition.start();
      }

    } catch (err) {
      console.error("Speech recognition failed to start:", err);
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [meetingId, userId, userName, isMicOn, localStream]);

  // Restart/Stop recognition when mic toggles
  useEffect(() => {
    if (recognitionRef.current) {
      if (isMicOn) {
        try { recognitionRef.current.start(); } catch (e) {}
      } else {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    }
  }, [isMicOn]);

  return { localStream, peers, captions, error };
};
