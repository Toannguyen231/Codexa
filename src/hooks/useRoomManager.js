import { useState, useEffect, useRef, useCallback } from 'react';
import useSocket from './useSocket';
import { executeCode } from '../component/Header/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

const parseProblemId = (problemId) => {
    if (!problemId) return null;
    const [contestId, ...indexParts] = String(problemId).split('-');
    const index = indexParts.join('-');
    if (!contestId || !index) return null;
    return { contestId, index };
};

const getCommentPrefix = (language) => (language === 'Python' ? '#' : '//');

const createProblemBoilerplate = (problem, language) => {
    const base = DEFAULT_CODE[language] || '';
    const commentPrefix = getCommentPrefix(language);
    const header = [
        `${commentPrefix} Codeforces ${problem.contestId}${problem.index}: ${problem.name}`,
        `${commentPrefix} ${problem.url}`,
        `${commentPrefix} Difficulty: ${problem.difficulty}${problem.rating ? ` (${problem.rating})` : ''}`,
        problem.tags?.length ? `${commentPrefix} Tags: ${problem.tags.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    if (language === 'PHP' && base.startsWith('<?php')) {
        return base.replace('<?php\n\n', `<?php\n${header}\n\n`);
    }

    return `${header}\n\n${base}`;
};

/**
 * Custom Hook: useRoomManager
 * Đóng gói toàn bộ logic quản lý trạng thái, đồng bộ Socket, và biên dịch code cho phòng code.
 * 
 * @param {string} roomId - ID phòng code
 * @param {string} token - JWT Token xác thực người dùng
 */
export const useRoomManager = (roomId, token, problemId = '') => {
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
    const codeRef = useRef(code);
    const languageRef = useRef(language);
    const emptyRoomRef = useRef(false);
    const problemContextRef = useRef(null);
    const problemPrefillAppliedRef = useRef(false);

    useEffect(() => { codeRef.current = code; }, [code]);
    useEffect(() => { languageRef.current = language; }, [language]);

    const applyProblemTemplate = useCallback((problem, targetLanguage = languageRef.current) => {
        if (!problem || problemPrefillAppliedRef.current) return;

        const currentCode = codeRef.current;
        const defaultCode = DEFAULT_CODE[targetLanguage] || '';
        const isDefaultCode = Object.values(DEFAULT_CODE).includes(currentCode);
        if (currentCode && currentCode !== defaultCode && !isDefaultCode) return;

        const template = createProblemBoilerplate(problem, targetLanguage);
        problemPrefillAppliedRef.current = true;
        isRemoteChange.current = true;
        setCode(template);

        if (socket && isConnected) {
            socket.emit('code-change', { roomId, code: template });
        }
    }, [socket, isConnected, roomId]);

    useEffect(() => {
        const parsed = parseProblemId(problemId);
        problemContextRef.current = null;
        problemPrefillAppliedRef.current = false;
        if (!parsed) return undefined;

        let cancelled = false;

        const loadProblem = async () => {
            try {
                const res = await fetch(`${API_URL}/problems/${parsed.contestId}/${parsed.index}`);
                const data = await res.json();
                if (cancelled || !res.ok || !data.problem) return;

                const problem = {
                    ...data.problem,
                    url: `https://codeforces.com/contest/${data.problem.contestId}/problem/${data.problem.index}`,
                };
                problemContextRef.current = problem;

                if (emptyRoomRef.current) {
                    applyProblemTemplate(problem);
                }
            } catch {
                problemContextRef.current = null;
            }
        };

        loadProblem();

        return () => {
            cancelled = true;
        };
    }, [problemId, applyProblemTemplate]);

    // ── Lắng nghe các sự kiện đồng bộ từ Socket Server ────────────────
    useEffect(() => {
        if (!socket) return;

        // Trạng thái ban đầu của phòng khi join thành công
        socket.on('room-state', ({ code: roomCode, language: roomLang, owner, participants }) => {
            const targetLanguage = roomLang || 'C++';
            emptyRoomRef.current = !roomCode;
            isRemoteChange.current = true;
            if (roomCode) setCode(roomCode);
            if (roomLang) setLanguage(roomLang);
            if (!roomCode && roomLang) {
                setCode(DEFAULT_CODE[roomLang] || '');
            }
            if (!roomCode && problemContextRef.current) {
                applyProblemTemplate(problemContextRef.current, targetLanguage);
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
    }, [socket, applyProblemTemplate]);

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
