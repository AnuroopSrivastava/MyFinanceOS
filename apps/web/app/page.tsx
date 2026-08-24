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
    const client = createClient();
    if (client) {
      authSession.setClient(client);
    }
    setTheme(getSavedTheme());
    setMounted(true);
  }, []);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id';

  if (!mounted) return null;

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
