import React from 'react';
import { X, Users, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { getAvatarColor } from '../utils/stream';

export default function ParticipantsDrawer({
  isOpen,
  onClose,
  currentUserName,
  isMicOn,
  isVideoOn,
  peers,
}) {
  if (!isOpen) return null;

  const totalCount = peers.length + 1;

  return (
    <div className="w-80 sm:w-88 flex flex-col h-full bg-dark-900 border-l border-slate-800/80 shadow-2xl z-30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          <h2 className="font-semibold text-white">People ({totalCount})</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Local User */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarColor(
                currentUserName
              )} flex items-center justify-center font-bold text-white text-xs shadow-sm`}
            >
              {currentUserName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {currentUserName} <span className="text-xs text-brand-400 font-normal">(You)</span>
              </p>
              <span className="text-[11px] text-slate-400">Meeting Host</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isMicOn ? 'text-slate-400' : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </div>
            <div
              className={`p-1.5 rounded-lg ${
                isVideoOn ? 'text-slate-400' : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Remote Peers */}
        {peers.map((peer) => (
          <div
            key={peer.socketId}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/20 hover:bg-slate-800/50 border border-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarColor(
                  peer.userName
                )} flex items-center justify-center font-bold text-white text-xs shadow-sm`}
              >
                {peer.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{peer.userName}</p>
                <span className="text-[11px] text-slate-500">Participant</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  peer.micEnabled ? 'text-slate-400' : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {peer.micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </div>
              <div
                className={`p-1.5 rounded-lg ${
                  peer.videoEnabled ? 'text-slate-400' : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {peer.videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
