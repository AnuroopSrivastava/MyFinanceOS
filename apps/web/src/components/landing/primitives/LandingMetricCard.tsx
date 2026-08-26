import React from 'react';

export type LandingMetricCardVariant = 'default' | 'cyan' | 'emerald' | 'amber';

export interface LandingMetricCardProps {
  label: string;
  value: string;
  sub?: string | React.ReactNode;
  icon?: React.ReactNode;
  variant?: LandingMetricCardVariant;
  highlight?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingMetricCard: React.FC<LandingMetricCardProps> = ({
  label,
  value,
  sub,
  icon,
  variant = 'default',
  highlight = false,
  className = '',
  style = {}
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'cyan':
        return {
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          labelColor: '#67e8f9',
          valueColor: '#ffffff'
        };
      case 'emerald':
        return {
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          labelColor: '#34d399',
          valueColor: '#34d399'
        };
      case 'amber':
        return {
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          labelColor: '#fbbf24',
          valueColor: '#fbbf24'
        };
      default:
        return {
          background: 'linear-gradient(150deg, rgba(15, 20, 32, 0.88) 0%, rgba(8, 10, 16, 0.96) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          labelColor: 'var(--l-text-muted, #94a3b8)',
          valueColor: '#ffffff'
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div
      className={`l-glass-card ${className}`}
      style={{
        padding: '1.25rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '136px',
        background: vStyles.background,
        border: vStyles.border,
        boxShadow: highlight
          ? '0 16px 45px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.2)'
          : '0 12px 35px rgba(0, 0, 0, 0.65)',
        ...style
      }}
    >
      {/* Top Header Row with Icon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.65rem'
        }}
      >
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: vStyles.labelColor,
            letterSpacing: '0.01em'
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Main KPI Readout */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
            fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
            fontWeight: 900,
            color: vStyles.valueColor,
            letterSpacing: '-0.03em',
            lineHeight: 1.1
          }}
          className="l-num"
        >
          {value}
        </div>
        {sub && (
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))',
              marginTop: '0.3rem',
              lineHeight: 1.4
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};
