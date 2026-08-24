import React from 'react';
import { playTactileClick } from './utils/haptics.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /**
   * Visual variant mapping to the global `.btn-*` classes.
   * When omitted, `className` is passed through untouched, so legacy callers
   * passing `className="btn btn-primary"` keep working unchanged.
   */
  variant?: ButtonVariant;
  /** Scales the button via the `.btn-sm` / `.btn-lg` utilities. */
  size?: ButtonSize;
  /** Full-width block button (`.btn-block`). */
  block?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  disabled = false,
  onClick,
  onPointerDown,
  variant,
  size,
  block,
  className = '',
  style,
  ...props
}) => {
  const classes = [
    variant ? `btn btn-${variant}` : '',
    variant && size ? `btn-${size}` : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const bare = !variant && !/\bbtn\b/.test(className);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playTactileClick(variant === 'danger' ? 'firm' : 'soft');
    }
    onClick?.(e);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      className={classes}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...(bare ? { border: 'none' } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

