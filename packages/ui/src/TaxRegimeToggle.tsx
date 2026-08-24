import React from 'react';
import { motion } from 'framer-motion';
import { formatRupeeCompact } from '@financeos/shared';

export type TaxRegime = 'old' | 'new';

export interface TaxRegimeToggleProps {
  value: TaxRegime;
  onChange: (regime: TaxRegime) => void;
  oldTax: number;
  newTax: number;
  optimal: TaxRegime;
  className?: string;
  style?: React.CSSProperties;
}

export const TaxRegimeToggle: React.FC<TaxRegimeToggleProps> = ({
  value,
  onChange,
  oldTax,
  newTax,
  optimal,
  className = '',
  style,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, regime: TaxRegime) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(regime);
    }
  };

  return (
    <div
      className={`tax-regime-toggle ${className}`.trim()}
      style={{
        display: 'flex',
        gap: '0.65rem',
        background: 'var(--bg-secondary)',
        boxShadow: 'var(--neo-inset-sm)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem',
        ...style,
      }}
      role="radiogroup"
      aria-label="Tax regime selection"
    >
      {(['old', 'new'] as TaxRegime[]).map((regime) => {
        const isActive = value === regime;
        const taxAmount = regime === 'old' ? oldTax : newTax;
        const label = regime === 'old' ? 'Old Regime' : 'New Regime';
        const isOptimal = optimal === regime;

        return (
          <motion.button
            key={regime}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${label}${isOptimal ? ' (recommended)' : ''}`}
            onClick={() => onChange(regime)}
            onKeyDown={(e) => handleKeyDown(e, regime)}
            whileHover={{ scale: isActive ? 1 : 1.01 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              boxShadow: isActive
                ? 'var(--neo-raised-sm), 0 0 16px var(--border-color-glow)'
                : 'none',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: isActive ? 'var(--bg-panel)' : 'transparent',
              borderLeft: isActive ? '1px solid var(--accent-1)' : '1px solid transparent',
              borderRight: isActive ? '1px solid var(--accent-1)' : '1px solid transparent',
              borderBottom: isActive ? '1px solid var(--accent-1)' : '1px solid transparent',
              borderTop: isActive ? 'var(--neo-bevel-top)' : '1px solid transparent',
              color: isActive ? 'var(--accent-1)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                letterSpacing: 'var(--ls-snug)',
              }}>
                {label}
              </span>
              {isOptimal && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="type-badge"
                  style={{
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    background: 'var(--badge-emerald-bg)',
                    color: 'var(--badge-emerald-text)',
                    border: '1px solid var(--badge-emerald-border)',
                    textTransform: 'uppercase',
                  }}
                >
                  Best
                </motion.span>
              )}
            </div>
            <div className="type-title tabular-nums" style={{
              color: isActive ? 'var(--accent-1)' : 'var(--text-primary)',
            }}>
              {formatRupeeCompact(taxAmount)}
            </div>
            <div className="type-caption tabular-nums" style={{
              textAlign: 'center',
            }}>
              {regime === 'old'
                ? `Deductions: ${formatRupeeCompact(taxAmount === oldTax ? Math.round((oldTax / 1.04) * 0.3) : 0)}`
                : 'Std deduction: ₹75,000'}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};