import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Room from './components/Room';

export default function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [initialRoomQuery, setInitialRoomQuery] = useState('');

  // Read URL query parameter on first mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomQuery(roomParam);
    }
  }, []);

  const handleJoinRoom = ({ roomId, userName, micEnabled, videoEnabled }) => {
    // Update browser URL without reloading
    const newUrl = `${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
    window.history.pushState({ roomId }, '', newUrl);

    setCurrentRoom({
      roomId,
      userName,
      micEnabled,
      videoEnabled,
    });
  };

  const handleLeaveRoom = () => {
    // Remove query param from URL
    window.history.pushState({}, '', window.location.pathname);
    setCurrentRoom(null);
  };

  if (currentRoom) {
    return (
      <Room
        roomId={currentRoom.roomId}
        userName={currentRoom.userName}
        initialMic={currentRoom.micEnabled}
        initialVideo={currentRoom.videoEnabled}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return <Lobby initialRoomId={initialRoomQuery} onJoinRoom={handleJoinRoom} />;
}
