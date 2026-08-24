import React from 'react';

export interface StatRowProps {
  /** Leading icon (Lucide or any React node). */
  icon?: React.ReactNode;
  /** Left-side label/title. */
  title: React.ReactNode;
  /** Optional secondary line under the title. */
  subtitle?: React.ReactNode;
  /** Right-side primary readout (tabular). */
  value: React.ReactNode;
  /** Native tooltip on the value readout. */
  valueTitle?: string;
  /** Optional change indicator (e.g. "+2.4%"); colored by sign. */
  change?: React.ReactNode;
  /** Whether change reads as positive. */
  changePositive?: boolean;
  /** Optional trailing action cluster (icon buttons, etc.). */
  actions?: React.ReactNode;
  /** Click handler makes the row interactive. */
  onClick?: () => void;
  /** Custom className. */
  className?: string;
  /** Custom styles. */
  style?: React.CSSProperties;
}

/**
 * Compact metric row: icon + title/subtitle on the left, value + change on the
 * right, seated in a faint milled well. Used for holdings, allocation rows,
 * and list readouts.
 */
export const StatRow: React.FC<StatRowProps> = ({
  icon,
  title,
  subtitle,
  value,
  valueTitle,
  change,
  changePositive = true,
  actions,
  onClick,
  className = '',
  style,
}) => {
  const interactive = typeof onClick === 'function';
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={className}
      data-interactive-card="off"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        padding: 'var(--spacing-06) var(--spacing-085)',
        background: 'var(--surface-faint)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-sm)',
        border: '1px solid var(--border-color)',
        cursor: interactive ? 'pointer' : 'default',
        transition:
          'border-color 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (interactive) e.currentTarget.style.borderColor = 'var(--border-focus)';
      }}
      onMouseLeave={(e) => {
        if (interactive) e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', minWidth: 0 }}>
        {icon && <span style={{ color: 'var(--accent-1)', flexShrink: 0, display: 'inline-flex' }}>{icon}</span>}
        <div style={{ minWidth: 0 }}>
          <div
            className="type-body"
            style={{
              fontWeight: 'var(--fw-semibold)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              className="type-caption"
              style={{ marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-06)' }}>
        {(value || change) && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-06)' }}>
            {value && (
              <span className="tabular-nums" style={{ fontWeight: 'var(--fw-semibold)' }} title={valueTitle}>
                {value}
              </span>
            )}
            {change && (
              <span
                className="type-caption"
                style={{ color: changePositive ? 'var(--success)' : 'var(--error)' }}
              >
                {change}
              </span>
            )}
          </div>
        )}
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>{actions}</div>}
      </div>
    </div>
  );
};