import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely catch and suppress benign browser / DOMException AbortError cancellations
if (typeof window !== 'undefined') {
  const isAbort = (reason: any) => {
    const msg = (reason?.message || String(reason || '')).toLowerCase();
    const name = reason?.name || '';
    return (
      name === 'AbortError' ||
      msg.includes('aborted') ||
      msg.includes('the user aborted a request') ||
      msg.includes('signal is aborted')
    );
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isAbort(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isAbort(event.error) || isAbort(event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
