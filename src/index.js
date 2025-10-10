import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import './i18n/config';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register();

// Listen for service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATED') {
      console.log('Service Worker updated:', event.data.version);
      // Force reload to get the latest version
      window.location.reload();
    }
  });
}