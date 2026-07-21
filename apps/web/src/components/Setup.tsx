import React, { useState } from 'react';
import { dbService } from '@financeos/database';
import { ShieldAlert, ArrowRight, UserPlus, KeyRound } from 'lucide-react';

interface SetupProps {
  onSetupComplete: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onSetupComplete }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('Security PINs do not match');
      return;
    }

    setIsLoading(true);
    // Tiny timeout to show loading & make UI feel responsive
    setTimeout(async () => {
      try {
        await dbService.initializeNewDb(pin, name);
        onSetupComplete();
      } catch (err) {
        setError('Failed to initialize database.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 400);
  };

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
            Set up your secure, offline-first personal & business vault
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
            <strong>Offline Security:</strong> Your data never leaves this machine. We encrypt sensitive tables using AES-256-GCM. 
            Write down your PIN safely; there is no cloud recovery option.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Primary User (Owner/Admin Name)</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              disabled={isLoading}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pin">Security PIN (4-6 digits)</label>
              <input
                id="pin"
                type="password"
                className="form-input"
                value={pin}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value) && e.target.value.length <= 6) {
                    setPin(e.target.value);
                  }
                }}
                placeholder="••••"
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPin">Confirm Security PIN</label>
              <input
                id="confirmPin"
                type="password"
                className="form-input"
                value={confirmPin}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value) && e.target.value.length <= 6) {
                    setConfirmPin(e.target.value);
                  }
                }}
                placeholder="••••"
                disabled={isLoading}
                required
              />
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
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={isLoading || !name || pin.length < 4}
          >
            {isLoading ? 'Encrypting & Seeding...' : 'Initialize System'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};
