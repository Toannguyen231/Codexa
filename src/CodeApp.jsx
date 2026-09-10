import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import './App.css';
import './component/Problems/Problems.scss';

import Header from './component/Header/Header';
import Sidebar from './component/Sidebar/Sidebar';
import CodeEditor from './component/Editor/CodeEditor';
import OutputPanel from './component/OutputPanel/OutputPanel';
import HistoryPanel from './component/History/HistoryPanel';
import AIPanel from './component/AIPanel/AIPanel';
import ShareModal from './component/ShareModal';
import { useRoomManager } from './hooks/useRoomManager';
import { extractSamples } from './component/Problems/problemUtils';
import API, { fetchRaw, parseResponseBody } from './api';

/**
 * Component: CodeApp
 * Giao diện chính của phòng lập trình cộng tác thời gian thực.
 * Tách biệt hoàn toàn phần xử lý logic nghiệp vụ ra hook `useRoomManager`.
 */
function CodeApp() {
    // Lấy roomId từ URL params: /room/:id
    const { id: roomId } = useParams();
    const [searchParams] = useSearchParams();
    const problemId = searchParams.get('problem') || (roomId?.startsWith('CF-') ? roomId.substring(3) : '');

    // Lấy JWT token từ localStorage — sync với storage events để luôn reactive
    // khi user login/logout ở tab khác
    const [token, setToken] = useState(() => localStorage.getItem('accessToken') || localStorage.getItem('token') || '');
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'token' || e.key === 'accessToken') setToken(e.newValue || '');
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const [problem, setProblem] = useState(null);
    const [problemLoading, setProblemLoading] = useState(false);
    const [samples, setSamples] = useState([]);
    const [testResults, setTestResults] = useState(null);
    const [runningTests, setRunningTests] = useState(false);

    const parseProblemId = (id) => {
        if (!id) return null;
        const parts = id.split('-');
        if (parts.length < 2) return null;
        return { contestId: parts[0], index: parts[1] };
    };

    useEffect(() => {
        if (!problemId) {
            setProblem(null);
            return;
        }

        const parsed = parseProblemId(problemId);
        if (!parsed) return;

        let cancelled = false;
        setProblemLoading(true);

        const fetchProblem = async () => {
            try {
                const { data } = await API.get(`problems/${parsed.contestId}/${parsed.index}`);
                if (cancelled) return;
                setProblem(data.problem);
                
                if (data.problem?.statementHtml) {
                    const extracted = extractSamples(data.problem.statementHtml);
                    const hidden = data.problem.hiddenTestcases || [];
                    const maskedHidden = hidden.map((tc) => ({
                        input: tc.isHidden ? '*** HIDDEN ***' : tc.input,
                        output: tc.isHidden ? '*** HIDDEN ***' : tc.output,
                        isHidden: tc.isHidden,
                        realInput: tc.input,
                        realOutput: tc.output,
                    }));
                    setSamples([...extracted, ...maskedHidden]);
                }
            } catch (err) {
                console.error("Failed to load problem statement in room:", err);
            } finally {
                setProblemLoading(false);
            }
        };

        fetchProblem();
        return () => {
            cancelled = true;
        };
    }, [problemId]);

    // Typeset MathJax when problem statement loads
    // MathJax config & script đã load trong index.html — chỉ cần typeset lại
    useEffect(() => {
        if (!problem?.statementHtml) return;

        const timer = setTimeout(() => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise().catch((err) => console.error(err));
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [problem?.statementHtml]);

    // Đóng gói logic nghiệp vụ trong custom hook
    const {
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
    } = useRoomManager(roomId, token, problemId);

    // Trạng thái hiển thị Modals/Panels
    const [showHistory, setShowHistory] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [aiOpen, setAIOpen] = useState(false);
    
    // Cài đặt trình soạn thảo (Editor settings)
    const [editorSettings, setEditorSettings] = useState({
        theme: 'vs-dark',
        fontSize: 14,
        minimap: false,
        wordWrap: 'on'
    });

    // Ref để có thể cancel quá trình chạy tests
    const cancelTestsRef = useRef(false);

    const handleRunAllTests = async () => {
        if (runningTests || isRunning || !code.trim() || samples.length === 0) return;
        setRunningTests(true);
        cancelTestsRef.current = false;

        const initialResults = samples.map(s => ({
            ...s,
            actualOutput: null,
            status: 'Pending',
        }));
        setTestResults(initialResults);

        // Biến kiểm tra component còn mounted không
        let cancelled = false;

        try {
            for (let i = 0; i < samples.length; i++) {
                // Check cancel trước mỗi test
                if (cancelTestsRef.current) {
                    setRunningTests(false);
                    return;
                }

                setTestResults(prev => {
                    if (cancelled) return prev;
                    const newArr = [...prev];
                    newArr[i].status = 'Running';
                    return newArr;
                });

                let res;
                try {
                    res = await fetchRaw('code/execute', {
                        method: 'POST',
                        body: {
                            language,
                            code,
                            stdin: samples[i].isHidden ? samples[i].realInput : samples[i].input,
                        },
                    });
                } catch (fetchErr) {
                    if (cancelTestsRef.current || fetchErr.name === 'AbortError') {
                        cancelled = true;
                        break;
                    }
                    setTestResults(prev => {
                        const newArr = [...prev];
                        newArr[i].status = 'Error';
                        newArr[i].actualOutput = `Network error: ${fetchErr.message}`;
                        return newArr;
                    });
                    continue;
                }

                let result;
                try {
                    result = await parseResponseBody(res);
                } catch {
                    setTestResults(prev => {
                        const newArr = [...prev];
                        newArr[i].status = 'Error';
                        newArr[i].actualOutput = 'Failed to parse server response.';
                        return newArr;
                    });
                    continue;
                }

                let status = 'Error';
                let actualOutput = '';

                if (!res.ok) {
                    actualOutput = result.message || 'Lỗi server.';
                } else if (result.compile_output) {
                    actualOutput = result.compile_output;
                    status = 'Compile Error';
                } else {
                    const rawStdout = result.stdout || '';
                    const rawStderr = result.stderr ? `\n--- stderr ---\n${result.stderr}` : '';
                    actualOutput = rawStdout + rawStderr;

                    const expectedRaw = samples[i].isHidden ? samples[i].realOutput : samples[i].output;
                    const expected = (expectedRaw || '').trim();
                    const actual = rawStdout.trim();

                    status = (actual === expected) ? 'Passed' : 'Failed';
                    if (result.status?.id !== 3 && status !== 'Passed') {
                        status = 'Runtime Error';
                    }
                }

                setTestResults(prev => {
                    const newArr = [...prev];
                    newArr[i].status = status;
                    newArr[i].actualOutput = actualOutput;
                    return newArr;
                });
            }
        } catch (err) {
            if (!cancelled) console.error(err);
        } finally {
            if (!cancelled) setRunningTests(false);
        }
    };

    // Cancel tests khi component unmount
    useEffect(() => {
        return () => {
            cancelTestsRef.current = true;
        };
    }, []);

    // ── Resizer Logic ──────────────────────────────────────────────────
    const [leftWidth, setLeftWidth] = useState(500); // 500px default

    const handleMouseDown = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftWidth;

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            let newWidth = startWidth + deltaX;
            if (newWidth < 200) newWidth = 200;
            if (newWidth > window.innerWidth - 300) newWidth = window.innerWidth - 300;
            setLeftWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div className="app-shell">
            {/* ── Lịch sử Code (Modal) ── */}
            {/* ── Share & Embed Modal ── */}
            {showShare && (
                <ShareModal
                    code={code}
                    language={language}
                    roomId={roomId}
                    title={`Code ${language}`}
                    onClose={() => setShowShare(false)}
                />
            )}

            {/* ── Lịch sử Code (Modal) ── */}
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

            {/* ── Giao diện Header (Thanh công cụ) ── */}
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
                onShare={() => setShowShare(true)}
            />

            {/* ── Nội dung chính: Sidebar + Editor + Output ── */}
            <div className="app-main">
                <Sidebar
                    onlineUsers={onlineUsers}
                    currentUser={currentUser}
                    roomId={roomId}
                    socket={socket}
                    isConnected={isConnected}
                    roomOwner={roomOwner}
                    roomParticipants={roomParticipants}
                />

                {problemId && (
                    <>
                        <section className="room-problem-statement-panel" style={{ width: leftWidth, flexShrink: 0 }}>
                            {problemLoading ? (
                            <div className="room-problem-loading">
                                <div className="problem-loading-spinner small" />
                                <span>Đang tải đề bài...</span>
                            </div>
                        ) : problem?.statementHtml ? (
                            <div
                                className="problem-scraped-content"
                                dangerouslySetInnerHTML={{ __html: problem.statementHtml }}
                            />
                        ) : (
                            <div className="room-problem-error">
                                <span>Không thể tải đề bài.</span>
                            </div>
                        )}
                        </section>
                        {/* Resizer */}
                        <div className="panel-resizer" onMouseDown={handleMouseDown} />
                    </>
                )}

                <div className="editor-area">
                    <CodeEditor
                        code={code}
                        setCode={handleCodeChange}
                        language={language}
                        socket={socket}
                        roomId={roomId}
                        currentUser={currentUser}
                        settings={editorSettings}
                        connectionStatus={connectionStatus}
                    />

                    {/* ── Bảng hiển thị kết quả Console ── */}
                    <OutputPanel
                        output={output}
                        isRunning={isRunning}
                        onClear={() => {}} // Hook quản lý output, panel chỉ cần hiện
                        stdin={stdin}
                        setStdin={setStdin}
                        samples={samples}
                        testResults={testResults}
                        runningTests={runningTests}
                        onRunAllTests={handleRunAllTests}
                    />
                </div>
            </div>

            {/* ── Trợ lý ảo AI (Sidebar phụ) ── */}
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
