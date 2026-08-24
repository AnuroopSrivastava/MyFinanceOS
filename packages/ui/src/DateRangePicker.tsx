import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button.js';
import { Calendar, ChevronDown } from 'lucide-react';
import { playTactileClick } from './utils/haptics.js';

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
  label: string;
}

export interface DateRangePreset {
  label: string;
  getRange: () => DateRange;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  earliestDate?: Date;
  presets?: DateRangePreset[];
  allowCustom?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: 'This Week',
    getRange: () => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return { startDate: d.toISOString().split('T')[0], endDate: null, label: 'This Week' };
    }
  },
  {
    label: 'This Month',
    getRange: () => {
      const d = new Date();
      d.setDate(1);
      return { startDate: d.toISOString().split('T')[0], endDate: null, label: 'This Month' };
    }
  },
  {
    label: 'This Year',
    getRange: () => {
      const d = new Date(new Date().getFullYear(), 0, 1);
      return { startDate: d.toISOString().split('T')[0], endDate: null, label: 'This Year' };
    }
  },
  {
    label: 'Last Year',
    getRange: () => {
      const d = new Date(new Date().getFullYear() - 1, 0, 1);
      const e = new Date(new Date().getFullYear() - 1, 11, 31);
      return { startDate: d.toISOString().split('T')[0], endDate: e.toISOString().split('T')[0], label: 'Last Year' };
    }
  },
  {
    label: 'All Time',
    getRange: () => ({ startDate: null, endDate: null, label: 'All Time' })
  }
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  earliestDate,
  presets = DEFAULT_PRESETS,
  allowCustom = true,
  className = '',
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    playTactileClick();
    const range = preset.getRange();
    onChange(range);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    playTactileClick();
    const label = customStart ? `${customStart} to ${customEnd || 'Now'}` : 'Custom';
    onChange({
      startDate: customStart || null,
      endDate: customEnd || null,
      label
    });
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`date-range-picker-container ${className}`}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <Button
        variant="secondary"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Date filter: ${value.label}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.4rem 0.8rem',
          fontSize: '0.8rem',
          gap: '0.4rem',
          background: isOpen ? 'var(--bg-panel-hover)' : 'var(--bg-panel)',
          color: 'var(--text-primary)',
          fontWeight: 600,
          border: 'var(--glass-border)'
        }}
      >
        <Calendar size={14} />
        <span>{value.label}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Select Date Range"
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            zIndex: 1000,
            minWidth: '220px',
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-md)',
            border: 'var(--glass-border)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {presets.map((preset) => {
            const range = preset.getRange();
            let isDisabled = false;
            if (earliestDate && range.endDate) {
              const end = new Date(range.endDate);
              if (end < earliestDate) isDisabled = true;
            }

            const isSelected = value.label === preset.label;

            return (
              <Button
                key={preset.label}
                variant="secondary"
                disabled={isDisabled}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  justifyContent: 'flex-start',
                  border: 'none',
                  background: isSelected ? 'var(--bg-panel-hover)' : 'transparent',
                  color: isSelected ? 'var(--accent-1)' : 'var(--text-primary)',
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {preset.label} {isDisabled && <span style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>(No data)</span>}
              </Button>
            );
          })}

          {allowCustom && (
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0 0', paddingTop: '0.5rem' }}>
              <div style={{ padding: '0 0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Custom Range
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0 0.5rem' }}>
                <input
                  type="date"
                  aria-label="Custom Start Date"
                  className="form-input"
                  style={{ fontSize: '0.75rem', padding: '0.2rem', width: '110px' }}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="date"
                  aria-label="Custom End Date"
                  className="form-input"
                  style={{ fontSize: '0.75rem', padding: '0.2rem', width: '110px' }}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleApplyCustom}
                style={{ width: 'calc(100% - 1rem)', margin: '0.5rem auto 0', padding: '0.3rem', fontSize: '0.8rem' }}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
