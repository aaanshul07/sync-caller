import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { rtcConfig } from '../utils/rtcConfig';
import { getUserMediaStream, getDisplayMediaStream } from '../utils/stream';

// Derive signaling server URL:
// - If VITE_SIGNALING_URL is set, use it.
// - If running on Vite dev server (port 5173), default to localhost:5000 backend.
// - Otherwise (production unified build on Render/single host), use current origin.
const SERVER_URL =
  import.meta.env.VITE_SIGNALING_URL ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? `http://${window.location.hostname}:5000`
    : (typeof window !== 'undefined' ? window.location.origin : ''));


export function useWebRTC(roomId, userName, initialMic = true, initialVideo = true) {
  const [localStream, setLocalStream] = useState(null);
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [peers, setPeers] = useState(new Map()); // socketId -> { socketId, userName, stream, micEnabled, videoEnabled }
  const [isMicOn, setIsMicOn] = useState(initialMic);
  const [isVideoOn, setIsVideoOn] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraVideoTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const candidateQueuesRef = useRef(new Map()); // socketId -> RTCIceCandidate[]

  // Helper to add temporary notification toast
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Helper to create and configure an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((targetSocketId, targetUserName, currentLocalStream) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionsRef.current.set(targetSocketId, pc);

    // Queue for ICE candidates that arrive before remote description is set
    if (!candidateQueuesRef.current.has(targetSocketId)) {
      candidateQueuesRef.current.set(targetSocketId, []);
    }

    // Add local tracks to peer connection
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentLocalStream);
      });
    }

    // ICE Candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Remote Track event
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setPeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(targetSocketId) || {
            socketId: targetSocketId,
            userName: targetUserName,
            micEnabled: true,
            videoEnabled: true,
          };
          next.set(targetSocketId, {
            ...existing,
            stream: remoteStream,
          });
          return next;
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // Handled by user-left or cleanup
      }
    };

    return pc;
  }, []);

  // Initialize Media and Socket Connection
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Get User Media
      const { stream, isSynthetic: isSynth } = await getUserMediaStream({
        video: true,
        audio: true,
        userName,
      });

      if (!isMounted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Configure initial track states
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = initialMic;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = initialVideo;
        cameraVideoTrackRef.current = videoTrack;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsSynthetic(isSynth);
      setIsMicOn(initialMic);
      setIsVideoOn(initialVideo);

      // 2. Connect to Socket Signaling Server
      const socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        // Join the room
        socket.emit('join-room', {
          roomId,
          userName,
          micEnabled: initialMic,
          videoEnabled: initialVideo,
        });
      });

      // Existing users already in the room
      socket.on('room-users', async ({ users }) => {
        for (const user of users) {
          setPeers((prev) => {
            const next = new Map(prev);
            next.set(user.socketId, {
              socketId: user.socketId,
              userName: user.userName,
              micEnabled: user.micEnabled,
              videoEnabled: user.videoEnabled,
              stream: null,
            });
            return next;
          });

          // Create offer to existing user
          const pc = createPeerConnection(user.socketId, user.userName, localStreamRef.current);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', {
              targetSocketId: user.socketId,
              offer,
              userName,
            });
          } catch (err) {
            console.error('Error creating offer:', err);
          }
        }
      });

      // A new user has joined the room
      socket.on('user-joined', (newUser) => {
        addToast(`${newUser.userName} joined the room`, 'info');
        setPeers((prev) => {
          const next = new Map(prev);
          next.set(newUser.socketId, {
            socketId: newUser.socketId,
            userName: newUser.userName,
            micEnabled: newUser.micEnabled,
            videoEnabled: newUser.videoEnabled,
            stream: null,
          });
          return next;
        });
      });

      // Received WebRTC Offer
      socket.on('offer', async ({ callerSocketId, offer, userName: callerName }) => {
        const pc = createPeerConnection(callerSocketId, callerName, localStreamRef.current);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          // Process any queued ICE candidates
          const queued = candidateQueuesRef.current.get(callerSocketId) || [];
          for (const cand of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          candidateQueuesRef.current.set(callerSocketId, []);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            targetSocketId: callerSocketId,
            answer,
          });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      });

      // Received WebRTC Answer
      socket.on('answer', async ({ responderSocketId, answer }) => {
        const pc = peerConnectionsRef.current.get(responderSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            // Process any queued ICE candidates
            const queued = candidateQueuesRef.current.get(responderSocketId) || [];
            for (const cand of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            candidateQueuesRef.current.set(responderSocketId, []);
          } catch (err) {
            console.error('Error setting remote answer:', err);
          }
        }
      });

      // Received ICE Candidate
      socket.on('ice-candidate', async ({ senderSocketId, candidate }) => {
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding received ice candidate:', err);
          }
        } else {
          // Queue candidate until remote description is set
          const q = candidateQueuesRef.current.get(senderSocketId) || [];
          q.push(candidate);
          candidateQueuesRef.current.set(senderSocketId, q);
        }
      });

      // Remote peer toggled audio or video
      socket.on('user-toggled-media', ({ socketId, type, enabled }) => {
        setPeers((prev) => {
          if (!prev.has(socketId)) return prev;
          const next = new Map(prev);
          const current = next.get(socketId);
          next.set(socketId, {
            ...current,
            micEnabled: type === 'audio' ? enabled : current.micEnabled,
            videoEnabled: type === 'video' ? enabled : current.videoEnabled,
          });
          return next;
        });
      });

      // Remote peer left
      socket.on('user-left', ({ socketId, userName: leftUser }) => {
        addToast(`${leftUser || 'A user'} left the call`, 'warning');

        if (peerConnectionsRef.current.has(socketId)) {
          const pc = peerConnectionsRef.current.get(socketId);
          pc.close();
          peerConnectionsRef.current.delete(socketId);
        }
        candidateQueuesRef.current.delete(socketId);

        setPeers((prev) => {
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });
      });

      // In-call chat message
      socket.on('new-chat-message', (messageObj) => {
        setMessages((prev) => [...prev, messageObj]);
      });
    }

    init();

    return () => {
      isMounted = false;
      // Cleanup all connections
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      candidateQueuesRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.emit('leave-room');
        socketRef.current.disconnect();
      }
    };
  }, [roomId, userName, createPeerConnection, addToast]);

  // Toggle Microphone
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      setIsMicOn(nextState);

      if (socketRef.current) {
        socketRef.current.emit('toggle-media', {
          roomId,
          type: 'audio',
          enabled: nextState,
        });
      }
    }
  }, [roomId]);

  // Toggle Video (Camera)
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      setIsVideoOn(nextState);

      if (socketRef.current) {
        socketRef.current.emit('toggle-media', {
          roomId,
          type: 'video',
          enabled: nextState,
        });
      }
    }
  }, [roomId]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }

      const camTrack = cameraVideoTrackRef.current;
      if (camTrack && localStreamRef.current) {
        // Replace video track in local stream
        const currentVideo = localStreamRef.current.getVideoTracks()[0];
        if (currentVideo) localStreamRef.current.removeTrack(currentVideo);
        localStreamRef.current.addTrack(camTrack);

        // Replace track across all peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(camTrack);
          }
        });
      }

      setIsScreenSharing(false);
      if (socketRef.current) {
        socketRef.current.emit('screen-share-status', { roomId, isSharing: false });
      }
    } else {
      // Start screen share
      try {
        const screenStream = await getDisplayMediaStream();
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        screenStreamRef.current = screenStream;

        // Auto-revert when user clicks browser stop sharing button
        screenVideoTrack.onended = () => {
          toggleScreenShare();
        };

        // Replace in peer connections
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenVideoTrack);
          }
        });

        // Replace track in local stream for preview
        if (localStreamRef.current) {
          const currentVideo = localStreamRef.current.getVideoTracks()[0];
          if (currentVideo) localStreamRef.current.removeTrack(currentVideo);
          localStreamRef.current.addTrack(screenVideoTrack);
        }

        setIsScreenSharing(true);
        if (socketRef.current) {
          socketRef.current.emit('screen-share-status', { roomId, isSharing: true });
        }
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  }, [isScreenSharing, roomId]);

  // Send in-call chat message
  const sendMessage = useCallback((text) => {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('chat-message', {
      roomId,
      message: text.trim(),
      userName,
    });
  }, [roomId, userName]);

  return {
    localStream,
    isSynthetic,
    peers: Array.from(peers.values()),
    isMicOn,
    isVideoOn,
    isScreenSharing,
    messages,
    toasts,
    connected,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    addToast,
  };
}
