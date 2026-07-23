import React, { useState } from 'react';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginProps {
  onUnlock: () => void;
}

export const Login: React.FC<LoginProps> = ({ onUnlock }) => {
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
          onUnlock();
        } else {
          setError('Failed to load database from Google Drive.');
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
        maxWidth: '420px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <img src="/logo.png" alt="MyFinanceOS Logo" style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 20px hsla(186, 100%, 50%, 0.3)'
        }} />

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>Welcome back</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Connect with Google to securely sync your financial data
        </p>

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
          style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting to Drive...' : 'Login with Google'}
          {!isLoading && <ArrowRight size={18} />}
        </button>

        <div style={{
          marginTop: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          color: 'var(--text-muted)',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} />
          <span>Data securely stored in your personal Google Drive</span>
        </div>
      </div>
    </div>
  );
};
