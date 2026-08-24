import React from 'react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  /** Main icon */
  icon?: React.ReactNode;
  /** Optional badge */
  badge?: React.ReactNode;
  /** Title text or node */
  title: string | React.ReactNode;
  /** Description text or node */
  description?: string | React.ReactNode;
  /** Primary action */
  action?: React.ReactNode;
  /** Secondary action */
  secondaryAction?: React.ReactNode;
  /** Illustration variant */
  variant?: 'default' | 'illustrated' | 'minimal' | 'dashed';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

const sizeStyles = {
  sm: { padding: '1.5rem', iconSize: 36, titleSize: '1rem', descSize: '0.85rem' },
  md: { padding: '2.5rem 2rem', iconSize: 52, titleSize: '1.15rem', descSize: '0.9rem' },
  lg: { padding: '4rem 3rem', iconSize: 72, titleSize: '1.35rem', descSize: '0.95rem' },
};

const defaultIcons = {
  default: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 15h4" />
    </svg>
  ),
  illustrated: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  badge,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  size = 'md',
  className = '',
  style,
}) => {
  const s = sizeStyles[size];
  const hasIcon = Boolean(icon || defaultIcons[variant as keyof typeof defaultIcons]);
  const isDashed = variant === 'dashed';

  return (
    <motion.div
      className={`glass-panel ${className}`.trim()}
      data-interactive-card="off"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: isDashed ? '2rem 1.25rem' : s.padding,
        borderRadius: isDashed ? 'var(--radius-md)' : 'var(--radius-lg)',
        backgroundImage: isDashed ? 'none' : 'var(--neo-convex-grad)',
        background: isDashed ? 'var(--surface-faint)' : undefined,
        boxShadow: isDashed ? 'none' : 'var(--neo-raised-sm)',
        border: isDashed ? '1px dashed var(--border-focus)' : '1px solid var(--border-color)',
        ...style,
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {badge && (
        <div style={{ marginBottom: '1rem' }}>
          {badge}
        </div>
      )}

      {hasIcon && variant !== 'minimal' && (
        <div
          style={{
            width: s.iconSize,
            height: s.iconSize,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--neo-inset-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            color: 'var(--accent-1)',
            flexShrink: 0,
          }}
        >
          {icon || defaultIcons[variant as keyof typeof defaultIcons]}
        </div>
      )}

      <h3
        style={{
          fontSize: s.titleSize,
          fontWeight: 650,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
          margin: '0 0 0.5rem 0',
          letterSpacing: 'var(--ls-tight)',
          lineHeight: 'var(--lh-snug)',
          textWrap: 'balance',
        }}
      >
        {title}
      </h3>

      {description && (
        <div
          className="type-body-sm"
          style={{
            margin: 0,
            maxWidth: '55ch',
            lineHeight: 'var(--lh-normal)',
            color: 'var(--text-secondary)',
          }}
        >
          {description}
        </div>
      )}

      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {secondaryAction && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{secondaryAction}</span>
          )}
          {action && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{action}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};