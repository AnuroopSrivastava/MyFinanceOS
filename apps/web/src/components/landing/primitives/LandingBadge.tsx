import React from 'react';

export type LandingBadgeVariant = 'cyan' | 'emerald' | 'amber' | 'muted';

export interface LandingBadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: LandingBadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export const LandingBadge: React.FC<LandingBadgeProps> = ({
  children,
  icon,
  variant = 'cyan',
  size = 'md',
  className = '',
  style = {}
}) => {
  const variantClass = `l-badge-pill-${variant}`;
  const sizeStyles: React.CSSProperties =
    size === 'sm'
      ? { padding: '0.2rem 0.65rem', fontSize: '0.68rem', gap: '0.35rem' }
      : { padding: '0.38rem 0.95rem', fontSize: '0.75rem', gap: '0.5rem' };

  return (
    <div
      className={`l-badge-pill ${variantClass} ${className}`}
      style={{
        ...sizeStyles,
        ...style
      }}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
};
