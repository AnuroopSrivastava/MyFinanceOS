import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

const typeStyles: Record<ToastType, { bg: string; border: string; iconColor: string; titleColor: string }> = {
  default: { bg: 'var(--bg-panel)', border: 'var(--border-color)', iconColor: 'var(--accent-1)', titleColor: 'var(--accent-1)' },
  success: { bg: 'var(--success-bg)', border: 'var(--success)', iconColor: 'var(--success)', titleColor: 'var(--success)' },
  error: { bg: 'var(--error-bg)', border: 'var(--error)', iconColor: 'var(--error)', titleColor: 'var(--error)' },
  warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', iconColor: 'var(--warning)', titleColor: 'var(--warning)' },
  info: { bg: 'var(--info-bg)', border: 'var(--info)', iconColor: 'var(--info)', titleColor: 'var(--info)' },
};

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  const type = toast.type || 'default';
  const styles = typeStyles[type];
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 200);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 100, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: styles.bg,
            border: `1px solid ${styles.border}`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-1) var(--spacing-125)',
            boxShadow: 'var(--neo-raised-lg), 0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            gap: 'var(--spacing-1)',
            alignItems: 'flex-start',
            minWidth: '280px',
            maxWidth: '400px',
          }}
          role="alert"
          aria-live="polite"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: styles.iconColor,
              color: 'white',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            {type === 'success' && <CheckCircle2 size={14} />}
            {type === 'error' && <AlertCircle size={14} />}
            {type === 'warning' && <AlertTriangle size={14} />}
            {type === 'info' && <Info size={14} />}
            {type === 'default' && <Sparkles size={14} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-02)' }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)', color: styles.titleColor }}>
                {toast.title}
              </span>
              <button
                onClick={() => { setIsExiting(true); setTimeout(() => onClose(toast.id), 200); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-02)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-tint)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
            {toast.message && (
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 'var(--lh-normal)' }}>
                {toast.message}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles } from 'lucide-react';

interface ToasterProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export const Toaster: React.FC<ToasterProps> = ({ toasts, onClose, position = 'bottom-right' }) => {
  const positionStyles: Record<ToastPosition, React.CSSProperties> = {
    'top-right': { top: 'var(--spacing-2)', right: 'var(--spacing-2)', left: 'auto', bottom: 'auto' },
    'top-left': { top: 'var(--spacing-2)', left: 'var(--spacing-2)', right: 'auto', bottom: 'auto' },
    'bottom-right': { bottom: 'var(--spacing-2)', right: 'var(--spacing-2)', top: 'auto', left: 'auto' },
    'bottom-left': { bottom: 'var(--spacing-2)', left: 'var(--spacing-2)', top: 'auto', right: 'auto' },
    'top-center': { top: 'var(--spacing-2)', left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto' },
    'bottom-center': { bottom: 'var(--spacing-2)', left: '50%', transform: 'translateX(-50%)', right: 'auto', top: 'auto' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        display: 'flex',
        flexDirection: position.includes('top') ? 'column' : 'column-reverse',
        gap: 'var(--spacing-075)',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 2rem)',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto', width: '100%' }}>
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

export function createToastManager() {
  let toasts: Toast[] = [];
  const listeners: Set<(toasts: Toast[]) => void> = new Set();

  const notify = () => listeners.forEach(l => l([...toasts]));

  return {
    subscribe(listener: (toasts: Toast[]) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    show(toast: Omit<Toast, 'id'> & { id?: string }) {
      const id = toast.id || Math.random().toString(36).slice(2);
      const newToast: Toast = { ...toast, id };
      toasts = [...toasts, newToast];
      notify();
      if (toast.duration !== Infinity) {
        setTimeout(() => this.dismiss(id), toast.duration || 5000);
      }
      return id;
    },
    dismiss(id: string) {
      toasts = toasts.filter(t => t.id !== id);
      notify();
    },
    dismissAll() {
      toasts = [];
      notify();
    },
    success(title: string, message?: string, options?: Partial<Toast>) {
      return this.show({ title, message, type: 'success', ...options });
    },
    error(title: string, message?: string, options?: Partial<Toast>) {
      return this.show({ title, message, type: 'error', ...options });
    },
    warning(title: string, message?: string, options?: Partial<Toast>) {
      return this.show({ title, message, type: 'warning', ...options });
    },
    info(title: string, message?: string, options?: Partial<Toast>) {
      return this.show({ title, message, type: 'info', ...options });
    },
    promise<T>(promise: Promise<T>, { loading, success, error }: { loading: string; success: string | ((data: T) => string); error: string | ((err: Error) => string) }) {
      const id = this.show({ title: loading, type: 'info', duration: Infinity });
      return promise.then(
        (data) => {
          this.dismiss(id);
          this.success(typeof success === 'function' ? success(data) : success);
          return data;
        },
        (err: Error) => {
          this.dismiss(id);
          this.error(typeof error === 'function' ? error(err) : error);
          throw err;
        }
      );
    },
  };
}

export const toast = createToastManager();

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => toast.subscribe(setToasts), []);

  return {
    toasts,
    toast: {
      show: toast.show.bind(toast),
      dismiss: toast.dismiss.bind(toast),
      dismissAll: toast.dismissAll.bind(toast),
      success: toast.success.bind(toast),
      error: toast.error.bind(toast),
      warning: toast.warning.bind(toast),
      info: toast.info.bind(toast),
      promise: toast.promise.bind(toast),
    },
    Toaster: () => <Toaster toasts={toasts} onClose={toast.dismiss} />,
  };
}