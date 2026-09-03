import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register service worker for PWA with cache busting
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Add version parameter to bust cache
    const swUrl = `/sw.js?v=${Date.now()}`;
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('Service Worker registered successfully');
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New update available, refresh to install');
            }
          });
        });
      })
      .catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);