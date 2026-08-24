import React from 'react';
import { Button } from './Button.js';
import { cx } from './utils/cx.js';

export interface FormActionsProps {
  /** Primary (submit) button label */
  submitLabel?: string;
  /** Primary action handler */
  onSubmit?: () => void;
  /** Primary button HTML type — defaults to 'button' when onSubmit is provided, else 'submit' */
  submitType?: 'submit' | 'button';
  /** Disable + label the primary as busy (e.g. "Saving…") */
  submitting?: boolean;
  /** Primary button variant — defaults to 'primary' */
  submitVariant?: 'primary' | 'danger';
  /** Cancel button label */
  cancelLabel?: string;
  /** Cancel handler */
  onCancel?: () => void;
  /** Hide the cancel button entirely */
  hideCancel?: boolean;
  /** Extra content rendered before the buttons */
  extra?: React.ReactNode;
  /** Render a divider above the action row (modal footer style) */
  divided?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * FormActions — the standardized Cancel + Submit footer row for modals and
 * forms. Two visual modes: the plain flex-end row (in-card forms) and the
 * divided footer (modal bottom edge, hairline separator + padding).
 */
export const FormActions: React.FC<FormActionsProps> = ({
  submitLabel = 'Save',
  onSubmit,
  submitType,
  submitting = false,
  submitVariant = 'primary',
  cancelLabel = 'Cancel',
  onCancel,
  hideCancel = false,
  extra,
  divided = false,
  className = '',
  style,
}) => {
  const resolvedType = submitType || (onSubmit ? 'button' : 'submit');

  return (
    <div
      className={cx('form-actions', className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-075)',
        flexWrap: 'wrap',
        marginTop: divided ? 0 : 'var(--spacing-125)',
        paddingTop: divided ? 'var(--spacing-1)' : 0,
        borderTop: divided ? '1px solid var(--border-color)' : 'none',
        ...style,
      }}
    >
      {extra && <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>{extra}</div>}
      {!hideCancel && onCancel && (
        <Button variant="secondary" type="button" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button variant={submitVariant} type={resolvedType} onClick={onSubmit} disabled={submitting}>
        {submitting ? `${submitLabel}…` : submitLabel}
      </Button>
    </div>
  );
};