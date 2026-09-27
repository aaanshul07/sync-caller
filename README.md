# SyncSpace — Real-Time WebRTC Group Video Calling App

SyncSpace is a modern, high-performance multi-party video conferencing application built with **React**, **Tailwind CSS**, and **Node.js (Socket.io WebRTC signaling)**.

![SyncSpace Preview](https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Key Features

- 🎥 **Multi-Party Video Calls**: Peer-to-peer WebRTC mesh supporting smooth multi-participant rooms.
- 🎙️ **Audio & Video Controls**: Toggle your microphone and camera at any time with live visual feedback.
- 🖥️ **HD Screen Sharing**: One-click display capture with automatic stream switching and auto-reversion when sharing ends.
- 💬 **In-Call Real-Time Text Chat**: Floating sidebar drawer with message history, timestamps, and unread notification badge.
- 👥 **Participant Drawer**: Live roster displaying active participants and their mic/camera status.
- 📌 **Spotlight / Pinning**: Click the pin icon on any participant to expand them into a large spotlight view.
- 🔗 **One-Click Invite Links**: Copy room links (`?room=xxx-yyyy-zzz`) to easily invite teammates.
- 🎛️ **Pre-Call Device Preview (Lobby)**: Test camera and microphone before entering the room.
- 🧪 **Hardware Fallback Mode**: If camera/mic permissions are denied or no webcam is detected, an animated virtual test stream is generated so testing is seamless across multiple tabs on any computer.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### 2. Run Both Server & Client
From the project root:

```bash
npm run dev
```

This starts:
- **Signaling Server**: `http://localhost:5000`
- **Vite Web Client**: `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing Multi-Party Calls Locally

To test a multi-participant call on your local machine:
1. Open `http://localhost:5173` in your main browser window.
2. Enter your name (e.g. "Alice") and click **Start an Instant Meeting**.
3. In the meeting, click the **Copy Link** button in the top bar or bottom controls.
4. Open an **Incognito / Private window** (or another browser like Edge / Chrome / Firefox).
5. Paste the link, enter a different name (e.g. "Bob"), and click **Join**.
6. Both participants will instantly connect peer-to-peer!

---

## 📁 Project Architecture

```
VideoCall/
├── package.json               # Root scripts (concurrently runner)
├── README.md                  # Documentation
├── server/                    # Node.js Signaling Backend
│   ├── package.json
│   └── index.js              # Socket.io signaling server (WebRTC offers/answers/ICE)
└── client/                    # React Frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx          # Application entry point
        ├── App.jsx           # Routing & call state transitions
        ├── index.css         # Tailwind & custom animation styles
        ├── hooks/
        │   └── useWebRTC.js  # Mesh WebRTC & Socket.io engine
        ├── utils/
        │   ├── rtcConfig.js  # Google STUN servers configuration
        │   └── stream.js     # Media stream capture & canvas mock fallbacks
        └── components/
            ├── Lobby.jsx     # Pre-call device preview & join UI
            ├── Room.jsx      # Video call room layout & spotlight
            ├── VideoCard.jsx # Participant video tile & avatar fallback
            ├── Controls.jsx  # Bottom toolbar (mic, cam, share, chat, leave)
            ├── ChatDrawer.jsx# Real-time text messaging sidebar
            ├── ParticipantsDrawer.jsx # Active room members list
            └── Toast.jsx     # In-app notifications
```

---

## 🛡️ Signaling & WebRTC Protocol Flow

```
Alice                            Signaling Server (Socket.io)                          Bob
  │                                           │                                         │
  │── join-room (roomId) ────────────────────>│                                         │
  │                                           │<── join-room (roomId) ──────────────────│
  │                                           │── user-joined (Bob) ───────────────────>│
  │                                           │                                         │
  │── offer (SDP) ───────────────────────────>│── offer (SDP) ─────────────────────────>│
  │                                           │<── answer (SDP) ────────────────────────│
  │<── answer (SDP) ──────────────────────────│                                         │
  │                                           │                                         │
  │── ice-candidate ─────────────────────────>│── ice-candidate ───────────────────────>│
  │<── ice-candidate ─────────────────────────│<── ice-candidate ───────────────────────│
  │                                           │                                         │
  │===================== P2P Direct Media Stream (Encrypted) ===========================│
```

---

## 📜 License
MIT
