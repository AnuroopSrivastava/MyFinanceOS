import React from 'react';

export interface FormFieldProps {
  /** Text or node rendered inside the `.form-label`. */
  label?: React.ReactNode;
  /** Ties the label to the control (pass the control's id). */
  htmlFor?: string;
  /** Appends an error-colored asterisk. */
  required?: boolean;
  /** Helper text under the control. */
  hint?: React.ReactNode;
  /** Error text under the control, styled via `.form-error`. */
  error?: React.ReactNode;
  className?: string;
  /** Inline styles for the `.form-group` row. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * The repeated `.form-group` + `.form-label` + control + helper/error structure.
 * Consolidates the most common form row in the app (form-group/form-label used 150+ times).
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  className = '',
  style,
  children,
}) => (
  <div className={`form-group ${className}`.trim()} style={style}>
    {label && (
      <label className="form-label" htmlFor={htmlFor}>
        {label}
        {required && (
          <span style={{ color: 'var(--error)' }} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
    )}
    {children}
    {hint && <small className="form-hint">{hint}</small>}
    {error && <small className="form-error">{error}</small>}
  </div>
);
