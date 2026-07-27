/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../../../packages/ui/src/styles/global.css'; // Import global CSS stylesheet
import '@financeos/ui'; // Import theme loading and helpers

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
