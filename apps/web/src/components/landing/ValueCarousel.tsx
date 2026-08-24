import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, TrendingUp, Cpu, Lock, CheckCircle2, ChevronRight, Zap, RefreshCw } from 'lucide-react';

interface StepData {
  id: string;
  step: string;
  metric: string;
  metricLabel: string;
  title: string;
  description: string;
  bullets: string[];
  visualType: 'scale' | 'card' | 'shield';
}

const STEPS: StepData[] = [
  {
    id: 'ledger-speed',
    step: '01 / 03',
    metric: '10x',
    metricLabel: 'Faster Insights than Traditional Spreadsheets',
    title: 'Zero Leakage Double-Entry Precision',
    description:
      'Eliminate manual errors and fragmented bank statements. Automatically reconcile income, EMIs, split expenses, and investments with strict double-entry mathematical integrity.',
    bullets: [
      'Multi-account bank & credit card reconciliation',
      'Automated tag & categorization rules',
      'Split transactions with auto-balancing debits'
    ],
    visualType: 'scale'
  },
  {
    id: 'portfolio-telemetry',
    step: '02 / 03',
    metric: '100%',
    metricLabel: 'Consolidated Multi-Asset Net Worth',
    title: 'Real-Time Cross-Asset Telemetry',
    description:
      'Unify all your wealth holdings across Indian Equities, Mutual Funds, Sovereign Gold Bonds, EPF, NPS, Fixed Deposits, and US Tech stocks with live P&L and yield analytics.',
    bullets: [
      'XIRR, CAGR & annualized dividend yield tracking',
      'Asset allocation rebalancing alerts',
      'Nominee and emergency insurance audit'
    ],
    visualType: 'card'
  },
  {
    id: 'zero-latency-privacy',
    step: '03 / 03',
    metric: '0.0 ms',
    metricLabel: 'Cloud Latency • 100% On-Device Vault',
    title: 'Zero-Knowledge Client-Side Encryption',
    description:
      'Your net worth and banking history belong solely to you. Everything is encrypted on-device with AES-256-GCM. No remote server leaks, no data harvesting, no tracking pixels.',
    bullets: [
      '100% Local-first IndexedDB storage',
      'Client-side PIN & Biometric decryption',
      '1-Click offline encrypted JSON backup export'
    ],
    visualType: 'shield'
  }
];

export const ValueCarousel: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-advance timer (6 seconds per step)
  useEffect(() => {
    const duration = 6000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        elapsed = 0;
        setActiveIdx((prev) => (prev + 1) % STEPS.length);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [activeIdx]);

  const activeStep = STEPS[activeIdx];

  return (
    <div className="l-section" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="l-badge-pill">
          <Sparkles size={14} color="#c4b5fd" />
          <span>Core Engineering Principles</span>
        </div>
        <h2 className="l-section-title">Built for Speed, Mathematical Precision & Absolute Privacy</h2>
        <p className="l-section-subtitle" style={{ margin: '0 auto' }}>
          Explore the three core architectural pillars powering MyFinanceOS.
        </p>
      </div>

      {/* 2-Column Interactive Stage */}
      <div
        className="l-glass-card"
        style={{
          padding: 'clamp(1.5rem, 4vw, 3.5rem)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
          minHeight: '480px'
        }}
      >
        {/* Left Column: Narrative & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div>
            {/* Step Counter & Circular Progress Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', width: '38px', height: '38px' }}>
                <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="19"
                    cy="19"
                    r="15"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="19"
                    cy="19"
                    r="15"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeDasharray={2 * Math.PI * 15}
                    strokeDashoffset={2 * Math.PI * 15 * (1 - progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#c4b5fd'
                  }}
                >
                  {activeIdx + 1}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveIdx(idx);
                      setProgress(0);
                    }}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: activeIdx === idx ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: activeIdx === idx ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                      color: activeIdx === idx ? '#ffffff' : 'var(--l-text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {s.step}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Headline */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div
                style={{
                  fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                  fontWeight: 900,
                  lineHeight: 1.0,
                  letterSpacing: '-0.04em',
                  color: '#ffffff',
                  textShadow: '0 0 35px rgba(139, 92, 246, 0.3)'
                }}
                className="l-num"
              >
                {activeStep.metric}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#c4b5fd', marginTop: '0.35rem' }}>
                {activeStep.metricLabel}
              </div>
            </div>

            {/* Title & Description */}
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', margin: '1.25rem 0 0.65rem' }}>
              {activeStep.title}
            </h3>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--l-text-secondary)', marginBottom: '1.5rem' }}>
              {activeStep.description}
            </p>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {activeStep.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.88rem', color: '#e2e8f0' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Animated Interactive Visuals */}
        <div
          style={{
            position: 'relative',
            minHeight: '340px',
            background: 'rgba(7, 7, 12, 0.75)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            overflow: 'hidden'
          }}
        >
          {/* Visual 1: 3D Balancing Scale (Seesaw) */}
          {activeStep.visualType === 'scale' && (
            <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center', position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  height: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Seesaw Beam */}
                <div
                  style={{
                    position: 'absolute',
                    width: '280px',
                    height: '8px',
                    background: 'linear-gradient(90deg, #334155 0%, #8b5cf6 50%, #34d399 100%)',
                    borderRadius: '4px',
                    transform: 'rotate(-12deg)',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Left Weight (Heavy Manual Logs) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-20px',
                      top: '12px',
                      padding: '0.6rem 0.9rem',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      color: '#fda4af',
                      fontWeight: 700,
                      boxShadow: '0 10px 20px rgba(0,0,0,0.6)'
                    }}
                  >
                    Manual Excel ❌
                  </div>

                  {/* Right Weight (Lightweight Automated Engine) */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '-20px',
                      top: '-55px',
                      padding: '0.75rem 1.1rem',
                      background: 'rgba(139, 92, 246, 0.25)',
                      border: '1.5px solid #a855f7',
                      borderRadius: '14px',
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      fontWeight: 800,
                      boxShadow: '0 0 25px rgba(168, 85, 247, 0.5)'
                    }}
                  >
                    ⚡ Auto-Ledger ✓
                  </div>
                </div>

                {/* Glowing Fulcrum Pivot */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '25px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #a855f7 0%, #6366f1 70%, #1e1b4b 100%)',
                    boxShadow: '0 0 25px rgba(168, 85, 247, 0.8)'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--l-text-secondary)', marginTop: '0.75rem' }}>
                Mathematical double-entry balance with automated reconciliation.
              </div>
            </div>
          )}

          {/* Visual 2: Glowing Smart Card & Multi-Asset Tokens */}
          {activeStep.visualType === 'card' && (
            <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center', position: 'relative' }}>
              <div
                style={{
                  width: '100%',
                  height: '190px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1.5px solid rgba(168, 85, 247, 0.5)',
                  boxShadow: '0 0 35px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Luminous Chevron Arrow Pulse */}
                <div
                  style={{
                    position: 'absolute',
                    right: '-20px',
                    top: '25%',
                    fontSize: '4.5rem',
                    fontWeight: 900,
                    color: 'rgba(168, 85, 247, 0.2)',
                    lineHeight: 1
                  }}
                >
                  ››
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c4b5fd', letterSpacing: '0.1em' }}>
                    MYFINANCEOS VAULT
                  </div>
                  <Zap size={18} color="#34d399" />
                </div>

                {/* Floating Tokens Pill */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', zIndex: 2 }}>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '6px', fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700 }}>
                    Equities +18%
                  </span>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '0.7rem', color: '#fde68a', fontWeight: 700 }}>
                    Gold SGB
                  </span>
                  <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', borderRadius: '6px', fontSize: '0.7rem', color: '#c7d2fe', fontWeight: 700 }}>
                    Mutual Funds
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--l-text-muted)' }}>Consolidated Net Worth</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }} className="l-num">
                      ₹48,50,200
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>+14.2% YoY</div>
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--l-text-secondary)', marginTop: '0.75rem' }}>
                Unified asset valuation across 12 distinct financial classes.
              </div>
            </div>
          )}

          {/* Visual 3: Holographic Security Shield & Local Vault */}
          {activeStep.visualType === 'shield' && (
            <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center', position: 'relative' }}>
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(13, 13, 22, 0.9) 70%)',
                  border: '2px solid #a855f7',
                  boxShadow: '0 0 35px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c4b5fd'
                }}
              >
                <Lock size={52} color="#a855f7" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ padding: '0.25rem 0.65rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px', fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                  AES-256 GCM
                </span>
                <span style={{ padding: '0.25rem 0.65rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '6px', fontSize: '0.75rem', color: '#22d3ee', fontWeight: 700 }}>
                  Zero-Knowledge
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--l-text-secondary)' }}>
                Decrypted solely in browser memory via your master PIN.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
