import React from 'react';
import { playTactileClick } from './utils/haptics.js';

export interface TimelineSegmentedFilterProps<T extends string = string> {
  options: readonly T[] | T[];
  value: T;
  onChange: (value: T) => void;
  getLabel?: (option: T) => string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TimelineSegmentedFilter<T extends string = string>({
  options,
  value,
  onChange,
  getLabel,
  ariaLabel = 'Timeframe selector',
  className = '',
  style
}: TimelineSegmentedFilterProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = options.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextOption = options[nextIndex];
    playTactileClick();
    onChange(nextOption);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`timeline-segmented-filter ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-025)',
        background: 'var(--bg-secondary)',
        boxShadow: 'var(--neo-inset-sm)',
        padding: 'var(--spacing-025)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        ...style
      }}
    >
      {options.map((option, idx) => {
        const isSelected = option === value;
        const label = getLabel ? getLabel(option) : option;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={(e) => {
              e.stopPropagation();
              playTactileClick();
              onChange(option);
            }}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{
              padding: 'var(--spacing-025) var(--spacing-06)',
              fontSize: 'var(--font-xs)',
              background: isSelected ? 'var(--bg-panel)' : 'transparent',
              boxShadow: isSelected ? 'var(--neo-raised-sm)' : 'none',
              borderLeft: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
              borderRight: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
              borderBottom: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
              borderTop: isSelected ? 'var(--neo-bevel-top)' : '1px solid transparent',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              color: isSelected ? 'var(--accent-1)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: isSelected ? 'var(--fw-heavy)' : 'var(--fw-medium)',
              transition: 'all var(--transition-fast)',
              outline: 'none'
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
