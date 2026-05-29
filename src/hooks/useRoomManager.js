import { useState, useEffect, useRef, useCallback } from 'react';
import useSocket from './useSocket';
import { executeCode } from '../component/Header/api';

// Code mẫu mặc định cho từng ngôn ngữ
export const DEFAULT_CODE = {
    'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    'Python': `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()`,
    'Java': `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    'JavaScript': `function main() {\n    console.log("Hello, World!");\n}\n\nmain();`,
    'TypeScript': `function main(): void {\n    console.log("Hello, World!");\n}\n\nmain();`,
    'C#': `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
    'PHP': `<?php\n\necho "Hello, World!\\n";\n\n?>`,
};

/**
 * Custom Hook: useRoomManager
 * Đóng gói toàn bộ logic quản lý trạng thái, đồng bộ Socket, và biên dịch code cho phòng code.
 * 
 * @param {string} roomId - ID phòng code
 * @param {string} token - JWT Token xác thực người dùng
 */
export const useRoomManager = (roomId, token) => {
    // Thông tin người dùng hiện tại
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch { return {}; }
    });

    useEffect(() => {
        const syncUser = () => {
            try { setCurrentUser(JSON.parse(localStorage.getItem('user')) || {}); }
            catch { setCurrentUser({}); }
        };
        window.addEventListener('focus', syncUser);
        return () => window.removeEventListener('focus', syncUser);
    }, []);

    const [language, setLanguage] = useState('C++');
    const [code, setCode] = useState(DEFAULT_CODE['C++']);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [stdin, setStdin] = useState('');
    const [roomOwner, setRoomOwner] = useState('');
    const [roomParticipants, setRoomParticipants] = useState([]);

    // Kết nối Socket.io
    const { socket, onlineUsers, isConnected, connectionStatus } = useSocket(roomId, token);

    // Cờ ngăn vòng lặp phản hồi code (remote change vs local change)
    const isRemoteChange = useRef(false);
    const debounceRef = useRef(null);

    // ── Lắng nghe các sự kiện đồng bộ từ Socket Server ────────────────
    useEffect(() => {
        if (!socket) return;

        // Trạng thái ban đầu của phòng khi join thành công
        socket.on('room-state', ({ code: roomCode, language: roomLang, owner, participants }) => {
            isRemoteChange.current = true;
            if (roomCode) setCode(roomCode);
            if (roomLang) setLanguage(roomLang);
            if (!roomCode && roomLang) {
                setCode(DEFAULT_CODE[roomLang] || '');
            }
            if (owner) setRoomOwner(owner);
            if (participants) setRoomParticipants(participants);
        });

        // Đồng bộ code gõ từ người khác
        socket.on('code-sync', ({ code: newCode }) => {
            isRemoteChange.current = true;
            setCode(newCode);
        });

        // Đồng bộ ngôn ngữ thay đổi từ người khác
        socket.on('language-sync', ({ language: newLang }) => {
            setLanguage(newLang);
            setCode(DEFAULT_CODE[newLang] || '');
        });

        // Đồng bộ output kết quả chạy code từ người khác
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

    // Emit sự kiện gõ code có debounce 300ms
    const emitCodeChange = useCallback((newCode) => {
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
        }
        if (!socket || !isConnected) return;

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            socket.emit('code-change', { roomId, code: newCode });
        }, 300);
    }, [socket, isConnected, roomId]);

    // Xử lý thay đổi code từ editor
    const handleCodeChange = useCallback((newCode) => {
        setCode(newCode);
        emitCodeChange(newCode);
    }, [emitCodeChange]);

    // Xử lý đổi ngôn ngữ lập trình
    const handleLanguageChange = useCallback((lang) => {
        setLanguage(lang);
        const newCode = DEFAULT_CODE[lang] || '';
        setCode(newCode);
        setOutput('');
        if (socket && isConnected) {
            socket.emit('language-change', { roomId, language: lang });
        }
    }, [socket, isConnected, roomId]);

    // Xử lý chạy code thông qua Wandbox API (Judge0)
    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('');

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

    // Khôi phục code từ lịch sử (Snapshots)
    const handleRestore = useCallback((restoredCode, restoredLang) => {
        isRemoteChange.current = true;
        setCode(restoredCode);
        setLanguage(restoredLang);
        if (socket && isConnected) {
            socket.emit('code-change', { roomId, code: restoredCode });
            socket.emit('language-change', { roomId, language: restoredLang });
        }
    }, [socket, isConnected, roomId]);

    return {
        currentUser,
        language,
        code,
        output,
        isRunning,
        stdin,
        setStdin,
        roomOwner,
        roomParticipants,
        socket,
        onlineUsers,
        isConnected,
        connectionStatus,
        handleCodeChange,
        handleLanguageChange,
        handleRunCode,
        handleRestore,
    };
};
