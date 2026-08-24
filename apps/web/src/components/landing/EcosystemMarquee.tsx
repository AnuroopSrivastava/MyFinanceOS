import React from 'react';
import { Landmark, Shield, TrendingUp, Cpu, Database, Award, CheckCircle2, Lock } from 'lucide-react';

const ECOSYSTEM_ITEMS = [
  { icon: <Landmark size={18} />, label: 'HDFC Bank Sync', category: 'Banking' },
  { icon: <TrendingUp size={18} />, label: 'Zerodha Kite', category: 'Broker' },
  { icon: <Award size={18} />, label: 'NPCI UPI 2.0', category: 'Payments' },
  { icon: <Database size={18} />, label: 'CAMS & KFintech MF', category: 'Registrar' },
  { icon: <Lock size={18} />, label: 'AES-256 Zero-Knowledge', category: 'Security' },
  { icon: <Landmark size={18} />, label: 'ICICI Direct', category: 'Banking' },
  { icon: <TrendingUp size={18} />, label: 'Groww Mutual Funds', category: 'Investments' },
  { icon: <Shield size={18} />, label: 'RBI & SEBI Aligned', category: 'Compliance' },
  { icon: <Cpu size={18} />, label: 'On-Device IndexedDB', category: 'Architecture' },
  { icon: <CheckCircle2 size={18} />, label: 'Double-Entry GAAP', category: 'Accounting' }
];

export const EcosystemMarquee: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        padding: '2.5rem 0',
        background: 'linear-gradient(180deg, transparent 0%, rgba(13, 13, 22, 0.6) 50%, transparent 100%)',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
      }}
    >
      {/* Left Gradient Fade */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '120px',
          background: 'linear-gradient(to right, var(--l-bg-void) 20%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* Right Gradient Fade */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '120px',
          background: 'linear-gradient(to left, var(--l-bg-void) 20%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* Marquee Track (Repeated twice for seamless loop) */}
      <div className="l-marquee-track">
        {[...ECOSYSTEM_ITEMS, ...ECOSYSTEM_ITEMS].map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.6rem 1.25rem',
              margin: '0 0.6rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '9999px',
              color: 'var(--l-text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ color: '#a855f7' }}>{item.icon}</span>
            <span style={{ color: '#ffffff' }}>{item.label}</span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.15rem 0.45rem',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#c4b5fd',
                borderRadius: '4px',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
