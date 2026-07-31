/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import '../../../packages/ui/src/styles/global.css'; // Import global CSS stylesheet
import { getSavedTheme, setTheme } from '@financeos/ui';

// Synchronously apply theme before rendering to avoid FOUC
setTheme(getSavedTheme());

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
