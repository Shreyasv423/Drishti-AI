import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register Workbox service worker with safe auto-update handling
registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('drishti-offline-ready'));
  },
});

createRoot(document.getElementById('root')!).render(<App />);
