import React from 'react';
import { LandingFeedItem } from '../primitives/index.js';

export interface DirectLocalRoutingStageProps {
  className?: string;
  style?: React.CSSProperties;
}

export const DirectLocalRoutingStage: React.FC<DirectLocalRoutingStageProps> = ({
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`l-value-stage-card ${className}`}
      style={{
        width: '100%',
        maxWidth: '380px',
        padding: '1.75rem',
        borderRadius: '20px',
        background: 'rgba(18, 22, 36, 0.85)',
        border: '1px solid rgba(6, 182, 212, 0.28)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.15)',
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem'
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#34d399',
            letterSpacing: '0.04em'
          }}
        >
          DIRECT LOCAL ROUTING
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--l-text-muted, #94a3b8)' }}>
          0% Plaintext Custody
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <LandingFeedItem
          title="UPI 2.0 Inward Settled"
          amount="+₹1,85,000"
          isPositive={true}
          dotColor="#34d399"
        />
        <LandingFeedItem
          title="Direct Mutual Fund SIP"
          amount="-₹25,000"
          isPositive={false}
          dotColor="#06b6d4"
        />
        <LandingFeedItem
          title="Sovereign Gold Bonds"
          amount="+₹50,000"
          isPositive={true}
          dotColor="#f59e0b"
        />
      </div>
    </div>
  );
};
