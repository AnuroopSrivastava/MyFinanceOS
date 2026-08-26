import React from 'react';

export interface LandingMarqueeChipProps {
  name: string;
  tag: string;
  subtext?: string;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingMarqueeChip: React.FC<LandingMarqueeChipProps> = ({
  name,
  tag,
  subtext,
  color = '#06b6d4',
  icon,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`l-marquee-chip ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.65rem 1.25rem',
        margin: '0 0.55rem',
        background: 'rgba(255, 255, 255, 0.035)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderRadius: '9999px',
        color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.8))',
        fontSize: '0.86rem',
        fontWeight: 600,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
    >
      {icon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: `color-mix(in srgb, ${color} 16%, transparent)`,
            color: color,
            border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
            boxShadow: `0 0 12px color-mix(in srgb, ${color} 25%, transparent)`,
            flexShrink: 0
          }}
        >
          {icon}
        </span>
      )}
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ color: '#ffffff', fontWeight: 700, letterSpacing: '-0.01em', fontSize: '0.88rem' }}>
          {name}
        </span>
        {subtext && (
          <span style={{ color: 'var(--l-text-muted, #94a3b8)', fontSize: '0.74rem', fontWeight: 500 }}>
            • {subtext}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: '0.68rem',
          padding: '0.18rem 0.55rem',
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          color: color,
          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          borderRadius: '9999px',
          fontWeight: 700,
          letterSpacing: '0.03em',
          textTransform: 'uppercase'
        }}
      >
        {tag}
      </span>
    </div>
  );
};
