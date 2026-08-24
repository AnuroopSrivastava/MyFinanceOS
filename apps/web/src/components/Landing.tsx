import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authSession } from '@financeos/auth';
import { Accordion } from '@financeos/ui';
import { MessageSquare, ShieldCheck } from 'lucide-react';

import { LandingHero } from './landing/LandingHero.js';
import { EcosystemMarquee } from './landing/EcosystemMarquee.js';
import { ValueCarousel } from './landing/ValueCarousel.js';
import { BentoProductShowcase } from './landing/BentoProductShowcase.js';
import { AllFeaturesGrid } from './landing/AllFeaturesGrid.js';
import { MetricsInNumbers } from './landing/MetricsInNumbers.js';
import { OutroBrandCTA } from './landing/OutroBrandCTA.js';
import './landing/landing.css';

interface LandingProps {
  onUnlock: () => void;
}

// FAQ Accordion Data
const FAQ_ITEMS = [
  {
    id: 'faq-free',
    title: 'Is MyFinanceOS free to use?',
    content:
      "Yes! Because we don't host your private data on our servers, our infrastructure costs are near zero, allowing us to provide this operating system completely free of charge."
  },
  {
    id: 'faq-pin',
    title: 'What happens if I lose my PIN or device?',
    content:
      'Since your data is protected with client-side zero-knowledge AES-256 encryption, your security PIN is the only key to decrypt your vault. We recommend creating regular 1-click JSON backup exports saved to a safe location.'
  },
  {
    id: 'faq-export',
    title: 'Can I export my data?',
    content:
      'Absolutely. You own 100% of your data. Built-in tools allow you to easily export your entire financial history to standard CSV and JSON formats at any time.'
  },
  {
    id: 'faq-privacy',
    title: 'Does MyFinanceOS share my data with third parties or tax authorities?',
    content:
      'Never. All mathematical computations, tax simulations, and portfolio tracking run strictly on your machine in IndexedDB. No external trackers, cookies, or telemetry.'
  }
];

export const Landing: React.FC<LandingProps> = ({ onUnlock }) => {
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSendingFeedback(true);
    setFeedbackError(null);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          access_key:
            process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ||
            (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WEB3FORMS_ACCESS_KEY) ||
            '',
          subject: 'New Feedback for MyFinanceOS',
          message: feedbackText
        })
      });
      if (response.ok) {
        setFeedbackSent(true);
        setFeedbackText('');
      } else {
        setFeedbackError('Failed to send feedback. Please check your connection and try again.');
      }
    } catch (error) {
      setFeedbackError('Unable to send feedback. Please try again later.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  useEffect(() => {
    // Check for OAuth or auth errors
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const checkAndProceedIfAuth = async () => {
      try {
        const hasAuthParam =
          typeof window !== 'undefined' &&
          (window.location.search.includes('code=') || window.location.hash.includes('access_token='));
        const timeoutMs = hasAuthParam ? 5000 : 2500;
        const isAuth = await Promise.race([
          authSession.isAuthenticated(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))
        ]);
        if (isAuth) {
          onUnlock();
        }
      } catch (err) {
        console.debug('Landing auth check:', err);
      }
    };

    checkAndProceedIfAuth();

    const unsubscribeAuth = authSession.onAuthStateChange((session) => {
      if (session) {
        onUnlock();
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [onUnlock]);

  return (
    <div className="l-root">
      {/* 1. Immersive Hero Section with 3D Particle Globe & Live Floating Badges */}
      <LandingHero onUnlock={onUnlock} />

      {/* 2. Seamless Infinite Ecosystem & Rail Marquee */}
      <EcosystemMarquee />

      {/* 3. 3-Step Value Narrative Carousel [ 01 / 03 ] with Circular Progress */}
      <ValueCarousel />

      {/* 4. Bento Grid Deep-Dive with Live Mini-Apps */}
      <BentoProductShowcase />

      {/* 5. Complete Extensible OS Modules (Sankey, Vault, EMI, Goals, Reports, AI) */}
      <AllFeaturesGrid />

      {/* 6. Asymmetrical "In Numbers" Telemetry Grid */}
      <MetricsInNumbers />

      {/* 7. FAQ Section */}
      <div className="l-section" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 className="l-section-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)' }}>
            Frequently Asked Questions
          </h2>
          <p className="l-section-subtitle" style={{ margin: '0 auto' }}>
            Everything you need to know about MyFinanceOS security, privacy, and architecture.
          </p>
        </div>

        <div
          className="l-glass-card"
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            padding: '1.25rem 2rem'
          }}
        >
          <Accordion items={FAQ_ITEMS} iconVariant="plus" />
        </div>
      </div>

      {/* 8. Help & Feedback Section */}
      <div className="l-section" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
        <div
          className="l-glass-card"
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <h3
            style={{
              fontSize: '1.35rem',
              color: '#ffffff',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              fontWeight: 700
            }}
          >
            <MessageSquare size={22} color="#a855f7" />
            Help & Direct Feedback
          </h3>
          <p style={{ color: 'var(--l-text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
            Have a question, feedback, or custom feature suggestion?
          </p>

          {feedbackSent ? (
            <div
              style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                borderRadius: '12px',
                border: '1px solid #10b981',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              ✓ Thank you! Your feedback has been securely submitted.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {feedbackError && (
                <div
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: '#fda4af',
                    border: '1px solid #f43f5e',
                    borderRadius: '8px',
                    fontSize: '0.82rem'
                  }}
                >
                  {feedbackError}
                </div>
              )}
              <textarea
                placeholder="How can we help you improve MyFinanceOS?"
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                disabled={isSendingFeedback}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  resize: 'vertical'
                }}
              />
              <button
                type="button"
                onClick={handleFeedbackSubmit}
                disabled={isSendingFeedback || !feedbackText.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isSendingFeedback || !feedbackText.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSendingFeedback || !feedbackText.trim() ? 0.6 : 1,
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
                }}
              >
                {isSendingFeedback ? 'Sending...' : 'Submit Feedback'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 9. Outro Monogram Brand Call to Action */}
      <OutroBrandCTA onUnlock={onUnlock} />

      {/* 10. Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          background: 'rgba(6, 6, 9, 0.95)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveLegalModal('privacy')}
            style={{ background: 'none', border: 'none', color: 'var(--l-text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Privacy Policy
          </button>
          <span style={{ color: 'var(--l-text-muted)' }}>•</span>
          <button
            type="button"
            onClick={() => setActiveLegalModal('terms')}
            style={{ background: 'none', border: 'none', color: 'var(--l-text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Terms of Service
          </button>
          <span style={{ color: 'var(--l-text-muted)' }}>•</span>
          <Link href="/privacy" style={{ color: 'var(--l-text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>
            Privacy Page
          </Link>
          <span style={{ color: 'var(--l-text-muted)' }}>•</span>
          <Link href="/terms" style={{ color: 'var(--l-text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>
            Terms Page
          </Link>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--l-text-muted)' }}>
          © {new Date().getFullYear()} MyFinanceOS. All rights reserved. Zero-Knowledge Financial Architecture.
        </div>
      </footer>

      {/* Interactive Smooth Glassmorphism Legal Modal */}
      {activeLegalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(6, 6, 9, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            className="l-glass-card"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#0d0d16',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Top Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.25rem', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('privacy')}
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeLegalModal === 'privacy' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                    color: '#ffffff'
                  }}
                >
                  🛡️ Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('terms')}
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeLegalModal === 'terms' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                    color: '#ffffff'
                  }}
                >
                  📜 Terms of Service
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <a
                  href={activeLegalModal === 'privacy' ? '/privacy' : '/terms'}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.8rem', color: '#c4b5fd', textDecoration: 'none', fontWeight: 600 }}
                >
                  Open Full Page ↗
                </a>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body Scroll Area */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {activeLegalModal === 'privacy' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      🛡️
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Privacy Policy & Security Guarantee</h2>
                      <p style={{ fontSize: '0.82rem', color: 'var(--l-text-muted)', margin: 0 }}>Last Updated: July 2026 • Local-First Architecture Guarantee</p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', lineHeight: 1.6, color: '#e2e8f0' }}>
                    🔒 <strong>Zero Server Storage Promise:</strong> MyFinanceOS does not run central servers that collect, store, inspect, or sell your account balances, salary details, portfolios, or tax records.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#c4b5fd' }}>1. Local-First Computing Model</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--l-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      All mathematical models, Net Worth aggregates, XIRR returns, tax slab comparisons, and Sankey money flow graphics execute locally on your machine. Your data remains strictly on your device.
                    </p>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#c4b5fd' }}>2. Zero-Knowledge Cryptographic Vault</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--l-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      When cloud sync is enabled, MyFinanceOS synchronizes only AES-256-GCM encrypted ciphertext replicas. The master encryption key is derived on your device using PBKDF2/Argon2id and is never transmitted over the network.
                    </p>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#c4b5fd' }}>3. Complete Data Portability</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--l-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      You can export your entire financial history, tax records, and double-entry ledger at any time in standard JSON, CSV, or PDF formats with zero platform lock-in.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      📜
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Terms of Service</h2>
                      <p style={{ fontSize: '0.82rem', color: 'var(--l-text-muted)', margin: 0 }}>Last Updated: July 2026 • User Data Sovereignty License</p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', lineHeight: 1.6, color: '#e2e8f0' }}>
                    👑 <strong>User Sovereignty:</strong> You own 100% of your data. MyFinanceOS is a client-side computation tool designed to help you organize and plan your financial life.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a5b4fc' }}>1. Financial & Tax Advice Disclaimer</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--l-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      MyFinanceOS is a computational software tool, NOT a certified Chartered Accountant (CA) or SEBI-registered advisor. Calculations regarding Old vs New Tax Regimes, GST billing, and FIRE milestones are for modeling purposes.
                    </p>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a5b4fc' }}>2. User Backup Responsibilities</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--l-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      Because we do not store unencrypted data or PINs on remote servers, we cannot restore lost passcodes or decrypt your vault if you forget your master PIN. Use built-in 1-click JSON exports for offline safety.
                    </p>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a5b4fc' }}>3. Software License & Warranty</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--l-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      The software is provided "AS IS" without warranties of any kind. Developers shall not be liable for direct or indirect damages resulting from software use or tax calculation variances.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
