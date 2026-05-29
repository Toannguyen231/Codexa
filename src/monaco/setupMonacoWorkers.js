let workersConfigured = false;

const editorWorker = () => import('monaco-editor/esm/vs/editor/editor.worker?worker');
const typeScriptWorker = () => import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');

const getWorkerLoader = (label) => {
  if (label === 'typescript' || label === 'javascript') {
    return typeScriptWorker;
  }

  return editorWorker;
};

export const configureMonacoWorkers = () => {
  if (workersConfigured || typeof globalThis === 'undefined') return;

  globalThis.MonacoEnvironment = {
    async getWorker(_workerId, label) {
      const { default: WorkerConstructor } = await getWorkerLoader(label)();
      return new WorkerConstructor();
    },
  };

  workersConfigured = true;
};
