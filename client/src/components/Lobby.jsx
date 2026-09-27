import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Share2,
  MessageSquare,
  Users,
} from 'lucide-react';
import { getUserMediaStream, getAvatarColor } from '../utils/stream';

export default function Lobby({ initialRoomId = '', onJoinRoom }) {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('syncspace_username') || `User-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [roomInput, setRoomInput] = useState(initialRoomId);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [previewStream, setPreviewStream] = useState(null);
  const [isSynthetic, setIsSynthetic] = useState(false);

  const videoRef = useRef(null);

  // Initialize camera/mic preview
  useEffect(() => {
    let active = true;

    async function setupPreview() {
      const { stream, isSynthetic: synth } = await getUserMediaStream({
        video: true,
        audio: true,
        userName,
      });

      if (!active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setPreviewStream(stream);
      setIsSynthetic(synth);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }

    setupPreview();

    return () => {
      active = false;
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update track states when toggled
  const handleToggleMic = () => {
    if (previewStream) {
      const audioTrack = previewStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
      }
    }
    setIsMicOn(!isMicOn);
  };

  const handleToggleVideo = () => {
    if (previewStream) {
      const videoTrack = previewStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
      }
    }
    setIsVideoOn(!isVideoOn);
  };

  // Generate a friendly room ID
  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
  };

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    const newRoomId = generateRoomId();
    localStorage.setItem('syncspace_username', userName.trim());

    // Stop local preview tracks before joining call
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
    }

    onJoinRoom({
      roomId: newRoomId,
      userName: userName.trim() || 'Anonymous',
      micEnabled: isMicOn,
      videoEnabled: isVideoOn,
    });
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (!roomInput.trim()) return;

    // Support pasted URLs like http://localhost:5173/?room=abc-defg-hij
    let cleanedRoomId = roomInput.trim();
    if (cleanedRoomId.includes('room=')) {
      try {
        const url = new URL(cleanedRoomId);
        cleanedRoomId = url.searchParams.get('room') || cleanedRoomId;
      } catch {
        const match = cleanedRoomId.match(/room=([a-zA-Z0-9_-]+)/);
        if (match) cleanedRoomId = match[1];
      }
    }

    localStorage.setItem('syncspace_username', userName.trim());

    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
    }

    onJoinRoom({
      roomId: cleanedRoomId,
      userName: userName.trim() || 'Anonymous',
      micEnabled: isMicOn,
      videoEnabled: isVideoOn,
    });
  };

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen w-screen bg-dark-950 flex flex-col justify-between overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block">SyncSpace</span>
            <span className="text-[11px] text-slate-400 -mt-1 block">Group Video Conferencing</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>WebRTC P2P Ready</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 md:py-12 flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left Side: Options & Form */}
        <div className="flex-1 max-w-xl w-full space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Crystal Clear Audio & Video</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Connect with anyone, anywhere, effortlessly.
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              High performance multi-party video calling right in your browser. No downloads, no
              sign-ups required.
            </p>
          </div>

          {/* User Name Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Display Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Sarah Connor"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
            />
          </div>

          {/* Meeting Actions */}
          <div className="space-y-4 pt-2">
            {/* Create Instant Meeting */}
            <button
              onClick={handleCreateMeeting}
              className="w-full py-4 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white font-semibold transition-all shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 text-base group"
            >
              <Video className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>Start an Instant Meeting</span>
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="h-[1px] bg-slate-800 flex-1" />
              <span className="text-xs text-slate-500 uppercase font-semibold">Or join existing</span>
              <div className="h-[1px] bg-slate-800 flex-1" />
            </div>

            {/* Join Existing Meeting Form */}
            <form onSubmit={handleJoinMeeting} className="flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter meeting code or link (e.g. abc-defg-hij)"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm font-mono"
              />
              <button
                type="submit"
                disabled={!roomInput.trim()}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-semibold transition-all flex items-center gap-2 text-sm"
              >
                <span>Join</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure P2P Mesh</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Screen Sharing</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>In-Call Chat</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Pre-Join Media Preview */}
        <div className="flex-1 max-w-md w-full flex flex-col items-center">
          <div className="w-full relative aspect-video rounded-3xl overflow-hidden bg-dark-900 border border-slate-800/80 shadow-2xl group">
            {/* Live Camera View */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 -scale-x-100 ${
                isVideoOn ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
              }`}
            />

            {/* Avatar Fallback if camera is off */}
            {!isVideoOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-dark-900 to-dark-950">
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-tr ${getAvatarColor(
                    userName
                  )} flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-slate-800/50`}
                >
                  {initials}
                </div>
                <p className="mt-4 text-slate-400 text-sm font-medium">Camera is turned off</p>
              </div>
            )}

            {/* Preview Control Toggles inside video card */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-3 rounded-xl backdrop-blur-md border transition-all ${
                  isMicOn
                    ? 'bg-slate-900/80 text-white border-slate-700/60 hover:bg-slate-800'
                    : 'bg-rose-500/90 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                }`}
                title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleToggleVideo}
                className={`p-3 rounded-xl backdrop-blur-md border transition-all ${
                  isVideoOn
                    ? 'bg-slate-900/80 text-white border-slate-700/60 hover:bg-slate-800'
                    : 'bg-rose-500/90 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                }`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Preview your audio & video before joining the call
            </p>
            {isSynthetic && (
              <p className="text-[11px] text-amber-400/80 mt-1">
                Virtual test stream active (webcam unavailable or in use)
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        SyncSpace &bull; Real-Time WebRTC Group Video Calling
      </footer>
    </div>
  );
}
