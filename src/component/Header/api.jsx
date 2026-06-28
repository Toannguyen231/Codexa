import API from '../../api';

export const executeCode = async (displayLanguage, sourceCode, stdin = "") => {
  try {
    const { data: result } = await API.post('code/execute', {
      language: displayLanguage,
      code: sourceCode,
      stdin,
    });

    // compile error
    if (result.compile_output) {
      return { message: result.compile_output, status: result.status || { id: 6, description: 'Compilation Error' } };
    }

    return result;
  } catch (err) {
    return { message: `Lỗi server: ${err.message}`, status: null };
  }
};