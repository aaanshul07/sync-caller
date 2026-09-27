/**
 * Utility helpers for WebRTC media streams, fallbacks, and avatars
 */

export function createSyntheticStream(userName = 'User') {
  // Create an animated canvas video track
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let hue = 220;
  const render = () => {
    hue = (hue + 0.2) % 360;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${hue}, 45%, 15%)`);
    gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 50%, 25%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 70, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    // Text initials or name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(userName.charAt(0).toUpperCase() || 'U', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(userName, canvas.width / 2, canvas.height / 2 + 70);

    requestAnimationFrame(render);
  };
  render();

  const canvasStream = canvas.captureStream(25);
  const videoTrack = canvasStream.getVideoTracks()[0];

  // Create a silent audio track using Web Audio API
  let audioTrack = null;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      const dst = audioCtx.createMediaStreamDestination();
      gainNode.connect(dst);
      oscillator.start();
      audioTrack = dst.stream.getAudioTracks()[0];
    }
  } catch (err) {
    console.warn('Could not create synthetic audio track:', err);
  }

  const tracks = [videoTrack];
  if (audioTrack) tracks.push(audioTrack);

  return new MediaStream(tracks);
}

export async function getUserMediaStream({ video = true, audio = true, userName = 'User' } = {}) {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      });
      return { stream, isSynthetic: false, error: null };
    }
    throw new Error('getUserMedia not supported in this browser.');
  } catch (err) {
    console.warn('Real camera/mic unavailable, falling back to synthetic test stream:', err.message);
    const stream = createSyntheticStream(userName);
    return { stream, isSynthetic: true, error: err.message };
  }
}

export async function getDisplayMediaStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Screen sharing is not supported by your browser.');
  }
  return await navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: 'always',
      displaySurface: 'monitor'
    },
    audio: false
  });
}

export function getAvatarColor(name = '') {
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-fuchsia-600',
    'from-sky-500 to-indigo-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
