import React from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.scss';
import { FiRotateCcw, FiCopy } from 'react-icons/fi';

const DEFAULT_CODE = {
  'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << \"Hello, World!\" << endl;\n  return 0;\n}`,
  Python: `def main():\n  print(\"Hello, World!\")\n\nif __name__ == \"__main__\":\n  main()`,
  Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}`,
  JavaScript: `function main() {\n  console.log(\"Hello, World!\");\n}\n\nmain();`,
};

const languageMap = {
  'C++': 'cpp',
  Python: 'python',
  Java: 'java',
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  'C#': 'csharp',
  PHP: 'php',
};

const CodeEditor = ({ code, setCode, language }) => {
  const monacoLanguage = languageMap[language] || 'plaintext';

  const handleReset = () => {
    if (window.confirm('Reset code về mặc định?')) {
      setCode(DEFAULT_CODE[language] || '');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => { });
  };

  return (
    <div className="editor-wrapper">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <span className="toolbar-label">📝 {language}</span>
          <span className="toolbar-divider" />
        </div>
        <div className="editor-toolbar-right">
          <button className="toolbar-action-btn" onClick={handleCopy}>
            <FiCopy size={13} /> Copy
          </button>
          <button className="toolbar-action-btn" onClick={handleReset}>
            <FiRotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="monaco-editor-container">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={code}
          onChange={(value = '') => setCode(value)}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;