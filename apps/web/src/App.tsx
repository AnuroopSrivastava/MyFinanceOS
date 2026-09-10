import React, { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { authSession } from '@financeos/auth';
import { useInteractiveCardSystem } from '@financeos/ui';
import { Landing } from './components/Landing.js';
import posthog from 'posthog-js';

// Authenticated application shell is lazy-loaded so unauthenticated landing page visitors
// never download or parse SQLite WASM, database schemas, command palette, or heavy view logic.
const AuthenticatedApp = React.lazy(() =>
  import('./components/AuthenticatedApp.js').then((m) => ({ default: m.AuthenticatedApp }))
);

const AppSuspenseFallback = () => (
  <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary, #070810)' }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid rgba(130, 80, 255, 0.2)', borderTopColor: '#7c44f6', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const App: React.FC = () => {
  useInteractiveCardSystem();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authed = await authSession.isAuthenticated();
        setIsAuthenticated(authed);
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };
    checkAuth();
  }, []);

  const handleUnlock = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      const isAuth = await authSession.isAuthenticated();
      if (isAuth) {
        setIsAuthenticated(true);
        setIsUnlocked(true);
        // Identify user with their stable Supabase ID; email goes on the person, not the event
        try {
          const user = await authSession.getUser();
          if (user) {
            posthog.identify(user.id, { email: user.email });
          }
        } catch {
          // Identification is best-effort; authentication proceeds regardless
        }
        posthog.capture('user_signed_in', { method: 'google_oauth' });
      } else {
        // Initiate Google OAuth login or unlock workspace
        await authSession.loginWithGoogle();
      }
    } catch (err) {
      console.error('Failed to unlock database:', err);
      // Fallback for mock/offline local environments
      setIsUnlocked(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLock = () => {
    posthog.reset();
    setIsUnlocked(false);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated && !isUnlocked) {
    return <Landing onUnlock={handleUnlock} authenticating={isAuthenticating} />;
  }

  return (
    <MotionConfig reducedMotion="never">
      <React.Suspense fallback={<AppSuspenseFallback />}>
        <AuthenticatedApp onLock={handleLock} />
      </React.Suspense>
    </MotionConfig>
  );
};

export default App;
