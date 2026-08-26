import React from 'react';

export interface LandingFeedItemProps {
  title: string;
  amount?: string;
  isPositive?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  time?: string;
  badge?: string | React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const LandingFeedItem: React.FC<LandingFeedItemProps> = ({
  title,
  amount,
  isPositive,
  dotColor = '#10b981',
  icon,
  subtitle,
  time,
  badge,
  className = '',
  style = {},
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`l-feed-item ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      {/* Left side: Icon or Dot indicator + Title and Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {icon ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        ) : (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: dotColor,
              boxShadow: `0 0 8px ${dotColor}`,
              flexShrink: 0
            }}
          />
        )}

        <div>
          <div
            style={{
              fontSize: '0.86rem',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.25
            }}
          >
            {title}
          </div>
          {(subtitle || time) && (
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--l-text-muted, #94a3b8)',
                marginTop: '0.15rem'
              }}
            >
              {subtitle} {time && `• ${time}`}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Amount and/or Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'right' }}>
        {amount && (
          <span
            className="l-num"
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color:
                isPositive === true
                  ? '#34d399'
                  : isPositive === false
                  ? '#f87171'
                  : '#ffffff'
            }}
          >
            {amount}
          </span>
        )}

        {badge && (
          typeof badge === 'string' ? (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.8))',
                fontWeight: 600
              }}
            >
              {badge}
            </span>
          ) : (
            badge
          )
        )}
      </div>
    </div>
  );
};
