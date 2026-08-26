import React from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  TrendingUp,
  Database,
  CreditCard,
  Layers,
  Cpu,
  Sparkles
} from 'lucide-react';
import { LandingBadge, LandingMetricCard } from './primitives/index.js';

interface StatMetric {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub: string;
  glowColor: string;
}

const STATS: StatMetric[] = [
  {
    icon: <ShieldCheck size={18} color="#10b981" />,
    value: '100%',
    label: 'Zero-Knowledge Privacy',
    sub: '100% client-side execution • Zero plaintext custody',
    glowColor: 'rgba(16, 185, 129, 0.25)'
  },
  {
    icon: <Lock size={18} color="#06b6d4" />,
    value: 'AES-256',
    label: 'Authenticated Encryption',
    sub: 'Hardware-accelerated GCM ciphers • 96-bit unique IVs',
    glowColor: 'rgba(6, 182, 212, 0.25)'
  },
  {
    icon: <Key size={18} color="#14b8a6" />,
    value: '100k',
    label: 'PBKDF2 & Argon2id Rounds',
    sub: 'Salted cryptographic master key derivation',
    glowColor: 'rgba(20, 184, 166, 0.25)'
  },
  {
    icon: <TrendingUp size={18} color="#10b981" />,
    value: '199+',
    label: 'Automated Test Suites',
    sub: 'Tax slabs, double-entry math & crypto invariants',
    glowColor: 'rgba(16, 185, 129, 0.25)'
  },
  {
    icon: <Database size={18} color="#06b6d4" />,
    value: '0 ms',
    label: 'Local Database Latency',
    sub: 'Sub-second IndexedDB engine & offline-first cache',
    glowColor: 'rgba(6, 182, 212, 0.25)'
  },
  {
    icon: <CreditCard size={18} color="#f59e0b" />,
    value: '₹0',
    label: 'Vendor Lock-in or Ads',
    sub: '100% user data ownership • 1-click JSON/CSV export',
    glowColor: 'rgba(245, 158, 11, 0.25)'
  },
  {
    icon: <Layers size={18} color="#38bdf8" />,
    value: '5',
    label: 'Studio Theme Engines',
    sub: 'Glass Cyan, Emerald, Gold, Obsidian Dark & Light',
    glowColor: 'rgba(56, 189, 248, 0.25)'
  },
  {
    icon: <Cpu size={18} color="#eab308" />,
    value: '60 FPS',
    label: 'Hardware Accelerated UI',
    sub: 'GPU-accelerated CSS transforms & 3D canvas',
    glowColor: 'rgba(234, 179, 8, 0.25)'
  }
];

export const MetricsInNumbers: React.FC = () => {
  return (
    <div className="l-section" style={{ paddingTop: '3rem', paddingBottom: '4.5rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 2fr)',
          gap: 'clamp(2rem, 4vw, 4rem)',
          alignItems: 'center'
        }}
      >
        {/* Left Column: Heading & Mission Telemetry Statement */}
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
              fontSize: 'clamp(2.5rem, 4.5vw, 3.8rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#ffffff',
              marginBottom: '1.25rem'
            }}
          >
            Platform telemetry in numbers
          </h2>
          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.4vw, 1.12rem)',
              lineHeight: 1.65,
              color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.84))',
              maxWidth: '380px',
              margin: 0
            }}
          >
            Cryptographically verified, local-first computing power engineered for the Indian wealth and tax ecosystem.
          </p>
        </div>

        {/* Right Column: 2x4 Asymmetrical Telemetry Card Matrix */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}
        >
          {STATS.map((s, idx) => (
            <LandingMetricCard
              key={idx}
              label={s.label}
              value={s.value}
              sub={s.sub}
              icon={s.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

