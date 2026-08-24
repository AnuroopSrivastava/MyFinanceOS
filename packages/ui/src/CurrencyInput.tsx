import React, { useState, useEffect, useRef } from 'react';
import { parseRupeeToNumber } from '@financeos/shared';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string | number;
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  value, 
  onChange, 
  className = 'form-input', 
  style,
  ...props 
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatValue = (val: string | number) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = typeof val === 'string' ? parseRupeeToNumber(val) : val;
    if (isNaN(num)) return '';
    
    const parts = val.toString().split('.');
    let integerPart = parts[0].replace(/[^0-9-]/g, '');
    const decimalPart = parts.length > 1 ? '.' + parts[1].replace(/[^0-9]/g, '') : '';

    if (!integerPart && !decimalPart) return '';
    if (integerPart === '-') return '-';

    const intNum = parseInt(integerPart, 10);
    if (!isNaN(intNum)) {
      integerPart = new Intl.NumberFormat('en-IN').format(intNum);
    }

    return integerPart + decimalPart;
  };

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value));
    } else if (value.toString() !== parseRupeeToNumber(displayValue).toString()) {
      if (parseRupeeToNumber(value.toString()) !== parseRupeeToNumber(displayValue)) {
        setDisplayValue(formatValue(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    
    if (raw === '' || raw === '-' || raw.endsWith('.')) {
      setDisplayValue(raw);
      onChange({ target: { value: raw === '-' || raw.endsWith('.') ? raw : '' } });
      return;
    }

    const formatted = formatValue(raw);
    setDisplayValue(formatted);

    const unformatted = raw.replace(/[^0-9.-]+/g, '');
    onChange({ target: { value: unformatted } });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setDisplayValue(formatValue(displayValue));
    if (props.onBlur) props.onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleIncrement = () => {
    const current = parseRupeeToNumber(displayValue) || 0;
    const next = current + (props.step ? Number(props.step) : 1);
    onChange({ target: { value: next.toString() } });
    setDisplayValue(formatValue(next));
  };

  const handleDecrement = () => {
    const current = parseRupeeToNumber(displayValue) || 0;
    const next = current - (props.step ? Number(props.step) : 1);
    onChange({ target: { value: next.toString() } });
    setDisplayValue(formatValue(next));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        className={className}
        style={{
          fontFamily: 'var(--font-body)',
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: "'tnum' 1",
          paddingRight: '2rem',
          ...style
        }}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        {...props}
      />
      
      <div 
        style={{ 
          position: 'absolute', 
          right: '4px', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          opacity: 0.5
        }}
      >
        <button 
          type="button"
          tabIndex={-1}
          aria-label="Increment amount"
          onClick={handleIncrement}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', height: '50%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
          }}
        >
          <ChevronUp size={12} />
        </button>
        <button 
          type="button"
          tabIndex={-1}
          aria-label="Decrement amount"
          onClick={handleDecrement}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', height: '50%',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center'
          }}
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
};
