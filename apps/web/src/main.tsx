import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import '@financeos/ui/src/styles/global.css'; // Import global CSS stylesheet directly
import '@financeos/ui'; // Import theme loading and helpers

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
