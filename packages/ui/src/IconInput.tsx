import React, { forwardRef } from 'react';

export interface IconInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Leading icon */
  icon?: React.ReactNode;
  /** Trailing icon */
  trailingIcon?: React.ReactNode;
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  block?: boolean;
  /** Custom className for wrapper */
  className?: string;
  /** Custom className for input */
  inputClassName?: string;
}

const sizeStyles: Record<string, { padding: string; fontSize: string; iconSize: number }> = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.85rem', iconSize: 16 },
  md: { padding: '0.7rem 1rem', fontSize: '0.92rem', iconSize: 18 },
  lg: { padding: '0.85rem 1.25rem', fontSize: '1rem', iconSize: 20 },
};

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({
    icon,
    trailingIcon,
    label,
    error,
    hint,
    size = 'md',
    block = true,
    className = '',
    inputClassName = '',
    id,
    ...props
  }, ref) => {
    const s = sizeStyles[size];
    const inputId = id || `icon-input-${React.useId()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className={`form-group ${className}`.trim()} style={{ width: block ? '100%' : 'auto', marginBottom: 0 }}>
        {label && (
          <label htmlFor={inputId} className="form-label" style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            {label}
            {props.required && <span style={{ color: 'var(--error)', marginLeft: '0.25rem' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <span style={{
              position: 'absolute', left: '0.85rem', color: 'var(--text-muted)',
              pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: s.iconSize, height: s.iconSize,
            }}>
              {React.isValidElement(icon) ? React.cloneElement(icon, { size: s.iconSize } as Record<string, unknown>) : icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`form-input ${inputClassName}`.trim()}
            style={{
              paddingLeft: icon ? '2.5rem' : s.padding.split(' ')[1] || '1rem',
              paddingRight: trailingIcon ? '2.5rem' : s.padding.split(' ')[1] || '1rem',
              paddingTop: s.padding.split(' ')[0],
              paddingBottom: s.padding.split(' ')[0],
              fontSize: s.fontSize,
              borderColor: error ? 'var(--error)' : undefined,
              ...props.style,
            }}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
            {...props}
          />
          {trailingIcon && (
            <span style={{
              position: 'absolute', right: '0.85rem', color: 'var(--text-muted)',
              pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: s.iconSize, height: s.iconSize,
            }}>
              {React.isValidElement(trailingIcon) ? React.cloneElement(trailingIcon, { size: s.iconSize } as Record<string, unknown>) : trailingIcon}
            </span>
          )}
        </div>
        {hint && !error && (
          <small id={hintId} className="form-hint" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {hint}
          </small>
        )}
        {error && (
          <small id={errorId} className="form-error" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--error)' }}>
            {error}
          </small>
        )}
      </div>
    );
  }
);

IconInput.displayName = 'IconInput';