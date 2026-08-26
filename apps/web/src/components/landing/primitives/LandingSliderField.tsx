import React from 'react';

export interface LandingSliderFieldProps {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  accentColor?: string;
  onChange: (val: number) => void;
  ariaLabel?: string;
  sublabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LandingSliderField: React.FC<LandingSliderFieldProps> = ({
  id,
  label,
  value,
  displayValue,
  min,
  max,
  step,
  accentColor = '#06b6d4',
  onChange,
  ariaLabel,
  sublabel,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '14px',
        padding: '1.15rem 1.25rem',
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div>
          <label
            htmlFor={id}
            style={{
              fontSize: '0.82rem',
              color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))',
              fontWeight: 600,
              display: 'block'
            }}
          >
            {label}
          </label>
          {sublabel && (
            <span style={{ fontSize: '0.7rem', color: 'var(--l-text-muted, #94a3b8)' }}>
              {sublabel}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            color: accentColor
          }}
          className="l-num"
        >
          {displayValue}
        </span>
      </div>

      <input
        id={id}
        name={id}
        aria-label={ariaLabel || label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: accentColor,
          cursor: 'pointer',
          marginTop: '0.25rem'
        }}
      />
    </div>
  );
};
