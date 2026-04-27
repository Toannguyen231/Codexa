import { LANGUAGE_KEY_BY_DISPLAY } from './constants';

const LANGUAGE_ID = {
    cpp: 54,
    python: 71,
    java: 62,
    javascript: 63,
    typescript: 74,
    csharp: 51,
    php: 68
};

// Hỗ trợ mã hóa Base64 cho chuỗi Unicode/UTF-8 an toàn
const encodeBase64 = (str) => {
    if (!str) return "";
    return btoa(unescape(encodeURIComponent(str)));
};

const decodeBase64 = (str) => {
    if (!str) return "";
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        return atob(str);
    }
};

export const executeCode = async (displayLanguage, sourceCode, stdin = "") => {
    const langKey = LANGUAGE_KEY_BY_DISPLAY[displayLanguage] || displayLanguage.toLowerCase();
    const language_id = LANGUAGE_ID[langKey];

    // 🔥 B1: gửi code đã được mã hoá base64 UTF-8
    const res = await fetch("https://ce.judge0.com/submissions?base64_encoded=true&wait=true", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            language_id,
            source_code: encodeBase64(sourceCode),
            stdin: encodeBase64(stdin)
        })
    });

    const payload = await res.json();

    if (!payload.token && payload.message) {
        return payload; // Trả về lỗi API (nếu có)
    }

    let result = payload;

    // 🔥 B2: lấy kết quả nếu wait=true vẫn chưa giải quyết xong
    if (result.token && (!result.status || result.status.id < 3)) {
        const token = result.token;
        while (true) {
            const check = await fetch(`https://ce.judge0.com/submissions/${token}?base64_encoded=true`);
            result = await check.json();

            if (!result || !result.status || result.status.id >= 3) break;
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // Giải mã Base64 => UTF-8
    if (result) {
        if (result.stdout) result.stdout = decodeBase64(result.stdout);
        if (result.stderr) result.stderr = decodeBase64(result.stderr);
        if (result.compile_output) result.compile_output = decodeBase64(result.compile_output);
        if (result.message) result.message = decodeBase64(result.message);
    }

    return result;
};