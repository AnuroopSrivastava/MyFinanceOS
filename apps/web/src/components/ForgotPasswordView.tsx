'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, KeyRound, ShieldCheck } from 'lucide-react';
import { getSavedTheme, AppTheme } from '@financeos/ui';

// Unauthenticated forgot-password form. The API always returns the same
// response whether or not the address exists, so this UI shows a single
// generic success state for every submitted email.
export const ForgotPasswordView: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>('glass-cyan');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // 200 and 429 both render the generic confirmation; only network-level
      // failures surface an error.
      if (!res.ok && res.status !== 429) {
        setError('Something went wrong. Please try again in a moment.');
      } else {
        setSubmitted(true);
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
          left: '10%',
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
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 1.25rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                }}
              >
                <Mail size={26} />
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
                Check your inbox
              </h1>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                If an account exists for <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>{email}</strong>, reset instructions have been sent. The link expires in 24 hours.
              </p>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
                Didn&apos;t get an email? Check spam, or{' '}
                <Link href="/forgot-password" style={{ color: 'var(--accent-primary, #7c44f6)', fontWeight: 600 }}>
                  try again later
                </Link>
                .
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  href="/login"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'var(--accent-primary, #7c44f6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                  }}
                >
                  Sign in with password
                </Link>
                <Link
                  href="/"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                    color: 'var(--text-secondary, #94a3b8)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                  }}
                >
                  Use Google sign-in instead
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                <KeyRound size={26} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                Set or reset your password
              </h1>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', lineHeight: 1.55, margin: '0 0 1.75rem' }}>
                Enter the email connected to your account. If it exists, we&apos;ll send a secure link to set a new password. Your Google sign-in keeps working either way.
              </p>

              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="forgot-email"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}
                >
                  Email address
                </label>
                <input
                  id="forgot-email"
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
                  disabled={submitting || email.length === 0}
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
                    opacity: submitting || email.length === 0 ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', margin: '1.5rem 0 0' }}>
                Already have a password?{' '}
                <Link href="/login" style={{ color: 'var(--accent-primary, #7c44f6)', fontWeight: 600 }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
