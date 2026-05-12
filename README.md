# 🚀 CodeRoom — Real-time Collaborative Code Editor

<div align="center">

![CodeRoom](https://img.shields.io/badge/CodeRoom-v1.0-2cbb5d?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)
![Gemini AI](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google)

**Ứng dụng lập trình cộng tác thời gian thực — cho phép nhiều người cùng code, chat, chạy code và sử dụng AI hỗ trợ.**

</div>

---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Kiến trúc](#-kiến-trúc)
- [Tech Stack](#-tech-stack)
- [Cài đặt](#-cài-đặt)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [API Endpoints](#-api-endpoints)
- [Socket.IO Events](#-socketio-events)
- [Ngôn ngữ hỗ trợ](#-ngôn-ngữ-hỗ-trợ)
- [Biến môi trường](#-biến-môi-trường)

---

## ✨ Tính năng

### 🔥 Core
- **Real-time Code Sync** — Nhiều người cùng viết code trong một phòng, thay đổi được đồng bộ tức thì qua WebSocket
- **Remote Cursor** — Hiển thị vị trí con trỏ của các thành viên khác trên editor
- **Monaco Editor** — Engine editor giống VS Code với syntax highlighting, IntelliSense, minimap
- **7 ngôn ngữ** — C++, Python, Java, JavaScript, TypeScript, C#, PHP

### 👥 Collaboration
- **Room System** — Tạo/tham gia phòng bằng Room ID (8 ký tự)
- **🔒 Password Protected Rooms** — Đặt mật khẩu cho phòng riêng tư (bcrypt hash)
- **Online/Offline Members** — Hiển thị danh sách thành viên online và offline
- **Real-time Chat** — Trò chuyện trực tiếp trong phòng

### ⚡ Code Execution
- **Run Code** — Biên dịch & chạy code trực tiếp trên trình duyệt
- **Stdin Support** — Nhập input (stdin) cho chương trình
- **Output Sync** — Kết quả chạy code được đồng bộ cho tất cả thành viên
- **Wandbox API** — Sử dụng Wandbox (miễn phí, không cần API key) để execute code

### 🤖 AI Assistant
- **Gemini 2.5 Flash** — Tích hợp Google Gemini AI
- **4 chức năng**: Explain Code, Fix Bugs, Optimize, Free Chat
- **Streaming Response** — Real-time typing effect qua Server-Sent Events (SSE)
- **Draggable Panel** — Panel AI có thể kéo thả, resize tùy ý

### 📜 History & Settings
- **Code Snapshots** — Lưu/khôi phục tối đa 20 snapshot code
- **Editor Settings** — Tùy chỉnh theme (VS Dark/Light/HC), font size, minimap, word wrap
- **Share Room** — Copy link phòng để mời người khác

---

## 🏗 Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Login   │ │ RoomMenu │ │ CodeApp  │ │  AIPanel   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│                       │ Socket.IO │ REST API            │
└───────────────────────┼───────────┼─────────────────────┘
                        │           │
┌───────────────────────┼───────────┼─────────────────────┐
│              Backend (Express 5 + Socket.IO)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Auth API │ │ Room API │ │ Code API │ │   AI API   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│       │              │           │              │       │
│  ┌────┴──────────────┴───┐  ┌───┴───┐    ┌─────┴────┐  │
│  │       MongoDB         │  │Wandbox│    │ Gemini   │  │
│  └───────────────────────┘  └───────┘    └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| React | 19.2.4 | UI Framework |
| Vite | 8.0.1 | Build tool & dev server |
| Monaco Editor | 0.55.1 | Code editor (VS Code engine) |
| Socket.IO Client | 4.8.3 | Real-time communication |
| React Router DOM | 7.14.0 | Client-side routing |
| Bootstrap | 5.3.8 | CSS framework (Login page) |
| React Icons | 5.6.0 | Icon library |
| react-rnd | 10.5.3 | Draggable/resizable (AI Panel) |
| SASS | 1.98.0 | CSS preprocessor |

### Backend
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| Express | 5.1.0 | HTTP server |
| Socket.IO | 4.8.1 | WebSocket server |
| Mongoose | 8.13.2 | MongoDB ODM |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 3.0.2 | Password hashing |
| @google/generative-ai | 0.24.1 | Gemini AI integration |
| uuid | 11.1.0 | Room ID generation |

### External Services
| Service | Vai trò |
|---|---|
| **Wandbox** (`wandbox.org`) | Compile & execute code (7 ngôn ngữ) |
| **Google Gemini 2.5 Flash** | AI code assistant (SSE streaming) |
| **MongoDB** | Database lưu users, rooms, code snapshots |

---

## 🚀 Cài đặt

### Yêu cầu
- **Node.js** >= 18
- **MongoDB** (local hoặc MongoDB Atlas)
- **npm** hoặc **yarn**

### 1. Clone dự án
```bash
git clone <repo-url>
cd Project_code_realTime
```

### 2. Cài đặt Backend
```bash
cd severApp
npm install
```

Tạo file `.env`:
```env
MONGO_URI=mongodb://localhost:27017/coderoom
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

Chạy server:
```bash
npm run dev
```

### 3. Cài đặt Frontend
```bash
cd app_code_realTime
npm install
npm run dev
```

### 4. Truy cập
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

---

## 📁 Cấu trúc thư mục

```
Project_code_realTime/
├── app_code_realTime/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx                 # Routing chính
│   │   ├── CodeApp.jsx             # Trang editor chính
│   │   ├── hooks/
│   │   │   └── useSocket.js        # Custom hook Socket.IO
│   │   └── component/
│   │       ├── Login/              # Đăng nhập / đăng ký
│   │       ├── RoomMenu/           # Danh sách phòng + tạo/join
│   │       ├── Header/             # Header + language selector
│   │       ├── Sidebar/            # People (online/offline) + Chat
│   │       ├── Editor/             # Monaco Editor wrapper
│   │       ├── OutputPanel/        # Console output + stdin
│   │       ├── History/            # Code snapshots
│   │       ├── AIPanel/            # Gemini AI assistant
│   │       └── EditorSettings/     # Theme, font size, etc.
│   ├── package.json
│   └── vite.config.js
│
└── severApp/                       # Backend (Express + Socket.IO)
    ├── index.js                    # Server chính + Socket events
    ├── middleware/
    │   └── auth.js                 # JWT authentication
    ├── routes/
    │   ├── auth.js                 # Register, Login, Logout
    │   ├── rooms.js                # CRUD rooms + verify-password
    │   ├── code.js                 # Code execution (Wandbox proxy)
    │   └── ai.js                   # AI endpoints (SSE streaming)
    ├── models/
    │   ├── User.js                 # username, email, password
    │   └── Room.js                 # roomId, code, language, participants, password
    ├── .env
    └── package.json
```

---

## 🔌 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/register` | Đăng ký tài khoản |
| POST | `/login` | Đăng nhập → JWT token |
| POST | `/logout` | Đăng xuất |
| GET | `/me` | Thông tin user hiện tại |

### Rooms (`/api/rooms`)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/` | Tạo phòng mới (+ password tùy chọn) |
| GET | `/` | Phòng user đã tham gia |
| GET | `/all?search=` | Tất cả phòng (search, filter) |
| GET | `/:roomId` | Chi tiết phòng |
| GET | `/:roomId/history` | Lịch sử code snapshots |
| POST | `/:roomId/verify-password` | Kiểm tra password phòng |

### Code Execution (`/api/code`)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/execute` | Chạy code qua Wandbox API |

### AI (`/api/ai`)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/explain` | Giải thích code (SSE streaming) |
| POST | `/fix` | Tìm và sửa lỗi (SSE streaming) |
| POST | `/optimize` | Tối ưu hóa code (SSE streaming) |
| POST | `/chat` | Chat tự do với AI (SSE streaming) |

---

## 🔄 Socket.IO Events

### Client → Server
| Event | Payload | Mô tả |
|---|---|---|
| `join-room` | `roomId` | Tham gia phòng |
| `code-change` | `{ roomId, code }` | Gửi code mới (debounce 300ms) |
| `language-change` | `{ roomId, language }` | Đổi ngôn ngữ |
| `output-sync` | `{ roomId, output, isRunning }` | Sync output |
| `send-message` | `{ roomId, text }` | Gửi tin nhắn chat |
| `save-snapshot` | `{ roomId, code, language }` | Lưu snapshot |
| `cursor-move` | `{ roomId, cursorData }` | Gửi vị trí con trỏ |

### Server → Client
| Event | Payload | Mô tả |
|---|---|---|
| `room-state` | `{ code, language, owner, participants }` | State phòng khi join |
| `code-sync` | `{ code }` | Code mới từ user khác |
| `language-sync` | `{ language }` | Ngôn ngữ mới |
| `output-update` | `{ output, isRunning }` | Output từ user khác |
| `users-update` | `[{ username, socketId }]` | Danh sách user online |
| `user-joined` / `user-left` | `{ username }` | Thông báo join/leave |
| `receive-message` | `{ username, text, timestamp }` | Tin nhắn chat |
| `snapshot-saved` | `{ code, language, savedBy }` | Snapshot mới |
| `cursor-update` | `{ socketId, username, position }` | Con trỏ user khác |

---

## 🌐 Ngôn ngữ hỗ trợ

| Ngôn ngữ | Compiler (Wandbox) | Monaco Language |
|---|---|---|
| C++ | gcc 13.2.0 | `cpp` |
| Python | CPython 3.12.7 | `python` |
| Java | OpenJDK 22 | `java` |
| JavaScript | Node.js 20.17.0 | `javascript` |
| TypeScript | TypeScript 5.6.2 | `typescript` |
| C# | .NET Core 8.0.402 | `csharp` |
| PHP | PHP 8.3.12 | `php` |

---

## 🔐 Biến môi trường

Tạo file `severApp/.env`:

```env
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/coderoom

# JWT secret key (bất kỳ chuỗi nào)
JWT_SECRET=my_super_secret_jwt_key_2024

# Google Gemini API Key (lấy tại https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIzaSy...

# Port server (mặc định 3001)
PORT=3001
```

> ⚠️ **Lưu ý**: File `.env` không được commit lên Git. Đảm bảo đã thêm vào `.gitignore`.

---

## 📝 Ghi chú phát triển

- **Frontend** chạy trên cổng `5173` (Vite), **Backend** trên cổng `3001`
- **CORS** đã được cấu hình cho localhost dev environment
- **Socket.IO** sử dụng JWT token từ `socket.handshake.auth.token` để xác thực
- **Code sync** sử dụng debounce 300ms để tránh quá tải server
- **Remote cursor** tự động ẩn sau 5 giây không hoạt động
- **Snapshots** giới hạn tối đa 20 bản/phòng
- **Room password** được hash bằng bcrypt (salt rounds = 10)
- **AI streaming** sử dụng Server-Sent Events (SSE) qua `text/event-stream`

---

<div align="center">

**Made with ❤️ by CodeRoom Team**

</div>
