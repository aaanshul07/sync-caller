import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// In-memory store: roomId -> Array of { socketId, userName, micEnabled, videoEnabled }
const rooms = new Map();
// Socket ID -> { roomId, userName }
const socketToRoom = new Map();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    roomsCount: rooms.size,
    totalSockets: socketToRoom.size
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket connected] ${socket.id}`);

  // User joins a room
  socket.on('join-room', ({ roomId, userName, micEnabled = true, videoEnabled = true }) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, []);
    }

    const roomUsers = rooms.get(roomId);
    const existingUsers = [...roomUsers]; // Users already in the room

    const newUser = {
      socketId: socket.id,
      userName: userName || `User-${socket.id.substring(0, 4)}`,
      micEnabled,
      videoEnabled
    };

    roomUsers.push(newUser);
    socketToRoom.set(socket.id, { roomId, userName: newUser.userName });

    console.log(`[Join] User "${newUser.userName}" (${socket.id}) joined room "${roomId}". Total in room: ${roomUsers.length}`);

    // Send the list of existing users to the newly joined user
    socket.emit('room-users', {
      users: existingUsers,
      currentUser: newUser
    });

    // Notify other users in the room that a new user has joined
    socket.to(roomId).emit('user-joined', newUser);
  });

  // Relay WebRTC Offer
  socket.on('offer', ({ targetSocketId, offer, userName }) => {
    io.to(targetSocketId).emit('offer', {
      callerSocketId: socket.id,
      offer,
      userName
    });
  });

  // Relay WebRTC Answer
  socket.on('answer', ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit('answer', {
      responderSocketId: socket.id,
      answer
    });
  });

  // Relay ICE Candidate
  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', {
      senderSocketId: socket.id,
      candidate
    });
  });

  // Toggle audio / video status
  socket.on('toggle-media', ({ roomId, type, enabled }) => {
    const roomUsers = rooms.get(roomId);
    if (roomUsers) {
      const user = roomUsers.find(u => u.socketId === socket.id);
      if (user) {
        if (type === 'audio') user.micEnabled = enabled;
        if (type === 'video') user.videoEnabled = enabled;
      }
    }
    socket.to(roomId).emit('user-toggled-media', {
      socketId: socket.id,
      type,
      enabled
    });
  });

  // In-call text chat
  socket.on('chat-message', ({ roomId, message, userName }) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      id: `${socket.id}-${Date.now()}`,
      senderSocketId: socket.id,
      userName,
      message,
      timestamp
    };
    // Send to everyone in the room, including sender
    io.in(roomId).emit('new-chat-message', payload);
  });

  // Screen share status broadcast
  socket.on('screen-share-status', ({ roomId, isSharing }) => {
    socket.to(roomId).emit('user-screen-share', {
      socketId: socket.id,
      isSharing
    });
  });

  // Disconnect handling
  const handleLeave = () => {
    const userMeta = socketToRoom.get(socket.id);
    if (!userMeta) return;

    const { roomId, userName } = userMeta;
    socketToRoom.delete(socket.id);

    if (rooms.has(roomId)) {
      const updatedList = rooms.get(roomId).filter(u => u.socketId !== socket.id);
      if (updatedList.length === 0) {
        rooms.delete(roomId);
      } else {
        rooms.set(roomId, updatedList);
      }
    }

    console.log(`[Leave] User "${userName}" (${socket.id}) left room "${roomId}"`);
    socket.to(roomId).emit('user-left', {
      socketId: socket.id,
      userName
    });
  };

  socket.on('leave-room', handleLeave);
  socket.on('disconnect', handleLeave);
});

server.listen(PORT, () => {
  console.log(`[Signaling Server] Running on http://localhost:${PORT}`);
});
