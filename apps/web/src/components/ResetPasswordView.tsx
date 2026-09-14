'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getSavedTheme, AppTheme } from '@financeos/ui';
import { createClient } from '../../utils/supabase/client';
import posthog from 'posthog-js';

// Reached only through a valid recovery link: /auth/callback exchanges the
// email-link code server-side, sets the session cookie, and redirects here.
// Setting the password signs out every session (including this one) so a
// stolen reset link invalidates any attacker holding an older session.
export const ResetPasswordView: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>('glass-cyan');
  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid-link' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTheme(getSavedTheme());
    const check = async () => {
      const supabase = createClient();
      if (!supabase) {
        setPhase('invalid-link');
        return;
      }
      const { data } = await supabase.auth.getSession();
      setPhase(data.session ? 'ready' : 'invalid-link');
    };
    check();
  }, []);

  const passwordStrength = (value: string): { label: string; color: string } => {
    if (value.length >= 12 && /[A-Za-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value)) {
      return { label: 'Strong', color: '#10b981' };
    }
    if (value.length >= 8) {
      return { label: 'Okay — mix letters, numbers, and symbols', color: '#facc15' };
    }
    return { label: 'Use at least 8 characters', color: '#f87171' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || phase !== 'ready') return;
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Auth not configured');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      // Invalidate every session (global scope) — this one included.
      await supabase.auth.signOut({ scope: 'global' });
      posthog.capture('password_reset_completed', {});
      setPhase('done');
    } catch (err) {
      console.error('Password reset failed:', err);
      setError('Could not set the password. The link may have expired — request a new one.');
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(password);

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
          {phase === 'checking' && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', margin: '2rem 0' }}>
              Verifying reset link…
            </p>
          )}

          {phase === 'invalid-link' && (
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
                  background: 'rgba(248, 113, 113, 0.12)',
                  color: '#f87171',
                }}
              >
                <AlertCircle size={26} />
              </div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
                This link has expired
              </h1>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                Reset links only work once and expire for security. Request a fresh one — it only takes a moment.
              </p>
              <Link
                href="/forgot-password"
                style={{
                  display: 'block',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--accent-primary, #7c44f6)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                Request a new link
              </Link>
            </div>
          )}

          {phase === 'done' && (
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
                <CheckCircle2 size={26} />
              </div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
                Password set
              </h1>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                All active sessions were signed out for safety. Sign in with your new password, or with Google as before.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'block',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--accent-primary, #7c44f6)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  marginBottom: '0.75rem',
                }}
              >
                Sign in
              </Link>
              <Link
                href="/"
                style={{
                  display: 'block',
                  padding: '0.85rem 1rem',
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
          )}

          {phase === 'ready' && (
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
                Set your new password
              </h1>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', lineHeight: 1.55, margin: '0 0 1.75rem' }}>
                Choose a strong password. Setting it signs out all sessions, including this one.
              </p>

              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="new-password"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}
                >
                  New password
                </label>
                <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary, #94a3b8)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: '0.25rem',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: strength.color, margin: '0 0 1.1rem' }}>{strength.label}</p>
                )}

                <label
                  htmlFor="confirm-password"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem' }}
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
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
                  disabled={submitting || password.length === 0 || confirm.length === 0}
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
                    opacity: submitting || password.length === 0 || confirm.length === 0 ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Setting password…' : 'Set password and sign out everywhere'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
