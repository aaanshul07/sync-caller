import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Users,
  Copy,
  PhoneOff,
} from 'lucide-react';

export default function Controls({
  isMicOn,
  isVideoOn,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  unreadCount = 0,
  participantCount = 1,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onCopyLink,
  onLeaveCall,
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 px-4 bg-dark-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl max-w-fit mx-auto">
      {/* Mic Button */}
      <button
        onClick={onToggleMic}
        title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        className={`p-3 sm:p-3.5 rounded-xl flex items-center justify-center transition-all duration-200 border ${
          isMicOn
            ? 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/50'
            : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400/50 shadow-lg shadow-rose-500/25'
        }`}
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Video Button */}
      <button
        onClick={onToggleVideo}
        title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
        className={`p-3 sm:p-3.5 rounded-xl flex items-center justify-center transition-all duration-200 border ${
          isVideoOn
            ? 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/50'
            : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400/50 shadow-lg shadow-rose-500/25'
        }`}
      >
        {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Screen Share Button */}
      <button
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
        className={`p-3 sm:p-3.5 rounded-xl flex items-center justify-center transition-all duration-200 border ${
          isScreenSharing
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/25 animate-pulse'
            : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/50'
        }`}
      >
        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
      </button>

      <div className="w-[1px] h-7 bg-slate-800 my-auto mx-1 hidden sm:block" />

      {/* Chat Drawer Toggle */}
      <button
        onClick={onToggleChat}
        title="In-call Chat"
        className={`relative p-3 sm:p-3.5 rounded-xl flex items-center justify-center transition-all duration-200 border ${
          isChatOpen
            ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20'
            : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/50'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && !isChatOpen && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-dark-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Participants Drawer Toggle */}
      <button
        onClick={onToggleParticipants}
        title="Participants"
        className={`relative p-3 sm:p-3.5 rounded-xl flex items-center justify-center transition-all duration-200 border ${
          isParticipantsOpen
            ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20'
            : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border-slate-700/50'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-slate-700/80">
          {participantCount}
        </span>
      </button>

      {/* Copy Link Button */}
      <button
        onClick={onCopyLink}
        title="Copy Meeting Invite Link"
        className="p-3 sm:p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700/50 transition-all flex items-center justify-center"
      >
        <Copy className="w-5 h-5" />
      </button>

      {/* Leave Call Button */}
      <button
        onClick={onLeaveCall}
        title="Leave Meeting"
        className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold transition-all duration-200 border border-rose-500 shadow-lg shadow-rose-600/30 flex items-center gap-2"
      >
        <PhoneOff className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">Leave</span>
      </button>
    </div>
  );
}
