import React, { useState, useCallback } from 'react';
import { Link2, Check } from 'lucide-react';
import { playTactileClick } from './utils/haptics.js';

export interface CopyLinkButtonProps {
  url: string;
  label?: string;
  copiedLabel?: string;
  ariaLabel?: string;
  onCopy?: (url: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({
  url,
  label = 'Copy Link',
  copiedLabel = 'Copied',
  ariaLabel,
  onCopy,
  className = '',
  style
}) => {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (typeof window !== 'undefined' && navigator.clipboard) {
        navigator.clipboard
          .writeText(url)
          .then(() => {
            playTactileClick('toggle');
            setCopied(true);
            onCopy?.(url);
            setTimeout(() => setCopied(false), 2200);
          })
          .catch(() => {
            // Fallback: visual feedback nonetheless
            playTactileClick('soft');
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          });
      }
    },
    [url, onCopy]
  );

  const computedAriaLabel = ariaLabel
    ? copied
      ? `${ariaLabel} (copied to clipboard)`
      : ariaLabel
    : copied
      ? `${copiedLabel} to clipboard`
      : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={computedAriaLabel}
      title={copied ? `${copiedLabel} to clipboard` : label}
      className={`changelog-btn ${copied ? 'changelog-btn-copied is-copied' : ''} ${className}`.trim()}
      style={style}
    >
      {copied ? <Check size={13} aria-hidden="true" /> : <Link2 size={13} aria-hidden="true" />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
};

export default CopyLinkButton;
