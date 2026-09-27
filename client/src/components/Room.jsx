import React, { useState, useEffect, useMemo } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoCard from './VideoCard';
import Controls from './Controls';
import ChatDrawer from './ChatDrawer';
import ParticipantsDrawer from './ParticipantsDrawer';
import ToastContainer from './Toast';
import { Copy, ShieldCheck, Clock, Video as VideoIcon } from 'lucide-react';

export default function Room({ roomId, userName, initialMic, initialVideo, onLeaveRoom }) {
  const {
    localStream,
    isSynthetic,
    peers,
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
  } = useWebRTC(roomId, userName, initialMic, initialVideo);

  const [pinnedId, setPinnedId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Track unread messages
  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, isChatOpen]);

  const handleOpenChat = () => {
    setIsChatOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
    if (!isChatOpen) setIsParticipantsOpen(false);
  };

  const handleOpenParticipants = () => {
    setIsParticipantsOpen((prev) => !prev);
    if (!isParticipantsOpen) setIsChatOpen(false);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard
      .writeText(inviteUrl)
      .then(() => {
        addToast('Meeting invite link copied to clipboard!', 'success');
      })
      .catch(() => {
        // Fallback
        prompt('Copy this meeting link:', inviteUrl);
      });
  };

  // Build full participants list for rendering
  const allParticipants = useMemo(() => {
    const list = [
      {
        id: 'local',
        userName,
        isLocal: true,
        stream: localStream,
        micEnabled: isMicOn,
        videoEnabled: isVideoOn,
        isScreenSharing,
      },
      ...peers.map((p) => ({
        id: p.socketId,
        userName: p.userName,
        isLocal: false,
        stream: p.stream,
        micEnabled: p.micEnabled,
        videoEnabled: p.videoEnabled,
        isScreenSharing: false,
      })),
    ];
    return list;
  }, [userName, localStream, isMicOn, isVideoOn, isScreenSharing, peers]);

  // Determine grid layout CSS based on participant count
  const count = allParticipants.length;
  let gridLayout = 'grid-cols-1 max-w-4xl max-h-[75vh]';
  if (count === 2) {
    gridLayout = 'grid-cols-1 md:grid-cols-2 max-w-6xl max-h-[80vh]';
  } else if (count >= 3 && count <= 4) {
    gridLayout = 'grid-cols-1 sm:grid-cols-2 max-w-6xl max-h-[82vh]';
  } else if (count >= 5) {
    gridLayout = 'grid-cols-2 md:grid-cols-3 max-w-7xl max-h-[85vh]';
  }

  // Pinned participant if active
  const pinnedParticipant = pinnedId
    ? allParticipants.find((p) => p.id === pinnedId) || null
    : null;
  const unpinnedParticipants = pinnedId
    ? allParticipants.filter((p) => p.id !== pinnedId)
    : allParticipants;

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-dark-950 select-none">
      {/* Notifications Toast */}
      <ToastContainer toasts={toasts} />

      {/* Synthetic Stream Banner if fallback is used */}
      {isSynthetic && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-center text-xs text-amber-300">
          Camera/Microphone access was denied or unavailable. A simulated test stream is active so
          you can still test multi-participant calls!
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800/80 bg-dark-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <VideoIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-tight hidden sm:inline">SyncSpace</span>
          </div>

          <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Room ID Pill */}
          <button
            onClick={handleCopyLink}
            title="Click to copy invite link"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs sm:text-sm font-mono text-slate-300 transition-all hover:text-white group"
          >
            <span className="font-medium text-slate-400 group-hover:text-slate-200">Room:</span>
            <span className="text-white font-semibold">{roomId}</span>
            <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 transition-colors" />
          </button>
        </div>

        {/* Center: Call Timer & Security badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-mono">{formatTimer(callSeconds)}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>P2P WebRTC Encrypted</span>
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {connected ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Call View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid or Spotlight Container */}
        <main className="flex-1 flex flex-col p-3 sm:p-5 overflow-hidden items-center justify-center">
          {pinnedParticipant ? (
            /* Pinned / Spotlight Layout */
            <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center justify-center max-w-7xl">
              {/* Primary Pinned Video */}
              <div className="flex-1 w-full h-full min-h-[50vh] max-h-[80vh]">
                <VideoCard
                  stream={pinnedParticipant.stream}
                  userName={pinnedParticipant.userName}
                  isLocal={pinnedParticipant.isLocal}
                  micEnabled={pinnedParticipant.micEnabled}
                  videoEnabled={pinnedParticipant.videoEnabled}
                  isScreenSharing={pinnedParticipant.isScreenSharing}
                  isPinned={true}
                  onTogglePin={() => setPinnedId(null)}
                />
              </div>

              {/* Sidebar Thumbnails of remaining peers */}
              {unpinnedParticipants.length > 0 && (
                <div className="w-full md:w-64 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-36 md:max-h-[80vh] py-1">
                  {unpinnedParticipants.map((p) => (
                    <div key={p.id} className="w-44 md:w-full h-28 md:h-40 flex-shrink-0">
                      <VideoCard
                        stream={p.stream}
                        userName={p.userName}
                        isLocal={p.isLocal}
                        micEnabled={p.micEnabled}
                        videoEnabled={p.videoEnabled}
                        isScreenSharing={p.isScreenSharing}
                        isPinned={false}
                        onTogglePin={() => setPinnedId(p.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Adaptive Responsive Grid Layout */
            <div
              className={`grid ${gridLayout} gap-3 sm:gap-4 w-full h-full items-center justify-center transition-all duration-300`}
            >
              {allParticipants.map((p) => (
                <div key={p.id} className="w-full h-full min-h-[180px] max-h-[650px] aspect-video">
                  <VideoCard
                    stream={p.stream}
                    userName={p.userName}
                    isLocal={p.isLocal}
                    micEnabled={p.micEnabled}
                    videoEnabled={p.videoEnabled}
                    isScreenSharing={p.isScreenSharing}
                    isPinned={false}
                    onTogglePin={() => setPinnedId(p.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right Drawer: In-Call Messages */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={sendMessage}
          currentUserName={userName}
        />

        {/* Right Drawer: Participants List */}
        <ParticipantsDrawer
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          currentUserName={userName}
          isMicOn={isMicOn}
          isVideoOn={isVideoOn}
          peers={peers}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <footer className="p-3 sm:p-4 z-20">
        <Controls
          isMicOn={isMicOn}
          isVideoOn={isVideoOn}
          isScreenSharing={isScreenSharing}
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          unreadCount={unreadCount}
          participantCount={allParticipants.length}
          onToggleMic={toggleMic}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onToggleChat={handleOpenChat}
          onToggleParticipants={handleOpenParticipants}
          onCopyLink={handleCopyLink}
          onLeaveCall={onLeaveRoom}
        />
      </footer>
    </div>
  );
}
