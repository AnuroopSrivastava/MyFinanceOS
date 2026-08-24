import React from 'react';
import { motion } from 'framer-motion';

export type MetricCardVariant = 'default' | 'positive' | 'negative' | 'neutral';

export interface MetricCardProps {
  /** Card title/label */
  label: string;
  /** Primary value to display */
  value: string | number;
  /** Optional icon (Lucide or any React node) */
  icon?: React.ReactNode;
  /** Optional subtext below value */
  subtext?: string;
  /** Optional progress bar (0-100) */
  progress?: number;
  /** Progress color variant */
  progressVariant?: MetricCardVariant;
  /** Bottom accent bar color */
  accentColor?: string;
  /** Click handler makes card interactive */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Animation delay index for stagger */
  animationIndex?: number;
}

const variantColors: Record<MetricCardVariant, { text: string; bg: string }> = {
  default: { text: 'var(--accent-1)', bg: 'var(--accent-grad)' },
  positive: { text: 'var(--success)', bg: 'linear-gradient(135deg, var(--success) 0%, var(--success) 100%)' },
  negative: { text: 'var(--error)', bg: 'linear-gradient(135deg, var(--error) 0%, var(--error) 100%)' },
  neutral: { text: 'var(--text-muted)', bg: 'linear-gradient(135deg, var(--text-muted) 0%, var(--text-muted) 100%)' },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  subtext,
  progress,
  progressVariant = 'default',
  accentColor,
  onClick,
  className = '',
  style,
  animationIndex = 0,
}) => {
  const isInteractive = typeof onClick === 'function';
  const progressColors = variantColors[progressVariant];

  return (
    <motion.div
      className={`glass-panel ${isInteractive ? 'interactive-card interactive-card--normal' : ''} ${className}`.trim()}
      style={{
        padding: '1.15rem 1.25rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: isInteractive ? 'pointer' : 'default',
        backgroundImage: 'var(--neo-convex-grad)',
        borderTop: 'var(--neo-bevel-top)',
        boxShadow: 'var(--neo-raised-sm)',
        ...style,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, delay: animationIndex * 0.1 }}
      whileHover={isInteractive ? { scale: 1.02 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => { if (isInteractive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <span className="type-label-upper">
          {label}
        </span>
        {icon && (
          <span
            style={{
              color: 'var(--accent-1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--neo-inset-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <h3 className="type-metric" style={{
        margin: '0 0 0.25rem 0',
        color: 'var(--text-primary)'
      }}>
        {value}
      </h3>
      {subtext && (
        <p className="type-caption" style={{ margin: 0 }}>{subtext}</p>
      )}
      {progress !== undefined && progress >= 0 && (
        <div style={{
          height: '6px',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--neo-inset-sm)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-pill)',
          marginTop: '0.6rem',
          overflow: 'hidden',
          padding: '1px',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 1, delay: 0.5 + animationIndex * 0.1, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 'var(--radius-pill)', background: progressColors.bg, boxShadow: '0 0 8px var(--border-color-glow)' }}
          />
        </div>
      )}
      {accentColor && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
          opacity: 0.8
        }} />
      )}
    </motion.div>
  );
};