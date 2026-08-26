import React from 'react';

export interface LandingSpecPillProps {
  icon?: React.ReactNode;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingSpecPill: React.FC<LandingSpecPillProps> = ({
  icon,
  title,
  subtitle,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`l-spec-pill ${className}`}
      style={{
        padding: '0.6rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {icon && <div style={{ marginBottom: '0.3rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>}
      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: '0.65rem', color: 'var(--l-text-muted, #94a3b8)', marginTop: '0.1rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
