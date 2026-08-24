import React from 'react';
import { cx } from './utils/cx.js';

export interface SliderProps {
  /** Label rendered on the left of the value row */
  label: React.ReactNode;
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Custom value readout (defaults to the raw number) */
  displayValue?: React.ReactNode;
  /** Optional suffix appended to the numeric readout (e.g. '%', ' yrs') */
  suffix?: string;
  /** Optional prefix rendered before an editable readout (e.g. '₹') */
  prefix?: string;
  /** Render the readout as an editable number input instead of static text */
  editable?: boolean;
  /** Width (px) of the editable number input */
  inputWidth?: number;
  /** Accent used for the range fill — any CSS color token */
  accent?: string;
  /** Accessible label for the range input */
  ariaLabel?: string;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Slider — the debossed range control with a label row and value readout
 * used across every calculator. Keeps the physical idiom of the library
 * (accent-track range on a token surface) while standardizing the markup
 * that used to be hand-rolled per view. `editable` swaps the readout for
 * a number input so users can type exact values alongside dragging.
 */
export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  displayValue,
  suffix,
  prefix,
  editable = false,
  inputWidth = 70,
  accent = 'var(--accent-1)',
  ariaLabel,
  className = '',
  style,
}) => (
  <div className={cx('slider-row', className)} style={style}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-05)',
        marginBottom: 'var(--spacing-04)',
      }}
    >
      <label className="type-body-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>
        {label}
      </label>
      {editable ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-02)',
            background: 'var(--bg-secondary)',
            borderRadius: '6px',
            padding: 'var(--spacing-02) var(--spacing-05)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--neo-inset-sm)',
          }}
        >
          {prefix && <span style={{ fontSize: 'var(--font-sm)', color: 'var(--accent-1)', fontWeight: 'var(--fw-heavy)' }}>{prefix}</span>}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
            style={{
              width: `${inputWidth}px`,
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-1)',
              fontWeight: 'var(--fw-heavy)',
              fontSize: 'var(--font-sm)',
              outline: 'none',
              textAlign: 'right',
            }}
          />
          {suffix && <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--fw-semibold)' }}>{suffix}</span>}
        </div>
      ) : (
        <span className="type-body-sm" style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)', fontVariantNumeric: 'tabular-nums' }}>
          {displayValue ?? `${value}${suffix ?? ''}`}
        </span>
      )}
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      style={{
        width: '100%',
        accentColor: accent,
        cursor: 'pointer',
        background: 'transparent',
      }}
    />
  </div>
);