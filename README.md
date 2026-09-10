<div align="center">

# ⚡ CodeRoom - Real-Time Collaborative Coding & Battle Arena

### Nền tảng lập trình cộng tác thời gian thực, đấu trường thi đấu thuật toán 1v1 và trợ lý AI thông minh

[![React 19](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Code_Engine-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![Socket.IO Client](https://img.shields.io/badge/Socket.io-4.8.3-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3.8-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br />

[🌐 Trải Nghiệm Demo Trực Tuyến](https://coderoom.vercel.app/) • [✨ Tính Năng](#-tính-năng-nổi-bật) • [🏗️ Kiến Trúc](#-kiến-trúc-frontend) • [🚀 Cài Đặt](#-cài-đặt--phát-triển)

---

</div>

## 📌 Giới Thiệu

**CodeRoom Frontend** là ứng dụng Single Page Application (SPA) hiện đại được xây dựng trên nền tảng **React 19** và **Vite 8**, mang lại trải nghiệm lập trình mượt mà, tức thì và đầy cảm hứng:

- 💻 **Trình soạn thảo Monaco Editor** tương tự VS Code với đầy đủ tính năng IntelliSense, auto-complete và tuỳ biến giao diện.
- 🔄 **Đồng bộ thời gian thực siêu tốc (<50ms)**: Hợp tác viết code cùng đồng đội mượt mà, theo dõi con trỏ và danh sách thành viên online.
- ⚔️ **Đấu trường 1v1 (Battle Code)**: Tìm trận ngẫu nhiên (Matchmaking) theo trình độ hoặc gửi lời thách đấu trực tiếp, thi đấu thuật toán căng thẳng trong 30 phút.
- 🤖 **Trợ lý AI đa năng**: Tích hợp Google Gemini 2.0 Flash & DeepSeek stream phản hồi trực tiếp (SSE), giải thích thuật toán, tìm lỗi biên dịch và tối ưu code.
- 🏆 **Gamification & Thống kê**: 7 bậc xếp hạng (Sắt $\rightarrow$ Thách Đấu), chuỗi giải bài mỗi ngày (Daily Streak) và biểu đồ đóng góp (Activity Heatmap).

---

## ✨ Tính Năng Nổi Bật

### 1. 👥 Không Gian Lập Trình Cộng Tác (Collaborative Room)
- **Monaco Editor Engine**: Trình biên tập code mạnh mẽ nhất trên web, hỗ trợ 7 ngôn ngữ lập trình (C++, Python, Java, JavaScript, TypeScript, C#, PHP).
- **Đồng bộ thông minh (Conflict-free Sync)**: Cơ chế debounce 300ms kết hợp flag `isRemoteChange` ngăn chặn hiện tượng lặp vô hạn và giảm tải băng thông.
- **Presence Bar & Cursor Tracking**: Hiển thị vị trí con trỏ chuột và màu sắc đại diện cho từng người dùng trong phòng.
- **Phiên bản mã nguồn (Version Snapshot)**: Tự động lưu tối đa 20 bản snapshot của code, dễ dàng khôi phục phiên bản trước đó.
- **Live Chat & Snippet Sharing**: Khung chat trực tiếp trong phòng giúp trao đổi thảo luận liền mạch mà không cần dùng ứng dụng thứ ba.

### 2. ⚔️ Đấu Trường Đối Kháng 1v1 (Battle Arena)
- **Hàng đợi tìm trận (Quick Match Queue)**: Ghép đối thủ tự động qua Socket.IO namespace `/battle` theo điểm ELO và bậc rank.
- **Thách đấu trực tiếp (Direct Invite)**: Gửi lời mời thách đấu tới đối thủ qua username.
- **Phòng thi đấu trực tiếp (Battle Room)**:
  - Đồng hồ đếm ngược 30 phút.
  - Hiển thị song song đề bài, trình soạn thảo Monaco và bảng trạng thái đối thủ.
  - Chấm điểm bài giải trực tiếp theo test case mẫu và test case ẩn.
- **Lịch sử giác đấu**: Theo dõi kết quả các trận thắng/thua, phân tích phong độ và biến động điểm xếp hạng.

### 3. 🤖 Trợ Lý AI Hỗ Trợ Lập Trình
- **Server-Sent Events (SSE) Streaming**: Phản hồi tức thì dạng gõ chữ thời gian thực từ Gemini 2.0 Flash / DeepSeek.
- **4 Chế độ thông minh**:
  - 📖 **Giải thích code (Explain)**: Phân tích cú pháp, luồng thuật toán và độ phức tạp tính toán $O(N)$.
  - 🐛 **Sửa lỗi (Fix Bug)**: Nhận diện lỗi cú pháp, runtime error kèm giải thích và mã nguồn đã sửa.
  - ⚙️ **Tối ưu hóa (Optimize)**: Đề xuất cách viết ngắn gọn, tiết kiệm bộ nhớ và nâng cao hiệu năng.
  - 💬 **Hỏi đáp tự do (Chat)**: Trả lời mọi câu hỏi kỹ thuật về bài toán hoặc dự án.

### 4. 📋 Giải Đề Codeforces & Chấm Điểm
- **Đề bài Codeforces trực quan**: Tự động hiển thị nội dung đề bài, render công thức toán học sắc nét bằng MathJax.
- **Hệ thống Test Case Ẩn do AI sinh**: Chấm điểm toàn diện qua cả test case mẫu và các bộ test case ẩn (Easy: 3, Medium: 5, Hard: 8 test) do AI tự động tạo.
- **Báo cáo kết quả trực quan**: Hiển thị trạng thái chi tiết (Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error).

### 5. 🏆 Hồ Sơ Cá Nhân & Bảng Xếp Hạng
- **Hệ thống Rank 7 bậc**: Sắt, Đồng, Bạc, Vàng, Bạch Kim, Kim Cương, Cao Thủ.
- **Chuỗi Thử Thách Hàng Ngày (Daily Streak)**: Khám phá bài tập mới mỗi ngày, tích lũy chuỗi giải bài liên tục để nhận huy hiệu độc quyền.
- **Activity Heatmap**: Biểu đồ nhiệt hiển thị lịch sử giải bài tương tự GitHub contribution graph.
- **Bảng xếp hạng toàn cầu**: Xem thứ hạng top cao thủ và so sánh trình độ với các đối thủ liền kề.

### 6. 👨‍💼 Quản Trị Hệ Thống (Admin Dashboard)
- Thống kê thời gian thực về lượng người dùng, phòng code và lượt giải bài.
- Công cụ cào đề bài hàng loạt từ Codeforces.
- Quản lý danh sách tài khoản và phân quyền người dùng.

---

## 🏗️ Kiến Trúc Frontend

```
app_code_realTime/
├── src/
│   ├── component/
│   │   ├── Admin/               # Quản trị hệ thống (AdminDashboard.jsx)
│   │   ├── Battle/              # Đấu trường 1v1 (BattleHub, BattleQueue, BattleRoom)
│   │   ├── Editor/              # Monaco Editor & Code Execution Panel
│   │   ├── AIPanel/             # Giao diện trợ lý AI (SSE streaming chat)
│   │   ├── Problems/            # Danh sách bài tập & ProblemPage (MathJax + Judge)
│   │   ├── Profile/             # Profile cá nhân, PublicProfile & Activity Heatmap
│   │   ├── RoomMenu/            # Danh sách và quản lý phòng code
│   │   ├── Login/               # Đăng nhập & Đăng ký
│   │   └── AuthPages.jsx        # Quên mật khẩu & Xác thực email
│   ├── hooks/                   # Custom Hooks: useSocket, useAuth
│   ├── landing/                 # Landing Page giới thiệu hiện đại
│   ├── monaco/                  # Cấu hình chủ đề (theme) & phím tắt Monaco
│   ├── services/ & utils/       # Gọi REST API (Axios / Fetch) & Socket helper
│   ├── App.jsx                  # Thiết lập định tuyến React Router v7
│   └── CodeApp.jsx              # Workspace phòng code cộng tác trung tâm
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 Cài Đặt & Phát Triển

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản `20.x` trở lên
- **npm**: Phiên bản `10.x` trở lên

### 2. Cài đặt các gói phụ thuộc
```bash
cd app_code_realTime
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env.local` tại thư mục gốc của frontend:

```env
# URL trỏ tới Backend API
VITE_API_BASE_URL=http://localhost:5000/api

# URL kết nối WebSocket Socket.IO
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Khởi chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Trình duyệt sẽ mở tại địa chỉ `http://localhost:5173`.

### 5. Đóng gói cho môi trường Production (Build)
```bash
npm run build
npm run preview
```

---

## 🌐 Triển Khai Lên Vercel

1. Đẩy mã nguồn lên kho lưu trữ GitHub.
2. Đăng nhập vào [Vercel](https://vercel.com/) và import project.
3. Cấu hình biến môi trường:
   - `VITE_API_BASE_URL`: `https://your-backend-domain.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend-domain.com`
4. Chọn Framework Preset là **Vite**.
5. Nhấn **Deploy**.

---

## 📄 Bản Quyền (License)

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
Tác giả: [Nguyễn Ngọc Toàn (Toannguyen231)](https://github.com/Toannguyen231)
