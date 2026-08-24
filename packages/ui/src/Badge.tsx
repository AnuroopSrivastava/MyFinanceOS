import React from 'react';

export type BadgeVariant =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'neutral'
  | 'primary'
  | 'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Optional trailing icon */
  trailingIcon?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, { background: string; color: string; borderColor: string }> = {
  indigo: {
    background: 'var(--badge-indigo-bg, rgba(99, 102, 241, 0.18))',
    color: 'var(--badge-indigo-text, #c7d2fe)',
    borderColor: 'var(--badge-indigo-border, rgba(99, 102, 241, 0.4))',
  },
  emerald: {
    background: 'var(--badge-emerald-bg, rgba(16, 185, 129, 0.18))',
    color: 'var(--badge-emerald-text, #a7f3d0)',
    borderColor: 'var(--badge-emerald-border, rgba(16, 185, 129, 0.4))',
  },
  success: {
    background: 'var(--badge-emerald-bg, rgba(16, 185, 129, 0.18))',
    color: 'var(--badge-emerald-text, #a7f3d0)',
    borderColor: 'var(--badge-emerald-border, rgba(16, 185, 129, 0.4))',
  },
  amber: {
    background: 'var(--badge-amber-bg, rgba(245, 158, 11, 0.18))',
    color: 'var(--badge-amber-text, #fde68a)',
    borderColor: 'var(--badge-amber-border, rgba(245, 158, 11, 0.4))',
  },
  warning: {
    background: 'var(--badge-amber-bg, rgba(245, 158, 11, 0.18))',
    color: 'var(--badge-amber-text, #fde68a)',
    borderColor: 'var(--badge-amber-border, rgba(245, 158, 11, 0.4))',
  },
  rose: {
    background: 'var(--badge-rose-bg, rgba(244, 63, 94, 0.18))',
    color: 'var(--badge-rose-text, #fecdd3)',
    borderColor: 'var(--badge-rose-border, rgba(244, 63, 94, 0.4))',
  },
  error: {
    background: 'var(--badge-rose-bg, rgba(244, 63, 94, 0.18))',
    color: 'var(--badge-rose-text, #fecdd3)',
    borderColor: 'var(--badge-rose-border, rgba(244, 63, 94, 0.4))',
  },
  danger: {
    background: 'var(--badge-rose-bg, rgba(244, 63, 94, 0.18))',
    color: 'var(--badge-rose-text, #fecdd3)',
    borderColor: 'var(--badge-rose-border, rgba(244, 63, 94, 0.4))',
  },
  cyan: {
    background: 'var(--badge-cyan-bg, rgba(6, 182, 212, 0.18))',
    color: 'var(--badge-cyan-text, #a5f3fc)',
    borderColor: 'var(--badge-cyan-border, rgba(6, 182, 212, 0.4))',
  },
  primary: {
    background: 'var(--badge-cyan-bg, rgba(6, 182, 212, 0.18))',
    color: 'var(--badge-cyan-text, #a5f3fc)',
    borderColor: 'var(--badge-cyan-border, rgba(6, 182, 212, 0.4))',
  },
  info: {
    background: 'var(--badge-cyan-bg, rgba(6, 182, 212, 0.18))',
    color: 'var(--badge-cyan-text, #a5f3fc)',
    borderColor: 'var(--badge-cyan-border, rgba(6, 182, 212, 0.4))',
  },
  neutral: {
    background: 'var(--badge-default-bg, rgba(255, 255, 255, 0.08))',
    color: 'var(--badge-default-text, var(--text-secondary))',
    borderColor: 'var(--badge-default-border, var(--border-color))',
  },
  default: {
    background: 'var(--badge-default-bg, rgba(255, 255, 255, 0.08))',
    color: 'var(--badge-default-text, var(--text-secondary))',
    borderColor: 'var(--badge-default-border, var(--border-color))',
  },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { padding: '0.15rem var(--spacing-05)', fontSize: 'var(--font-2xs)', gap: 'var(--spacing-025)' },
  md: { padding: 'var(--spacing-025) 0.65rem', fontSize: 'var(--font-xs)', gap: '0.35rem' },
  lg: { padding: '0.35rem var(--spacing-085)', fontSize: 'var(--font-sm)', gap: 'var(--spacing-04)' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  trailingIcon,
  onClick,
  className = '',
  style,
}) => {
  const isInteractive = typeof onClick === 'function';
  const vStyles = variantStyles[variant] || variantStyles.default;
  const sStyles = sizeStyles[size] || sizeStyles.md;

  const Component = isInteractive ? 'button' : 'span';

  return (
    <Component
      className={`badge-tag ${className}`.trim()}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-pill)',
        fontWeight: 'var(--fw-semibold)',
        letterSpacing: 'var(--ls-wide)',
        border: `1px solid ${vStyles.borderColor}`,
        borderTop: 'var(--neo-bevel-top)',
        boxShadow: isInteractive ? 'var(--neo-raised-sm)' : 'var(--neo-raised-sm)',
        background: vStyles.background,
        color: vStyles.color,
        cursor: isInteractive ? 'pointer' : 'default',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        ...sStyles,
        ...style,
      }}
      onMouseEnter={(e) => { if (isInteractive) e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { if (isInteractive) e.currentTarget.style.transform = 'scale(1)'; }}
      onKeyDown={(e) => { if (isInteractive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      aria-pressed={isInteractive ? undefined : undefined}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
      {trailingIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{trailingIcon}</span>}
    </Component>
  );
};

export interface StatusBadgeProps {
  status:
    | 'active'
    | 'pending'
    | 'success'
    | 'warning'
    | 'error'
    | 'inactive'
    | 'nominee'
    | 'verified'
    | 'encrypted'
    | 'paid'
    | 'overdue'
    | 'draft'
    | 'sent';
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const statusMap: Record<StatusBadgeProps['status'], { variant: BadgeVariant; defaultLabel: string; icon?: string }> = {
  active: { variant: 'cyan', defaultLabel: 'Active' },
  pending: { variant: 'amber', defaultLabel: 'Pending' },
  success: { variant: 'emerald', defaultLabel: 'Success' },
  warning: { variant: 'amber', defaultLabel: 'Warning' },
  error: { variant: 'rose', defaultLabel: 'Error' },
  inactive: { variant: 'default', defaultLabel: 'Inactive' },
  nominee: { variant: 'emerald', defaultLabel: '✓ Nominee' },
  verified: { variant: 'cyan', defaultLabel: 'Verified' },
  encrypted: { variant: 'indigo', defaultLabel: 'AES-256' },
  paid: { variant: 'emerald', defaultLabel: 'Paid' },
  overdue: { variant: 'rose', defaultLabel: 'Overdue' },
  draft: { variant: 'default', defaultLabel: 'Draft' },
  sent: { variant: 'amber', defaultLabel: 'Sent' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  style,
}) => {
  const cfg = statusMap[status] || statusMap.inactive;
  return (
    <Badge variant={cfg.variant} size="sm" className={className} style={style}>
      {label || cfg.defaultLabel}
    </Badge>
  );
};
