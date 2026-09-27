import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Pin, PinOff, MonitorUp } from 'lucide-react';
import { getAvatarColor } from '../utils/stream';

export default function VideoCard({
  stream,
  userName = 'User',
  isLocal = false,
  micEnabled = true,
  videoEnabled = true,
  isScreenSharing = false,
  isPinned = false,
  onTogglePin,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const avatarGradient = getAvatarColor(userName);

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden bg-dark-900 border transition-all duration-300 shadow-lg ${
        isPinned
          ? 'w-full h-full border-brand-500/60 ring-2 ring-brand-500/30'
          : 'w-full h-full border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          videoEnabled ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        } ${isLocal && !isScreenSharing ? '-scale-x-100' : ''}`}
      />

      {/* Avatar Fallback when video is turned off */}
      {!videoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-dark-900 to-dark-950">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-2xl ring-4 ring-slate-800/50`}
          >
            {initials}
          </div>
          <p className="mt-4 text-slate-300 font-medium text-sm sm:text-base">
            {userName} {isLocal && '(You)'}
          </p>
        </div>
      )}

      {/* Pin / Unpin Button Overlay */}
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          title={isPinned ? 'Unpin video' : 'Pin video'}
          className="absolute top-3 right-3 p-2 rounded-xl bg-dark-950/70 hover:bg-dark-900 text-slate-300 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-slate-700/50 shadow-md"
        >
          {isPinned ? <PinOff className="w-4 h-4 text-brand-400" /> : <Pin className="w-4 h-4" />}
        </button>
      )}

      {/* Screen Sharing Indicator */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/90 text-white text-xs font-semibold backdrop-blur-md shadow-md animate-pulse">
          <MonitorUp className="w-3.5 h-3.5" />
          <span>Presenting</span>
        </div>
      )}

      {/* Bottom Info Bar: Name & Mic status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-950/80 text-white text-xs sm:text-sm font-medium backdrop-blur-md border border-slate-800/80 shadow-md">
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {userName} {isLocal && '(You)'}
          </span>
        </div>

        <div
          className={`flex items-center justify-center w-8 h-8 rounded-xl backdrop-blur-md border shadow-md ${
            micEnabled
              ? 'bg-dark-950/80 text-emerald-400 border-slate-800/80'
              : 'bg-rose-500/90 text-white border-rose-400/50'
          }`}
          title={micEnabled ? 'Microphone on' : 'Microphone muted'}
        >
          {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}
