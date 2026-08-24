import React from 'react';
import { Landmark, Shield, TrendingUp, Cpu, Database, Award, CheckCircle2, Lock, Zap } from 'lucide-react';

const ECOSYSTEM_ITEMS = [
  { symbol: '₿', name: 'Bitcoin', tag: 'BTC', color: '#f59e0b' },
  { symbol: 'Ξ', name: 'Ethereum', tag: 'ETH', color: '#6366f1' },
  { symbol: '◎', name: 'Solana', tag: 'SOL', color: '#a855f7' },
  { symbol: 'Ł', name: 'Litecoin', tag: 'LTC', color: '#38bdf8' },
  { symbol: '₮', name: 'Tether USD', tag: 'USDT', color: '#10b981' },
  { symbol: '💳', name: 'Visa & Mastercard', tag: 'Cards', color: '#ec4899' },
  { symbol: '🍎', name: 'Apple Pay & Google Pay', tag: 'Wallets', color: '#ffffff' },
  { symbol: '₹', name: 'UPI 2.0 & NetBanking', tag: 'Fiat INR', color: '#34d399' },
  { symbol: '🏛️', name: 'HDFC & ICICI Bank', tag: 'Banking', color: '#06b6d4' },
  { symbol: '📈', name: 'Zerodha & Groww', tag: 'Brokerage', color: '#8b5cf6' }
];

export const EcosystemMarquee: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        padding: '2rem 0',
        background: 'linear-gradient(180deg, transparent 0%, rgba(12, 12, 18, 0.7) 50%, transparent 100%)',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Left Gradient Fade */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '140px',
          background: 'linear-gradient(to right, var(--l-bg-void) 25%, transparent 100%)',
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
          width: '140px',
          background: 'linear-gradient(to left, var(--l-bg-void) 25%, transparent 100%)',
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
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              color: 'var(--l-text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: `${item.color}22`,
                color: item.color,
                fontWeight: 900,
                fontSize: '0.85rem'
              }}
            >
              {item.symbol}
            </span>
            <span style={{ color: '#ffffff' }}>{item.name}</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.5rem',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c4b5fd',
                borderRadius: '6px',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
