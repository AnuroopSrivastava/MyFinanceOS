'use client';

import React, { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from '../src/App';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { getSavedTheme, setTheme } from '@financeos/ui';
import { createClient } from '../utils/supabase/client';

// Eagerly initialize browser Supabase client singleton before child components mount
if (typeof window !== 'undefined') {
  createClient();
}

export default function Page() {
  useEffect(() => {
    createClient();
    setTheme(getSavedTheme());
  }, []);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const hasValidClientId = Boolean(clientId && clientId !== 'demo-client-id' && clientId.includes('.apps.googleusercontent.com'));

  const appContent = <App />;

  return (
    <ErrorBoundary>
      {hasValidClientId ? (
        <GoogleOAuthProvider clientId={clientId}>
          {appContent}
        </GoogleOAuthProvider>
      ) : (
        appContent
      )}
    </ErrorBoundary>
  );
}


