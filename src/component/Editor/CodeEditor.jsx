import React, { useRef, useEffect } from 'react';
import './CodeEditor.scss';
import { FiRotateCcw, FiCopy } from 'react-icons/fi';
import ConnectionStatus from '../ConnectionStatus/ConnectionStatus';
import LazyMonacoEditor from './LazyMonacoEditor';

const DEFAULT_CODE = {
  'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}`,
  Python: `def main():\n  print("Hello, World!")\n\nif __name__ == "__main__":\n  main()`,
  Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`,
  JavaScript: `function main() {\n  console.log("Hello, World!");\n}\n\nmain();`,
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

const CodeEditor = ({ code, setCode, language, socket, roomId, currentUser, settings, connectionStatus }) => {
  const monacoLanguage = languageMap[language] || 'plaintext';
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const cursorsRef = useRef({});
  const decorationsIdRef = useRef([]);

  const updateDecorations = () => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const newDecs = Object.values(cursorsRef.current).map(c => {
       return {
          range: new monacoRef.current.Range(c.position.lineNumber, c.position.column, c.position.lineNumber, c.position.column),
          options: {
             className: 'remote-cursor',
             hoverMessage: { value: `User: ${c.username}` }
          }
       };
    });
    
    decorationsIdRef.current = editorRef.current.deltaDecorations(decorationsIdRef.current, newDecs);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      if (socket && roomId) {
        socket.emit('cursor-move', {
          roomId,
          cursorData: { position: e.position }
        });
      }
    });

    // Also send cursor initially after mounting if desired
  };

  useEffect(() => {
    if (!socket) return;

    const handleCursorUpdate = ({ socketId, username, position }) => {
      // Don't show own cursor
      if (socketId === socket.id) return;

      if (cursorsRef.current[socketId] && cursorsRef.current[socketId].timeout) {
          clearTimeout(cursorsRef.current[socketId].timeout);
      }

      cursorsRef.current[socketId] = {
         username,
         position,
         timeout: setTimeout(() => {
             delete cursorsRef.current[socketId];
             updateDecorations();
         }, 5000) // remove after 5s idle
      };

      updateDecorations();
    };
    
    const handleUserLeft = ({ username }) => {
        Object.keys(cursorsRef.current).forEach(sid => {
            if (cursorsRef.current[sid].username === username) {
                clearTimeout(cursorsRef.current[sid].timeout);
                delete cursorsRef.current[sid];
            }
        });
        updateDecorations();
    };

    socket.on('cursor-update', handleCursorUpdate);
    socket.on('user-left', handleUserLeft);
    return () => {
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, currentUser]);

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
        {connectionStatus && <ConnectionStatus status={connectionStatus} />}
        <LazyMonacoEditor
          height="100%"
          language={monacoLanguage}
          theme={settings?.theme || 'vs-dark'}
          value={code}
          onChange={(value = '') => setCode(value)}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: settings?.minimap || false },
            fontSize: settings?.fontSize || 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: settings?.wordWrap || 'on',
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
