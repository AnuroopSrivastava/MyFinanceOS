import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from './Button.js';
import { trapTabKey, getFocusableElements } from './utils/focusTrap.js';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Size variant */
  size?: ModalSize;
  /** Show close button */
  showClose?: boolean;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Prevent body scroll */
  preventScroll?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Footer content */
  footer?: React.ReactNode;
  /** Portal target ID (defaults to body) */
  portalTarget?: string;
}

const sizeStyles: Record<ModalSize, React.CSSProperties> = {
  sm: { maxWidth: '420px', width: '100%' },
  md: { maxWidth: '560px', width: '100%' },
  lg: { maxWidth: '720px', width: '100%' },
  xl: { maxWidth: '960px', width: '100%' },
  full: { maxWidth: 'calc(100vw - 1.5rem)', width: 'calc(100vw - 1.5rem)' },
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  className = '',
  style,
  footer,
  portalTarget = 'body',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = preventScroll ? 'hidden' : '';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, preventScroll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && closeOnEscape) onClose();
      if (e.key === 'Tab') trapTabKey(e, modalRef.current);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className={`modal-container ${className}`}
            style={{ ...sizeStyles[size], ...style }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
            tabIndex={-1}
          >
            {(title || showClose) && (
              <div className="modal-header">
                <div>
                  {title && (
                    <h2 id="modal-title" className="type-title" style={{ margin: 0 }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-description" className="type-body-sm" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    type="button"
                    className="modal-close icon-btn"
                    onClick={onClose}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, color: 'var(--text-muted)',
                      width: '32px', height: '32px', minWidth: '32px', minHeight: '32px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color 0.15s, background 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="modal-body">
              {children}
            </div>
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;

  const target = document.getElementById(portalTarget) || document.body;
  return createPortal(modalContent, target);
};

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

const CLOSED_CONFIRM_STATE: ConfirmModalState = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
};

export interface ConfirmModalProps {
  state?: ConfirmModalState;
  onClose?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  state = CLOSED_CONFIRM_STATE,
  onClose = () => {},
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!state?.isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const modal = modalRef.current;
    if (modal) {
      const focusable = getFocusableElements(modal);
      if (focusable.length > 0) {
        setTimeout(() => focusable[0].focus(), 50);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') trapTabKey(e, modalRef.current);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [state?.isOpen, onClose]);

  const handleConfirm = async () => {
    if (state?.onConfirm) {
      try {
        await state.onConfirm();
      } catch (err) {
        console.error('Confirm action failed:', err);
      }
    }
    onClose();
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {state?.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="modal-overlay"
          style={{
            background: 'var(--overlay-scrim)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="glass-panel"
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-md)',
              backgroundImage: 'var(--neo-convex-grad)',
              border: state.isDanger
                ? '1px solid var(--error)'
                : '1px solid var(--border-color)',
              borderTop: state.isDanger
                ? '1px solid var(--error)'
                : 'var(--neo-bevel-top)',
              borderBottom: state.isDanger
                ? '1px solid var(--error)'
                : 'var(--neo-bevel-bottom)',
              boxShadow: 'var(--shadow-overlay)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-125)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cm-title"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: state.isDanger
                      ? 'var(--error-bg)'
                      : 'var(--badge-cyan-bg)',
                    border: state.isDanger
                      ? '1px solid var(--error)'
                      : '1px solid var(--badge-cyan-border)',
                  }}
                >
                  <AlertTriangle
                    size={18}
                    color={state.isDanger ? 'var(--error)' : 'var(--accent-1)'}
                  />
                </div>
                <h3
                  id="cm-title"
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 'var(--fw-bold)',
                    letterSpacing: 'var(--ls-tight)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {state.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.5rem',
                  minWidth: '40px',
                  minHeight: '40px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--lh-relaxed)',
                maxWidth: '60ch',
              }}
            >
              {state.message}
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-075)', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                style={{ padding: 'var(--spacing-05) 1.1rem', fontSize: 'var(--font-sm)' }}
              >
                {state.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: 'var(--spacing-05) 1.1rem',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--fw-semibold)',
                  background: state.isDanger ? 'var(--error-bg)' : 'var(--accent-grad)',
                  color: state.isDanger ? 'var(--error)' : 'var(--text-on-action)',
                  border: state.isDanger ? '1px solid var(--error)' : 'none',
                }}
              >
                {state.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const useConfirmModal = () => {
  const [modal, setModal] = React.useState<ConfirmModalState>(CLOSED_CONFIRM_STATE);
  const openConfirm = React.useCallback(
    (opts: Omit<ConfirmModalState, 'isOpen'>) => {
      setModal({ ...opts, isOpen: true });
    },
    []
  );
  const closeConfirm = React.useCallback(() => {
    setModal(CLOSED_CONFIRM_STATE);
  }, []);
  return { modal, openConfirm, closeConfirm };
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showClose={false}>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
      {message}
    </p>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={loading}
        style={{ padding: '0.65rem 1.25rem' }}
      >
        {cancelText}
      </Button>
      <Button
        type="button"
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={onConfirm}
        disabled={loading}
        style={{ padding: '0.65rem 1.25rem' }}
      >
        {loading ? 'Processing...' : confirmText}
      </Button>
    </div>
  </Modal>
);