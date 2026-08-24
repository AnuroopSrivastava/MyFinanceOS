import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { playTactileClick } from './utils/haptics.js';

export interface CopyableFieldProps {
  /** The text value to display and copy */
  value: string;
  /** Optional field label above or beside the value */
  label?: string;
  /** Whether the field contains secret/sensitive data (masks by default with eye reveal toggle) */
  secret?: boolean;
  /** Whether to truncate long values with ellipsis */
  truncate?: boolean;
  /** Custom label when copied (defaults to "Copied!") */
  copiedLabel?: string;
  /** Custom tooltip on hover */
  copyTooltip?: string;
  /** Optional callback after copying */
  onCopy?: (copiedValue: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CopyableField: React.FC<CopyableFieldProps> = ({
  value,
  label,
  secret = false,
  truncate = false,
  copiedLabel = 'Copied!',
  copyTooltip = 'Copy to clipboard',
  onCopy,
  className = '',
  style
}) => {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!secret);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      }
      playTactileClick('toggle');
      setCopied(true);
      onCopy?.(value);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const toggleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTactileClick('soft');
    setRevealed(r => !r);
  };

  const displayValue = secret && !revealed ? '••••••••••••••••' : value;

  return (
    <div
      className={`copyable-field ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-025)',
        ...style
      }}
    >
      {label && (
        <span
          style={{
            fontSize: 'var(--font-xs)',
            fontWeight: 'var(--fw-medium)',
            color: 'var(--text-secondary)'
          }}
        >
          {label}
        </span>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-05)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--neo-inset-sm)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--spacing-04) var(--spacing-06)',
          fontFamily: 'monospace',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-primary)'
        }}
      >
        <span
          style={{
            overflow: truncate ? 'hidden' : 'visible',
            textOverflow: truncate ? 'ellipsis' : 'clip',
            whiteSpace: truncate ? 'nowrap' : 'normal',
            wordBreak: 'break-all',
            flex: 1,
            userSelect: 'all'
          }}
          title={secret && !revealed ? 'Click eye to view' : value}
        >
          {displayValue}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-025)', flexShrink: 0 }}>
          {secret && (
            <button
              type="button"
              onClick={toggleReveal}
              aria-label={revealed ? 'Hide secret value' : 'Show secret value'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 'var(--spacing-02)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? copiedLabel : copyTooltip}
            title={copied ? copiedLabel : copyTooltip}
            style={{
              background: copied ? 'var(--success-bg)' : 'var(--surface-faint)',
              border: copied ? '1px solid var(--status-paid-border)' : '1px solid var(--border-color)',
              color: copied ? 'var(--success)' : 'var(--accent-1)',
              cursor: 'pointer',
              padding: 'var(--spacing-02) var(--spacing-04)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-02)',
              fontSize: 'var(--font-2xs)',
              fontWeight: 'var(--fw-semibold)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {copied ? (
              <>
                <Check size={13} />
                <span>{copiedLabel}</span>
              </>
            ) : (
              <>
                <Copy size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
