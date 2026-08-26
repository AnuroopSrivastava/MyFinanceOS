import React from 'react';

export type LandingButtonVariant = 'primary' | 'secondary' | 'glass';
export type LandingButtonSize = 'sm' | 'md' | 'lg';

export interface LandingButtonProps {
  children: React.ReactNode;
  variant?: LandingButtonVariant;
  size?: LandingButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingButton: React.FC<LandingButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  ariaLabel,
  className = '',
  style = {}
}) => {
  const variantClass = `l-btn-${variant}`;
  const sizeClass = `l-btn-${size}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`l-btn ${variantClass} ${sizeClass} ${className}`}
      style={style}
    >
      {icon && iconPosition === 'left' && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      <span>{loading ? 'Processing...' : children}</span>
      {icon && iconPosition === 'right' && !loading && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
    </button>
  );
};
