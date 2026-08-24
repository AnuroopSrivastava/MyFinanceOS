import React from 'react';
import { Layers, ShieldCheck, Zap, Database, Download, Lock, TrendingUp, Sparkles } from 'lucide-react';

const STATS = [
  {
    icon: <Layers size={18} color="#06b6d4" />,
    value: '12+',
    label: 'Asset Classes Supported',
    sub: 'Equities, MF, Gold, NPS, EPF, FDs'
  },
  {
    icon: <Zap size={18} color="#a855f7" />,
    value: '0.0 ms',
    label: 'Server Latency (Local-First)',
    sub: 'Instant on-device IndexedDB'
  },
  {
    icon: <Lock size={18} color="#10b981" />,
    value: '100%',
    label: 'Zero-Knowledge Encryption',
    sub: 'Decrypted solely with your PIN'
  },
  {
    icon: <TrendingUp size={18} color="#f59e0b" />,
    value: '₹500 Cr+',
    label: 'Simulated Wealth Monitored',
    sub: 'Portfolio telemetry processed'
  },
  {
    icon: <ShieldCheck size={18} color="#6366f1" />,
    value: '100x',
    label: 'Faster than Manual Excel',
    sub: 'Automated rules & double-entry'
  },
  {
    icon: <Sparkles size={18} color="#ec4899" />,
    value: '100%',
    label: 'Free & Sovereign Architecture',
    sub: 'Zero paywalls, you own the vault'
  },
  {
    icon: <Download size={18} color="#34d399" />,
    value: '1-Click',
    label: 'Encrypted JSON / CSV Export',
    sub: 'Instant offline data portability'
  },
  {
    icon: <Database size={18} color="#38bdf8" />,
    value: 'AES-256',
    label: 'Military-Grade Vault Security',
    sub: 'PBKDF2 SHA-256 key derivation'
  }
];

export const MetricsInNumbers: React.FC = () => {
  return (
    <div className="l-section" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '3rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Heading */}
        <div>
          <div className="l-badge-pill">
            <Sparkles size={14} color="#c4b5fd" />
            <span>Platform Telemetry</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 4.5vw, 3.75rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#ffffff',
              marginBottom: '1rem'
            }}
          >
            In Numbers
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--l-text-secondary)', maxWidth: '380px' }}>
            Engineered for professionals, families, and businesses who refuse to compromise on mathematical accuracy and absolute privacy.
          </p>
        </div>

        {/* Right Column: 2x4 Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}
        >
          {STATS.map((s, idx) => (
            <div
              key={idx}
              className="l-glass-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--l-text-muted)' }}>
                  {s.label}
                </div>
                {s.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'clamp(1.5rem, 2.2vw, 1.85rem)',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1
                  }}
                  className="l-num"
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--l-text-secondary)', marginTop: '0.2rem' }}>
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
