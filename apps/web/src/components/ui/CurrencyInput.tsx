import React, { useState, useEffect, useRef } from 'react';
import { parseRupeeToNumber } from '../../utils/currency.js';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string | number;
  onChange: (e: { target: { value: string } }) => void;
  // Keep standard input styles
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

  // Format a raw number string into Indian numbering (e.g. 100000 -> 1,00,000)
  const formatValue = (val: string | number) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = typeof val === 'string' ? parseRupeeToNumber(val) : val;
    if (isNaN(num)) return '';
    
    // We don't want to force 2 decimals while typing, only format the integer part with commas
    const parts = val.toString().split('.');
    let integerPart = parts[0].replace(/[^0-9-]/g, '');
    const decimalPart = parts.length > 1 ? '.' + parts[1].replace(/[^0-9]/g, '') : '';

    if (!integerPart && !decimalPart) return '';
    if (integerPart === '-') return '-';

    // Indian comma formatting for integer part
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
       // If external value changed while focused (e.g. state reset), update display
       // But typically we don't want to clobber the user's active typing
       if (parseRupeeToNumber(value.toString()) === parseRupeeToNumber(displayValue)) {
         // They are the same numeric value, ignore
       } else {
         setDisplayValue(formatValue(value));
       }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    
    // Allow typing a trailing dot, minus sign, or empty string
    if (raw === '' || raw === '-' || raw.endsWith('.')) {
      setDisplayValue(raw);
      // Emit the numeric string
      onChange({ target: { value: raw === '-' || raw.endsWith('.') ? raw : '' } });
      return;
    }

    // Format for display
    const formatted = formatValue(raw);
    setDisplayValue(formatted);

    // Emit the raw unformatted string to parent
    const unformatted = raw.replace(/[^0-9.-]+/g, '');
    onChange({ target: { value: unformatted } });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // On blur, ensure it is fully formatted, and maybe padded with decimals if required
    // But to keep it simple, we just format whatever is there
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
        style={{ ...style, paddingRight: '2rem' }}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        {...props}
      />
      
      {/* Custom Spinners to mimic type="number" */}
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
