import React, { useState } from 'react';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { ShieldCheck, ArrowRight, Lock, Database, Globe, Network, TrendingUp } from 'lucide-react';

interface LandingProps {
  onUnlock: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onUnlock }) => {
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
      minHeight: '100vh',
      background: 'radial-gradient(circle at top center, hsl(224, 25%, 15%) 0%, hsl(224, 30%, 5%) 100%)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 3rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="MyFinanceOS Logo" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            boxShadow: '0 0 15px hsla(186, 100%, 50%, 0.3)'
          }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            MyFinanceOS
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="https://myfinanceosweb.vercel.app/privacy.html" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy</a>
          <a href="https://myfinanceosweb.vercel.app/terms.html" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Terms</a>
          <button 
            onClick={() => login()}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glow effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, hsla(186, 100%, 50%, 0.1) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.4rem 1rem',
            borderRadius: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '2rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <ShieldCheck size={14} color="var(--accent-1)" />
            <span>Local-first architecture with strict privacy</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #fff 0%, #a0a0a0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Your Wealth.<br />Your Operating System.
          </h2>
          
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: 1.6
          }}>
            A highly secure, private personal finance tracker that syncs 
            directly to your own Google Drive. We don't store your data on our servers—you own everything.
          </p>

          {error && (
            <div style={{
              color: 'var(--error)',
              fontSize: '0.9rem',
              marginBottom: '2rem',
              background: 'var(--error-bg)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              maxWidth: '400px',
              margin: '0 auto 2rem'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={() => login()}
            className="btn btn-primary"
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              borderRadius: '2rem',
              gap: '0.75rem',
              boxShadow: '0 10px 30px hsla(186, 100%, 50%, 0.3)'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting to Drive...' : 'Get Started with Google'}
            {!isLoading && <ArrowRight size={20} />}
          </button>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          maxWidth: '1000px',
          width: '100%',
          marginTop: '6rem',
          position: 'relative',
          zIndex: 1
        }}>
          {[
            { icon: <Database size={24} />, title: "Your Private Vault", desc: "Data is stored strictly in your personal Google Drive 'appDataFolder'. We have no access to it." },
            { icon: <Network size={24} />, title: "Full Ledger System", desc: "Track accounts, income, and expenses with a robust double-entry accounting foundation." },
            { icon: <TrendingUp size={24} />, title: "Investment Planning", desc: "Advanced tools to track stocks, mutual funds, and plot your path to financial independence." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel" style={{
              padding: '2rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ color: 'var(--accent-1)' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Data Usage Transparency Section */}
        <div style={{
          marginTop: '4rem',
          maxWidth: '800px',
          padding: '2rem',
          background: 'rgba(0, 180, 255, 0.05)',
          border: '1px solid hsla(186, 100%, 50%, 0.2)',
          borderRadius: '16px',
          textAlign: 'left',
          zIndex: 1
        }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--accent-1)" />
            Data Usage Transparency
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            <strong>Why we request Google Drive access:</strong> MyFinanceOS requests the restricted <code>drive.appdata</code> scope during login. This permission is used <strong>strictly</strong> to create, read, and update a hidden <code>financeos_db.json</code> file inside your Google Drive's hidden Application Data folder. This allows you to sync your financial data across devices without us ever seeing or storing it on our own servers. We cannot see or access your other Google Drive files.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <a href="https://myfinanceosweb.vercel.app/privacy.html" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="https://myfinanceosweb.vercel.app/terms.html" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
        © {new Date().getFullYear()} MyFinanceOS. All rights reserved.
      </footer>
    </div>
  );
};
