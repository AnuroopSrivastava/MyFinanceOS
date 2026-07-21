import React, { useState } from 'react';
import { dbService } from '@financeos/database';
import { ShieldCheck, Lock, ArrowRight, User } from 'lucide-react';

interface LoginProps {
  onUnlock: () => void;
}

export const Login: React.FC<LoginProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = (num: string) => {
    setError('');
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Brief delay to simulate crypto key derivation work
    setTimeout(async () => {
      try {
        const success = await dbService.unlock(pin);
        if (success) {
          onUnlock();
        } else {
          setError('Invalid Security PIN. Please try again.');
          setPin('');
        }
      } catch (err) {
        setError('Error unlocking database.');
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

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>Welcome back to MyFinanceOS</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Enter PIN to decrypt secure local vault
        </p>

        <form onSubmit={handleSubmit}>
          {/* Hidden password input for physical keyboard compliance */}
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setError('');
              if (/^\d*$/.test(e.target.value) && e.target.value.length <= 6) {
                setPin(e.target.value);
              }
            }}
            maxLength={6}
            style={{
              textAlign: 'center',
              letterSpacing: '1.5em',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'rgba(0, 0, 0, 0.2)',
              border: error ? '1px solid var(--error)' : '1px solid var(--border-color)',
              marginBottom: '1rem',
              padding: '0.8rem'
            }}
            placeholder="••••"
            className="form-input"
            autoFocus
            disabled={isLoading}
          />

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

          {/* Graphical Keypad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            margin: '1.5rem 0 2rem'
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                className="btn btn-secondary"
                onClick={() => handleKeyPress(num)}
                disabled={isLoading}
                style={{ fontSize: '1.25rem', padding: '0.9rem 0', borderRadius: '50px' }}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={isLoading}
              style={{ fontSize: '0.85rem', padding: '0.9rem 0', borderRadius: '50px' }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleKeyPress('0')}
              disabled={isLoading}
              style={{ fontSize: '1.25rem', padding: '0.9rem 0', borderRadius: '50px' }}
            >
              0
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBackspace}
              disabled={isLoading}
              style={{ fontSize: '0.85rem', padding: '0.9rem 0', borderRadius: '50px' }}
            >
              Delete
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
            disabled={isLoading || pin.length < 4}
          >
            {isLoading ? 'Decrypting Vault...' : 'Unlock Safe'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

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
          <span>AES-256 local ledger protection active</span>
        </div>
      </div>
    </div>
  );
};
