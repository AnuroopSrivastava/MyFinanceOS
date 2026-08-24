import React from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { playTactileClick } from './utils/haptics.js';

export interface PinDotsProps {
  /** How many digits have been entered (0-4) */
  filled: number;
  /** When true, displays error animation and red warning state */
  hasError?: boolean;
  /** Total number of PIN digits (default: 4) */
  totalDigits?: number;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export const PinDots: React.FC<PinDotsProps> = ({
  filled,
  hasError = false,
  totalDigits = 4,
  className = '',
  style,
}) => {
  const digits = Array.from({ length: totalDigits }, (_, i) => i);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.65rem 1.25rem',
        background: 'var(--bg-secondary)',
        boxShadow: 'var(--neo-inset-sm)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-pill)',
        ...style,
      }}
      aria-label={`${filled} of ${totalDigits} PIN digits entered`}
      role="status"
    >
      {digits.map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: filled === i + 1 ? [1, 1.25, 1] : 1,
            backgroundColor: hasError
              ? 'var(--error)'
              : filled > i
              ? 'var(--accent-1)'
              : 'var(--bg-panel)',
            boxShadow:
              filled > i && !hasError
                ? '0 0 10px var(--accent-1)'
                : hasError
                ? '0 0 10px var(--error)'
                : 'var(--neo-inset-sm)',
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            border: `1px solid ${
              hasError
                ? 'var(--error)'
                : filled > i
                ? 'transparent'
                : 'var(--border-color)'
            }`,
          }}
        />
      ))}
    </div>
  );
};

export interface PadBtnProps {
  label: string | React.ReactNode;
  sub?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'delete' | 'empty';
  ariaLabel?: string;
}

export const PadBtn: React.FC<PadBtnProps> = ({
  label,
  sub,
  onClick,
  disabled = false,
  variant = 'default',
  ariaLabel,
}) => {
  const handleClick = () => {
    if (disabled || variant === 'empty') return;
    playTactileClick(variant === 'delete' ? 'firm' : 'soft');
    onClick();
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: variant === 'empty' ? 1 : 0.94 }}
      onClick={handleClick}
      disabled={disabled || variant === 'empty'}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1px',
        background: variant === 'empty' ? 'transparent' : 'var(--bg-panel)',
        backgroundImage: variant === 'empty' ? 'none' : 'var(--neo-convex-grad)',
        boxShadow: variant === 'empty' ? 'none' : 'var(--neo-btn-secondary)',
        border: variant === 'empty' ? 'none' : '1px solid var(--border-color)',
        borderTop: variant === 'empty' ? 'none' : 'var(--neo-bevel-top)',
        color: 'var(--text-primary)',
        cursor: variant === 'empty' || disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: "'tnum' 1",
        fontSize: '1.5rem',
        fontWeight: 600,
        transition: 'all 0.12s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
      {sub && (
        <span
          style={{
            fontSize: '0.5rem',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
          }}
        >
          {sub}
        </span>
      )}
    </motion.button>
  );
};

export const PAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['__empty__', '0', '__delete__'],
] as const;

export const PAD_LABELS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

export interface NumberPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
  deleteDisabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  onDigit,
  onDelete,
  disabled = false,
  deleteDisabled = false,
  className = '',
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: 'center',
        ...style,
      }}
    >
      {PAD_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: '0.75rem' }}>
          {row.map((key) => {
            if (key === '__empty__') {
              return <PadBtn key="empty" label="" variant="empty" onClick={() => {}} />;
            }
            if (key === '__delete__') {
              return (
                <PadBtn
                  key="del"
                  label={<Delete size={22} />}
                  variant="delete"
                  onClick={onDelete}
                  disabled={deleteDisabled || disabled}
                  ariaLabel="Backspace"
                />
              );
            }
            return (
              <PadBtn
                key={key}
                label={key}
                sub={PAD_LABELS[key]}
                onClick={() => onDigit(key)}
                disabled={disabled}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
