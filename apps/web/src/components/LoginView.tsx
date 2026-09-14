'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { getSavedTheme, AppTheme } from '@financeos/ui';
import posthog from 'posthog-js';

// Email+password sign-in for accounts that have set a password via the
// recovery flow. Google-only accounts use the landing-page OAuth button.
export const LoginView: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>('glass-cyan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTheme(getSavedTheme());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        posthog.capture('password_signin_completed', {});
        window.location.assign('/');
        return;
      }
      if (res.status === 429) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        // Deliberately generic — identical message for unknown email and
        // wrong password.
        setError('Invalid email or password.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-theme={theme}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #090d16)',
        color: 'var(--text-primary, #f8fafc)',
        fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)',
        position: 'relative',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-15%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, var(--accent-glow, rgba(6, 182, 212, 0.15)) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--bg-panel, rgba(15, 23, 42, 0.85))',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Back to MyFinanceOS
        </Link>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
          <ShieldCheck size={14} />
          End-to-end encrypted
        </span>
      </nav>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.25rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--bg-panel, rgba(15, 23, 42, 0.85))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderRadius: '20px',
            padding: '2.25rem 2rem',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              marginBottom: '1.25rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--accent-glow, rgba(124, 68, 246, 0.15))',
              color: 'var(--accent-primary, #7c44f6)',
            }}
          >
            <LogIn size={26} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Sign in</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', lineHeight: 1.55, margin: '0 0 1.75rem' }}>
            Use the email and password you set for your account. Prefer Google?{' '}
            <Link href="/" style={{ color: 'var(--accent-primary, #7c44f6)', fontWeight: 600 }}>
              Continue with Google
            </Link>
            .
          </p>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="login-email"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.95rem',
                outline: 'none',
                marginBottom: '1.1rem',
              }}
            />
            <label
              htmlFor="login-password"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '0.95rem',
                outline: 'none',
                marginBottom: '1.25rem',
              }}
            />
            {error && (
              <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || email.length === 0 || password.length === 0}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--accent-primary, #7c44f6)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting || email.length === 0 || password.length === 0 ? 0.6 : 1,
              }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', margin: '1.5rem 0 0' }}>
            Forgot your password?{' '}
            <Link href="/forgot-password" style={{ color: 'var(--accent-primary, #7c44f6)', fontWeight: 600 }}>
              Reset it
            </Link>
          </p>
        </div>
      </main>

      <div style={{ textAlign: 'center', padding: '0 1.5rem 2rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        <Lock size={12} />
        Attempts are rate-limited and monitored for abuse.
      </div>
    </div>
  );
};
