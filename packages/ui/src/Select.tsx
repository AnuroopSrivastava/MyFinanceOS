import React, { forwardRef, useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, label, error, helperText, fullWidth = true, size = 'md', className = '', style, children, onChange: propOnChange, ...props }, ref) => {
    const inputId = `select-${Math.random().toString(36).slice(2)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      propOnChange?.(value);
    };

    const sizeStyles = {
      sm: { padding: 'var(--spacing-04) var(--spacing-075)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-sm)', minHeight: '36px' },
      md: { padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-base)', borderRadius: 'var(--radius-sm)', minHeight: '44px' },
      lg: { padding: 'var(--spacing-06) var(--spacing-125)', fontSize: 'var(--font-lg)', borderRadius: 'var(--radius-md)', minHeight: '52px' },
    };

    const s = sizeStyles[size];

    return (
      <div style={{ width: fullWidth ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-025)' }}>
        {label && (
          <label htmlFor={inputId} style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-025)' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            id={inputId}
            className={`form-input ${className}`.trim()}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            onChange={handleNativeChange}
            style={{
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right var(--spacing-1) center',
              paddingRight: 'var(--spacing-3)',
              ...s,
              borderColor: error ? 'var(--error)' : 'var(--border-color)',
              boxShadow: error ? '0 0 0 1px var(--error)' : 'var(--neo-inset-sm)',
              ...style,
            }}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 'var(--spacing-3)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && (
          <div id={errorId} role="alert" style={{ fontSize: 'var(--font-xs)', color: 'var(--error)', marginTop: 'var(--spacing-025)' }}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={helperId} style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--spacing-025)' }}>
            {helperText}
          </div>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export interface MultiSelectProps extends Omit<SelectProps, 'options' | 'onChange'> {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  maxVisible?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  helperText,
  maxVisible = 3,
  fullWidth = true,
  size = 'md',
  className = '',
  style,
}) => {
  const inputId = `multiselect-${Math.random().toString(36).slice(2)}`;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeStyles = {
    sm: { padding: 'var(--spacing-04) var(--spacing-075)', fontSize: 'var(--font-sm)', minHeight: '36px' },
    md: { padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-base)', minHeight: '44px' },
    lg: { padding: 'var(--spacing-06) var(--spacing-125)', fontSize: 'var(--font-lg)', minHeight: '52px' },
  };

  const s = sizeStyles[size];

  const toggle = () => setIsOpen(!isOpen);
  const handleOptionClick = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const selectedLabels = options.filter(o => value.includes(o.value)).map(o => o.label);
  const displayText = selectedLabels.length > 0
    ? selectedLabels.slice(0, maxVisible).join(', ') + (selectedLabels.length > maxVisible ? ` +${selectedLabels.length - maxVisible} more` : '')
    : placeholder;

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-025)' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-025)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          type="button"
          id={inputId}
          onClick={toggle}
          className={`form-input ${className}`.trim()}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={error ? 'true' : 'false'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-1)',
            background: 'var(--bg-secondary)',
            border: `1px solid ${error ? 'var(--error)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-sm)',
            color: value.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: s.fontSize,
            padding: `${s.padding.split(' ')[0]} ${s.padding.split(' ')[1]}`,
            minHeight: s.minHeight,
            boxShadow: error ? '0 0 0 1px var(--error)' : 'var(--neo-inset-sm)',
            textAlign: 'left',
            width: '100%',
            ...style,
          }}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayText}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            role="listbox"
            aria-multiselectable="true"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 50,
              background: 'var(--bg-panel)',
              backgroundImage: 'var(--neo-convex-grad)',
              border: '1px solid var(--border-color)',
              borderTop: 'var(--neo-bevel-top)',
              borderBottom: 'var(--neo-bevel-bottom)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--neo-raised-lg)',
              maxHeight: '240px',
              overflowY: 'auto',
              padding: 'var(--spacing-04)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value.includes(opt.value)}
                disabled={opt.disabled}
                onClick={() => handleOptionClick(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-075)',
                  width: '100%',
                  padding: 'var(--spacing-05) var(--spacing-075)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: value.includes(opt.value) ? 'var(--accent-soft)' : 'transparent',
                  color: opt.disabled ? 'var(--text-muted)' : value.includes(opt.value) ? 'var(--accent-1)' : 'var(--text-primary)',
                  fontSize: 'var(--font-sm)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: value.includes(opt.value) ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                  textAlign: 'left',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  transition: 'background 0.1s',
                  boxShadow: 'var(--neo-inset-sm)',
                }}
                onMouseEnter={(e) => { if (!opt.disabled) e.currentTarget.style.background = 'var(--surface-tint)'; }}
                onMouseLeave={(e) => { if (!opt.disabled) e.currentTarget.style.background = value.includes(opt.value) ? 'var(--accent-soft)' : 'transparent'; }}
              >
                {opt.icon && <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{opt.icon}</span>}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                {value.includes(opt.value) && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-1)', flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
            {options.length === 0 && (
              <div style={{ padding: 'var(--spacing-1)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                No options available
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <div role="alert" style={{ fontSize: 'var(--font-xs)', color: 'var(--error)', marginTop: 'var(--spacing-025)' }}>
          {error}
        </div>
      )}
      {helperText && !error && (
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--spacing-025)' }}>
          {helperText}
        </div>
      )}
    </div>
  );
};

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackColor?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  shape?: 'circle' | 'rounded';
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  fallbackColor = 'var(--accent-1)',
  status,
  shape = 'circle',
  className = '',
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeStyles = {
    xs: { width: 24, height: 24, fontSize: 'var(--font-xs)', statusSize: 6 },
    sm: { width: 32, height: 32, fontSize: 'var(--font-sm)', statusSize: 8 },
    md: { width: 40, height: 40, fontSize: 'var(--font-base)', statusSize: 10 },
    lg: { width: 56, height: 56, fontSize: 'var(--font-lg)', statusSize: 12 },
    xl: { width: 80, height: 80, fontSize: 'var(--font-xl)', statusSize: 14 },
  };

  const s = sizeStyles[size];

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const initials = name ? getInitials(name) : '?';

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: s.width,
        height: s.height,
        ...style,
      }}
    >
      {!imageError && src ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
            background: fallbackColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: s.fontSize,
            fontWeight: 'var(--fw-bold)',
            fontFamily: 'var(--font-display)',
            boxShadow: 'var(--neo-raised-sm)',
            border: `1px solid var(--border-color)`,
            backgroundImage: 'var(--neo-convex-grad)',
          }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: s.statusSize,
            height: s.statusSize,
            borderRadius: '50%',
            border: '2px solid var(--bg-primary)',
            background: status === 'online' ? 'var(--success)' : status === 'busy' ? 'var(--error)' : status === 'away' ? 'var(--warning)' : 'var(--text-muted)',
            boxShadow: '0 0 0 2px var(--bg-primary)',
          }}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarProps['size'];
  spacing?: number;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'md',
  spacing = -8,
  className = '',
}) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((avatarProps, index) => (
        <Avatar
          key={`${avatarProps.name || avatarProps.src || index}`}
          {...avatarProps}
          size={size}
          style={{
            marginLeft: index === 0 ? 0 : spacing,
            zIndex: visible.length - index,
          }}
        />
      ))}
      {remaining > 0 && (
        <Avatar
          name={`+${remaining}`}
          size={size}
          fallbackColor="var(--text-muted)"
          style={{ marginLeft: spacing, zIndex: 0 }}
        />
      )}
    </div>
  );
};