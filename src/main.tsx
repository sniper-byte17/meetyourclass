import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely catch and suppress benign browser / DOMException AbortError cancellations
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    const name = reason?.name || '';
    if (
      name === 'AbortError' ||
      msg.includes('aborted') ||
      msg.includes('The user aborted a request') ||
      msg.includes('signal is aborted without reason')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || event.error?.message || '';
    const name = event.error?.name || '';
    if (
      name === 'AbortError' ||
      msg.includes('aborted') ||
      msg.includes('The user aborted a request') ||
      msg.includes('signal is aborted without reason')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
