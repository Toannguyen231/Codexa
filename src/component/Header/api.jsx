/**
 * Gọi backend proxy để chạy code (tránh CORS khi gọi Judge0 trực tiếp).
 * Backend route: POST /api/code/execute
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const executeCode = async (displayLanguage, sourceCode, stdin = "") => {
    const token = localStorage.getItem('token') || '';

    const res = await fetch(`${API_URL}/code/execute`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            language: displayLanguage,
            code: sourceCode,
            stdin,
        }),
    });

    const result = await res.json();

    if (!res.ok) {
        // Server trả lỗi (Judge0 error, rate limit, v.v.)
        return {
            message: result.message || `Lỗi server: ${res.status}`,
            status: result.status || null,
        };
    }
    return result;
};