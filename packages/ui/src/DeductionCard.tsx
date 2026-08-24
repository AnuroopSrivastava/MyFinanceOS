import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Info, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { formatRupee, formatRupeeCompact, parseRupeeToNumber } from '@financeos/shared';
import { InteractiveCard } from './InteractiveCard.js';

export interface DeductionCardProps {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Current deduction value */
  value: number;
  /** Maximum allowed deduction */
  maxLimit: number;
  /** Unit label */
  unit?: string;
  /** Description / formula explanation */
  description?: string;
  /** Formula tooltip content */
  formula?: string;
  /** Source badge (e.g., "From Investments") */
  source?: string;
  /** Whether section is expanded */
  expanded?: boolean;
  /** On expand toggle */
  onExpand?: () => void;
  /** On value change */
  onChange: (value: number) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Whether this section is complete/valid */
  isComplete?: boolean;
  /** Whether this section has unsaved changes */
  isDirty?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Intensity for InteractiveCard */
  intensity?: 'subtle' | 'normal' | 'interactive';
  /** Whether the section is enabled */
  enabled?: boolean;
  /** Section icon */
  icon?: React.ReactNode;
  /** Help URL for external reference */
  helpUrl?: string;
}

export const DeductionCard = forwardRef<HTMLDivElement, DeductionCardProps>(
  (
    {
      id: _id,
      title,
      value,
      maxLimit,
      unit = '₹',
      description,
      formula,
      source,
      expanded = false,
      onExpand,
      onChange,
      placeholder,
      isComplete = false,
      isDirty = false,
      className = '',
      style,
      intensity = 'normal',
      enabled = true,
      icon,
      helpUrl,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const pct = maxLimit > 0 ? Math.min(100, (value / maxLimit) * 100) : 0;
    const remaining = Math.max(0, maxLimit - value);
    const isMaxed = value >= maxLimit;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '');
      if (raw === '' || raw === '-' || raw.endsWith('.')) {
        onChange(raw === '' || raw === '-' || raw.endsWith('.') ? 0 : parseRupeeToNumber(raw));
        return;
      }
      const num = parseRupeeToNumber(raw);
      onChange(Math.min(num, maxLimit));
    };

    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);

    return (
      <InteractiveCard
        ref={ref}
        intensity={intensity}
        data-interactive-card={intensity}
        className={`deduction-card ${isComplete ? 'complete' : ''} ${isDirty ? 'dirty' : ''} ${className}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          ...style,
        }}
        onMouseEnter={() => { if (enabled) document.body.style.cursor = 'default'; }}
        onMouseLeave={() => { document.body.style.cursor = 'default'; }}
      >
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            cursor: onExpand ? 'pointer' : 'default',
          }}
          onClick={onExpand}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onExpand) { e.preventDefault(); onExpand(); } }}
          tabIndex={onExpand ? 0 : undefined}
          role={onExpand ? 'button' : undefined}
          aria-expanded={expanded}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            {icon && (
              <div className="neo-socket" style={{
                width: '36px',
                height: '36px',
                flexShrink: 0,
                color: 'var(--accent-1)',
              }}>
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h4 className="type-section-title" style={{
                margin: 0,
                color: enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {title}
              </h4>
              {description && (
                <p className="type-caption" style={{
                  margin: '0.15rem 0 0',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {description}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {source && (
              <span className="type-badge" style={{
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textTransform: 'uppercase',
              }}>
                {source}
              </span>
            )}
            {isComplete && !isMaxed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={12} />
              </motion.span>
            )}
            {isMaxed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--error)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <AlertCircle size={12} />
              </motion.span>
            )}
            {helpUrl && (
              <a
                href={helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  padding: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-panel)',
                  backgroundImage: 'var(--neo-convex-grad)',
                  border: '1px solid var(--border-color)',
                  borderTop: 'var(--neo-bevel-top)',
                  boxShadow: 'var(--neo-raised-sm)',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-1)'; e.currentTarget.style.borderColor = 'var(--accent-1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                aria-label="Learn more about this deduction"
              >
                <ExternalLink size={14} />
              </a>
            )}
            {formula && (
              <button
                type="button"
                className="icon-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  padding: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-panel)',
                  backgroundImage: 'var(--neo-convex-grad)',
                  border: '1px solid var(--border-color)',
                  borderTop: 'var(--neo-bevel-top)',
                  boxShadow: 'var(--neo-raised-sm)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-1)'; e.currentTarget.style.borderColor = 'var(--accent-1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                aria-label="View formula"
              >
                <Info size={14} />
              </button>
            )}
            {onExpand && (
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="icon-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  minHeight: '28px',
                  padding: 0,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-panel)',
                  backgroundImage: 'var(--neo-convex-grad)',
                  border: '1px solid var(--border-color)',
                  borderTop: 'var(--neo-bevel-top)',
                  boxShadow: 'var(--neo-raised-sm)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <ChevronDown size={14} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-primary)', boxShadow: 'var(--neo-inset-sm)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            style={{
              height: '100%',
              borderRadius: '3px',
              background: isMaxed
                ? 'linear-gradient(90deg, var(--error), var(--warning))'
                : pct >= 75
                  ? 'linear-gradient(90deg, var(--accent-1), var(--accent-2))'
                  : 'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
              boxShadow: pct > 0 ? '0 0 8px rgba(6, 182, 212, 0.4)' : 'none',
            }}
          />
        </div>

        {/* Input Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="type-label-upper">
              Current Claim
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{
                position: 'absolute',
                left: '0.85rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                fontWeight: 500,
                pointerEvents: 'none',
              }}>
                {unit}
              </span>
              <input
                type="text"
                inputMode="decimal"
                className="form-input"
                style={{
                  paddingLeft: unit === '₹' ? '1.75rem' : '0.85rem',
                  paddingRight: '2.5rem',
                  background: enabled ? 'var(--bg-panel)' : 'rgba(255,255,255,0.02)',
                  color: enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderColor: isFocused ? 'var(--accent-1)' : isDirty ? 'var(--warning)' : 'var(--border-color)',
                  boxShadow: isFocused ? '0 0 0 3px rgba(6, 182, 212, 0.15)' : 'none',
                  fontFamily: 'var(--font-body)',
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: "'tnum' 1",
                }}
                value={formatRupee(value).replace('₹', '').trim()}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={!enabled}
                placeholder={placeholder || '0'}
                aria-label={`Current ${title} claim`}
                readOnly={!enabled}
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '0.2rem' }}>
            <div className="type-label-upper">
              Limit
            </div>
            <div className="tabular-nums" style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
              {formatRupee(maxLimit).replace('₹', '').trim()}
            </div>
          </div>

          <div className="tabular-nums" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isMaxed ? 'var(--error)' : remaining > 0 ? 'var(--accent-1)' : 'var(--text-muted)' }}>
              {isMaxed ? 'Limit reached' : remaining > 0 ? `${formatRupeeCompact(remaining)} remaining` : 'Maxed'}
            </div>
            <div className="type-caption">
              {pct.toFixed(0)}% utilized
            </div>
          </div>
        </div>

        {/* Expanded Formula Tooltip */}
        {expanded && formula && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              padding: '1rem',
              background: 'rgba(6, 182, 212, 0.04)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '-0.5rem',
              marginBottom: '-0.5rem',
              marginLeft: '-1.25rem',
              marginRight: '-1.25rem',
              paddingLeft: '2.25rem',
              paddingRight: '2.25rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-1)', fontFamily: 'var(--font-display)' }}>Formula: </strong>
              {formula}
            </div>
          </motion.div>
        )}
      </InteractiveCard>
    );
  }
);

DeductionCard.displayName = 'DeductionCard';