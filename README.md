<div align="center">

# 🚀 CodeRoom

### The Ultimate Real-Time Collaborative Coding Environment

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-code--real--time--77wt.vercel.app-6366f1?style=for-the-badge)](https://code-real-time-77wt.vercel.app/)
[![Status](https://img.shields.io/badge/status-Live-brightgreen?style=for-the-badge)]()
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)]()

**Say goodbye to screen-sharing and turn-based coding. CodeRoom is your next-generation workspace for seamless, simultaneous, and secure pair programming — right in your browser.**

### 🌐 [➜ Try it now: code-real-time-77wt.vercel.app](https://code-real-time-77wt.vercel.app/)

</div>

---

## 🔥 What is CodeRoom?

CodeRoom is a **full-stack real-time collaborative code editor** that lets multiple developers write, run, and debug code together — simultaneously, from anywhere in the world. No plugins, no downloads, just open the link and start coding.

- **⚡ Real-time sync** — Every keystroke is instantly shared with all participants in the room.
- **💻 Multi-language execution** — Write and run code in 7 programming languages without leaving the browser.
- **🤖 AI-powered assistant** — Integrated Google Gemini AI to explain, fix, and optimize your code on demand.
- **🔒 Private rooms** — Protect your sessions with optional password-protected rooms.

---

## ✨ Core Features

### 👥 Real-Time Collaboration
Join the same room with your teammates and watch code changes appear instantly on everyone's screen. Remote cursors show you exactly where each collaborator is working — like Google Docs but for code.

### 💻 Multi-Language Code Execution
Write and run code directly in the browser across 7 languages:

| Language | Runtime |
|---|---|
| C++ | GCC 13.2.0 |
| Python | CPython 3.12 |
| Java | OpenJDK 22 |
| JavaScript | Node.js 20 |
| TypeScript | TSC 5.6 |
| C# | .NET Core 8 |
| PHP | PHP 8.3 |

### 🤖 AI Code Assistant (Google Gemini)
Select any code and get instant AI-powered help:
- **Explain** — Understand what the code does, step by step.
- **Fix Bugs** — Identify and correct errors with clear explanations.
- **Optimize** — Get suggestions to improve performance and readability.
- **Chat** — Have a free-form conversation with full awareness of your codebase.

### 🛡️ Room Management
- Create rooms with auto-generated IDs.
- Set an optional password to keep sessions private.
- See who's online and who has previously joined (offline members).
- Browse and search all public rooms.

### 📜 Code History
Save up to 20 snapshots per room. Restore any previous version of the code with a single click — a lightweight version control system built right in.

### ⌨️ Monaco Editor
The same editor engine that powers **Visual Studio Code**, with full syntax highlighting, IntelliSense, minimap, and configurable themes (Dark, Light, High Contrast).

### 💬 Room Chat
Communicate with teammates without switching apps — an integrated real-time chat panel is built directly into the editor sidebar.

---

## 🖥️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Monaco Editor, Socket.IO Client, React Router 7, SCSS |
| **Backend** | Node.js, Express 5, Socket.IO 4, MongoDB, Mongoose, JWT, bcrypt |
| **AI** | Google Gemini 2.5 Flash (streaming via SSE) |
| **Code Execution** | Wandbox API |
| **Deployment** | Vercel (Frontend) · Render (Backend) · MongoDB Atlas (Database) |

---

## 🔐 Security

- All API endpoints are protected with **JWT authentication**.
- Socket connections are verified via **JWT handshake** before joining any room.
- User and room passwords are **bcrypt-hashed** — never stored as plain text.
- Room messages are capped at **500 characters** per message; code submissions at **1MB**.

---

<div align="center">

## 🚀 Ready to collaborate?

### [➜ Open CodeRoom: code-real-time-77wt.vercel.app](https://code-real-time-77wt.vercel.app/)

*Create a room. Share the link. Code together.*

---

**Built with ❤️ by CodeRoom Team**

</div>
