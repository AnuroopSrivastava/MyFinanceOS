import React, { useState } from 'react';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface SetupProps {
  onSetupComplete: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onSetupComplete }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError('');
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        
        authSession.login(tokenResponse.access_token, userInfo);
        
        const success = await dbService.unlock();
        if (success) {
          onSetupComplete();
        } else {
          setError('Failed to initialize database.');
        }
      } catch (err) {
        setError('Error authenticating with Google.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
    scope: 'https://www.googleapis.com/auth/drive.appdata profile email',
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      background: 'radial-gradient(circle at center, hsl(224, 25%, 10%) 0%, hsl(224, 30%, 5%) 100%)'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="MyFinanceOS Logo" style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 20px hsla(186, 100%, 50%, 0.3)'
          }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome to MyFinanceOS</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Set up your secure, cloud-synced personal & business vault
          </p>
        </div>

        <div className="glass-panel" style={{
          padding: '1rem',
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          background: 'rgba(0, 180, 255, 0.05)',
          borderColor: 'hsla(186, 100%, 50%, 0.2)'
        }}>
          <ShieldAlert size={28} color="var(--accent-1)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <strong>Cloud Security:</strong> Your data is stored exclusively in your own Google Drive using a hidden Application Data folder. We don't have access to it.
          </div>
        </div>

        {error && (
          <div style={{
            color: 'var(--error)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            background: 'var(--error-bg)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={() => login()}
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting & Syncing...' : 'Continue with Google'}
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
};
