import React from 'react';

export interface LandingAllocationBarProps {
  label: string;
  amount?: string;
  pct: number;
  color?: string;
  sublabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingAllocationBar: React.FC<LandingAllocationBarProps> = ({
  label,
  amount,
  pct,
  color = '#06b6d4',
  sublabel,
  className = '',
  style = {}
}) => {
  return (
    <div className={`l-allocation-item ${className}`} style={{ marginBottom: '0.65rem', ...style }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: '0.75rem',
          marginBottom: '0.25rem'
        }}
      >
        <span style={{ color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.8))', fontWeight: 600 }}>
          {label}
          {sublabel && (
            <span style={{ fontSize: '0.68rem', color: 'var(--l-text-muted, #94a3b8)', marginLeft: '0.35rem' }}>
              ({sublabel})
            </span>
          )}
        </span>
        <span style={{ color: '#ffffff', fontWeight: 800 }} className="l-num">
          {amount ? `${amount} ` : ''}({pct}%)
        </span>
      </div>

      {/* Progress track */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
            height: '100%',
            background: color,
            borderRadius: '3px',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </div>
    </div>
  );
};
