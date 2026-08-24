'use client';

import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from '../src/App';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { getSavedTheme, setTheme } from '@financeos/ui';
import { authSession } from '@financeos/auth';
import { createClient } from '../utils/supabase/client';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Inject the Next.js SSR-aware Supabase client into the AuthSessionManager
    authSession.setClient(createClient());
    setTheme(getSavedTheme());
    setMounted(true);
  }, []);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  const web3FormsKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY || '';

  if (!mounted) return null;

  if (!clientId || !web3FormsKey) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444', fontFamily: 'system-ui, sans-serif', height: '100vh', background: '#0b0f19' }}>
        <h2 style={{ marginTop: 0 }}>Configuration Error</h2>
        <p style={{ color: '#94a3b8' }}>The application refused to start because critical environment variables are missing.</p>
        <p style={{ color: '#94a3b8' }}>Ensure <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> and <code>NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY</code> are set in your <code>.env</code> file.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
