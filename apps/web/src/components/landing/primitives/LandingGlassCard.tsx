import React from 'react';

export type LandingGlassCardVariant =
  | 'default'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'featured'
  | 'preview';

export type LandingGlassCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface LandingGlassCardProps {
  children: React.ReactNode;
  variant?: LandingGlassCardVariant;
  padding?: LandingGlassCardPadding;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
  ariaLabel?: string;
  role?: string;
}

const PADDING_MAP: Record<LandingGlassCardPadding, string> = {
  none: '0',
  sm: '0.85rem 1rem',
  md: '1.25rem 1.45rem',
  lg: 'clamp(1.75rem, 4vw, 3rem)'
};

const VARIANT_STYLES: Record<
  LandingGlassCardVariant,
  { background: string; border: string; boxShadow: string }
> = {
  default: {
    background: 'linear-gradient(150deg, rgba(14, 18, 30, 0.9) 0%, rgba(8, 10, 16, 0.96) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.65)'
  },
  cyan: {
    background: 'linear-gradient(150deg, rgba(14, 22, 36, 0.95) 0%, rgba(8, 12, 20, 0.98) 100%)',
    border: '1px solid rgba(6, 182, 212, 0.35)',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 30px rgba(6, 182, 212, 0.12)'
  },
  emerald: {
    background: 'linear-gradient(150deg, rgba(12, 24, 24, 0.95) 0%, rgba(7, 14, 16, 0.98) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 30px rgba(16, 185, 129, 0.12)'
  },
  amber: {
    background: 'linear-gradient(150deg, rgba(26, 20, 12, 0.95) 0%, rgba(14, 10, 8, 0.98) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 30px rgba(245, 158, 11, 0.12)'
  },
  featured: {
    background: 'linear-gradient(150deg, rgba(14, 18, 30, 0.95) 0%, rgba(7, 8, 13, 0.98) 100%)',
    border: '1px solid rgba(6, 182, 212, 0.28)',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.15)'
  },
  preview: {
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  }
};

export const LandingGlassCard: React.FC<LandingGlassCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ariaLabel,
  role
}) => {
  const vStyle = VARIANT_STYLES[variant];
  const padStyle = PADDING_MAP[padding];

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`l-glass-card ${className}`}
      style={{
        borderRadius: '16px',
        padding: padStyle,
        background: vStyle.background,
        border: vStyle.border,
        boxShadow: vStyle.boxShadow,
        cursor: interactive ? 'pointer' : undefined,
        transition: interactive ? 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {children}
    </div>
  );
};
