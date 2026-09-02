import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Service Worker disabled temporarily to fix caching issues
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(() => {
//         console.log('Service Worker registered successfully');
//       })
//       .catch((err) => {
//         console.log('Service Worker registration failed:', err);
//       });
//   });
// }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);