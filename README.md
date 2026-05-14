<div align="center">

# CodeRoom

### Real-time Collaborative Code Editor

[![Version](https://img.shields.io/badge/version-1.0.0-2cbb5d?style=for-the-badge)](.)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](.)
[![Status](https://img.shields.io/badge/status-Active%20Development-brightgreen?style=for-the-badge)](.)

**A web-based collaborative coding environment that enables real-time multi-user code editing, execution, and AI-powered assistance — all within the browser.**

[Features](#-key-features) · [Architecture](#-system-architecture) · [Tech Stack](#-technology-stack) · [API Reference](#-api-reference) · [Contributing](#-contributing)

</div>

---

## 📖 Overview

**CodeRoom** is a full-stack collaborative code editor designed to solve the problem of remote pair programming and real-time code collaboration. Unlike traditional code-sharing tools that rely on screen sharing or turn-based editing, CodeRoom provides a seamless, simultaneous editing experience where multiple developers can write, debug, and execute code together in real time.

The platform is built around three core principles:

- **Zero-latency collaboration** — Code changes propagate to all participants within milliseconds via persistent WebSocket connections, with debounced persistence to MongoDB ensuring no work is ever lost.
- **Integrated development workflow** — Beyond editing, CodeRoom provides a complete workflow: compile & run code in 7 languages, inspect output together, chat in context, and leverage AI assistance — all without leaving the editor.
- **Privacy-first room management** — Rooms support optional bcrypt-hashed password protection, giving teams control over who can access their collaborative sessions.

---

## 🧩 Key Features

### Real-time Code Synchronization

CodeRoom employs a WebSocket-driven synchronization model using Socket.IO. Every keystroke is captured, debounced at 300ms on the client side, then broadcast to all connected peers and persisted to MongoDB. Remote cursors are rendered with per-user color coding and auto-hide after 5 seconds of inactivity, providing spatial awareness without visual clutter.

### Multi-Language Code Execution

Code execution is powered by the **Wandbox** compilation service, supporting 7 languages with production-grade compilers:

| Language | Compiler / Runtime | Version |
|---|---|---|
| C++ | GCC | 13.2.0 |
| Python | CPython | 3.12.7 |
| Java | OpenJDK | 22 |
| JavaScript | Node.js | 20.17.0 |
| TypeScript | TypeScript Compiler | 5.6.2 |
| C# | .NET Core | 8.0.402 |
| PHP | PHP | 8.3.12 |

Execution results (stdout, stderr, exit codes) are synchronized across all room participants in real time, enabling collaborative debugging sessions.

### AI-Powered Code Assistant

An integrated AI assistant powered by **Google Gemini 2.5 Flash** provides four specialized operations:

| Operation | Description |
|---|---|
| **Explain** | Analyzes and explains code logic, highlighting potential issues |
| **Fix Bugs** | Identifies bugs, explains root causes, and provides corrected code |
| **Optimize** | Suggests performance improvements and cleaner code patterns |
| **Free Chat** | Context-aware conversation with full access to the current codebase |

All AI responses are delivered via **Server-Sent Events (SSE)**, producing a real-time streaming effect. The AI panel is implemented as a draggable, resizable overlay (`react-rnd`) that doesn't interfere with the editing workspace.

### Room System & Access Control

- **Room creation** with auto-generated 8-character UUIDs
- **Optional password protection** — passwords are hashed with bcrypt (salt rounds = 10) and verified server-side before granting access
- **Participant tracking** — the system distinguishes between online (active WebSocket connection) and offline (previously joined but disconnected) members
- **Room ownership** — the original creator is persisted and displayed, independent of join order
- **Code history** — up to 20 snapshots per room with per-snapshot metadata (author, timestamp, language)

### Editor Experience

Built on **Monaco Editor** (the same engine powering VS Code), the editor provides:

- Full syntax highlighting and IntelliSense for all 7 supported languages
- Configurable themes (VS Dark, VS Light, High Contrast)
- Adjustable font size, minimap toggle, and word wrap settings
- Stdin input support for interactive programs
- One-click room link sharing

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   CLIENT  (React 19 + Vite 8)                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐   │
│  │  Login   │  │ RoomMenu │  │  CodeApp  │  │  AIPanel   │   │
│  │  (Auth)  │  │  (Lobby) │  │ (Editor)  │  │ (Gemini)   │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └─────┬──────┘   │
│       │              │              │              │         │
│       └──────────────┴──────┬───────┴──────────────┘         │
│                             │                                │
│                    useSocket (Custom Hook)                   │
│              ┌──────────────┴──────────────┐                 │
│              │ REST API        Socket.IO   │                 │
└──────────────┼─────────────────────────────┼─────────────────┘
               │              │              │
               ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                SERVER  (Express 5 + Socket.IO 4.8)           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐   │
│  │ Auth API │  │ Room API │  │ Code API  │  │   AI API   │   │
│  │ (JWT)    │  │ (CRUD)   │  │ (Wandbox) │  │   (SSE)    │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └─────┬──────┘   │
│       │              │              │              │         │
│       ▼              ▼              │              ▼         │
│  ┌─────────────────────────┐   ┌────┴────┐   ┌──────────┐    │
│  │    MongoDB (Mongoose)   │   │ Wandbox │   │  Gemini  │    │
│  │  Users · Rooms · History│   │   API   │   │   API    │    │
│  └─────────────────────────┘   └─────────┘   └──────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Communication Patterns

| Pattern | Protocol | Use Case |
|---|---|---|
| **REST API** | HTTP/JSON | Authentication, room CRUD, code execution |
| **WebSocket** | Socket.IO | Code sync, cursor tracking, chat, output sync |
| **SSE** | `text/event-stream` | AI response streaming (Gemini) |

### Data Flow: Code Synchronization

```
User A types code
       │
       ▼
 Frontend debounce (300ms)
       │
       ▼
 socket.emit('code-change')  ──►  Server receives
       │                                │
       │                     ┌──────────┴──────────┐
       │                     ▼                     ▼
       │              socket.to(room)        Room.findOneAndUpdate()
       │              .emit('code-sync')     (persist to MongoDB)
       │                     │
       │                     ▼
       │              User B, C, ... receive
       │              and update Monaco Editor
       ▼
 Local editor updates immediately (optimistic)
```

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.4 | Component-based UI with React Compiler optimization |
| **Vite** | 8.0.1 | ESM-native build tool & HMR dev server |
| **Monaco Editor** | 0.55.1 | VS Code's editor engine (syntax, IntelliSense, minimap) |
| **Socket.IO Client** | 4.8.3 | Persistent WebSocket with automatic reconnection |
| **React Router** | 7.14.0 | Client-side routing & navigation guards |
| **react-rnd** | 10.5.3 | Draggable & resizable AI panel |
| **SASS** | 1.98.0 | Modular SCSS stylesheets per component |
| **Bootstrap** | 5.3.8 | Auth pages layout & utilities |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Express** | 5.1.0 | HTTP server with async error handling |
| **Socket.IO** | 4.8.1 | WebSocket server with room management |
| **Mongoose** | 8.13.2 | MongoDB ODM with schema validation |
| **JWT** | 9.0.2 | Stateless authentication tokens |
| **bcryptjs** | 3.0.2 | Password hashing (user accounts + room passwords) |
| **@google/generative-ai** | 0.24.1 | Gemini 2.5 Flash integration with streaming |
| **uuid** | 11.1.0 | Cryptographic room ID generation |

### External Services

| Service | Role |
|---|---|
| **Wandbox** (`wandbox.org`) | Serverless code compilation & execution (7 languages) |
| **Google Gemini 2.5 Flash** | Generative AI for code analysis, debugging & optimization |
| **MongoDB** | Document database for users, rooms, code, and snapshot history |

---

## 📁 Project Structure

```
Project_code_realTime/
│
├── app_code_realTime/                  # ── Frontend Application ──
│   ├── src/
│   │   ├── App.jsx                     # Root router (Login → RoomMenu → CodeApp)
│   │   ├── CodeApp.jsx                 # Main editor workspace orchestrator
│   │   ├── hooks/
│   │   │   └── useSocket.js            # Centralized Socket.IO hook
│   │   └── component/
│   │       ├── Login/                  # JWT authentication (register/login)
│   │       ├── RoomMenu/              # Room lobby: create, join, search, browse
│   │       ├── Header/                # Toolbar: language selector, run, AI, share
│   │       ├── Editor/                # Monaco Editor wrapper with remote cursors
│   │       ├── Sidebar/              # Online/offline members + real-time chat
│   │       ├── OutputPanel/          # Execution output console + stdin input
│   │       ├── AIPanel/              # Gemini AI assistant (draggable overlay)
│   │       ├── History/              # Code snapshot timeline (save/restore)
│   │       └── EditorSettings/       # Theme, font, minimap, word wrap config
│   ├── vite.config.js
│   └── package.json
│
└── severApp/                           # ── Backend Server ──
    ├── index.js                        # Express + Socket.IO bootstrap, event handlers
    ├── middleware/
    │   └── auth.js                     # JWT verification (HTTP + Socket handshake)
    ├── routes/
    │   ├── auth.js                     # POST /register, /login, /logout | GET /me
    │   ├── rooms.js                    # Room CRUD + password verification
    │   ├── code.js                     # POST /execute → Wandbox proxy
    │   └── ai.js                       # AI endpoints with SSE streaming
    ├── models/
    │   ├── User.js                     # { username, email, password (bcrypt) }
    │   └── Room.js                     # { roomId, code, language, participants, history[] }
    └── package.json
```

---

## 🔌 API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create new account → returns JWT |
| `POST` | `/login` | Authenticate credentials → returns JWT |
| `POST` | `/logout` | Invalidate session |
| `GET` | `/me` | Get authenticated user profile |

### Rooms — `/api/rooms`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create room (optional: `password` field for private rooms) |
| `GET` | `/` | List rooms the authenticated user has joined |
| `GET` | `/all?search=` | Search & browse all rooms |
| `GET` | `/:roomId` | Get room details (code, language, participants) |
| `GET` | `/:roomId/history` | Retrieve code snapshots (max 20) |
| `POST` | `/:roomId/verify-password` | Verify room password before joining |

### Code Execution — `/api/code`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/execute` | Compile & run code via Wandbox (body: `{ code, language, stdin }`) |

### AI Assistant — `/api/ai`

All AI endpoints accept `{ code, language }` and return `text/event-stream` (SSE).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/explain` | Explain code logic and identify potential issues |
| `POST` | `/fix` | Detect bugs, explain causes, provide corrected code |
| `POST` | `/optimize` | Suggest performance and readability improvements |
| `POST` | `/chat` | Free-form conversation with code context (body includes `message`) |

---

## 🔄 Socket.IO Event Protocol

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-room` | `roomId: string` | Join a room (auto-creates if not exists) |
| `code-change` | `{ roomId, code }` | Broadcast code update (debounced 300ms client-side) |
| `language-change` | `{ roomId, language }` | Switch programming language for the room |
| `output-sync` | `{ roomId, output, isRunning }` | Share execution output with all members |
| `send-message` | `{ roomId, text }` | Send chat message (max 500 chars) |
| `save-snapshot` | `{ roomId, code, language }` | Save a code snapshot to history |
| `cursor-move` | `{ roomId, cursorData }` | Broadcast cursor position for remote cursor rendering |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room-state` | `{ code, language, owner, ownerId, participants }` | Full room state on join |
| `code-sync` | `{ code }` | Code update from another participant |
| `language-sync` | `{ language }` | Language change from another participant |
| `output-update` | `{ output, isRunning }` | Execution output from another participant |
| `users-update` | `[{ username, socketId, joinedAt }]` | Online users list (on any join/leave) |
| `user-joined` | `{ username, onlineCount }` | Notification: new user joined |
| `user-left` | `{ username, onlineCount }` | Notification: user disconnected |
| `receive-message` | `{ username, text, timestamp }` | Chat message broadcast |
| `snapshot-saved` | `{ code, language, savedBy, savedAt }` | Snapshot confirmation |
| `cursor-update` | `{ socketId, username, ...cursorData }` | Remote cursor position |

---

## 🔐 Security Model

| Layer | Mechanism | Details |
|---|---|---|
| **Authentication** | JWT (HS256) | Stateless tokens via `Authorization: Bearer <token>` header |
| **Socket Auth** | Handshake token | JWT verified in `io.use()` middleware before connection |
| **User Passwords** | bcrypt | Salted hash (configurable rounds) for user account passwords |
| **Room Passwords** | bcrypt | Optional per-room password, hashed with 10 salt rounds |
| **Input Validation** | Server-side | Room IDs sanitized, chat messages capped at 500 chars, code body limited to 1MB |
| **CORS** | Origin whitelist | Restricted to `localhost:*` in development |

---

## ⚙️ Environment Configuration

The backend requires a `.env` file in the `severApp/` directory:

```env
# MongoDB connection URI
MONGO_URI=mongodb://localhost:27017/coderoom

# JWT signing secret (use a strong, random string in production)
JWT_SECRET=<your-secret-key>

# Google Gemini API Key — obtain at https://aistudio.google.com/apikey
GEMINI_API_KEY=<your-gemini-api-key>

# Server port (default: 3001)
PORT=3001
```

> **Note**: The `.env` file must never be committed to version control. Ensure it is listed in `.gitignore`.

---

## 📝 Technical Notes

- **Graceful shutdown** — The server handles `SIGINT` / `SIGTERM` signals, closing Socket.IO connections, HTTP server, and MongoDB connections in order before exiting.
- **Ghost user prevention** — On disconnect, users are removed from all rooms they've joined (not just the current one), preventing stale entries in the online users list.
- **Lazy AI initialization** — The Gemini client is initialized on first API call rather than at module load time, avoiding crashes when the API key is not configured.
- **Optimistic UI** — Code changes are applied locally immediately, then broadcast asynchronously, ensuring the typing experience feels native regardless of network latency.
- **Snapshot cap** — MongoDB's `$slice: -20` operator is used to enforce the 20-snapshot limit per room at the database level, preventing unbounded growth.

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes before submitting a pull request.

---

<div align="center">

**Built with ❤️ by CodeRoom Team**

*Real-time collaboration, reimagined for developers.*

</div>
