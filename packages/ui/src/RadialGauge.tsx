import React from 'react';

export type RadialGaugeVariant = 'auto' | 'success' | 'warning' | 'error' | 'cyan';

export interface RadialGaugeProps {
  /** Numerical value to display */
  value: number;
  /** Maximum scale value (default: 100) */
  max?: number;
  /** Minimum scale value (default: 0) */
  min?: number;
  /** Size in pixels (default: 100) */
  size?: number;
  /** Stroke thickness of gauge arc in pixels (default: 6) */
  strokeWidth?: number;
  /** Arc starting angle in degrees (default: -210) */
  startAngle?: number;
  /** Arc ending angle in degrees (default: 30) */
  endAngle?: number;
  /** Rating or status label rendered below value (e.g. 'Excellent', 'Fair', 'Needs Work') */
  label?: string;
  /** Optional secondary subtitle */
  sublabel?: string;
  /** Color variant or 'auto' for threshold-based coloring */
  variant?: RadialGaugeVariant;
  /** Score thresholds for 'auto' variant (default: { warning: 40, success: 70 }) */
  thresholds?: {
    warning: number;
    success: number;
  };
  /** Whether to render center numerical readout (default: true) */
  showValue?: boolean;
  /** Value display formatter */
  valueFormatter?: (value: number) => string;
  /** Custom className */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Accessible label */
  ariaLabel?: string;
  /** Accessible description */
  description?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max = 100,
  min = 0,
  size = 100,
  strokeWidth = 6,
  startAngle = -210,
  endAngle = 30,
  label,
  sublabel,
  variant = 'auto',
  thresholds = { warning: 40, success: 70 },
  showValue = true,
  valueFormatter,
  className = '',
  style,
  ariaLabel,
  description,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.max(10, cx - strokeWidth - 4);
  const totalAngle = endAngle - startAngle;

  const clampedVal = Math.max(min, Math.min(max, value));
  const normalizedPct = max > min ? (clampedVal - min) / (max - min) : 0;
  const progressAngle = startAngle + normalizedPct * totalAngle;

  const polarToCart = (angleDeg: number, r: number) => ({
    x: cx + r * Math.cos((angleDeg * Math.PI) / 180),
    y: cy + r * Math.sin((angleDeg * Math.PI) / 180),
  });

  const bgStart = polarToCart(startAngle, radius);
  const bgEnd = polarToCart(endAngle, radius);
  const progEnd = polarToCart(progressAngle, radius);

  // Compute semantic color
  let scoreColor = 'var(--accent-1)';
  let autoLabel = label;

  if (variant === 'auto') {
    if (clampedVal >= thresholds.success) {
      scoreColor = 'var(--success)';
      if (!label) autoLabel = 'Excellent';
    } else if (clampedVal >= thresholds.warning) {
      scoreColor = 'var(--warning)';
      if (!label) autoLabel = 'Fair';
    } else {
      scoreColor = 'var(--error)';
      if (!label) autoLabel = 'Needs Work';
    }
  } else if (variant === 'success') {
    scoreColor = 'var(--success)';
  } else if (variant === 'warning') {
    scoreColor = 'var(--warning)';
  } else if (variant === 'error') {
    scoreColor = 'var(--error)';
  } else if (variant === 'cyan') {
    scoreColor = 'var(--accent-1)';
  }

  const effectiveLabel = label ?? autoLabel;
  const formattedValue = valueFormatter ? valueFormatter(value) : value.toString();
  const defaultAria = ariaLabel || `Score: ${value} out of ${max}${effectiveLabel ? ` (${effectiveLabel})` : ''}`;

  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox={`0 0 ${size} ${size * 0.75}`}
      role="img"
      aria-label={defaultAria}
      className={className}
      style={{ overflow: 'visible', ...style }}
    >
      <title>{defaultAria}</title>
      {description && <desc>{description}</desc>}
      
      {/* Background Arc */}
      <path
        d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none"
        stroke="var(--border-subtle, rgba(255,255,255,0.08))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Progress Arc */}
      {normalizedPct > 0 && (
        <path
          d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${normalizedPct * totalAngle > 180 ? 1 : 0} 1 ${progEnd.x} ${progEnd.y}`}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      )}

      {/* Numerical Value Readout */}
      {showValue && (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize={Math.round(size * 0.2)}
          fontWeight="700"
          className="tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}
        >
          {formattedValue}
        </text>
      )}

      {/* Status Label */}
      {effectiveLabel && (
        <text
          x={cx}
          y={cy + Math.round(size * 0.14)}
          textAnchor="middle"
          fill={scoreColor}
          fontSize={Math.round(size * 0.085)}
          fontWeight="600"
        >
          {effectiveLabel}
        </text>
      )}

      {/* Sublabel */}
      {sublabel && (
        <text
          x={cx}
          y={cy + Math.round(size * 0.24)}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize={Math.round(size * 0.07)}
        >
          {sublabel}
        </text>
      )}
    </svg>
  );
};
