import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LandingFeedItem } from '../primitives/index.js';

export interface LedgerCashflowShowcaseStageProps {
  balance?: string;
  usdEquivalent?: string;
  growthPct?: string;
}

const DEFAULT_TRANSACTIONS = [
  {
    icon: '₹',
    name: 'Client Retainer (UPI/NEFT)',
    meta: 'HDFC Corporate • Ref #8932',
    amount: '+₹1,85,000.00',
    color: '#10b981',
    isPositive: true
  },
  {
    icon: '₿',
    name: '0.1 BTC Stored in Local Vault',
    meta: 'Tx #0x3a9...8f • AES-256 Validated',
    amount: '+$6,420.00',
    color: '#f59e0b',
    isPositive: true
  },
  {
    icon: '₹',
    name: 'Advance Tax Q2 Payment',
    meta: 'ITD Portal • Challan 280',
    amount: '-₹45,000.00',
    color: '#ef4444',
    isPositive: false
  },
  {
    icon: '₹',
    name: 'Nifty 50 Index SIP',
    meta: 'Auto-Debit • Zerodha Coin',
    amount: '-₹25,000.00',
    color: '#06b6d4',
    isPositive: false
  }
];

export const LedgerCashflowShowcaseStage: React.FC<LedgerCashflowShowcaseStageProps> = ({
  balance = '₹34,82,450',
  usdEquivalent = '≈ $41,750 USD across 4 linked bank vaults',
  growthPct = '+4.82%'
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Consolidated Liquid Balance Box */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--l-text-muted, #94a3b8)', fontWeight: 600 }}>
            Consolidated Liquid Balance
          </div>
          <div
            style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}
            className="l-num"
          >
            {balance}
            <span style={{ fontSize: '1.2rem', color: '#06b6d4' }}>.00</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem' }}>
            {usdEquivalent}
          </div>
        </div>
        <div
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <TrendingUp size={14} /> {growthPct}
        </div>
      </div>

      {/* Transactions Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--l-text-muted, #94a3b8)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          Real-Time Verified Stream
        </div>

        {DEFAULT_TRANSACTIONS.map((tx, i) => (
          <LandingFeedItem
            key={i}
            title={tx.name}
            subtitle={tx.meta}
            amount={tx.amount}
            isPositive={tx.isPositive}
            icon={
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${tx.color}22`,
                  color: tx.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.95rem'
                }}
              >
                {tx.icon}
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
};
