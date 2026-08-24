import React from 'react';
import { cx } from './utils/cx.js';

export type InfoCalloutVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface InfoCalloutProps {
  /** Callout content (body text or node) */
  children: React.ReactNode;
  /** Optional lead-in rendered bold before the body */
  title?: React.ReactNode;
  /** Semantic variant — drives tint, border, and icon color */
  variant?: InfoCalloutVariant;
  /** Leading icon (defaults to a semantic glyph per variant) */
  icon?: React.ReactNode;
  /** Optional action rendered at the trailing edge */
  action?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

const variantStyles: Record<InfoCalloutVariant, { background: string; border: string; color: string }> = {
  info: { background: 'var(--info-bg)', border: '1px solid var(--info)', color: 'var(--info)' },
  success: { background: 'var(--success-bg)', border: '1px solid var(--success)', color: 'var(--success)' },
  warning: { background: 'var(--warning-bg)', border: '1px solid var(--warning)', color: 'var(--warning)' },
  error: { background: 'var(--error-bg)', border: '1px solid var(--error)', color: 'var(--error)' },
  neutral: { background: 'var(--surface-tint)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' },
};

const defaultGlyphs: Record<InfoCalloutVariant, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '✕',
  neutral: '•',
};

/**
 * InfoCallout — tinted insight/alert banner used for summaries, warnings,
 * and result notes inside panels. Token-native; prefers the semantic
 * --*-bg/--* triplets so light and dark themes stay consistent.
 */
export const InfoCallout: React.FC<InfoCalloutProps> = ({
  children,
  title,
  variant = 'info',
  icon,
  action,
  className = '',
  style,
}) => {
  const v = variantStyles[variant];
  return (
    <div
      className={cx('info-callout', className)}
      data-interactive-card="off"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-06)',
        padding: 'var(--spacing-06) var(--spacing-08)',
        borderRadius: 'var(--radius-sm)',
        background: v.background,
        border: v.border,
        color: 'var(--text-primary)',
        lineHeight: 'var(--lh-normal)',
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          color: v.color,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.15rem',
          height: '1.15rem',
          marginTop: '0.05rem',
          borderRadius: 'var(--radius-xs)',
          background: 'color-mix(in srgb, currentColor 12%, transparent)',
          fontSize: 'var(--font-xs)',
          fontWeight: 'var(--fw-bold)',
        }}
      >
        {icon || defaultGlyphs[variant]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <strong style={{ display: 'block', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--spacing-02)' }}>
            {title}
          </strong>
        )}
        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{children}</div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
};