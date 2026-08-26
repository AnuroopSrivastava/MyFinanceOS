import React from 'react';

export interface LandingFloatingBadgeProps {
  title: string;
  amount: string;
  sub?: string;
  time?: string;
  icon: string | React.ReactNode;
  iconBg?: string;
  isHighlighted?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
}

export const LandingFloatingBadge: React.FC<LandingFloatingBadgeProps> = ({
  title,
  amount,
  sub,
  time,
  icon,
  iconBg = '#06b6d4',
  isHighlighted = false,
  onClick,
  onMouseEnter,
  style = {},
  className = '',
  ariaLabel
}) => {
  return (
    <button
      type="button"
      className={`l-floating-badge ${className}`}
      aria-label={ariaLabel || `${title}: ${amount}${sub ? `, ${sub}` : ''}${time ? `, ${time}` : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        padding: '0.85rem 1.35rem',
        background: isHighlighted ? 'rgba(18, 24, 38, 0.96)' : 'rgba(12, 15, 24, 0.9)',
        border: isHighlighted
          ? `1px solid ${iconBg}`
          : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '18px',
        boxShadow: isHighlighted
          ? `0 20px 45px rgba(0,0,0,0.88), 0 0 35px ${iconBg}44, inset 0 1px 0 rgba(255,255,255,0.2)`
          : '0 15px 35px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        ...style
      }}
    >
      {/* Icon Capsule */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: `${iconBg}22`,
          border: `1px solid ${iconBg}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconBg,
          fontWeight: 900,
          fontSize: '1.2rem',
          boxShadow: `0 0 18px ${iconBg}33`,
          flexShrink: 0
        }}
      >
        {icon}
      </div>

      {/* Info Rows */}
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
          <span
            style={{
              fontSize: '0.85rem',
              color: isHighlighted ? '#ffffff' : '#67e8f9',
              fontWeight: 700
            }}
            className="l-num"
          >
            {amount}
          </span>
          {time && (
            <span style={{ fontSize: '0.72rem', color: 'var(--l-text-muted, #94a3b8)' }}>
              • {time}
            </span>
          )}
        </div>
        {sub && (
          <div style={{ fontSize: '0.72rem', color: 'var(--l-text-muted, #94a3b8)', marginTop: '0.15rem' }}>
            {sub}
          </div>
        )}
      </div>
    </button>
  );
};
