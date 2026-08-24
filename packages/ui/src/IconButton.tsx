import React, { isValidElement, cloneElement } from 'react';
import { playTactileClick } from './utils/haptics.js';

export type IconButtonVariant = 'ghost' | 'danger' | 'accent';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon node (Lucide or any React node). */
  icon: React.ReactNode;
  /** Accessible name for the icon-only control. */
  label: string;
  /** Visual variant: ghost (neutral well), danger (destructive), accent (accent-tinted). */
  variant?: IconButtonVariant;
  /** Size: sm = 28px compact rows, md = 36px touch target. */
  size?: IconButtonSize;
}

const variantStyles: Record<IconButtonVariant, React.CSSProperties> = {
  ghost: {
    background: 'var(--bg-panel)',
    backgroundImage: 'var(--neo-convex-grad)',
    border: '1px solid var(--border-color)',
    borderTop: 'var(--neo-bevel-top)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--neo-raised-sm)',
  },
  danger: {
    background: 'var(--error-bg)',
    backgroundImage: 'var(--neo-convex-grad)',
    border: '1px solid color-mix(in srgb, var(--error) 40%, transparent)',
    borderTop: '1px solid color-mix(in srgb, var(--error) 60%, transparent)',
    color: 'var(--error)',
    boxShadow: 'var(--neo-raised-sm)',
  },
  accent: {
    background: 'var(--accent-soft)',
    backgroundImage: 'var(--neo-convex-grad)',
    border: '1px solid var(--border-focus)',
    borderTop: 'var(--neo-bevel-top)',
    color: 'var(--accent-1)',
    boxShadow: 'var(--neo-raised-sm)',
  },
};

const sizeStyles: Record<IconButtonSize, React.CSSProperties> = {
  sm: { width: '28px', height: '28px', minWidth: '28px', minHeight: '28px', padding: 0 },
  md: { width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', padding: 0 },
};

/**
 * The repeated debossed icon-only control (edit/delete/toggle rows):
 * compact square well, tactile press-in, haptic feedback.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  style,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled) {
      playTactileClick(variant === 'danger' ? 'firm' : 'soft');
    }
    onClick?.(e);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    props.onPointerDown?.(e);
  };

  const buttonColor = variantStyles[variant]?.color || 'var(--text-primary)';

  const iconWithColor = isValidElement(icon)
    ? cloneElement(icon as React.ReactElement<{ color?: string; size?: number }>, {
        color: (icon.props as { color?: string }).color || buttonColor,
        size: (icon.props as { size?: number }).size || (size === 'sm' ? 14 : 18),
      })
    : icon;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      className={`icon-btn ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        flexShrink: 0,
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        lineHeight: 1,
        boxSizing: 'border-box',
        transition:
          'transform 0.1s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {iconWithColor}
    </button>
  );
};