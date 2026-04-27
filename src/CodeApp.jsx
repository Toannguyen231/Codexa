import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './App.css';

import Header from './component/Header/Header';
import Sidebar from './component/Sidebar/Sidebar';
import CodeEditor from './component/Editor/CodeEditor';
import OutputPanel from './component/OutputPanel/OutputPanel';
import HistoryPanel from './component/History/HistoryPanel';
import AIPanel from './component/AIPanel/AIPanel';
import { executeCode } from './component/Header/api';
import useSocket from './hooks/useSocket';

// Code mẫu mặc định cho từng ngôn ngữ
const DEFAULT_CODE = {
    'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    'Python': `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()`,
    'Java': `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    'JavaScript': `function main() {\n    console.log("Hello, World!");\n}\n\nmain();`,
    'TypeScript': `function main(): void {\n    console.log("Hello, World!");\n}\n\nmain();`,
    'C#': `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
    'PHP': `<?php\n\necho "Hello, World!\\n";\n\n?>`,
};

function CodeApp() {
    // Lấy roomId từ URL params: /room/:id
    const { id: roomId } = useParams();

    // Lấy JWT token từ localStorage 1 lần duy nhất khi mount
    // Dùng useState lazy init để tránh re-read trên mỗi render
    // (nếu dùng biến thường, tab khác login sẽ ghi đè localStorage → token đổi → socket reconnect sai user)
    const [token] = useState(() => localStorage.getItem('token') || '');

    // Lấy thông tin user hiện tại từ localStorage (1 lần khi mount)
    const [currentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch { return {}; }
    });

    const [language, setLanguage] = useState('C++');
    const [code, setCode] = useState(DEFAULT_CODE['C++']);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [aiOpen, setAIOpen] = useState(false);
    const [stdin, setStdin] = useState('');
    
    // Editor settings state
    const [editorSettings, setEditorSettings] = useState({
        theme: 'vs-dark',
        fontSize: 14,
        minimap: false,
        wordWrap: 'on'
    });

    // ── Socket.IO kết nối realtime ──────────────────────────────────
    const { socket, onlineUsers, isConnected } = useSocket(roomId, token);

    // Ref để tránh vòng lặp: khi nhận code từ socket → không emit lại
    const isRemoteChange = useRef(false);

    // ── Lắng nghe code-sync từ server (user khác gõ) ───────────────
    useEffect(() => {
        if (!socket) return;

        // Nhận code hiện tại khi vừa join room
        socket.on('room-state', ({ code: roomCode, language: roomLang }) => {
            isRemoteChange.current = true;
            if (roomCode) setCode(roomCode);
            if (roomLang) setLanguage(roomLang);
            // Nếu phòng chưa có code → dùng default cho ngôn ngữ đó
            if (!roomCode && roomLang) {
                setCode(DEFAULT_CODE[roomLang] || '');
            }
        });

        // Nhận code từ user khác đang gõ
        socket.on('code-sync', ({ code: newCode }) => {
            isRemoteChange.current = true;
            setCode(newCode);
        });

        // Nhận thay đổi ngôn ngữ từ user khác
        socket.on('language-sync', ({ language: newLang }) => {
            setLanguage(newLang);
            setCode(DEFAULT_CODE[newLang] || '');
        });

        // Nhận output từ user khác chạy code
        socket.on('output-update', ({ output: newOutput, isRunning: running }) => {
            if (running) {
                setIsRunning(true);
                setOutput('');
            } else {
                setIsRunning(false);
                setOutput(newOutput);
            }
        });

        return () => {
            socket.off('room-state');
            socket.off('code-sync');
            socket.off('language-sync');
            socket.off('output-update');
        };
    }, [socket]);

    // ── Debounce: emit code-change chỉ sau 300ms không gõ ───────────
    const debounceRef = useRef(null);

    const emitCodeChange = useCallback((newCode) => {
        if (isRemoteChange.current) {
            // Code đến từ socket → không emit lại (tránh loop)
            isRemoteChange.current = false;
            return;
        }
        if (!socket || !isConnected) return;

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            socket.emit('code-change', { roomId, code: newCode });
        }, 300);
    }, [socket, isConnected, roomId]);

    // Wrapper cho setCode: vừa cập nhật state vừa emit socket
    const handleCodeChange = useCallback((newCode) => {
        setCode(newCode);
        emitCodeChange(newCode);
    }, [emitCodeChange]);

    // ── Khi đổi ngôn ngữ → reset code + emit socket ───────────────
    const handleLanguageChange = useCallback((lang) => {
        setLanguage(lang);
        const newCode = DEFAULT_CODE[lang] || '';
        setCode(newCode);
        setOutput('');
        if (socket && isConnected) {
            socket.emit('language-change', { roomId, language: lang });
        }
    }, [socket, isConnected, roomId]);

    // ── Chạy code qua Judge0 + emit output cho user khác ───────────
    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('');

        // Thông báo cho user khác biết đang chạy
        if (socket && isConnected) {
            socket.emit('output-sync', { roomId, output: '', isRunning: true });
        }

        try {
            const result = await executeCode(language, code, stdin);

            let runOutput = '';
            if (result.message && !result.status) {
                runOutput = `Lỗi API: ${result.message}`;
            } else if (result.compile_output) {
                runOutput = result.compile_output;
            } else if (result.stderr) {
                runOutput = result.stderr;
            } else if (result.stdout !== null && result.stdout !== undefined) {
                runOutput = result.stdout || "Done.";
            } else if (result.status && result.status.description) {
                runOutput = `Trạng thái: ${result.status.description}`;
            } else {
                runOutput = JSON.stringify(result, null, 2);
            }

            setOutput(runOutput);
            setIsRunning(false);

            // Gửi output cho user khác trong phòng
            if (socket && isConnected) {
                socket.emit('output-sync', { roomId, output: runOutput, isRunning: false });
            }
        } catch (error) {
            const errMsg = `Error: ${error.message}`;
            setOutput(errMsg);
            setIsRunning(false);
            if (socket && isConnected) {
                socket.emit('output-sync', { roomId, output: errMsg, isRunning: false });
            }
        }
    };

    // ── Khôi phục code từ snapshot lịch sử ───────────────────────
    const handleRestore = useCallback((restoredCode, restoredLang) => {
        isRemoteChange.current = true;
        setCode(restoredCode);
        setLanguage(restoredLang);
        if (socket && isConnected) {
            socket.emit('code-change', { roomId, code: restoredCode });
            socket.emit('language-change', { roomId, language: restoredLang });
        }
    }, [socket, isConnected, roomId]);

    return (
        <div className="app-shell">
            {/* ── History Panel (modal) ── */}
            {showHistory && (
                <HistoryPanel
                    roomId={roomId}
                    token={token}
                    onRestore={handleRestore}
                    onClose={() => setShowHistory(false)}
                    socket={socket}
                    isConnected={isConnected}
                    currentCode={code}
                    currentLanguage={language}
                    currentUser={currentUser}
                />
            )}

            {/* ── Header ── */}
            <Header
                roomId={roomId}
                language={language}
                setLanguage={handleLanguageChange}
                onRun={handleRunCode}
                isRunning={isRunning}
                isConnected={isConnected}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                onOpenHistory={() => setShowHistory(true)}
                editorSettings={editorSettings}
                setEditorSettings={setEditorSettings}
                aiOpen={aiOpen}
                setAIOpen={setAIOpen}
            />

            {/* ── Main: Sidebar + Editor ── */}
            <div className="app-main">
                <Sidebar
                    onlineUsers={onlineUsers}
                    currentUser={currentUser}
                    roomId={roomId}
                    socket={socket}
                    isConnected={isConnected}
                />

                <div className="editor-area">
                    <CodeEditor
                        code={code}
                        setCode={handleCodeChange}
                        language={language}
                        socket={socket}
                        roomId={roomId}
                        currentUser={currentUser}
                        settings={editorSettings}
                    />

                    {/* ── Output Panel ── */}
                    <OutputPanel
                        output={output}
                        isRunning={isRunning}
                        onClear={() => setOutput('')}
                        stdin={stdin}
                        setStdin={setStdin}
                    />
                </div>
            </div>

            {/* ── AI Panel ── */}
            {aiOpen && (
                <AIPanel
                    code={code}
                    language={language}
                    onClose={() => setAIOpen(false)}
                />
            )}
        </div>
    );
}

export default CodeApp;