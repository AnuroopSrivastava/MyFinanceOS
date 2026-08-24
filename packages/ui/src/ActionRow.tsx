import React from 'react';
import { Button, ButtonProps } from './Button.js';

export interface ActionRowProps {
  /** Left side content - typically title and description */
  title: string;
  /** Optional description under title */
  description?: React.ReactNode;
  /** Right side action - typically a Button */
  action: React.ReactNode;
  /** Optional leading icon for title */
  icon?: React.ReactNode;
  /** Optional badge/chip rendered beside the title. */
  badge?: React.ReactNode;
  /** Allow the description to wrap (default truncates with ellipsis). */
  wrapDescription?: boolean;
  /** Variant */
  variant?: 'default' | 'bordered' | 'filled';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  title,
  description,
  action,
  icon,
  badge,
  wrapDescription = false,
  variant = 'bordered',
  className = '',
  style,
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { padding: 'var(--spacing-085) var(--spacing-1)', background: 'transparent', border: 'none' },
    bordered: {
      padding: 'var(--spacing-085) var(--spacing-1)',
      background: 'var(--bg-secondary)',
      backgroundImage: 'var(--neo-convex-grad)',
      border: '1px solid var(--border-color)',
      borderTop: 'var(--neo-bevel-top)',
      borderBottom: 'var(--neo-bevel-bottom)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--neo-raised-sm)',
    },
    filled: {
      padding: 'var(--spacing-085) var(--spacing-1)',
      background: 'var(--bg-panel)',
      backgroundImage: 'var(--neo-convex-grad)',
      border: '1px solid var(--border-color)',
      borderTop: 'var(--neo-bevel-top)',
      borderBottom: 'var(--neo-bevel-bottom)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--neo-raised-sm)',
      backdropFilter: 'var(--backdrop-blur)',
    },
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 'var(--spacing-1)',
        ...variantStyles[variant],
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', minWidth: 0, flex: 1 }}>
        {icon && <span style={{ color: 'var(--accent-1)', flexShrink: 0 }}>{icon}</span>}
        <div style={{ minWidth: 0 }}>
          <div className="type-body" style={{
            fontWeight: 'var(--fw-semibold)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
            {badge && <span style={{ marginLeft: 'var(--spacing-04)', display: 'inline-flex', verticalAlign: 'middle' }}>{badge}</span>}
          </div>
          {description && (
            <div className="type-caption" style={{ marginTop: 'var(--spacing-02)', whiteSpace: wrapDescription ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {action}
      </div>
    </div>
  );
};

export interface ActionRowGroupProps {
  /** Array of action rows */
  rows: (Omit<ActionRowProps, 'action'> & { action: React.ReactNode })[];
  /** Group title */
  title?: string;
  /** Group description */
  description?: string;
  /** Divider between rows */
  divided?: boolean;
  /** Custom className */
  className?: string;
}

export const ActionRowGroup: React.FC<ActionRowGroupProps> = ({
  rows,
  title,
  description,
  divided = true,
  className = '',
}) => (
  <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: divided ? 0 : undefined }}>
    {(title || description) && (
      <div style={{ marginBottom: '1.1rem' }}>
        {title && (
          <div className="type-label-upper" style={{ marginBottom: description ? '0.25rem' : 0 }}>
            {title}
          </div>
        )}
        {description && (
          <div className="type-caption">{description}</div>
        )}
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: divided ? '0.85rem' : 0 }}>
      {rows.map((row, i) => (
        <ActionRow
          key={i}
          title={row.title}
          description={row.description}
          icon={row.icon}
          action={row.action}
          variant={row.variant}
          style={divided ? {} : { borderBottom: i < rows.length - 1 ? '1px solid var(--border-color)' : 'none', borderRadius: 0 }}
        />
      ))}
    </div>
  </div>
);