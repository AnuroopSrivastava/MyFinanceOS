import React from 'react';
import { LandingBadge, LandingBadgeVariant } from './LandingBadge.js';

export type LandingCapabilityCardVariant = 'featured' | 'compact';

export interface LandingCapabilityCardProps {
  variant?: LandingCapabilityCardVariant;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  iconBorder?: string;
  badgeText?: string;
  badgeVariant?: LandingBadgeVariant;
  tag?: string;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingCapabilityCard: React.FC<LandingCapabilityCardProps> = ({
  variant = 'compact',
  icon,
  iconColor = '#06b6d4',
  iconBg = 'rgba(6, 182, 212, 0.15)',
  iconBorder = 'rgba(6, 182, 212, 0.35)',
  badgeText,
  badgeVariant = 'cyan',
  tag,
  title,
  description,
  children,
  className = '',
  style = {}
}) => {
  const isFeatured = variant === 'featured';

  return (
    <div
      className={`l-capability-card ${isFeatured ? 'l-capability-card-featured' : 'l-capability-card-compact'} ${className}`}
      style={style}
    >
      <div>
        {/* Header Row: Icon + Badge / Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isFeatured ? '1.15rem' : '1rem'
          }}
        >
          <div
            style={{
              width: isFeatured ? '44px' : '38px',
              height: isFeatured ? '44px' : '38px',
              borderRadius: isFeatured ? '12px' : '10px',
              background: iconBg,
              border: `1px solid ${iconBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor,
              boxShadow: isFeatured ? `0 0 20px ${iconBg}` : undefined
            }}
          >
            {icon}
          </div>

          {badgeText && (
            <LandingBadge variant={badgeVariant} size="sm">
              {badgeText}
            </LandingBadge>
          )}

          {tag && !badgeText && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--l-text-muted, #94a3b8)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              {tag}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
            fontSize: isFeatured ? '1.35rem' : '1.12rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: isFeatured ? '0.6rem' : '0.4rem',
            letterSpacing: isFeatured ? '-0.015em' : '-0.01em'
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: isFeatured ? '0.9rem' : '0.84rem',
            lineHeight: isFeatured ? 1.6 : 1.55,
            color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))',
            margin: 0
          }}
        >
          {description}
        </p>
      </div>

      {/* Optional Children / Preview Area */}
      {children}
    </div>
  );
};
