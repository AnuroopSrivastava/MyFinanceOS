import React from 'react';
import { Sparkles } from 'lucide-react';
import { LandingBadge, LandingBadgeVariant } from './LandingBadge.js';

export interface LandingSectionHeaderProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  badgeVariant?: LandingBadgeVariant;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  align?: 'center' | 'left';
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingSectionHeader: React.FC<LandingSectionHeaderProps> = ({
  badgeText,
  badgeIcon = <Sparkles size={14} color="#67e8f9" />,
  badgeVariant = 'cyan',
  title,
  subtitle,
  align = 'center',
  maxWidth = '840px',
  className = '',
  style = {}
}) => {
  return (
    <div
      className={className}
      style={{
        textAlign: align,
        marginBottom: '3rem',
        ...style
      }}
    >
      {badgeText && (
        <LandingBadge variant={badgeVariant} icon={badgeIcon}>
          {badgeText}
        </LandingBadge>
      )}

      <h2
        className="l-section-title"
        style={{
          maxWidth: align === 'center' ? maxWidth : undefined,
          margin: align === 'center' ? '0 auto 1rem' : '0 0 1rem'
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="l-section-subtitle"
          style={{
            margin: align === 'center' ? '0 auto' : undefined
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
