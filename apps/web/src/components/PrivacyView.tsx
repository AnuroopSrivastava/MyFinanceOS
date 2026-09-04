'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Lock, Database, ArrowLeft, Key, Server, Cpu,
  CheckCircle2, HelpCircle, FolderLock, Sparkles
} from 'lucide-react';

import { getSavedTheme, AppTheme } from '@financeos/ui';

export interface PrivacyViewProps {
  onBack?: () => void;
  showNav?: boolean;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack, showNav = true }) => {
  const [activeSection, setActiveSection] = useState('architecture');
  const [theme, setTheme] = useState<AppTheme>('glass-cyan');

  useEffect(() => {
    setTheme(getSavedTheme());
  }, []);

  const sections = [
    { id: 'architecture', label: '1. Local-First Architecture', icon: <Cpu size={16} /> },
    { id: 'storage', label: '2. Local Vault & Encrypted Sync', icon: <Database size={16} /> },
    { id: 'encryption', label: '3. AES-256 Vault Cipher', icon: <Lock size={16} /> },
    { id: 'oauth', label: '4. OAuth Scopes & Token Handling', icon: <Key size={16} /> },
    { id: 'ai-privacy', label: '5. AI Models & Telemetry', icon: <Sparkles size={16} /> },
    { id: 'dpdp', label: '6. DPDP Act 2023 Compliance', icon: <ShieldCheck size={16} /> },
    { id: 'destruction', label: '7. Export & Total Erasure', icon: <FolderLock size={16} /> },
    { id: 'faq', label: '8. Security FAQ', icon: <HelpCircle size={16} /> }
  ];

  return (
    <div
      data-theme={theme}
      data-testid="privacy-view"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #090d16)',
        color: 'var(--text-primary, #f8fafc)',
        fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, var(--accent-glow, rgba(6, 182, 212, 0.15)) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top sticky navigation bar */}
      {showNav && (
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
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
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
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
                Back to Workspace
              </button>
            ) : (
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--text-secondary, #94a3b8)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeft size={14} />
                Back to App
              </Link>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img src="/logo.png" alt="MyFinanceOS" width={28} height={28} loading="lazy" decoding="async" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>MyFinanceOS</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/terms"
              style={{
                color: 'var(--text-secondary, #94a3b8)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: '6px'
              }}
            >
              Terms of Service →
            </Link>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                background: 'var(--badge-emerald-bg, rgba(16, 185, 129, 0.15))',
                color: 'var(--badge-emerald-text, #10b981)',
                border: '1px solid var(--badge-emerald-border, rgba(16, 185, 129, 0.3))',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <ShieldCheck size={13} />
              100% Local-First
            </span>
          </div>
        </nav>
      )}

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem', position: 'relative', zIndex: 1 }}>
        {/* Header Hero */}
        <header
          style={{
            background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
            borderRadius: '24px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            padding: '2.5rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0,0,0,0.4))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ maxWidth: '720px' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0 0 0.75rem 0', fontFamily: 'var(--font-display, inherit)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Your Money. Your Device.<br />
                <span style={{ color: 'var(--accent-1, #38bdf8)' }}>Zero Server Storage.</span>
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, margin: 0 }}>
                MyFinanceOS is architected on a fundamental engineering principle: <strong>client-side data sovereignty</strong>. We do not operate centralized backend databases that store, inspect, train AI models on, or monetize your financial logs.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>Security Specs</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> AES-256 GCM Key Cipher
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> Google <code>drive.appdata</code> Only
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> Zero Tracking / Ad Pixels
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="var(--success, #10b981)" /> DPDP Act 2023 Compliant
              </div>
            </div>
          </div>
        </header>

        {/* Layout: Sidebar + Main Content */}
        <div className="responsive-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Quick Jump Sidebar */}
          <aside
            style={{
              position: 'sticky',
              top: '80px',
              background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
              borderRadius: '16px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', padding: '0.4rem 0.6rem', textTransform: 'uppercase' }}>
              Contents Navigation
            </div>
            {sections.map(s => {
              const isActive = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(s.id);
                    const el = document.getElementById(s.id);
                    if (el) {
                      const offset = 90;
                      const bodyRect = document.body.getBoundingClientRect().top;
                      const elementRect = el.getBoundingClientRect().top;
                      const elementPosition = elementRect - bodyRect;
                      const offsetPosition = elementPosition - offset;
                      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    }
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : 'var(--text-secondary, #94a3b8)',
                    background: isActive ? 'var(--badge-cyan-bg, rgba(6,182,212,0.12))' : 'transparent',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    boxShadow: isActive ? 'var(--neo-inset-sm)' : 'none'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-privacy-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '12%',
                        bottom: '12%',
                        width: '3px',
                        borderRadius: '2px',
                        background: 'var(--accent-1, #06b6d4)',
                        boxShadow: '0 0 10px var(--accent-1, #06b6d4)'
                      }}
                    />
                  )}
                  <span style={{ color: isActive ? 'var(--accent-1, #06b6d4)' : 'inherit', display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                  <span>{s.label}</span>
                </a>
              );
            })}
          </aside>

          {/* Core Policy Articles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Section 1 */}
            <section
              id="architecture"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Cpu size={22} color="var(--accent-1, #38bdf8)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>1. Local-First Architecture Guarantee</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                Unlike conventional fintech platforms, MyFinanceOS does not maintain centralized database clusters that record your PAN number, salary slips, bank accounts, investment portfolios, or GST transactions.
              </p>
              <div style={{ background: 'var(--badge-cyan-bg, rgba(6,182,212,0.1))', border: '1px solid var(--badge-cyan-border, rgba(6,182,212,0.25))', borderRadius: '12px', padding: '1rem 1.25rem', margin: '1rem 0' }}>
                <strong style={{ color: 'var(--accent-1, #38bdf8)' }}>The Zero-Access Guarantee:</strong> All financial computing—including Net Worth rollups, Old vs New tax slab comparisons, SIP compounding trajectories, loan amortization, and Sankey cash flow ribbons—executes 100% locally in your browser’s V8 JavaScript runtime engine.
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>On-Device SQLite / IndexedDB:</strong> Data stays stored in your browser’s isolated local storage sandbox on your hardware.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Zero Telemetry Ingestion:</strong> We do not log transaction values, vendor names, bank account numbers, or balance summaries to any remote endpoint.</span>
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section
              id="storage"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Database size={22} color="var(--color-asset-stocks, #10b981)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>2. Zero-Knowledge Local Storage & Encrypted Sync</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                To enable seamless multi-device synchronisation without exposing you to centralized cloud data breach vectors, MyFinanceOS is engineered with <strong>client-side encryption at rest and in transit</strong>.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
                <div style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #fff)', marginBottom: '0.3rem' }}>📁 Client-Side Device Sandbox</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
                    The database is serialized and encrypted directly on your hardware into <code>salt:iv:ciphertext</code> payloads before being saved to browser localStorage.
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #fff)', marginBottom: '0.3rem' }}>🔒 Ciphertext-Only Cloud Replica</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
                    When opt-in cloud synchronization is enabled, only encrypted ciphertext blobs are uploaded. The decryption key is derived from your PIN and never leaves your device.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="encryption"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Lock size={22} color="var(--color-asset-gold, #f59e0b)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>3. AES-256 Vault Encryption & Passcode Safeguard</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                You can configure a master passcode to lock your entire financial OS session.
              </p>
              <div style={{ background: 'var(--badge-amber-bg, rgba(245, 158, 11, 0.1))', border: '1px solid var(--badge-amber-border, rgba(245, 158, 11, 0.3))', borderRadius: '12px', padding: '1rem 1.25rem', margin: '1rem 0' }}>
                <strong style={{ color: 'var(--color-asset-gold, #f59e0b)' }}>Cryptographic Architecture:</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  Keys are derived using PBKDF2 with 100,000 hashing rounds and SHA-256. Data is encrypted using AES-256-GCM authenticated cipher. Your secret key is never transmitted or stored on any server.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="oauth"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Key size={22} color="var(--color-asset-mf, #8b5cf6)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>4. Authentication & Token Handling</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                When signing in with Google OAuth for optional cloud sync, MyFinanceOS requests only basic identity claims:
              </p>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem', background: 'var(--bg-secondary, rgba(0,0,0,0.4))', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--accent-1, #38bdf8)' }}>
                openid email profile
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7, marginTop: '0.75rem' }}>
                OAuth access tokens are handled securely with automated refresh. We never request access to your emails, contacts, Google Drive files, or external documents.
              </p>
            </section>

            {/* Section 5 */}
            <section
              id="ai-privacy"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <Sparkles size={22} color="var(--accent-1, #06b6d4)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>5. AI Assistant & Telemetry Freedom</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                Our AI Financial Assistant operates with complete transparency:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Bring-Your-Own-Key (BYOK):</strong> When using Google Gemini AI models, prompts are dispatched using your own private API key directly to Google's API.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>No Model Training on User Data:</strong> Neither MyFinanceOS nor external APIs use your financial queries to train foundational models under standard API terms.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.92rem' }}>
                  <CheckCircle2 size={16} color="var(--success, #10b981)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Zero Third-Party Advertising:</strong> No trackers, Google Analytics, Meta Pixels, or marketing beacons exist in our code.</span>
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section
              id="dpdp"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <ShieldCheck size={22} color="var(--success, #10b981)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>6. India Digital Personal Data Protection (DPDP) Act 2023</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                MyFinanceOS adheres to the statutory provisions of India’s <strong>Digital Personal Data Protection Act, 2023 (DPDP)</strong>:
              </p>
              <div style={{ background: 'var(--badge-emerald-bg, rgba(16, 185, 129, 0.1))', border: '1px solid var(--badge-emerald-border, rgba(16, 185, 129, 0.3))', borderRadius: '12px', padding: '1rem 1.25rem', margin: '0.75rem 0' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary, #fff)', fontWeight: 600, marginBottom: '0.3rem' }}>Data Principal Sovereignty</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
                  As a Data Principal, you exercise absolute processing autonomy. Because no personal data is transferred to MyFinanceOS servers, risk of third-party data breaches, unauthorized profiling, or data broker leakage is engineered down to zero.
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="destruction"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <FolderLock size={22} color="var(--error, #ef4444)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>7. Full Data Export & 1-Click Erasure</h2>
              </div>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.7 }}>
                You retain unconditional rights to take your data elsewhere or destroy it entirely:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                <div style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #fff)', marginBottom: '0.3rem' }}>📦 Complete JSON / CSV Export</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
                    Download unencumbered, standardized JSON and CSV copies of your complete ledger, tax computations, invoices, and asset matrices in 1 click.
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--error, #ef4444)', marginBottom: '0.3rem' }}>🗑️ Instant Session Wipe</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
                    Resetting workspace or clearing browser cache permanently shreds local database keys and state.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: FAQ */}
            <section
              id="faq"
              style={{
                background: 'var(--bg-panel, rgba(18, 24, 38, 0.7))',
                borderRadius: '16px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                padding: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))', paddingBottom: '0.75rem' }}>
                <HelpCircle size={22} color="var(--accent-1, #06b6d4)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>8. Frequently Asked Security Questions</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: '0 0 0.35rem 0' }}>Can MyFinanceOS developers see my financial data?</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, margin: 0 }}>
                    No. The software runs entirely on your local machine and communicates solely with Google APIs when Drive sync is enabled. There are no central analytics, telemetry endpoints, or database servers.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: '0 0 0.35rem 0' }}>What happens if I lose my local AES passcode?</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, margin: 0 }}>
                    Because encryption is truly zero-knowledge, we do not store your key or possess master backdoors. We strongly recommend storing your passcode securely in a password manager and keeping offline JSON backups.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #fff)', margin: '0 0 0.35rem 0' }}>Are my uploaded Vault documents read by third parties?</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, margin: 0 }}>
                    No. Documents stored in Document Vault are encrypted locally using AES-256 before disk persistence and indexed with client-side OCR without transmitting unencrypted scans over public networks.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.85rem'
          }}
        >
          <div>© 2026 MyFinanceOS. India-Ready Local-First Financial Operating System.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>Home</Link>
            <Link href="/terms" style={{ color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>Terms of Service</Link>
            <a href="#architecture" style={{ color: 'var(--accent-1, #38bdf8)', textDecoration: 'none' }}>Top ↑</a>
          </div>
        </footer>
      </main>
    </div>
  );
};
