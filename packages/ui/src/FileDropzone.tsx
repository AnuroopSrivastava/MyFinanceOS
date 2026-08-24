import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { playTactileClick } from './utils/haptics.js';
import { cx } from './utils/cx.js';

export interface FileDropzoneProps {
  /** Accepted file formats (e.g. ".csv,.txt", ".json", "image/*") */
  accept?: string;
  /** Max file size limit in Megabytes (default: 10) */
  maxSizeMB?: number;
  /** Callback fired when a valid file is dropped or selected */
  onFileSelect?: (file: File) => void;
  /** Callback fired when the active file is removed */
  onFileRemove?: () => void;
  /** Controlled active/selected file */
  selectedFile?: File | { name: string; size?: number; formattedSize?: string } | null;
  /** Primary label text */
  label?: string;
  /** Subtitle / format requirements text */
  sublabel?: string;
  /** Custom icon override */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Visual variant */
  variant?: 'default' | 'compact' | 'card';
  /** Custom error message */
  error?: string;
  /** DOM identifier */
  id?: string;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  maxSizeMB = 10,
  onFileSelect,
  onFileRemove,
  selectedFile,
  label = 'Drag & drop file here, or click to browse',
  sublabel,
  icon,
  disabled = false,
  variant = 'default',
  error: customError,
  id = 'financeos-file-dropzone',
  className = '',
  style
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = useCallback((file: File): boolean => {
    setLocalError(null);

    // 1. Size check
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File exceeds maximum size limit of ${maxSizeMB} MB.`);
      return false;
    }

    // 2. Format check (if specified)
    if (accept) {
      const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
      const fileName = file.name.toLowerCase();
      const fileType = (file.type || '').toLowerCase();

      const matches = allowedExtensions.some(rule => {
        if (rule.startsWith('.')) {
          return fileName.endsWith(rule);
        }
        if (rule.endsWith('/*')) {
          const prefix = rule.replace('/*', '');
          return fileType.startsWith(prefix);
        }
        return fileType === rule;
      });

      if (!matches) {
        setLocalError(`Invalid file format. Accepted types: ${accept}`);
        return false;
      }
    }

    return true;
  }, [accept, maxSizeMB]);

  const handleFile = useCallback((file: File) => {
    if (disabled) return;
    if (validateFile(file)) {
      playTactileClick('soft');
      onFileSelect?.(file);
    }
  }, [disabled, validateFile, onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const pickedFile = e.target.files[0];
      handleFile(pickedFile);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const triggerBrowse = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalError(null);
    playTactileClick('toggle');
    onFileRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = customError || localError;
  const isCompact = variant === 'compact';

  return (
    <div className={cx('file-dropzone-wrapper', className)} style={{ width: '100%', ...style }}>
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        aria-label={label}
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        // Selected File Card View
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isCompact ? 'var(--spacing-05) var(--spacing-075)' : 'var(--spacing-075) var(--spacing-1)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderTop: 'var(--neo-bevel-top)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--neo-inset-sm)',
            gap: 'var(--spacing-075)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', minWidth: 0 }}>
            <div
              style={{
                width: isCompact ? '32px' : '38px',
                height: isCompact ? '32px' : '38px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-panel)',
                boxShadow: 'var(--neo-raised-sm)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-1)',
                flexShrink: 0,
              }}
            >
              <FileText size={isCompact ? 16 : 20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFile.name}
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                {'size' in selectedFile && typeof selectedFile.size === 'number'
                  ? formatFileSize(selectedFile.size)
                  : 'formattedSize' in selectedFile && selectedFile.formattedSize
                  ? selectedFile.formattedSize
                  : 'File loaded'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove selected file"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: 'var(--spacing-025)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        // Dropzone Area View
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={triggerBrowse}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerBrowse();
            }
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-disabled={disabled}
          style={{
            display: 'flex',
            flexDirection: isCompact ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: isCompact ? 'left' : 'center',
            gap: isCompact ? 'var(--spacing-075)' : 'var(--spacing-05)',
            padding: isCompact ? 'var(--spacing-075) var(--spacing-1)' : 'var(--spacing-15) var(--spacing-125)',
            background: isDragging ? 'var(--surface-tint-strong)' : 'var(--surface-faint)',
            border: isDragging
              ? '1.5px dashed var(--accent-1)'
              : displayError
              ? '1.5px dashed var(--error)'
              : '1.5px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: isDragging ? 'var(--shadow-glow)' : 'var(--neo-inset-sm)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'all var(--transition-fast)',
          }}
        >
          <div
            style={{
              width: isCompact ? '32px' : '44px',
              height: isCompact ? '32px' : '44px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--neo-raised-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDragging ? 'var(--accent-1)' : 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            {icon || <Upload size={isCompact ? 16 : 22} />}
          </div>

          <div>
            <div
              style={{
                fontSize: isCompact ? 'var(--font-xs)' : 'var(--font-sm)',
                fontWeight: 'var(--fw-semibold)',
                color: isDragging ? 'var(--accent-1)' : 'var(--text-primary)',
              }}
            >
              {label}
            </div>
            {sublabel && (
              <div
                style={{
                  fontSize: 'var(--font-2xs)',
                  color: 'var(--text-muted)',
                  marginTop: 'var(--spacing-02)',
                }}
              >
                {sublabel}
              </div>
            )}
          </div>
        </div>
      )}

      {displayError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-04)',
            marginTop: 'var(--spacing-04)',
            fontSize: 'var(--font-xs)',
            color: 'var(--error)',
          }}
        >
          <AlertTriangle size={14} />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
