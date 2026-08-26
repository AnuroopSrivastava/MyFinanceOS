import React from 'react';

export interface SlabSimulatorStageProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SlabSimulatorStage: React.FC<SlabSimulatorStageProps> = ({
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
        border: '1px solid rgba(16, 185, 129, 0.28)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
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
          SUB-SECOND SLAB SIMULATOR
        </span>
        <span style={{ fontSize: '0.75rem', color: '#67e8f9', fontWeight: 700 }}>
          0 ms Latency
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div
          style={{
            padding: '0.9rem',
            background: 'rgba(6, 182, 212, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#67e8f9', fontWeight: 700, marginBottom: '0.2rem' }}>
            NEW REGIME (115BAC)
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }} className="l-num">
            ₹1,95,000 Tax
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '0.2rem' }}>
            ✓ Optimal: ₹75,000 Saved vs Old
          </div>
        </div>

        <div
          style={{
            padding: '0.9rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--l-text-muted, #94a3b8)', fontWeight: 600, marginBottom: '0.2rem' }}>
            OLD REGIME (WITH 80C/80D)
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))' }} className="l-num">
            ₹2,70,000 Tax
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--l-text-muted, #94a3b8)', marginTop: '0.2rem' }}>
            Requires ₹2.5L Additional Deductions
          </div>
        </div>
      </div>
    </div>
  );
};
