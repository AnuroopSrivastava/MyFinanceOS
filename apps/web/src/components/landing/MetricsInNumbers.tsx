import React from 'react';
import { Layers, ShieldCheck, Zap, Database, Download, Lock, TrendingUp, Sparkles, Users, ShoppingBag, CreditCard, Coins } from 'lucide-react';

const STATS = [
  {
    icon: <Coins size={18} color="#f59e0b" />,
    value: '35+',
    label: 'Cryptocurrencies Supported',
    sub: 'BTC, ETH, SOL, LTC, USDT, etc.'
  },
  {
    icon: <Zap size={18} color="#a855f7" />,
    value: '60M+',
    label: 'Crypto Payments Processed in USD',
    sub: 'Sub-second decentralized routing'
  },
  {
    icon: <CreditCard size={18} color="#06b6d4" />,
    value: '25+',
    label: 'Fiat Options Supported',
    sub: 'USD, EUR, GBP, INR, CAD, etc.'
  },
  {
    icon: <TrendingUp size={18} color="#10b981" />,
    value: '100M+',
    label: 'Total Payments Volume Processed in USD',
    sub: 'Global enterprise scale volume'
  },
  {
    icon: <Database size={18} color="#6366f1" />,
    value: '8.2M+',
    label: 'Transactions Completed',
    sub: '100% verified settlement accuracy'
  },
  {
    icon: <Users size={18} color="#ec4899" />,
    value: '3.2M+',
    label: 'Global End-Customers',
    sub: 'Seamless 1-click checkout flow'
  },
  {
    icon: <ShieldCheck size={18} color="#34d399" />,
    value: '350K+',
    label: 'Registered Vault Users',
    sub: 'Zero-knowledge client encrypted'
  },
  {
    icon: <ShoppingBag size={18} color="#38bdf8" />,
    value: '3.5K+',
    label: 'Active Merchants',
    sub: 'Stores, SaaS, and creators'
  }
];

export const MetricsInNumbers: React.FC = () => {
  return (
    <div className="l-section" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '3.5rem',
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
              fontSize: 'clamp(2.75rem, 5vw, 4.25rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              marginBottom: '1.25rem'
            }}
          >
            In Numbers
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.65, color: 'var(--l-text-secondary)', maxWidth: '380px' }}>
            Powering millions of frictionless payments, sovereign asset custody, and high-frequency settlement across the globe.
          </p>
        </div>

        {/* Right Column: 2x4 Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.1rem'
          }}
        >
          {STATS.map((s, idx) => (
            <div
              key={idx}
              className="l-glass-card"
              style={{
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '145px',
                background: 'rgba(14, 14, 22, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.07)'
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
                    fontSize: 'clamp(1.6rem, 2.4vw, 2.1rem)',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1
                  }}
                  className="l-num"
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--l-text-secondary)', marginTop: '0.25rem' }}>
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
