import React, { Suspense } from 'react';
import { configureMonacoWorkers } from '../../monaco/setupMonacoWorkers';
import './LazyMonacoEditor.scss';

const MonacoEditor = React.lazy(async () => {
  configureMonacoWorkers();
  const module = await import('@monaco-editor/react');
  return { default: module.default };
});

const MonacoSkeleton = () => (
  <div className="monaco-skeleton" aria-label="Loading editor">
    <div className="monaco-skeleton-toolbar" />
    <div className="monaco-skeleton-lines">
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={index} style={{ width: `${88 - (index % 5) * 10}%` }} />
      ))}
    </div>
  </div>
);

const LazyMonacoEditor = (props) => (
  <Suspense fallback={<MonacoSkeleton />}>
    <MonacoEditor loading={<MonacoSkeleton />} {...props} />
  </Suspense>
);

export default LazyMonacoEditor;
