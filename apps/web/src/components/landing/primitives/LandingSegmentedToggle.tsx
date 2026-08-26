import React from 'react';

export interface SegmentedOption<T extends string | number | boolean> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface LandingSegmentedToggleProps<T extends string | number | boolean> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LandingSegmentedToggle<T extends string | number | boolean>({
  options,
  value,
  onChange,
  ariaLabel = 'Segmented Options',
  className = '',
  style = {}
}: LandingSegmentedToggleProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        gap: '4px',
        ...style
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              background: isSelected
                ? 'linear-gradient(135deg, #06b6d4, #10b981)'
                : 'transparent',
              color: isSelected ? '#07080d' : '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit'
            }}
          >
            <span>{opt.label}</span>
            {opt.sublabel && (
              <span
                style={{
                  fontSize: '0.66rem',
                  opacity: isSelected ? 0.85 : 0.6,
                  fontWeight: 500
                }}
              >
                {opt.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface LandingChipGroupProps<T extends string | number | boolean> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LandingChipGroup<T extends string | number | boolean>({
  options,
  value,
  onChange,
  ariaLabel = 'Filter Options',
  className = '',
  style = {}
}: LandingChipGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'flex',
        gap: '0.45rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        ...style
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0.42rem 0.75rem',
              borderRadius: '8px',
              background: isSelected
                ? 'rgba(6, 182, 212, 0.25)'
                : 'rgba(255, 255, 255, 0.04)',
              border: isSelected
                ? '1px solid #06b6d4'
                : '1px solid rgba(255, 255, 255, 0.08)',
              color: isSelected
                ? '#67e8f9'
                : 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
