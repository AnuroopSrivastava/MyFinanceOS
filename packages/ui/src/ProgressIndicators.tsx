import React from 'react';

export interface CircularProgressProps {
  /** Progress value (0-100) */
  value?: number;
  /** Alias for value */
  progress?: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Progress color */
  color?: string;
  /** Track color */
  trackColor?: string;
  /** Show value text */
  showValue?: boolean;
  /** Value formatter */
  valueFormatter?: (value: number) => string;
  /** Animated */
  animated?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value: explicitValue,
  progress,
  size = 100,
  strokeWidth = 6,
  color = 'var(--accent-1)',
  trackColor = 'var(--border-color)',
  showValue = true,
  valueFormatter = (v) => `${v.toFixed(0)}%`,
  animated = true,
  className = '',
  style,
}) => {
  const value = explicitValue ?? progress ?? 0;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const formattedValue = valueFormatter(value);

  return (
    <svg
      className={className}
      style={{ width: size, height: size, display: 'block', ...style }}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Progress ${formattedValue}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={animated ? offset : 0}
        style={{ transition: animated ? 'stroke-dashoffset 0.3s ease' : 'none' }}
      />
      {showValue && (
        <text
          x={size / 2}
          y={size / 2 + radius / 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize={radius * 0.3}
          fontWeight="600"
          fontFamily="var(--font-display)"
          letterSpacing="-0.02em"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formattedValue}
        </text>
      )}
    </svg>
  );
};

export interface LinearProgressProps {
  /** Progress value (0-100) */
  value?: number;
  /** Alias for value */
  progress?: number;
  /** Height in pixels */
  height?: number;
  /** Progress color */
  color?: string;
  /** Track color */
  trackColor?: string;
  /** Show value text */
  showValue?: boolean;
  /** Value formatter */
  valueFormatter?: (value: number) => string;
  /** Animated */
  animated?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value: explicitValue,
  progress,
  height = 8,
  color = 'var(--accent-grad)',
  trackColor = 'var(--bg-secondary)',
  showValue = true,
  valueFormatter = (v) => `${v.toFixed(0)}%`,
  animated = true,
  className = '',
  style,
}) => {
  const value = explicitValue ?? progress ?? 0;
  const formattedValue = valueFormatter(value);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        backgroundColor: trackColor,
        boxShadow: 'var(--neo-inset-sm)',
        border: '1px solid var(--border-color)',
        borderRadius: height / 2,
        overflow: 'hidden',
        padding: '1px',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: '100%',
          backgroundImage: color,
          backgroundSize: '200% 100%',
          backgroundPosition: animated ? '-100% 0' : '0 0',
          transition: animated ? 'background-position 1s linear' : 'none',
          borderRadius: height / 2,
        }}
      />
      {showValue && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            fontSize: `${height * 2}px`,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: "'tnum' 1",
            pointerEvents: 'none',
          }}
        >
          {formattedValue}
        </div>
      )}
    </div>
  );
};

export const ProgressIndicators = {
  Circular: CircularProgress,
  Linear: LinearProgress,
};