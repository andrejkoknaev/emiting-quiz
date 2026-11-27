import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const FONT_LOAD_TIMEOUT_MS = 2000;

async function waitForFonts() {
  if (typeof document === 'undefined' || !('fonts' in document)) return;

  const fontRequests = [
    document.fonts.load('400 1em "Dela Gothic One"', 'ЭМИТИНГШагКаквасзовут0123456789'),
    document.fonts.load('400 1em "Golos Text"', 'АБВГДабвгд0123456789'),
    document.fonts.load('500 1em "Golos Text"', 'АБВГДабвгд0123456789'),
    document.fonts.load('600 1em "Golos Text"', 'АБВГДабвгд0123456789'),
    document.fonts.load('700 1em "Golos Text"', 'АБВГДабвгд0123456789'),
    document.fonts.load('600 1em "JetBrains Mono"', '0123456789'),
    document.fonts.load('700 1em "JetBrains Mono"', '0123456789'),
  ];

  const timeout = new Promise((resolve) => setTimeout(resolve, FONT_LOAD_TIMEOUT_MS));

  try {
    await Promise.race([
      Promise.allSettled(fontRequests).then(() => document.fonts.ready),
      timeout,
    ]);
  } catch {
  }
}

async function bootstrap() {
  await waitForFonts();

  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
