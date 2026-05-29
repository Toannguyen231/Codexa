import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import './App.css';

import Header from './component/Header/Header';
import Sidebar from './component/Sidebar/Sidebar';
import CodeEditor from './component/Editor/CodeEditor';
import OutputPanel from './component/OutputPanel/OutputPanel';
import HistoryPanel from './component/History/HistoryPanel';
import AIPanel from './component/AIPanel/AIPanel';
import { useRoomManager } from './hooks/useRoomManager';

/**
 * Component: CodeApp
 * Giao diện chính của phòng lập trình cộng tác thời gian thực.
 * Tách biệt hoàn toàn phần xử lý logic nghiệp vụ ra hook `useRoomManager`.
 */
function CodeApp() {
    // Lấy roomId từ URL params: /room/:id
    const { id: roomId } = useParams();
    const [searchParams] = useSearchParams();
    const problemId = searchParams.get('problem') || '';

    // Lấy JWT token từ localStorage
    const [token] = useState(() => localStorage.getItem('token') || '');

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
    const [aiOpen, setAIOpen] = useState(false);
    
    // Cài đặt trình soạn thảo (Editor settings)
    const [editorSettings, setEditorSettings] = useState({
        theme: 'vs-dark',
        fontSize: 14,
        minimap: false,
        wordWrap: 'on'
    });

    return (
        <div className="app-shell">
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
