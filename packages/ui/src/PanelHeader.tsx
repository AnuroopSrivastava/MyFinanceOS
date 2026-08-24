import React from 'react';
import { cx } from './utils/cx.js';

export interface PanelHeaderProps {
  /** Panel title */
  title: React.ReactNode;
  /** Optional leading icon (rendered at panel scale) */
  icon?: React.ReactNode;
  /** Optional subtitle under the title */
  subtitle?: React.ReactNode;
  /** Trailing action (button, badge, etc.) */
  action?: React.ReactNode;
  /** Heading HTML tag */
  tag?: 'h2' | 'h3' | 'h4';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * PanelHeader — the title row for in-card panels.
 * Lighter than SectionHeader: a compact icon, a display title, an optional
 * subtitle, and an optional right-aligned action slot. Token-native.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon,
  subtitle,
  action,
  tag = 'h3',
  className = '',
  style,
}) => {
  const HeadingTag = tag;
  return (
    <div
      className={cx('row-between', className)}
      data-interactive-card="off"
      style={{ marginBottom: 'var(--spacing-075)', ...style }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)', minWidth: 0 }}>
        {icon && (
          <span style={{ color: 'var(--accent-1)', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <HeadingTag
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: 'var(--ls-tight)',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 'var(--lh-snug)',
            }}
          >
            {title}
          </HeadingTag>
          {subtitle && (
            <div className="type-caption" style={{ marginTop: 'var(--spacing-02)' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {action && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
          {action}
        </div>
      )}
    </div>
  );
};