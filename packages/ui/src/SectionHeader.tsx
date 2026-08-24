import React from 'react';

export interface SectionHeaderProps {
  /** Main section title */
  title: string | React.ReactNode;
  /** Optional subtitle/description */
  description?: string | React.ReactNode;
  /** Leading icon */
  icon?: React.ReactNode;
  /** Trailing action (button, link, etc.) */
  action?: React.ReactNode;
  /** Badge/tag next to title */
  badge?: React.ReactNode;
  /** Visual variant */
  variant?: 'default' | 'banner' | 'minimal';
  /** Heading HTML tag */
  tag?: 'h1' | 'h2' | 'h3' | 'h4';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  action,
  badge,
  variant = 'default',
  tag,
  className = '',
  style,
}) => {
  const baseStyles: Record<string, React.CSSProperties> = {
    default: { marginBottom: '1.5rem' },
    banner: {
      padding: 'var(--spacing-25) var(--spacing-30)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--header-banner-grad)',
      border: 'var(--neo-milled-border)',
      borderTop: 'var(--neo-bevel-top)',
      borderBottom: 'var(--neo-bevel-bottom)',
      boxShadow: 'var(--neo-raised-lg), var(--shadow-banner)',
      marginBottom: 'var(--spacing-15)',
    },
    minimal: { marginBottom: '1rem' },
  };

  const HeadingTag = tag || (variant === 'banner' ? 'h1' : 'h2');
  const resolvedClassName = variant === 'banner'
    ? `glass-panel ${className}`.trim()
    : className;

  return (
    <div
      className={resolvedClassName}
      data-interactive-card="off"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        ...baseStyles[variant],
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', flex: '1 1 min-content', minWidth: '280px' }}>
        {icon && (
          <div style={{
            width: variant === 'banner' ? '44px' : '40px',
            height: variant === 'banner' ? '44px' : '40px',
            borderRadius: 'var(--radius-tooltip)',
            background: 'var(--accent-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px var(--accent-soft)',
            flexShrink: 0,
            marginTop: variant === 'banner' ? '0.2rem' : 0,
          }}>
            {React.isValidElement(icon) ? React.cloneElement(icon, {
              size: variant === 'banner' ? 22 : 20,
              color: 'var(--text-on-action)',
            } as Record<string, unknown>) : icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <HeadingTag style={{
            fontSize: variant === 'banner' ? 'var(--font-3xl, 1.85rem)' : 'var(--font-xl, 1.25rem)',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 'var(--lh-snug, 1.2)',
            letterSpacing: 'var(--ls-tight, -0.02em)',
            display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
          }}>
            {title}
            {badge && (
              <span className="type-badge" style={{
                background: 'var(--surface-tint-strong, rgba(255,255,255,0.06))',
                padding: 'var(--spacing-02) var(--spacing-06)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-muted)',
                fontSize: 'var(--font-2xs)',
                fontWeight: 'var(--fw-semibold)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-025)',
              }}>
                {badge}
              </span>
            )}
          </HeadingTag>
          {description && (
            typeof description === 'string' ? (
              <p className="type-body-sm" style={{
                marginTop: variant === 'banner' ? '0.35rem' : '0.2rem', marginBottom: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                lineHeight: 1.45,
                maxWidth: '65ch'
              }}>
                {description}
              </p>
            ) : (
              <div className="type-body-sm" style={{
                marginTop: variant === 'banner' ? '0.35rem' : '0.2rem', marginBottom: 0,
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                lineHeight: 1.45,
              }}>
                {description}
              </div>
            )
          )}
        </div>
      </div>
      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
};
